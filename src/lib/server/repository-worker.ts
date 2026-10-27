import type { Query } from './db';
import { ScanJobs } from './scan-jobs';
import { fetchManifests } from './repository-manifests';
import { scanRepository } from './repository-scan';

export async function runRepositoryJob(query:Query,dependencies={fetchManifests,scanRepository}) {
  const jobs=new ScanJobs(query);
  await jobs.expireExhausted();
  const job=await jobs.claim();
  if(!job)return {processed:false};
  const id=String(job.id),token=String(job.lease_token);
  try {
    const snapshot=await dependencies.fetchManifests({id:String(job.owner_id),workspaceId:String(job.workspace_id),role:'member'},
      {repository:String(job.repository),commit:String(job.commit_sha),tree:String(job.tree_sha),private:Boolean(job.private_repository)});
    const report=await dependencies.scanRepository(snapshot,AbortSignal.timeout(180000));
    await jobs.saveReport(id,token,report);
    return {processed:true,id,state:'completed',reportId:report.id};
  } catch {
    // Do not put provider bodies, tokens or source content into errors or operational logs.
    try {await jobs.finish(id,token,{failureCode:'scan_failed'});} catch {return {processed:true,id,state:'lease_lost'};}
    return {processed:true,id,state:'failed'};
  }
}
