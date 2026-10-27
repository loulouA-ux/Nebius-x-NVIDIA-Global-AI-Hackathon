import {afterEach,expect,it,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {scan,verdict,MemoryCache,getAdvisory,type ScanReport,type StageEvent} from '@heysalad/shiptested';
import {runScan} from '../src/lib/pipeline';
import {verdict as webVerdict} from '../src/lib/scanner';
import recorded from '../fixtures/recorded-live-run.json';
const lock=readFileSync('fixtures/platform-package-lock.json','utf8');
const advisory=JSON.parse(readFileSync('fixtures/lodash-advisory.json','utf8'));
const transport=()=>vi.fn(async(url:Parameters<typeof fetch>[0])=>String(url).endsWith('querybatch')?Response.json({results:[{vulns:[{id:advisory.id}]}]}):Response.json(advisory));
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();vi.useRealTimers();});
it('web and core use the identical verdict implementation and recorded report verdict',()=>{
 expect(webVerdict).toBe(verdict);
 const report=recorded.report as ScanReport;
 expect(verdict(report.findings,report.checks)).toBe(report.status);
});
it('golden captured-advisory transport gives identical web/core findings and verdict',async()=>{
 vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(new Date('2026-10-27T12:00:00Z'));
 vi.stubGlobal('fetch',transport());const web=await runScan({mode:'live',filename:'package-lock.json',content:lock,research:false});
 const events:unknown[]=[];const core=await scan({lockfile:lock},{fetcher:transport(),onStage:e=>events.push(e)});
 expect(core.findings).toEqual(web.findings);expect(core.dependencies).toEqual(web.dependencies);expect(core.status).toBe(web.status);expect(events).toHaveLength(6);
});
it('successful deterministic coverage remains clear even when optional AI is not requested',async()=>{
 const fetcher=vi.fn(async()=>Response.json({results:[{}]}));vi.stubGlobal('fetch',fetcher);
 const core=await scan({lockfile:lock},{fetcher});const web=await runScan({mode:'live',filename:'package-lock.json',content:lock,research:false});
 expect(core.status).toBe('Checks passed');expect(web.status).toBe(core.status);
});
it('outage emits failed stage and cannot become clear or leak exception details',async()=>{
 const events:StageEvent[]=[];const report=await scan({lockfile:lock},{fetcher:vi.fn().mockRejectedValue(Error('private sentinel')),onStage:e=>events.push(e)});
 expect(report.status).toBe('Incomplete');expect(events.at(-1)?.status).toBe('failed');expect(JSON.stringify(report)).not.toContain('private sentinel');
});
it('enforces cancellation and OSV-only endpoints',async()=>{
 const c=new AbortController();c.abort();await expect(scan({lockfile:lock},{signal:c.signal})).rejects.toThrow();
 const fetcher=vi.fn();await expect(getAdvisory('GHSA-test',{baseUrl:'http://127.0.0.1',fetcher})).rejects.toThrow('Only');expect(fetcher).not.toHaveBeenCalled();
});
it('cache preserves original advisory retrieval time and masks matched credentials',async()=>{
 const cache=new MemoryCache();const fetcher=vi.fn(async()=>Response.json({...advisory,details:'ghp_'+'a'.repeat(25)}));
 const a=await getAdvisory(advisory.id,{cache,fetcher}),b=await getAdvisory(advisory.id,{cache,fetcher});expect(fetcher).toHaveBeenCalledTimes(1);expect(b.retrievedAt).toBe(a.retrievedAt);expect(JSON.stringify(a)).not.toContain('a'.repeat(25));
});
