# ShipCheck benchmark pilot

26 October 2026. Local development; no product parity claim and no deployment.

## Comparison shortlist

| Tool | Comparison role | Integration boundary |
|---|---|---|
| GitHub CodeQL / Code Security | Semantic code analysis baseline at the same commit | Import licensed customer results; do not presume private-code CLI entitlement. |
| Snyk | Code, dependency, container and IaC comparison | Separate account/entitlement; review CLI execution behavior before use on private code. |
| Semgrep | Static-analysis comparison | Engine is LGPL; maintained community rules restrict competing SaaS use. Do not bundle them in ShipCheck. |
| Trivy | Dependency, secret and infrastructure checks | Evaluate CLI in isolated scanner workers; pin version, database and checks. |

Primary references checked 26 October:
- https://docs.github.com/en/code-security/getting-started/quickstart-for-securing-your-repository
- https://docs.snyk.io/developer-tools/snyk-cli/commands/test
- https://semgrep.dev/blog/2024/important-updates-to-semgrep-oss/
- https://trivy.dev/docs/latest/guide/scanner/secret/
- https://trivy.dev/docs/latest/guide/scanner/misconfiguration/

Recommendation: start with Trivy plus existing GitHub findings, then evaluate Snyk/Semgrep as separately licensed comparison tools. Do not equate a larger finding count with better detection. ShipCheck currently lacks broad semantic code analysis and full-history secret detection.

## Built in this milestone

- Strict run schema, identical repository/commit/snapshot enforcement, duplicate-run rejection.
- Separate repeatability groups for scanner version, configuration, environment, vulnerability database and cache mode.
- Failed/incomplete runs never count as clean. Three complete runs are required for a repeatability result.
- SARIF 2.1.0 location fingerprint helper; intentionally rejects unsupported/missing locations rather than silently dropping results. Not a complete SARIF scanner adapter. No snippets/messages emitted.
- CLI report generator; unknown costs remain explicit. Accuracy deliberately unscored until independent ground truth exists.
- Actual three-run offline ShipCheck fixture smoke. This is local pipeline execution with snapshot coverage, not two cloud sandboxes or a competitor benchmark.

Run from repository root:
```
node --import tsx scripts/benchmark-smoke.ts
node --import tsx scripts/benchmark-report.ts test-results/benchmark-smoke-runs.json test-results/benchmark-cli-summary.json
npx vitest run tests/benchmark.test.ts
```
The report command refuses to overwrite an existing output. Raw result files stay in ignored test-results. Scanner metadata is supplied by the collector and is not cryptographically attested by this evaluator.

## Next execution gate

Peter selects 3–5 exact HeySalad owner/repository names (requested). Resolve access and pin commits. Do not guess the organisation or reuse repository write credentials inside scanner workers.

Build isolated collector adapters next: two fresh environments, identical filtered snapshot hash, pinned scanner/rules/database and equal resources. Fetch source using host-side read-only access; do not forward tokens, production environment, .git credentials or discovered secrets. No repository install/build scripts in the static-analysis phase. A later repair phase may run explicitly permitted commands in an isolated worker with denied network.

Before cloud execution, establish remaining spend against Peter's existing £15 total testing ceiling, estimate worst-case cost including retries and setup, and reserve budget before each run. Current harness records cost but does not enforce a billing ceiling. No new paid run has been launched in this milestone.

Run each arm three times, retaining failed attempts and cold/warm distinction. Independently adjudicate discrepancies and known vulnerable/fixed synthetic pairs. Record recall, precision and repair outcome only for the reviewed scope; don't auto-match unlike scanner rule IDs or treat agreement as truth. Repository acquisition, cloud collectors, scanner adapters, adjudication UI and 200-repository queue are not implemented by this milestone.

## Verification criteria

- Mismatched commits/snapshots and duplicate run IDs rejected: automated tests.
- Duplicate findings deduplicated; missing cost distinct from zero: automated tests.
- Incomplete scans excluded from success and repeatability claims: tests and real offline smoke.
- Source snippets omitted from SARIF fingerprints: automated test.
- Typecheck, full unit suite and production compilation pass before local commit.
- No push, deployment, access change or paid cloud run.

Verification recorded 26 October 2026: typecheck passed, 215 unit tests across 25 files passed (including seven new benchmark tests), production build passed. Both smoke and report CLIs exited 0. The generated summary correctly records three incomplete fixture runs, zero complete runs, null repeatability and null accuracy. No browser tests were rerun because this milestone changes no UI or HTTP route.

## Large-manifest follow-up

The first organisation collector processed 200 repositories, but only 49 of 387 attempted manifests reached dependency queries (39 with partial coverage). The follow-up introduces administrator-only parser options capped at 5 MB and 5,000 unique dependencies. Default application limits remain 200 KB and 50; byte length is now enforced for Unicode input too. OSV queries run in ten-dependency batches, preserving successful batches, and subdivide only the known advisory-count cap failure. Other provider failures remain explicit and are not automatically retried.

`scripts/rescan-manifests.ts <prior-result-directory>` retries the first 20 incomplete manifests in original inventory order using the original Git blob IDs and verifies blob hashes. It never follows a moving branch. Results include fetch/size-and-integrity/parse/OSV stages, resolved-versus-queried counts and failed batch offsets. Prior artifacts remain unchanged. No cloud compute or repository code execution occurs. This improves dependency inventory only; no CodeQL, Trivy, secret-history or C# coverage is claimed.

Follow-up validation: 219 unit tests across 26 files, typecheck and production build passed. A regression initially caught changed error wording; compatibility was restored before the passing full run. The live 20-manifest trial was launched on 26 October at 17:56 London; results are in ignored `test-results/manifest-rescan-2026-10-26T17-56-56-323Z`. Do not infer a completed trial from this launch record.

## Review queue and continuation

The 20-manifest trial finished at 17:59 London: 5 queried without warnings, 4 partial and 11 with no supported exact versions. It queried 2,645 of 2,651 resolved dependency entries. Combining its results with the initial organisation pass yields 303 raw matches, 239 advisory/ecosystem/package/version groups and 157 distinct advisory IDs; aliases are not collapsed. None of these counts establishes exploitability. The local review queue retains commit, manifest and dependency-path provenance and orders by repository reach, not inferred severity.

`scripts/triage-benchmark.ts <result-directory> ...` generates private JSON and Markdown review artifacts under ignored test-results. Tests cover duplicate runs, distinct commits/versions and unmapped advisory identities. Validation: 222 unit tests, typecheck and production build passed.

Continuation launched 26 October at 18:09 London with `scripts/rescan-manifests.ts <original-result-directory> 20 1000`, targeting all remaining 318 originally incomplete manifests at their original blobs. Output directory: `test-results/manifest-rescan-2026-10-26T18-09-13-483Z`. Launch is not completion. No new cloud spend, repository code execution, push or deployment. Comparative scanner and sandbox execution remains pending.
