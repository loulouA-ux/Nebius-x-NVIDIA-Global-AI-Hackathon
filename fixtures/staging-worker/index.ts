// Synthetic, non-production target for consented host-check acceptance.
export default {
  async fetch(request: Request, env: { PUBLIC_PROOF?: string }) {
    const path = new URL(request.url).pathname;
    if (path === "/.well-known/agent-shielda.txt")
      return new Response(env.PUBLIC_PROOF || "Not configured", {
        headers: { "Content-Type": "text/plain" },
      });
    if (path === "/.well-known/security.txt")
      return new Response(
        "Contact: mailto:security@example.com\nExpires: 2026-12-31T23:59:59Z\n",
        { headers: { "Content-Type": "text/plain" } },
      );
    if (path === "/robots.txt")
      return new Response("User-agent: *\nDisallow: /synthetic-demo-only\n", {
        headers: { "Content-Type": "text/plain" },
      });
    if (path !== "/") return new Response("Not found", { status: 404 });
    if (request.method === "OPTIONS")
      return new Response(null, {
        status: 204,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    return new Response(
      "<!doctype html><title>ShipCheck synthetic target</title><h1>ShipCheck synthetic staging target</h1><p>Consent-based passive-check fixture. No customer data, authentication, or real vulnerabilities.</p>",
      {
        headers: {
          "Content-Type": "text/html",
          "Set-Cookie": "demo_preference=example; Path=/; SameSite=Lax",
        },
      },
    );
  },
};
