import {createHash,randomBytes,randomUUID} from 'node:crypto';
import type {Query} from './db';
import type {Actor} from './store';
import {ApiError} from './http';
const digest=(value:string)=>createHash('sha256').update(value).digest('hex');
export async function activeMembership(query:Query,workspaceId:string,actorId:string) {
  const [row]=await query(`WITH ranked AS (
    SELECT m.actor_id,m.role,w.plan,w.seat_limit,
    row_number() OVER(ORDER BY CASE WHEN m.role='owner' THEN 0 ELSE 1 END,m.created_at,m.actor_id) AS seat
    FROM sc_workspace_members m JOIN sc_workspaces w ON w.id=m.workspace_id WHERE m.workspace_id=$1
  ) SELECT role FROM ranked WHERE actor_id=$2 AND seat<=seat_limit AND (plan='team' OR role='owner')`,[workspaceId,actorId]);
  return row;
}
export class TeamAccess {
  constructor(private query:Query) {}
  async role(actor:Actor) {
    const row=await activeMembership(this.query,actor.workspaceId,actor.id);
    if(!row)throw new ApiError(403,'Workspace membership is required.');
    return String(row.role);
  }
  private async owner(actor:Actor) {if(await this.role(actor)!=='owner')throw new ApiError(403,'Only the workspace owner can manage members.');}
  async list(actor:Actor) {await this.role(actor);return this.query('SELECT actor_id,role,created_at FROM sc_workspace_members WHERE workspace_id=$1 ORDER BY created_at',[actor.workspaceId]);}
  async invite(actor:Actor,githubId:string,role:'admin'|'member'='member') {
    await this.owner(actor);
    if(!/^[1-9][0-9]*$/.test(githubId)||!['admin','member'].includes(role))throw new ApiError(400,'Choose a numeric GitHub identity and member role.');
    const [workspace]=await this.query("SELECT seat_limit,seats_used FROM sc_workspaces WHERE id=$1 AND plan='team'",[actor.workspaceId]);
    if(!workspace||Number(workspace.seats_used)>=Number(workspace.seat_limit))throw new ApiError(409,'Add a paid team seat before inviting another member.');
    const id=randomUUID(),token=randomBytes(32).toString('hex');
    await this.query(`WITH invitation AS (
      INSERT INTO sc_workspace_invites(id,workspace_id,invited_actor_id,token_hash,role,created_by,expires_at)
      VALUES($1,$2,$3,$4,$5,$6,now()+interval '7 days') RETURNING id
    ) INSERT INTO sc_workspace_events(workspace_id,actor_id,event_type,subject_id)
      SELECT $2,$6,'member_invited',id::text FROM invitation`,[id,actor.workspaceId,`github:${githubId}`,digest(token),role,actor.id]);
    return {id,token};
  }
  async accept(actor:Actor,token:string) {
    if(!/^[a-f0-9]{64}$/.test(token))throw new ApiError(404,'Invitation is unavailable.');
    const rows=await this.query(`WITH invitation AS (
      UPDATE sc_workspace_invites SET accepted_at=now() WHERE token_hash=$1 AND invited_actor_id=$2
      AND expires_at>now() AND accepted_at IS NULL AND revoked_at IS NULL RETURNING *
    ), seat AS (
      UPDATE sc_workspaces w SET seats_used=seats_used+1 FROM invitation i
      WHERE w.id=i.workspace_id AND w.plan='team' AND w.seats_used<w.seat_limit RETURNING w.id
    ), member AS (
      INSERT INTO sc_workspace_members(workspace_id,actor_id,role)
      SELECT i.workspace_id,$2,i.role FROM invitation i JOIN seat ON seat.id=i.workspace_id
      RETURNING workspace_id
    ), event AS (
      INSERT INTO sc_workspace_events(workspace_id,actor_id,event_type,subject_id)
      SELECT workspace_id,$2,'member_joined',$2 FROM member
    ) SELECT workspace_id FROM member`,[digest(token),actor.id]);
    if(!rows.length)throw new ApiError(409,'Invitation is expired, revoked, used, or the team has no available seat. Ask the owner for a new invitation.');
    return String(rows[0].workspace_id);
  }
  async revokeInvite(actor:Actor,id:string) {
    await this.owner(actor);
    await this.query(`WITH revoked AS (UPDATE sc_workspace_invites SET revoked_at=now()
      WHERE id=$1 AND workspace_id=$2 AND accepted_at IS NULL RETURNING id)
      INSERT INTO sc_workspace_events(workspace_id,actor_id,event_type,subject_id)
      SELECT $2,$3,'invite_revoked',id::text FROM revoked`,[id,actor.workspaceId,actor.id]);
  }
  async remove(actor:Actor,target:string) {
    await this.owner(actor);
    const removed=await this.query(`WITH member AS (
      DELETE FROM sc_workspace_members WHERE workspace_id=$1 AND actor_id=$2 AND role<>'owner' RETURNING actor_id
    ), seats AS (UPDATE sc_workspaces SET seats_used=seats_used-1 WHERE id=$1 AND EXISTS(SELECT 1 FROM member)),
    sessions AS (DELETE FROM sc_sessions WHERE workspace_id=$1 AND actor_id=$2 AND EXISTS(SELECT 1 FROM member)),
    event AS (INSERT INTO sc_workspace_events(workspace_id,actor_id,event_type,subject_id)
      SELECT $1,$3,'member_removed',actor_id FROM member)
    SELECT actor_id FROM member`,[actor.workspaceId,target,actor.id]);
    if(!removed.length)throw new ApiError(404,'Removable member not found.');
  }
  async history(actor:Actor) {await this.role(actor);return this.query('SELECT sequence,actor_id,event_type,subject_id,created_at FROM sc_workspace_events WHERE workspace_id=$1 ORDER BY sequence DESC LIMIT 100',[actor.workspaceId]);}
}

export const shareTokenHash=digest;
