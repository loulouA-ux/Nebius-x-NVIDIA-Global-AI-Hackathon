import { z } from "zod";
import { database } from "@/lib/server/db";
import { requireActor } from "@/lib/server/session";
import { Store } from "@/lib/server/store";
import { assertOrigin, body, failure, json, ApiError } from "@/lib/server/http";
export const runtime = "nodejs";
const schema = z
  .object({
    findingId: z.string().min(1).max(300),
    action: z.enum(["acknowledge", "dismiss"]),
    reason: z.string().max(1000).default(""),
  })
  .strict();
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertOrigin(request);
    const { id } = await params;
    if (!/^[a-f0-9-]{36}$/.test(id))
      throw new ApiError(400, "Invalid scan ID.");
    const input = schema.safeParse(await body(request, 5000));
    if (!input.success) throw new ApiError(400, "Invalid decision.");
    const q = database(),
      actor = await requireActor(request, q),
      store = new Store(q);
    await store.quota("decisions:" + actor.id, 60, 60000);
    return json(
      await store.decide(
        actor,
        id,
        input.data.findingId,
        input.data.action,
        input.data.reason,
      ),
      201,
    );
  } catch (e) {
    return failure(e);
  }
}
