import {describe,it,expect} from 'vitest';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {InMemoryTransport} from '@modelcontextprotocol/sdk/inMemory.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {createServer} from '../packages/mcp/src/server';
import {readLocalLockfile} from '../packages/mcp/src/local';
import {scan} from '@heysalad/shiptested';
import {HostedClient} from '@heysalad/shiptested/hosted';
import {readFile,mkdtemp,mkdir,symlink,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const lock=await readFile('fixtures/platform-package-lock.json','utf8');
async function connect(options:Parameters<typeof createServer>[0]={}){const server=createServer(options),client=new Client({name:'shiptested-test',version:'1'});const [a,b]=InMemoryTransport.createLinkedPair();await server.connect(a);await client.connect(b);return {server,client,close:async()=>{await client.close();await server.close();}};}
describe('MCP protocol',()=>{
 it('lists schemas and returns the same deterministic report as core, with progress',async()=>{
  const fetcher=async()=>Response.json({results:[{}]});const x=await connect({fetcher});
  try{const tools=await x.client.listTools();expect(tools.tools.map(t=>t.name)).toEqual(['scan_lockfile','check_package','get_advisory']);expect(tools.tools.every(t=>t.outputSchema&&t.annotations?.readOnlyHint)).toBe(true);
   const progress:unknown[]=[];const result=await x.client.callTool({name:'scan_lockfile',arguments:{content:lock}},undefined,{onprogress:p=>progress.push(p)});
   const core=await scan({lockfile:lock},{fetcher});const wrapped=result.structuredContent as {report:typeof core;untrusted:boolean};expect(result.isError).not.toBe(true);expect(wrapped.untrusted).toBe(true);expect(wrapped.report.status).toBe(core.status);expect(wrapped.report.findings).toEqual(core.findings);expect(wrapped.report.dependencies).toEqual(core.dependencies);expect(progress).toHaveLength(6);
  }finally{await x.close();}
 });
 it('refuses oversized input and remote paths; remote never exposes AI',async()=>{
  const x=await connect({remote:true,keys:{nebius:'test'}});try{
   expect((await x.client.listTools()).tools.some(t=>t.name==='explain_findings')).toBe(false);
   expect((await x.client.callTool({name:'scan_lockfile',arguments:{path:'package-lock.json'}})).isError).toBe(true);
   expect((await x.client.callTool({name:'scan_lockfile',arguments:{content:'x'.repeat(2_000_001)}})).isError).toBe(true);
  }finally{await x.close();}
 });
 it('starts the actual stdio executable and exposes local BYOK only when supplied',async()=>{
  const transport=new StdioClientTransport({command:process.execPath,args:['packages/mcp/dist/stdio.js'],env:{PATH:process.env.PATH||'',NEBIUS_API_KEY:'synthetic-test-key'},stderr:'pipe'});const client=new Client({name:'stdio-test',version:'1'});
  try{await client.connect(transport);expect((await client.listTools()).tools.map(t=>t.name)).toContain('explain_findings');}finally{await client.close();}
 });
 it('refuses traversal and symlink escapes while reading an ordinary local lockfile',async()=>{
  const root=await mkdtemp(join(tmpdir(),'shiptested-path-'));try{await mkdir(join(root,'inside'));await writeFile(join(root,'package-lock.json'),lock);await symlink(join(root,'package-lock.json'),join(root,'inside','package-lock.json'));
   await expect(readLocalLockfile('../package-lock.json',join(root,'inside'))).rejects.toThrow();await expect(readLocalLockfile('package-lock.json',join(root,'inside'))).rejects.toThrow();expect((await readLocalLockfile('package-lock.json',root)).lockfile).toBe(lock);
  }finally{await rm(root,{recursive:true,force:true});}
 });
});

it('exposes account tools only on explicitly configured local MCP and preserves request keys',async()=>{
 const calls:{url:string;body:unknown}[]=[];
 const hosted=new HostedClient('https://example.com','st_'+'a'.repeat(64),async(input,init)=>{calls.push({url:String(input),body:JSON.parse(String(init?.body||'null'))});return Response.json({accepted:true});});
 const local=await connect({hosted});
 try{const tools=await local.client.listTools();expect(tools.tools.find(t=>t.name==='scan_repository')?.annotations?.readOnlyHint).toBe(false);
 const requestKey='12345678-1234-4234-8234-123456789abc';
 const result=await local.client.callTool({name:'scan_repository',arguments:{repository:'owner/repo',requestKey}});
 expect(result.isError).not.toBe(true);expect(calls[0]).toEqual({url:'https://example.com/api/repository-scans',body:{repository:'owner/repo',privateAccess:false,requestKey}});
 }finally{await local.close();}
 const remote=await connect({remote:true,hosted});try{expect((await remote.client.listTools()).tools.some(t=>t.name==='scan_repository')).toBe(false);}finally{await remote.close();}
});
