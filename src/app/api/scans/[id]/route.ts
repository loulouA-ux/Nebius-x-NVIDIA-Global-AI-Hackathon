import { database } from "@/lib/server/db";
import { requireActor } from "@/lib/server/session";
import { Store } from "@/lib/server/store";
import { failure, json, ApiError } from "@/lib/server/http";
export const runtime = "nodejs";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!/^[a-f0-9-]{36}$/.test(id))
      throw new ApiError(400, "Invalid scan ID.");
    const q = database(),
      actor = await requireActor(request, q),
      store = new Store(q);
    return json({
      report: await store.getScan(actor, id),
      decisions: await store.decisions(actor, id),
    });
  } catch (e) {
    return failure(e);
  }
}
