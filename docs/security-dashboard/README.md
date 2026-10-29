# Security overview dashboard

Status, 28 October 2026: **implemented and verified locally and on the protected Preview**. The batch progress foundation includes migration `010_batch_dashboard.sql`; the acceptance database already has it applied. This dashboard reads existing results and does not submit scans or start workers. Production remains demo-only. All screenshots in `screenshots/` use the explicitly synthetic fixture in `tests/browser/security-fixture.ts` (`example-org/*` repositories, `GHSA-syn1-*` advisories). They contain no HeySalad data.

Route: `/security-overview` (`/security` remains the public disclosure page). API: `GET /api/security`.

## Research brief

All sources were accessed on 28 Oct 2026. Only public documentation and marketing pages were read. No authenticated product screens were seen.

| Source | What I read | Concrete observation | Used here |
|---|---|---|---|
| [GitHub: About security overview](https://docs.github.com/en/code-security/concepts/security-at-scale/security-overview) | Docs page | Separate **Overview**, **Risk** and **Coverage** views. Applying filters updates every metric on the view. A note says that no alerts may mean "the feature may not be enabled". Alert data is historical, while repository attributes reflect current state. | Separate tabs for verdicts and coverage. "Not checked" is never shown as clean. Each metric names its denominator and revision. |
| [GitHub: Assessing code security risk](https://docs.github.com/en/code-security/how-tos/view-and-interpret-data/analyze-organization-data/assessing-code-security-risk) | Docs page | Clicking "NUMBER affected" or a severity count in the header filters the repository list. The unaffected set includes repositories where the feature is not enabled. | Every chart segment and count is a button that opens the matching filtered list, as a deep link. |
| [Snyk: Prioritize issues for fixing](https://docs.snyk.io/scan-fix-and-prevent/fix/prioritize-issues-for-fixing) | Docs page | Project filters are severity, fixability, exploit maturity and status. Priority Score combines CVSS, trending, reachability and exploits. Risk factors include Deployed and Public facing. | Severity and fixability are used as filters. **No composite score**: ShipTested has no reachability, exploit-maturity or deployment data, so the fix-first queue is a disclosed sort order. "Deployed / public facing" is shown as *not recorded*. |
| [Semgrep: View Supply Chain findings](https://docs.semgrep.dev/semgrep-supply-chain/findings) | Docs page | The default **Priority** tab is critical/high *and* reachable, with **All** alongside it. Filters include severity (from the advisory source), reachability, EPSS, dependency and advisory ID. "Needs review" is its own reachability state. | Severity carries its source. Advisory/package search. "Affected-version match ≠ exploitability" is stated in the drawer. |
| [Socket: Organization alerts](https://docs.socket.dev/docs/organization-alerts.md) and the [docs index](https://docs.socket.dev/llms.txt) | Markdown docs | A centralized alert table grouped by severity, filterable by repository, ecosystem, severity, category, type and dependency. Reachability tiers (dependency, precomputed, full application) are documented separately. | Cross-repository grouping by advisory and package. Ecosystem is kept per package. |
| [Wiz: Unified vulnerability management](https://www.wiz.io/solutions/vulnerability-management) | Marketing page only | Prioritization is based on graph context and validated external exposure, with owner assignment through Projects/CMDB and transitive-dependency remediation guidance. | **Inference only** (no product docs read): exposure and ownership need data that ShipTested does not have, so neither is shown or invented. |

**Design direction.** I took interaction patterns, not branding:
- filter-on-click counts (GitHub);
- a default "what needs attention" view with "all" one click away (Semgrep);
- one row per advisory across repositories (Socket);
- an evidence drawer with prerequisites (Snyk and Semgrep detail panes).

The visual language is the existing ShipTested system: Bricolage headings, Inter, mono for identifiers, hairline panels and the existing light and dark tokens. It deliberately avoids gauges, scores, trend lines and green "done" cues:
- completed jobs are blue;
- Checks passed is neutral grey;
- Incomplete is hatched;
- severity uses the existing red, amber and blue paired with text.

## What is built

| View | Answers | Notes |
|---|---|---|
| **Overview** | What needs attention first? What happened? What was not checked? | <ul><li>Processing bar out of all selected repositories; verdict bar out of completed reports. Each is a separate figure.</li><li>Fix-first queue.</li><li>Unique advisories / affected repositories / dependency occurrences.</li><li>Blocked repositories.</li><li>Incomplete-cause bar and the "zero dependencies checked" call-out.</li><li>Overlapping gap bars.</li></ul> |
| **Findings** | Which repositories share the same problem? | <ul><li>One row per advisory, with search (advisory, package or repository) and a severity filter.</li><li>Paginated 25 per page.</li></ul> |
| **Evidence drawer** (`?advisory=`) | What evidence supports it? What should I do next? | <ul><li>Modal `<dialog>` with focus handling; Escape closes it and removes the parameter.</li><li>Shows severity and its source, CVSS and vector, and prerequisites from the vector.</li><li>"Deployment exposure: Unknown · not recorded".</li><li>Per installed version, the advisory-specific fixed versions.</li><li>Occurrences with manifest path, a link to the report finding, the OSV link and the retrieval date.</li></ul> |
| **Repositories** | Prioritised repository list | Ordered Blocked first, then by high count, then medium count; filters by verdict. |
| **Coverage** | What was not checked? | <ul><li>Pipeline: report saved → manifest scanned → exact versions resolved → lookup complete.</li><li>Gap filters, stage and verdict.</li><li>Per-repository manifests with exact-version counts.</li><li>Omitted files with reasons, or "Reason not recorded".</li><li>Sorted with the fewest dependencies checked first.</li></ul> |
| **Batch process** | What happened during the batch? | <ul><li>All selected entries, including waiting, queued, running, failed, cancelled and skipped.</li><li>Median queue wait and run time from the audit log.</li><li>Jobs finished per 30 minutes, with a table alternative.</li><li>Failure codes explained in plain words.</li><li>Links to the existing `/batches` all-entries live view, which is preserved and now also explains failure codes.</li></ul> |

Every number is derived on each request from the selected batch.
- **Filters** are URL parameters: `batch`, `view`, `q`, `severity`, `verdict`, `gap`, `stage`, `state`, `advisory`, `page`.
- **Polling** runs every 10 s only while the batch has waiting, queued or running entries and the tab is visible.
- **Freshness** shows the last successful update time and the newest report time.
- **States** covered: loading, empty (no batch), signed out (private rows cleared), stale (last data retained with an alert) and error.
- **No action buttons:** there are no scan, retry or export controls.

## Metric and grouping definitions

- **Selected:** entries in the registered batch manifest (`sc_batch_plans.entries`). This includes verified empty skips and entries not yet accepted.
- **Accepted:** entries with a matching job (same workspace, owner, request key and repository).
- **Completed / failed / cancelled / queued / running:** the job's current state.
- **Waiting to submit:** no job yet.
- **Skipped:** a verified `empty_repository` annotation and no job. Skips are never counted as scans.
- **Report (current revision):** the report pointed to by `sc_scan_jobs.report_id` for a completed job. The advisory-refresh pass updates that pointer, so superseded revisions are never joined or double-counted. The overview states how many reports are refresh revisions.
- **Verdict denominator:** completed jobs with a readable current report. A completed job without a readable report is reported as "no readable report".
- **Incomplete causes** (out of Incomplete reports; mutually exclusive):
  - *No supported manifest scanned:* zero manifests were scanned.
  - *Manifests read, zero exact versions resolved:* at least one manifest was scanned, but there are zero dependencies.
  - *Partial:* at least one dependency, with incomplete coverage.
- **Zero dependencies checked:** a report with any verdict where `dependencies` is empty.
- **Coverage gaps** (out of all reports, including Blocked) **overlap**. Never add them together. Each gap is derived only from stored fields and check text:
  - unsupported lockfile names in `omitted`;
  - `<path> — scan` checks;
  - parser warnings ("package.json does not resolve transitive…", "only exact Python pins…", unresolved versions);
  - OSV gap codes (`package_lookup_failed`, `advisory_lookup_failed`, `query_response_mismatch`, `pagination`, `deadline`, `advisory_limit`, `finding_limit`).
- **Omission reason:**
  - recorded only for unsupported lockfile names, time-budget scan checks and failed manifest scans;
  - everything else (size, count or encoding limits are not stored per file) is shown as **"Reason not recorded"**.
- **Unique advisory:** one OSV ID, taken from the evidence URL `https://osv.dev/vulnerability/<id>`. A credential-pattern finding is keyed by its title.
- **Affected repositories:** distinct repositories with at least one occurrence.
- **Dependency occurrences:** finding records, one per advisory × package version × manifest.
- **Group severity:** the most severe recorded value for that advisory. Severity sources are listed as recorded.
- **Fixed versions:** the `fixedVersion` values recorded for each installed version. They are never merged across versions.
- **Fix-first order:** a sort, not a score. Shown only for high and medium advisories, ordered by:
  1. severity;
  2. affected repositories;
  3. CVSS (unknown last);
  4. whether a fixed version is recorded;
  5. occurrences.
- **Exploit prerequisites:** AV, AC, PR, UI and S from a CVSS v3 vector, when one was recorded. Without a vector, prerequisites are "unknown".
- **Queue wait and run time:**
  - Queue wait is the time from `scan_queued` to the first `scan_started` event.
  - Run time is the time from the last `scan_started` event to the terminal event.
  - These are append-only `sc_workspace_events` rows, scoped to the owner and workspace.
  - Jobs without events show "Not recorded".

## Engineering

- `src/lib/server/security-dashboard.ts` reads at most 500 entries in keyset pages of 50 (at most 11 queries), plus one events query (6,000 rows maximum) and one job-ID query for the process view.
- **Isolation:**
  - every join requires the batch's `workspace_id` and `owner_id`;
  - reports join only through the job's pointer;
  - events require a matching workspace, actor and batch request key.
- SQL trims findings to the fields the UI uses (title ≤ 300 characters, location ≤ 400, check detail ≤ 600), so evidence excerpts and dependency arrays never leave the database.
- Responses are paginated (25 advisories or 50 repositories per page; 500 occurrences maximum in the drawer). Request keys are never returned.
- The API is refused in public-demo mode, like every live handler. The page is rewritten to `/demo-access` by the demo proxy.

## Verification (local, 28 Oct 2026)

- `npx vitest run`: **58 files, 388 tests passed**. This includes the new `tests/security-dashboard.test.ts` (10 tests) and an updated public-demo handler count (44).
  - The new tests cover deduplication and current revisions, owner and workspace isolation, event isolation, Blocked reports with gaps, "Reason not recorded", missing fields, active and finished batches, invalid and foreign batch IDs, and pagination.
- `npx tsc --noEmit`: passed. `npm run build`: passed. `git diff --check`: clean.
- `npx playwright test tests/browser/security-dashboard.spec.ts`: **6 passed**, covering:
  - chart → filtered list by keyboard, deep-link reload, search and filter URLs;
  - drawer open, Escape and URL clean-up;
  - coverage reasons, the zero-dependency list, and process states (waiting, failed and skipped);
  - stale and signed-out states;
  - no horizontal overflow at 390 px in both themes, including the drawer.
- `tests/browser/batch-progress.spec.ts` still passes.
- `tests/browser/responsive.spec.ts` has 3 failures: `getByRole('link',{name:'ShipTested home'})` matches both the landing header and footer brand links. That page was changed in the already-committed public UI polish (`6025388`); this change did not touch it.
- Screenshots were inspected:
  - overview (desktop dark and light; mobile dark and light);
  - findings, coverage and process (desktop dark);
  - findings and coverage (mobile, both themes);
  - evidence drawer (desktop dark and light; mobile light).
- Two layout bugs were found and fixed during review: package names wrapping one character per line in the fix-first queue, and a long select widening the mobile page.

## Remaining data limitations

- No per-stage telemetry (discovery, parsing, OSV lookup), so no stage progress or ETA is shown.
- No per-file omission reason for size, count or encoding limits.
- No reachability, EPSS, exploit maturity, deployment, exposure, ownership or remediation status.
- No advisory aliases (CVE IDs); the OSV ID is shown.
- Failure codes are coarse (`scan_failed`, `unsupported_repository`, `provider_unavailable`, `retry_exhausted`) and provider bodies are not stored.
- The live HeySalad batch was **not** viewed. Its numbers were not checked against this UI, because that requires signing in to the protected preview as the batch owner.

## Proposed additions (not implemented; need authorization)

1. Record an omission reason with each path, e.g. `repositoryScan.omitted: [{path, reason}]`, in the worker (code only, no migration; old reports keep "Reason not recorded").
2. Add stage events (`scan_stage` with `discovery|parse|advisories` and duration) to `sc_workspace_events`, or a new `sc_job_stages` table (needs a migration).
3. Store OSV aliases in the finding (`aliases[]`) so CVE IDs can be searched.
4. Add an index on `sc_workspace_events(workspace_id, actor_id, subject_id)` if event volume grows (needs a migration).

## Preview locally

Synthetic data, no database needed:

```sh
npm run build
npx playwright test tests/browser/security-dashboard.spec.ts --headed
```

With your own development database, after configuring `.env.local` privately:

```sh
npm run dev
```

Then sign in and open `http://127.0.0.1:3147/security-overview`. Real batch data appears only for the batch owner's workspace, and only after a batch manifest is registered.

## Changed files

- New:
  - `src/lib/security-dashboard.ts` (pure aggregation and definitions)
  - `src/lib/server/security-dashboard.ts` (bounded, isolated queries and view payloads)
  - `src/app/api/security/route.ts`
  - `src/app/security-overview/page.tsx`
  - `src/app/security-overview/security-dashboard.tsx`
  - `src/app/security-overview/views.tsx`
  - `src/app/security-overview/security.module.css`
  - `tests/security-dashboard.test.ts`
  - `tests/browser/security-fixture.ts`
  - `tests/browser/security-dashboard.spec.ts`
  - `docs/security-dashboard/README.md`
  - `docs/security-dashboard/screenshots/*.png` (synthetic)
- Edited (small additions; all except `src/proxy.ts` already had uncommitted changes from other work, which are preserved):
  - `src/app/workspace-sidebar.tsx`: Security overview link and the `security` view
  - `src/app/mobile-navigation.tsx`: `security` view type
  - `src/app/batches/page.tsx`: link to the Security overview
  - `src/lib/server/batch-progress.ts`: failure codes explained in plain words
  - `src/proxy.ts`: public demo rewrites `/security-overview` to the demo-access page
  - `tests/public-demo.test.ts`: handler count 43 → 44, plus the new page and API in the refusal list

### Remediation queue and coverage recovery

The overview starts with a compact batch summary and five grouped advisories. The full remediation queue supports URL-persisted ranking:

- `sort=widespread`: affected repository count, reported severity, then CVSS.
- `sort=severity`: reported severity, CVSS, then affected repository count.
- `sort=fixable`: filter to advisories with a recorded fixed version for at least one occurrence, then order by repository count, severity and CVSS.

Ties use occurrence count and stable advisory key. Filtering and ranking happen across the whole owner-scoped batch before pagination. These are factual sort orders, not exploitability or exposure scores. Fix availability is partial when only some installed versions have recorded fixes. The evidence drawer retains exact versions, manifests, source links and unknown exposure.

Coverage recovery (`view=coverage&recovery=needed`) filters to reports with recorded gaps, including Blocked reports. All reports remain available through the scope control. Each row provides guidance for its recorded gap, additional recovery actions, and manifest/omission evidence. Missing omission reasons remain unknown. The manifest disclosure shows the scanned commit and a bounded list; the original report retains full evidence. Failed scans remain separate in Batch process.

These views only read existing reports. They do not change repositories, create repair PRs, submit scans, refresh advisories, reserve allowance, or claim that following guidance has recovered coverage. Authenticated workspace and owner filters and the public-demo refusal remain in place. No schema migration is required.

Browser screenshots use the existing explicitly synthetic fixture; they are not evidence of live batch results.
