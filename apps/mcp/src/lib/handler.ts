import {WebStandardStreamableHTTPServerTransport} from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import {createServer} from '@heysalad/shiptested-mcp';
import {MemoryCache} from '@heysalad/shiptested';
const cache=new MemoryCache();
export class RateLimiter {
 private entries=new Map<string,{count:number;until:number}>();
 constructor(private limit=30,private capacity=10000){}
 allow(ip:string,now=Date.now()){
  for(const [key,value] of this.entries)if(value.until<=now)this.entries.delete(key);
  const entry=this.entries.get(ip);if(entry){if(entry.count>=this.limit)return false;entry.count++;return true;}
  if(this.entries.size>=this.capacity)return false;
  this.entries.set(ip,{count:1,until:now+60000});return true;
 }
}
const limiter=new RateLimiter();
function failure(status:number,message:string){return Response.json({jsonrpc:'2.0',id:null,error:{code:status===429?-32029:-32600,message}},{status,headers:{'Cache-Control':'no-store',...(status===429?{'Retry-After':'60'}:{})}});}
export type HandlerOptions={hosts?:string[];limiter?:RateLimiter;fetcher?:typeof fetch;trustedVercelProxy?:boolean};
export async function handleMcp(request:Request,options:HandlerOptions={}){
 const url=new URL(request.url),hosts=options.hosts||['mcp.shiptested.com',...(process.env.VERCEL_URL?[process.env.VERCEL_URL]:[]),...(process.env.NODE_ENV==='development'?['localhost:3180','127.0.0.1:3180']:[])];
 if(!hosts.includes(url.host))return failure(403,'Unrecognised host.');
 const origin=request.headers.get('origin');if(origin&&origin!==url.origin)return failure(403,'Origin is not allowed.');
 if(request.method!=='POST')return new Response(null,{status:405,headers:{Allow:'POST'}});
 const trusted=options.trustedVercelProxy??process.env.VERCEL==='1';
 const ip=trusted?(request.headers.get('x-vercel-forwarded-for')||'unknown').split(',')[0].trim().slice(0,100):'local';
 if(!(options.limiter||limiter).allow(ip))return failure(429,'Rate limit: 30 requests per minute per IP per instance.');
 if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return failure(415,'Use application/json.');
 if(Number(request.headers.get('content-length')||0)>2_000_000)return failure(413,'Request body exceeds 2 MB.');
 const controller=new AbortController();const signal=AbortSignal.any([controller.signal,request.signal]);let transport:WebStandardStreamableHTTPServerTransport|undefined;
 const timer=setTimeout(()=>controller.abort(),20000);
 const server=createServer({remote:true,cache,fetcher:options.fetcher,signal});
 try{
  if(!request.body)return failure(400,'Empty body.');
  const reader=request.body.getReader();signal.addEventListener('abort',()=>{void reader.cancel();},{once:true});
  const chunks:Uint8Array[]=[];let size=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>2_000_000)return failure(413,'Request body exceeds 2 MB.');chunks.push(value);}}finally{await reader.cancel();}
  if(signal.aborted)return failure(408,'Request timed out.');
  const bytes=new Uint8Array(size);let at=0;for(const c of chunks){bytes.set(c,at);at+=c.byteLength;}
  let body:unknown;try{body=JSON.parse(new TextDecoder().decode(bytes));}catch{return failure(400,'Invalid JSON.');}
  if(Array.isArray(body))return failure(400,'Batch requests are not supported.');
  transport=new WebStandardStreamableHTTPServerTransport({sessionIdGenerator:undefined,enableJsonResponse:true,maxRequestBodySize:2_000_000});
  await server.connect(transport);
  const response=await transport.handleRequest(request,{parsedBody:body});
  const headers=new Headers(response.headers);headers.set('Cache-Control','no-store');headers.set('X-Content-Type-Options','nosniff');
  return new Response(await response.arrayBuffer(),{status:response.status,headers});
 }catch{return failure(signal.aborted?408:400,signal.aborted?'Request timed out.':'Request could not be completed.');}
 finally{clearTimeout(timer);controller.abort();await server.close();}
}
