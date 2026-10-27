# Production readiness review — 27 October 2026, London

**Not approved for deployment. Phase 3 has a remaining report-performance measurement blocker. Gate A has not been reached.**

## Commits and scope

- Phase 1: `31f8a79` — ShipTested identity, compatible environment aliases and supplied SVG assets.
- Phase 2: `a95ae69` — advisory metadata policy and report/landing refinement.
- Phase 3: local hardening commit accompanying this report; no push, Vercel settings change, preview/production deploy or npm publication.
- Phase 4 CLI/library/MCP remains intentionally pending the production gates. The landing page still says planned; it does not claim unpublished packages are ready.

## Evidence

- Typecheck and 239 unit tests pass. Production build uses a separate verification copy excluding `.env*` and `.private`, with only a nonsecret local canonical URL set for the build.
- Full browser suite: 59 tests; public demo suite: 2 tests. Final run: 59/59 and 2/2 passed after the last source changes.
- Axe: zero violations across 24 captures (six routes, two viewport sizes, two themes). Screenshots are in this folder. Error-boundary rendering exists; 404, privacy and security routes are included in captures.
- Lighthouse landing: mobile performance 96 / accessibility 100 / best practices 100; desktop 100 / 100 / 100.
- Lighthouse report: no valid score. Both device configurations returned NO_FCP. A retry with background throttling disabled and another after removing a redundant history rewrite also failed. Browser screenshots, axe, response-body tests and user interactions render the report successfully; that does not substitute for the requested performance score. Failed audit JSON is retained. Investigate the Lighthouse trace/Chrome environment before declaring the report performance gate passed.
- Self-scan: 192 resolved dependencies queried, zero lookup failures and zero OSV matches. This is dependency evidence, not a claim of application security. The administrative batch parser was used; public 200 KB/50-dependency limits remain unchanged.
- Local smoke: all seven checks pass. The www probe uses a loopback Host header; real-domain DNS, HTTPS and redirects remain unverified.

## Safety and headers

Vercel production forces replay-only mode even when the flag is absent or false, with a startup warning. All writes and live APIs are denied before provider/database calls. Landing and recorded-report content are server-rendered from a bundled synthetic capture; replay JSON is cacheable. No runtime provider credentials are needed.

Headers: Content-Security-Policy; Strict-Transport-Security (31536000, includeSubDomains); X-Content-Type-Options nosniff; Referrer-Policy strict-origin-when-cross-origin; Permissions-Policy disabling camera/microphone/geolocation; X-Frame-Options DENY. CSP includes frame-ancestors none, object-src none, same-origin connections and per-request nonces. Next framework/hydration scripts need nonces as well as the theme script; the brief's literal theme-script-only exception is not possible with this Next runtime. No unsafe-inline script permission is enabled. Existing inline style attributes remain permitted. Fonts are self-hosted at runtime.

Legacy names remain only where compatibility requires them: environment fallback helper; session/OAuth cookies; workspace identity; theme storage/history/events; existing repair branch/sandbox identifiers. Historical operational documents and recorded evidence are not rewritten. The rebrand test checks product source/assets against a specific compatibility allowlist.

## Peter's gates — do not execute yet

Resolve the report performance check first. Then Gate A: optionally push `codex/branded-dashboard`; set `SHIPTESTED_PUBLIC_DEMO=1` and `NEXT_PUBLIC_SITE_URL=https://shiptested.com` before building Preview and Production; remove provider/GitHub/database credentials from public Production, confirm Preview is appropriate for a credential-free demo; deploy a preview and run the smoke script. Authenticated preview protection may require Peter's session. No hosted state was inspected or changed in this task.

Gate B: only after preview acceptance, Peter promotes/deploys Production and changes Production Vercel Authentication, then runs `node scripts/smoke.mjs https://shiptested.com`. See PRODUCTION.md for rollback instructions.

Confirm security@shiptested.com receives mail before release. The privacy page makes no unverified retention or service-level promises. Recorded findings retain their captured Unrated state because the capture does not contain severity metadata; live scans use the new documented policy. Fixed-version candidates are not verified repairs.
