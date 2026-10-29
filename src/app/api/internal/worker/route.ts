import {database} from '@/lib/server/db';
import {requireScheduler} from '@/lib/server/scheduler';
import {runRepositoryJob} from '@/lib/server/repository-worker';
import {json,failure} from '@/lib/server/http';
import {refusePublicDemo} from '@/lib/server/public-demo';
import {observeWorker} from '@/lib/server/worker-telemetry';
export const runtime='nodejs';
export const maxDuration=300;
export async function GET(request:Request){const denied=refusePublicDemo();if(denied)return denied;
  try{requireScheduler(request);const q=database();
    await q("INSERT INTO sc_scan_allowances(workspace_id,period_start,scan_limit) SELECT id,date_trunc('month',now() AT TIME ZONE 'UTC')::date,5 FROM sc_workspaces WHERE plan='free' ON CONFLICT DO NOTHING");
    const scan=await observeWorker(q,'scan',()=>runRepositoryJob(q));
    return json({scan});
  }catch(error){return failure(error);}
}
