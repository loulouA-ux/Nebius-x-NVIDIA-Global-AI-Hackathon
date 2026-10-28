import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {beforeAll,afterAll,it,expect,describe} from 'vitest';
import {securityDashboard} from '../src/lib/server/security-dashboard';
import {exploitPrerequisites,throughput,lifecycle,omissionReasons,summarize,type EntryRow} from '../src/lib/security-dashboard';
import type {Query} from '../src/lib/server/db';

// Synthetic fixtures only: no real repository names, advisories or reports.
const db=new PGlite();const q:Query=async(sql,args=[])=>(await db.query(sql,args)).rows as Record<string,unknown>[];
const actor={id:'github:100',workspaceId:'sec-test',role:'member' as const},other={...actor,id:'github:200'};
const repo=(name:string)=>`example-org/${name}`;
const names=['empty','waiting','queued','running','failed','cancelled','blocked-a','blocked-b','no-manifest','pkgjson','python','passed'];
const entries=names.map(n=>({repository:repo(n),requestKey:randomUUID(),...(n==='empty'?{skipReason:'empty_repository',skipCheckedAt:'2026-10-28T08:00:00.000Z'}:{})}));
const key=(n:string)=>entries[names.indexOf(n)].requestKey;
const batchId=randomUUID();
const adv=(id:string,name:string,version:string,manifest:string,severity:string,fixed?:string,cvss?:number,vector?:string)=>({id:`${manifest}:${id}:${name}@${version}`,title:`Synthetic ${id}`,severity,severitySource:cvss?`CVSS ${cvss}`:'GitHub advisory severity',cvss,cvssVector:vector,fixedVersion:fixed,description:'x',action:'x',
 evidence:[{kind:'advisory',dependency:{name,version,ecosystem:'npm',path:`${manifest}:node_modules/${name}`},location:`${manifest}: node_modules/${name}`,excerpt:'SECRET-EXCERPT-SHOULD-NOT-LEAK',url:`https://osv.dev/vulnerability/${id}`,retrievedAt:'2026-10-28T09:00:00.000Z'}]});
const deps=(manifest:string,count:number)=>Array.from({length:count},(_,i)=>({name:`pkg${i}`,version:'1.0.0',ecosystem:'npm',path:`${manifest}:node_modules/pkg${i}`}));
const report=(status:string,scan:object,extra:object={})=>({id:randomUUID(),mode:'live',createdAt:'2026-10-28T09:30:00.000Z',status,dependencies:[],findings:[],checks:[],sources:[],explanations:[],durationMs:1,policy:'p',
 repositoryScan:{repository:'r',commit:'c',scannerVersion:'0.1.1',manifests:[],omitted:[],...scan},...extra});
const VECTOR='CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H';
const reports:Record<string,object>={
 'blocked-a':report('Blocked',{manifests:['package-lock.json','apps/web/package-lock.json']},{dependencies:[...deps('package-lock.json',3),...deps('apps/web/package-lock.json',2)],
  findings:[adv('GHSA-aaaa','left-pad','1.0.0','package-lock.json','high','1.3.0',9.8,VECTOR),adv('GHSA-aaaa','left-pad','1.1.0','apps/web/package-lock.json','high','1.3.0',9.8,VECTOR),adv('GHSA-bbbb','tiny','2.0.0','package-lock.json','medium','2.0.5')],
  checks:[{name:'package-lock.json — OSV advisories',state:'complete',detail:'Queried 3/3'}]}),
 'blocked-b':report('Blocked',{manifests:['package-lock.json'],omitted:['yarn.lock','big/package-lock.json'],advisoryRefresh:{previousReportId:'x',refreshedAt:'2026-10-28T10:00:00.000Z'}},{dependencies:deps('package-lock.json',4),
  findings:[adv('GHSA-aaaa','left-pad','1.0.0','package-lock.json','high','1.3.0',9.8,VECTOR)],checks:[{name:'package-lock.json — OSV advisories',state:'incomplete',detail:'Coverage gaps: advisory_lookup_failed.'}]}),
 'no-manifest':report('Incomplete',{},{checks:[{name:'Repository manifest coverage',state:'incomplete',detail:'No supported dependency manifest was found.'}]}),
 pkgjson:report('Incomplete',{manifests:['package.json']},{checks:[{name:'package.json — Dependency coverage',state:'incomplete',detail:'package.json does not resolve transitive dependencies. Supply package-lock.json v2/v3 for broader coverage.'}]}),
 python:report('Incomplete',{manifests:['requirements.txt'],omitted:['svc/requirements.txt']},{dependencies:deps('requirements.txt',2),checks:[{name:'requirements.txt — Dependency coverage',state:'incomplete',detail:'Line 3: only exact Python pins are supported; markers, includes, URLs and options were not resolved.'},{name:'svc/requirements.txt — scan',state:'incomplete',detail:'Manifest could not be scanned; no clean result is implied.'}]}),
 passed:report('Checks passed',{manifests:['package-lock.json']},{dependencies:deps('package-lock.json',1),checks:[{name:'package-lock.json — OSV advisories',state:'complete',detail:'ok'}]}),
};
const jobIds:Record<string,string>={};
beforeAll(async()=>{
 for(const f of ['001_core','002_hosted_jobs','003_workspaces','004_team_sharing','010_batch_dashboard'])await db.exec(readFileSync(`migrations/${f}.sql`,'utf8'));
 await q("INSERT INTO sc_workspaces(id,owner_id,name) VALUES($1,$2,'Sec')",[actor.workspaceId,actor.id]);
 await q("INSERT INTO sc_workspaces(id,owner_id,name) VALUES('elsewhere',$1,'Other')",[actor.id]);
 await q("INSERT INTO sc_batch_plans(id,workspace_id,owner_id,title,entries) VALUES($1,$2,$3,'Synthetic batch',$4::jsonb)",[batchId,actor.workspaceId,actor.id,JSON.stringify(entries)]);
 await q("INSERT INTO sc_scan_allowances(workspace_id,period_start,scan_limit,reserved) VALUES($1,current_date,500,10)",[actor.workspaceId]);
 const states:Record<string,string>={queued:'queued',running:'running',failed:'failed',cancelled:'cancelled'};
 for(const n of names.slice(2)){
  const id=randomUUID();jobIds[n]=id;let reportId:string|null=null;
  if(reports[n]){reportId=randomUUID();await q('INSERT INTO sc_scans(id,workspace_id,owner_id,report) VALUES($1,$2,$3,$4::jsonb)',[reportId,actor.workspaceId,actor.id,JSON.stringify(reports[n])]);}
  await q(`INSERT INTO sc_scan_jobs(id,workspace_id,owner_id,request_key,repository,commit_sha,period_start,state,report_id,failure_code) VALUES($1,$2,$3,$4,$5,'abc',current_date,$6,$7,$8)`,
   [id,actor.workspaceId,actor.id,key(n),repo(n),states[n]||'completed',reportId,n==='failed'?'unsupported_repository':null]);
 }
 // A superseded revision for blocked-b exists but is not the job's pointer; it must never be counted.
 await q('INSERT INTO sc_scans(id,workspace_id,owner_id,report) VALUES($1,$2,$3,$4::jsonb)',[randomUUID(),actor.workspaceId,actor.id,JSON.stringify(report('Incomplete',{}))]);
 // Another owner reusing the same request key and repository must not appear.
 await q(`INSERT INTO sc_scan_jobs(id,workspace_id,owner_id,request_key,repository,commit_sha,period_start,state) VALUES($1,$2,$3,$4,$5,'abc',current_date,'failed')`,[randomUUID(),actor.workspaceId,other.id,key('waiting'),repo('waiting')]);
 const ev=async(job:string,type:string,at:string)=>q("INSERT INTO sc_workspace_events(workspace_id,actor_id,event_type,subject_id,created_at) VALUES($1,$2,$3,$4,$5)",[actor.workspaceId,actor.id,type,job,at]);
 await ev(jobIds['blocked-a'],'scan_queued','2026-10-28T09:00:00Z');await ev(jobIds['blocked-a'],'scan_started','2026-10-28T09:01:00Z');await ev(jobIds['blocked-a'],'scan_completed','2026-10-28T09:01:30Z');
 await ev(jobIds.failed,'scan_queued','2026-10-28T09:00:00Z');await ev(jobIds.failed,'scan_started','2026-10-28T09:03:00Z');await ev(jobIds.failed,'scan_failed','2026-10-28T09:04:00Z');
 // Other owner's event for our job id must be excluded.
 await q("INSERT INTO sc_workspace_events(workspace_id,actor_id,event_type,subject_id) VALUES($1,$2,'scan_completed',$3)",[actor.workspaceId,other.id,jobIds.passed]);
});
afterAll(()=>db.close());

describe('security dashboard aggregation',()=>{
 it('separates processing state from verdicts and counts current revisions once',async()=>{
  const r=await securityDashboard(q,actor,{});if(!('fixFirst' in r))throw Error('overview expected');
  expect(r.overview.operational).toMatchObject({skipped:1,waiting:1,queued:1,running:1,failed:1,cancelled:1,completed:6,accepted:10,finished:9});
  expect(r.overview.verdicts).toMatchObject({denominator:6,counts:{Blocked:2,Incomplete:3,'Checks passed':1,'Review required':0}});
  expect(r.overview.freshness.refreshedReports).toBe(1);
  expect(r.overview.incomplete.counts).toEqual({no_scanned_manifest:1,zero_resolved:1,partial:1});
  expect(r.zeroChecked).toBe(2);
  expect(r.overview.active).toBe(true);
 });
 it('groups advisories across repositories with distinct repository and occurrence counts',async()=>{
  const r=await securityDashboard(q,actor,{view:'findings'});if(!('findings' in r))throw Error();
  expect(r.overview.findings).toMatchObject({uniqueAdvisories:2,affectedRepositories:2,occurrences:4,bySeverity:{high:1,medium:1}});
  const a=r.findings.items[0];
  expect(a).toMatchObject({advisoryId:'GHSA-aaaa',severity:'high',repositories:2,occurrences:3,cvss:9.8,hasFix:true});
  expect(a.packages[0].installed).toEqual([{version:'1.0.0',fixedVersions:['1.3.0'],repositories:2},{version:'1.1.0',fixedVersions:['1.3.0'],repositories:1}]);
  const searched=await securityDashboard(q,actor,{view:'findings',q:'tiny'});if(!('findings' in searched))throw Error();
  expect(searched.findings.total).toBe(1);
 });
 it('keeps coverage gaps independent of verdict, including on Blocked reports',async()=>{
  const r=await securityDashboard(q,actor,{view:'coverage'});if(!('repositories' in r))throw Error();
  const g=r.overview.gaps.counts;
  expect(g).toMatchObject({zero_dependencies:2,no_manifest_found:1,omitted_files:2,unsupported_lockfile:1,package_json_only:1,python_syntax:1,manifest_scan_failed:1,advisory_provider:1});
  const b=r.repositories.items.find(i=>i.repository===repo('blocked-b'))!;
  expect(b.verdict).toBe('Blocked');expect(b.gaps).toContain('advisory_provider');
  expect((b as unknown as {omissions:{path:string;reason:string}[]}).omissions).toEqual([{path:'yarn.lock',reason:'Unsupported lockfile format',recorded:true},{path:'big/package-lock.json',reason:'Reason not recorded',recorded:false}]);
  const zero=await securityDashboard(q,actor,{view:'coverage',gap:'zero_dependencies'});if(!('repositories' in zero))throw Error();
  expect(zero.repositories.items.map(i=>i.repository).sort()).toEqual([repo('no-manifest'),repo('pkgjson')]);
 });
 it('returns evidence with prerequisites without leaking raw excerpts or request keys',async()=>{
  const r=await securityDashboard(q,actor,{advisory:'osv:GHSA-aaaa'});if(!('advisory' in r))throw Error();
  expect(r.advisory.prerequisites).toEqual({attackVector:'Network',attackComplexity:'Low',privilegesRequired:'None',userInteraction:'None',scope:'Unchanged'});
  expect(r.advisory.occurrenceList.map(o=>o.manifest).sort()).toEqual(['apps/web/package-lock.json','package-lock.json','package-lock.json']);
  const all=JSON.stringify([r,await securityDashboard(q,actor,{view:'process'}),await securityDashboard(q,actor,{view:'coverage'})]);
  expect(all).not.toContain('SECRET-EXCERPT');
  for(const e of entries)expect(all).not.toContain(e.requestKey);
 });
 it('reports lifecycle times from owner-scoped audit events only',async()=>{
  const r=await securityDashboard(q,actor,{view:'process'});if(!('process' in r))throw Error();
  expect(r.process.eventsRecorded).toBe(6);
  expect(r.process.medianWaitMs).toBe(120000);expect(r.process.medianRunMs).toBe(45000);
  const failed=r.process.entries.items.find(e=>e.repository===repo('failed'))!;
  expect(failed.failure).toMatch(/HTTP 422/);
  const skipped=await securityDashboard(q,actor,{view:'process',state:'skipped'});if(!('process' in skipped))throw Error();
  expect(skipped.process.entries.items.map(e=>e.repository)).toEqual([repo('empty')]);
 });
 it('isolates by owner and workspace and validates batch selection',async()=>{
  expect(await securityDashboard(q,other,{})).toEqual({batches:[],batch:null});
  expect(await securityDashboard(q,{...actor,workspaceId:'elsewhere'},{})).toEqual({batches:[],batch:null});
  await expect(securityDashboard(q,actor,{batch:'not-a-uuid'})).rejects.toMatchObject({status:400});
  await expect(securityDashboard(q,actor,{batch:randomUUID()})).rejects.toMatchObject({status:404});
  await expect(securityDashboard(q,actor,{advisory:'osv:NOPE'})).rejects.toMatchObject({status:404});
 });
 it('paginates repository lists',async()=>{
  const r=await securityDashboard(q,actor,{view:'repositories',page:'9'});if(!('repositories' in r))throw Error();
  expect(r.repositories).toMatchObject({total:6,page:1,pages:1});
  expect(r.repositories.items[0].verdict).toBe('Blocked');
 });
});

describe('pure helpers',()=>{
 it('never invents prerequisites or omission reasons',()=>{
  expect(exploitPrerequisites(null)).toBeNull();expect(exploitPrerequisites('CVSS:2.0/AV:N')).toBeNull();
  expect(omissionReasons(['x/package.json'],[])).toEqual([{path:'x/package.json',reason:'Reason not recorded',recorded:false}]);
 });
 it('keeps empty throughput buckets and handles missing lifecycle events',()=>{
  const b=throughput([{jobId:'a',type:'scan_completed',at:'2026-10-28T09:00:00Z'},{jobId:'b',type:'scan_failed',at:'2026-10-28T10:10:00Z'}]);
  expect(b.map(x=>[x.completed,x.failed])).toEqual([[1,0],[0,0],[0,1]]);
  expect(lifecycle([])).toMatchObject({waitMs:null,runMs:null,starts:0});
 });
 it('tolerates missing report fields',()=>{
  const row:EntryRow={position:1,repository:'r',skipReason:null,jobState:'completed',failureCode:null,jobCreatedAt:null,updatedAt:null,reportId:'id',reportCreatedAt:null,verdict:'Incomplete',commit:null,manifests:null,omitted:null,refreshedFrom:null,dependencyCount:null,dependenciesByManifest:null,checks:null,findings:null};
  expect(summarize(row)).toMatchObject({verdict:'Incomplete',stage:'no_scanned_manifest',dependencyCount:0,gaps:['zero_dependencies','no_manifest_found']});
  expect(summarize({...row,verdict:'Something else'}).verdict).toBeNull();
 });
});
