# Production readiness review — 27 October 2026, London

**Gate A local engineering requirements are cleared. Ready for Peter’s preview-deployment gate; this is not deployment approval. No push, deploy, Vercel settings change or npm publication was performed. Security inbox delivery verification remains a separate release prerequisite.**

## Commits and scope

- Phase 1: `31f8a79` — ShipTested identity, compatible environment aliases and supplied SVG assets.
- Phase 2: `a95ae69` — advisory metadata policy and report/landing refinement.
- Phase 3: local hardening commit accompanying this report; no push, Vercel settings change, preview/production deploy or npm publication.
- Phase 4 CLI/library/MCP remains intentionally pending the production gates. The landing page still says planned; it does not claim unpublished packages are ready.

## Gate A fixup evidence

- Typecheck, **248 unit tests in 31 files**, production build, **59 full browser tests**, **9 public-demo tests**, and seven smoke checks pass. Builds run in an isolated mirror excluding every `.env*` file and `.private/`; no provider credentials are used.
- Five pre-navigation PerformanceObservers now record real LCP on `/`, `/privacy`, `/security`, `/reports` and `/reports/demo-recorded`, with JavaScript and normal motion enabled. `paint-timings.json` records fresh entries. Regression tests make no clicks, focus changes, scrolling or CSS overrides before the measurement.
- Root cause: `.page-transition` initially animated the entire page from opacity zero. In a controlled reproduction, removing that one rule from the stylesheet response **before first paint** restored LCP: landing h1, privacy/security text, reports intro and report banner. No initial focus/scroll event was observed. Removing CSS after rendering is too late to reproduce this intervention. The page-wide fade is now disabled; useful local component motion remains.
- Root `loading.tsx` is removed. Actual scan progress retains its loading animation.
- All eight desktop/mobile Lighthouse headless-shell audits meet 85/95/95: performance 99–100, accessibility 100, best practices 100. The separate new-headless mobile report scores 97/100/100. Per-route scores, FCP/LCP and execution timestamps are in `lighthouse-summary.json`; raw JSON files are retained. A separate Chrome new-headless report run is also retained. Earlier NO_FCP reports remain as historical failures; they are not counted as passes.
- `scripts/lighthouse.mjs` repeats the eight required runs and optional new-headless comparison, writes JSON, and fails if a required result is missing or below target. It uses explicitly configured browser/Lighthouse binaries and does not install software or change the site.
- Axe: **zero violations** across 24 captures (six routes, two widths, two themes). Updated landing/report screenshots include both themes at 1440 and 390 pixels. Desktop sidebar controls have `min-height:100dvh`, stay sticky to the viewport bottom after end-of-report scrolling, and the column background/border continues for the full document height. Both themes pass the viewport-bottom assertion.
- OSV enrichment is offline at render time: exactly the five captured advisory IDs were fetched from `api.osv.dev`, stored in `fixtures/recorded-advisory-metadata.json` with retrieval time, and passed through the same severity/fixed-version policy as live findings. The original model explanations and evidence are untouched. The replay explicitly labels the metadata retrieval date separately from the original capture date.
- Before: **Review required**, five Unrated findings, no CVSS/fixes. After: **Blocked**, two High and three Medium findings, policy-derived CVSS and candidate fixed versions. Candidates are not tested repairs. The brand test's previous “5 findings need a person to decide” expectation was intentionally updated to “2 high-severity findings need a decision”; safety assertions were not weakened. The dash explanation now appears only when a visible finding lacks a fixed version.
- Prior self-scan evidence remains unchanged: 192 resolved dependencies queried, zero lookup failures and zero OSV matches. No dependency versions changed in this fixup; this is not a claim of application security.

## Resend and security contact

The ShipTested Resend account lists `updates.shiptested.com` as **Verified**. A private server notification adapter is implemented and tested, disabled by default and in every public-demo environment. It is not connected to scan events, an outbox or user email preferences yet; no real email was sent and delivery is unproven. See `docs/EMAIL-SETUP.md` for the exact remaining activation steps.

Peter approved Cloudflare forwarding for `security@shiptested.com` to the designated Gmail inbox and explicitly approved replacing the old Namecheap MX/root-SPF records. The approved DNS migration is complete: authoritative MX/SPF now point to Cloudflare. The destination is Verified, the exact security forwarding rule is Active, and catch-all is disabled. Actual inbox delivery remains untested.

## Safety and headers

Vercel production forces replay-only mode even when the flag is absent or false, with a startup warning. All writes and live APIs are denied before provider/database calls. Landing and recorded-report content are server-rendered from a bundled synthetic capture; replay JSON is cacheable. No runtime provider credentials are needed.

Headers: Content-Security-Policy; Strict-Transport-Security (31536000, includeSubDomains); X-Content-Type-Options nosniff; Referrer-Policy strict-origin-when-cross-origin; Permissions-Policy disabling camera/microphone/geolocation; X-Frame-Options DENY. CSP includes frame-ancestors none, object-src none, same-origin connections and per-request nonces. Next framework/hydration scripts need nonces as well as the theme script; the brief's literal theme-script-only exception is not possible with this Next runtime. No unsafe-inline script permission is enabled. Existing inline style attributes remain permitted. Fonts are self-hosted at runtime.

Legacy names remain only where compatibility requires them: environment fallback helper; session/OAuth cookies; workspace identity; theme storage/history/events; existing repair branch/sandbox identifiers. Historical operational documents and recorded evidence are not rewritten. The rebrand test checks product source/assets against a specific compatibility allowlist.

## Peter's gates — do not execute yet

Gate A is ready for Peter: optionally push `codex/branded-dashboard`; set `SHIPTESTED_PUBLIC_DEMO=1` and `NEXT_PUBLIC_SITE_URL=https://shiptested.com` before building Preview and Production; remove provider/GitHub/database credentials from public Production, confirm Preview is appropriate for a credential-free demo; deploy a preview and run the smoke script. Authenticated preview protection may require Peter's session. No Vercel state was changed. After preview smoke tests, Peter should also run PageSpeed Insights on the preview URL.

Gate B: only after preview acceptance, Peter promotes/deploys Production and changes Production Vercel Authentication, then runs `node scripts/smoke.mjs https://shiptested.com`. See PRODUCTION.md for rollback instructions.

Confirm security@shiptested.com receives mail before release. The privacy page makes no unverified retention or service-level promises. The replay now uses the dated OSV metadata snapshot; original captured model notes retain their original provenance. Fixed-version candidates are not verified repairs.
