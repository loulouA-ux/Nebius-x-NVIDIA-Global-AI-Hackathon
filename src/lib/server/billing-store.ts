import {randomUUID} from 'node:crypto';
import type {Query} from './db';
import type {Actor} from './store';
import {TeamAccess} from './team-access';
import {ApiError} from './http';
export class BillingStore {
  constructor(readonly query:Query){}
  async owner(actor:Actor){if(await new TeamAccess(this.query).role(actor)!=='owner')throw new ApiError(403,'Only the workspace owner can manage billing.');}
  async account(actor:Actor){await this.owner(actor);await this.query('INSERT INTO sc_billing_accounts(workspace_id) VALUES($1) ON CONFLICT DO NOTHING',[actor.workspaceId]);return (await this.query('SELECT * FROM sc_billing_accounts WHERE workspace_id=$1',[actor.workspaceId]))[0];}
  async recordEvent(id:string,customerId:string,type:string){
    await this.query(`WITH event AS (INSERT INTO sc_billing_events(id,customer_id,event_type) VALUES($1,$2,$3) ON CONFLICT DO NOTHING RETURNING customer_id)
      UPDATE sc_billing_accounts SET revision=revision+1 FROM event WHERE sc_billing_accounts.customer_id=event.customer_id`,[id,customerId,type]);
  }
  async claim(){
    const [row]=await this.query(`WITH candidate AS (SELECT workspace_id FROM sc_billing_accounts
      WHERE customer_id IS NOT NULL AND (revision>processed_revision OR reconciled_at IS NULL OR reconciled_at<now()-interval '1 hour')
      AND (lease_expires_at IS NULL OR lease_expires_at<now()) ORDER BY reconciled_at NULLS FIRST FOR UPDATE SKIP LOCKED LIMIT 1)
      UPDATE sc_billing_accounts b SET lease_token=$1,lease_expires_at=now()+interval '2 minutes'
      FROM candidate c WHERE b.workspace_id=c.workspace_id RETURNING b.*`,[randomUUID()]);
    return row??null;
  }
  async reconcile(workspaceId:string,token:string,revision:number,snapshot:{subscriptionId:string|null;status:string;seats:number;scansPerSeat:number}) {
    if(!Number.isInteger(snapshot.seats)||snapshot.seats<0||snapshot.seats>200||!Number.isInteger(snapshot.scansPerSeat)||snapshot.scansPerSeat<1||snapshot.scansPerSeat>100)throw new ApiError(400,'Invalid billing allowance.');
    const paid=snapshot.status==='active'&&snapshot.seats>0;
    const seats=paid?snapshot.seats:1,limit=paid?seats*snapshot.scansPerSeat:5;
    const rows=await this.query(`WITH billing AS (
      UPDATE sc_billing_accounts SET subscription_id=$4,subscription_status=$5,processed_revision=$3,
      lease_token=NULL,lease_expires_at=NULL,reconciled_at=now()
      WHERE workspace_id=$1 AND lease_token=$2 AND lease_expires_at>now() RETURNING workspace_id
    ), excess AS (
      SELECT m.actor_id FROM sc_workspace_members m JOIN billing b ON b.workspace_id=m.workspace_id
      ORDER BY CASE WHEN m.role='owner' THEN 0 ELSE 1 END,m.created_at,m.actor_id OFFSET $6
    ), removed AS (
      DELETE FROM sc_workspace_members WHERE workspace_id=$1 AND actor_id IN(SELECT actor_id FROM excess) AND role<>'owner' RETURNING actor_id
    ), sessions AS (DELETE FROM sc_sessions WHERE workspace_id=$1 AND actor_id IN(SELECT actor_id FROM removed)),
    events AS (INSERT INTO sc_workspace_events(workspace_id,actor_id,event_type,subject_id)
      SELECT $1,'billing','member_removed_for_seat_limit',actor_id FROM removed),
    workspace AS (
      UPDATE sc_workspaces SET plan=$7,seat_limit=$6,seats_used=LEAST(seats_used,$6)
      WHERE id IN(SELECT workspace_id FROM billing) RETURNING id
    ), allowance AS (
      INSERT INTO sc_scan_allowances(workspace_id,period_start,scan_limit)
      SELECT id,date_trunc('month',now() AT TIME ZONE 'UTC')::date,$8 FROM workspace
      ON CONFLICT(workspace_id,period_start) DO UPDATE SET scan_limit=GREATEST(sc_scan_allowances.reserved,$8)
    ) SELECT id FROM workspace`,[workspaceId,token,revision,snapshot.subscriptionId,snapshot.status,seats,paid?'team':'free',limit]);
    if(!rows.length)throw new ApiError(409,'Billing reconciliation lease expired.');
  }
}
