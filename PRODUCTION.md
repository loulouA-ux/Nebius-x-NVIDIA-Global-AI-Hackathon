# Deployment gates

Local build and validation precede deployment. Never copy development credentials into public production.

## Gate A

Peter: optionally push `codex/branded-dashboard`. Set `SHIPTESTED_PUBLIC_DEMO=1` and `NEXT_PUBLIC_SITE_URL=https://shiptested.com` in Preview and Production. Remove provider, GitHub and database credentials from Production. Verify the preview environment is also credential-free before deployment; the agent has not inspected or changed private values. Deploy a preview, then run `node scripts/smoke.mjs <preview-url>` with an authenticated preview session if protection requires it.

## Gate B

Only Peter promotes the verified preview or deploys production, then changes Vercel Authentication for Production. Run `node scripts/smoke.mjs https://shiptested.com`. DNS and www redirection are verified by smoke, not assumed from configuration notes.

Roll back from Vercel Deployments by promoting the last known-good demo deployment. Re-run smoke after rollback. Do not roll back to a member-enabled deployment with credentials.

The server forces demo-only mode when VERCEL_ENV=production, even if the demo flag is missing. The guard rejects live APIs before provider/database calls. It does not remove secrets accidentally configured in the host: remove them in Vercel and redeploy. CLI/MCP publishing is a separate later phase.

## Headers and rendering

CSP permits only same-origin connections, local bundled fonts/assets, per-request nonced scripts/styles, no framing and no objects. Next.js requires nonces on its framework/hydration scripts as well as the theme pre-paint script; there is no unsafe-inline script permission. Inline style attributes remain allowed for existing data-driven presentation. This is a deliberate framework requirement beyond the brief's theme-script-only wording. Fonts are self-hosted by next/font; no Google font origins are needed at runtime.

Each response also has one-year HSTS with includeSubDomains, nosniff, strict-origin-when-cross-origin referrer policy, denied camera/microphone/geolocation, and X-Frame-Options DENY. Nonced HTML is dynamic and not CDN-cached. The report fixture is bundled and server-rendered; replay JSON is publicly cacheable. Brand fonts and their licenses are bundled in assets/fonts; builds do not fetch Google font files.

`NEXT_PUBLIC_SITE_URL` must be set before building: Next.js embeds public variables. Local smoke uses a loopback Host-header probe for www; Next normalizes loopback redirects to `/`. Only the real-domain smoke proves deployed DNS/HTTPS/canonical redirection.

The security contact address is supplied by Peter's brief; mailbox delivery has not been verified. Confirm it before public release.
