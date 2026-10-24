import { database } from "@/lib/server/db";
import { assertOrigin, body, json, failure, ApiError } from "@/lib/server/http";
import {
  createSession,
  requireActor,
  revokeSession,
  sessionCookie,
} from "@/lib/server/session";
import { Store } from "@/lib/server/store";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    return json({ actor: await requireActor(request, database()) });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    const data = (await body(request, 2000)) as { key?: unknown };
    if (typeof data?.key !== "string")
      throw new ApiError(400, "Access key required.");
    const query = database();
    await new Store(query).quota("login-global", 60, 60000);
    const session = await createSession(query, data.key);
    return json({ actor: session.actor }, 200, {
      "Set-Cookie": sessionCookie(session.token, request),
    });
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(request: Request) {
  try {
    assertOrigin(request);
    await revokeSession(request, database());
    return json({ signedOut: true }, 200, {
      "Set-Cookie": sessionCookie("", request, true),
    });
  } catch (e) {
    return failure(e);
  }
}
