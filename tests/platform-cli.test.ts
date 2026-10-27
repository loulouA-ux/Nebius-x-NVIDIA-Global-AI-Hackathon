import Ajv from 'ajv-draft-04';
import addFormats from 'ajv-formats';
import schema from './schemas/sarif-2.1.0.json';
import {describe,it,expect} from 'vitest';
import {execFileSync,spawnSync} from 'node:child_process';
import {exitCode,sarif} from '../packages/cli/src/output';
import type {Report} from '@heysalad/shiptested';
import recorded from '../fixtures/recorded-live-run.json';
const report=recorded.report as Report;
describe('CLI contract',()=>{
 it('documents every command and version',()=>{const help=execFileSync(process.execPath,['packages/cli/dist/index.js','--help'],{encoding:'utf8'});expect(help).toContain('--fail-on');expect(help).toContain('mcp');expect(execFileSync(process.execPath,['packages/cli/dist/index.js','--version'],{encoding:'utf8'})).toBe('0.1.0\n');});
 it('fails usage without leaking a supplied path',()=>{const run=spawnSync(process.execPath,['packages/cli/dist/index.js','scan','/private-missing-marker'],{encoding:'utf8'});expect(run.status).toBe(64);expect(run.stderr).not.toContain('private-missing-marker');expect(run.stdout).toBe('');});
 it('maps every verdict and threshold including incomplete precedence',()=>{
  expect(exitCode({...report,status:'Checks passed',findings:[]})).toBe(0);
  expect(exitCode({...report,status:'Blocked'})).toBe(1);
  expect(exitCode({...report,status:'Review required',findings:[]})).toBe(2);
  expect(exitCode({...report,status:'Incomplete'})).toBe(3);
  const low={...report.findings[0],severity:'low' as const};
  expect(exitCode({...report,status:'Review required',findings:[low]},'high')).toBe(2);
  expect(exitCode({...report,status:'Review required',findings:[low]},'low')).toBe(1);
 });
 it('retains evidence in SARIF without fabricating source line locations',()=>{const output=sarif(report);const ajv=new Ajv({strict:false});addFormats(ajv);const validate=ajv.compile(schema);expect(validate(JSON.parse(JSON.stringify(output))),JSON.stringify(validate.errors)).toBe(true);expect(output.version).toBe('2.1.0');expect(output.runs[0].results.length).toBe(report.findings.length);expect(output.runs[0].results[0].properties.evidence).toEqual(report.findings[0].evidence);expect(output.runs[0].invocations[0].executionSuccessful).toBe(report.status!=='Incomplete');});
});
