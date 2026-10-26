# ShipCheck UI rebuild review

26 October 2026 · Europe/London · `codex/branded-dashboard`.

**Latest update:** `3d0ae88` implements the revised theme brief: light/dark mode, theme-aware official logos and “Check before you ship.” hero. See [theme review](../design-handoff-review/THEME-REPORT.md) for 12 new screenshots, 68 contrast checks and final verification (206 unit, 50 main browser, 1 public-demo browser test; typecheck/build pass). The detailed rebuild review below records the preceding dark-only milestone; its explicit remaining limitations are unchanged.

Implemented and tested locally against the final master prompt. The actual starting commit was `1edc9f5`, newer than the prompt's `5a24d0c`; existing work was preserved. The new approved dark-logo instruction supersedes the earlier white-tile instruction. Nothing was pushed or deployed. This is not a claim of pixel-perfect approval or new hosted acceptance.

## Commits, in order

1. `1b05e72` Phase 1: consolidate dark styles and self-host Geist fonts
2. `b72dfed` Phase 2: expose captured Nemotron model and provider configuration
3. `e5ee1e8` Phase 3: canonical redirects, full-page findings and direct mobile tabs
4. `7f2c2f0` Phase 4: approved dark hero marks and accurate sign-in disclosure
5. `b9544ea` Phase 5: evidence-backed report summary cards and saved counts
6. `411c2a4` Phase 6: finding pagination and before-after repair evidence
7. `712ac67` Phase 7: manifest confirmation, honest progress cancellation and host proof controls
8. `6a566a4` Phase 8: enforce replay-only demo mode and verify responsive navigation

The following documentation commit contains this report, screenshots and audit JSON.

## Test results

| Check | Before | Final |
|---|---:|---:|
| Typecheck | Pass | Pass |
| Unit tests | 203, 22 files | 206, 23 files |
| Production build | Pass | Pass |
| Main Playwright suite | 44 | 47 |
| Public-demo running-server suite | Not present | 1 |
| Skipped tests | 0 | 0 |

Three new unit tests cover 19 direct API handlers, replay-only proxy routing and flag-off behavior. Browser additions cover canonical routes/new tabs, direct mobile tabs and hidden desktop table headings on phones. Existing browser tests were updated from old query navigation, desktop drawers and More menus to real routes, full-page findings and four direct tabs. Fixture entry now starts at `/scan`; saved-history checks use the visible phone account controls. No repair approval, authorization, evidence, quota, SSRF or reconciliation assertion was weakened. The mobile row-height bound remains 80px; common rows are approximately 64px. All changed tests ran successfully.

Screenshot review exposed a phone table-header cascade bug; fixed before final capture. All 50 route/width checks pass at 1440, 1024, 768, 390 and 360px. See `final-viewport-checks.json`. Eleven views are captured at 1440×900 and 390×844, with full-page output where content extends below the viewport, plus four logo-strip captures. `final-*.png` are current; older screenshots remain historical.

Keyboard activation verified landing → recorded report → finding → Back → finding → Prepare tested repair → reports. Navigation focuses H1. This targeted keyboard check uses focused links and Enter; existing browser tests separately cover Tab/skip link, dialog Escape, focus return, reload and Back/Forward. It is not a full assistive-technology certification.

## Item outcomes

Fixed means implemented and locally checked. Partly fixed identifies an explicit remaining difference.

### Phase 1 — identity, tokens and shell

- **Fixed:** ShipCheck UI/title/metadata/README name; former Agent Shielda name retained once in README only.
- **Fixed:** Demo workspace when signed out; authenticated GitHub login when available, otherwise actual actor ID rather than a fabricated identity.
- **Fixed:** Protected-preview badge and sidebar marketing footer removed; actual deployment protection unchanged. Landing footer carries ShipCheck/by HeySalad/MIT.
- **Fixed:** Accurate GitHub sign-in wording, preserving individual-key fallback.
- **Fixed:** Central dark tokens, one `--brand` definition, Geist and Geist Mono through `next/font/google`; old light root theme removed.
- **Partly fixed:** globals.css is reduced to tokens/base; component modules exist, but workspace-styles.module.css still uses compatibility `:global` selectors and responsive overrides. Fully isolated per-component styles are not complete.
- **Fixed:** White primary action treatment; teal navigation/focus, semantic severity tags and provider stand-in icons.
- **Fixed:** Desktop sidebar order/account placement and phone top bar/four direct bottom tabs; matching Lucide icons.
- **Partly fixed:** Shell matches the major hierarchy, but this is not a pixel-level reproduction of every mockup spacing value or the exact requested flex declaration.

### Phase 2 — actual sponsor evidence

- **Fixed:** Existing genuine recorded live fixture is reused unchanged; no duplicate paid capture or invented replacement.
- **Fixed:** Model, capture time, endpoint region, commit and existing source evidence are retained; replay makes no fresh provider calls.
- **Fixed:** Availability endpoint, missing-capture state, documented capture script, recorded default and offline fallback.
- **Fixed:** Banner identifies captured run, actual model and replay/no-live-requests status.
- **Fixed:** AI triage displays configuration booleans with in-app icons; default enabled when both providers are configured. Presence is explicitly not a health check.

### Phase 3 — routes and state

- **Fixed:** Landing `/`, reports `/reports`, canonical report/finding, scan, host, repair and sign-in routes; old view URLs redirect.
- **Fixed:** Stable `demo-recorded` and `demo-offline` fixture reconstruction; legacy offline POST also returns stable offline identity/time.
- **Fixed:** Saved member reports load server-side; no report contents persisted in browser storage.
- **Fixed:** Route-specific unavailable states explain unsaved/no-access possibilities honestly.
- **Fixed:** Real whole-row anchors support new tabs, reload and Back/Forward; full-page findings replace desktop drawer routing.
- **Fixed:** Breadcrumbs on report/finding/repair; active navigation, H1 focus and root-page split into components/routes.

### Phase 4 — landing and sign-in

- **Fixed:** Header anchors, requested hero heading, CTA pair, browser-frame preview, three steps, AI/rules explanation, agent section, final CTA and footer.
- **Fixed:** Real fixture counts in preview; no invented security scores or outcomes.
- **Fixed:** Official dark marks only in Powered by hero, unfiltered and without tiles; original colors/clear space/alt text. SHA-256 comparisons all match handoff files in `final-logo-hashes.json`.
- **Fixed:** Powered by row fits above 900px at 1440px width; phone marks stack without horizontal overflow.
- **Fixed:** IN DEVELOPMENT badge remains; no claim that packages ship.
- **Fixed:** GitHub OAuth disclosure reflects `read:user`; repository App installation is separate. Demo fallback follows availability.
- **Partly fixed:** Intentional copy differences: replay wording replaces an unsupported “~10s” promise; only hero CTA is primary to satisfy the one-primary rule. The access-key fallback remains visible for existing members.

### Phase 5 — reports and vocabulary

- **Fixed:** Reports search/verdict filtering, mobile chips, demo labels, member saved scans and no-saved-scan state.
- **Fixed:** Saved finding/coverage counts now come from stored report JSON; missing values are not invented.
- **Partly fixed:** Saved report identity/source uses available saved fields; richer project labels require additional stored metadata.
- **Fixed:** Blocked/Needs review/Incomplete/Clear presentation without policy changes. Stored review severity displays Unrated with human-review guidance; no new Low classification invented. CSV shares vocabulary.
- **Fixed:** Replay banner, breadcrumb/tools, three summary cards and coverage totals based on actual checks.
- **Fixed:** Whole finding-row links, advisory IDs, package/file, fix and decision columns; no Quick view or bounded inner findings scroll.
- **Partly fixed:** Numeric CVSS is shown as unavailable when not captured; no fake score. Phone hides desktop columns and truncates long summaries; full text is on the finding page.
- **Fixed:** Tavily sources remain unconfirmed with supplied dates; missing publication dates are not manufactured.
- **Fixed:** Removed separate overview/findings/actions navigation and severity chart; shared plural helper retained.
- **Partly fixed:** General report caveats are consolidated, but authentication, proof, repair approval and verbatim evidence limitations remain in their relevant contexts for safety.

### Phase 6 — findings and repairs

- **Fixed:** Finding count, previous/next links, real severity/advisory identity; available matching OSV metadata only, no synthetic scores or CVEs.
- **Fixed:** Recommended action and supported repair handoff; evidence/path/source link; scanner-quoted model note hidden if absent; exploitability Not assessed.
- **Partly fixed:** Some captured live findings have no structured affected-range/fixed-version/CVSS fields. Those fields remain absent rather than guessed. Exact matching bundled OSV metadata is displayed where available.
- **Fixed:** Members retain decision workflow; demos disable decisions with sign-in explanation.
- **Fixed:** Four repair steps; real diff and collapsed lockfile; before/after command output; actual OSV count comparison and point-in-time caveat.
- **Fixed:** Explicit approval, recovery, reconciliation and no automatic repeat behavior retained; audit UTC/actors/evidence/export unchanged.
- **Fixed:** No inline style attributes in repairs/page.tsx; phone action treatment retained.
- **Partly fixed:** Busy controls use shared adjacent progress/recovery text rather than one repeated reason per button. Screenshots show honest signed-out/unavailable repair states; successful repair rendering is covered by existing clearly synthetic browser tests, not a newly executed cloud repair.

### Phase 7 — scan and hosts

- **Fixed:** Drop/pick/paste supported filenames, preflight 200KB/50-package checks, inline errors and filename/version/count/size confirmation.
- **Fixed:** AI card, verified/unexpired-host selector, hosts link and single Run scan primary action.
- **Fixed:** Real elapsed timer and indeterminate progress with six queued checks. No stage completion is simulated.
- **Fixed:** Cancel waiting aborts the client wait and explicitly warns that server/provider work may continue and save a report. It does not falsely claim server cancellation.
- **Fixed:** Existing host state/proof/expiry validation retained; proof-method choices, server-provided values, copy feedback and challenge/verify controls.
- **Partly fixed:** Proof methods use accessible choice buttons rather than a full ARIA tab implementation; hosted DNS/file verification was not repeated during this presentation change.

### Phase 8 — public demo and polish

- **Fixed:** `SHIPCHECK_PUBLIC_DEMO=1` server/proxy enforcement; only landing, demo index/replays and required assets/health work. Live/auth/host/repository/repair handlers reject before sensitive work.
- **Fixed:** 19 handler tests and running production-server browser test demonstrate refusal; normal flag-off behavior retained.
- **Fixed:** No horizontal document overflow in 50 route/width checks; desktop/mobile screenshots saved.
- **Fixed:** Targeted keyboard journey, canonical new tabs/reload/history and existing modal accessibility tests pass.
- **Partly fixed:** Contrast audit covers 21 principal foreground/background pairs, all ≥4.5:1, not every possible dynamic or disabled state. No handoff token color change was needed. See `final-keyboard-contrast.json`.
- **Partly fixed:** Visual hierarchy is implemented, but exact mockup equivalence and all signed-in state screenshots are not certified. Public blocked-page response is a plain accessible recovery page, not a full branded screen.

### Phase 9 — optional packages

- **Skipped:** Library/CLI extraction, app package migration, CLI exit-code tests, stdio MCP tools and integration setup docs. Required visual review still has explicit partial items; optional extraction must not obscure these. Nothing published; IN DEVELOPMENT stays visible.

## Recorded run provenance

Existing fixture: `fixtures/recorded-live-run.json`. Recorded **2026-10-26T09:08:16.729Z**, model **nvidia/nemotron-3-super-120b-a12b**, region **us-central1**, source commit **a7a49c7a0d4f035ba5d8661f99d6bb300702f0ff**. Five findings, five sources, seven checks (six complete, one not in scope). The offline fixture has six checks. Showing seven actual checks instead of forcing six mockup segments is intentional. No fresh capture was performed for this rebuild; the prior real capture already satisfies the replay requirement.

## Disclaimers before and after

The complete earlier verbatim inventory is preserved in `PREVIOUS-REVIEW.md`, sections “Disclaimer inventory”, “Before” and “After”; it is historical, not a second current completion report. The final rebuild retains these safety meanings:

- Under verdict: “Advisory verdict. ShipCheck does not block deployments.”
- Finding: no code has been changed; review decisions do not resolve the finding or change its verdict.
- In “What this scan covers”: findings do not establish exploitability or guarantee security; no target is changed; repairs require separate verification/approval; research is unconfirmed; absent notes do not imply safety; recorded/snapshot evidence is point-in-time.
- Source previews retain recorded-excerpt/no-external-fetch wording; model notes retain quoted-scanner/fallback basis.
- Replay retains captured/replayed/no-live-request and unsaved-demo-decision labels.
- Authentication, host proof, budget, cleanup, PR approval, reconciliation and audit-integrity notices remain contextual. Removing these would change the safety meaning.
- Added: public-demo refusal message and explicit limitation of Cancel waiting.

The former repeated coverage and deployment caveats were consolidated in the preceding overhaul; this rebuild preserves that work rather than claiming it was newly removed here.

## Remaining risks and review boundaries

- Compatibility CSS still needs a separate maintainability pass for fully isolated modules; mockup fidelity should receive independent review.
- New hosted member/session/database/provider and sandbox runs were not performed. Tests use real stored replay and existing synthetic browser fixtures as labeled; screenshots do not pretend to be authenticated evidence.
- Public mode is built/tested locally, not enabled on any remote deployment. Existing protected-preview decision is unchanged.
- Missing live metadata stays missing; additional capture/schema enrichment is separate work.
- No new runtime dependency was added. Geist is built through the permitted Next font integration.
- No push, PR, merge, publish, deployment or account/access change. No secret file contents were read, printed, copied or committed. Next loaded its normal environment during build/runtime without exposing values. No fabricated model output, scan result, advisory, score or execution evidence. `.impeccable/` and `docs/PHASE-4-BROWSER-CHECK.md` remain untouched/untracked.
