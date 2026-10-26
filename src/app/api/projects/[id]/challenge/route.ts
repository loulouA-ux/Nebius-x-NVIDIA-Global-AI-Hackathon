import {refusePublicDemo} from '@/lib/server/public-demo';
import { database } from "@/lib/server/db";
import { assertOrigin, failure, json } from "@/lib/server/http";
import { projectResponse, validateProjectId } from "@/lib/server/project-verification";
import { requireActor } from "@/lib/server/session";
import { Store } from "@/lib/server/store";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Context) {
  const denied=refusePublicDemo();if(denied)return denied;

  try {
    assertOrigin(request);
    const id = validateProjectId((await params).id);
    const query = database();
    const actor = await requireActor(request, query);
    const store = new Store(query);
    await store.quota(`challenge-refresh-hour:${actor.id}`, 30, 3_600_000);
    return json(projectResponse(await store.refreshChallenge(actor, id)));
  } catch (error) {
    return failure(error);
  }
}
