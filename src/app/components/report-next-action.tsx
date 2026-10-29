
import {ScanSearch as UiScanSearch} from 'lucide-react';
import {ArrowUpRight, ShieldAlert, ScanSearch} from 'lucide-react';
import type {Finding, ScanReport} from '@/lib/types';
import {severityOrder} from '@/lib/advisory-metadata';
import styles from './report-next-action.module.css';
export default function ReportNextAction({report,open,onCoverage}:{report:ScanReport;open:(finding:Finding)=>void;onCoverage:()=>void}) {
 const findings=[...report.findings].sort((a,b)=>severityOrder[a.severity]-severityOrder[b.severity]||Number(!!b.fixedVersion)-Number(!!a.fixedVersion));
 const first=findings[0], dependency=first?.evidence.find(e=>e.dependency)?.dependency;
 return <section className={styles.next} aria-label="Recommended next step">
  <div><h2>{first?<><ShieldAlert size={22} aria-hidden="true"/> Start with this finding</>:<><ScanSearch size={22} aria-hidden="true"/> Review your coverage</>}</h2>
   {first?<><h3>{first.title}</h3>{dependency&&<p><code>{dependency.name}@{dependency.version}</code>{first.fixedVersion&&<> · Advisory lists a fix in <code>{first.fixedVersion}</code></>}</p>}<p>Prioritized by severity, then availability of a listed fix. Review the evidence and compatibility before preparing a repair.</p><button className="button primary" onClick={()=>open(first)}>Review priority finding <ArrowUpRight size={16} aria-hidden="true"/></button></>:<p>No findings were returned. Check which analyses ran before treating this report as evidence of safety.</p>}
  </div>
  <div className={styles.coverage}><h3>Coverage matters</h3><p>A completed scan is not a complete security review. Check missing or limited analyses alongside the findings.</p><button className="button" onClick={onCoverage}><UiScanSearch size={16} aria-hidden="true" className="action-icon"/>Review scan coverage</button></div>
 </section>;
}
