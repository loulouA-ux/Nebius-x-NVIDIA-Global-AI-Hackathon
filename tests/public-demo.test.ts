import {afterEach,expect,test,vi} from 'vitest';
import {NextRequest} from 'next/server';
import {proxy} from '../src/proxy';
const modules=import.meta.glob('../src/app/api/**/route.ts');
afterEach(()=>{vi.unstubAllEnvs();vi.restoreAllMocks();});
test('public demo refuses every live API before any external request',async()=>{
 vi.stubEnv('SHIPCHECK_PUBLIC_DEMO','1');const fetch=vi.spyOn(globalThis,'fetch').mockRejectedValue(new Error('Unexpected network'));
 let checked=0;
 for(const[path,load]of Object.entries(modules)){
  if(path.includes('/demos/')||path.includes('/health/'))continue;
  const route=await load() as Record<string,(r:Request,c:unknown)=>Promise<Response>>;
  for(const method of ['GET','POST','DELETE'])if(route[method]){
   const response=await route[method](new Request('http://localhost/api/test',{method}),{params:Promise.resolve({id:'invalid'})});
   expect(response.status,`${path} ${method}`).toBe(403);expect(await response.json()).toMatchObject({publicDemo:true});checked++;
  }
 }
 // Includes enqueue/status/cancel repository-scan handlers; all must fail closed.
 expect(checked).toBe(44);expect(fetch).not.toHaveBeenCalled();
});
test('public proxy allows replay reads and refuses live pages and all writes',()=>{
 vi.stubEnv('SHIPCHECK_PUBLIC_DEMO','1');
 for(const path of ['/','/reports','/reports/demo-recorded','/reports/demo-offline/findings/test','/api/demos','/api/health'])expect(proxy(new NextRequest('http://localhost'+path)).status).toBe(200);
 for(const path of ['/scan','/sign-in','/hosts','/repairs','/reports/private-id','/batches','/security-overview','/api/scans','/api/security','/api/auth/github/callback'])expect(proxy(new NextRequest('http://localhost'+path)).status).toBe(403);
 expect(proxy(new NextRequest('http://localhost/api/demos',{method:'POST'})).status).toBe(403);
 expect(proxy(new NextRequest('http://localhost/unknown-page',{method:'POST'})).status).toBe(403);
});
test('normal preview is unaffected when public demo is disabled',()=>{vi.stubEnv('SHIPCHECK_PUBLIC_DEMO','0');expect(proxy(new NextRequest('http://localhost/scan')).status).toBe(200);});
test('Vercel production fails closed with absent or false flags',()=>{
 vi.spyOn(console,'error').mockImplementation(()=>{});vi.stubEnv('VERCEL_ENV','production');vi.stubEnv('SHIPTESTED_PUBLIC_DEMO','0');
 const response=proxy(new NextRequest('https://example.test/api/scans',{method:'POST'}));expect(response.status).toBe(403);
 expect(response.headers.get('Content-Security-Policy')).toContain("frame-ancestors 'none'");expect(response.headers.get('Content-Security-Policy')).not.toContain("script-src 'self' 'unsafe-inline'");
 expect(response.headers.get('Strict-Transport-Security')).toBe('max-age=31536000; includeSubDomains');
});
test('redirects only the configured www host',()=>{vi.stubEnv('NEXT_PUBLIC_SITE_URL','https://shiptested.example');const r=proxy(new NextRequest('https://www.shiptested.example/privacy',{headers:{host:'www.shiptested.example'}}));expect(r.status).toBe(308);expect(r.headers.get('location')).toBe('https://shiptested.example/privacy');});
