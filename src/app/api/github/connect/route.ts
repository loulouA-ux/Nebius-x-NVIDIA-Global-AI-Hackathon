import {z} from 'zod';
import {database} from '@/lib/server/db';
import {requireActor} from '@/lib/server/session';
import {beginRepositoryConnection,connectionStatus,selectInstallation,disconnectRepositories,connectionCookie,repositoryConnectionOrigin,repositoryInstallUrl} from '@/lib/server/repository-connections';
import {assertOrigin,body,json,failure,ApiError} from '@/lib/server/http';
import {assertGitHubOrigin} from '@/lib/server/github-oauth';
import {refusePublicDemo} from '@/lib/server/public-demo';
import {Store} from '@/lib/server/store';
export const runtime='nodejs';
export async function GET(request:Request){const denied=refusePublicDemo();if(denied)return denied;
 try{const q=database(),actor=await requireActor(request,q);await new Store(q).quota('repository-connect:'+actor.id,20,60000);const installUrl=repositoryInstallUrl();try{return json({connected:true,installUrl,...await connectionStatus(q,actor)});}catch(e){if(e instanceof ApiError&&e.status===403)return json({connected:false,installUrl});throw e;}}catch(e){return failure(e);}}
export async function POST(request:Request){const denied=refusePublicDemo();if(denied)return denied;
 try{assertOrigin(request);assertGitHubOrigin(request,repositoryConnectionOrigin());const q=database(),actor=await requireActor(request,q);await new Store(q).quota('repository-connect:'+actor.id,20,60000);
 const input=z.discriminatedUnion('action',[z.object({action:z.literal('begin')}).strict(),z.object({action:z.literal('select'),installationId:z.number().int().positive().safe()}).strict()]).safeParse(await body(request,1000));
 if(!input.success)throw new ApiError(400,'Choose a repository connection action.');
 if(input.data.action==='select'){await selectInstallation(q,actor,input.data.installationId);return json({selected:true});}
 const flow=await beginRepositoryConnection(q,actor);const response=json({url:flow.url});response.headers.append('Set-Cookie',`${connectionCookie}=${flow.browserToken}; HttpOnly; SameSite=Lax; Path=/api/github; Max-Age=600${flow.origin.startsWith('https:')?'; Secure':''}`);return response;
 }catch(e){return failure(e);}}
export async function DELETE(request:Request){const denied=refusePublicDemo();if(denied)return denied;
 try{assertOrigin(request);const q=database(),actor=await requireActor(request,q);await disconnectRepositories(q,actor);return json({disconnected:true});}catch(e){return failure(e);}}
