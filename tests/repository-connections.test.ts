import {beforeAll,beforeEach,afterAll,afterEach,it,expect,vi} from 'vitest';
import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import {generateKeyPairSync} from 'node:crypto';
import * as dbModule from '../src/lib/server/db';
import {installationToken} from '../src/lib/server/github-repositories';
import type {Query} from '../src/lib/server/db';
import {createGitHubSession} from '../src/lib/server/github-session';
import {beginRepositoryConnection,completeRepositoryConnection,connectionStatus,selectInstallation,authorizedRepositoryGrant,disconnectRepositories} from '../src/lib/server/repository-connections';
const db=new PGlite();const q:Query=async(sql,params=[])=>(await db.query(sql,params)).rows as Record<string,unknown>[];
const actor={id:'github:1',workspaceId:'github:1',role:'member' as const};
let removed=false,identity=1;
const fetcher:typeof fetch=async(input)=>{
 const url=new URL(String(input));
 if(url.pathname==='/login/oauth/access_token')return Response.json({access_token:'private-synthetic-user-token',token_type:'bearer',expires_in:28800});
 if(url.pathname==='/user')return Response.json({id:identity});
 if(url.pathname==='/user/installations')return Response.json({total_count:removed?0:2,installations:removed?[]:[{id:12,app_id:99,account:{login:'org'},suspended_at:null},{id:13,app_id:100,account:{login:'different-app'},suspended_at:null}]});
 if(url.pathname==='/user/installations/12/repositories')return Response.json({total_count:1,repositories:[{id:123}]});
 throw Error('Unexpected provider request');
};
beforeAll(async()=>{for(const f of ['001_core','002_hosted_jobs','003_workspaces','004_team_sharing','008_repository_connections'])await db.exec(readFileSync(`migrations/${f}.sql`,'utf8'));});
beforeEach(async()=>{
 await db.exec('TRUNCATE sc_workspaces CASCADE; DELETE FROM sc_sessions; DELETE FROM sc_github_accounts; DELETE FROM sc_scan_allowances;');
 vi.stubEnv('SHIPTESTED_OPEN_REGISTRATION','1');vi.stubEnv('SHIPTESTED_CUSTOMER_REPOSITORIES','1');vi.stubEnv('GITHUB_APP_CLIENT_ID','app-client');vi.stubEnv('GITHUB_APP_CLIENT_SECRET','synthetic-secret');vi.stubEnv('GITHUB_APP_ID','99');vi.stubEnv('SHIPTESTED_APP_ORIGIN','https://example.test');vi.stubEnv('SHIPTESTED_CONNECTION_ENCRYPTION_KEY','a'.repeat(64));
 removed=false;identity=1;await createGitHubSession(q,{githubId:'1',login:'test'});
});
afterEach(()=>{vi.unstubAllEnvs();vi.restoreAllMocks();});afterAll(()=>db.close());
async function connect(){const flow=await beginRepositoryConnection(q,actor),state=new URL(flow.url).searchParams.get('state')!;await completeRepositoryConnection(q,actor,state,flow.browserToken,'code',fetcher);return {flow,state};}
it('binds one-time authorization to the signed-in account and stores an encrypted, short-lived token',async()=>{
 const {flow,state}=await connect();
 const [row]=await q('SELECT encrypted_token,expires_at FROM sc_repository_connections');expect(row.encrypted_token).not.toContain('private-synthetic');expect(new Date(String(row.expires_at)).getTime()-Date.now()).toBeLessThanOrEqual(3600000);
 await expect(completeRepositoryConnection(q,actor,state,flow.browserToken,'code',fetcher)).rejects.toMatchObject({status:400});
 const status=await connectionStatus(q,actor,fetcher);expect(status.installations).toEqual([{id:12,account:'org'}]);expect(JSON.stringify(status)).not.toContain('token');
 expect(new URL(flow.url).searchParams.get('redirect_uri')).toBe('https://example.test/api/github/connect/callback');expect(new URL(flow.url).searchParams.has('scope')).toBe(false);
});
it('rejects wrong browser, identity mismatch and forged installation selections',async()=>{
 const flow=await beginRepositoryConnection(q,actor),state=new URL(flow.url).searchParams.get('state')!;
 await expect(completeRepositoryConnection(q,actor,state,'b'.repeat(64),'code',fetcher)).rejects.toMatchObject({status:400});
 identity=2;await expect(completeRepositoryConnection(q,actor,state,flow.browserToken,'code',fetcher)).rejects.toMatchObject({status:403});
 expect(await q('SELECT * FROM sc_repository_connections')).toHaveLength(0);
 identity=1;await connect();await expect(selectInstallation(q,actor,13,fetcher)).rejects.toMatchObject({status:403});await expect(selectInstallation(q,actor,999,fetcher)).rejects.toMatchObject({status:403});
});
it('rechecks user-specific repository grants and revocation instead of trusting a stored installation ID',async()=>{
 await connect();await selectInstallation(q,actor,12,fetcher);
 expect(await authorizedRepositoryGrant(q,actor,fetcher)).toEqual({installationId:12,repositoryIds:[123],writableRepositoryIds:[]});
 removed=true;await expect(authorizedRepositoryGrant(q,actor,fetcher)).rejects.toMatchObject({status:403});
 removed=false;await disconnectRepositories(q,actor);await expect(authorizedRepositoryGrant(q,actor,fetcher)).rejects.toMatchObject({status:403});
});
it('rejects expired connections and ciphertext copied to another account',async()=>{
 await connect();await queryExpiry();await expect(connectionStatus(q,actor,fetcher)).rejects.toMatchObject({status:403});
 await connect();const other=await createGitHubSession(q,{githubId:'2',login:'other'});
 await q("INSERT INTO sc_repository_connections(workspace_id,actor_id,encrypted_token,expires_at) SELECT $1,$2,encrypted_token,expires_at FROM sc_repository_connections WHERE actor_id=$3",[other.actor.workspaceId,other.actor.id,actor.id]);
 await expect(connectionStatus(q,other.actor,fetcher)).rejects.toMatchObject({status:401});
});
async function queryExpiry(){await q("UPDATE sc_repository_connections SET expires_at=now()-interval '1 second'");}

it('mints an installation token restricted to the intersection of user and app repository access',async()=>{
 await connect();await selectInstallation(q,actor,12,fetcher);
 vi.spyOn(dbModule,'database').mockReturnValue(q);
 const key=generateKeyPairSync('rsa',{modulusLength:2048,privateKeyEncoding:{type:'pkcs8',format:'pem'},publicKeyEncoding:{type:'spki',format:'pem'}}).privateKey;
 vi.stubEnv('GITHUB_APP_PRIVATE_KEY',key);
 let minted=0;
 const provider:typeof fetch=async(input,init)=>{
  if(new URL(String(input)).pathname==='/app/installations/12/access_tokens'){
   minted++;expect(JSON.parse(String(init?.body))).toEqual({repository_ids:[123],permissions:{contents:'read'}});return Response.json({token:'scoped-installation-token'});
  }
  return fetcher(input,init);
 };
 expect(await installationToken(actor,undefined,false,provider)).toBe('scoped-installation-token');
 await expect(installationToken(actor,999,false,provider)).rejects.toMatchObject({status:404});expect(minted).toBe(1);
 await expect(installationToken(actor,123,true,provider)).rejects.toMatchObject({status:403});expect(minted).toBe(1);
 removed=true;await expect(installationToken(actor,123,false,provider)).rejects.toMatchObject({status:403});expect(minted).toBe(1);
});
it('does not save a provider token when membership is removed during OAuth exchange',async()=>{
 const flow=await beginRepositoryConnection(q,actor),state=new URL(flow.url).searchParams.get('state')!;
 const revokeDuringExchange:typeof fetch=async(input,init)=>{
  if(new URL(String(input)).pathname==='/user')await q('DELETE FROM sc_workspace_members WHERE workspace_id=$1',[actor.workspaceId]);
  return fetcher(input,init);
 };
 await expect(completeRepositoryConnection(q,actor,state,flow.browserToken,'code',revokeDuringExchange)).rejects.toMatchObject({status:403});
 expect(await q('SELECT actor_id FROM sc_repository_connections')).toEqual([]);
});
