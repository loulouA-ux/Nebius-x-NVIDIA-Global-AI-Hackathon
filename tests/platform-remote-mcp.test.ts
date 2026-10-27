import {describe,it,expect,vi} from 'vitest';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import {handleMcp,RateLimiter} from '../apps/mcp/src/lib/handler';
import {readFile} from 'node:fs/promises';
const origin='https://mcp.shiptested.com';
const request=(body:unknown,headers:Record<string,string>={})=>new Request(origin+'/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream',...headers},body:JSON.stringify(body)});
describe('remote Streamable HTTP boundary',()=>{
 it('supports the official client and returns structured checks without logging content',async()=>{
  const logs=vi.spyOn(console,'log'),errors=vi.spyOn(console,'error');const limiter=new RateLimiter(100);
  const transport=new StreamableHTTPClientTransport(new URL(origin+'/mcp'),{fetch:async(url,init)=>handleMcp(new Request(url,init),{limiter,fetcher:async()=>Response.json({results:[{}]})})});const client=new Client({name:'remote-test',version:'1'});
  try{await client.connect(transport);expect((await client.listTools()).tools).toHaveLength(3);const content=await readFile('fixtures/platform-package-lock.json','utf8');const result=await client.callTool({name:'scan_lockfile',arguments:{content}});expect(result.isError).not.toBe(true);expect((result.structuredContent as {report:{status:string}}).report.status).toBe('Checks passed');expect(logs).not.toHaveBeenCalled();expect(errors).not.toHaveBeenCalled();}finally{await client.close();logs.mockRestore();errors.mockRestore();}
 });
 it('rejects declared and observed oversize bodies, cross-origin and rebinding hosts',async()=>{
  expect((await handleMcp(request({}, {'content-length':'2000001'}))).status).toBe(413);
  expect((await handleMcp(request({payload:'x'.repeat(2_000_001)}))).status).toBe(413);
  expect((await handleMcp(request({}, {origin:'https://attacker.example'}))).status).toBe(403);
  expect((await handleMcp(new Request('https://attacker.example/mcp',{method:'POST',body:'{}'}))).status).toBe(403);
 });
 it('rate limits without trusting client forwarded headers outside Vercel',async()=>{
  const limiter=new RateLimiter(1);expect((await handleMcp(request({}, {'x-forwarded-for':'a'}),{limiter,trustedVercelProxy:false})).status).not.toBe(429);
  const response=await handleMcp(request({}, {'x-forwarded-for':'b'}),{limiter,trustedVercelProxy:false});expect(response.status).toBe(429);expect(response.headers.get('retry-after')).toBe('60');
 });
 it('bounds limiter state and expires it',()=>{const limiter=new RateLimiter(1,1);expect(limiter.allow('a',1)).toBe(true);expect(limiter.allow('b',1)).toBe(false);expect(limiter.allow('b',60002)).toBe(true);});
});
