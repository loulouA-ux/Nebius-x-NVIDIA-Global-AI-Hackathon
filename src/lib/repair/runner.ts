import type { Finding } from "../types";
import { parseManifest } from "../parser";
import { queryOsv } from "../providers";
import { contentHash, repairPlanHash, type RepairPlan } from "./plan";
export type CommandEvidence={command:string;exitCode:number;output:string};
export interface RepairSandbox {
  writeFiles(files:Record<string,string>):Promise<void>;
  run(command:"install"|"lockfile"|"test"|"build"):Promise<CommandEvidence>;
  network(policy:"npm-only"|"deny-all"):Promise<void>;
  readFile(path:"package-lock.json"):Promise<string>;
  stop():Promise<void>;
}
export type SandboxFactory=(phase:"baseline"|"patched")=>Promise<RepairSandbox>;
export type DependencyScanEvidence={checkedAt:string;dependencyCount:number;lockfileHash:string;findings:Finding[]};
export type RepairRun={scans?:{before:DependencyScanEvidence;after?:DependencyScanEvidence};planHash:string;status:"passed"|"failed"|"incomplete";baseline:CommandEvidence[];patched:CommandEvidence[];lockfileAfter?:string;cleanupComplete:boolean;errors:string[]};
// Adapter must enforce microVM isolation, no credentials/public ports, hard timeout,
// bounded output and npm registry-only fetches with lifecycle scripts disabled.
// Source is never executed by this trusted orchestrator on the application host.
export async function verifyRepair(plan:RepairPlan,files:Record<string,string>,factory:SandboxFactory, fetcher:typeof fetch=fetch):Promise<RepairRun>{
 const {planHash,...unsigned}=plan;
 if(repairPlanHash(unsigned)!==planHash)throw Error("Repair plan changed after proposal.");
 if(contentHash(files["package.json"]||"")!==plan.manifestHash)throw Error("Snapshot does not match repair plan.");
 if(!files["package-lock.json"])throw Error("A committed npm lockfile is required.");
 const manifest=JSON.parse(files["package.json"]);
 if(typeof manifest.scripts?.test!=="string"||!manifest.scripts.test.trim()||/no test specified/i.test(manifest.scripts.test))throw Error("A real project test command is required.");
 const result:RepairRun={planHash,status:"incomplete",baseline:[],patched:[],cleanupComplete:true,errors:[]};
 const before=parseManifest("package-lock.json",files["package-lock.json"]);
 if(before.warnings.length||!before.dependencies.length)throw Error("Baseline lockfile has incomplete dependency coverage.");
 const baselineFindings=await queryOsv(before.dependencies,fetcher);
 const matched=new Set(baselineFindings.flatMap(f=>f.evidence.filter(e=>e.dependency?.name===plan.packageName&&e.dependency.version===plan.fromVersion&&e.dependency.path===`node_modules/${plan.packageName}`).map(e=>e.url)));
 if(plan.sourceUrls.some(url=>!matched.has(url)))throw Error("Baseline scan no longer confirms the proposed advisory evidence. Create a fresh proposal.");
 result.scans={before:{checkedAt:new Date().toISOString(),dependencyCount:before.dependencies.length,lockfileHash:contentHash(files["package-lock.json"]),findings:baselineFindings}};

 for(const phase of ["baseline","patched"] as const){
  let sandbox:RepairSandbox|undefined;
  try{
   sandbox=await factory(phase);
   await sandbox.writeFiles({...files,"package.json":phase==="patched"?plan.manifestAfter:plan.manifestBefore});
   await sandbox.network("npm-only");
   if(phase==="patched"){
    const step=await sandbox.run("lockfile");result[phase].push(step);
    if(step.exitCode!==0)throw Error("Patched lockfile generation failed.");
    result.lockfileAfter=await sandbox.readFile("package-lock.json");
   }
   const install=await sandbox.run("install");result[phase].push(install);
   if(install.exitCode!==0)throw Error(`${phase} install failed.`);
   await sandbox.network("deny-all");
   const test=await sandbox.run("test");result[phase].push(test);
   if(test.exitCode!==0)throw Error(`${phase} tests failed.`);
   if(typeof manifest.scripts?.build==="string"){
    const build=await sandbox.run("build");result[phase].push(build);
    if(build.exitCode!==0)throw Error(`${phase} build failed.`);
   }
  }catch(e){result.errors.push(e instanceof Error?e.message:"Sandbox verification failed.");}
  finally{if(sandbox)try{await sandbox.stop();}catch{result.cleanupComplete=false;result.errors.push(`${phase} sandbox cleanup failed.`);}}
 }
 if(result.lockfileAfter && result.errors.length===0){
  try {
   const lock=JSON.parse(result.lockfileAfter);
   if(lock.packages?.[""]?.[plan.section]?.[plan.packageName]!==plan.toVersion || lock.packages?.[`node_modules/${plan.packageName}`]?.version!==plan.toVersion)
     throw Error("Generated lockfile does not resolve the proposed dependency version.");
   const parsed=parseManifest("package-lock.json",result.lockfileAfter);
   if(parsed.warnings.length)throw Error("Generated lockfile has incomplete dependency coverage.");
   const remaining=await queryOsv(parsed.dependencies,fetcher);
   result.scans.after={checkedAt:new Date().toISOString(),dependencyCount:parsed.dependencies.length,lockfileHash:contentHash(result.lockfileAfter),findings:remaining};
   if(remaining.length)throw Error("Post-repair dependency scan still reports advisories; review required.");
  }catch(e){result.errors.push(e instanceof Error?e.message:"Post-repair evidence unavailable.");}
 }
 result.status=result.errors.length?"failed":result.lockfileAfter&&result.cleanupComplete?"passed":"incomplete";
 return result;
}
