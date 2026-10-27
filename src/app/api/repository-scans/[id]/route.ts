import { database } from '@/lib/server/db';
import { requireActor } from '@/lib/server/session';
import { assertOrigin,json,failure } from '@/lib/server/http';
import { refusePublicDemo } from '@/lib/server/public-demo';
import { ScanJobs } from '@/lib/server/scan-jobs';
export const runtime='nodejs';
type Context={params:Promise<{id:string}>};
export async function GET(request:Request,{params}:Context) {
  const denied=refusePublicDemo();if(denied)return denied;
  try {
    const query=database(),actor=await requireActor(request,query);
    const job=await new ScanJobs(query).get(actor,(await params).id);
    return json({id:job.id,state:job.state,repository:job.repository,commit:job.commit_sha,attempts:job.attempts,createdAt:job.created_at,reportUrl:job.report_id?`/reports/${job.report_id}`:null,failureCode:job.failure_code});
  }catch(error){return failure(error);}
}
export async function DELETE(request:Request,{params}:Context) {
  const denied=refusePublicDemo();if(denied)return denied;
  try {
    assertOrigin(request);const query=database(),actor=await requireActor(request,query);
    const job=await new ScanJobs(query).cancelQueued(actor,(await params).id);
    return json({id:job.id,state:job.state});
  }catch(error){return failure(error);}
}
