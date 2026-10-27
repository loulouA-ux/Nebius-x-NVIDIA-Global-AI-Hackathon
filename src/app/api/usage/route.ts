import { database } from '@/lib/server/db';
import { requireActor } from '@/lib/server/session';
import { json,failure } from '@/lib/server/http';
import { refusePublicDemo } from '@/lib/server/public-demo';
export const runtime='nodejs';
export async function GET(request:Request) {
  const denied=refusePublicDemo();if(denied)return denied;
  try {
    const query=database(),actor=await requireActor(request,query);
    const [row]=await query("SELECT period_start,scan_limit,reserved FROM sc_scan_allowances WHERE workspace_id=$1 AND period_start=date_trunc('month',now() AT TIME ZONE 'UTC')::date",[actor.workspaceId]);
    const counts=await query("SELECT state,count(*)::int AS count FROM sc_scan_jobs WHERE workspace_id=$1 AND owner_id=$2 AND period_start=date_trunc('month',now() AT TIME ZONE 'UTC')::date GROUP BY state",[actor.workspaceId,actor.id]);
    return json({configured:!!row,limit:Number(row?.scan_limit??0),reserved:Number(row?.reserved??0),remaining:Math.max(0,Number(row?.scan_limit??0)-Number(row?.reserved??0)),periodStart:row?.period_start??null,outcomes:counts});
  }catch(error){return failure(error);}
}
