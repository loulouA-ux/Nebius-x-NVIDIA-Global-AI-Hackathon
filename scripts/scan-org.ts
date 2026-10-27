// Read-only, manifest-only inventory scan. Never installs or executes repository code.
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { parseManifest } from "../src/lib/parser";
import { queryOsv } from "../src/lib/providers";
const exec=promisify(execFile);
async function api(path:string){const {stdout}=await exec("gh",["api",path],{maxBuffer:20_000_000,timeout:45000});return JSON.parse(stdout);}
async function main(){
 const startedAt=new Date().toISOString();
 const output=`test-results/org-scan-${startedAt.replace(/[:.]/g,"-")}`;
 await mkdir(output,{recursive:true,mode:0o700});
 const repos=[];
 for(let page=1;page<=10;page++){
  const batch=await api(`orgs/heysalad-ai/repos?per_page=100&sort=pushed&direction=desc&page=${page}`);
  repos.push(...batch);if(batch.length<100)break;
 }
 const selected=repos.filter(r=>!r.archived).slice(0,200);
 await writeFile(`${output}/inventory.json`,JSON.stringify(selected.map(r=>({repository:r.full_name,branch:r.default_branch,private:r.private,fork:r.fork,pushedAt:r.pushed_at})),null,2),{mode:0o600});
 console.log(JSON.stringify({event:"started",inventoried:repos.length,selected:selected.length,output}));
 const records:Record<string,unknown>[]=[];let cursor=0;
 async function worker(){while(cursor<selected.length){
  const repo=selected[cursor++];
  const record:Record<string,unknown>={repository:repo.full_name,startedAt:new Date().toISOString(),status:"inventory-failed",scope:"Supported manifests only; no code, history, runtime or exploitability assessment"};
  try{
   const commit=await api(`repos/${repo.full_name}/commits/${encodeURIComponent(repo.default_branch)}`);
   record.commit=commit.sha;
   const tree=await api(`repos/${repo.full_name}/git/trees/${commit.commit.tree.sha}?recursive=1`);
   record.treeTruncated=tree.truncated;
   const manifests=tree.tree.filter((f:{type:string;path:string;mode:string})=>f.type==="blob"&&["100644","100755"].includes(f.mode)&&!f.path.split("/").some(p=>["node_modules","vendor",".git"].includes(p))&&/\/(?:package-lock\.json|package\.json|requirements\.txt)$/.test("/"+f.path));
   record.manifestsFound=manifests.length;record.manifestsOmitted=Math.max(0,manifests.length-12);
   const results=[];
   for(const f of manifests.slice(0,12)){
    const result:Record<string,unknown>={path:f.path,blob:f.sha,status:"incomplete"};
    try{
     if(f.size>200000)throw Error("size");
     const blob=await api(`repos/${repo.full_name}/git/blobs/${f.sha}`);
     if(blob.encoding!=="base64")throw Error("encoding");
     const bytes=Buffer.from(blob.content,"base64");
     if(bytes.length>200000||createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex")!==f.sha)throw Error("integrity");
     const parsed=parseManifest(f.path.split("/").at(-1),bytes.toString("utf8"));
     result.dependencies=parsed.dependencies.length;result.warnings=parsed.warnings;
     if(!parsed.dependencies.length){result.reason="No supported exact versions";}else{
      const findings=await queryOsv(parsed.dependencies);
      result.status=parsed.warnings.length?"partial":"queried";
      result.findings=findings.map(f=>({id:f.id,severity:f.severity,dependencies:f.evidence.flatMap(e=>e.dependency?[e.dependency]:[]),urls:f.evidence.flatMap(e=>e.url?[e.url]:[])}));
     }
    }catch{result.reason="Manifest unsupported/over limits, integrity failure, or OSV lookup incomplete. Not a clean result.";}
    results.push(result);
   }
   record.results=results;record.status=manifests.length?"processed-with-limited-coverage":"no-supported-manifests";
  }catch{record.reason="Repository empty, inaccessible, oversized tree or GitHub request failed";}
  record.finishedAt=new Date().toISOString();records.push(record);
  await writeFile(`${output}/${repo.name}.json`,JSON.stringify(record,null,2),{mode:0o600});
  console.log(JSON.stringify({event:"repository-finished",repository:repo.full_name,status:record.status,completed:records.length,total:selected.length}));
 }}
 await Promise.all([worker(),worker()]);
 const summary={startedAt,finishedAt:new Date().toISOString(),inventoried:repos.length,selected:selected.length,completed:records.length,cloudSpendGbp:0,assessment:"Live OSV manifest checks, not a sandbox or competitor benchmark",statuses:records.reduce<Record<string,number>>((a,r)=>{const k=String(r.status);a[k]=(a[k]??0)+1;return a;},{})};
 await writeFile(`${output}/summary.json`,JSON.stringify(summary,null,2),{mode:0o600});console.log(JSON.stringify(summary));
}
main().catch(()=>{console.error("Organisation scan stopped. Existing per-repository results preserved; no raw response or credentials logged.");process.exitCode=1;});
