import type {Query} from './db';
import type {Actor} from './store';
import {batchStates,type BatchProgress,type BatchState} from '../batch-progress';
import {explainFailure} from '../security-dashboard';

/** Both manifest and jobs are scoped to the authenticated workspace AND owner. */
export async function latestBatchProgress(query:Query,actor:Actor):Promise<BatchProgress|null>{
 const rows=await query(`SELECT b.id,b.title,b.created_at,e.value->>'repository' AS repository,
   e.value->>'skipReason' AS skip_reason,e.value->>'skipCheckedAt' AS skipped_at,
   j.state,j.report_id,j.failure_code,j.updated_at,s.report->>'status' AS verdict
 FROM (SELECT * FROM sc_batch_plans WHERE workspace_id=$1 AND owner_id=$2 ORDER BY created_at DESC,id DESC LIMIT 1) b
 CROSS JOIN LATERAL jsonb_array_elements(b.entries) WITH ORDINALITY e(value,position)
 LEFT JOIN sc_scan_jobs j ON j.workspace_id=b.workspace_id AND j.owner_id=b.owner_id
   AND j.request_key=e.value->>'requestKey' AND lower(j.repository)=e.value->>'repository'
 LEFT JOIN sc_scans s ON s.id=j.report_id AND s.workspace_id=b.workspace_id AND s.owner_id=b.owner_id
 ORDER BY e.position`,[actor.workspaceId,actor.id]);
 if(!rows.length)return null;
 const counts=Object.fromEntries(batchStates.map(s=>[s,0])) as Record<BatchState,number>;
 const entries=rows.map(row=>{
  // An actual accepted job takes precedence over a stale skip annotation.
  const state=String(row.state||(row.skip_reason==='empty_repository'?'skipped':'waiting')) as BatchState;
  if(!batchStates.includes(state))throw Error('Unknown batch job state.');
  counts[state]++;
  return {repository:String(row.repository),state,verdict:row.verdict?String(row.verdict):null,
   reportUrl:row.report_id?`/reports/${row.report_id}`:null,
   detail:state==='skipped'?'Empty repository — no scan submitted.':state==='failed'||state==='cancelled'?`${row.failure_code?`${row.failure_code}: `:''}${explainFailure(row.failure_code?String(row.failure_code):null)}`:null,
   updatedAt:row.updated_at?new Date(String(row.updated_at)).toISOString():state==='skipped'&&row.skipped_at?String(row.skipped_at):null};
 });
 return {id:String(rows[0].id),title:String(rows[0].title),createdAt:new Date(String(rows[0].created_at)).toISOString(),checkedAt:new Date().toISOString(),total:entries.length,
  finished:counts.completed+counts.failed+counts.cancelled+counts.skipped,counts,entries};
}
