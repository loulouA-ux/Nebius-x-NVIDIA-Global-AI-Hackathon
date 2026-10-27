import {describe,it,expect} from 'vitest';
import {recordedDemo} from '../src/lib/server/demo-report';
import original from '../fixtures/recorded-live-run.json';
import snapshot from '../fixtures/recorded-advisory-metadata.json';
import {advisoryMetadata} from '../src/lib/advisory-metadata';
describe('dated recorded advisory enrichment',()=>{
 it('covers exactly the captured five advisories without modifying original evidence',()=>{
  const report=recordedDemo();expect(snapshot.advisories).toHaveLength(5);
  expect(report.findings).toHaveLength(original.report.findings.length);
  for(const [i,f] of report.findings.entries()){
   expect(f.evidence).toEqual(original.report.findings[i].evidence);
   const e=f.evidence.find(e=>e.kind==='advisory'&&e.dependency)!;
   const a=snapshot.advisories.find(a=>e.url===`https://osv.dev/vulnerability/${a.id}`)!;
   expect(a).toBeDefined();expect(f).toMatchObject(advisoryMetadata(a,e.dependency!));
  }
  expect(report.recording?.advisoryMetadataRetrievedAt).toBe(snapshot.retrievedAt);
  expect(recordedDemo()).toEqual(report);
 });
 it('uses the normal verdict policy after enrichment',()=>{
  const report=recordedDemo();expect(report.findings.some(f=>f.severity==='high')).toBe(true);expect(report.status).toBe('Blocked');
 });
});
