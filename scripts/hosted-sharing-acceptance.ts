/** Disposable database + protected deployed share endpoint; never logs share tokens. */
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {database} from '../src/lib/server/db';
import {ReportSharing} from '../src/lib/server/report-sharing';
import {workspaceUsage} from '../src/lib/server/usage';
async function main(){
 const expected=process.env.SHIPTESTED_ACCEPTANCE_DB_HOST;
 if(!expected||new URL(process.env.DATABASE_URL||'').hostname!==expected)throw Error('Pin disposable database.');
 const deployment=process.env.SHIPTESTED_ACCEPTANCE_DEPLOYMENT;
 if(!deployment||!/^shipcheck-[a-z0-9]+-hey-salad-inc\.vercel\.app$/.test(deployment))throw Error('Pin deployment.');
 const q=database(),shares=new ReportSharing(q),actor={id:'github:900000001',workspaceId:'github:900000001',role:'member' as const};
 const [scan]=await q('SELECT id FROM sc_scans WHERE owner_id=$1 AND workspace_id=$2 ORDER BY created_at DESC LIMIT 1',[actor.id,actor.workspaceId]);
 assert.ok(scan,'Existing synthetic report required.');
 const before=await workspaceUsage(q,actor);
 const share=await shares.create(actor,String(scan.id));
 const call=(token:string)=>{
  const directory=mkdtempSync(join(tmpdir(),'shiptested-share-'));
  try{
   const path=join(directory,'request.conf');
   writeFileSync(path,['silent','show-error','max-time = 30','request = "POST"','header = "Content-Type: application/json"','header = "Origin: https://shipcheck-git-codex-hosted-workflow-hey-salad-inc.vercel.app"',`data = ${JSON.stringify(JSON.stringify({token}))}`,'write-out = "\\nSTATUS:%{http_code}"'].join('\n'),{mode:0o600});
   const raw=execFileSync(process.env.VERCEL_CLI||'vercel',['curl','/api/shared-report','--deployment',`https://${deployment}`,'--scope','hey-salad-inc','--','--config',path],{encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:60000});
   const marker=raw.lastIndexOf('\nSTATUS:');assert.ok(marker>=0);
   return {status:Number(raw.slice(marker+8)),body:JSON.parse(raw.slice(0,marker))};
  }finally{rmSync(directory,{recursive:true,force:true});}
 };
 try{
  const allowed=call(share.token);assert.equal(allowed.status,200);assert.equal(allowed.body.readOnly,true);assert.equal(allowed.body.report.id,scan.id);
  assert.equal(call('0'.repeat(64)).status,404);
  await shares.revoke(actor,share.id);assert.equal(call(share.token).status,404);
  const events=await q('SELECT event_type FROM sc_workspace_events WHERE workspace_id=$1 AND subject_id=$2',[actor.workspaceId,share.id]);
  assert.ok(events.some(r=>r.event_type==='report_shared'));assert.ok(events.some(r=>r.event_type==='report_share_revoked'));
  assert.equal((await workspaceUsage(q,actor)).reserved,before.reserved);
  const evidence={verifiedAt:new Date().toISOString(),deployment,scope:'Actual Neon share creation/revocation, deployed HTTP read endpoint, synthetic report; browser UI not exercised.',checks:['read-only shared report response','invalid token denial','revoked token denial','create/revoke audit events','no scan allowance consumption']};
  writeFileSync('../outputs/hosted-acceptance/sharing.json',JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence));
 }finally{
  const rows=await shares.list(actor,String(scan.id));if(rows.some(r=>r.id===share.id&&!r.revoked_at))await shares.revoke(actor,share.id);
 }
}
main().catch(()=>{console.error('Sharing acceptance failed; credentials and response bodies suppressed.');process.exitCode=1;});
