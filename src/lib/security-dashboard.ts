import {batchStates,type BatchState} from './batch-progress';

/** Severity and verdict vocabularies are the scanner's own; nothing here invents a score. */
export type Severity='high'|'medium'|'low'|'review';
export const severities:Severity[]=['high','medium','low','review'];
export type Verdict='Blocked'|'Review required'|'Incomplete'|'Checks passed';
export const verdicts:Verdict[]=['Blocked','Review required','Incomplete','Checks passed'];

/** Trimmed per-finding evidence selected server-side; raw excerpts never leave the server. */
export type FindingRow={id:string;title:string;severity:Severity;severitySource?:string|null;cvss?:number|null;cvssVector?:string|null;fixedVersion?:string|null;
 url?:string|null;kind?:string|null;location?:string|null;retrievedAt?:string|null;dependency?:{name:string;version:string;ecosystem:string;path:string}|null};
export type CheckRow={name:string;state:string;detail:string};
/** One selected batch entry joined with its job and the job's CURRENT report revision. */
export type EntryRow={position:number;repository:string;skipReason:string|null;jobState:string|null;failureCode:string|null;jobCreatedAt:string|null;updatedAt:string|null;
 reportId:string|null;reportCreatedAt:string|null;verdict:string|null;commit:string|null;manifests:string[]|null;omitted:string[]|null;refreshedFrom:string|null;
 dependencyCount:number|null;dependenciesByManifest:Record<string,number>|null;checks:CheckRow[]|null;findings:FindingRow[]|null};

export type CoverageStage='no_scanned_manifest'|'zero_resolved'|'partial'|'complete';
export const stageLabels:Record<CoverageStage,string>={no_scanned_manifest:'No supported manifest scanned',zero_resolved:'Manifests read, zero exact versions resolved',partial:'Some dependencies checked, coverage partial',complete:'All discovered supported manifests checked'};
export const gapCodes=['zero_dependencies','no_manifest_found','manifests_not_scanned','omitted_files','unsupported_lockfile','package_json_only','python_syntax','unresolved_versions','manifest_scan_failed','advisory_provider','deadline_or_limits'] as const;
export type GapCode=typeof gapCodes[number];
export const gapLabels:Record<GapCode,{label:string;explain:string}>={
 zero_dependencies:{label:'Zero dependencies checked',explain:'No exact dependency version reached the advisory lookup.'},
 no_manifest_found:{label:'No supported manifest found',explain:'Discovery found no package-lock.json, package.json or requirements.txt.'},
 manifests_not_scanned:{label:'Manifests found, none scanned',explain:'Supported manifest paths were discovered but every one was omitted.'},
 omitted_files:{label:'Files omitted',explain:'At least one discovered dependency file was not checked. See per-file reasons.'},
 unsupported_lockfile:{label:'Unsupported lockfile format',explain:'yarn.lock, pnpm-lock.yaml, poetry.lock, uv.lock, Cargo.lock, go.sum or Gemfile.lock are not parsed.'},
 package_json_only:{label:'package.json without lockfile',explain:'package.json does not resolve transitive dependencies; ranges are not exact versions.'},
 python_syntax:{label:'Unsupported Python syntax',explain:'Only exact == pins are resolved; markers, includes, URLs and options were skipped.'},
 unresolved_versions:{label:'Unresolved versions',explain:'Entries with ranges, workspace links or unsupported names were not resolved to exact versions.'},
 manifest_scan_failed:{label:'Manifest could not be scanned',explain:'Parsing or scanning a discovered manifest failed; no clean result is implied.'},
 advisory_provider:{label:'Advisory lookup failure',explain:'OSV package or advisory requests failed or returned partial results.'},
 deadline_or_limits:{label:'Deadline or size limit',explain:'A time budget, advisory budget or finding limit stopped part of the lookup.'},
};
const UNSUPPORTED_LOCKFILE=/(^|\/)(yarn\.lock|pnpm-lock\.yaml|uv\.lock|poetry\.lock|Cargo\.lock|go\.sum|Gemfile\.lock)$/;

export type Omission={path:string;reason:string;recorded:boolean};
/** Only reasons the stored report actually supports; everything else is "Reason not recorded". */
export function omissionReasons(omitted:string[],checks:CheckRow[]):Omission[]{
 return omitted.map(path=>{
  if(UNSUPPORTED_LOCKFILE.test(path))return {path,reason:'Unsupported lockfile format',recorded:true};
  const scanCheck=checks.find(c=>c.name===`${path} — scan`);
  if(scanCheck&&/time budget/i.test(scanCheck.detail))return {path,reason:'Repository time budget exhausted',recorded:true};
  if(scanCheck)return {path,reason:'Manifest could not be parsed or scanned',recorded:true};
  return {path,reason:'Reason not recorded',recorded:false};
 });
}

export type RepoSummary={position:number;repository:string;state:BatchState;failureCode:string|null;updatedAt:string|null;jobCreatedAt:string|null;
 reportId:string|null;reportCreatedAt:string|null;verdict:Verdict|null;commit:string|null;refreshed:boolean;
 manifests:string[];omissions:Omission[];dependencyCount:number;stage:CoverageStage|null;gaps:GapCode[];
 severityCounts:Record<Severity,number>;advisoryCount:number};

export function entryState(row:EntryRow):BatchState{
 // An accepted job takes precedence over a stale skip annotation (same rule as batch progress).
 const state=row.jobState||(row.skipReason==='empty_repository'?'skipped':'waiting');
 if(!(batchStates as readonly string[]).includes(state))throw Error('Unknown batch job state.');
 return state as BatchState;
}
export const advisoryIdOf=(f:FindingRow)=>{const m=f.url?.match(/^https:\/\/osv\.dev\/vulnerability\/([A-Za-z0-9._-]{1,160})$/);return m?m[1]:null;};

export function summarize(row:EntryRow):RepoSummary{
 const state=entryState(row),hasReport=state==='completed'&&!!row.reportId&&!!row.verdict;
 const checks=row.checks||[],manifests=row.manifests||[],findings=row.findings||[];
 const severityCounts={high:0,medium:0,low:0,review:0} as Record<Severity,number>;
 const advisories=new Set<string>();
 for(const f of findings){if(severities.includes(f.severity))severityCounts[f.severity]++;advisories.add(advisoryIdOf(f)||`pattern:${f.title}`);}
 const dependencyCount=row.dependencyCount||0,omissions=omissionReasons(row.omitted||[],checks);
 let stage:CoverageStage|null=null;const gaps:GapCode[]=[];
 if(hasReport){
  const coverageIncomplete=checks.some(c=>c.state==='incomplete');
  stage=!manifests.length?'no_scanned_manifest':!dependencyCount?'zero_resolved':coverageIncomplete||omissions.length?'partial':'complete';
  const details=checks.map(c=>c.detail).join('\n');
  const add=(code:GapCode,when:boolean)=>{if(when)gaps.push(code);};
  add('zero_dependencies',!dependencyCount);
  add('no_manifest_found',!manifests.length&&!omissions.length);
  add('manifests_not_scanned',!manifests.length&&omissions.length>0);
  add('omitted_files',omissions.length>0);
  add('unsupported_lockfile',omissions.some(o=>o.reason==='Unsupported lockfile format'));
  add('package_json_only',/package\.json does not resolve transitive/.test(details));
  add('python_syntax',/only exact Python pins are supported/.test(details));
  add('unresolved_versions',/unresolved version|workspace or malformed|linked workspace dependency|No supported exact dependency versions/.test(details));
  add('manifest_scan_failed',omissions.some(o=>o.reason==='Manifest could not be parsed or scanned'));
  add('advisory_provider',/package_lookup_failed|advisory_lookup_failed|query_response_mismatch|pagination|Lookup failed/.test(details));
  add('deadline_or_limits',/\bdeadline\b|advisory_limit|finding_limit|time budget|exceeded its advisory budget/.test(details));
 }
 return {position:row.position,repository:row.repository,state,failureCode:row.failureCode,updatedAt:row.updatedAt,jobCreatedAt:row.jobCreatedAt,
  reportId:hasReport?row.reportId:null,reportCreatedAt:hasReport?row.reportCreatedAt:null,verdict:hasReport&&verdicts.includes(row.verdict as Verdict)?row.verdict as Verdict:null,
  commit:row.commit,refreshed:!!row.refreshedFrom,manifests,omissions,dependencyCount,stage,gaps,severityCounts,advisoryCount:hasReport?advisories.size:0};
}

export type Occurrence={repository:string;reportId:string;findingId:string;manifest:string|null;version:string|null;fixedVersion:string|null;location:string|null;url:string|null;retrievedAt:string|null};
export type AdvisoryGroup={key:string;advisoryId:string|null;title:string;severity:Severity;severitySources:string[];cvss:number|null;cvssVector:string|null;
 packages:{ecosystem:string;name:string;installed:{version:string;fixedVersions:string[];repositories:number}[]}[];
 repositories:string[];occurrenceCount:number;occurrences:Occurrence[]};

const order:Record<Severity,number>={high:0,medium:1,low:2,review:3};
function manifestOf(path:string|undefined,manifests:string[]){if(!path)return null;return manifests.find(m=>path.startsWith(`${m}:`))||path.split(':')[0]||null;}

/** One group per advisory (or credential pattern); repositories and occurrences are kept distinct. */
export function groupFindings(rows:EntryRow[],summaries:Map<string,RepoSummary>):AdvisoryGroup[]{
 const groups=new Map<string,AdvisoryGroup&{_pk:Map<string,Map<string,{fixed:Set<string>;repos:Set<string>}>>;_repos:Set<string>;_sources:Set<string>}>();
 for(const row of rows){
  const s=summaries.get(row.repository);if(!s?.reportId)continue;
  for(const f of row.findings||[]){
   const advisoryId=advisoryIdOf(f),key=advisoryId?`osv:${advisoryId}`:`pattern:${f.title}`;
   let g=groups.get(key);
   if(!g){g={key,advisoryId,title:f.title,severity:f.severity,severitySources:[],cvss:null,cvssVector:null,packages:[],repositories:[],occurrenceCount:0,occurrences:[],_pk:new Map(),_repos:new Set(),_sources:new Set()};groups.set(key,g);}
   if(order[f.severity]<order[g.severity])g.severity=f.severity;
   if(f.severitySource)g._sources.add(f.severitySource);
   if(typeof f.cvss==='number'&&(g.cvss===null||f.cvss>g.cvss)){g.cvss=f.cvss;g.cvssVector=f.cvssVector||null;}
   g._repos.add(row.repository);g.occurrenceCount++;
   const d=f.dependency;
   if(d){const pk=`${d.ecosystem}\u0000${d.name}`;let versions=g._pk.get(pk);if(!versions){versions=new Map();g._pk.set(pk,versions);}
    let v=versions.get(d.version);if(!v){v={fixed:new Set(),repos:new Set()};versions.set(d.version,v);}
    if(f.fixedVersion)v.fixed.add(f.fixedVersion);v.repos.add(row.repository);}
   g.occurrences.push({repository:row.repository,reportId:s.reportId,findingId:f.id,manifest:manifestOf(d?.path,s.manifests),version:d?.version??null,fixedVersion:f.fixedVersion??null,location:f.location??null,url:f.url??null,retrievedAt:f.retrievedAt??null});
  }
 }
 return [...groups.values()].map(({_pk,_repos,_sources,...g})=>({...g,severitySources:[..._sources].sort(),repositories:[..._repos].sort(),
  packages:[..._pk].map(([pk,versions])=>{const [ecosystem,name]=pk.split('\u0000');return {ecosystem,name,installed:[...versions].map(([version,v])=>({version,fixedVersions:[...v.fixed].sort(),repositories:v.repos.size})).sort((a,b)=>a.version.localeCompare(b.version,undefined,{numeric:true}))};}).sort((a,b)=>a.name.localeCompare(b.name))}));
}

/** The documented "fix first" ordering. It is a sort order over recorded facts, not a risk score. */
export function fixFirstOrder(a:AdvisoryGroup,b:AdvisoryGroup){
 return order[a.severity]-order[b.severity]||b.repositories.length-a.repositories.length||(b.cvss??-1)-(a.cvss??-1)
  ||Number(hasFix(b))-Number(hasFix(a))||b.occurrenceCount-a.occurrenceCount||a.key.localeCompare(b.key);
}
export const hasFix=(g:AdvisoryGroup)=>g.packages.some(p=>p.installed.some(i=>i.fixedVersions.length));
export function repositoryOrder(a:RepoSummary,b:RepoSummary){
 const rank=(s:RepoSummary)=>s.verdict==='Blocked'?0:s.verdict==='Review required'?1:s.verdict==='Incomplete'?2:s.verdict==='Checks passed'?3:4;
 return rank(a)-rank(b)||b.severityCounts.high-a.severityCounts.high||b.severityCounts.medium-a.severityCounts.medium||a.dependencyCount-b.dependencyCount||a.position-b.position;
}

/** CVSS v3 base metrics that describe exploit prerequisites. Absent vector → nothing claimed. */
export function exploitPrerequisites(vector:string|null|undefined){
 if(!vector||!/^CVSS:3\.[01]\//.test(vector))return null;
 const m=Object.fromEntries(vector.split('/').slice(1).map(p=>p.split(':')));
 const map:Record<string,Record<string,string>>={AV:{N:'Network',A:'Adjacent network',L:'Local',P:'Physical'},AC:{L:'Low',H:'High'},PR:{N:'None',L:'Low',H:'High'},UI:{N:'None',R:'Required'},S:{U:'Unchanged',C:'Changed'}};
 const get=(k:string)=>map[k][m[k]]||'Not recorded';
 return {attackVector:get('AV'),attackComplexity:get('AC'),privilegesRequired:get('PR'),userInteraction:get('UI'),scope:get('S')};
}

export type Overview={batch:{id:string;title:string;createdAt:string;total:number};checkedAt:string;
 operational:Record<BatchState,number>&{accepted:number;finished:number};
 verdicts:{denominator:number;counts:Record<Verdict,number>;missingReports:number};
 incomplete:{denominator:number;counts:Record<Exclude<CoverageStage,'complete'>,number>};
 gaps:{denominator:number;counts:Record<GapCode,number>};
 pipeline:{reports:number;manifestScanned:number;versionsResolved:number;lookupComplete:number};
 findings:{uniqueAdvisories:number;affectedRepositories:number;occurrences:number;bySeverity:Record<Severity,number>};
 freshness:{latestReportAt:string|null;latestJobUpdateAt:string|null;refreshedReports:number};
 active:boolean};

export function overview(batch:Overview['batch'],summaries:RepoSummary[],groups:AdvisoryGroup[],checkedAt:string):Overview{
 const operational={...Object.fromEntries(batchStates.map(s=>[s,0])),accepted:0,finished:0} as Overview['operational'];
 const verdictCounts=Object.fromEntries(verdicts.map(v=>[v,0])) as Record<Verdict,number>;
 const incompleteCounts={no_scanned_manifest:0,zero_resolved:0,partial:0};
 const gapCounts=Object.fromEntries(gapCodes.map(g=>[g,0])) as Record<GapCode,number>;
 const pipeline={reports:0,manifestScanned:0,versionsResolved:0,lookupComplete:0};
 let reports=0,missing=0,incomplete=0,refreshed=0,latestReportAt:string|null=null,latestJobUpdateAt:string|null=null;
 for(const s of summaries){
  operational[s.state]++;if(!['waiting','skipped'].includes(s.state))operational.accepted++;
  if(s.updatedAt&&s.state!=='skipped'&&(!latestJobUpdateAt||s.updatedAt>latestJobUpdateAt))latestJobUpdateAt=s.updatedAt;
  if(s.state==='completed'&&!s.verdict)missing++;
  if(!s.verdict)continue;
  reports++;verdictCounts[s.verdict]++;if(s.refreshed)refreshed++;
  if(s.reportCreatedAt&&(!latestReportAt||s.reportCreatedAt>latestReportAt))latestReportAt=s.reportCreatedAt;
  for(const g of s.gaps)gapCounts[g]++;
  if(s.manifests.length)pipeline.manifestScanned++;
  if(s.dependencyCount>0){pipeline.versionsResolved++;if(!s.gaps.includes('advisory_provider')&&!s.gaps.includes('deadline_or_limits'))pipeline.lookupComplete++;}
  if(s.verdict==='Incomplete'&&s.stage&&s.stage!=='complete'){incomplete++;incompleteCounts[s.stage]++;}
 }
 operational.finished=operational.completed+operational.failed+operational.cancelled+operational.skipped;
 const bySeverity={high:0,medium:0,low:0,review:0} as Record<Severity,number>;
 for(const g of groups)bySeverity[g.severity]++;
 return {batch,checkedAt,operational,verdicts:{denominator:reports,counts:verdictCounts,missingReports:missing},
  incomplete:{denominator:verdictCounts.Incomplete,counts:incompleteCounts},gaps:{denominator:reports,counts:gapCounts},pipeline:{...pipeline,reports},
  findings:{uniqueAdvisories:groups.length,affectedRepositories:new Set(groups.flatMap(g=>g.repositories)).size,occurrences:groups.reduce((n,g)=>n+g.occurrenceCount,0),bySeverity},
  freshness:{latestReportAt,latestJobUpdateAt,refreshedReports:refreshed},active:operational.waiting+operational.queued+operational.running>0};
}

export const failureExplanations:Record<string,string>={
 unsupported_repository:'Discovery rejected this repository (HTTP 422), for example a tree larger than the 10,000-entry bound. No report was produced.',
 provider_unavailable:'A provider was unavailable for this job. No report was produced.',
 scan_failed:'The worker could not finish this scan. Provider bodies are not stored, so no further detail is available.',
 retry_exhausted:'The job used all three attempts without saving a report.',
};

/** Job lifecycle from the append-only workspace audit log. Per-stage (discovery/parse/OSV) timing is not recorded. */
export type JobEvent={jobId:string;type:string;at:string};
export type Lifecycle={queuedAt:string|null;firstStartedAt:string|null;lastStartedAt:string|null;finishedAt:string|null;starts:number;
 waitMs:number|null;runMs:number|null};
export function lifecycle(events:JobEvent[]):Lifecycle{
 const at=(t:string)=>events.filter(e=>e.type===t).map(e=>e.at).sort();
 const queued=at('scan_queued')[0]??null,starts=at('scan_started'),terminal=[...at('scan_completed'),...at('scan_failed'),...at('scan_cancelled'),...at('scan_retry_exhausted')].sort().at(-1)??null;
 const first=starts[0]??null,last=starts.at(-1)??null,ms=(a:string|null,b:string|null)=>a&&b&&b>=a?Date.parse(b)-Date.parse(a):null;
 return {queuedAt:queued,firstStartedAt:first,lastStartedAt:last,finishedAt:terminal,starts:starts.length,waitMs:ms(queued,first),runMs:ms(last,terminal)};
}
export function median(values:number[]){if(!values.length)return null;const v=[...values].sort((a,b)=>a-b),m=v.length>>1;return v.length%2?v[m]:(v[m-1]+v[m])/2;}
/** Terminal events per fixed bucket; buckets with no events are kept so gaps remain visible. */
export function throughput(events:JobEvent[],bucketMs=30*60000){
 const terminal=events.filter(e=>['scan_completed','scan_failed','scan_retry_exhausted','scan_cancelled'].includes(e.type));
 if(!terminal.length)return [];
 const times=terminal.map(e=>Date.parse(e.at)),start=Math.floor(Math.min(...times)/bucketMs)*bucketMs,end=Math.max(...times);
 const buckets:{start:string;completed:number;failed:number}[]=[];
 for(let t=start;t<=end&&buckets.length<200;t+=bucketMs)buckets.push({start:new Date(t).toISOString(),completed:0,failed:0});
 for(const e of terminal){const i=Math.floor((Date.parse(e.at)-start)/bucketMs);const b=buckets[i];if(!b)continue;if(e.type==='scan_completed')b.completed++;else b.failed++;}
 return buckets;
}
export const explainFailure=(code:string|null)=>code?failureExplanations[code]||`Recorded failure code “${code}”. No further detail was stored.`:'No failure code was recorded.';

/** Ranking uses recorded facts only. Fix availability can cover only some installed versions. */
export const remediationModes=['widespread','severity','fixable'] as const;
export type RemediationMode=typeof remediationModes[number];
export const remediationLabels:Record<RemediationMode,string>={widespread:'Most widespread',severity:'Highest reported severity',fixable:'Fix available'};
export const remediationDescriptions:Record<RemediationMode,string>={
 widespread:'Affected repositories first, then reported severity and CVSS. Reachability and deployment exposure are unknown.',
 severity:'Reported severity first, then CVSS and affected repositories. Advisory severity and CVSS can differ.',
 fixable:'Only advisories with a recorded fix for at least one installed version, ordered by affected repositories. A fix may not cover every occurrence.'
};
export function remediationQueue(groups:AdvisoryGroup[],mode:RemediationMode){
 return groups.filter(g=>mode!=='fixable'||hasFix(g)).sort((a,b)=>
  (mode==='severity' ? order[a.severity]-order[b.severity]||(b.cvss??-1)-(a.cvss??-1)||b.repositories.length-a.repositories.length
   : b.repositories.length-a.repositories.length||order[a.severity]-order[b.severity]||(b.cvss??-1)-(a.cvss??-1))
  ||b.occurrenceCount-a.occurrenceCount||a.key.localeCompare(b.key));
}
export const recoveryGuidance:Record<GapCode,{title:string;action:string}>={
 no_manifest_found:{title:'Check discovery and ecosystem',action:'Inspect the scanned commit and repository layout. If it contains dependencies, check whether their manifest format is supported. An unsupported ecosystem needs scanner support; a repository without dependencies may have nothing to resolve.'},
 manifests_not_scanned:{title:'Review unscanned manifests',action:'Inspect the omitted paths and recorded reasons. Resolve unsupported formats, parsing failures or scan limits before requesting another scan.'},
 unsupported_lockfile:{title:'Resolve lockfile support',action:'Check the omitted lockfile format. Use a scanner that supports that format, or add parser support. Do not replace the project’s package manager merely to obtain a passing report.'},
 package_json_only:{title:'Provide resolved npm dependencies',action:'For npm projects, commit the matching package-lock.json v2 or v3 generated by the project’s normal install workflow. package.json alone does not resolve the transitive dependency tree.'},
 python_syntax:{title:'Resolve Python dependency inputs',action:'Review markers, includes, URLs and options in the listed requirements files. Provide a reproducible exact-version dependency export for the intended environment, or extend parser support; do not discard environment constraints.'},
 unresolved_versions:{title:'Provide exact installed versions',action:'Review unresolved declarations in the report. Supply the project’s reproducible resolved dependency inputs in a supported format before scanning again.'},
 manifest_scan_failed:{title:'Diagnose the manifest failure',action:'Open the report and inspect the failing path and recorded scan error. Correct malformed input or scanner handling before requesting another scan.'},
 advisory_provider:{title:'Restore advisory lookup coverage',action:'Review the failed advisory checks and provider availability. Once resolved, request a controlled lookup refresh from saved exact dependencies where supported, or a new scan. No refresh has been started here.'},
 deadline_or_limits:{title:'Review the scan budget',action:'Inspect recorded file, dependency and time limits. Adjust the supported scan scope or worker budget before requesting another scan; do not silently omit dependencies.'},
 omitted_files:{title:'Inspect omitted files',action:'Expand manifest evidence to inspect each omitted path. Where the reason is missing, inspect the original report or worker diagnostics before choosing a recovery action.'},
 zero_dependencies:{title:'Diagnose zero resolved dependencies',action:'No exact dependencies were checked. Inspect manifest discovery and parsing evidence before treating this report as a security result.'}
};
export function recoveryActions(gaps:GapCode[]){
 const specific=gaps.filter(g=>!['zero_dependencies','omitted_files','manifests_not_scanned'].includes(g));
 // Keep unclassified omissions visible even when a different, specific gap is present.
 const selected=[...specific,...gaps.filter(g=>g==='omitted_files'),...(!specific.length?gaps.filter(g=>g==='manifests_not_scanned'):[])];
 if(!selected.length&&gaps.includes('zero_dependencies'))selected.push('zero_dependencies');
 return [...new Set(selected)].map(code=>({code,...recoveryGuidance[code]}));
}
