# P7 acceptance — 24 October 2026, 23:07–23:12 London

Status: partial acceptance; P7 remains open. No public release or Phase 5 approval.

Baseline: rewritten main `9eea260ac9c3932ae2e6da40abd60c0bb398d6ad`. Tests and evidence work are on `codex/p7-acceptance`. Existing local browser notes were preserved separately.

## Evidence collected

| Gate | Evidence | Outcome / limitation |
| --- | --- | --- |
| Latest merged regression | 126 baseline tests, typecheck, production build; seven Playwright tests | Passed, including mocked expired-decision session UI |
| Per-scan proof recheck | New PGlite-backed test exercises verified, missing, mismatched and expired proof; cross-owner denial before proof lookup | Passed; mocked DNS result, not a fresh hosted DNS trial |
| Provider failures | New tests for thrown provider exceptions and missing optional keys | Incomplete coverage, no clean verdict, no exception-text leakage |
| Full suite after added tests | `npm test`, `npm run typecheck` | 129 tests / 13 files passed; typecheck passed |
| Session/storage isolation | Existing real PGlite tests for actor/workspace, expiry, rotation, revocation, concurrent durable quotas, masking and immutable decisions | Passed in fresh suite; no claim of hosted load testing |
| Hosted integration | `scripts/hosted-smoke.ts` against protected `shipcheck-eqslt6fs3-hey-salad-inc.vercel.app`, SHA `4719078` | Health, anonymous denial, demo, two member sessions, secure cookies, project isolation, challenge rotation, live two-package scan, provider checks, persistence, decisions, cross-member report denial and logout passed |
| Preview equivalence | `git diff origin/main 4719078393d45d23f9ad02cf1bb07574f11a4170` | No code difference |
| Hosted stale-session UI | Computer-use driver: Peter signed in on preview; second tab signed out; first tab attempted saved-report reopen | Stale member and history cleared, “Session expired. Sign in again to continue.” and Member sign in shown. Exercises real revoked-session 401, not waiting eight hours for clock expiry |
| Deployment protection | Vercel project API | `ssoProtection.deploymentType=all` remains configured |

## Harness correction

The first hosted run stopped at request 12 after persisting the report. A sanitized database inspection showed complete provider checks and approved notes. The advisory assertion used JSON serialization equality, which depends on property insertion order and can differ after JSONB caching. The rerun using explicit dependency-value comparison passed. The final harness uses Node `isDeepStrictEqual` and semantic deduplication, preserving full-object comparison without relying on insertion order. Safe stage labels were added; raw errors, cookies, credentials and provider responses remain suppressed. No scanner behavior was changed.

Hosted test sessions were logged out and temporary credential/cookie files removed by the harness. Synthetic projects/reports remain for review. The hosted scan in this pass was manifest-only: staging runtime explicitly not-in-scope.

## Remaining before P7/L4 closure

1. Host-inclusive rerun is recorded below; review its evidence alongside the earlier historical runs.
2. Louise reviews this ledger and the current acceptance changes; jointly close Phase 4 only when gaps are resolved.
3. Public judging access and Production live credentials remain separate decisions; protected access is unchanged.

ATR #142 reports a successful isolated App Server synthetic acknowledgement with receipt/no-replay. This does not prove desktop attachment or cross-machine wake execution and is separate from ShipCheck P7.

## Host-inclusive acceptance completed — by 23:13 London

Refreshed the proof on the existing controlled synthetic Worker, then ran the final current `scripts/hosted-smoke.ts` with `--host` against the same protected 4719078 preview. Exit code 0. Verified unverified-host denial, real public file proof, four passive host checks, omitted cookie values, two-package advisory associations, exact approved model notes, saved report and decision, cross-member report denial, and logout invalidation for both sessions. All 11 report checks were complete. Temporary test sessions/cookies were cleaned up. The synthetic project/report remain for review.

GitHub PR #3 checks were green at this checkpoint (both verify runs and Vercel deployment). Peter's execution evidence is now ready for joint review; P7/L4 stay open for that acceptance decision. The regression additions do not change runtime code. No further paid Sandbox was used and no public release/access change was made.
