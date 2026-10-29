'use client';
import {Filter as UiFilter,ChevronLeft as UiChevronLeft,ChevronRight as UiChevronRight,X as UiX,ListChecks as UiListChecks,ShieldAlert as UiShieldAlert,ScanSearch as UiScanSearch,ScanLine as UiScanLine} from 'lucide-react';

import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {ArrowUpRight,Search,X,Wrench,FileSearch} from 'lucide-react';
import {batchLabels,batchStates,type BatchState} from '@/lib/batch-progress';
import {remediationModes,remediationLabels,remediationDescriptions,recoveryActions,type RemediationMode,gapCodes,gapLabels,stageLabels,severities,verdicts,type GapCode,type Severity,type Verdict,type CoverageStage} from '@/lib/security-dashboard';
import type {Loaded,Nav} from './security-dashboard';
import styles from './security.module.css';

type Of<K extends string>=Extract<Loaded,Record<K,unknown>>;
type Segment={key:string;label:string;count:number;tone:string;onSelect?:()=>void};
const pct=(n:number,d:number)=>d?`${(n/d*100).toFixed(n/d<.1&&n?1:0)}%`:'—';
const sevLabel:Record<Severity,string>={high:'High',medium:'Medium',low:'Low',review:'Unrated'};
const verdictTone:Record<Verdict,string>={Blocked:'high','Review required':'medium',Incomplete:'incomplete','Checks passed':'passed'};
const stateTone:Record<BatchState,string>={completed:'done',failed:'failed',cancelled:'failed',skipped:'skipped',waiting:'pending',queued:'pending',running:'running'};
const n=(v:number)=>v.toLocaleString('en-GB');
const duration=(ms:number|null)=>ms===null?'Not recorded':ms<1000?`${ms} ms`:ms<60000?`${(ms/1000).toFixed(1)} s`:ms<3600000?`${Math.floor(ms/60000)} min ${Math.round(ms%60000/1000)} s`:`${Math.floor(ms/3600000)} h ${Math.round(ms%3600000/60000)} min`;
const when=(v:string|null)=>v?new Date(v).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):'—';
const reportHref=(id:string)=>`/reports/${encodeURIComponent(id)}`;

/** Proportional bar with a full text legend; every segment is a real filter link. */
function StackBar({title,caption,denominator,segments}:{title:string;caption:string;denominator:number;segments:Segment[]}){
 return <figure className={styles.stack}>
  <figcaption><span className={styles.figTitle}>{title}</span><span className={styles.figCaption}>{caption}</span></figcaption>
  <div className={styles.bar} aria-hidden="true">{segments.filter(s=>s.count>0).map(s=><span key={s.key} data-tone={s.tone} style={{flexGrow:s.count}} title={`${s.label}: ${s.count} of ${denominator}`}/>)}</div>
  <ul className={styles.legend}>{segments.map(s=><li key={s.key}>
   {s.onSelect&&s.count>0?<button type="button" onClick={s.onSelect} aria-label={`${s.label}: ${s.count} of ${denominator}. Show these`}><UiFilter size={16} aria-hidden="true" className="action-icon"/><Swatch tone={s.tone}/><span>{s.label}</span><strong>{n(s.count)}</strong><small>{pct(s.count,denominator)}</small></button>
    :<span className={styles.legendStatic}><Swatch tone={s.tone}/><span>{s.label}</span><strong>{n(s.count)}</strong><small>{pct(s.count,denominator)}</small></span>}
  </li>)}</ul>
 </figure>;
}
const Swatch=({tone}:{tone:string})=><i className={styles.swatch} data-tone={tone} aria-hidden="true"/>;
export const SeverityTag=({level}:{level:Severity})=><span className={`severity ${level} ${styles.sev}`}>{sevLabel[level]}</span>;
const VerdictTag=({verdict}:{verdict:Verdict|null})=>verdict?<span className={styles.verdict} data-tone={verdictTone[verdict]}>{verdict}</span>:<span className={styles.muted}>No report</span>;

function SearchBox({value,label,onChange}:{value:string;label:string;onChange:(v:string)=>void}){
 const [text,setText]=useState(value);
 useEffect(()=>setText(value),[value]);
 useEffect(()=>{if(text===value)return;const t=setTimeout(()=>onChange(text),300);return()=>clearTimeout(t);},[text,value,onChange]);
 return <label className={styles.search}><Search size={16} aria-hidden="true"/><span className={styles.srOnly}>{label}</span><input type="search" placeholder={label} value={text} onChange={e=>setText(e.target.value)}/></label>;
}
function Segmented<T extends string>({label,value,options,onChange}:{label:string;value:T|null;options:{value:T|null;label:string;count?:number}[];onChange:(v:T|null)=>void}){
 return <div className={styles.segmented} role="group" aria-label={label}>{options.map(o=><button type="button" key={o.value??'all'} aria-pressed={value===o.value} onClick={()=>onChange(o.value)}><UiFilter size={16} aria-hidden="true" className="action-icon"/>{o.label}{o.count!==undefined&&<strong>{n(o.count)}</strong>}</button>)}</div>;
}
function Pager({page,pages,total,size,nav,noun}:{page:number;pages:number;total:number;size:number;nav:Nav;noun:string}){
 const from=total?(page-1)*size+1:0,to=Math.min(total,page*size);
 return <div className={styles.pager}><span>{total?`${n(from)}–${n(to)} of ${n(total)} ${noun}`:`0 ${noun}`}</span>{pages>1&&<span className={styles.pagerButtons}>
  <button className="button" disabled={page<=1} onClick={()=>nav({page:String(page-1)})}><UiChevronLeft size={16} aria-hidden="true" className="action-icon"/>Previous</button><span aria-live="polite">Page {page} of {pages}</span><button className="button" disabled={page>=pages} onClick={()=>nav({page:String(page+1)})}><UiChevronRight size={16} aria-hidden="true" className="action-icon"/>Next</button></span>}</div>;
}
function Clear({active,nav,keys}:{active:boolean;nav:Nav;keys:string[]}){return active?<button type="button" className={styles.linkButton} onClick={()=>nav(Object.fromEntries(keys.map(k=>[k,null])))}><UiX size={16} aria-hidden="true" className="action-icon"/>Clear filters</button>:null;}

function FixLine({g}:{g:{packages:{name:string;installed:{version:string;fixedVersions:string[];repositories:number}[];moreVersions?:number}[]}}){
 return <ul className={styles.fixList}>{g.packages.map(p=><li key={p.name}><code>{p.name}</code>{p.installed.map(i=><span key={i.version} className={styles.fixPair}><code>{i.version}</code><span aria-hidden="true">→</span>{i.fixedVersions.length?<code className={styles.fixed}>{i.fixedVersions.join(' / ')}</code>:<span className={styles.muted}>no fix recorded</span>}</span>)}{p.moreVersions?<span className={styles.muted}>+{p.moreVersions} more versions</span>:null}</li>)}</ul>;
}

function QueueRanking({value,nav}:{value:RemediationMode;nav:Nav}){
 return <div className={styles.ranking}><Segmented<RemediationMode> label="Rank remediation queue" value={value} options={remediationModes.map(value=>({value,label:remediationLabels[value]}))} onChange={sort=>nav({sort})}/><p className={styles.note}>{remediationDescriptions[value]}</p></div>;
}
function FixSummary({g}:{g:Of<'fixFirst'>['fixFirst'][number]}){
 return <div className={styles.fixSummary}><span className={styles.packageNames}>{g.packages.map(p=>p.name).join(' · ')}</span><span>{g.hasFix?'Fix recorded for some versions':'No fix recorded'}</span></div>;
}
function RecoverySteps({gaps}:{gaps:GapCode[]}){
 const actions=recoveryActions(gaps);
 return actions.length?<details className={styles.recoverySteps}><summary>{actions[0].title}{actions.length>1&&<small className={styles.source}>+{actions.length-1} more recovery {actions.length===2?'action':'actions'}</small>}</summary>{actions.map(a=><div key={a.code}><strong>{a.title}</strong><p>{a.action}</p></div>)}</details>:<span className={styles.muted}>No recorded dependency coverage gap. This does not establish full security coverage.</span>;
}

export function OverviewView({data,nav}:{data:Of<'fixFirst'>;nav:Nav}){
 const o=data.overview,op=o.operational;
 return <div className={styles.stackGap}>
  <div className={styles.batchStrip}><span><strong>{n(op.completed)} / {n(o.batch.total)}</strong> scans completed</span><button type="button" onClick={()=>nav({view:'process'})}><UiX size={16} aria-hidden="true" className="action-icon"/>{n(op.failed+op.cancelled)} failed or cancelled · {n(op.skipped)} skipped · {n(op.waiting+op.queued+op.running)} remaining</button><button type="button" onClick={()=>nav({view:'coverage',recovery:'needed'})}>Review coverage gaps <ArrowUpRight size={14} aria-hidden="true"/></button></div>
  <section className={styles.panel} aria-labelledby="first-h">
   <div className={styles.sectionHead}><div><h2 id="first-h" className={styles.sectionTitle}><Wrench size={18} aria-hidden="true"/>Remediation queue</h2><p className={styles.note}>Review each advisory across affected repositories.</p></div><button type="button" className={styles.linkButton} onClick={()=>nav({view:'findings'})}><UiListChecks size={16} aria-hidden="true" className="action-icon"/>Open full queue</button></div>
   <QueueRanking value={data.filters.sort} nav={nav}/>
   {data.fixFirst.length?<ol className={styles.queue}>{data.fixFirst.map((g,i)=><li key={g.key}>
    <span className={styles.rank}>{i+1}</span>
    <div className={styles.queueMain}><button type="button" className={styles.titleButton} onClick={()=>nav({advisory:g.key},{keepPage:true})}><UiShieldAlert size={16} aria-hidden="true" className="action-icon"/><span className={styles.advId}>{g.advisoryId||'Credential pattern'}</span>{g.title}</button><FixSummary g={g}/></div>
    <div className={styles.queueMeta}><SeverityTag level={g.severity}/><span>{g.cvss!==null?`CVSS ${g.cvss.toFixed(1)}`:'CVSS not provided'}</span><span><strong>{n(g.repositories)}</strong> {g.repositories===1?'repository':'repositories'} · {n(g.occurrences)} occurrences</span></div>
   </li>)}</ol>:<p className={styles.emptyLine}>No matching advisories. Coverage gaps may hide findings.</p>}
  </section>

  <section className={styles.kpis} aria-label="Finding totals">
   <button type="button" onClick={()=>nav({view:'findings'})}><UiShieldAlert size={16} aria-hidden="true" className="action-icon"/><span>Unique advisories</span><strong>{n(o.findings.uniqueAdvisories)}</strong><small>distinct advisory IDs and credential patterns</small></button>
   <button type="button" onClick={()=>nav({view:'repositories',verdict:null})}><UiShieldAlert size={16} aria-hidden="true" className="action-icon"/><span>Affected repositories</span><strong>{n(o.findings.affectedRepositories)}</strong><small>of {n(o.verdicts.denominator)} with reports</small></button>
   <button type="button" onClick={()=>nav({view:'findings'})}><UiShieldAlert size={16} aria-hidden="true" className="action-icon"/><span>Dependency occurrences</span><strong>{n(o.findings.occurrences)}</strong><small>advisory × package version × manifest</small></button>
   <div className={styles.kpiSev}><span>Unique advisories by severity</span><ul>{severities.map(s=><li key={s}><button type="button" onClick={()=>nav({view:'findings',severity:s})} aria-label={`${sevLabel[s]}: ${o.findings.bySeverity[s]} advisories`}><UiShieldAlert size={16} aria-hidden="true" className="action-icon"/><SeverityTag level={s}/><strong>{n(o.findings.bySeverity[s])}</strong></button></li>)}</ul></div>
  </section>

  <section className={styles.split}>
   <div className={styles.panel}>
    <div className={styles.sectionHead}><h2>Blocked repositories</h2><button type="button" className={styles.linkButton} onClick={()=>nav({view:'repositories',verdict:'Blocked'})}><UiFilter size={16} aria-hidden="true" className="action-icon"/>All {n(o.verdicts.counts.Blocked)}</button></div>
    {data.attention.length?<ul className={styles.repoList}>{data.attention.map(r=><li key={r.repository}><Link href={reportHref(r.reportId!)} className={styles.repoName}>{r.repository}</Link><span className={styles.counts}><b data-sev="high">{r.severityCounts.high} high</b> · {r.severityCounts.medium} medium · {n(r.dependencyCount)} deps checked{r.gaps.length?<> · <span className={styles.gapHint}>coverage gaps</span></>:null}</span></li>)}</ul>:<p className={styles.emptyLine}>No Blocked reports.</p>}
   </div>
   <div className={styles.panel}>
    <h2>What was not checked</h2>
    <StackBar title="Incomplete reports by cause" caption={`of ${n(o.incomplete.denominator)} Incomplete reports`} denominator={o.incomplete.denominator} segments={(['no_scanned_manifest','zero_resolved','partial'] as const).map((s,i)=>({key:s,label:stageLabels[s],count:o.incomplete.counts[s],tone:`gap${i}`,onSelect:()=>nav({view:'coverage',verdict:'Incomplete',stage:s})}))}/>
    <button type="button" className={styles.callout} onClick={()=>nav({view:'coverage',gap:'zero_dependencies'})}><UiScanSearch size={16} aria-hidden="true" className="action-icon"/><strong>{n(data.zeroChecked)}</strong><span>reports checked zero dependencies<small>of {n(o.verdicts.denominator)} completed reports, any verdict</small></span></button>
   </div>
  </section>

  <section className={styles.split} aria-labelledby="ops-h">
   <div className={styles.panel}>
    <h2 id="ops-h">What happened in the batch</h2>
    <StackBar title="Repository processing" caption={`of ${n(o.batch.total)} selected repositories`} denominator={o.batch.total} segments={batchStates.map(s=>({key:s,label:batchLabels[s],count:op[s],tone:stateTone[s],onSelect:()=>nav({view:'process',state:s})}))}/>
    <p className={styles.note}>{n(op.accepted)} scan jobs accepted · {n(op.completed)} completed · {n(op.failed+op.cancelled)} failed or cancelled · {n(op.skipped)} verified empty repositories skipped (not scanned) · {n(op.waiting+op.queued+op.running)} remaining. Processing state says nothing about security.</p>
   </div>
   <div className={styles.panel}>
    <h2>Security verdicts</h2>
    <StackBar title="Report verdicts" caption={`of ${n(o.verdicts.denominator)} completed reports (current revisions)`} denominator={o.verdicts.denominator} segments={verdicts.map(v=>({key:v,label:v,count:o.verdicts.counts[v],tone:verdictTone[v],onSelect:()=>nav({view:'repositories',verdict:v})}))}/>
    <p className={styles.note}>Blocked = a high-severity advisory matched an installed version (not confirmed exploitation). Checks passed = only the supported checks passed.{o.verdicts.missingReports?` ${o.verdicts.missingReports} completed jobs have no readable report.`:''}{o.freshness.refreshedReports?` ${o.freshness.refreshedReports} reports are advisory-refresh revisions; each repository is counted once.`:''}</p>
   </div>
  </section>

  <section className={styles.panel} aria-labelledby="gaps-h">
   <h2 id="gaps-h">Coverage gaps</h2>
   <p className={styles.note}>Each bar is out of {n(o.gaps.denominator)} completed reports, including Blocked ones. A report can have several gaps, so these categories overlap and must not be added together.</p>
   <GapBars counts={o.gaps.counts} denominator={o.gaps.denominator} nav={nav}/>
  </section>
 </div>;
}
function GapBars({counts,denominator,nav}:{counts:Record<GapCode,number>;denominator:number;nav:Nav}){
 return <ul className={styles.gapBars}>{gapCodes.map(g=><li key={g}><button type="button" onClick={()=>nav({view:'coverage',gap:g,verdict:null,stage:null})} disabled={!counts[g]} aria-label={`${gapLabels[g].label}: ${counts[g]} of ${denominator} reports`}><UiScanSearch size={16} aria-hidden="true" className="action-icon"/>
  <span className={styles.gapLabel}>{gapLabels[g].label}<small>{gapLabels[g].explain}</small></span>
  <span className={styles.gapTrack} aria-hidden="true"><span style={{width:denominator?`${counts[g]/denominator*100}%`:0}}/></span>
  <span className={styles.gapValue}><strong>{n(counts[g])}</strong> / {n(denominator)}</span></button></li>)}</ul>;
}

export function FindingsView({data,nav}:{data:Of<'findings'>;nav:Nav}){
 const f=data.findings,o=data.overview,flt=data.filters;
 return <section className={styles.panel} aria-labelledby="find-h">
  <div className={styles.sectionHead}><div><h2 id="find-h" className={styles.sectionTitle}><Wrench size={18} aria-hidden="true"/>Remediation queue</h2><p className={styles.note}>{n(o.findings.uniqueAdvisories)} unique advisories · {n(o.findings.affectedRepositories)} affected repositories · {n(o.findings.occurrences)} dependency occurrences. Grouped by advisory; an affected-version match is not confirmed exploitability.</p></div></div>
  <QueueRanking value={flt.sort} nav={nav}/>
  <div className={styles.toolbar}><SearchBox label="Search advisory, package or repository" value={flt.q} onChange={q=>nav({q})}/>
   <Segmented<Severity> label="Filter by severity" value={flt.severity} onChange={v=>nav({severity:v})} options={[{value:null,label:'All',count:o.findings.uniqueAdvisories},...severities.map(s=>({value:s,label:sevLabel[s],count:o.findings.bySeverity[s]}))]}/>
   <Clear active={!!(flt.q||flt.severity)} nav={nav} keys={['q','severity']}/></div>
  {f.items.length?<div className={`${styles.tableWrap} ${styles.responsiveWrap}`}><table role="table" className={`${styles.table} ${styles.responsiveTable}`}><caption className={styles.srOnly}>Advisories grouped across repositories</caption>
   <thead><tr><th scope="col">Advisory</th><th scope="col">Severity</th><th scope="col">Remediation</th><th scope="col" className={styles.num}>Repositories</th><th scope="col" className={styles.num}>Occurrences</th><th scope="col"><span className={styles.srOnly}>Evidence</span></th></tr></thead>
   <tbody role="rowgroup">{f.items.map(g=><tr role="row" key={g.key}>
    <th role="rowheader" scope="row"><span className={styles.advId}>{g.advisoryId||'Credential pattern'}</span><span className={styles.cellTitle}>{g.title}</span></th>
    <td role="cell" data-label="Severity"><SeverityTag level={g.severity}/><small className={styles.source}>{[g.cvss!==null&&!g.severitySources.some(x=>x.startsWith('CVSS'))?`CVSS ${g.cvss.toFixed(1)}`:null,...g.severitySources].filter(Boolean).join(' · ')||'Source not recorded'}</small></td>
    <td role="cell" data-label="Remediation"><FixSummary g={g}/></td>
    <td role="cell" data-label="Repositories" className={styles.num}><strong>{n(g.repositories)}</strong><details className={styles.repoSample}><summary>Sample repositories</summary><ul>{g.repositorySample.map(repo=><li key={repo}>{repo}</li>)}</ul>{g.repositories>3&&<span>Open evidence for all {n(g.repositories)} repositories.</span>}</details></td>
    <td role="cell" data-label="Occurrences" className={styles.num}>{n(g.occurrences)}</td>
    <td role="cell" className={styles.rowAction}><button type="button" className="button" onClick={()=>nav({advisory:g.key},{keepPage:true})}><UiShieldAlert size={16} aria-hidden="true" className="action-icon"/>Evidence<span className={styles.srOnly}> for {g.advisoryId||g.title}</span></button></td>
   </tr>)}</tbody></table></div>:<p className={styles.emptyLine}>No advisories match these filters.</p>}
  <Pager {...f} nav={nav} noun="advisories"/>
 </section>;
}

export function RepositoriesView({data,nav}:{data:Of<'repositories'>;nav:Nav}){
 const r=data.repositories,o=data.overview,flt=data.filters;
 return <section className={styles.panel} aria-labelledby="repo-h">
  <div className={styles.sectionHead}><div><h2 id="repo-h">Repositories</h2><p className={styles.note}>Completed reports, ranked by verdict and severity. See Batch process for other entries.</p></div></div>
  <div className={styles.toolbar}><SearchBox label="Search repositories" value={flt.q} onChange={q=>nav({q})}/>
   <Segmented<Verdict> label="Filter by verdict" value={flt.verdict} onChange={v=>nav({verdict:v})} options={[{value:null,label:'All',count:o.verdicts.denominator},...verdicts.map(v=>({value:v,label:v,count:o.verdicts.counts[v]}))]}/>
   <Clear active={!!(flt.q||flt.verdict||flt.gap||flt.stage)} nav={nav} keys={['q','verdict','gap','stage']}/></div>
  {flt.gap&&<p className={styles.activeFilter}>Coverage gap: {gapLabels[flt.gap].label}</p>}
  <RepoTable items={r.items} coverage={false}/>
  <Pager {...r} nav={nav} noun="repositories"/>
 </section>;
}
type RepoItem=Of<'repositories'>['repositories']['items'][number];
function RepoTable({items,coverage}:{items:RepoItem[];coverage:boolean}){
 if(!items.length)return <p className={styles.emptyLine}>No repositories match these filters.</p>;
 return <div className={`${styles.tableWrap} ${coverage?styles.responsiveWrap:''}`}><table role="table" className={`${styles.table} ${coverage?styles.responsiveTable:''}`}><caption className={styles.srOnly}>Repositories with completed reports</caption>
  <thead><tr><th scope="col">Repository</th><th scope="col">Verdict</th>{!coverage&&<th scope="col" className={styles.num}>High</th>}{!coverage&&<th scope="col" className={styles.num}>Medium</th>}{!coverage&&<th scope="col" className={styles.num}>Low / unrated</th>}<th scope="col" className={styles.num}>Deps checked</th><th scope="col">Coverage</th>{coverage&&<th scope="col">Next step</th>}<th scope="col"><span className={styles.srOnly}>Report</span></th></tr></thead>
  <tbody role="rowgroup">{items.map(r=><tr role="row" key={r.repository}>
   <th role="rowheader" scope="row"><span className={styles.repoName}>{r.repository}</span>{coverage&&'omissions' in r&&<CoverageDetail r={r as CoverageItem}/>}</th>
   <td role="cell" data-label="Verdict"><VerdictTag verdict={r.verdict}/></td>
   {!coverage&&<td className={styles.num} data-sev={r.severityCounts.high?'high':undefined}>{r.severityCounts.high}</td>}
   {!coverage&&<td className={styles.num}>{r.severityCounts.medium}</td>}
   {!coverage&&<td className={styles.num}>{r.severityCounts.low} / {r.severityCounts.review}</td>}
   <td role="cell" data-label="Dependencies checked" className={styles.num} data-zero={r.dependencyCount===0||undefined}>{n(r.dependencyCount)}<small className={styles.source}>{r.manifests} manifests{r.omitted?` · ${r.omitted} omitted`:''}</small></td>
   <td role="cell" data-label="Coverage">{r.stage&&<span className={styles.stage} data-stage={r.stage}>{stageLabels[r.stage]}</span>}{r.gaps.filter(g=>g!=='zero_dependencies').length>0&&<ul className={styles.chips}>{r.gaps.filter(g=>g!=='zero_dependencies').map(g=><li key={g}>{gapLabels[g].label}</li>)}</ul>}</td>
   {coverage&&<td role="cell" data-label="Next step"><RecoverySteps gaps={r.gaps}/></td>}
   <td role="cell" className={styles.rowAction}>{r.reportId&&<Link href={reportHref(r.reportId)}>Report<span className={styles.srOnly}> for {r.repository}</span></Link>}{r.refreshed&&<small className={styles.source}>refreshed revision</small>}</td>
  </tr>)}</tbody></table></div>;
}

type CoverageItem=RepoItem&{omissions:{path:string;reason:string;recorded:boolean}[];moreOmissions:number;manifestPaths:string[];dependenciesByManifest:Record<string,number>};
function CoverageDetail({r}:{r:CoverageItem}){
 if(!r.manifestPaths.length&&!r.omissions.length)return <small className={styles.source}>No supported manifest found by discovery.</small>;
 return <details className={styles.details}><summary>{r.manifests} scanned · {r.omissions.length+r.moreOmissions} omitted</summary>
  <p className={styles.note}>Scanned commit: <code>{r.commit||'Not recorded'}</code>. Showing up to 20 manifest paths; see the report for the full evidence.</p>
  {r.manifestPaths.length>0&&<ul>{r.manifestPaths.map(m=><li key={m}><code>{m}</code><span>{n(r.dependenciesByManifest[m]||0)} exact versions</span></li>)}</ul>}
  {r.omissions.length>0&&<ul>{r.omissions.map(o=><li key={o.path}><code>{o.path}</code><span data-unrecorded={!o.recorded||undefined}>{o.reason}</span></li>)}{r.moreOmissions?<li className={styles.muted}>+{r.moreOmissions} more omitted files in the report</li>:null}</ul>}
 </details>;
}

export function CoverageView({data,nav}:{data:Of<'repositories'>;nav:Nav}){
 const o=data.overview,p=o.pipeline,flt=data.filters;
 const steps=[['Report saved','completed reports',p.reports],['Manifest scanned','≥1 supported manifest read',p.manifestScanned],['Exact versions resolved','≥1 pinned dependency',p.versionsResolved],['Advisory lookup complete','no provider, deadline or limit gap',p.lookupComplete]] as const;
 return <div className={styles.stackGap}>
  <section className={styles.panel} aria-labelledby="covlist-h">
   <div className={styles.sectionHead}><div><h2 id="covlist-h" className={styles.sectionTitle}><FileSearch size={18} aria-hidden="true"/>Coverage recovery</h2><p className={styles.note}>Recover missing evidence before relying on results. Guidance only; no scans or changes start here.</p></div><button type="button" className={styles.linkButton} onClick={()=>nav({view:'process',state:'failed'})}><UiScanLine size={16} aria-hidden="true" className="action-icon"/>Inspect failed scans</button></div>
   <Segmented label="Recovery scope" value={flt.recovery} options={[{value:'needed',label:'Needs recovery'},{value:null,label:'All reports'}]} onChange={recovery=>nav({recovery})}/>
   <div className={styles.toolbar}><SearchBox label="Search repositories" value={flt.q} onChange={q=>nav({q})}/>
    <label className={styles.select}><span>Gap</span><select value={flt.gap||''} onChange={e=>nav({gap:e.target.value||null})}><option value="">Any</option>{gapCodes.map(g=><option key={g} value={g}>{gapLabels[g].label} ({o.gaps.counts[g]})</option>)}</select></label>
    <label className={styles.select}><span>Stage</span><select value={flt.stage||''} onChange={e=>nav({stage:(e.target.value||null) as CoverageStage|null})}><option value="">Any</option>{(Object.keys(stageLabels) as CoverageStage[]).map(s=><option key={s} value={s}>{stageLabels[s]}</option>)}</select></label>
    <label className={styles.select}><span>Verdict</span><select value={flt.verdict||''} onChange={e=>nav({verdict:e.target.value||null})}><option value="">Any</option>{verdicts.map(v=><option key={v} value={v}>{v}</option>)}</select></label>
    <Clear active={!!(flt.q||flt.gap||flt.stage||flt.verdict)} nav={nav} keys={['q','gap','stage','verdict']}/></div>
   <p className={styles.note}>Fewest checked dependencies first. Missing omission details show “Reason not recorded”.</p>
   <RepoTable items={data.repositories.items} coverage/>
   <Pager {...data.repositories} nav={nav} noun="repositories"/>
  </section>
  <section className={styles.panel} aria-labelledby="cov-h">
   <h2 id="cov-h">How coverage is decided</h2>
   <p className={styles.note}>Discovery finds package-lock.json, package.json and requirements.txt (other lockfiles are recorded as unsupported). Each manifest is parsed to exact versions; only exact versions are looked up in OSV. A report can be Blocked and still have gaps.</p>
   <ol className={styles.funnel}>{steps.map(([label,hint,value])=><li key={label}><span className={styles.funnelLabel}>{label}<small>{hint}</small></span><span className={styles.gapTrack} aria-hidden="true"><span style={{width:p.reports?`${value/p.reports*100}%`:0}}/></span><span className={styles.gapValue}><strong>{n(value)}</strong> / {n(p.reports)}</span></li>)}</ol>
   <h3 className={styles.subhead}>Gaps (overlapping)</h3>
   <GapBars counts={o.gaps.counts} denominator={o.gaps.denominator} nav={nav}/>
  </section>

 </div>;
}

export function ProcessView({data,nav}:{data:Of<'process'>;nav:Nav}){
 const o=data.overview,op=o.operational,p=data.process,flt=data.filters;
 const max=Math.max(1,...p.throughput.map(b=>b.completed+b.failed));
 return <div className={styles.stackGap}>
  <section className={styles.panel} aria-labelledby="proc-h">
   <div className={styles.sectionHead}><h2 id="proc-h">Batch process</h2><Link href="/batches">Live list of all {n(o.batch.total)}</Link></div>
   <StackBar title="Processing state" caption={`of ${n(o.batch.total)} selected repositories`} denominator={o.batch.total} segments={batchStates.map(s=>({key:s,label:batchLabels[s],count:op[s],tone:stateTone[s],onSelect:()=>nav({state:flt.state===s?null:s})}))}/>
   <dl className={styles.facts}>
    <div><dt>Median queue wait</dt><dd>{duration(p.medianWaitMs)}</dd><small>queued → first start, {n(p.measuredJobs)} jobs with events</small></div>
    <div><dt>Median run time</dt><dd>{duration(p.medianRunMs)}</dd><small>last start → terminal event</small></div>
    <div><dt>Recorded events</dt><dd>{n(p.eventsRecorded)}{p.eventsTruncated?'+':''}</dd><small>{when(p.firstEventAt)} – {when(p.lastEventAt)}</small></div>
   </dl>
   <p className={styles.note}>Times come from job events; stage timing and ETA are unavailable. Verified empty repositories are skipped, not scanned.</p>
   {p.throughput.length>0&&<figure className={styles.throughput}><figcaption><span className={styles.figTitle}>Jobs finished per 30 minutes</span><span className={styles.figCaption}>from terminal audit events</span></figcaption>
    <div className={styles.columns} aria-hidden="true">{p.throughput.map(b=><span key={b.start} title={`${when(b.start)}: ${b.completed} completed, ${b.failed} failed`}><i style={{height:`${b.completed/max*100}%`}} data-tone="done"/><i style={{height:`${b.failed/max*100}%`}} data-tone="failed"/></span>)}</div>
    <div className={styles.axis} aria-hidden="true"><span>{when(p.throughput[0].start)}</span><span>{when(p.throughput.at(-1)!.start)}</span></div>
    <details className={styles.details}><summary>Show as table</summary><table className={styles.table}><thead><tr><th scope="col">From</th><th scope="col" className={styles.num}>Completed</th><th scope="col" className={styles.num}>Failed</th></tr></thead><tbody>{p.throughput.map(b=><tr key={b.start}><th scope="row">{when(b.start)}</th><td className={styles.num}>{b.completed}</td><td className={styles.num}>{b.failed}</td></tr>)}</tbody></table></details>
   </figure>}
  </section>
  <section className={styles.panel} aria-labelledby="entries-h">
   <h2 id="entries-h">Repositories{flt.state?` · ${batchLabels[flt.state]}`:''}</h2>
   <div className={styles.toolbar}><SearchBox label="Search repositories" value={flt.q} onChange={q=>nav({q})}/><Clear active={!!(flt.q||flt.state)} nav={nav} keys={['q','state']}/></div>
   {p.entries.items.length?<div className={styles.tableWrap}><table className={styles.table}><caption className={styles.srOnly}>Batch entries with recorded lifecycle times</caption>
    <thead><tr><th scope="col">Repository</th><th scope="col">State</th><th scope="col">Queued</th><th scope="col">Wait / run</th><th scope="col">Result</th></tr></thead>
    <tbody>{p.entries.items.map(e=><tr key={e.repository}>
     <th scope="row"><span className={styles.repoName}>{e.repository}</span></th>
     <td><span className={styles.state} data-tone={stateTone[e.state]}><Swatch tone={stateTone[e.state]}/>{batchLabels[e.state]}</span>{e.lifecycle&&e.lifecycle.starts>1&&<small className={styles.source}>{e.lifecycle.starts} attempts</small>}</td>
     <td>{e.state==='skipped'?<span className={styles.muted}>Not submitted</span>:e.state==='waiting'?<span className={styles.muted}>Not accepted yet</span>:when(e.lifecycle?.queuedAt??null)}</td>
     <td>{e.lifecycle&&(e.lifecycle.waitMs!==null||e.lifecycle.runMs!==null)?<>{duration(e.lifecycle.waitMs)}<small className={styles.source}>run {duration(e.lifecycle.runMs)}</small></>:<span className={styles.muted}>{e.state==='skipped'||e.state==='waiting'?'—':'Not recorded'}</span>}</td>
     <td>{e.state==='skipped'?<span className={styles.muted}>Empty repository — no scan submitted</span>:e.failure?<span className={styles.failure}><code>{e.failureCode||'no code'}</code> {e.failure}</span>:e.reportId?<><VerdictTag verdict={e.verdict}/> <Link href={reportHref(e.reportId)}>Report<span className={styles.srOnly}> for {e.repository}</span></Link></>:<span className={styles.muted}>{e.state==='queued'?'Waiting for a worker':e.state==='running'?'Worker running':'—'}</span>}</td>
    </tr>)}</tbody></table></div>:<p className={styles.emptyLine}>No repositories match these filters.</p>}
   <Pager {...p.entries} nav={nav} noun="repositories"/>
  </section>
 </div>;
}

type AdvisoryDetail=Extract<Loaded,{advisory:unknown}>['advisory'];
export function AdvisoryDrawer({batch,advisoryKey,onClose}:{batch:string;advisoryKey:string;onClose:()=>void}){
 const ref=useRef<HTMLDialogElement>(null),[detail,setDetail]=useState<AdvisoryDetail|null>(null),[error,setError]=useState('');
 useEffect(()=>{const d=ref.current;if(d&&!d.open)d.showModal();},[]);
 useEffect(()=>{const c=new AbortController();setDetail(null);setError('');
  fetch(`/api/security?${new URLSearchParams({batch,advisory:advisoryKey})}`,{cache:'no-store',signal:c.signal}).then(async r=>{const b=await r.json();if(!r.ok)throw Error(b.error||'Evidence unavailable.');setDetail(b.advisory);}).catch(e=>{if(!c.signal.aborted)setError(e.message);});
  return()=>c.abort();},[batch,advisoryKey]);
 const fixes=detail?.packages.flatMap(p=>p.installed.filter(i=>i.fixedVersions.length).map(i=>`${p.name} ${i.version} → ${i.fixedVersions.join(' or ')}`))||[];
 return <dialog ref={ref} className={styles.drawer} aria-labelledby="drawer-h" onClose={onClose} onClick={e=>{if(e.target===ref.current)ref.current?.close();}}>
  <div className={styles.drawerInner}>
   <header className={styles.drawerHead}><div><p className={styles.advId}>{detail?.advisoryId||(detail?'Credential pattern':'Evidence')}</p><h2 id="drawer-h">{detail?.title||'Loading evidence…'}</h2></div><button type="button" className={styles.close} onClick={()=>ref.current?.close()} aria-label="Close evidence"><X size={18}/></button></header>
   {error&&<p className={styles.alert} role="alert">{error}</p>}
   {detail&&<>
    <dl className={styles.facts}>
     <div><dt>Severity</dt><dd><SeverityTag level={detail.severity}/></dd><small>{detail.severitySources.join(', ')||'Source not recorded'}</small></div>
     <div><dt>CVSS</dt><dd>{detail.cvss!==null?detail.cvss.toFixed(1):'Not provided'}</dd><small>{detail.cvssVector||'No vector recorded'}</small></div>
     <div><dt>Scope</dt><dd>{n(detail.repositories.length)} repositories</dd><small>{n(detail.occurrences)} dependency occurrences</small></div>
    </dl>
    <section><h3 className={styles.subhead}>Exploit prerequisites</h3>
     {detail.prerequisites?<dl className={styles.prereq}><div><dt>Attack vector</dt><dd>{detail.prerequisites.attackVector}</dd></div><div><dt>Complexity</dt><dd>{detail.prerequisites.attackComplexity}</dd></div><div><dt>Privileges</dt><dd>{detail.prerequisites.privilegesRequired}</dd></div><div><dt>User interaction</dt><dd>{detail.prerequisites.userInteraction}</dd></div><div><dt>Deployment exposure</dt><dd>Unknown · not recorded</dd></div></dl>
      :<p className={styles.note}>No CVSS v3 vector was recorded, so prerequisites are unknown. Deployment exposure is not recorded.</p>}
     <p className={styles.note}>The installed version matches the advisory’s affected range. Reachability and deployment are not checked.</p>
    </section>
    <section><h3 className={styles.subhead}>Next step</h3><p>{fixes.length?<>Update to the advisory’s fixed version in each listed manifest, regenerate the lockfile and run your tests: {fixes.slice(0,4).map(f=><code key={f} className={styles.inlineFix}>{f}</code>)}{fixes.length>4?` and ${fixes.length-4} more`:''}.</>:'No fixed version is recorded for these installed versions. Read the advisory for mitigation guidance before deciding.'}</p></section>
    <section><h3 className={styles.subhead}>Installed versions</h3><FixLine g={detail}/></section>
    <section><h3 className={styles.subhead}>Evidence by repository</h3>
     <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th scope="col">Repository</th><th scope="col">Manifest</th><th scope="col">Version → fix</th><th scope="col">Evidence</th></tr></thead>
      <tbody>{detail.occurrenceList.map(o=><tr key={o.findingId+o.repository}><th scope="row"><span className={styles.repoName}>{o.repository}</span></th><td><code className={styles.path}>{o.manifest||'—'}</code></td><td><code>{o.version||'—'}</code> → {o.fixedVersion?<code className={styles.fixed}>{o.fixedVersion}</code>:<span className={styles.muted}>none recorded</span>}</td>
       <td className={styles.evidence}><Link href={`${reportHref(o.reportId)}/findings/${encodeURIComponent(o.findingId)}`}>Report finding</Link>{o.url&&<a href={o.url} target="_blank" rel="noreferrer">OSV<ArrowUpRight size={12} aria-label="opens in a new tab"/></a>}{o.retrievedAt&&<small className={styles.source}>retrieved {when(o.retrievedAt)}</small>}</td></tr>)}</tbody></table></div>
     {detail.truncated&&<p className={styles.note}>Showing the first 500 occurrences.</p>}
    </section>
   </>}
  </div>
 </dialog>;
}
