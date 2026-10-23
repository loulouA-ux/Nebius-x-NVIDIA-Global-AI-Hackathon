import { z } from "zod";
import { runScan } from "@/lib/pipeline";
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
  // Local milestone only. Before public deployment add authentication, durable quotas and a job queue.
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
    return Response.json(await runScan(parsed.data), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
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
