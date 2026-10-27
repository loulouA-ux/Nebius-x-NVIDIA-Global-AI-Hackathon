# Remote MCP

Official `WebStandardStreamableHTTPServerTransport` from `@modelcontextprotocol/sdk` 1.32.2, stateless JSON response mode. POST `/mcp`; GET `/health`; GET `/` explains the endpoint. No sessions, AI, filesystem reader, keys or content logs. Local filesystem implementation is excluded from the remote import graph.

Request bodies are bounded before parsing. Input content is capped at 2 MB/5,000 packages, the whole operation times out after 20 seconds, and OSV calls reject redirects and arbitrary destinations. Advisory cache is bounded per process. Per-IP limiter: 30 requests/minute/instance with a 10,000-entry cap; unknown proxy identity shares a bucket. It trusts Vercel's platform-overwritten `x-vercel-forwarded-for` only when VERCEL=1. Outside Vercel all requests share a local bucket. This is not a globally distributed rate limit.

Host validation allows mcp.shiptested.com and the deployment's VERCEL_URL. Browsers must have the same Origin as the endpoint. Non-browser MCP clients can omit Origin. Only POST is supported; JSON-RPC batches are refused.

Optional Vercel Firewall rule for Peter: host equals `mcp.shiptested.com` AND path equals `/mcp` AND method equals `POST`; rate limit by source IP to 30 requests per 60 seconds, block for 60 seconds. Review plan availability/cost before enabling; not configured here.

OAuth and tenant-scoped quotas are planned, not available. Preview deployment protection remains unchanged; an authenticated Vercel preview is not a public endpoint.
