import type {Query} from './db';
import type {Actor} from './store';
import {ApiError} from './http';
import {batchStates,type BatchState} from '../batch-progress';
import {summarize,groupFindings,overview,lifecycle,throughput,median,remediationQueue,remediationModes,repositoryOrder,hasFix,exploitPrerequisites,explainFailure,
 severities,verdicts,gapCodes,type EntryRow,type JobEvent,type RepoSummary,type AdvisoryGroup,type Severity,type Verdict,type GapCode,type CoverageStage} from '../security-dashboard';

const PAGE_ROWS=50,MAX_EVENTS=6000;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Batches visible to this workspace AND owner only. */
export async function listBatches(query:Query,actor:Actor){
 const rows=await query(`SELECT id,title,created_at,jsonb_array_length(entries) AS total FROM sc_batch_plans
  WHERE workspace_id=$1 AND owner_id=$2 ORDER BY created_at DESC,id DESC LIMIT 20`,[actor.workspaceId,actor.id]);
 return rows.map(r=>({id:String(r.id),title:String(r.title),createdAt:new Date(String(r.created_at)).toISOString(),total:Number(r.total)}));
}

/** Entries are read in keyset pages; findings are trimmed in SQL so raw excerpts and dependency lists stay in the database. */
export async function loadBatchRows(query:Query,actor:Actor,batchId:string):Promise<EntryRow[]>{
 const rows:EntryRow[]=[];let after=0;
 for(let page=0;page<11;page++){
  const chunk=await query(`SELECT e.position,e.value->>'repository' AS repository,e.value->>'skipReason' AS skip_reason,
    j.state,j.failure_code,j.created_at AS job_created_at,j.updated_at,j.commit_sha,
    s.id AS report_id,s.created_at AS report_created_at,s.report->>'status' AS verdict,
    s.report->'repositoryScan'->'manifests' AS manifests,s.report->'repositoryScan'->'omitted' AS omitted,
    s.report->'repositoryScan'->'advisoryRefresh'->>'previousReportId' AS refreshed_from,
    CASE WHEN s.id IS NULL THEN NULL ELSE COALESCE(jsonb_array_length(s.report->'dependencies'),0) END AS dependency_count,
    (SELECT jsonb_object_agg(m,c) FROM (SELECT split_part(d->>'path',':',1) AS m,count(*) AS c FROM jsonb_array_elements(COALESCE(s.report->'dependencies','[]'::jsonb)) d GROUP BY 1) x) AS deps_by_manifest,
    (SELECT jsonb_agg(jsonb_build_object('name',c->>'name','state',c->>'state','detail',left(c->>'detail',600))) FROM jsonb_array_elements(COALESCE(s.report->'checks','[]'::jsonb)) c) AS checks,
    (SELECT jsonb_agg(jsonb_build_object('id',f->>'id','title',left(f->>'title',300),'severity',f->>'severity','severitySource',f->>'severitySource','cvss',f->'cvss',
      'cvssVector',f->>'cvssVector','fixedVersion',f->>'fixedVersion','url',f#>>'{evidence,0,url}','kind',f#>>'{evidence,0,kind}',
      'location',left(f#>>'{evidence,0,location}',400),'retrievedAt',f#>>'{evidence,0,retrievedAt}','dependency',f#>'{evidence,0,dependency}'))
      FROM jsonb_array_elements(COALESCE(s.report->'findings','[]'::jsonb)) f) AS findings
   FROM (SELECT * FROM sc_batch_plans WHERE id=$3 AND workspace_id=$1 AND owner_id=$2) b
   CROSS JOIN LATERAL jsonb_array_elements(b.entries) WITH ORDINALITY e(value,position)
   LEFT JOIN sc_scan_jobs j ON j.workspace_id=b.workspace_id AND j.owner_id=b.owner_id
     AND j.request_key=e.value->>'requestKey' AND lower(j.repository)=e.value->>'repository'
   -- The job's report pointer is the current revision; superseded revisions are never joined.
   LEFT JOIN sc_scans s ON s.id=j.report_id AND j.state='completed' AND s.workspace_id=b.workspace_id AND s.owner_id=b.owner_id
   WHERE e.position>$4 ORDER BY e.position LIMIT ${PAGE_ROWS}`,[actor.workspaceId,actor.id,batchId,after]);
  for(const r of chunk)rows.push({position:Number(r.position),repository:String(r.repository),skipReason:r.skip_reason?String(r.skip_reason):null,
   jobState:r.state?String(r.state):null,failureCode:r.failure_code?String(r.failure_code):null,
   jobCreatedAt:r.job_created_at?new Date(String(r.job_created_at)).toISOString():null,
   updatedAt:r.updated_at?new Date(String(r.updated_at)).toISOString():null,commit:r.commit_sha?String(r.commit_sha):null,
   reportId:r.report_id?String(r.report_id):null,reportCreatedAt:r.report_created_at?new Date(String(r.report_created_at)).toISOString():null,
   verdict:r.verdict?String(r.verdict):null,manifests:arr(r.manifests),omitted:arr(r.omitted),refreshedFrom:r.refreshed_from?String(r.refreshed_from):null,
   dependencyCount:r.dependency_count===null||r.dependency_count===undefined?null:Number(r.dependency_count),
   dependenciesByManifest:(r.deps_by_manifest as Record<string,number>|null)||null,checks:(r.checks as EntryRow['checks'])||[],findings:(r.findings as EntryRow['findings'])||[]});
  if(chunk.length<PAGE_ROWS)break;after=Number(chunk.at(-1)!.position);
 }
 return rows;
}
const arr=(v:unknown)=>Array.isArray(v)?v.map(String):[];

async function loadEvents(query:Query,actor:Actor,batchId:string):Promise<JobEvent[]>{
 const rows=await query(`SELECT ev.subject_id,ev.event_type,ev.created_at FROM sc_workspace_events ev
  JOIN sc_scan_jobs j ON j.id::text=ev.subject_id AND j.workspace_id=ev.workspace_id AND j.owner_id=ev.actor_id
  JOIN sc_batch_plans b ON b.id=$3 AND b.workspace_id=j.workspace_id AND b.owner_id=j.owner_id
   AND EXISTS(SELECT 1 FROM jsonb_array_elements(b.entries) e WHERE e->>'requestKey'=j.request_key)
  WHERE ev.workspace_id=$1 AND ev.actor_id=$2 AND ev.event_type LIKE 'scan\\_%'
  ORDER BY ev.sequence LIMIT ${MAX_EVENTS}`,[actor.workspaceId,actor.id,batchId]);
 return rows.map(r=>({jobId:String(r.subject_id),type:String(r.event_type),at:new Date(String(r.created_at)).toISOString()}));
}
async function jobIds(query:Query,actor:Actor,batchId:string){
 const rows=await query(`SELECT j.id,lower(j.repository) AS repository FROM sc_batch_plans b JOIN sc_scan_jobs j ON j.workspace_id=b.workspace_id AND j.owner_id=b.owner_id
  AND EXISTS(SELECT 1 FROM jsonb_array_elements(b.entries) e WHERE e->>'requestKey'=j.request_key AND e->>'repository'=lower(j.repository))
  WHERE b.id=$3 AND b.workspace_id=$1 AND b.owner_id=$2`,[actor.workspaceId,actor.id,batchId]);
 return new Map(rows.map(r=>[String(r.repository),String(r.id)]));
}

export type DashboardParams={sort?:string|null;recovery?:string|null;batch?:string|null;view?:string|null;q?:string|null;severity?:string|null;verdict?:string|null;gap?:string|null;stage?:string|null;state?:string|null;advisory?:string|null;page?:string|null};
const views=['overview','findings','repositories','coverage','process'] as const;
const pick=<T extends string>(value:string|null|undefined,allowed:readonly T[])=>value&&(allowed as readonly string[]).includes(value)?value as T:null;
const stages=['no_scanned_manifest','zero_resolved','partial','complete'] as const;

function paginate<T>(items:T[],page:number,size:number){const pages=Math.max(1,Math.ceil(items.length/size)),p=Math.min(Math.max(1,page),pages);return {total:items.length,page:p,pages,size,items:items.slice((p-1)*size,p*size)};}
const groupSummary=(g:AdvisoryGroup)=>({key:g.key,advisoryId:g.advisoryId,title:g.title,severity:g.severity,severitySources:g.severitySources,cvss:g.cvss,
 repositories:g.repositories.length,repositorySample:g.repositories.slice(0,3),occurrences:g.occurrenceCount,hasFix:hasFix(g),
 packages:g.packages.map(p=>({...p,installed:p.installed.slice(0,8),moreVersions:Math.max(0,p.installed.length-8)})).slice(0,4)});
const repoRow=(s:RepoSummary)=>({repository:s.repository,state:s.state,verdict:s.verdict,reportId:s.reportId,severityCounts:s.severityCounts,advisoryCount:s.advisoryCount,
 dependencyCount:s.dependencyCount,manifests:s.manifests.length,omitted:s.omissions.length,stage:s.stage,gaps:s.gaps,refreshed:s.refreshed,reportCreatedAt:s.reportCreatedAt,commit:s.commit});

export async function securityDashboard(query:Query,actor:Actor,params:DashboardParams,now=new Date()){
 const batches=await listBatches(query,actor);
 if(!batches.length)return {batches,batch:null};
 if(params.batch&&!UUID.test(params.batch))throw new ApiError(400,'Invalid batch.');
 const batch=params.batch?batches.find(b=>b.id===params.batch):batches[0];
 if(!batch)throw new ApiError(404,'Batch not found.');
 const rows=await loadBatchRows(query,actor,batch.id);
 const summaries=rows.map(summarize),byRepo=new Map(summaries.map(s=>[s.repository,s]));
 const sort=pick(params.sort,remediationModes)||'widespread';
 const groups=groupFindings(rows,byRepo);
 const ranked=remediationQueue(groups,sort);
 const checkedAt=now.toISOString(),ov=overview(batch,summaries,groups,checkedAt);
 const view=pick(params.view,views)||'overview',q=(params.q||'').trim().toLowerCase().slice(0,120),page=Number(params.page)||1;
 const severity=pick(params.severity,severities as readonly Severity[]),verdict=pick(params.verdict,verdicts as readonly Verdict[]);
 const gap=pick(params.gap,gapCodes as readonly GapCode[]),stage=pick(params.stage,stages as readonly CoverageStage[]),state=pick(params.state,batchStates as readonly BatchState[]);
 const recovery=params.recovery==='needed'?'needed':null;
 const filters={sort,recovery,view,q,severity,verdict,gap,stage,state,advisory:params.advisory||null};
 const base={batches,batch,overview:ov,filters};

 if(params.advisory){
  const g=groups.find(x=>x.key===params.advisory);if(!g)throw new ApiError(404,'Advisory not found in this batch.');
  return {...base,advisory:{...groupSummary(g),cvssVector:g.cvssVector,prerequisites:exploitPrerequisites(g.cvssVector),packages:g.packages,repositories:g.repositories,
   occurrenceList:g.occurrences.slice(0,500),truncated:g.occurrences.length>500}};
 }
 if(view==='overview'){
  const fixFirst=ranked.slice(0,5).map(groupSummary);
  const attention=summaries.filter(s=>s.verdict==='Blocked').sort(repositoryOrder).slice(0,8).map(repoRow);
  const zeroChecked=summaries.filter(s=>s.verdict&&s.dependencyCount===0).length;
  return {...base,fixFirst,attention,zeroChecked};
 }
 if(view==='findings'){
  const items=ranked.filter(g=>(!severity||g.severity===severity)&&(!q||[g.advisoryId,g.title,...g.repositories,...g.packages.map(p=>p.name)].some(v=>v?.toLowerCase().includes(q))));
  return {...base,findings:paginate(items.map(groupSummary),page,25)};
 }
 if(view==='repositories'||view==='coverage'){
  const items=summaries.filter(s=>s.verdict&&(!(view==='coverage'&&recovery)||s.gaps.length>0)&&(!verdict||s.verdict===verdict)&&(!gap||s.gaps.includes(gap))&&(!stage||s.stage===stage)&&(!q||s.repository.toLowerCase().includes(q)))
   .sort(view==='coverage'?(a,b)=>a.dependencyCount-b.dependencyCount||a.position-b.position:repositoryOrder);
  const paged=paginate(items,page,PAGE_ROWS);
  return {...base,repositories:{...paged,items:paged.items.map(s=>view==='coverage'?{...repoRow(s),omissions:s.omissions.slice(0,20),moreOmissions:Math.max(0,s.omissions.length-20),
   manifestPaths:s.manifests.slice(0,20),dependenciesByManifest:Object.fromEntries(Object.entries(rows.find(r=>r.repository===s.repository)?.dependenciesByManifest||{}).slice(0,20))}:repoRow(s))}};
 }
 // process
 const [events,ids]=await Promise.all([loadEvents(query,actor,batch.id),jobIds(query,actor,batch.id)]);
 const byJob=new Map<string,JobEvent[]>();for(const e of events){const list=byJob.get(e.jobId)||[];list.push(e);byJob.set(e.jobId,list);}
 const lifecycles=new Map([...ids].map(([repo,id])=>[repo,lifecycle(byJob.get(id)||[])]));
 const waits=[...lifecycles.values()].map(l=>l.waitMs).filter((v):v is number=>v!==null),runs=[...lifecycles.values()].map(l=>l.runMs).filter((v):v is number=>v!==null);
 const items=summaries.filter(s=>(!state||s.state===state)&&(!q||s.repository.toLowerCase().includes(q)));
 const paged=paginate(items,page,PAGE_ROWS);
 return {...base,process:{eventsRecorded:events.length,eventsTruncated:events.length>=MAX_EVENTS,medianWaitMs:median(waits),medianRunMs:median(runs),measuredJobs:runs.length,
  throughput:throughput(events),firstEventAt:events[0]?.at??null,lastEventAt:events.at(-1)?.at??null,
  entries:{...paged,items:paged.items.map(s=>{const l=lifecycles.get(s.repository.toLowerCase())||null;return {repository:s.repository,state:s.state,verdict:s.verdict,reportId:s.reportId,
   failureCode:s.failureCode,failure:s.state==='failed'||s.state==='cancelled'?explainFailure(s.failureCode):null,updatedAt:s.updatedAt,lifecycle:l};})}}};
}
