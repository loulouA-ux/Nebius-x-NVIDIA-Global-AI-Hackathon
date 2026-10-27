import {Sandbox} from "@vercel/sandbox";
import {execFile} from "node:child_process";
import {promisify} from "node:util";
import {mkdir,writeFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {validateSnapshot} from "../src/lib/repair/sandbox";
import {maskSecrets} from "../src/lib/scanner";
import {parseBenchmarkManifest,queryBenchmarkDependencies} from "../src/lib/benchmark-dependencies";
const exec=promisify(execFile);
const repository="heysalad-ai/bulk-invoice-contract-review-agent",commit="49902c2b8ab0b6b49b78ad2936d7211d73b182c6",tree="fa4bd6a4db2b6b52032fed5af7e09c7face752ca";
async function api(path:string){return JSON.parse((await exec("gh",["api",path],{maxBuffer:5000000,timeout:30000})).stdout);}
async function main(){
 if(process.env.SHIPCHECK_BENCHMARK_CLOUD!=="true")throw Error("Enable cloud explicitly");
 const entries=(await api(`repos/${repository}/git/trees/${tree}?recursive=1`)).tree;
 const files:Record<string,string>={};
 for(const entry of entries){
  if(entry.type!=="blob"||!(entry.path.startsWith("src/")||entry.path.startsWith("test/")||["package.json","package-lock.json","vitest.config.ts","tsconfig.json","wrangler.jsonc","config/agent-definition.json"].includes(entry.path)))continue;
  if(!["100644","100755"].includes(entry.mode)||entry.size>200000)throw Error("Unsafe source entry");
  const blob=await api(`repos/${repository}/git/blobs/${entry.sha}`),bytes=Buffer.from(blob.content,"base64");
  if(createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex")!==entry.sha)throw Error("Integrity mismatch");
  const content=bytes.toString("utf8");if(maskSecrets(content)!==content)throw Error("Potential credential in source");files[entry.path]=content;
 }
 validateSnapshot(files);
 const directory=`test-results/repair-pilot-${new Date().toISOString().replace(/[:.]/g,"-")}`;
 await mkdir(directory,{recursive:true,mode:0o700});
 const ledger:any={repository,commit,change:"Pin direct vitest dependency to 4.1.12; regenerate lockfile without lifecycle scripts",reservationGbp:1,maxSandboxes:2,timeoutEachMs:600000,steps:[],cleanup:[],verified:false};
 const save=()=>writeFile(`${directory}/ledger.json`,JSON.stringify(ledger,null,2),{mode:0o600});await save();
 for(const phase of ["baseline","patched"]){
  let sandbox:Sandbox|undefined;
  try{
   sandbox=await Sandbox.create({name:`shipcheck-fix-${phase}-${Date.now()}`,persistent:false,timeout:600000,resources:{vcpus:1},ports:[],networkPolicy:"deny-all"});
   const cwd=`${sandbox.cwd}/project`;await sandbox.mkDir(cwd);
   const input={...files};
   if(phase==="patched"){const pkg=JSON.parse(input['package.json']);pkg.devDependencies.vitest="4.1.12";input['package.json']=JSON.stringify(pkg,null,2)+"\n";}
   await sandbox.writeFiles(Object.entries(input).map(([path,content])=>({path:`${cwd}/${path}`,content:Buffer.from(content)})));
   async function command(args:string[]){
    const c=await sandbox!.runCommand({cmd:"npm",args,cwd,env:{CI:"true",npm_config_ignore_scripts:"true",npm_config_registry:"https://registry.npmjs.org",npm_config_userconfig:"/dev/null"},detached:true});
    let output="";for await(const log of c.logs()){output+=log.data;if(output.length>64000){await c.kill();throw Error("Output limit");}}
    const result=await c.wait();ledger.steps.push({phase,args,exitCode:result.exitCode,output:maskSecrets(output)});await save();return result.exitCode;
   }
   await sandbox.update({networkPolicy:{allow:["registry.npmjs.org"]}});
   if(phase==="patched"&&await command(["install","--package-lock-only","--ignore-scripts","--no-audit","--no-fund"])!==0)throw Error("Lockfile generation failed");
   if(await command(["ci","--ignore-scripts","--no-audit","--no-fund"])!==0)throw Error("Install failed");
   await sandbox.update({networkPolicy:"deny-all"});
   await command(["run","typecheck","--ignore-scripts"]);
   await command(["run","test","--ignore-scripts"]);
   for(const name of ["package.json","package-lock.json"]){const data=await sandbox.readFileToBuffer({path:name,cwd});if(!data||data.length>5000000)throw Error("Missing manifest");await writeFile(`${directory}/${phase}-${name}`,data,{mode:0o600});}
   if(phase==="patched"){
    const data=await sandbox.readFileToBuffer({path:"package-lock.json",cwd});
    const parsed=parseBenchmarkManifest("package-lock.json",data!.toString("utf8"));
    const selected=parsed.dependencies.filter(d=>d.name==="@vitest/mocker");
    ledger.patchedMockerVersions=selected.map(d=>d.version);
    ledger.postRepairLookup=await queryBenchmarkDependencies(selected);
    ledger.verified=selected.length>0&&selected.every(d=>d.version==="4.1.12")&&ledger.postRepairLookup.failures.length===0&&ledger.postRepairLookup.findings.length===0&&ledger.steps.every((s:any)=>s.exitCode===0);
   }
  }catch{ledger.error=`${phase} failed; no verified fix claimed`;await save();throw Error("Repair failed");}
  finally{if(sandbox){try{await sandbox.delete({deleteOrphanSnapshots:true});ledger.cleanup.push({phase,deleted:true});}catch{ledger.cleanup.push({phase,deleted:false});ledger.verified=false;}await save();}}
 }
 ledger.finishedAt=new Date().toISOString();await save();console.log(JSON.stringify({directory,verified:ledger.verified,steps:ledger.steps.map((s:any)=>({phase:s.phase,args:s.args,exitCode:s.exitCode})),cleanup:ledger.cleanup}));
}
main().catch(()=>{console.error("Repair pilot stopped; private ledger saved. No repository changes published.");process.exitCode=1;});
