import { z } from "zod";
import { database } from "@/lib/server/db";
import { requireActor } from "@/lib/server/session";
import { Store } from "@/lib/server/store";
import { validateScanId } from "@/lib/server/scan-id";
import { assertOrigin, body, failure, json, ApiError } from "@/lib/server/http";
export const runtime = "nodejs";
const schema = z
  .object({
    findingId: z.string().min(1).max(300),
    action: z.enum(["acknowledge", "dismiss"]),
    reason: z.string().max(1000).default(""),
  })
  .strict()
  .refine(
    (input) => input.action !== "dismiss" || input.reason.trim().length > 0,
    { path: ["reason"], message: "A dismissal reason is required." },
  )
  .transform((input) => ({
    ...input,
    reason: input.action === "dismiss" ? input.reason.trim() : input.reason,
  }));
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertOrigin(request);
    const id = validateScanId((await params).id);
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
