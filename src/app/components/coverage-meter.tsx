import type {ScanReport} from '@/lib/types';
import {Preview} from '../report-insights';
import {stateLabel} from './presentation';
export default function CoverageMeter({report}:{report:ScanReport}){const states=['complete','snapshot','incomplete','not-in-scope'] as const;return <section aria-label="Check coverage"><h3>Check coverage</h3><p>{states.map(s=>`${report.checks.filter(c=>c.state===s).length} ${stateLabel(s).toLowerCase()}`).join(' · ')}</p><ul className="coverage-meter">{report.checks.map((c,i)=><li key={c.name} data-state={c.state}><Preview label={`${i+1}. ${c.name} · ${stateLabel(c.state)}`} title={c.name}><p>{stateLabel(c.state)}</p><p>{c.detail}</p></Preview></li>)}</ul></section>}
