import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import {securityDashboard} from '../../src/lib/server/security-dashboard';
import type {Query} from '../../src/lib/server/db';

/** EXPLICITLY SYNTHETIC: repository names, advisories, versions and timestamps are invented for screenshots.
 * The shape mirrors the historical acceptance distribution; the dashboard derives every number itself. */
export const actor={id:'github:1',workspaceId:'synthetic',role:'member' as const};
let seq=0;const uuid=()=>`00000000-0000-4000-8000-${String(++seq).padStart(12,'0')}`;
const adv=[['GHSA-syn1-0001-aaaa','example-merge-utils','high','4.17.21',9.1,'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N'],['GHSA-syn1-0002-bbbb','example-http-client','high','1.7.4',7.5,'CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:U/C:H/I:H/A:H'],
 ['GHSA-syn1-0003-cccc','example-template-engine','high',null,8.1,'CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:H'],['GHSA-syn1-0004-dddd','example-yaml-parser','medium','2.2.2',5.3,'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:L'],
 ['GHSA-syn1-0005-eeee','example-path-matcher','medium','0.1.12',null,null],['PYSEC-syn1-0006','example-image-lib','high','10.3.0',7.8,'CVSS:3.1/AV:L/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:H'],['GHSA-syn1-0007-ffff','example-cookie-parser','low','0.7.0',3.7,null]] as const;
const words=['checkout','billing-service','kitchen-display','delivery-router','menu-api','auth-gateway','inventory','analytics-pipeline','mobile-app','web-storefront','partner-portal','notifications'];
export function repoName(i:number){return i===7?'example-org/a-very-long-repository-name-for-the-internal-platform-migration-tooling-v2':`example-org/${words[i%words.length]}-${String(i).padStart(3,'0')}`;}

export async function buildFixture({active=false}:{active?:boolean}={}){
 seq=0;const db=new PGlite(),q:Query=async(sql,args=[])=>(await db.query(sql,args)).rows as Record<string,unknown>[];
 for(const f of ['001_core','002_hosted_jobs','003_workspaces','004_team_sharing','010_batch_dashboard'])await db.exec(readFileSync(`migrations/${f}.sql`,'utf8'));
 await q("INSERT INTO sc_workspaces(id,owner_id,name) VALUES($1,$2,'Synthetic')",[actor.workspaceId,actor.id]);
 await q("INSERT INTO sc_scan_allowances(workspace_id,period_start,scan_limit,reserved) VALUES($1,current_date,500,207)",[actor.workspaceId]);
 const entries=Array.from({length:215},(_,i)=>({repository:repoName(i),requestKey:uuid(),...(i>=207?{skipReason:'empty_repository',skipCheckedAt:'2026-10-20T08:00:00.000Z'}:{})}));
 await q("INSERT INTO sc_batch_plans(id,workspace_id,owner_id,title,entries,created_at) VALUES($1,$2,$3,'Synthetic org · 215 repositories',$4::jsonb,'2026-10-20T07:55:00Z')",[uuid(),actor.workspaceId,actor.id,JSON.stringify(entries)]);
 const t0=Date.parse('2026-10-20T08:00:00Z');
 for(let i=0;i<207;i++){
  const id=uuid(),repo=entries[i].repository;let state='completed',failure:string|null=null,reportId:string|null=null;
  if(i>=200){state='failed';failure=i<204?'unsupported_repository':'scan_failed';}
  if(active&&i>=150&&i<200)state=i<170?'queued':i<172?'running':state;
  const activeWaiting=active&&i>=175&&i<200;
  if(activeWaiting)continue;
  if(state==='completed'){reportId=uuid();await q('INSERT INTO sc_scans(id,workspace_id,owner_id,report,created_at) VALUES($1,$2,$3,$4::jsonb,$5)',[reportId,actor.workspaceId,actor.id,JSON.stringify(report(i)),new Date(t0+i*95000).toISOString()]);}
  await q(`INSERT INTO sc_scan_jobs(id,workspace_id,owner_id,request_key,repository,commit_sha,period_start,state,report_id,failure_code,created_at,updated_at) VALUES($1,$2,$3,$4,$5,'0000000',current_date,$6,$7,$8,$9,$10)`,
   [id,actor.workspaceId,actor.id,entries[i].requestKey,repo,state,reportId,failure,new Date(t0+i*4000).toISOString(),new Date(t0+i*95000+60000).toISOString()]);
  const ev=(type:string,ms:number)=>q('INSERT INTO sc_workspace_events(workspace_id,actor_id,event_type,subject_id,created_at) VALUES($1,$2,$3,$4,$5)',[actor.workspaceId,actor.id,type,id,new Date(ms).toISOString()]);
  await ev('scan_queued',t0+i*4000);
  if(state!=='queued'){await ev('scan_started',t0+i*95000);if(state==='completed'||state==='failed')await ev(state==='completed'?'scan_completed':'scan_failed',t0+i*95000+20000+(i%7)*9000);}
 }
 return {q,close:()=>db.close()};
}
// 95 Blocked (0–94), 4 passed (95–98), 101 Incomplete (99–199): 73 no manifest, 22 zero resolved, 6 partial.
function report(i:number){
 const manifests:string[]=[],omitted:string[]=[],dependencies:object[]=[],findings:object[]=[],checks:object[]=[];let status='Incomplete';
 const lock=i%9===0?'apps/web/package-lock.json':'package-lock.json';
 const addDeps=(m:string,count:number)=>{for(let d=0;d<count;d++)dependencies.push({name:`dep-${d}`,version:'1.0.0',ecosystem:'npm',path:`${m}:node_modules/dep-${d}`});};
 if(i<95){status='Blocked';manifests.push(lock);addDeps(lock,40+i%60);
  const picks=[0,i%3===0?1:null,i%5===0?2:null,i%2===0?3:null,i%4===0?4:null,i%11===0?5:null,i%6===0?6:null].filter((x):x is number=>x!==null);
  if(!picks.some(p=>adv[p][2]==='high'))picks.push(0);
  for(const p of picks){const [id,pkg,sev,fix,cvss,vector]=adv[p];const version=p===0?(i%4===0?'4.17.15':'4.17.20'):'1.0.0';
   findings.push({id:`${lock}:${id}:${pkg}@${version}`,title:`Synthetic advisory for ${pkg}`,severity:sev,severitySource:cvss?`CVSS ${cvss}`:'Severity not provided',cvss:cvss??undefined,cvssVector:vector??undefined,fixedVersion:fix??undefined,description:'Synthetic.',action:'Synthetic.',
    evidence:[{kind:'advisory',dependency:{name:pkg,version,ecosystem:p===5?'PyPI':'npm',path:`${lock}:node_modules/${pkg}`},location:`${lock}: node_modules/${pkg}`,excerpt:'Synthetic excerpt.',url:`https://osv.dev/vulnerability/${id}`,retrievedAt:'2026-10-20T09:00:00.000Z'}]});}
  checks.push({name:`${lock} — OSV advisories`,state:i%10===0?'incomplete':'complete',detail:i%10===0?'Coverage gaps: advisory_lookup_failed.':'Queried all.'});
  if(i%8===0){omitted.push('yarn.lock');}
  if(i%13===0){manifests.push('package.json');checks.push({name:'package.json — Dependency coverage',state:'incomplete',detail:'package.json does not resolve transitive dependencies. Supply package-lock.json v2/v3 for broader coverage.'});}
 }else if(i<99){status='Checks passed';manifests.push('package-lock.json');addDeps('package-lock.json',25);checks.push({name:'package-lock.json — OSV advisories',state:'complete',detail:'Queried all.'});}
 else if(i<172){if(i%5===0)omitted.push('pnpm-lock.yaml');if(i%17===0)omitted.push('tools/package.json');checks.push({name:'Repository manifest coverage',state:'incomplete',detail:'No supported dependency manifest was found.'});}
 else if(i<194){const py=i%3===0;manifests.push(py?'requirements.txt':'package.json');
  checks.push({name:`${manifests[0]} — Dependency coverage`,state:'incomplete',detail:py?'Line 2: only exact Python pins are supported; markers, includes, URLs and options were not resolved. No supported exact dependency versions were found.':'package.json does not resolve transitive dependencies. Supply package-lock.json v2/v3 for broader coverage.'});}
 else{manifests.push('requirements.txt');addDeps('requirements.txt',6);omitted.push('services/worker/requirements.txt');
  checks.push({name:'requirements.txt — Dependency coverage',state:'incomplete',detail:'Line 9: only exact Python pins are supported; markers, includes, URLs and options were not resolved.'});
  checks.push({name:'services/worker/requirements.txt — scan',state:'incomplete',detail:'Manifest could not be scanned; no clean result is implied.'});}
 checks.push({name:'Source-code and Git-history audit',state:'not-in-scope',detail:'Not covered.'});
 return {id:`r${i}`,mode:'live',createdAt:'2026-10-20T09:00:00.000Z',status,dependencies,findings,checks,sources:[],explanations:[],durationMs:1,policy:'p',
  repositoryScan:{repository:repoName(i),commit:'0000000',scannerVersion:'0.1.1',manifests,omitted,...(i%7===0&&i<95?{advisoryRefresh:{previousReportId:'old',refreshedAt:'2026-10-20T12:00:00.000Z'}}:{})}};
}
export async function respond(q:Query,url:string){
 const p=new URL(url).searchParams,get=(k:string)=>p.get(k);
 return securityDashboard(q,actor,{sort:get('sort'),recovery:get('recovery'),batch:get('batch'),view:get('view'),q:get('q'),severity:get('severity'),verdict:get('verdict'),gap:get('gap'),stage:get('stage'),state:get('state'),advisory:get('advisory'),page:get('page')},new Date('2026-10-20T14:00:00Z'));
}
