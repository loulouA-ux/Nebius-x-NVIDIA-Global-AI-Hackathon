# Phase 4 — Louise member walkthrough

24 October 2026, 18:02–18:07 London. Protected Vercel Preview at `shipcheck-n96mg3o4l-hey-salad-inc.vercel.app`, deployment of `a0fe6d1`. This is a member journey check, not Production release approval.

## Synthetic journey

1. Louise signed in with her individual member key. The page showed `Signed in as louise` and zero saved scans. No key was recorded here.
2. Ran a manifest-only live scan of the form's synthetic npm lockfile with `lodash@4.17.20`; optional Tavily/Nemotron research remained off and no staging host was selected. Report `d96307c2…` was saved and the selector changed to one report. OSV returned five advisory findings; the report status was `Incomplete` because optional research and model notes were not requested. This status was accurately labelled on screen.
3. Opened the ReDoS finding. The detail showed package/version evidence, the OSV advisory link `GHSA-29mw-wpgm-hmr9`, retrieval date, and a recommended action that did not claim any code change.
4. Recorded an acknowledgement with the note “Phase 4 walkthrough on synthetic lodash fixture; review pending.” The decision appeared in history without changing the report status.
5. Reloaded the page, selected the saved report, reopened the same finding, and confirmed the original acknowledgement and note remained in history.
6. In Chrome's responsive mode at 400 CSS px, the member controls, finding, evidence, review form, buttons and history remained readable and usable. The card fit the viewport without a visible horizontal overflow.
7. By keyboard alone, focused and opened the saved-report selector, moved among report findings, opened the finding with Return, and reached the advisory link, review note and Acknowledge button with Tab. A visible focus ring appeared on the action button.
8. Ran the fixed offline `salad-storefront` demo on Preview. It showed three labelled synthetic findings, including two `Blocked` items, an OSV snapshot date, and incomplete optional-provider coverage. Reloading reset the temporary demo to the welcome screen; the member's one saved live scan remained available.

## Issue found and change proposed

Peter's independent Phase 4 check reported that an expired session could leave the header saying signed in until reload while the API correctly rejected a decision. This branch clears member state and offers a sign-in path when a saved-report, decision, project-action or live-scan request receives HTTP 401. A rejected decision remains unsaved. This change still requires review and deployment before it can be counted as a hosted fix.

## Remaining Phase 4 gates

- Peter P7 owns Production protection, configuration, release security and post-merge deployment acceptance. A Production-ready Vercel build does not establish a public or approved release.
- The fixed offline demo is available on Preview. The plan's Phase 4 checkpoint includes public demo access; Phase 5 repeats a clean-browser check for submission.
- This walkthrough used one synthetic manifest and one member account. It does not establish behavior for arbitrary applications or a verified staging host.

## Follow-up on the current protected Preview — 24 October 2026, 23:18 London

I reviewed draft PR #3 at `8e53fc6` against the Phase 4 plan. Its changes add proof-recheck and provider-failure regression tests, correct a property-order-sensitive assertion in the hosted smoke harness, and record Peter's acceptance evidence. They do not change ShipCheck runtime code. GitHub's two `verify` checks and Vercel Preview Comments check were green for that head when reviewed. Peter's P7 ledger separately records a successful host-inclusive protected-preview run; this Louise follow-up does not claim to have rerun his provider or host test.

In Chrome on protected Preview `shipcheck-eqslt6fs3-hey-salad-inc.vercel.app`, I was signed out of the ShipCheck member session. The offline `salad-storefront` demo ran without member sign-in and showed three synthetic findings, two blockers, the dated single-advisory OSV snapshot, and explicit incomplete live-research/model coverage. The credential detail displayed a masked value (`sk_l••••••00`), and reload returned to the welcome screen. This confirms the seeded offline journey remains usable on the current protected Preview.

An HTTP request without Vercel credentials to both that Preview and `shipcheck-rho.vercel.app` returned 302 to Vercel SSO. The Phase 4 public-demo access checkpoint is therefore still open. Vercel deployment protection and public judging access require a separate release decision; the protected-preview walkthrough, PR review, and Peter's hosted smoke do not count as public access. L4 remains open for that checkpoint. P7 stays open for Peter's independent acceptance decision and can be evaluated separately from public access.

Vercel's recent Request Logs for this Preview showed successful `200` scan and project requests alongside `401` session, `404` cross-owner lookup, and `409` proof-gate responses from the acceptance journey. No `5xx` appeared in the visible 30-minute sample. The Overview error-rate indicator alone does not establish a runtime failure; this log sample does not replace a Production release check.
