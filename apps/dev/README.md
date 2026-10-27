# Developer portal

Separate Next.js app. Local source commands remain usable before publication. Package versions are read live from npm; a missing version is labelled unpublished. Remote status is a live bounded health request. No account, team key or usage statistics are invented.

The playground sends content through a server route to the fixed `https://mcp.shiptested.com/mcp` endpoint using the official MCP client. It accepts at most 2 MB, uses a shared 20-second deadline and requires same-origin browser requests. It forwards real MCP progress notifications as newline-delimited JSON and displays the actual stage messages before the final evidence. No simulated progress is used. Remote availability is required for a successful hosted run; unavailable service errors are explicit. Local production-build HTTP MCP verification is recorded separately.

Documentation links use the reviewed GitHub source while `sitesLive` is false. Change that only after domain verification and hosted checks. Source-ready is not npm-published, and a client setup guide is not a marketplace approval.
