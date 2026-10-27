/** OSV only. No redirects, telemetry, credentials or target-supplied hosts. */
export async function boundedJson(url:string,init:RequestInit={},fetcher:typeof fetch=fetch):Promise<unknown>{
 const target=new URL(url);
 if(target.origin!=='https://api.osv.dev'||target.username||target.password||target.port||target.hash||target.search||!/^\/v1\/(querybatch|vulns\/[A-Za-z0-9._-]+)$/.test(target.pathname))throw Error('Only the OSV API is allowed.');
 const signal=init.signal?AbortSignal.any([init.signal,AbortSignal.timeout(15000)]):AbortSignal.timeout(15000);
 const response=await fetcher(url,{...init,redirect:'error',signal});
 if(!response.ok)throw Error('OSV request failed.');
 if(Number(response.headers.get('content-length')??0)>1_000_000)throw Error('OSV response too large.');
 if(!response.body)throw Error('Empty OSV response.');
 const reader=response.body.getReader();let size=0;const chunks:Uint8Array[]=[];
 try{while(true){signal.throwIfAborted();const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>1_000_000)throw Error('OSV response too large.');chunks.push(value);}}finally{await reader.cancel();}
 const all=new Uint8Array(size);let offset=0;for(const chunk of chunks){all.set(chunk,offset);offset+=chunk.length;}
 return JSON.parse(new TextDecoder().decode(all));
}
