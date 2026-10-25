import { database } from "@/lib/server/db";
import { requireActor } from "@/lib/server/session";
import { listRepositories } from "@/lib/server/github-repositories";
import { json,failure } from "@/lib/server/http";
import { Store } from "@/lib/server/store";
export const runtime="nodejs";
export async function GET(request:Request){try{const query=database(),actor=await requireActor(request,query);await new Store(query).quota(`repositories:${actor.id}`,20,60000);return json({repositories:await listRepositories(actor)});}catch(e){return failure(e);}}
