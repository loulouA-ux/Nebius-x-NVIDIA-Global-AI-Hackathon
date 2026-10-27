import {database} from '@/lib/server/db';
import {requireActor} from '@/lib/server/session';
import {TeamAccess} from '@/lib/server/team-access';
import {billingConfig} from '@/lib/server/billing';
import {json,failure} from '@/lib/server/http';
import {refusePublicDemo} from '@/lib/server/public-demo';
export const runtime='nodejs';
export async function GET(request:Request){const denied=refusePublicDemo();if(denied)return denied;
  try{const q=database(),actor=await requireActor(request,q),role=await new TeamAccess(q).role(actor);
    const [workspace]=await q('SELECT plan,seat_limit,seats_used FROM sc_workspaces WHERE id=$1',[actor.workspaceId]);
    const [billing]=await q('SELECT subscription_status,reconciled_at FROM sc_billing_accounts WHERE workspace_id=$1',[actor.workspaceId]);
    let configured=false,testMode=true,scansPerSeat=5;try{const c=billingConfig();configured=true;testMode=!c.live;scansPerSeat=c.scansPerSeat;}catch{}
    return json({canManage:role==='owner',configured,testMode,priceMinor:300,currency:'GBP',interval:'month',scansPerSeat,plan:workspace.plan,seats:Number(workspace.seat_limit),occupied:Number(workspace.seats_used),subscriptionStatus:billing?.subscription_status??'none',lastReconciledAt:billing?.reconciled_at??null});
  }catch(error){return failure(error);}
}
