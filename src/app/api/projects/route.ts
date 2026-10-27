import {refusePublicDemo} from '@/lib/server/public-demo';
import { z } from "zod";
import { database } from "@/lib/server/db";
import { ApiError, assertOrigin, body, failure, json } from "@/lib/server/http";
import { projectResponse } from "@/lib/server/project-verification";
import { requireActor } from "@/lib/server/session";
import { Store } from "@/lib/server/store";

export const runtime = "nodejs";

const createSchema = z.object({
  name: z.string().trim().min(1).max(80),
  stagingUrl: z.string().max(2048),
}).strict();

export async function GET(request: Request) {
  const denied=refusePublicDemo();if(denied)return denied;

  try {
    const query = database();
    const actor = await requireActor(request, query);
    const projects = await new Store(query).listProjects(actor);
    return json({ projects: projects.map(projectResponse) });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  const denied=refusePublicDemo();if(denied)return denied;

  try {
    assertOrigin(request);
    const parsed = createSchema.safeParse(await body(request, 4096));
    if (!parsed.success) throw new ApiError(400, "Supply a project name and public HTTPS staging origin.");
    const query = database();
    const actor = await requireActor(request, query);
    const store = new Store(query);
    await store.quota(`project-create-day:${actor.id}`, 20, 86_400_000);
    const project = await store.createProject(actor, parsed.data.name, parsed.data.stagingUrl);
    return json(projectResponse(project), 201);
  } catch (error) {
    return failure(error);
  }
}
