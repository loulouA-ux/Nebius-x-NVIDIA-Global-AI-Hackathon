import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {beforeAll,afterAll,it,expect} from 'vitest';
import {latestBatchProgress} from '../src/lib/server/batch-progress';
import type {Query} from '../src/lib/server/db';
const db=new PGlite();const q:Query=async(sql,args=[]) => (await db.query(sql,args)).rows as Record<string,unknown>[];
const actor={id:'github:123',workspaceId:'batch-test',role:'member' as const};
const entries=Array.from({length:215},(_,i)=>({repository:`heysalad-ai/repo${i}`,requestKey:randomUUID(),...(i===0?{skipReason:'empty_repository',skipCheckedAt:new Date().toISOString()}: {})}));
const job=randomUUID(),report=randomUUID();
beforeAll(async()=>{
 for(const f of ['001_core','002_hosted_jobs','003_workspaces','004_team_sharing','010_batch_dashboard'])await db.exec(readFileSync(`migrations/${f}.sql`,'utf8'));
 await q("INSERT INTO sc_workspaces(id,owner_id,name) VALUES($1,$2,'Batch')",[actor.workspaceId,actor.id]);
 await q("INSERT INTO sc_batch_plans(id,workspace_id,owner_id,title,entries) VALUES($1,$2,$3,'HeySalad', $4::jsonb)",[randomUUID(),actor.workspaceId,actor.id,JSON.stringify(entries)]);
 await q("INSERT INTO sc_scan_allowances(workspace_id,period_start,scan_limit,reserved) VALUES($1,current_date,500,2)",[actor.workspaceId]);
 await q("INSERT INTO sc_scan_jobs(id,workspace_id,owner_id,request_key,repository,commit_sha,period_start,state) VALUES($1,$2,$3,$4,$5,'abc',current_date,'queued')",[job,actor.workspaceId,actor.id,entries[1].requestKey,entries[1].repository]);
 // Same key and repository under another owner must never appear in this batch.
 await q("INSERT INTO sc_scan_jobs(id,workspace_id,owner_id,request_key,repository,commit_sha,period_start,state) VALUES($1,$2,'github:456',$3,$4,'abc',current_date,'failed')",[randomUUID(),actor.workspaceId,entries[2].requestKey,entries[2].repository]);
});
afterAll(()=>db.close());
it('includes all215 entries, waiting and verified skips without disclosing request keys',async()=>{
 const result=await latestBatchProgress(q,actor);
 expect(result).toMatchObject({total:215,finished:1,counts:{waiting:213,queued:1,skipped:1,failed:0}});
 expect(result!.entries[0]).toMatchObject({state:'skipped',detail:'Empty repository — no scan submitted.'});
 expect(JSON.stringify(result)).not.toContain(entries[0].requestKey);
});
it('isolates batch manifests by owner and workspace',async()=>{
 expect(await latestBatchProgress(q,{...actor,id:'github:456'})).toBeNull();
 expect(await latestBatchProgress(q,{...actor,workspaceId:'elsewhere'})).toBeNull();
});
it('reflects live state and incomplete verdicts without changing allowances',async()=>{
 await q("UPDATE sc_scan_jobs SET state='running' WHERE id=$1",[job]);
 expect((await latestBatchProgress(q,actor))!.counts.running).toBe(1);
 await q("INSERT INTO sc_scans(id,workspace_id,owner_id,report) VALUES($1,$2,$3,$4::jsonb)",[report,actor.workspaceId,actor.id,JSON.stringify({status:'Incomplete'})]);
 await q("UPDATE sc_scan_jobs SET state='completed',report_id=$2 WHERE id=$1",[job,report]);
 expect((await latestBatchProgress(q,actor))!.entries[1]).toMatchObject({state:'completed',verdict:'Incomplete',reportUrl:'/reports/'+report});
 expect(await q('SELECT reserved FROM sc_scan_allowances WHERE workspace_id=$1',[actor.workspaceId])).toEqual([{reserved:2}]);
});
it('gives accepted jobs precedence over stale skip annotations',async()=>{
 await q("UPDATE sc_scan_jobs SET request_key=$2,repository=$3 WHERE id=$1",[job,entries[0].requestKey,entries[0].repository]);
 const result=await latestBatchProgress(q,actor);expect(result!.entries[0].state).toBe('completed');expect(result!.counts.skipped).toBe(0);
});
