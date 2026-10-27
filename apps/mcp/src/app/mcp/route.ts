import {handleMcp} from '../../lib/handler';
export const runtime='nodejs';
export const maxDuration=25;
export const dynamic='force-dynamic';
export const POST=(request:Request)=>handleMcp(request);
export const GET=()=>new Response(null,{status:405,headers:{Allow:'POST'}});
export const DELETE=GET;
