import {Sandbox} from "@vercel/sandbox";
import {execFile} from "node:child_process";
import {promisify} from "node:util";
import {mkdir,readFile,writeFile} from "node:fs/promises";
import {createHash} from "node:crypto";
const exec=promisify(execFile),sha=(b:Buffer)=>createHash("sha256").update(b).digest("hex");
async function main(){
 if(process.env.SHIPCHECK_BENCHMARK_CLOUD!=="true")throw Error("Explicit cloud enablement required");
 const prior=JSON.parse(await readFile("test-results/manifest-rescan-2026-10-26T17-56-56-323Z/12.json","utf8"));
 if(prior.repository!=="heysalad-ai/bulk-invoice-contract-review-agent"||prior.path!=="package-lock.json")throw Error("Unexpected pilot input");
 const blob=JSON.parse((await exec("gh",["api",`repos/${prior.repository}/git/blobs/${prior.blob}`],{maxBuffer:9_000_000})).stdout);
 const input=Buffer.from(blob.content,"base64");
 if(input.length>5000000||createHash("sha1").update(`blob ${input.length}\0`).update(input).digest("hex")!==prior.blob)throw Error("Input integrity mismatch");
 const archive=await readFile(".private/trivy_0.76.1_Linux-64bit.tar.gz");
 const sums=await readFile(".private/trivy_0.76.1_checksums.txt","utf8");
 const expected=sums.split("\n").find(l=>l.endsWith("trivy_0.76.1_Linux-64bit.tar.gz"))?.split(/\s+/)[0];
 if(!expected||sha(archive)!==expected)throw Error("Scanner checksum mismatch");
 const worker=await readFile(".private/benchmark-worker.cjs");
 const dir=`test-results/cloud-comparison-${new Date().toISOString().replace(/[:.]/g,"-")}`;
 await mkdir(dir,{recursive:true,mode:0o700});
 const ledger:any={repository:prior.repository,commit:prior.commit,blob:prior.blob,inputSha256:sha(input),scannerVersion:"Trivy 0.76.1",scannerArchiveSha256:expected,workerSha256:sha(worker),budgetGbp:15,reservationGbp:1,maxSandboxes:2,timeoutMsEach:600000,runs:[],sandboxes:[],cleanup:[],limitations:["Dependency-only pilot; no accuracy ground truth","Trivy database snapshot and live OSV can differ","No repository scripts run; no patches applied"]};
 const save=()=>writeFile(`${dir}/ledger.json`,JSON.stringify(ledger,null,2),{mode:0o600});
 await save();
 for(const arm of ["trivy","shipcheck"]){
  let sandbox:Sandbox|undefined;
  try{
   sandbox=await Sandbox.create({name:`shipcheck-benchmark-${arm}-${Date.now()}`,persistent:false,timeout:600000,resources:{vcpus:1},ports:[],networkPolicy:"deny-all"});
   ledger.sandboxes.push({arm,name:sandbox.name});await save();
   const cwd=sandbox.cwd;
   async function command(cmd:string,args:string[]){const c=await sandbox!.runCommand({cmd,args,cwd,env:{CI:"true"}});if(c.exitCode!==0)throw Error(`${arm} command failed`);}
   await sandbox.mkDir(`${cwd}/input`);
   if(arm==="trivy"){
    await sandbox.writeFiles([{path:`${cwd}/trivy.tar.gz`,content:archive}]);
    await command("tar",["-xzf","trivy.tar.gz","trivy"]);
    // Tool database only; private input is uploaded after network setup completes.
    await sandbox.update({networkPolicy:{allow:["mirror.gcr.io","ghcr.io","pkg-containers.githubusercontent.com"]}});
    await command("./trivy",["image","--download-db-only","--cache-dir","cache","--no-progress"]);
    await sandbox.update({networkPolicy:"deny-all"});
    const metadata=await sandbox.readFileToBuffer({path:"cache/db/metadata.json",cwd});
    if(metadata)await writeFile(`${dir}/trivy-db-metadata.json`,metadata,{mode:0o600});
   }else{
    await sandbox.writeFiles([{path:`${cwd}/worker.cjs`,content:worker}]);
    await sandbox.update({networkPolicy:{allow:["api.osv.dev"]}});
   }
   await sandbox.writeFiles([{path:`${cwd}/input/package-lock.json`,content:input}]);
   for(let repetition=1;repetition<=3;repetition++){
    const start=Date.now();
    if(arm==="trivy")await command("./trivy",["fs","--scanners","vuln","--include-dev-deps","--list-all-pkgs","--skip-db-update","--offline-scan","--cache-dir","cache","--format","json","--output","result.json","input"]);
    else await command("node",["worker.cjs"]);
    const data=await sandbox.readFileToBuffer({path:"result.json",cwd});if(!data||data.length>10000000)throw Error("Missing or oversized result");
    await writeFile(`${dir}/${arm}-${repetition}.json`,data,{mode:0o600});
    const parsed=JSON.parse(data.toString("utf8"));
    if(arm==="trivy"&&!parsed.Results?.some((r:{Packages?:unknown[]})=>r.Packages?.length))throw Error("Trivy did not inventory packages");
    ledger.runs.push({arm,repetition,durationMs:Date.now()-start,resultSha256:sha(data)});await save();console.log(JSON.stringify({arm,repetition,event:"recorded"}));
   }
  }catch{ledger.error=`${arm} failed; inspect bounded evidence. Not a clean result.`;await save();throw Error("Pilot failed");}
  finally{if(sandbox){try{await sandbox.delete({deleteOrphanSnapshots:true});ledger.cleanup.push({arm,deleted:true});}catch{ledger.cleanup.push({arm,deleted:false});}await save();}}
 }
 ledger.finishedAt=new Date().toISOString();await save();console.log(JSON.stringify({directory:dir,runs:ledger.runs.length,cleanup:ledger.cleanup}));
}
main().catch(()=>{console.error("Cloud comparison stopped; private ledger retains status. No raw provider error logged.");process.exitCode=1;});
