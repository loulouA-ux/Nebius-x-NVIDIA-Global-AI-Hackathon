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
- The fixed offline demo is available on Preview. The separate clean-browser public access check belongs to Phase 5 after release decisions.
- This walkthrough used one synthetic manifest and one member account. It does not establish behavior for arbitrary applications or a verified staging host.
