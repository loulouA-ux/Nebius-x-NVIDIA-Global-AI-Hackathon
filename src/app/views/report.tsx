import Link from 'next/link';
import CsvExport from '../report-insights';
import type {Finding,ScanReport} from '@/lib/types';
import type {FindingFilters} from '../report-memory';
import {SourcePreview} from '../report-insights';
import VerdictCard from '../components/verdict-card';
import FindingsTable from '../components/findings-table';
import {plural,stateLabel} from '../components/presentation';
type Props={report:ScanReport;filtered:Finding[];filters:FindingFilters;update:(v:Partial<FindingFilters>)=>void;open:(f:Finding)=>void;scan:()=>void;decisions:Record<string,string>;decisionState:string};
export default function ReportView({report,filtered,filters,update,open,scan,decisions,decisionState}:Props){return <>
 <p className="demo-banner">{report.recording?`Recorded live run · captured ${new Date(report.recording.recordedAt).toLocaleString('en-GB')} · Nemotron ${report.recording.model} on Nebius · replayed, no live requests`:report.mode==='demo'?'Offline fixture · synthetic inputs · no live requests':'Live scan'}{report.mode==='demo'?' · Demo decisions are not saved.':''}</p>
 <nav className="report-breadcrumb" aria-label="Breadcrumb"><Link href="/reports">Reports</Link><span>/</span><span>{report.id}</span></nav><div className="page-heading"><h1>Scan report</h1><div className="report-tools"><CsvExport report={report}/><button className="button" onClick={scan}>Rescan</button></div></div>

 <VerdictCard report={report}/>
 <FindingsTable report={report} filtered={filtered} filters={filters} update={update} open={open} decisions={decisions} decisionState={decisionState}/>
 <details className="panel scope"><summary>What this scan covers</summary><p>{plural(report.dependencies.length,'resolved dependency','resolved dependencies')}. {report.policy}</p><p>Findings do not establish application exploitability or guarantee security. Review decisions do not resolve findings or change the verdict. No target system is changed by a scan. Dependency repairs require separate verification and explicit approval.</p><p>Research is unconfirmed context, not an affected-package assertion. Missing model notes are not evidence that a finding is safe. Recorded and snapshot evidence is point-in-time, not current coverage.</p><div className="coverage">{report.checks.map(c=><div className="coverage-row" key={c.name} data-state={c.state}><div><strong>{c.name}</strong><p>{c.detail}</p></div><span>{stateLabel(c.state)}</span></div>)}</div></details>
 {report.sources.length>0&&<section className="section research-sources"><h2>Tavily research · unconfirmed · never changes the verdict</h2>{report.sources.map(s=><article className="panel" key={s.id}><h3>{s.title}</h3><p className="source-excerpt">{s.excerpt}</p><small>{s.classification==='matched-advisory'?'Scanner-matched advisory':'Watch · unconfirmed'} · Retrieved {new Date(s.retrievedAt).toLocaleString('en-GB')}{s.publishedAt?` · Published ${s.publishedAt}`:''}</small><p>{s.matchedDependencies?.map(d=>`${d.name}@${d.version}`).join(', ')||'No verified package association'}</p><SourcePreview title={s.title} excerpt={s.excerpt} url={s.url} retrievedAt={s.retrievedAt}/></article>)}</section>}
 </>}
