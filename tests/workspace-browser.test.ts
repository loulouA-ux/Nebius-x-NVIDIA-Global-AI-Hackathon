import {it,expect} from 'vitest';
import {runInNewContext} from 'node:vm';
import {workspaceBrowserScript} from '../src/lib/workspace-browser';
function browser(){
 const storage=new Map<string,string>([['shiptested-workspace','workspace:one']]);
 const calls:{url:string;headers:Headers}[]=[];
 let next=()=>Promise.resolve(Response.json({}));
 const window={fetch:async(input:RequestInfo|URL,init?:RequestInit)=>{calls.push({url:String(input),headers:new Headers(init?.headers)});return next();}};
 runInNewContext(workspaceBrowserScript,{window,URL,Request,Headers,location:{href:'https://example.test/team',origin:'https://example.test'},sessionStorage:{getItem:(k:string)=>storage.get(k),setItem:(k:string,v:string)=>storage.set(k,v),removeItem:(k:string)=>storage.delete(k)}});
 return {window,calls,storage,respond:(fn:()=>Promise<Response>)=>{next=fn;}};
}
it('attaches context only to same-origin API requests and clears it after sign-out',async()=>{
 const b=browser();await b.window.fetch('/api/usage');await b.window.fetch('https://external.test/api/usage');await b.window.fetch('/docs');
 expect(b.calls.map(c=>c.headers.get('x-shiptested-workspace'))).toEqual(['workspace:one',null,null]);
 await b.window.fetch('/api/session',{method:'DELETE'});expect(b.storage.has('shiptested-workspace')).toBe(false);
 await b.window.fetch('/api/usage');expect(b.calls.at(-1)?.headers.has('x-shiptested-workspace')).toBe(false);
});
it('a late old response cannot overwrite a completed workspace switch',async()=>{
 const b=browser();let release!:(r:Response)=>void;
 b.respond(()=>new Promise(resolve=>{release=resolve;}));const old=b.window.fetch('/api/workspaces');
 b.respond(()=>Promise.resolve(Response.json({actor:{workspaceId:'workspace:two'}})));
 await b.window.fetch('/api/workspaces',{method:'POST'});
 release(Response.json({actor:{workspaceId:'workspace:one'}}));await old;
 expect(b.storage.get('shiptested-workspace')).toBe('workspace:two');
});
