import {describe,it,expect} from "vitest";
import {verifyRepair,type SandboxFactory} from "../src/lib/repair/runner";
import {contentHash,type RepairPlan} from "../src/lib/repair/plan";
import {validateSnapshot,sandboxCommands} from "../src/lib/repair/sandbox";
const manifest=JSON.stringify({dependencies:{lodash:"4.17.20"},scripts:{test:"node test.js"}});
const after=JSON.stringify({dependencies:{lodash:"4.17.21"},scripts:{test:"node test.js"}});
const unsigned={schemaVersion:1 as const,baseCommit:"a".repeat(40),packageName:"lodash",fromVersion:"4.17.20",toVersion:"4.17.21",section:"dependencies" as const,advisoryIds:["GHSA-test"],sourceUrls:["https://osv.dev/vulnerability/GHSA-test"],manifestBefore:manifest,manifestAfter:after,manifestHash:contentHash(manifest),limitations:[]};
const plan:RepairPlan={...unsigned,planHash:contentHash(JSON.stringify(unsigned))};
const files={"package.json":manifest,"package-lock.json":JSON.stringify({lockfileVersion:3,packages:{"":{dependencies:{lodash:"4.17.20"}},"node_modules/lodash":{version:"4.17.20"}}}),"test.js":"console.log('test')"};
const clean=(async(url,init)=>new Response(JSON.stringify(String(url).includes("/vulns/")?{id:"GHSA-test",summary:"Fixture advisory"}:{results:JSON.parse(String(init?.body)).queries.map((q:{version:string})=>q.version==="4.17.20"?{vulns:[{id:"GHSA-test"}]}:{})}))) as typeof fetch;
function fixture(opts:{testFail?:boolean;cleanupFail?:boolean;wrongLock?:boolean}={}){
 const events:string[]=[];
 const factory:SandboxFactory=async phase=>({
  async writeFiles(){events.push(phase+":write");},async network(p){events.push(phase+":"+p);},
  async run(command){events.push(phase+":"+command);return {command,exitCode:opts.testFail&&command==="test"?1:0,output:"bounded output"};},
  async readFile(){return JSON.stringify({lockfileVersion:3,packages:{"":{dependencies:{lodash:"4.17.21"}},"node_modules/lodash":{version:opts.wrongLock?"4.17.20":"4.17.21"}}});},
  async stop(){events.push(phase+":stop");if(opts.cleanupFail)throw Error("cleanup");}
 });return {factory,events};
}
describe("isolated repair verification",()=>{
 it("denies network before tests and cleans both runs",async()=>{const f=fixture();const r=await verifyRepair(plan,files,f.factory,clean);expect(r.status).toBe("passed");expect(r.scans?.before.findings).toHaveLength(1);expect(r.scans?.after?.findings).toHaveLength(0);expect(r.scans?.before.dependencyCount).toBe(1);for(const p of ["baseline","patched"]){expect(f.events.indexOf(p+":deny-all")).toBeLessThan(f.events.indexOf(p+":test"));expect(f.events).toContain(p+":stop");}});
 it("refuses stale advisory evidence before starting paid sandboxes",async()=>{
  const f=fixture();const noFindings=(async()=>new Response(JSON.stringify({results:[{}]}))) as typeof fetch;
  await expect(verifyRepair(plan,files,f.factory,noFindings)).rejects.toThrow("no longer confirms");expect(f.events).toEqual([]);
 });
 it("rejects a tampered plan before any sandbox",async()=>{const f=fixture();await expect(verifyRepair({...plan,toVersion:"9.0.0"},files,f.factory,clean)).rejects.toThrow("changed");expect(f.events).toEqual([]);});
 it("fails tests without skipping cleanup",async()=>{const f=fixture({testFail:true});const r=await verifyRepair(plan,files,f.factory,clean);expect(r.status).toBe("failed");expect(f.events).toContain("baseline:stop");expect(f.events).toContain("patched:stop");});
 it("fails if cleanup fails",async()=>{const f=fixture({cleanupFail:true});expect((await verifyRepair(plan,files,f.factory,clean)).cleanupComplete).toBe(false);});
 it("rejects a lockfile that did not apply the patch",async()=>{const f=fixture({wrongLock:true});const r=await verifyRepair(plan,files,f.factory,clean);expect(r.status).toBe("failed");expect(r.errors.join()).toContain("does not resolve");});
 it("rejects unsafe snapshot paths and credentials",()=>{for(const path of ["../outside",".env.local",".npmrc","node_modules/pkg/a.js",".git/config"]){expect(()=>validateSnapshot({[path]:"x"})).toThrow();}expect(()=>validateSnapshot({"src/test.js":"ok"})).not.toThrow();expect(sandboxCommands.install).toContain("--ignore-scripts");});
});
