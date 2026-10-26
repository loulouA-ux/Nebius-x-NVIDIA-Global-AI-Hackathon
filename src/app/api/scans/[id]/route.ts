import {refusePublicDemo} from '@/lib/server/public-demo';
import { database } from "@/lib/server/db";
import { requireActor } from "@/lib/server/session";
import { Store } from "@/lib/server/store";
import { failure, json } from "@/lib/server/http";
import { validateScanId } from "@/lib/server/scan-id";
export const runtime = "nodejs";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied=refusePublicDemo();if(denied)return denied;

  try {
    const id = validateScanId((await params).id);
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
