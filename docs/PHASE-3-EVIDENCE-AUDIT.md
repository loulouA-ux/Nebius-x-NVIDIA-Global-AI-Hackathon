# Phase 3 report evidence audit

Louise review, 24 October 2026. Baseline: `c12fa90` on `codex/peter-integration` (draft PR #1). This is a source and report-generation review, not sign-off on the protected preview or a public release.

The project plan's joint Phase 3 check is that every reported claim maps to scanner evidence or a returned source. The implementation has the following traceable paths:

| Report content | Origin and boundary | Status |
| --- | --- | --- |
| Credential-pattern and demo configuration findings | `scanFiles` records a file/line or file setting and masks matched values. The demo uses synthetic inputs. | Traceable in code. A pattern match does not establish credential validity. |
| Demo dependency finding | `snapshotFindings` matches an exact lodash version against the dated single-advisory fixture and links the OSV record. | Traceable, with snapshot coverage disclosed. |
| Live dependency findings | `queryOsv` sends exact ecosystem/name/version queries, rejects partial batches, fetches each returned advisory and links its OSV URL. | Traceable. Live severity stays at review level. |
| Passive host findings | `scanVerifiedHost` records the exact checked HTTPS path and an observation derived from response headers or the fixed security.txt body. | Traceable as configuration reviews, not exploitability claims. |
| Tavily research cards | Search or extracted text retains URL, retrieval time, optional publication date and a watch or scanner-matched label. Research does not change the verdict. | Provenance is displayed, subject to the package-label issue below. |
| Nemotron notes | The model receives existing findings and limited unconfirmed sources. Validation requires one note per supplied finding ID and rejects URLs/advisory IDs, while the UI marks notes as AI-generated. | **Needs a human evidence check on the actual synthetic hosted report.** The schema does not establish that each sentence is entailed by the displayed evidence. |

## Independent offline-demo claim check

The fixed demo input in `src/lib/pipeline.ts:9-25` contains a lockfile entry for `lodash@4.17.20`, a synthetic credential pattern and `productionBrowserSourceMaps: true`. The reported claims map as follows:

| Displayed claim | Direct support | Limit shown to the user |
| --- | --- | --- |
| Two high findings require attention | One pattern match in `scanFiles` and one `lodash@4.17.20` match in `snapshotFindings`; `verdict` counts high findings as blocked. | The credential is synthetic; pattern matching does not prove validity. |
| Lodash advisory | The pinned OSV fixture `GHSA-35jh-r3h4-6jhm` and the exact lockfile version; finding evidence links to the advisory and carries the snapshot retrieval date. | Demo describes this as one dated snapshot, not a live full OSV query or confirmed application exploitability. |
| Production source-map review | The fixed `next.config.ts` text contains `productionBrowserSourceMaps: true`; `scanFiles` records that setting as code evidence. | It is a review finding, not proof of exposed secrets. |
| No patch or target-system change | `runScan` reads fixed strings and creates a report; the UI states that resolution requires independent verification. | Demo decisions are temporary and do not persist. |

This completes the **source-level offline-demo mapping**. It does not substitute for reviewing a real hosted report containing live provider output.

## Historical hosted synthetic report review

Peter delivered a sanitized report from the protected preview at code `23711d4` through ATR messages 84–86. The three chunks reconstructed to the stated SHA-256 (`d7525e53b6cbeb08c93add4ec70e7510cf4a160eceeb09c4e384454844f43c51`). The report has one exact `lodash@4.17.20` dependency, ten review-level findings, ten Nemotron notes, five source cards and ten completed coverage checks. This historical, one-package sample cannot validate PH3-01 or later code changes. The sanitized report itself remains outside Git.

All five OSV finding descriptions point to the matched advisory and exact package/version; all five passive-host finding descriptions state the observed root/header/cookie/CORS configuration without claiming exploitability. The `Review required` verdict follows the recorded policy: no high findings and no incomplete checks. The source cards retain retrieval dates; publication dates are unknown. Three search-only issue cards remain unconfirmed context and do not change the verdict.

The following **model sentences exceed the displayed evidence** in this sample:

| Finding | Unsupported step in Nemotron note | Evidence-safe boundary |
| --- | --- | --- |
| 1, lodash ReDoS | Calls the mechanism “exponential backtracking”; the linked excerpt establishes ReDoS through named functions, not that mechanism. | State the reported ReDoS and affected version without a mechanism claim. |
| 2, lodash command injection | Says “arbitrary shell commands”; the linked advisory excerpt says command injection via `template` but does not establish shell execution. | Use the advisory's narrower wording. |
| 6, HSTS | Infers host-wide lack of HSTS enforcement from one root response without the header. | State that the checked root response lacked the header. |
| 7, CSP | Infers that the whole page has no CSP mitigation from one missing response header. | State that no CSP response header was observed on the checked root response; other paths or a meta policy were not assessed. |
| 8, MIME sniffing | Generalizes a missing root `X-Content-Type-Options` header to other resources. | Limit the observation to the checked response. |
| 9, cookie flags | Infers potential theft from missing flags without knowing cookie purpose or authentication use. | Report the one cookie's missing flags and need for review. |
| 10, wildcard CORS | Says the header permits any origin to make cross-origin requests. CORS controls browser response access, and only one root OPTIONS response was inspected. | State the observed `Access-Control-Allow-Origin: *` on that OPTIONS response; do not infer actual authenticated data exposure. |

Notes 3–5 stay within the linked OSV advisory excerpts at this level of review. The UI's “AI-generated explanation” warning is helpful but does not satisfy the plan's every-claim-to-evidence checkpoint for the seven stronger statements. Peter owns the model adapter/guardrails; the draft needs a corrected synthetic report or a safe fallback that does not publish unsupported model prose before the joint Phase 3 gate can close.

## Finding PH3-01: scanner-linked advisory can carry the wrong package label

`src/lib/research-evidence.ts:75-84` creates a Tavily research card for an OSV advisory URL absent from search results, but fills its `package` and `version` from *all first-three dependencies*. `src/app/page.tsx:572-577` presents that combined label beside the single advisory. With a multi-package manifest, the card can imply that unrelated packages match the advisory. A search result already linked to the advisory can also retain the package label of the search that returned it, without checking the OSV finding's package. The underlying OSV finding still has its own exact package/version evidence.

**Owner:** Peter's research/evidence module. Bind each scanner-linked advisory card to the finding that supplied its URL, or omit package/version on that card until an exact association is known. Keep search-only cards labelled unconfirmed. Recheck the report display after the change.

## Remaining Phase 3 acceptance

1. Review one labelled synthetic hosted report with OSV, host checks, Tavily and Nemotron present. For each finding and model sentence, record the supporting code observation or returned source URL/date; flag unsupported or stronger-than-evidence wording. Do not use private credentials or a customer target in the record.
2. Refresh this audit against the new integration commit and obtain joint acknowledgement before marking the Phase 3 gate complete.

## Separate pre-merge follow-up

Peter is triaging the direct decision API findings already sent in ATR: empty dismissal reason and malformed scan IDs returning a generic service error. Confirm server behaviour before the full integration PR is considered for merge. The malformed-ID response is an API quality issue, not a Phase 3 evidence-audit exit criterion. The effect of merging `main` on Vercel Production also needs confirmation before a merge decision; it is a release gate, not a Phase 3 gate.

The later desktop/mobile/keyboard member journey and public release review belong to Phase 4. The clean-browser submission check belongs to Phase 5.
