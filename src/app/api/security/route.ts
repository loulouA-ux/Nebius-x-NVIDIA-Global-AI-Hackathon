import {database} from '@/lib/server/db';
import {requireApiActor} from '@/lib/server/api-tokens';
import {json,failure} from '@/lib/server/http';
import {refusePublicDemo} from '@/lib/server/public-demo';
import {securityDashboard} from '@/lib/server/security-dashboard';
export const runtime='nodejs';
/** Aggregated, paginated security view of one batch; scoped to the authenticated workspace AND owner. */
export async function GET(request:Request){
 const denied=refusePublicDemo();if(denied)return denied;
 try{
  const query=database(),actor=await requireApiActor(request,query),p=new URL(request.url).searchParams;
  const get=(k:string)=>p.get(k);
  return json(await securityDashboard(query,actor,{sort:get('sort'),recovery:get('recovery'),batch:get('batch'),view:get('view'),q:get('q'),severity:get('severity'),verdict:get('verdict'),gap:get('gap'),stage:get('stage'),state:get('state'),advisory:get('advisory'),page:get('page')}));
 }catch(error){return failure(error);}
}
