import type { Query } from './db';
import { ApiError } from './http';

/** Personal workspaces derive from the verified GitHub numeric ID, not submitted names. */
export async function provisionPersonalWorkspace(query:Query,githubId:string) {
  if(!/^[1-9][0-9]*$/.test(githubId))throw new ApiError(400,'Invalid verified GitHub identity.');
  const id=`github:${githubId}`;
  await query(`WITH workspace AS (
    INSERT INTO sc_workspaces(id,owner_id,name) VALUES($1,$1,'Personal workspace')
    ON CONFLICT(id) DO UPDATE SET id=excluded.id RETURNING id,owner_id
  ) INSERT INTO sc_workspace_members(workspace_id,actor_id,role)
    SELECT id,owner_id,'owner' FROM workspace ON CONFLICT(workspace_id,actor_id) DO NOTHING`,[id]);
  // A free allowance is a product configuration, never a value accepted from a client.
  // Paid allowances are reconciled by billing; never reset their usage at sign-in.
  await query(`INSERT INTO sc_scan_allowances(workspace_id,period_start,scan_limit)
    SELECT id,date_trunc('month',now() AT TIME ZONE 'UTC')::date,5 FROM sc_workspaces
    WHERE id=$1 AND plan='free' ON CONFLICT(workspace_id,period_start) DO NOTHING`,[id]);
}

/** Additional workspaces start without scan credits; creation cannot multiply free allowances. */
export async function createWorkspace(query:Query,actorId:string,name:string) {
 if(!/^github:[1-9][0-9]*$/.test(actorId))throw new ApiError(403,'Sign in with GitHub to create a workspace.');
 name=name.trim();if(!name||name.length>80||/[\x00-\x1f]/.test(name))throw new ApiError(400,'Use a workspace name between 1 and 80 characters.');
 const {randomUUID}=await import('node:crypto');const id='workspace:'+randomUUID();
 const rows=await query(`WITH workspace AS (
 INSERT INTO sc_workspaces(id,owner_id,name)
 SELECT $1,$2,$3 WHERE (SELECT count(*) FROM sc_workspaces WHERE owner_id=$2)<10 RETURNING id
 ), member AS (INSERT INTO sc_workspace_members(workspace_id,actor_id,role) SELECT id,$2,'owner' FROM workspace),
 allowance AS (INSERT INTO sc_scan_allowances(workspace_id,period_start,scan_limit) SELECT id,date_trunc('month',now() AT TIME ZONE 'UTC')::date,0 FROM workspace),
 event AS (INSERT INTO sc_workspace_events(workspace_id,actor_id,event_type,subject_id) SELECT id,$2,'workspace_created',id FROM workspace)
 SELECT id FROM workspace`,[id,actorId,name],{serializable:true});
 if(!rows.length)throw new ApiError(409,'You can own up to 10 workspaces.');return id;
}
export async function renameWorkspace(query:Query,actorId:string,workspaceId:string,name:string){
 name=name.trim();if(!name||name.length>80||/[\x00-\x1f]/.test(name))throw new ApiError(400,'Use a workspace name between 1 and 80 characters.');
 const rows=await query(`WITH renamed AS (UPDATE sc_workspaces SET name=$3 WHERE id=$1 AND owner_id=$2 RETURNING id)
 INSERT INTO sc_workspace_events(workspace_id,actor_id,event_type,subject_id) SELECT id,$2,'workspace_renamed',id FROM renamed RETURNING sequence`,[workspaceId,actorId,name]);
 if(!rows.length)throw new ApiError(403,'Only the workspace owner can rename it.');
}
