import {database} from '@/lib/server/db';
import {requireApiActor} from '@/lib/server/api-tokens';
import {json,failure} from '@/lib/server/http';
import {refusePublicDemo} from '@/lib/server/public-demo';
import {latestBatchProgress} from '@/lib/server/batch-progress';
export const runtime='nodejs';
export async function GET(request:Request){
 const denied=refusePublicDemo();if(denied)return denied;
 try{const query=database(),actor=await requireApiActor(request,query);return json({batch:await latestBatchProgress(query,actor)});}
 catch(error){return failure(error);}
}
