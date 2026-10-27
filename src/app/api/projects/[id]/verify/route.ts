import {refusePublicDemo} from '@/lib/server/public-demo';
import { z } from "zod";
import { database } from "@/lib/server/db";
import { ApiError, assertOrigin, body, failure, json } from "@/lib/server/http";
import { checkProjectProof, projectResponse, proofFailure, validateProjectId } from "@/lib/server/project-verification";
import { requireActor } from "@/lib/server/session";
import { Store } from "@/lib/server/store";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
const verifySchema = z.object({ method: z.enum(["dns", "file"]) }).strict();

export async function POST(request: Request, { params }: Context) {
  const denied=refusePublicDemo();if(denied)return denied;

  try {
    assertOrigin(request);
    const id = validateProjectId((await params).id);
    const parsed = verifySchema.safeParse(await body(request, 256));
    if (!parsed.success) throw new ApiError(400, "Choose DNS or file verification.");
    const query = database();
    const actor = await requireActor(request, query);
    const store = new Store(query);
    await store.quota(`project-verify-hour:${actor.id}`, 30, 3_600_000);
    await store.quota("project-verify-global-minute", 12, 60_000);
    const project = await store.getProject(actor, id);
    const result = await checkProjectProof(project, parsed.data.method);
    if (result !== "verified") {
      return json({
        error: proofFailure(result).message,
        code: `PROOF_${result.toUpperCase()}`,
      }, 409);
    }
    return json(projectResponse(await store.markVerified(actor, id, project.challenge.token, parsed.data.method)));
  } catch (error) {
    return failure(error);
  }
}
