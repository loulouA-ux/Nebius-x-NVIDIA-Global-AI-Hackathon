import type {ScanReport} from '@/lib/types';
import CoverageMeter from './coverage-meter';
import {plural,severityLabel,verdictLabel} from './presentation';
export default function VerdictCard({report}:{report:ScanReport}){const high=report.findings.filter(f=>f.severity==='high').length;return <> <section className="report-verdict" data-verdict={verdictLabel(report.status)}><div><h2>{verdictLabel(report.status)} · {plural(high,'high-severity finding')}</h2><div className="count-chips">{(['high','medium','review'] as const).map(s=><span className={'severity '+s} key={s}>{report.findings.filter(f=>f.severity===s).length} {severityLabel(s)}{s==='review'?' · needs human review':''}</span>)}</div><small>Advisory verdict — ShipCheck does not block deployments.</small></div><CoverageMeter report={report}/></section>
</>}
