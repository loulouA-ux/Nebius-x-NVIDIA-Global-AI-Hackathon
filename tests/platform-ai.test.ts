import {describe,it,expect} from 'vitest';
import {addNotes,boundedJson} from '@heysalad/shiptested/ai';
import recorded from '../fixtures/recorded-live-run.json';
import type {ScanReport} from '@heysalad/shiptested';
describe('optional package enrichment',()=>{
 it('requires explicit BYOK without reading environment',async()=>{
  await expect(addNotes(recorded.report as ScanReport,{})).rejects.toThrow('own provider key');
 });
 it('preserves deterministic results and caller input on provider failure',async()=>{
  const report=structuredClone(recorded.report) as ScanReport, before=structuredClone(report);
  const enriched=await addNotes(report,{tavily:'test',nebius:'test'},async()=>{throw Error('private exception');});
  expect(enriched.status).toBe(before.status);
  expect(enriched.findings).toEqual(before.findings);
  expect(report).toEqual(before);
  expect(JSON.stringify(enriched)).not.toContain('private exception');
  expect(enriched.checks.length).toBe(before.checks.length+2);
 });
 it('rejects arbitrary endpoints before sending keys',async()=>{
  let called=false;
  await expect(boundedJson('http://127.0.0.1/',{},async()=>{called=true;throw Error();})).rejects.toThrow('Unsupported');
  expect(called).toBe(false);
 });
});
