import {it,expect,vi} from 'vitest';
import {HostedClient} from '../packages/core/src/hosted';
const token='st_'+'a'.repeat(64),id='12345678-1234-4234-8234-123456789abc';
it('pins requests to configured origin, refuses redirects and sends explicit idempotency key',async()=>{
  const fetcher=vi.fn().mockResolvedValue(new Response(JSON.stringify({job:{id}})));
  const client=new HostedClient('https://example.com',token,fetcher);
  await client.scanRepository('owner/repo',false,id);
  expect(fetcher).toHaveBeenCalledWith('https://example.com/api/repository-scans',expect.objectContaining({redirect:'error',credentials:'omit',body:JSON.stringify({repository:'owner/repo',privateAccess:false,requestKey:id})}));
  expect(()=>client.report('https://evil.example')).toThrow();
  expect(()=>new HostedClient('https://example.com/path',token)).toThrow();
  expect(()=>new HostedClient('http://example.com',token)).toThrow();
});
it('does not expose server errors and rejects oversized or non-object responses',async()=>{
  const fetcher=vi.fn().mockResolvedValueOnce(new Response(token,{status:401})).mockResolvedValueOnce(new Response('x'.repeat(2000001))).mockResolvedValueOnce(new Response('[]'));
  const client=new HostedClient('https://example.com',token,fetcher);
  await expect(client.usage()).rejects.toThrow('HTTP 401');
  await expect(client.usage()).rejects.toThrow('exceeds 2 MB');
  await expect(client.usage()).rejects.toThrow('Invalid ShipTested response');
});
