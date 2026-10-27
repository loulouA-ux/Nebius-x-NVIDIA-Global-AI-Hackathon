import {readFile,writeFile,mkdir} from "node:fs/promises";
import {execFile} from "node:child_process";
import {promisify} from "node:util";
import {createHash} from "node:crypto";
import {parseBenchmarkManifest,queryBenchmarkDependencies,benchmarkLimits} from "../src/lib/benchmark-dependencies";
const exec=promisify(execFile);
async function main(){
 const source=process.argv[2];if(!source)throw Error("Source scan directory required");
 const skip=Number(process.argv[3]??0),limit=Number(process.argv[4]??20);
 if(!Number.isSafeInteger(skip)||skip<0||!Number.isSafeInteger(limit)||limit<1||limit>1000)throw Error("Invalid rescan bounds");
 const inventory=JSON.parse(await readFile(`${source}/inventory.json`,"utf8"));
 const directory=`test-results/manifest-rescan-${new Date().toISOString().replace(/[:.]/g,"-")}`;
 await mkdir(directory,{recursive:true,mode:0o700});
 let count=0,eligible=0;const results=[];
 console.log(JSON.stringify({event:"rescan-started",directory,skip,limit}));
 // Explicit bounds permit continuation without repeating the initial trial.
 for(const item of inventory){
  const old=JSON.parse(await readFile(`${source}/${item.repository.split('/')[1]}.json`,"utf8"));
  for(const prior of old.results??[]){
   if(prior.status!=="incomplete"||count>=limit)continue;
   if(eligible++<skip)continue;
   count++;
   const result:Record<string,unknown>={repository:item.repository,commit:old.commit,path:prior.path,blob:prior.blob,previousStatus:prior.status,status:"incomplete",stage:"fetch",scope:"Pinned manifest dependency check only"};
   try{
    const {stdout}=await exec("gh",["api",`repos/${item.repository}/git/blobs/${prior.blob}`],{timeout:45000,maxBuffer:9_000_000});
    const blob=JSON.parse(stdout);if(blob.encoding!=="base64")throw Error("encoding");
    const bytes=Buffer.from(blob.content,"base64");
    result.stage="size-and-integrity";
    if(bytes.length>benchmarkLimits.maxBytes)throw Error("size");
    if(createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex")!==prior.blob)throw Error("integrity");
    result.stage="parse";
    const parsed=parseBenchmarkManifest(prior.path.split('/').at(-1),bytes.toString("utf8"));
    result.dependencies=parsed.dependencies.length;result.warnings=parsed.warnings;
    result.stage="osv";
    const scan=await queryBenchmarkDependencies(parsed.dependencies);
    result.queried=scan.queried;result.failures=scan.failures;
    result.status=!scan.queried?"incomplete":scan.failures.length||parsed.warnings.length?"partial":"queried";
    result.findings=scan.findings.map(f=>({id:f.id,dependencies:f.evidence.flatMap(e=>e.dependency?[e.dependency]:[]),urls:f.evidence.flatMap(e=>e.url?[e.url]:[])}));
    result.stage="finished";
   }catch{result.reason=`Failed at ${result.stage}; no clean result inferred`;}
   results.push(result);await writeFile(`${directory}/${count}.json`,JSON.stringify(result,null,2),{mode:0o600});
   console.log(JSON.stringify({completed:count,repository:result.repository,status:result.status,dependencies:result.dependencies,queried:result.queried}));
  }
  if(count>=limit)break;
 }
 const summary={source,skip,limit,finishedAt:new Date().toISOString(),attempted:count,withQueries:results.filter(r=>Number(r.queried)>0).length,queriedWithoutWarnings:results.filter(r=>r.status==="queried").length,cloudSpendGbp:0};
 await writeFile(`${directory}/summary.json`,JSON.stringify(summary,null,2),{mode:0o600});console.log(JSON.stringify({directory,...summary}));
}
main().catch(()=>{console.error("Rescan stopped; partial results preserved, raw input withheld.");process.exitCode=1;});
