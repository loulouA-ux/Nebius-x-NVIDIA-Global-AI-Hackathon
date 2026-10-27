import { brandEnv } from "../brand-env";
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function json(
  data: unknown,
  status = 200,
  headers: Record<string, string> = {},
) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
  });
}
export function failure(e: unknown) {
  return e instanceof ApiError
    ? json({ error: e.message }, e.status)
    : json({ error: "Service temporarily unavailable." }, 503);
}
export function assertOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const url = new URL(request.url);
  const expected =
    brandEnv("APP_ORIGIN") ||
    `${url.protocol}//${request.headers.get("host") || url.host}`;
  if (origin && origin !== expected)
    throw new ApiError(403, "Cross-origin requests are not allowed.");
  if (request.headers.get("sec-fetch-site") === "cross-site")
    throw new ApiError(403, "Cross-site requests are not allowed.");
}
export async function body(request: Request, max = 220000): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, "Body required.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const r = await reader.read();
      if (r.done) break;
      size += r.value.length;
      if (size > max) throw new ApiError(413, "Request too large.");
      chunks.push(r.value);
    }
  } finally {
    await reader.cancel();
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new ApiError(400, "Invalid JSON.");
  }
}
