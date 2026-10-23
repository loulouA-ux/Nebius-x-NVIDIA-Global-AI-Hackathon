import { database } from "@/lib/server/db";
import { failure, json } from "@/lib/server/http";
import { projectResponse, validateProjectId } from "@/lib/server/project-verification";
import { requireActor } from "@/lib/server/session";
import { Store } from "@/lib/server/store";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Context) {
  try {
    const id = validateProjectId((await params).id);
    const query = database();
    const actor = await requireActor(request, query);
    return json(projectResponse(await new Store(query).getProject(actor, id)));
  } catch (error) {
    return failure(error);
  }
}
