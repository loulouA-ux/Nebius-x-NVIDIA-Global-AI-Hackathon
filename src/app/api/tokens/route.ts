import {z} from 'zod';
import {database} from '@/lib/server/db';
import {requireActor} from '@/lib/server/session';
import {createApiToken,listApiTokens,revokeApiToken} from '@/lib/server/api-tokens';
import {assertOrigin,body,json,failure,ApiError} from '@/lib/server/http';
import {refusePublicDemo} from '@/lib/server/public-demo';
export const runtime='nodejs';
export async function GET(request:Request){const denied=refusePublicDemo();if(denied)return denied;
  try{const q=database(),actor=await requireActor(request,q);return json({tokens:await listApiTokens(q,actor)});}catch(e){return failure(e);}}
export async function POST(request:Request){const denied=refusePublicDemo();if(denied)return denied;
  try{assertOrigin(request);const q=database(),actor=await requireActor(request,q);const input=z.object({name:z.string().min(1).max(80),canScan:z.boolean()}).strict().safeParse(await body(request,1000));if(!input.success)throw new ApiError(400,'Choose a token name and permission.');return json(await createApiToken(q,actor,input.data.name,input.data.canScan),201);}catch(e){return failure(e);}}
export async function DELETE(request:Request){const denied=refusePublicDemo();if(denied)return denied;
  try{assertOrigin(request);const q=database(),actor=await requireActor(request,q);const input=z.object({id:z.string().uuid()}).strict().safeParse(await body(request,1000));if(!input.success)throw new ApiError(400,'Invalid token ID.');await revokeApiToken(q,actor,input.data.id);return json({revoked:true});}catch(e){return failure(e);}}
