# ShipCheck UI/UX overhaul review

26 October 2026 · Europe/London. Worktree: `shipcheck-integration`; branch: `codex/branded-dashboard`; baseline: `5a24d0c`.

The overhaul is implemented locally. Security verdict rules, evidence validation, repository access and explicit draft-PR approval are preserved. No push, PR, merge, deployment or access change was performed.

## Verification

| Check | Before | After |
|---|---:|---:|
| TypeScript | Passed | Passed |
| Unit tests | 203 / 22 files | 203 / 22 files |
| Production build | Passed | Passed |
| Playwright | 32 | 38 |
| Skipped tests | 0 | 0 |

Every phase ran typecheck, unit tests, build and the browser suite. Intermediate failures were corrected before committing. No safety assertions were removed. Phase 10 includes the final screenshot-driven fixes.

Screenshots: all nine requested views at 1440×900 and 375×812, plus the same set at 1024×768 and a dark report at each width: 30 PNGs. “Findings” is a scrolled position in the unified report, not a duplicate route. `viewport-checks.json` records no horizontal overflow across all 30 captures. Home demo and Scan actions are above the fold. A browser hit-test verifies the mobile Scan button is not covered by navigation. Mobile finding rows are tested at ≤80 px with no tag/title overlap.

Browser checks cover keyboard skip/focus, source/CSV dialogs and Escape, nested-dialog isolation, drawer focus return, report/finding Back/Forward and reload, stable demo URLs, unavailable reports, responsive repairs, authentication expiry, upload limits and explicit repair approval. Desktop/mobile screenshots were visually inspected. These are local browser checks, not a claim of new hosted acceptance or production deployment.

## Real recorded run

Captured **2026-10-26T09:08:16.729Z**, using the existing synthetic demo manifest, the real pipeline, Tavily and Nebius Token Factory. Model: **nvidia/nemotron-3-super-120b-a12b**; endpoint region: **us-central1**; capture commit: **a7a49c7a0d4f035ba5d8661f99d6bb300702f0ff**. The stored report contains five findings and five sources, retaining pipeline-produced notes and retrieval provenance.

`fixtures/recorded-live-run.json` is the default demo when present. The recorded report has seven actual coverage checks; the offline fixture has six. The meter counts the report's actual checks instead of truncating the live report to six. Replay makes no new provider requests. Capture script and README instructions support honest absent/failed capture states.

## Item-by-item outcomes

“Fixed” describes implemented and locally checked behaviour, not external review approval. Partial items and deliberate omissions are explicit.

### Phase 1 — identity

| Item | Outcome |
|---|---|
| Single ShipCheck name, metadata, README, alt text | Fixed. Agent Shielda remains only as the single README historical note. |
| Real workspace identity | Fixed. Signed out is Demo workspace; sidebar uses GitHub login from the authenticated session when available. |
| Sidebar marketing footer | Fixed. Removed; a small Built by HeySalad remains in the page footer. |
| Protected preview badge | Fixed. Removed without changing actual deployment protection. |
| Sign-in wording | Fixed. Sign in with GitHub links to the existing page; individual access-key fallback remains. |
| Tagline once | Fixed. One shared header instance; hidden on narrow mobile layouts. |

### Phase 2 — sponsor evidence

| Item | Outcome |
|---|---|
| Recorded live demo | Fixed. Real captured report, not invented AI text. |
| Capture only synthetic input | Fixed. Existing demo manifest; no private repository code sent. |
| Scrubbed fixture and provenance | Fixed. Masked pipeline report, dates, source snippets/URLs, model, region and commit; no raw provider request bodies or auth headers. |
| Missing-provider/capture fallback and script | Fixed. Availability endpoint, honest absent state and documented capture script. |
| Replay banner and original coverage | Fixed. Captured timestamp and replay/no-live-requests wording; stored states retained. |
| Recorded default, offline secondary | Fixed. Availability drives default; stable IDs for both. |
| Visible AI triage with configuration booleans | Fixed. Existing safe health endpoint; presence is explicitly not a provider health check. Defaults on when both configured. |

### Phase 3 — home

| Item | Outcome |
|---|---|
| One compact empty state | Fixed. One sentence, Run the demo, duration guidance, Scan your lockfile and compact flow line. |
| Recent scans for signed-in users | Fixed. Reuses MemberControls history data with empty/error states and saved-report opening. |
| Remove hero, decorative diagram/cards and CSS | Fixed. Removed. |
| One primary action per screen | Fixed for actionable views. Deliberately omitted during loading and findings without a supported repair action; no artificial action is invented. Background report is inert while a finding drawer is open. |
| Compact sign-in banner | Fixed. Signed-out account row stays compact on mobile; real signed-in controls retain identity and saved history. |
| Demo button above mobile fold | Fixed and captured at 375×812. |

### Phase 4 — unified report

| Item | Outcome |
|---|---|
| Verdict vocabulary | Fixed. Presentation maps to Blocked / Needs review / Incomplete / Clear without changing stored policy values. |
| Review severity | Fixed. No documented low-severity rule exists, so it is Unrated plus Needs human review. CSV uses the same mapping. |
| High-severity count wording and deployment disclaimer | Fixed. Count matches findings; one advisory-verdict line. |
| Coverage meter and arithmetic | Fixed. Buttons expose each real state; complete + limited + incomplete + not-in-scope equals actual total. |
| Collapsed coverage and scope | Fixed. What this scan covers contains full check details and consolidated report limitations. |
| Remove severity chart; retain CSV | Fixed. Chart and abandoned bar styles removed; CSV preview/download is in findings header. |
| Merge Overview, Findings, Actions | Fixed. One report, severity-sorted rows, package/location, next step and signed-in decision state. Legacy views normalize to overview. |
| Filters | Fixed. Severity chips always; search/advanced filters only above eight findings; demo decision filter hidden. |
| Pluralisation | Fixed across changed report, evidence, CSV and repair counts using the shared helper. |
| Disclaimer inventory and diet | Partly fixed. Repeated report warnings are consolidated and action context collapses. Authentic source/model text and contextual authentication, host-proof and repair safety warnings remain; they are not silently rewritten or removed. Full copy inventory follows. |
| One row target, drawer/full page | Fixed. No Quick view. Desktop native dialog traps focus; mobile full view; finding URL, Escape, Back/Forward and row focus restoration are tested. |
| Internal/external icons | Fixed in changed finding/report navigation; external source links retain an external icon and noreferrer. |
| Remove inner findings scroll | Fixed. No bounded-findings class or tabIndex scroll container; the document scrolls. Dialogs retain their necessary bounded scrolling. |
| Mobile row sizing/touch | Fixed. Compact rows ≤80 px tested; full title remains in the accessible button name and detail view. |

### Phase 5 — finding detail

| Item | Outcome |
|---|---|
| Advisory ID, aliases, vector, CWE, range, fixed version | Fixed for the exact matching bundled OSV record. Fields absent from stored evidence are omitted. Other live advisories are not enriched or guessed; snapshot metadata must not be mistaken for a fresh OSV lookup. |
| Dependency duplication | Fixed in the evidence card: one dependency line and one path. Original advisory excerpts remain verbatim. |
| Concrete change and Prepare repair | Fixed where a fixed version is known; supported npm findings get the primary repair handoff. Caveat shortened and additional action context collapsed. |
| Demo review controls | Fixed. Disabled Acknowledge/Dismiss with Sign in to record decisions; no fake saved decisions. Member behaviour unchanged. |
| Nemotron note basis | Fixed. Validated selections explicitly say verbatim from scanner evidence; existing scanner-fallback rules remain. No note means no empty note panel. |
| Source preview | Fixed. Keyboard-accessible preview and visibly external original-source link. |

### Phase 6 — navigation

| Item | Outcome |
| Stable demo reload/share | Fixed. Fixture reconstruction for demo-offline and demo-recorded, including finding URLs. |
| Live report privacy | Fixed. Member reports load from the server; no report contents added to browser persistent storage. |
| Missing report state | Fixed. Dedicated recovery view, with honest not-saved/no-access wording rather than claiming to know which cause applies. |
| Useful navigation without report | Fixed. Overview empty state and independent Scan/Project/Repairs flows; redundant report tabs removed. |
| Breadcrumb depth | Fixed. Top-level repetition removed; finding Back to report and repair Report › Repair retained. |
| Footer/demo messaging | Fixed. Demo banner explains unsaved decisions; footer simplified. |

### Phase 7 — new scan

| Item | Outcome |
| One visible Scan action | Fixed. Sticky action bar; visible at 1440×900 and above mobile navigation. |
| Upload/drop, detection, override and limits | Fixed. Three supported filenames, format override, 200 KB UTF-8 byte limit and parser's 50-package limit before request; inline errors. Server checks unchanged. |
| Staging badge and compact secondary column | Fixed. Own line, no wrap; one demo action and project setup guidance. |
| Honest progress | Fixed using the permitted queued approach: one running request, elapsed time and queued check list. No simulated stage completion or new streaming endpoint. |

### Phase 8 — repairs

| Item | Outcome |
| Four-step progress | Fixed. Current/completed/failed states derive from saved repair state; failures retain recovery/no-repeat behaviour. |
| Real diff | Fixed. Added/removed lines derived from before/after manifests; no fabricated patch. |
| Execution evidence | Fixed. Baseline/patched command table, exit/result and expandable actual output. |
| Before/after scan comparison | Fixed. Counts and singular/plural; hashes collapsed; absent evidence stays absent. |
| Disabled-button explanations | Partly fixed. Proposal and approval gates have adjacent reasons; buttons temporarily disabled by busy/loading share the existing visible status, rather than each duplicating it. |
| Sign-in copy, shared styling and breadcrumb | Fixed. Repair-specific sign-in error; no repair-page inline style attributes. |
| Audit trail | Fixed. UTC timeline, collapsed evidence, unchanged read-only/export semantics. |
| Signed-out walkthrough | Fixed using the explicitly permitted empty-stepper option. No real completed repair fixture was available, so no fake sample was added. |

### Phase 9 — visual system

| Item | Outcome |
| Interactive, severity and verdict colours | Fixed. Blue interaction, red/amber severity, neutral Unrated; separate verdict tokens. |
| Single brand token | Fixed. Teal #0f766e defined once for brand. |
| CSS consolidation | Fixed for duplicate selectors within the same cascade context and identical breakpoint conditions; grouped selectors still share declarations normally. Dead hero/chart styles removed. |
| Typography | Fixed in changed styles. Sub-12 px metadata raised, body rules raised to 14 px; compact code/metadata retains 12–13 px. |
| Text contrast | Fixed in audited states: no computed text pair below 4.5:1 on six primary routes in light/dark mode. See scope and colours below; this is not certification of every possible provider/error string or native control state. |
| Dark mode | Fixed through prefers-color-scheme and shared tokens; dark report screenshots supplied. |

### Phase 10 — structure

| Item | Outcome |
| Per-view components | Fixed. home-empty, new-scan, report and finding-detail extracted. |
| Focused components | Fixed. verdict-card, coverage-meter, findings-table, finding-surface, AI triage and scan-progress; repair evidence components extracted. |
| Routing module | Fixed. URL/state, popstate, breakpoint and focus logic in use-report-navigation.ts (66 lines); main page reduced from 646 to about 160 lines. |
| Behaviour regression | Fixed locally: complete suite green, no test deleted/skipped and no runtime dependency added. |

## Colour / contrast evidence

Light: ink #142b45 and muted #475569 on #ffffff / #f8fafc; interactive #2563eb. Dark: ink #e5edf7, muted #b6c4d6, links #93c5fd on #182231 / #101722. Filled dark primary buttons use #1d4ed8 with white text. High/medium use dedicated red/amber light and dark palettes; Unrated is a neutral outline. Changed formerly fixed pale sidebar/panel surfaces to shared surface/canvas tokens. Metadata/placeholder colours use muted tokens.

`contrast-checks.json` records computed foreground/background pairs for home, scan, project, offline report, repairs and sign-in in both schemes. Transparent backgrounds were resolved to opaque ancestors. Disabled controls were excluded. This check does not measure rendered antialiasing, image text, every nested dialog/state or every OS-native widget; those limits are explicit rather than a universal accessibility claim.

## Test changes

- dashboard: unified labels and explicit Offline fixture selection; anonymous API rejection also asserted directly with malformed input before client-side valid-form submission.
- findings-usability: a nine-finding test fixture exercises the >8 advanced-filter threshold; real decision/history and navigation assertions retained.
- responsive: obsolete Actions/Findings navigation replaced with unified report, drawer closed before background navigation; mobile resize waits for full-page transition.
- report-previews: removed Quick view expectations; retained CSV download, focus restoration, source links, nested Escape and bounds.
- repairs: repair CTA wording and singular dependency copy updated; approval, no-repeat, reconciliation and audit safety assertions retained.
- storage: assigns an explicit UUID to the synthetic storage test report, because stable demo replay IDs are not stored as member reports. Ownership/redaction/verdict assertions retained.
- six new browser tests: stable/legacy reload, unavailable recovery, drawer focus plus replay provenance, upload/limits, mobile Scan hit-test, and mobile row separation/height.

## Known limits / reviewer attention

1. Real fixture capture succeeded, but replay is point-in-time evidence, not a new security scan.
2. Rich advisory metadata is displayed from the matching existing snapshot; unsupported metadata is omitted. No extra live metadata lookup was added.
3. Some contextual safety copy remains outside the report scope disclosure, and temporary busy buttons share status copy. These are the two partial items above.
4. Loading intentionally has no primary action; findings without a supported repair have no invented repair button. The “one primary” rule is applied to actionable screens.
5. No fresh live repair run, sandbox spend, GitHub mutation, sign-in change or hosted deployment was performed in this UI task. Existing repair semantics are verified by regression tests.
6. Source inspection did not open .env.local or .private as text. The authorised one-time capture process privately loaded provider credentials at runtime; no secret values were displayed, copied into reports, or committed. It would be inaccurate to say the runtime never used credentials.
7. .impeccable/ and docs/PHASE-4-BROWSER-CHECK.md remain untouched/untracked. No runtime dependencies added. No fabricated model output, dates or findings in the product fixture. Browser test doubles remain clearly test-only.

## Local commits

- `a7a49c7` Phase 1: unify ShipCheck identity and show authenticated workspace
- `aa93f0a` Phase 2: capture real provider evidence and add labelled replay
- `d370c6f` Phase 3: replace marketing home with one actionable empty state
- `d49466d` Phase 4: unify verdict, coverage and findings with accessible detail drawer
- `bc708e7` Phase 5: clarify advisory evidence and repair handoff
- `2892cdc` Phase 6: restore stable demo links and provide report recovery
- `dd02d0e` Phase 7: add validated manifest upload and honest scan progress
- `524a1fc` Phase 8: organize repair verification, diff and audit evidence
- `11c4d2e` Phase 9: consolidate visual tokens, responsive styles and dark surfaces
- `cc06f61` Phase 10: extract report navigation and complete responsive workflow checks

The final documentation-only commit contains this report and is identified by HEAD after completion; its own hash cannot be embedded recursively.

## Disclaimer inventory — before and after

The following inventory preserves full static paragraph/metadata copy (whitespace normalised); `[runtime evidence]` marks expressions populated by the report. Source excerpts, model selections and server error messages remain verbatim at runtime. The inventory includes contextual safeguards in authentication, project verification and repairs, not just report scope warnings. Additional non-paragraph warning lines are listed explicitly.

### Before

- Record your assessment. This does not resolve the finding or change the scan verdict.
- Decision history is available for saved member scans. This offline demo is temporary.
- No decisions recorded for this finding.
- Live requests are bounded. Findings appear when the scan finishes.
- Choose the repository, then review the proposed target version before verification. This manifest scan does not establish repository ownership or confirm that the same dependency is present there.
- Exact pins only · up to 50 resolved packages · 200 KB maximum
- Package names and versions go to OSV. Optional research uses server-side provider keys; missing keys appear as incomplete coverage. Do not paste credentials.
- Uses a single OSV advisory snapshot from 23 Oct 2026. No external requests.
- Prove ownership of your staging host, then select it for bounded passive checks.
- Offline fixture · no account or API keys needed
- Open a saved repair to review its audit trail, tests and draft PR evidence.
- [runtime evidence] · [runtime evidence] high-severity findings · [runtime evidence] limited or incomplete checks. This assessment does not enforce a deployment gate. [runtime evidence] Review coverage
- [runtime evidence] This assessment is not a guarantee that the application is secure and does not enforce a deployment gate.
- No actions generated. Review incomplete coverage before relying on this result.
- No findings match these filters. Clear filters or try a different search.
- No findings returned. Check the coverage below.
- Search results do not establish that a version is affected and never change the verdict.
- Optional staging checks: name the release candidate and prove control of its exact host. You can scan a dependency manifest without creating a project.
- Use the HTTPS origin of a public staging host. Paths, ports, query strings and credentials are not accepted.
- Exact host to verify: [runtime evidence]
- Publish the current value at the exact hostname. The challenge expires at [runtime evidence] .
- Exact content: [runtime evidence]
- After verification, choose this project under New scan to include bounded passive staging checks.
- Review a patch, verify it in isolated compute, and approve an exact change for a draft pull request.
- Your saved evidence is preserved. No action will be automatically repeated.
- Verification was started. Refresh this saved repair to read its latest status; this does not start another sandbox. [runtime evidence] [runtime evidence] Refresh verification status
- The server recorded a failed verification but no detailed reason is available. Ask your workspace administrator to inspect the execution logs using this repair ID.
- Sandbox cleanup was not confirmed. Ask your administrator to check and stop remaining compute before starting another verification.
- Runs baseline and patched tests. Compute is enabled only within the configured preview budget.
- Not completed. No after-scan success is implied.
- Point-in-time OSV matches for resolved dependencies; this does not establish application exploitability or prove the application secure.
- Dependency scan evidence is unavailable. Run a fresh verification before approval.
- Creates a new branch and draft PR containing only package.json and package-lock.json. Nothing is merged or deployed.
- This saved result lacks current approval evidence. Create and verify a fresh proposal.
- Recorded actors, actions and evidence fingerprints. Times are shown in UTC. Events have no edit or delete action in ShipCheck; this is not an independently tamper-proof archive.
- No recorded audit events. This repair may predate event logging; earlier actions have not been reconstructed.
- Confirm the repository and inspect the resolved version in the proposal before testing. A package passed from a finding does not identify its repository. Small npm projects only: a direct dependency, supported semver range, committed package-lock.json and real test script are required.
- Repository access is separate from sign-in. Ask your workspace administrator to connect your GitHub App installation to your ShipCheck account, then refresh.
- No connected repositories. Ask your workspace administrator to connect a repository, then [runtime evidence] refresh repository access .
- Your latest 25 repairs. Opening a repair only reads its saved evidence.
- Loading saved repairs…
- Saved repairs could not be loaded: [runtime evidence]
- Refresh to try again. Existing repairs have not been changed.
- No saved repairs yet. Select a repository and dependency to prepare your first proposal.
- Recorded excerpt · this preview does not fetch or embed the external page.
- Incomplete, snapshot and out-of-scope checks are not counted as complete. These counts are not a security score.
- No findings returned. Review coverage before making a decision.
- Repository access stays separate. You choose what to connect.
- Choose GitHub above, or use the individual access key supplied by your team below. Both methods sign you in; you do not need both.
- Ask your workspace owner for your individual key. This is not your GitHub password.
- No code has been changed. Resolution requires independent verification.
- Offline demo is temporary · Member scans are saved

### After

- [runtime evidence] · configuration presence, not a provider health check.
- Missing provider keys produce incomplete coverage.
- The pipeline does not stream progress. Checks below remain queued until the report arrives.
- Advisory verdict — ShipCheck does not block deployments.
- Record your assessment. This does not resolve the finding or change the scan verdict.
- Sign in to record decisions. Demo decisions are not saved.
- No decisions recorded for this finding.
- This scan wasn’t saved here, or your account cannot access it. Sign in to reopen saved reports and keep future scans.
- Optional staging checks: name the release candidate and prove control of its exact host. You can scan a dependency manifest without creating a project.
- Use the HTTPS origin of a public staging host. Paths, ports, query strings and credentials are not accepted.
- Exact host to verify: [runtime evidence]
- Publish the current value at the exact hostname. The challenge expires at [runtime evidence] .
- Exact content: [runtime evidence]
- After verification, choose this project under New scan to include bounded passive staging checks.
- Review a patch, verify it in isolated compute, and approve an exact change for a draft pull request.
- Your saved evidence is preserved. No action will be automatically repeated.
- Sign in to start. A connected repository is required; no recorded repair walkthrough is available.
- Verification was started. Refresh this saved repair to read its latest status; this does not start another sandbox. [runtime evidence] [runtime evidence] Refresh verification status
- The server recorded a failed verification but no detailed reason is available. Ask your workspace administrator to inspect the execution logs using this repair ID.
- Sandbox cleanup was not confirmed. Ask your administrator to check and stop remaining compute before starting another verification.
- Runs baseline and patched tests. Compute is enabled only within the configured preview budget.
- Not completed. No after-scan success is implied.
- Point-in-time OSV matches for resolved dependencies; this does not establish application exploitability or prove the application secure.
- Dependency scan evidence is unavailable. Run a fresh verification before approval.
- Creates a new branch and draft PR containing only package.json and package-lock.json. Nothing is merged or deployed.
- This saved result lacks current approval evidence. Create and verify a fresh proposal.
- Recorded actors, actions and evidence fingerprints. Times are shown in UTC. Events have no edit or delete action in ShipCheck; this is not an independently tamper-proof archive.
- No recorded audit events. This repair may predate event logging; earlier actions have not been reconstructed.
- Confirm the repository and inspect the resolved version in the proposal before testing. A package passed from a finding does not identify its repository. Small npm projects only: a direct dependency, supported semver range, committed package-lock.json and real test script are required.
- Repository access is separate from sign-in. Ask your workspace administrator to connect your GitHub App installation to your ShipCheck account, then refresh.
- No connected repositories. Ask your workspace administrator to connect a repository, then [runtime evidence] refresh repository access .
- Your latest 25 repairs. Opening a repair only reads its saved evidence.
- Loading saved repairs…
- Saved repairs could not be loaded: [runtime evidence]
- Refresh to try again. Existing repairs have not been changed.
- No saved repairs yet. Select a repository and dependency to prepare your first proposal.
- Recorded excerpt · this preview does not fetch or embed the external page.
- No findings returned. Review coverage before making a decision.
- Repository access stays separate. You choose what to connect.
- Choose GitHub above, or use the individual access key supplied by your team below. Both methods sign you in; you do not need both.
- Ask your workspace owner for your individual key. This is not your GitHub password.
- Choose the repository and confirm the dependency before verification.
- ≈10 seconds · no account needed
- No saved scans yet. Scan your lockfile to create your first report.
- Exact pins · up to 50 resolved packages · 200 KB maximum
- Package names and versions go to OSV. AI triage uses server-side keys; missing keys mean incomplete coverage. Do not paste credentials.
- Prove staging-host ownership to enable bounded passive checks.
- Verified members only
- Findings do not establish application exploitability or guarantee security. Review decisions do not resolve findings or change the verdict. No target system is changed by a scan. Dependency repairs require separate verification and explicit approval.
- Research is unconfirmed context, not an affected-package assertion. Missing model notes are not evidence that a finding is safe. Recorded and snapshot evidence is point-in-time, not current coverage.
- No code has been changed.
- Advisory verdict — ShipCheck does not block deployments.
- Demo decisions are not saved.
- Selected verbatim from scanner-authored notes; no generated claims.
- Scanner fallback. Unvalidated model wording is not displayed.
