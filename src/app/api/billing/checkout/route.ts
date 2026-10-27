import {z} from 'zod';
import {database} from '@/lib/server/db';
import {requireActor} from '@/lib/server/session';
import {createCheckout} from '@/lib/server/billing';
import {assertOrigin,body,json,failure,ApiError} from '@/lib/server/http';
import {refusePublicDemo} from '@/lib/server/public-demo';
export const runtime='nodejs';
export async function POST(request:Request){
  const denied=refusePublicDemo();if(denied)return denied;
  try{assertOrigin(request);const q=database(),actor=await requireActor(request,q);
    const input=z.object({seats:z.number().int().min(1).max(200),requestKey:z.string().uuid()}).strict().safeParse(await body(request,1000));
    if(!input.success)throw new ApiError(400,'Choose a seat count and request key.');
    return json(await createCheckout(q,actor,input.data.seats,input.data.requestKey));
  }catch(error){return failure(error);}
}
