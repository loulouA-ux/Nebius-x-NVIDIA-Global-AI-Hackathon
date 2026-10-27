import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
export const runtime='nodejs';
export const maxDuration=25;

export async function POST(request:Request){
 const controller=new AbortController();
 const signal=AbortSignal.any([request.signal,controller.signal,AbortSignal.timeout(20000)]);
 if(request.headers.get('origin')!==new URL(request.url).origin)return Response.json({error:'Refresh this page and try again.'},{status:403});
 if(Number(request.headers.get('content-length')||0)>2_000_000)return Response.json({error:'Request exceeds 2 MB.'},{status:413});
 const reader=request.body?.getReader();
 if(!reader)return Response.json({error:'Paste a lockfile first.'},{status:400});
 const chunks:Uint8Array[]=[];let size=0;
 signal.addEventListener('abort',()=>{void reader.cancel();},{once:true});
 try{
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>2_000_000)return Response.json({error:'Request exceeds 2 MB.'},{status:413});chunks.push(value);}
 }catch{return Response.json({error:'Request could not be read.'},{status:400});}
 finally{await reader.cancel();}
 if(signal.aborted)return Response.json({error:'Request timed out. Try a smaller lockfile.'},{status:408});
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 let content:string;
 try{const data=JSON.parse(new TextDecoder().decode(bytes));if(typeof data.content!=='string'||!data.content)throw Error();content=data.content;}
 catch{return Response.json({error:'Paste valid lockfile text.'},{status:400});}
 const client=new Client({name:'shiptested-playground',version:'0.1.0'});
 const encoder=new TextEncoder();let closed=false;
 const stream=new ReadableStream<Uint8Array>({
  async start(out){
   const send=(event:unknown)=>{if(!closed)out.enqueue(encoder.encode(JSON.stringify(event)+'\n'));};
   try{
    await client.connect(new StreamableHTTPClientTransport(new URL('https://mcp.shiptested.com/mcp')),{timeout:5000,signal});
    const result=await client.callTool({name:'scan_lockfile',arguments:{content}},undefined,{
     timeout:20000,signal,
     onprogress:progress=>send({type:'stage',progress:progress.progress,total:progress.total,message:progress.message}),
    });
    if(result.isError)send({type:'error',error:'The remote check could not complete. Check the file format or try the local CLI.'});
    else send({type:'result',result:result.structuredContent});
   }catch{send({type:'error',error:signal.aborted?'The remote scan timed out or was cancelled. No clean result is implied.':'The remote MCP service is not available. Use the local CLI or try again.'});}
   finally{if(!closed){closed=true;out.close();}controller.abort();await client.close();}
  },
  async cancel(){closed=true;controller.abort();await client.close();},
 });
 return new Response(stream,{headers:{'Content-Type':'application/x-ndjson; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}
