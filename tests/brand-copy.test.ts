import {describe,it,expect} from 'vitest';
import {verdictMessage} from '../src/app/components/presentation';
import recorded from '../fixtures/recorded-live-run.json';
import type {ScanReport} from '../src/lib/types';
describe('evidence-backed verdict copy',()=>{
 it('distinguishes snapshot coverage from a timeout',()=>{const report={...recorded.report,status:'Incomplete',checks:[{name:'OSV',state:'snapshot',detail:'Test snapshot'}]} as ScanReport;expect(verdictMessage(report)).toBe('1 check used snapshot evidence. Nothing is reported as clean.');report.checks[0].state='incomplete';expect(verdictMessage(report)).toBe("1 check didn't finish. Nothing is reported as clean.");});
 it('uses actual finding counts for review and handles singular blocked copy',()=>{const report={...recorded.report,status:'Review required'} as ScanReport;expect(verdictMessage(report)).toBe(`${report.findings.length} findings need a person to decide.`);report.status='Blocked';report.findings=[{...report.findings[0],severity:'high'}];expect(verdictMessage(report)).toBe('1 high-severity finding needs a decision.');});
});
