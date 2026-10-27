import {createHash,randomBytes,randomUUID} from 'node:crypto';
import type {Query} from './db';
import type {Actor} from './store';
import {requireActor} from './session';
import {activeMembership,TeamAccess} from './team-access';
import {githubMemberAllowed} from './github-session';
import {ApiError} from './http';
const digest=(token:string)=>createHash('sha256').update(token).digest('hex');
export async function createApiToken(query:Query,actor:Actor,name:string,canScan:boolean){
  await new TeamAccess(query).role(actor);
  if(!/^github:[1-9][0-9]*$/.test(actor.id))throw new ApiError(403,'Sign in with GitHub to create an agent token.');
  if(!name.trim()||name.length>80)throw new ApiError(400,'Choose a token name of 1–80 characters.');
  const token='st_'+randomBytes(32).toString('hex'),id=randomUUID();
  const [result]=await query(`WITH token AS (
    INSERT INTO sc_api_tokens(id,token_hash,workspace_id,actor_id,name,can_scan,expires_at)
    VALUES($1,$2,$3,$4,$5,$6,now()+interval '30 days') RETURNING expires_at
  ), event AS (INSERT INTO sc_workspace_events(workspace_id,actor_id,event_type,subject_id)
    SELECT $3,$4,'api_token_created',$1 FROM token)
  SELECT expires_at FROM token`,[id,digest(token),actor.workspaceId,actor.id,name.trim(),canScan]);
  return {id,token,expiresAt:result.expires_at};
}
export async function listApiTokens(query:Query,actor:Actor){
  await new TeamAccess(query).role(actor);
  return query('SELECT id,name,can_scan,expires_at,revoked_at,last_used_at FROM sc_api_tokens WHERE workspace_id=$1 AND actor_id=$2 ORDER BY created_at DESC',[actor.workspaceId,actor.id]);
}
export async function revokeApiToken(query:Query,actor:Actor,id:string){
  const [result]=await query(`WITH token AS (UPDATE sc_api_tokens SET revoked_at=now()
    WHERE id=$1 AND workspace_id=$2 AND actor_id=$3 RETURNING id),
    event AS (INSERT INTO sc_workspace_events(workspace_id,actor_id,event_type,subject_id)
      SELECT $2,$3,'api_token_revoked',id::text FROM token)
    SELECT id FROM token`,[id,actor.workspaceId,actor.id]);
  if(!result)throw new ApiError(404,'Token not found.');
}
export async function requireApiActor(request:Request,query:Query,write=false):Promise<Actor>{
  const authorization=request.headers.get('authorization');
  if(!authorization)return requireActor(request,query);
  if(!/^Bearer st_[a-f0-9]{64}$/.test(authorization))throw new ApiError(401,'Invalid agent token.');
  const [row]=await query('SELECT id,workspace_id,actor_id,can_scan FROM sc_api_tokens WHERE token_hash=$1 AND revoked_at IS NULL AND expires_at>now()',[digest(authorization.slice(7))]);
  if(!row||!/^github:[1-9][0-9]*$/.test(String(row.actor_id)))throw new ApiError(401,'Agent token is expired or revoked.');
  const githubId=String(row.actor_id).slice(7);
  const [account]=await query('SELECT disabled FROM sc_github_accounts WHERE github_id=$1',[githubId]);
  if(!githubMemberAllowed(githubId)||!account||account.disabled||!await activeMembership(query,String(row.workspace_id),String(row.actor_id)))throw new ApiError(401,'Agent access is revoked.');
  if(write&&!row.can_scan)throw new ApiError(403,'This token can read reports but cannot start or cancel scans.');
  await query('UPDATE sc_api_tokens SET last_used_at=now() WHERE id=$1',[row.id]);
  return {id:String(row.actor_id),workspaceId:String(row.workspace_id),role:'member'};
}
