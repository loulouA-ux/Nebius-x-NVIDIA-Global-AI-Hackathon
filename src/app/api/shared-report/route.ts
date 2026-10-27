import {z} from 'zod';
import {database} from '@/lib/server/db';
import {ReportSharing} from '@/lib/server/report-sharing';
import {assertOrigin,body,json,failure,ApiError} from '@/lib/server/http';
import {refusePublicDemo} from '@/lib/server/public-demo';
export const runtime='nodejs';
// Token is sent in a POST body, not a URL, to keep it out of referrers and access logs.
export async function POST(request:Request){
  const denied=refusePublicDemo();if(denied)return denied;
  try {assertOrigin(request);const parsed=z.object({token:z.string().regex(/^[a-f0-9]{64}$/)}).strict().safeParse(await body(request,1000));
    if(!parsed.success)throw new ApiError(404,'Share link is unavailable.');
    return json({report:await new ReportSharing(database()).read(parsed.data.token),readOnly:true});
  }catch(error){return failure(error);}
}
