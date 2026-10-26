import Link from 'next/link';
import {ArrowLeft,ChevronRight,Info} from 'lucide-react';
import type {Finding,ScanReport,Evidence} from '@/lib/types';
import advisory from '../../../fixtures/lodash-advisory.json';
import {severityLabel} from '../components/presentation';
import styles from '../findings.module.css';
import DecisionLog from '../decision-log';
import {SourcePreview} from '../report-insights';
function AdvisoryMetadata({evidence:e}:{evidence:Evidence}){if(e.url!==`https://osv.dev/vulnerability/${advisory.id}`)return null;const affected=advisory.affected.find(a=>a.package.name===e.dependency?.name&&a.package.ecosystem===e.dependency?.ecosystem);return <dl className="advisory-metadata"><dt>Advisory</dt><dd>{advisory.id}</dd><dt>Aliases</dt><dd>{advisory.aliases.join(', ')}</dd><dt>CVSS vector</dt><dd>{advisory.severity.map(s=>s.score).join(', ')}</dd><dt>CWE</dt><dd>{advisory.database_specific.cwe_ids.join(', ')}</dd>{affected&&<><dt>Affected range / fixes</dt><dd>{affected.ranges.flatMap(r=>r.events.map(e=>Object.entries(e).map(([k,v])=>`${k==='fixed'?'Fixed in':k} ${v}`).join(', '))).join('; ')}</dd></>}</dl>}
export default function FindingDetail({finding,report,close}:{finding:Finding;report:ScanReport;close:()=>void}){const repairDependency=finding.evidence.find(e=>e.dependency?.ecosystem==='npm')?.dependency;const fixed= finding.evidence.some(e=>e.url===`https://osv.dev/vulnerability/${advisory.id}`)?advisory.affected.find(a=>a.package.name===repairDependency?.name&&a.package.ecosystem===repairDependency?.ecosystem)?.ranges.flatMap(r=>r.events.map(e=>'fixed' in e?e.fixed:undefined)).find(Boolean):undefined;return <>
              <button className="back" onClick={() => close()}>
                <ArrowLeft size={15} />
                Back to report
              </button>
              <div className="finding-workspace">
                <section className="finding-summary" aria-label="Finding and recommended action">
              <span className={"severity " + finding.severity}>
                {severityLabel(finding.severity)}{finding.severity==='review'&&<small>Needs human review</small>}
              </span>
              <h1 tabIndex={-1} className="detail-title">{finding.title}</h1>
              <p className="intro">{finding.description}</p>
              <section className="panel">
                <h2>Recommended action</h2>
                {fixed&&repairDependency&&<p className="change-chip">{repairDependency.name} {repairDependency.version} → {fixed} <span>Fixed in {fixed}</span></p>}<p>{finding.action}</p>
                {repairDependency && <div className={styles.handoff}><Link className="button primary" href={`/repairs?package=${encodeURIComponent(repairDependency.name)}`}>Prepare repair <ChevronRight size={15}/></Link><p>Choose the repository and confirm the dependency before verification.</p></div>}
                <div className="quiet-note">
                  <Info size={16} />
                  No code has been changed.
                </div>
              </section>
                </section>
              <section className="panel evidence-pane" aria-label="Source evidence">
                <div className="evidence-heading"><h2>Evidence</h2><span>{finding.evidence.length} source{finding.evidence.length === 1 ? "" : "s"}</span></div><p className="muted">Evidence recorded for this finding. Open the original source to check its context.</p>
                {finding.evidence.map((e, i) => (
                  <div className="evidence" key={i}>
                    <span className="evidence-kind">{e.kind === "advisory" ? "Advisory" : e.kind === "http" ? "HTTP observation" : "Code evidence"}</span>
                    {!e.dependency&&<div className="code-label">{e.location}</div>}
                    {e.dependency && <p className="evidence-dependency">{e.dependency.name}@{e.dependency.version}<br/><code>{e.dependency.path}</code></p>}
                    <AdvisoryMetadata evidence={e}/><pre>{e.excerpt}</pre>
                    {e.url && (
                      <SourcePreview title={e.location} excerpt={e.excerpt} url={e.url} retrievedAt={e.retrievedAt}/>
                    )}
                    {e.retrievedAt && (
                      <small>
                        Retrieved{" "}
                        {new Date(e.retrievedAt).toLocaleDateString("en-GB")}
                      </small>
                    )}
                  </div>
                ))}
              </section>
              </div>
              {report && (
                <DecisionLog
                  key={finding.id}
                  report={report}
                  findingId={finding.id}
                />
              )}
              {report?.explanations
                .filter((e) => e.findingId === finding.id)
                .map((e, i) => (
                  <section className="panel" key={i}>
                    <h2>{e.basis === "validated-selection" ? "Nemotron-selected note · verbatim from scanner evidence" : "Scanner evidence note"}</h2>
                    <p>{e.basis ? e.explanation : finding.description}</p>
                    <small>
                      {e.basis === "validated-selection" ? "Selected verbatim from scanner-authored notes; no generated claims." : "Scanner fallback. Unvalidated model wording is not displayed."}
                    </small>
                  </section>
                ))}
</>}
