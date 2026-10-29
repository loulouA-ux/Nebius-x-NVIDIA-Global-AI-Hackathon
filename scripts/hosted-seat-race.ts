/** Synthetic concurrency audit on the pinned disposable database only. */
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {database} from '../src/lib/server/db';
import {TeamAccess} from '../src/lib/server/team-access';
import {BillingStore} from '../src/lib/server/billing-store';
async function main(){
 const expected=process.env.SHIPTESTED_ACCEPTANCE_DB_HOST;if(!expected||new URL(process.env.DATABASE_URL||'').hostname!==expected)throw Error('Pin disposable database.');
 const q=database(),teams=new TeamAccess(q),billing=new BillingStore(q),outcomes=[];
 for(let i=0;i<8;i++){
  const workspace='seat-race:'+randomUUID(),owner={id:'github:950000001',workspaceId:workspace,role:'member' as const},member={id:'github:950000002',workspaceId:workspace,role:'member' as const},lease=randomUUID();
  await q("INSERT INTO sc_workspaces(id,owner_id,name,plan,seat_limit) VALUES($1,$2,'Synthetic concurrency test','team',2)",[workspace,owner.id]);
  await q("INSERT INTO sc_workspace_members(workspace_id,actor_id,role) VALUES($1,$2,'owner')",[workspace,owner.id]);
  await q("INSERT INTO sc_billing_accounts(workspace_id,customer_id,lease_token,lease_expires_at) VALUES($1,$2,$3,now()+interval '2 minutes')",[workspace,'cus_synthetic_'+randomUUID(),lease]);
  const invitation=await teams.invite(owner,'950000002');
  const calls=[()=>teams.accept(member,invitation.token),()=>billing.reconcile(workspace,lease,0,{subscriptionId:null,status:'canceled',seats:0,scansPerSeat:5})];
  if(i%2)calls.reverse();const settled=await Promise.allSettled(calls.map(fn=>fn()));
  const [row]=await q('SELECT seat_limit,seats_used,(SELECT count(*)::int FROM sc_workspace_members m WHERE m.workspace_id=w.id) AS members FROM sc_workspaces w WHERE id=$1',[workspace]);
  outcomes.push({iteration:i,results:settled.map(s=>s.status),seat_limit:Number(row.seat_limit),seats_used:Number(row.seats_used),members:Number(row.members)});
 }
 const evidence={verifiedAt:new Date().toISOString(),scope:'Actual Neon concurrent invitation acceptance and billing downgrade; synthetic workspaces only.',outcomes};
 writeFileSync('../outputs/hosted-acceptance/seat-concurrency.json',JSON.stringify(evidence,null,2)+'\n');
 console.log(JSON.stringify(evidence));
 for(const row of outcomes){assert.equal(row.seats_used,row.members);assert.ok(Number(row.members)<=Number(row.seat_limit));}
}
main().catch(()=>{console.error('Seat concurrency acceptance failed; see sanitized evidence.');process.exitCode=1;});
