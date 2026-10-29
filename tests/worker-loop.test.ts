import {describe,it,expect,vi} from 'vitest';
import {workerLoop} from '../src/lib/server/worker-loop';
describe('bounded worker supervisor',()=>{
 it('continues after a failed cycle, without concurrent work or raw errors',async()=>{
  let now=0,active=0,maxActive=0;const error=vi.fn(),wait=vi.fn(async(ms:number)=>{now+=ms;});
  const run=vi.fn(async()=>{active++;maxActive=Math.max(active,maxActive);await Promise.resolve();active--;if(run.mock.calls.length===1)throw Error('private provider payload');});
  expect(await workerLoop({signal:new AbortController().signal,deadline:10000,intervalMs:1000,maxCycles:3,run,onError:error,now:()=>now,wait})).toEqual({cycles:3,failures:1});
  expect(maxActive).toBe(1);expect(error).toHaveBeenCalledWith();expect(wait).toHaveBeenCalledTimes(2);
 });
 it('stops on deadline and never starts work after shutdown',async()=>{
  let now=0;const controller=new AbortController(),run=vi.fn(async()=>{});
  const options={signal:controller.signal,deadline:1500,intervalMs:1000,maxCycles:99,run,onError:vi.fn(),now:()=>now,wait:async(ms:number)=>{now+=ms;}};
  expect((await workerLoop(options)).cycles).toBe(2);
  controller.abort();expect((await workerLoop({...options,deadline:5000})).cycles).toBe(0);
 });
 it('finishes the current job but starts no next cycle after a signal',async()=>{
  const controller=new AbortController();const wait=vi.fn();
  expect((await workerLoop({signal:controller.signal,deadline:Date.now()+5000,intervalMs:1000,maxCycles:10,run:async()=>{controller.abort();},onError:vi.fn(),wait})).cycles).toBe(1);
  expect(wait).not.toHaveBeenCalled();
 });
});
