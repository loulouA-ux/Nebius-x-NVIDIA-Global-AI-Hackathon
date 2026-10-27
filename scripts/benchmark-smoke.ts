import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { demoFiles, runScan } from "../src/lib/pipeline";
import { compareRuns, type BenchmarkRun } from "../src/lib/benchmark";
const hash=(value:string)=>createHash("sha256").update(value).digest("hex");
async function main(){
  const commit=execFileSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).trim();
  const runs:BenchmarkRun[]=[];
  for(let i=0;i<3;i++){
    const report=await runScan({mode:"demo"});
    runs.push({id:`synthetic-${i+1}`,repository:"shipcheck/synthetic-fixture",commit,
      snapshotSha256:hash(JSON.stringify(demoFiles)),scanner:"ShipCheck offline fixture",
      version:commit,configSha256:hash("demo-mode-no-external-calls"),
      environmentSha256:hash(JSON.stringify({node:process.version,platform:process.platform,arch:process.arch})),
      databaseRevision:"bundled-single-advisory-snapshot",cache:"warm",status:"incomplete",
      durationMs:report.durationMs,costGbp:0,findings:report.findings.map(f=>hash(f.id))});
  }
  await mkdir("test-results",{recursive:true});
  await writeFile("test-results/benchmark-smoke-runs.json",JSON.stringify(runs,null,2),{mode:0o600});
  await writeFile("test-results/benchmark-smoke-summary.json",JSON.stringify({synthetic:true,localOnly:true,cloudSandbox:false,notes:"Three actual offline fixture scans; snapshot/incomplete coverage deliberately prevents a complete-scan score. This is a harness smoke, not a competitor benchmark.",...compareRuns(runs)},null,2),{mode:0o600});
  console.log("Three offline synthetic scans recorded; incomplete coverage preserved. No cloud spend or competitor accuracy claim.");
}
main().catch(()=>{console.error("Synthetic benchmark smoke failed.");process.exitCode=1;});
