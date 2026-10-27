import {runScan} from '@/lib/pipeline';
import {recordedDemo} from '@/lib/server/demo-report';
export const runtime='nodejs';
const headers={'Cache-Control':'public, max-age=300, s-maxage=3600'};
export async function GET(request:Request){
 const mode=new URL(request.url).searchParams.get('mode');
 if(mode==='availability')return Response.json({recorded:true},{headers});
 if(mode==='recorded'||mode==='default')return Response.json(recordedDemo(),{headers});
 const report=await runScan({mode:'demo'});
 return Response.json({...report,id:'demo-offline',createdAt:'2026-10-23T00:00:00Z',durationMs:0},{headers});
}
