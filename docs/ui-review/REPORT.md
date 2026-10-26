# ShipCheck UI overhaul

Baseline 26 October 2026: typecheck passed; 203 unit tests (22 files), production build and 32 browser tests passed. Original HEAD 5a24d0c. No push, PR, deployment or branch switch.

## Phase 1
ShipCheck identity; neutral signed-out workspace; actual GitHub login fetched from authenticated session. Removed marketing footer and preview badge. One header tagline.

## Phase 2
Captured real synthetic-manifest run at 2026-10-26 09:08 London on a7a49c7, model nvidia/nemotron-3-super-120b-a12b, us-central1. Five findings and five sources; exact recorded notes, dates and excerpts retained. Capture refuses incomplete inference evidence and credential values. Configuration endpoint exposes booleans only. Phase checks: typecheck/build, 203 unit and 32 browser tests passed.

## Phase 3
Single empty-state card and default recorded demo; explicit offline alternative. Compact demo identity strip. Removed hero, decorative diagram, workflow cards and repeated feature blurbs. Typecheck/build, 203 unit and 32 browser tests passed. Recent-scan presentation will be completed with state extraction.

## Phase 4 — unified report
Verdict presentation maps policy without altering it; review severity is Unrated with a human-review flag. Coverage counts every actual check state (live runs may have more than six checks). One report replaces three views, with severity chips and advanced filters only above eight findings. CSV and evidence previews remain keyboard accessible. Desktop findings use a modal side drawer; mobile uses a full view. Removed chart, Quick view and bounded findings scroll. Typecheck, 203 unit tests, build and all 32 browser tests pass. Nested source-dialog Escape now closes only that dialog. Responsive geometry checks wait for the drawer-to-page transition.

## Phase 5 — finding detail
Extracted reusable finding detail. The exact matching OSV snapshot supplies advisory ID, CVE aliases, CVSS vector, CWE, affected ranges and fixed-version change chip. No metadata is inferred for other live advisories; those fields remain absent when not stored. Prepare repair is primary; demo decision controls are disabled with sign-in guidance. Validated Nemotron selection is explicitly labelled verbatim. External source links carry an external icon. All 203 unit and 32 browser tests, typecheck and build pass.

## Phase 6 — restorable navigation
Stable demo-offline and demo-recorded URLs reload through the fixture endpoint; legacy findings/actions links normalize to overview. Missing/inaccessible reports show a dedicated recovery state. Top-level breadcrumb removed and footer simplified. Added two browser tests for deep-link reload and unavailable recovery. Storage test now explicitly assigns a member-scan UUID to its synthetic storage fixture (demo IDs are not persisted). All 203 unit tests and 34 browser tests, typecheck and build pass.

## Phase 7 — scan input and honest progress
New scan extracted to its own view, with AI/staging choices above compact input, upload/drop and format override. UTF-8 byte size and parsed package limit are checked before sending. Scan action is sticky; staging badge is on its own line. Progress shows six queued checks and a real elapsed timer, not simulated completions. Added upload/limit test; anonymous safety assertion now also calls the API directly with malformed input, while the browser submits a valid manifest through new client validation. Typecheck, 203 unit tests, build and 35 browser tests pass.

## Phase 8 — repair workflow
Four-step stateful progress, real line diff, execution table with expandable output, before/after advisory counts and collapsed lockfile hashes. Audit remains read-only with export, UTC timestamps and collapsed evidence, now a timeline. Removed inline repair-page styles and scan-specific sign-in error copy. Proposal/approval disable reasons added; busy actions share the visible running status. No recorded completed repair fixture is present, so the empty walkthrough says sign in to start rather than fabricating a run. Failure, cleanup and uncertain-publication safeguards are retained. Typecheck, 203 unit tests, build and 35 browser tests pass, including exact approval, no-repeat and reconciliation tests.

## Phase 9 — tokens and visual cleanup
Consolidated duplicate selector blocks by cascade context and grouped responsive conditions. Removed abandoned chart CSS and old hero/demo decorations. Brand has one teal definition; blue remains interactive. Review is neutral outline, with distinct verdict colours. Raised sub-12px metadata and sub-14px body styling. Added light/dark surface, canvas and text tokens. Initial computed contrast inspection found dark sidebar surfaces still light; those now use canvas tokens. Typecheck, 203 unit tests, build and 35 browser tests pass. Final viewport/contrast inventory follows below.

## Phase 10 — components and final browser review
Extracted all requested views, verdict/table components and the 66-line routing hook. Recent scans reuse member history. Drawer Escape restores row focus. Screenshot review corrected mobile label overlap and an action hidden by bottom navigation; regression tests now enforce ≤80px rows and a real hit-test on Scan. Shared pluralisation covers report/CSV/evidence and repairs. Final typecheck, 203 unit tests, build and 38 browser tests pass.
