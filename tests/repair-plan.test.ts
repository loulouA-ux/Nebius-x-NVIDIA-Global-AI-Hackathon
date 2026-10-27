import {describe,it,expect} from "vitest";
import {proposeDependencyRepair} from "../src/lib/repair/plan";
const input={baseCommit:"a".repeat(40),manifest:JSON.stringify({dependencies:{lodash:"4.17.20"}}),packageName:"lodash",currentVersion:"4.17.20",advisoryIds:["GHSA-test"]};
function provider(options:{mismatch?:boolean;stillAffected?:boolean;notAffected?:boolean}={}){
 return (async(url,init)=>{
  const data=String(url).includes("/vulns/")?{id:"GHSA-test",affected:[{package:{name:options.mismatch?"other":"lodash",ecosystem:"npm"},ranges:[{type:"SEMVER",events:[{fixed:"4.17.21"}]}]}]}:
   {vulns:(JSON.parse(String(init?.body)).version==="4.17.20"?!options.notAffected:options.stillAffected)?[{id:"GHSA-test"}]:[]};
  return new Response(JSON.stringify(data));
 }) as typeof fetch;
}
describe("evidence-backed dependency repair",()=>{
 it("binds a precise patch to a commit and confirmed before/after advisory checks",async()=>{
  const p=await proposeDependencyRepair(input,provider());
  expect(p.toVersion).toBe("4.17.21");expect(JSON.parse(p.manifestAfter).dependencies.lodash).toBe("4.17.21");
  expect(p.sourceUrls).toEqual(["https://osv.dev/vulnerability/GHSA-test"]);expect(p.planHash).toHaveLength(64);
 });
 it("rejects labels from a different package",async()=>{await expect(proposeDependencyRepair(input,provider({mismatch:true}))).rejects.toThrow("does not match");});
 it("does not call a still affected candidate repaired",async()=>{await expect(proposeDependencyRepair(input,provider({stillAffected:true}))).rejects.toThrow("No verified");});
 it("rejects an advisory not affecting the original version",async()=>{await expect(proposeDependencyRepair(input,provider({notAffected:true}))).rejects.toThrow("does not affect");});
 it("rejects an unpinned source",async()=>{
  await expect(proposeDependencyRepair({...input,baseCommit:"main"},provider())).rejects.toThrow("pinned");

 });
 it.each(["^4.17.0", "~4.17.20", ">=4.0.0 <5", "*"])("repairs a locked version satisfying %s and pins the reviewed target",async(range)=>{
  const p=await proposeDependencyRepair({...input,manifest:JSON.stringify({dependencies:{lodash:range}})},provider());
  expect(p.fromVersion).toBe("4.17.20");
  expect(JSON.parse(p.manifestBefore).dependencies.lodash).toBe(range);
  expect(JSON.parse(p.manifestAfter).dependencies.lodash).toBe("4.17.21");
 });
 it.each(["^3.0.0", "npm:other@4.17.20", "workspace:*", "file:../lodash", "https://example.com/pkg.tgz", "latest", ""])("rejects mismatched or unsupported resolution %s before provider calls",async(range)=>{
  let calls=0;
  const fetcher=(async()=>{calls++;throw Error("Unexpected provider call");}) as typeof fetch;
  await expect(proposeDependencyRepair({...input,manifest:JSON.stringify({dependencies:{lodash:range}})},fetcher)).rejects.toThrow("manifest range");
  expect(calls).toBe(0);
 });
});
