import {database} from '@/lib/server/db';
import {requireActor} from '@/lib/server/session';
import {createPortal} from '@/lib/server/billing';
import {assertOrigin,json,failure} from '@/lib/server/http';
import {refusePublicDemo} from '@/lib/server/public-demo';
export const runtime='nodejs';
export async function POST(request:Request){const denied=refusePublicDemo();if(denied)return denied;
  try{assertOrigin(request);const q=database(),actor=await requireActor(request,q);return json(await createPortal(q,actor));}catch(error){return failure(error);}
}
