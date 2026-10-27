import {database} from '@/lib/server/db';
import {requireActor} from '@/lib/server/session';
import {completeRepositoryConnection,connectionCookie,repositoryConnectionOrigin} from '@/lib/server/repository-connections';
import {assertGitHubOrigin} from '@/lib/server/github-oauth';
import {failure,ApiError} from '@/lib/server/http';
import {refusePublicDemo} from '@/lib/server/public-demo';
export const runtime='nodejs';
export async function GET(request:Request){const denied=refusePublicDemo();if(denied)return denied;
 try{const origin=repositoryConnectionOrigin();assertGitHubOrigin(request,origin);const q=database(),actor=await requireActor(request,q),url=new URL(request.url);
 const cookies=(request.headers.get('cookie')||'').split(';').map(v=>v.trim()).filter(v=>v.startsWith(connectionCookie+'='));
 if(cookies.length!==1||url.searchParams.has('error'))throw new ApiError(400,'Repository connection was cancelled or expired.');
 await completeRepositoryConnection(q,actor,url.searchParams.get('state')||'',cookies[0].slice(connectionCookie.length+1),url.searchParams.get('code')||'');
 return new Response(null,{status:303,headers:{Location:origin+'/team','Cache-Control':'no-store','Referrer-Policy':'no-referrer','Set-Cookie':`${connectionCookie}=; HttpOnly; SameSite=Lax; Path=/api/github; Max-Age=0${origin.startsWith('https:')?'; Secure':''}`}});
 }catch(e){return failure(e);}}
