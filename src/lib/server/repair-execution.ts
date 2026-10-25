import {z} from "zod";
import type {Query} from "./db";
import {ApiError} from "./http";
import {Store,type Actor} from "./store";
import {getRepair} from "./repairs";
import {githubRequest,installationToken,listRepositories,type RepositorySnapshot} from "./github-repositories";
import {contentHash,structuredHash,type RepairPlan} from "../repair/plan";
import {verifyRepair,type RepairRun,type SandboxFactory} from "../repair/runner";
import {vercelSandboxFactory} from "../repair/sandbox";
export function approvalHash(plan:RepairPlan,result:RepairRun){
 if(!result.scans?.after||result.scans.after.findings.length||result.scans.after.lockfileHash!==contentHash(result.lockfileAfter||""))throw new ApiError(409,"Complete dependency scan evidence is required for approval.");
 if(result.status!=="passed"||!result.cleanupComplete||!result.lockfileAfter||result.planHash!==plan.planHash)throw new ApiError(409,"Repair is not verified for approval.");
 return structuredHash({planHash:plan.planHash,manifest:plan.manifestAfter,lockfile:result.lockfileAfter,result});
}
export function repairRunLimits(env:Record<string,string|undefined>=process.env){
 const read=(name:string)=>{
  const raw=env[name]??"1";
  if(!/^[1-5]$/.test(raw))throw new ApiError(503,"Repair run allowance must be an integer between 1 and 5.");
  return Number(raw);
 };
 return {daily:read("SHIPCHECK_REPAIR_DAILY_RUNS"),total:read("SHIPCHECK_REPAIR_TOTAL_RUNS")};
}
export async function reserveRepairRun(query:Query,limit:number){
 // Lifetime allowance has a fixed window. Failed/abandoned reservations are not refunded.
 // This caps executions, not currency; reconcile provider billing before increasing it.
 const reservations=await query("INSERT INTO sc_quotas(bucket,window_start,used) VALUES('repair-runs-total',0,1) ON CONFLICT(bucket,window_start) DO UPDATE SET used=sc_quotas.used+1 WHERE sc_quotas.used < $1 RETURNING used",[limit]);
 if(!reservations.length)throw new ApiError(429,"Initial repair run allowance reached. Review spend before increasing it.");
}
export async function executeRepair(query:Query,actor:Actor,id:string,factory?:SandboxFactory,fetcher:typeof fetch=fetch){
 const limits=repairRunLimits();
 const make=factory||vercelSandboxFactory(); // Configuration gate before quota/state mutation.
 const row=await getRepair(query,actor,id), snapshot=row.snapshot as RepositorySnapshot,plan=row.plan as RepairPlan;
 if(row.state!=="proposed")throw new ApiError(409,"Repair has already started.");
 if(!(await listRepositories(actor,fetcher)).some(r=>r.id===snapshot.repository.id))throw new ApiError(403,"Repository access was revoked.");
 await new Store(query).quota("repair-runs-global",limits.daily,86400000);
 await reserveRepairRun(query,limits.total);
 const [claimed]=await query("UPDATE sc_repairs SET state='running',updated_at=now() WHERE id=$1 AND owner_id=$2 AND workspace_id=$3 AND state='proposed' RETURNING id",[id,actor.id,actor.workspaceId]);
 if(!claimed)throw new ApiError(409,"Repair has already started.");
 try{
  const result=await verifyRepair(plan,snapshot.files,make,fetcher);
  await query("UPDATE sc_repairs SET state=$2,result=$3::jsonb,updated_at=now() WHERE id=$1",[id,result.status==="passed"?"verified":"failed",JSON.stringify(result)]);
  return {id,state:result.status==="passed"?"verified":"failed",result,approvalHash:result.status==="passed"?approvalHash(plan,result):null};
 }catch{
  await query("UPDATE sc_repairs SET state='failed',updated_at=now() WHERE id=$1",[id]);
  throw new ApiError(502,"Repair execution failed. Review evidence before retrying.");
 }
}
const shaSchema=z.object({sha:z.string().regex(/^[a-f0-9]{40}$/)});
export async function publishRepair(query:Query,actor:Actor,id:string,approvedHash:string,fetcher:typeof fetch=fetch){
 const row=await getRepair(query,actor,id),plan=row.plan as RepairPlan,result=row.result as RepairRun,snapshot=row.snapshot as RepositorySnapshot;
 if(row.state!=="verified"||!result||approvalHash(plan,result)!==approvedHash)throw new ApiError(409,"Approve the current verified patch before creating a PR.");
 if(!(await listRepositories(actor,fetcher)).some(r=>r.id===snapshot.repository.id))throw new ApiError(403,"Repository access was revoked.");
 const token=await installationToken(actor,snapshot.repository.id,true,fetcher),base=`/repos/${snapshot.repository.full_name}`;
 const head=shaSchema.parse(await githubRequest(`${base}/commits/${encodeURIComponent(snapshot.repository.default_branch)}`,token,{},fetcher));
 if(head.sha!==plan.baseCommit)throw new ApiError(409,"Base branch changed. Propose and verify a fresh repair.");
 const [claimed]=await query("UPDATE sc_repairs SET state='publishing',updated_at=now() WHERE id=$1 AND owner_id=$2 AND workspace_id=$3 AND state='verified' RETURNING id",[id,actor.id,actor.workspaceId]);
 if(!claimed)throw new ApiError(409,"PR handoff already started.");
 // Keep publishing state on unknown outcome. Never blindly retry writes or create duplicate PRs.
 const tree=shaSchema.parse(await githubRequest(`${base}/git/trees`,token,{method:"POST",body:JSON.stringify({base_tree:snapshot.tree,tree:[{path:"package.json",mode:"100644",type:"blob",content:plan.manifestAfter},{path:"package-lock.json",mode:"100644",type:"blob",content:result.lockfileAfter}]})},fetcher));
 const commit=shaSchema.parse(await githubRequest(`${base}/git/commits`,token,{method:"POST",body:JSON.stringify({message:`Fix ${plan.packageName} dependency: ${plan.fromVersion} to ${plan.toVersion}`,tree:tree.sha,parents:[plan.baseCommit]})},fetcher));
 await query("UPDATE sc_repairs SET publication_commit=$2,updated_at=now() WHERE id=$1 AND state='publishing'",[id,commit.sha]);
 const branch=`codex/shipcheck-repair-${id}`;
 await githubRequest(`${base}/git/refs`,token,{method:"POST",body:JSON.stringify({ref:`refs/heads/${branch}`,sha:commit.sha})},fetcher);
 const pr=z.object({html_url:z.string().url()}).parse(await githubRequest(`${base}/pulls`,token,{method:"POST",body:JSON.stringify({title:`Fix ${plan.packageName}: ${plan.fromVersion} → ${plan.toVersion}`,head:branch,base:snapshot.repository.default_branch,draft:true,body:`Proposes a dependency upgrade based on OSV evidence.\n\n${plan.sourceUrls.join("\n")}\n\nBaseline and patched sandbox commands exited successfully; post-repair dependency lookup passed. This is not a guarantee of application security. Review the diff and CI before merging.\n\nApproved patch: ${approvedHash}\nSource commit: ${plan.baseCommit}\n\nNo automatic merge or deployment is performed.`})},fetcher));
 if(!pr.html_url.startsWith(`https://github.com/${snapshot.repository.full_name}/pull/`))throw Error("Unexpected PR URL.");
 await query("UPDATE sc_repairs SET state='published',pr_url=$2,updated_at=now() WHERE id=$1",[id,pr.html_url]);
 return {id,state:"published",url:pr.html_url};
}

// Recover an accepted PR response using reads only. Never retry GitHub writes.
export async function reconcileRepair(query:Query,actor:Actor,id:string,fetcher:typeof fetch=fetch){
 const row=await getRepair(query,actor,id);
 if(row.state!=="publishing")throw new ApiError(409,"Only an uncertain publication can be reconciled.");
 const snapshot=row.snapshot as RepositorySnapshot;
 if(typeof row.publication_commit!=="string"||!/^[a-f0-9]{40}$/.test(row.publication_commit))throw new ApiError(409,"No confirmed publication commit. Inspect the repository before proposing again.");
 if(!(await listRepositories(actor,fetcher)).some(r=>r.id===snapshot.repository.id))throw new ApiError(403,"Repository access was revoked.");
 const token=await installationToken(actor,snapshot.repository.id,false,fetcher,true);
 const branch=`codex/shipcheck-repair-${id}`,owner=snapshot.repository.full_name.split("/")[0];
 const matches=z.array(z.object({html_url:z.string().url(),draft:z.boolean(),state:z.string(),merged_at:z.string().nullable(),head:z.object({sha:z.string(),ref:z.string(),repo:z.object({id:z.number()}).nullable()}),base:z.object({ref:z.string(),repo:z.object({id:z.number()})})})).parse(await githubRequest(`/repos/${snapshot.repository.full_name}/pulls?state=all&head=${encodeURIComponent(owner+":"+branch)}&per_page=2`,token,{},fetcher));
 if(matches.length!==1)throw new ApiError(409,"No unique existing PR was found. No GitHub writes were repeated.");
 const pr=matches[0];
 if(pr.head.sha!==row.publication_commit||pr.head.ref!==branch||pr.head.repo?.id!==snapshot.repository.id||pr.base.repo.id!==snapshot.repository.id||pr.base.ref!==snapshot.repository.default_branch||pr.state!=="open"||!pr.draft||pr.merged_at!==null||!pr.html_url.startsWith(`https://github.com/${snapshot.repository.full_name}/pull/`))throw new ApiError(409,"Existing PR differs from the approved handoff. Manual review is required.");
 const updated=await query("UPDATE sc_repairs SET state='published',pr_url=$2,updated_at=now() WHERE id=$1 AND owner_id=$3 AND workspace_id=$4 AND state='publishing' RETURNING id",[id,pr.html_url,actor.id,actor.workspaceId]);
 if(!updated.length)throw new ApiError(409,"Repair state changed during reconciliation.");
 return {id,state:"published",url:pr.html_url};
}
