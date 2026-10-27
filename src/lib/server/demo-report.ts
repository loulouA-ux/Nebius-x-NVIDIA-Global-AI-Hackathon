import recorded from '../../../fixtures/recorded-live-run.json';
import snapshot from '../../../fixtures/recorded-advisory-metadata.json';
import {advisoryMetadata} from '../advisory-metadata';
import {verdict} from '../scanner';
import type {ScanReport} from '../types';

// Enrich the original synthetic capture with dated OSV metadata, never live requests.
// Original evidence and model notes keep their original capture date and provenance.
export function recordedDemo(): ScanReport {
 const original=recorded.report as ScanReport;
 const findings=original.findings.map(finding=>{
  const evidence=finding.evidence.find(e=>e.kind==='advisory'&&e.dependency);
  const advisory=snapshot.advisories.find(a=>evidence?.url===`https://osv.dev/vulnerability/${a.id}`);
  if(!advisory||!evidence?.dependency)return finding;
  return {...finding,...advisoryMetadata(advisory,evidence.dependency)};
 });
 return {...original,findings,status:verdict(findings,original.checks),id:'demo-recorded',mode:'demo',recording:{recordedAt:recorded.recordedAt,model:recorded.model,region:recorded.region,commit:recorded.commit,advisoryMetadataRetrievedAt:snapshot.retrievedAt}};
}
