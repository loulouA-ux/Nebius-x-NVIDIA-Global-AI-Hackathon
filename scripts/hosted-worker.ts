/** Run on a trusted persistent host with a supervisor; never executes repository code. */
import {database} from '../src/lib/server/db';
import {publicDemo} from '../src/lib/server/public-demo';
import {observeWorker} from '../src/lib/server/worker-telemetry';
import {runRepositoryJob} from '../src/lib/server/repository-worker';
import {reconcileBilling,billingConfig} from '../src/lib/server/billing';
import {workerLoop} from '../src/lib/server/worker-loop';
async function main(){
 const host=process.env.SHIPTESTED_WORKER_DB_HOST;
 if(!host||new URL(process.env.DATABASE_URL||'').hostname!==host||publicDemo()||process.env.SHIPTESTED_PUBLIC_DEMO!=='0')throw Error('Worker target not explicitly enabled.');
 const deadline=Date.parse(process.env.SHIPTESTED_WORKER_STOP_AT||'');
 if(!Number.isFinite(deadline)||deadline<=Date.now()||deadline>Date.now()+86400000)throw Error('Set a future stop time within 24 hours.');
 const billing=process.env.SHIPTESTED_WORKER_BILLING==='1';if(billing)billingConfig();
 const q=database(),controller=new AbortController();
 const stop=()=>controller.abort();process.once('SIGTERM',stop);process.once('SIGINT',stop);
 try{
 const result=await workerLoop({signal:controller.signal,deadline,intervalMs:15000,maxCycles:5760,
  onError:()=>console.error('Worker cycle failed; inspect private worker metrics.'),
  run:async()=>{
   await q("INSERT INTO sc_scan_allowances(workspace_id,period_start,scan_limit) SELECT id,date_trunc('month',now() AT TIME ZONE 'UTC')::date,5 FROM sc_workspaces WHERE plan='free' ON CONFLICT DO NOTHING");
   // Keep billing available even if scanning fails in this cycle.
   let failed=false;
   try{await observeWorker(q,'scan',()=>runRepositoryJob(q));}catch{failed=true;}
   if(billing&&!controller.signal.aborted)try{await observeWorker(q,'billing',()=>reconcileBilling(q));}catch{failed=true;}
   if(failed)throw Error('Worker cycle failed.');
  }});
 console.log(JSON.stringify({event:'worker_stopped',...result}));if(result.failures)process.exitCode=1;
 }finally{process.removeListener('SIGTERM',stop);process.removeListener('SIGINT',stop);}
}
main().catch(()=>{console.error('Worker stopped: check target, deadline and private configuration.');process.exitCode=1;});
