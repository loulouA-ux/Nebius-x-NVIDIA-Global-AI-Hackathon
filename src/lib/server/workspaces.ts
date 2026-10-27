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
