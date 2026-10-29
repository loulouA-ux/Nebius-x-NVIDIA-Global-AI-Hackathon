import {z} from 'zod';
import {database} from '@/lib/server/db';
import {requireActor} from '@/lib/server/session';
import {ReportSharing} from '@/lib/server/report-sharing';
import {assertOrigin,body,json,failure,ApiError} from '@/lib/server/http';
import {refusePublicDemo} from '@/lib/server/public-demo';
import {validateScanId} from '@/lib/server/scan-id';
export const runtime='nodejs';
type Context={params:Promise<{id:string}>};
export async function GET(request:Request,{params}:Context){
  const denied=refusePublicDemo();if(denied)return denied;
  try{const q=database(),actor=await requireActor(request,q);return json({shares:await new ReportSharing(q).list(actor,validateScanId((await params).id))});}catch(error){return failure(error);}
}
export async function POST(request:Request,{params}:Context){
  const denied=refusePublicDemo();if(denied)return denied;
  try{assertOrigin(request);const q=database(),actor=await requireActor(request,q);return json(await new ReportSharing(q).create(actor,validateScanId((await params).id)),201);}catch(error){return failure(error);}
}
export async function DELETE(request:Request,{params}:Context){
  const denied=refusePublicDemo();if(denied)return denied;
  try{assertOrigin(request);const q=database(),actor=await requireActor(request,q),sharing=new ReportSharing(q);
    const parsed=z.object({id:z.string().uuid()}).strict().safeParse(await body(request,1000));if(!parsed.success)throw new ApiError(400,'Invalid share ID.');
    const shares=await sharing.list(actor,validateScanId((await params).id));if(!shares.some(s=>s.id===parsed.data.id))throw new ApiError(404,'Share link not found.');
    await sharing.revoke(actor,parsed.data.id);return json({revoked:true});
  }catch(error){return failure(error);}
}
