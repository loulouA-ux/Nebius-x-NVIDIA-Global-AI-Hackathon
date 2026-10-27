// Synthetic fixture only. No repository source or credentials enter the VM.
import {mkdir,writeFile} from "node:fs/promises";
import {boundedJson,queryOsv} from "../src/lib/providers";
import {proposeDependencyRepair} from "../src/lib/repair/plan";
import {verifyRepair} from "../src/lib/repair/runner";
import {vercelSandboxFactory} from "../src/lib/repair/sandbox";
async function main(){
 if(process.env.SHIPCHECK_REPAIR_SANDBOX_ENABLED!=="true")throw Error("Cloud smoke requires explicit enablement after budget approval.");
 const name="minimist",version="1.2.5";
 const registry=await boundedJson(`https://registry.npmjs.org/${name}/${version}`) as {dist:{tarball:string;integrity:string}};
 if(!registry.dist.tarball.startsWith("https://registry.npmjs.org/")||!registry.dist.integrity)throw Error("Unexpected registry metadata.");
 const manifest=JSON.stringify({name:"shipcheck-synthetic-repair",version:"1.0.0",private:true,scripts:{test:"node test.cjs"},dependencies:{[name]:version}},null,2)+"\n";
 const lock=JSON.stringify({name:"shipcheck-synthetic-repair",version:"1.0.0",lockfileVersion:3,requires:true,packages:{"":{name:"shipcheck-synthetic-repair",version:"1.0.0",dependencies:{[name]:version}},[`node_modules/${name}`]:{version,resolved:registry.dist.tarball,integrity:registry.dist.integrity}}},null,2);
 const findings=await queryOsv([{name,version,ecosystem:"npm",path:`node_modules/${name}`}]);
 const ids=findings.map(f=>f.id.split(":")[0]);
 console.log(JSON.stringify({phase:"advisories",count:ids.length,package:name,version}));
 const plan=await proposeDependencyRepair({baseCommit:"0".repeat(40),manifest,packageName:name,currentVersion:version,advisoryIds:ids});
 const files={"package.json":manifest,"package-lock.json":lock,"test.cjs":"const assert=require('node:assert/strict');const parse=require('minimist');assert.equal(parse(['--name','demo']).name,'demo');assert.equal(parse(['--count','3']).count,3);console.log('2 assertions passed');\n"};
 const factory=vercelSandboxFactory();
 const result=await verifyRepair(plan,files,async phase=>{console.log(JSON.stringify({phase,event:"sandbox-start"}));return factory(phase);});
 await mkdir("test-results",{recursive:true});await writeFile("test-results/repair-cloud-smoke.json",JSON.stringify({synthetic:true,createdAt:new Date().toISOString(),plan,result},null,2));
 console.log(JSON.stringify({status:result.status,cleanupComplete:result.cleanupComplete,from:plan.fromVersion,to:plan.toVersion,baseline:result.baseline.map(c=>({command:c.command,exitCode:c.exitCode})),patched:result.patched.map(c=>({command:c.command,exitCode:c.exitCode})),errors:result.errors}));
 if(result.status!=="passed")process.exitCode=1;
}
main().catch(()=>{console.error("Cloud repair smoke failed; no provider credentials or raw response logged.");process.exitCode=1;});
