# Benchmark follow-up — 27 October 2026 (London)

## Completed evidence

This is a dependency-scanning pilot, not a claim of GitHub security parity, application exploitability, or organisation-wide remediation. No source was pushed, merged or deployed.

### Coverage review

The 200-repository collection produced 387 manifest records. After retries: 46 queried, 142 partial and 199 incomplete. Of the incomplete records, 79 have a sibling package-lock that was queried, 119 have unresolved/unsupported version specifications, and one has an incomplete provider lookup. Sibling coverage does not make the original manifest complete. Exact lockfiles or supported resolution are still required; version ranges were not guessed.

The combined queue contains 6,049 raw matches, grouped into 1,622 advisory/package/version groups and 640 advisory IDs before alias deduplication. These are not counts of exploitable vulnerabilities. The 20 priority groups were checked against current OSV advisory metadata and exact package/version queries: 20 matched, none withdrawn, no lookup failures. Application exposure remains unreviewed.

Private evidence: `test-results/coverage-review-2026-10-27/` and `test-results/triage-2026-10-27T00-43-00-875Z/`.

### Independent cloud comparison

Same immutable package-lock input SHA-256: `b16042fa92d40115f7a57c4f4542040c7e329277fefb3725e52715d488963216`.

Two separate ephemeral Vercel sandboxes ran ShipCheck/OSV and checksum-verified Trivy 0.76.1. Each scanner ran three times. Both covered 161 packages and reported seven matching advisory/package/version associations after OSV alias reconciliation. Each scanner's finding set remained identical across its three runs. Trivy used a fixed downloaded database; ShipCheck queried live OSV. There is no ground-truth accuracy score.

Trivy run durations: 710/506/534 ms. ShipCheck: 3857/3805/3744 ms. These exclude provisioning/database setup and compare offline versus live-service operations, so they are not a general speed ranking.

The first experiment excluded development dependencies in Trivy and inventoried zero packages: invalid comparison, retained only as diagnostic evidence. The corrected experiment explicitly includes development dependencies and checks that packages were inventoried.

Successful evidence: `test-results/cloud-comparison-2026-10-27T00-48-50-208Z/`, including `comparison.json`, raw results, database metadata and cleanup ledger.

### Verified repair candidate

On an immutable source snapshot, pinning Vitest 4.1.12 and regenerating the lockfile removes the two @vitest/mocker advisory matches. Original and patched snapshots each passed typecheck and all 16 repository tests in separate cloud sandboxes. Lifecycle scripts were disabled; tests ran with network denied and no application credentials.

The first repair experiment omitted a required configuration JSON and failed both baselines; this was a harness error. The corrected snapshot includes that file, integrity-checked and screened for credentials.

The complete patched lockfile was rescanned: 161 dependencies queried, zero lookup failures, five remaining matches (sharp: one, undici: three, zod: one). Thus this is a verified candidate for two dependency matches, not a clean security report or proof against exploitation. The generated lockfile changes need owner review before application.

Evidence and exact patch: `test-results/repair-pilot-2026-10-27T00-52-53-106Z/`, including `vitest-4.1.12.patch`, before/after manifests, test ledger and `full-post-repair-osv.json`.

## Validation and operating boundaries

ShipCheck typecheck, 222 tests in 27 files and production build passed. No UI behavior changed. All eight sandboxes created during this follow-up (including corrected experiments) were deleted; no persistent snapshots or exposed ports were requested. Each was limited to one vCPU and ten minutes. The existing £15 initial-testing limit was retained. The pre-run Vercel seven-day usage view showed $0.01 sandbox memory cost and other displayed sandbox charges rounded to $0.00; this is not a final invoice for these new runs. Per-run £1 reservation fields are records, not an enforceable provider spending cap. Review usage before expanding the batch.

## Remaining work

- Obtain/resolve exact dependency versions for unsupported records and retry the one provider gap.
- Review exposure and supported fixes across the remaining queue; only 20 priority groups have been independently rechecked.
- Review and apply the saved candidate patch through the target repository's normal PR process; it is not applied remotely.
- Address the pilot's five remaining matches separately, preserving baseline tests.
- Broaden the comparison to more repositories/languages and seeded positive/negative fixtures before making accuracy claims. One npm lockfile cannot establish SAST, secrets, infrastructure, or GitHub feature parity.
- Product integration and any GitHub publication/deployment remain separate from this local benchmark milestone.
