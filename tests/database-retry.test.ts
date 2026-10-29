import {it,expect,vi} from 'vitest';
import {retrySerializable} from '../src/lib/server/db';
it('retries confirmed serializable aborts and deadlocks, then returns the committed result',async()=>{
 const run=vi.fn().mockRejectedValueOnce({code:'40001'}).mockRejectedValueOnce({code:'40P01'}).mockResolvedValue('committed');
 expect(await retrySerializable(run)).toBe('committed');expect(run).toHaveBeenCalledTimes(3);
});
it('never retries an ambiguous connection failure and bounds contention retries',async()=>{
 const network=vi.fn().mockRejectedValue(Error('Connection lost'));await expect(retrySerializable(network)).rejects.toThrow('Connection lost');expect(network).toHaveBeenCalledTimes(1);
 const contention=vi.fn().mockRejectedValue({code:'40001'});await expect(retrySerializable(contention)).rejects.toMatchObject({code:'40001'});expect(contention).toHaveBeenCalledTimes(4);
});
