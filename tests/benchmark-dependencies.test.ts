import {expect,it} from "vitest";
import {parseManifest} from "../src/lib/parser";
import {parseBenchmarkManifest,queryBenchmarkDependencies} from "../src/lib/benchmark-dependencies";
const lock=JSON.stringify({lockfileVersion:3,packages:Object.fromEntries(Array.from({length:75},(_,i)=>[`node_modules/p${i}`,{version:"1.0.0"}]))});
it("expands admin coverage without changing public parser defaults",()=>{
 expect(()=>parseManifest("package-lock.json",lock)).toThrow(/50/);
 expect(parseBenchmarkManifest("package-lock.json",lock).dependencies).toHaveLength(75);
});
it("retains successful batches when one provider request fails",async()=>{
 const deps=parseBenchmarkManifest("package-lock.json",lock).dependencies;
 let calls=0;
 const r=await queryBenchmarkDependencies(deps,async d=>{calls++;expect(d.length).toBeLessThanOrEqual(10);if(calls===2)throw Error("offline");return [];});
 expect(calls).toBe(8);expect(r.queried).toBe(65);expect(r.failures).toEqual([{offset:10,count:10,reason:"OSV request failed or returned incomplete results"}]);
});
it("subdivides advisory cap failures rather than discarding a whole batch",async()=>{
 const deps=parseBenchmarkManifest("package-lock.json",lock).dependencies.slice(0,10);
 const r=await queryBenchmarkDependencies(deps,async d=>{if(d.length>1)throw Error("OSV advisory budget exceeded; narrow the manifest.");return [];});
 expect(r.queried).toBe(10);expect(r.failures).toHaveLength(0);
});
it("enforces byte and administrator ceilings",()=>{
 expect(()=>parseManifest("requirements.txt","é".repeat(110000))).toThrow(/byte/);
 expect(()=>parseManifest("requirements.txt","a==1",{maxBytes:6000000,maxDependencies:1})).toThrow(/limits/);
});
