import { createHash } from "node:crypto";
import { valid, validRange, satisfies, gt, compare } from "semver";
import { z } from "zod";
import { boundedJson } from "../providers";

const advisorySchema = z.object({
  id:z.string().regex(/^[A-Za-z0-9._-]+$/), withdrawn:z.string().optional(),
  affected:z.array(z.object({package:z.object({name:z.string(),ecosystem:z.string()}),
    ranges:z.array(z.object({type:z.string(),events:z.array(z.object({fixed:z.string().optional()}))})).optional()})),
});
export type RepairPlan = {
  schemaVersion:1; baseCommit:string; packageName:string; fromVersion:string; toVersion:string;
  section:"dependencies"|"devDependencies"; advisoryIds:string[]; sourceUrls:string[];
  manifestBefore:string; manifestAfter:string; manifestHash:string; planHash:string;
  limitations:string[];
};
export function contentHash(value:string){return createHash("sha256").update(value).digest("hex");}
const packagePattern=/^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/;
export async function proposeDependencyRepair(input:{baseCommit:string;manifest:string;packageName:string;currentVersion:string;advisoryIds:string[]},fetcher:typeof fetch=fetch):Promise<RepairPlan>{
  if(!/^[a-f0-9]{40}$/.test(input.baseCommit))throw Error("A pinned Git commit is required.");
  if(Buffer.byteLength(input.manifest)>200000)throw Error("Manifest exceeds repair limit.");
  if(!packagePattern.test(input.packageName)||!valid(input.currentVersion))throw Error("Exact npm dependency required.");
  if(!input.advisoryIds.length||input.advisoryIds.length>12||input.advisoryIds.some(id=>!/^[A-Za-z0-9._-]+$/.test(id)))throw Error("Bounded advisory evidence required.");
  const manifest=JSON.parse(input.manifest);
  const sections=(["dependencies","devDependencies"] as const).filter(s=>Object.hasOwn(manifest[s]||{},input.packageName));
  if(sections.length!==1)throw Error("Repair requires one unambiguous direct dependency.");
  const section=sections[0];
  // The lockfile supplies the actual installed version; the manifest must permit it.
  // Aliases, URLs, workspaces and tags need their own resolution/provenance checks.
  const declared=manifest[section][input.packageName];
  if(typeof declared!=="string"||!declared.trim()||!validRange(declared)||!satisfies(input.currentVersion,declared))throw Error("Locked dependency does not match a supported manifest range.");
  const candidates=new Set<string>();
  for(const id of input.advisoryIds){
    const a=advisorySchema.parse(await boundedJson(`https://api.osv.dev/v1/vulns/${encodeURIComponent(id)}`,{},fetcher));
    if(a.id!==id||a.withdrawn)throw Error("Advisory unavailable or withdrawn.");
    const matching=a.affected.filter(p=>p.package.ecosystem==="npm"&&p.package.name===input.packageName);
    if(!matching.length)throw Error("Advisory does not match this dependency.");
    for(const p of matching)for(const r of p.ranges||[])if(r.type==="SEMVER")for(const e of r.events)if(e.fixed&&valid(e.fixed)&&gt(e.fixed,input.currentVersion))candidates.add(e.fixed);
  }
  // Query both exact versions; a fixed event alone is not proof that other advisories are cleared.
  const query=async(version:string)=>{
    const result=z.object({vulns:z.array(z.object({id:z.string()})).optional(),next_page_token:z.string().optional()}).parse(await boundedJson("https://api.osv.dev/v1/query",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({package:{name:input.packageName,ecosystem:"npm"},version})},fetcher));
    if(result.next_page_token)throw Error("OSV returned incomplete repair evidence.");
    return (result.vulns||[]).map(v=>v.id);
  };
  const before=await query(input.currentVersion);
  if(input.advisoryIds.some(id=>!before.includes(id)))throw Error("Selected advisory does not affect the pinned version.");
  let target:string|undefined;
  for(const version of [...candidates].sort(compare).slice(0,5)){
    const after=await query(version);
    if(after.length===0){target=version;break;}
  }
  if(!target)throw Error("No verified advisory-free candidate within the repair budget.");
  manifest[section][input.packageName]=target;
  const manifestAfter=JSON.stringify(manifest,null,2)+"\n";
  const data={schemaVersion:1 as const,baseCommit:input.baseCommit,packageName:input.packageName,fromVersion:input.currentVersion,toVersion:target,section,advisoryIds:[...new Set(input.advisoryIds)].sort(),sourceUrls:[...new Set(input.advisoryIds)].sort().map(id=>`https://osv.dev/vulnerability/${id}`),manifestBefore:input.manifest,manifestAfter,manifestHash:contentHash(input.manifest),limitations:["OSV evidence is a point-in-time lookup, not a security guarantee.","Lockfile regeneration and isolated baseline/patched tests are required before approval.","Major-version changes may require application changes; test failures block handoff."]};
  return {...data,planHash:contentHash(JSON.stringify(data))};
}
