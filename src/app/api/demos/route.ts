import {readFile} from 'node:fs/promises';
import {runScan} from '@/lib/pipeline';
import type {ScanReport} from '@/lib/types';
export const runtime='nodejs';
export async function GET(request:Request){
 const mode=new URL(request.url).searchParams.get('mode');
 let recorded: {recordedAt:string;model:string;region:string;commit:string;report:ScanReport}|undefined;
 try {recorded=JSON.parse(await readFile(process.cwd()+'/fixtures/recorded-live-run.json','utf8'));}catch{}
 if(mode==='availability')return Response.json({recorded:Boolean(recorded)},{headers:{'Cache-Control':'no-store'}});
 if(mode==='recorded'&&!recorded)return Response.json({error:'Recorded live run not captured yet'},{status:404});
 if((mode==='recorded'||mode==='default')&&recorded)return Response.json({...recorded.report,id:'demo-recorded',mode:'demo',recording:{recordedAt:recorded.recordedAt,model:recorded.model,region:recorded.region,commit:recorded.commit}},{headers:{'Cache-Control':'no-store'}});
 const report=await runScan({mode:'demo'});
 return Response.json({...report,id:'demo-offline',createdAt:'2026-10-23T00:00:00Z',durationMs:0},{headers:{'Cache-Control':'no-store'}});
}
