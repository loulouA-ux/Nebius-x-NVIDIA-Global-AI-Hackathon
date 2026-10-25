# GitHub sign-in and verified dependency repair

Active goal, 25 October 2026. This extends the accepted scanner; it does not reopen or replace the existing submission baseline.

## Acceptance ledger

- [ ] GitHub OAuth with state, PKCE, fixed callback origin, expiry and single-use authorization transactions. Prove rejection of replay, wrong state and wrong browser.
- [ ] Stable GitHub numeric identity owns an isolated workspace. Existing Peter/Louise key sessions remain valid; no automatic account linking by email or mutable username.
- [ ] Repository access is explicit and separate from sign-in. Prefer a GitHub App installation with selected repositories; no broad repo scope for login.
- [ ] A repository snapshot is pinned to a commit and bounded by file/size limits. Repository contents are untrusted data.
- [ ] Propose one supported npm dependency upgrade from an actual advisory. Preserve exact package/version/source provenance; model suggestions cannot determine security acceptance.
- [ ] Build a patch in an ephemeral sandbox with no production credentials, no public ports, execution timeout and restricted network. Install without lifecycle scripts; run agreed tests with egress denied.
- [ ] Record baseline and patched test outcomes, lockfile diff, scan delta, command exit codes, missing checks and cleanup outcome. Failed or absent tests never count as success.
- [ ] Human explicitly approves the exact patch before a branch/PR is written. Never merge or deploy repairs automatically.
- [ ] UI demonstrates sign-in, repository selection, proposed repair, sandbox progress, evidence and approval. Browser walkthrough and failure-path tests required.
- [ ] Live GitHub callback and bounded cloud sandbox fixture verified separately from unit tests before claiming completion.

## Initial implementation decisions

Use the existing Next.js, Neon and server session boundary. Start with GitHub identity only; keep application admission and paid scan/repair eligibility separate so public login cannot silently enable unlimited provider spend. Use Vercel Sandbox as the first adapter because an isolated test was already exercised; Modal remains an optional alternative, not a second mandatory platform.

Provider API keys stay in the trusted service. The intended next integration is for NVIDIA Nemotron through Nebius to explain a constrained repair plan with Tavily/OSV source evidence. The implemented repair planner currently uses deterministic OSV evidence; it does not yet call Nemotron or Tavily. The sandbox receives only the selected source snapshot and bounded commands, not OAuth tokens or database/provider credentials.

## Configuration gates

GitHub app registration/callback configuration and any new repository permissions require account setup. Cloud execution needs an explicit per-run and aggregate budget before enabling recurring paid runs. Implement and test locally while those account configuration gates are prepared. Do not copy secrets into documentation, logs or PRs.

## GitHub sign-in setup

Register an identity-only OAuth application with callback `${SHIPCHECK_APP_ORIGIN}/api/auth/github/callback`. Set `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` and the canonical `SHIPCHECK_APP_ORIGIN` privately. Populate `SHIPCHECK_GITHUB_MEMBER_IDS` with invited numeric GitHub IDs for the preview. No account is linked by email or username; existing key members retain their historical reports. GitHub users receive their own workspace. Removing an ID or disabling its account invalidates existing GitHub sessions on their next request.

The login requests `read:user` only and discards the temporary provider token after identity lookup. A separate selected-repository GitHub App installation will provide repository access. Do not reuse login credentials as write access. Run the idempotent schema migration before enabling the callback routes.

Current implementation: OAuth initiation/callback, single-use database transaction, PKCE, browser binding and GitHub sessions implemented locally. Live OAuth is not verified until the application is registered and callback deployed to its configured origin. The development OAuth application was registered under chilu18 with Peter’s approval, callback http://127.0.0.1:3149/api/auth/github/callback. Client-secret provisioning and live sign-in remain pending; no repository permission was granted.

## Repair engine checkpoint

The planner supports direct npm dependencies whose locked version satisfies the manifest’s semver range, fetches matching OSV fixed-version evidence, confirms the original version is affected and checks candidate versions for advisories before proposing a manifest change. Aliases, URLs, workspaces, tags, inconsistent locks and ambiguous/transitive cases fail explicitly; extend them rather than claiming blanket repair coverage. The sandbox orchestrator requires a committed lockfile and actual test script, runs independent baseline and patched sandboxes, regenerates the patched lockfile, denies egress before tests/build, and records cleanup failures. The concrete cloud adapter, repository snapshot binding, post-run lockfile validation/rescan, UI and approval/PR integration are implemented locally; see the later checkpoints for verification scope. Unit fixtures are not live provider verification.

Sandbox adapter checkpoint: @vercel/sandbox 3.9.0 is installed. Adapter creates nonpersistent 180-second, one-vCPU sandboxes with no ports, permits registry.npmjs.org only for installation, and denies egress for project tests/build. Install and lockfile generation disable lifecycle scripts. Source paths, aggregate input size, logs and output lockfiles are bounded. Paid execution defaults off. Generated lockfiles are checked for the intended direct version and rescanned with OSV; cleanup failure blocks success. The adapter was subsequently exercised against cloud infrastructure; see the live cloud checkpoint below. SDK's transitive cli-config Zod 4.1.11 was overridden to 4.6.7; clean npm ci and npm audit report zero vulnerabilities at this checkpoint.

Repository connection checkpoint: the selected-repository GitHub App integration uses server-admin actor-to-installation grants (`SHIPCHECK_GITHUB_INSTALLATIONS`), not client-supplied installation IDs. This is an invited-preview connection path; self-service installation onboarding remains to be added/verified. Repository reads use read-only installation tokens, while future PR writes must mint a separate token restricted to one repository. Snapshot fetching pins a commit/tree, verifies every Git blob SHA, rejects truncated trees, symlinks/submodules, binary files and sensitive config paths, and caps 300 files / 2 MB. The proposal API persists the owner/workspace-bound snapshot and evidence plan after credential-pattern checks. No cloud resources, app installations or new permissions have been created by this code work.

User-flow checkpoint: /repairs now connects authorised repository selection, proposal, sandbox execution, command/lockfile review and explicit approval. Approval hashes bind the plan, generated files and execution evidence. Draft PR publication checks that the base commit has not moved, scopes write credentials to the selected repository and writes only package.json/package-lock.json on a new branch. No merge/deploy endpoint exists. Unknown publication outcomes remain in publishing state for reconciliation instead of repeating writes. Live cloud/OAuth/PR verification and browser acceptance remain open; current checks use controlled fixtures.

## Live cloud checkpoint — 25 October 2026, 21:36 London

Peter approved £15 total for initial sandbox tests. Five temporary VMs were created in this checkpoint: two initial 180-second attempts failed during working-directory setup and were deleted; one 60-second diagnostic identified the current SDK working directory; two corrected 180-second runs completed and were deleted. No production/provider/GitHub credentials were placed in any VM. Maximum configured aggregate runtime was 13 minutes at one vCPU; final billing is not yet reconciled. No recurring paid execution is enabled.

The synthetic minimist fixture exercised live registry and OSV calls, proposed 1.2.5 → 1.2.6 from one advisory, generated a lockfile in the patched microVM, installed without lifecycle scripts, ran two functional assertions in both baseline/patched environments with egress denied, and rescanned the resulting lockfile. Both phases returned exit 0 and cleanup completed. Evidence is in ignored test-results/repair-cloud-smoke.json. This proves the provider/sandbox path on a synthetic fixture, not the authenticated GitHub repository-to-PR journey.

Local verification: 158 tests in 19 files pass; ten browser tests pass (repair browser API responses are controlled fixtures). Typecheck passes; production build passed before the working-directory-only adapter correction. Live GitHub OAuth/App credentials and installation grants remain unconfigured; browser-authorised repository-to-PR acceptance is still open.

## Range handling and total execution allowance — 25 October 2026

The planner now accepts standard npm semver ranges only when the lockfile’s actual version satisfies the declared range. Proposed manifest output pins the reviewed fixed version exactly; the before manifest preserves the original declaration for review. Tests exercise caret, tilde, bounded and wildcard ranges, and reject mismatched versions, aliases, workspace/file/URL dependencies and tags before making provider requests.

Paid application execution remains disabled by default. Both daily and lifetime allowances default to one repair run and accept only integers 1–5. A database-backed lifetime reservation does not reset each day; failures and interrupted reservations consume the allowance conservatively. This is a run cap, not a pound-denominated billing cap. Historical smoke-script VM usage is separate; actual provider charges must be reconciled within Peter’s £15 total before raising the allowance. No additional cloud runs were made during this change.

Verification after this checkpoint: 180 tests across 20 files passed, including a real PGlite concurrency check of the lifetime allowance; TypeScript and production build passed; all ten browser tests passed. Repair browser calls remain mocked, so this does not prove live OAuth, repository access or PR publication. Changes remain local on codex/github-repair-loop.

## Before/after evidence checkpoint — 25 October 2026

Verification now scans the committed lockfile before allocating cloud compute and confirms every proposed source advisory against the exact package, locked version and dependency path. Stale/withdrawn evidence blocks execution and requires a fresh proposal. Both before/after results retain lookup timestamps, resolved dependency counts, advisory findings with exact source associations and the SHA-256 of the scanned lockfile. The UI shows this comparison separately from command success. PR approval requires an after-scan with zero findings and a hash matching the generated lockfile; older results without this evidence cannot be approved.

181 tests across 20 files, production build (including TypeScript), and ten browser tests passed. The evidence UI screenshot was inspected. Provider responses in these tests are fixtures; the earlier live smoke report predates the new scan-evidence fields and cannot serve as acceptance evidence for this checkpoint. No additional paid VMs were created. Live GitHub sign-in, repository installation and repository-to-draft-PR verification remain open.

## Saved repair continuation — 25 October 2026

The authenticated list endpoint returns the latest 25 owner/workspace-scoped repair summaries, excluding source snapshots and manifest contents. The UI can reopen proposals, running states, evidence and published PR links after a browser reload without issuing a mutation. Old verified records with insufficient scan evidence remain readable but receive no approval hash and cannot be published. The read route does not silently re-verify or repeat publication.

182 tests in 21 files, production build (including TypeScript), and 11 browser tests passed. PGlite checks cover independent owner/workspace exclusion, ordering and summary minimization. Browser checks prove reopening after reload performs no write. Cloud/OAuth/GitHub publication acceptance remains unverified and no additional cloud tests were charged during this checkpoint.

## Uncertain publication recovery — 25 October 2026

The service records the confirmed generated commit before creating the branch/PR. An explicit reconciliation action reads GitHub's existing PRs using a repository-scoped read token, then checks unique match, head commit/branch/repository, base repository/branch, open/draft state and absence of a merge. Only an exact match updates the local published record. No match, multiple matches, changed commits or ready/closed/merged PRs require manual review; GitHub writes are never automatically repeated. Missing commit confirmation also blocks recovery. API contract reference: https://docs.github.com/en/rest/pulls/pulls#list-pull-requests .

189 tests across 21 files, production build with TypeScript, and 12 browser tests passed. Six recovery rejection cases and the UI recovery action were exercised with fixtures. Registration remains identity-only; no repository permissions were granted. This checkpoint is local, not a live publication claim.

## Private local OAuth configuration

Run `python3 scripts/configure-github-login.py --client-id PUBLIC_CLIENT_ID --member-id NUMERIC_GITHUB_ID --origin http://127.0.0.1:3149` yourself in an interactive terminal. The helper requests the client secret using hidden terminal input, accepts no secret argument, preserves unrelated local configuration, atomically writes `.env.local` with mode 0600 and rejects symlink destinations. Do not paste the secret into chat or a shell command. Start the development app with `npx next dev --hostname 127.0.0.1 --port 3149` after the schema and configuration are ready. Development OAuth callback registration alone is not a completed login test.

Private helper checks passed with dummy values: unrelated settings preserved, duplicate assignment removed, owner-only permissions applied, symlink rejected. Live configuration presence check still reports all six GitHub settings missing. GitHub CLI identifies the signed-in account as chilu18 (numeric ID 7957943); this read does not supply OAuth credentials or repository App permissions.

## OAuth response boundary review — 25 October 2026

Token exchange and identity lookup now use the shared bounded JSON reader (1 MB maximum, timeout, redirect rejection), with explicit bounded token and identity schemas. Tests reject oversized responses at both stages and assert that the secret-bearing request forbids redirects. 192 tests in 21 files, TypeScript and production build passed after this change. The prior 12 browser checks remain the latest UI evidence; no new UI change was made in this checkpoint. Live OAuth is still not tested because the private settings are missing.

## Live development GitHub sign-in — 25 October 2026

Peter privately saved the OAuth settings. The idempotent schema migration succeeded. A production-mode local server at http://127.0.0.1:3149 exercised GitHub authorization, code exchange and database-backed session creation. The dashboard displayed github:7957943 and retained the authenticated session after reload. The repair page then reported no connected repository installation, confirming that identity login did not silently grant repository access. Screenshot: ../outputs/shipcheck-github-login-success.png.

The live run uncovered Next's local production request URL reconstruction (localhost internally versus the registered 127.0.0.1 Host). Both OAuth endpoints now permit that alias only for the exact configured HTTP loopback host/port and matching Host header; hosted-origin checks remain strict. Five regression cases cover the valid alias and rejected host/port/hosted-origin mismatches. Repository App configuration and a live repository-to-PR run remain outstanding. This is development login verification, not hosted deployment acceptance.
