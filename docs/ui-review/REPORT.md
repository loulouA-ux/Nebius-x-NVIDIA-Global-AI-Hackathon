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
