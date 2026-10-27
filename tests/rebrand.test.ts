import {describe,it,expect,vi} from 'vitest';
import {brandEnv} from '../src/lib/brand-env';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
describe('ShipTested identity',()=>{
 it('prefers new environment names and preserves legacy values without logging values',()=>{
 const warn=vi.spyOn(console,'warn').mockImplementation(()=>{});
 expect(brandEnv('TEST',{SHIPTESTED_TEST:'new',SHIPCHECK_TEST:'old'})).toBe('new');
 expect(brandEnv('TEST',{SHIPCHECK_TEST:'private-value'})).toBe('private-value');
 brandEnv('TEST',{SHIPCHECK_TEST:'private-value'});
 expect(warn).toHaveBeenCalledTimes(1);expect(warn.mock.calls.flat().join()).not.toContain('private-value');warn.mockRestore();
 });
 it('has no old product name outside exact compatibility identifiers',()=>{
 const allowed=/SHIPCHECK_\*|SHIPCHECK_\$\{name\}|shipcheck_session|shipcheck_github_flow|shipcheck-team|shipcheck-theme|shipcheck:decision-recorded|shipcheck:session-expired|shipcheckView|shipcheck-repair-|shipcheck-\$\{phase\}/g;
 const files=execFileSync('git',['ls-files','src','public'],{encoding:'utf8'}).trim().split('\n');
 for(const file of files){if(!/\.(tsx?|css|svg|md|webmanifest)$/.test(file))continue;expect(readFileSync(file,'utf8').replace(allowed,''),file).not.toMatch(/shipcheck/i);}
 });
});
