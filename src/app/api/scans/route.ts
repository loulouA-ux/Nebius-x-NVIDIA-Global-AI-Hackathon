import { z } from "zod";
import { parseManifest } from "@/lib/parser";
import { runScan } from "@/lib/pipeline";
import { database } from "@/lib/server/db";
import { requireActor } from "@/lib/server/session";
import { Store } from "@/lib/server/store";
import { failure, ApiError } from "@/lib/server/http";
export const runtime = "nodejs";
const inputSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("demo") }).strict(),
  z
    .object({
      mode: z.literal("live"),
      filename: z.enum([
        "package.json",
        "package-lock.json",
        "requirements.txt",
      ]),
      content: z.string().min(1).max(200_000),
      research: z.boolean().optional(),
    })
    .strict(),
]);
let active = false;
export async function POST(request: Request) {
  // Public demo uses only fixed fixtures. Live scans require an individual session and database quota.
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  // Next's internal request URL may use localhost while the browser uses 127.0.0.1.
  // Compare against the incoming Host, never a forwarded header supplied by the caller.
  const host = request.headers.get("host") ?? url.host;
  if (origin && origin !== `${url.protocol}//${host}`)
    return Response.json(
      { error: "Cross-origin scan requests are not allowed." },
      { status: 403 },
    );
  if (active)
    return Response.json(
      { error: "A scan is already running. Please try again shortly." },
      { status: 429 },
    );
  if (Number(request.headers.get("content-length") ?? 0) > 220_000)
    return Response.json({ error: "Request too large." }, { status: 413 });
  const reader = request.body?.getReader();
  if (!reader)
    return Response.json({ error: "Missing request body." }, { status: 400 });
  active = true;
  let processing = false;
  try {
    let bytes = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const r = await reader.read();
      if (r.done) break;
      bytes += r.value.length;
      if (bytes > 220_000) {
        await reader.cancel();
        return Response.json({ error: "Request too large." }, { status: 413 });
      }
      chunks.push(r.value);
    }
    const parsed = inputSchema.safeParse(
      JSON.parse(Buffer.concat(chunks).toString("utf8")),
    );
    if (!parsed.success)
      return Response.json(
        {
          error:
            "Supply demo mode or a supported manifest (up to 200 KB). URL scanning is not available.",
        },
        { status: 400 },
      );
    let store: Store | undefined;
    let actor;
    if (parsed.data.mode === "live") {
      // Reject anonymous calls before database/provider access.
      if (!request.headers.get("cookie"))
        throw new ApiError(401, "Sign in to run live scans.");
      processing = true;
      const query = database();
      actor = await requireActor(request, query);
      store = new Store(query);
      await store.quota("scan-day:" + actor.id, 20, 86400000);
      await store.quota("scan-global-minute", 4, 60000);
    }
    if (parsed.data.mode === "live") {
      try {
        parseManifest(parsed.data.filename, parsed.data.content);
      } catch {
        throw new ApiError(
          400,
          "Unable to parse this manifest. Check the format, exact versions and 50-dependency limit.",
        );
      }
    }
    processing = true;
    const report = await runScan(parsed.data);
    if (store && actor) await store.saveScan(actor, report);
    return Response.json(report, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof ApiError || processing) return failure(error);
    return Response.json(
      {
        error:
          "Unable to parse this manifest. Check the format, exact versions and 50-dependency limit.",
      },
      { status: 400 },
    );
  } finally {
    active = false;
  }
}
