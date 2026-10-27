import {z} from 'zod';
import {database} from '@/lib/server/db';
import {requireActor,switchWorkspace} from '@/lib/server/session';
import {TeamAccess} from '@/lib/server/team-access';
import {assertOrigin,body,json,failure,ApiError} from '@/lib/server/http';
import {refusePublicDemo} from '@/lib/server/public-demo';
export const runtime='nodejs';
export async function GET(request:Request){
  const denied=refusePublicDemo();if(denied)return denied;
  try {
    const q=database(),actor=await requireActor(request,q),team=new TeamAccess(q);
    return json({actor,workspaces:await q('SELECT w.id,w.name,w.plan,w.seat_limit,w.seats_used,m.role FROM sc_workspaces w JOIN sc_workspace_members m ON m.workspace_id=w.id WHERE m.actor_id=$1 ORDER BY w.created_at',[actor.id]),members:await team.list(actor),events:await team.history(actor)});
  }catch(error){return failure(error);}
}
const input=z.discriminatedUnion('action',[
  z.object({action:z.literal('switch'),workspaceId:z.string().min(1).max(150)}).strict(),
  z.object({action:z.literal('invite'),githubId:z.string().regex(/^[1-9][0-9]*$/),role:z.enum(['admin','member'])}).strict(),
  z.object({action:z.literal('accept'),token:z.string().regex(/^[a-f0-9]{64}$/)}).strict(),
  z.object({action:z.literal('revokeInvite'),id:z.string().uuid()}).strict(),
  z.object({action:z.literal('remove'),actorId:z.string().regex(/^github:[1-9][0-9]*$/)}).strict(),
]);
export async function POST(request:Request){
  const denied=refusePublicDemo();if(denied)return denied;
  try {
    assertOrigin(request);const q=database(),actor=await requireActor(request,q),team=new TeamAccess(q);
    const parsed=input.safeParse(await body(request,2000));if(!parsed.success)throw new ApiError(400,'Invalid workspace action.');
    const data=parsed.data;
    if(data.action==='switch')return json({actor:await switchWorkspace(request,q,data.workspaceId)});
    if(data.action==='invite')return json(await team.invite(actor,data.githubId,data.role),201);
    if(data.action==='accept'){const workspaceId=await team.accept(actor,data.token);return json({actor:await switchWorkspace(request,q,workspaceId)});}
    if(data.action==='remove')await team.remove(actor,data.actorId);
    if(data.action==='revokeInvite')await team.revokeInvite(actor,data.id);
    return json({ok:true});
  }catch(error){return failure(error);}
}
