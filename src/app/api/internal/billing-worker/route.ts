import {database} from '@/lib/server/db';
import {requireScheduler} from '@/lib/server/scheduler';
import {reconcileBilling} from '@/lib/server/billing';
import {json,failure} from '@/lib/server/http';
import {refusePublicDemo} from '@/lib/server/public-demo';
import {observeWorker} from '@/lib/server/worker-telemetry';
export const runtime='nodejs';
export const maxDuration=180;
export async function GET(request:Request){const denied=refusePublicDemo();if(denied)return denied;
  try{requireScheduler(request);const q=database();return json(await observeWorker(q,'billing',()=>reconcileBilling(q)));}catch(error){return failure(error);}
}
