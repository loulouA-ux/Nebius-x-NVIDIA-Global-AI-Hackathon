import {randomBytes,randomUUID} from 'node:crypto';
import type {Query} from './db';
import {Store,type Actor} from './store';
import {ApiError} from './http';
import {shareTokenHash,activeMembership} from './team-access';
import {githubMemberAllowed} from './github-session';
import type {ScanReport} from '../types';
export class ReportSharing {
  constructor(private query:Query) {}
  async create(actor:Actor,scanId:string) {
    await new Store(this.query).getScan(actor,scanId);
    const id=randomUUID(),token=randomBytes(32).toString('hex');
    const [result]=await this.query(`WITH ranked AS (
      SELECT m.actor_id,m.role,w.plan,w.seat_limit,
        row_number() OVER(ORDER BY CASE WHEN m.role='owner' THEN 0 ELSE 1 END,m.created_at,m.actor_id) AS seat
      FROM sc_workspace_members m JOIN sc_workspaces w ON w.id=m.workspace_id WHERE m.workspace_id=$3
    ), share AS (
      INSERT INTO sc_report_shares(id,scan_id,workspace_id,owner_id,token_hash,expires_at)
      SELECT $1,$2,$3,$4,$5,now()+interval '7 days' FROM ranked WHERE actor_id=$4 AND seat<=seat_limit AND (plan='team' OR role='owner') RETURNING id,expires_at
    ), event AS (INSERT INTO sc_workspace_events(workspace_id,actor_id,event_type,subject_id)
      SELECT $3,$4,'report_shared',id::text FROM share)
    SELECT id,expires_at FROM share`,[id,scanId,actor.workspaceId,actor.id,shareTokenHash(token)],{serializable:true});
    if(!result)throw new ApiError(403,'Workspace membership is required.');
    return {id,token,expiresAt:result.expires_at};
  }
  async list(actor:Actor,scanId:string) {
    await new Store(this.query).getScan(actor,scanId);
    return this.query('SELECT id,expires_at,revoked_at,created_at FROM sc_report_shares WHERE scan_id=$1 AND workspace_id=$2 AND owner_id=$3 ORDER BY created_at DESC',[scanId,actor.workspaceId,actor.id]);
  }
  async revoke(actor:Actor,id:string) {
    const [result]=await this.query(`WITH share AS (
      UPDATE sc_report_shares SET revoked_at=now() WHERE id=$1 AND workspace_id=$2 AND owner_id=$3 RETURNING id
    ), event AS (INSERT INTO sc_workspace_events(workspace_id,actor_id,event_type,subject_id)
      SELECT $2,$3,'report_share_revoked',id::text FROM share)
    SELECT id FROM share`,[id,actor.workspaceId,actor.id]);
    if(!result)throw new ApiError(404,'Share link not found.');
  }
  async read(token:string):Promise<ScanReport> {
    if(!/^[a-f0-9]{64}$/.test(token))throw new ApiError(404,'Share link is unavailable.');
    const [row]=await this.query(`SELECT scans.report,share.workspace_id,share.owner_id FROM sc_report_shares share JOIN sc_scans scans
      ON scans.id=share.scan_id AND scans.workspace_id=share.workspace_id AND scans.owner_id=share.owner_id
      JOIN sc_workspace_members member ON member.workspace_id=share.workspace_id AND member.actor_id=share.owner_id
      WHERE share.token_hash=$1 AND share.expires_at>now() AND share.revoked_at IS NULL`,[shareTokenHash(token)]);
    if(!row)throw new ApiError(404,'Share link is expired or revoked.');
    const ownerId=String(row.owner_id),workspaceId=String(row.workspace_id);
    if(!await activeMembership(this.query,workspaceId,ownerId))throw new ApiError(404,'Share link is expired or revoked.');
    if(ownerId.startsWith('github:')){
      const githubId=ownerId.slice(7);
      const [account]=await this.query('SELECT disabled FROM sc_github_accounts WHERE github_id=$1',[githubId]);
      if(!githubMemberAllowed(githubId)||!account||account.disabled)throw new ApiError(404,'Share link is expired or revoked.');
    }
    return row.report as ScanReport;
  }
}
