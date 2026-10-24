# Foundation verification — 23 October 2026

Scope: first local working milestone; not completion of the hackathon product.

| Acceptance | Evidence | Result |
| --- | --- | --- |
| Strict TypeScript | `npm run typecheck` | Pass |
| Production compilation | `npm run build` | Pass; UI and two API routes built |
| Parsers, masking, policy, provider failures and request boundaries | `npm test` | 29 tests passed |
| Dashboard flow, evidence, manual actions, invalid input, mobile layout | `npm run test:e2e` | 4 Playwright tests passed against production build |
| Desktop/mobile appearance | Inspected `test-results/report-desktop.png` and `test-results/report-mobile.png` | Readable layout; mobile test found no horizontal overflow |
| Live OSV integration | POST `/api/scans` with lodash 4.17.20 in a v3 lockfile | HTTP 200; five advisories; OSV check complete; overall Incomplete because optional providers were not run |
| Runtime readiness | GET `/` and `/api/health` on loopback | HTTP 200; both optional provider keys absent |
| Dependency audit | `npm audit --omit=dev` | Zero reported vulnerabilities; not a security guarantee |
| Provider secrecy | Tests ensure synthetic secret absent from serialized findings/report | Pass for supported patterns only |
| Tavily/Nemotron live use | No credentials configured | Not verified; adapters implemented only |
| URL verification/probing | No endpoint accepts arbitrary targets | Not implemented |
| Deployment, auth, persistence, concurrency across instances, daily quotas | Local-only process | Not implemented / not deployed |

The first browser run exposed a same-origin mismatch: Next normalized the internal URL to localhost while the browser used 127.0.0.1. The check now compares Origin with the incoming Host (not forwarded headers), with a passing regression test. The malformed-input test was scoped to the application's alert because Next also inserts its own route-announcement alert. Final full checks passed after the correction and formatting.

Known limitations: live OSV severity remains Review rather than calibrated High/Critical; Tavily is capped Search only, without Extract/cache; model notes are not entailment-verified; snapshots do not demonstrate live threat freshness; no actual fix is generated or verified. Do not expose this build publicly before the next hardening milestone.
