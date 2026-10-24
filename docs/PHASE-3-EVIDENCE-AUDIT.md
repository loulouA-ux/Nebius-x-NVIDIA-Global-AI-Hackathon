# Phase 3 report evidence audit

**Current result (24 October 2026): Phase 3 claim-to-evidence gate accepted for the delivered synthetic hosted report at `a0fe6d1`, with documentation head `e3e08a7`.** The review below distinguishes that result from the historical report, broader customer-target assurance, Phase 4 walkthrough, and a merge or Production release decision.

Louise review, 24 October 2026. The original source baseline was `c12fa90` on `codex/peter-integration` (draft PR #1); the current remediation review is at `a0fe6d1` with documentation head `e3e08a7`. This is not sign-off on a public release.

The project plan's joint Phase 3 check is that every reported claim maps to scanner evidence or a returned source. The implementation has the following traceable paths:

| Report content | Origin and boundary | Status |
| --- | --- | --- |
| Credential-pattern and demo configuration findings | `scanFiles` records a file/line or file setting and masks matched values. The demo uses synthetic inputs. | Traceable in code. A pattern match does not establish credential validity. |
| Demo dependency finding | `snapshotFindings` matches an exact lodash version against the dated single-advisory fixture and links the OSV record. | Traceable, with snapshot coverage disclosed. |
| Live dependency findings | `queryOsv` sends exact ecosystem/name/version queries, rejects partial batches, fetches each returned advisory and links its OSV URL. | Traceable. Live severity stays at review level. |
| Passive host findings | `scanVerifiedHost` records the exact checked HTTPS path and an observation derived from response headers or the fixed security.txt body. | Traceable as configuration reviews, not exploitability claims. |
| Tavily research cards | Search or extracted text retains URL, retrieval time, optional publication date and a watch or scanner-matched label. Research does not change the verdict. | Provenance is displayed, subject to the package-label issue below. |
| Nemotron notes at the original baseline | The model received existing findings and limited unconfirmed sources. Validation required one note per supplied finding ID and rejected URLs/advisory IDs, while the UI marked notes as AI-generated. | The historical hosted report exposed seven stronger-than-evidence claims; the current remediation and acceptance are recorded below. |

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

Notes 3–5 stay within the linked OSV advisory excerpts at this level of review. The UI's historical “AI-generated explanation” warning did not satisfy the plan's every-claim-to-evidence checkpoint for the seven stronger statements. Peter subsequently changed the model boundary; the fresh report is reviewed below.

## Resolved finding PH3-01: scanner-linked advisory package label

At the original baseline, `src/lib/research-evidence.ts:75-84` created a Tavily research card for an OSV advisory URL absent from search results, but filled its `package` and `version` from *all first-three dependencies*. `src/app/page.tsx:572-577` presented that combined label beside the single advisory. With a multi-package manifest, the card could imply that unrelated packages matched the advisory. A search result already linked to the advisory could also retain the package label of the search that returned it, without checking the OSV finding's package. The underlying OSV finding still had its own exact package/version evidence.

**Owner:** Peter's research/evidence module. The requested remedy was to bind each scanner-linked advisory card to the finding that supplied its URL, or omit package/version until an exact association was known; search-only cards needed an unconfirmed label.

At `a0fe6d1`, OSV evidence carries the exact dependency tuple into `researchWithEvidence`. A matched advisory card uses only tuples attached to that URL; any search-query package/version is removed. Missing association is displayed as unavailable and a versioned cache key avoids earlier card data. The fresh two-package report has `lodash@4.17.20` and `ms@2.1.3`; its two matched advisory cards name only lodash, while the `ms` card remains search context. The code and delivered sample close PH3-01. Multiple associations to one advisory and wrong search labels also have targeted regression cases; those cases are code-level evidence, not separate hosted runs.

## Fresh hosted synthetic report re-audit — accepted

Peter delivered ATR messages 90–93 from protected-preview code `a0fe6d1`. Reconstructing the three gzip/base64 parts gave the stated SHA-256 `1290f6071eb0105d0dd629c2eda5cbbf9ec723967ce382d70fb05ed8e9336516`. The sanitised report stays outside Git. The checksum proves reconstruction of the delivered artifact; hosted execution and sanitisation are Peter's attestation, not an independently repeated request from this checkout.

| Claim area | Evidence checked | Result |
| --- | --- | --- |
| Dependency/advisory findings | Two exact npm pins appear in the report. Each of five OSV findings carries an advisory URL, retrieval time, and exact `lodash@4.17.20` dependency tuple; none asserts application-level exploitability or an inferred severity. `ms@2.1.3` has no OSV finding in this report. | Supported at the stated review level. |
| Passive host findings | Three missing-header reviews, one cookie-flags review, and one wildcard-CORS review each point to the checked synthetic root response or root OPTIONS response and record an observation time. Descriptions limit conclusions to configuration review; cookie purpose and authenticated data access remain untested. | Supported within the checked-response boundary. |
| Research cards | Two extracted scanner-matched OSV cards carry only the exact lodash association. Four search-only cards remain watch context, with URL and retrieval time; publication dates are unknown. Search context does not change the verdict. | PH3-01 resolved in code and in this two-package sample. |
| Nemotron notes | All ten notes have `validated-selection` provenance and exactly equal their own finding's scanner description or action. `validateExplanations` permits only those exact per-finding strings; other prose becomes a labelled scanner fallback and marks model coverage incomplete. The UI suppresses unproven legacy model prose. | The seven earlier overstatements cannot appear through the current model path; zero fallback occurred in this run. |
| Coverage and verdict | All ten checks are complete; all ten findings are review severity. The recorded policy therefore yields `Review required`, with no pass, automated fix, or exploitability claim. | Consistent with evidence and policy. |

This review closes the plan's joint Phase 3 **every reported claim maps to code evidence or a returned source** checkpoint for this labelled synthetic report. The exact-note selection narrows Nemotron's role to choosing scanner-authored wording; it is a product tradeoff, not a claim-to-evidence gap. It remains one structured model call in the scan workflow. The report does not establish behavior for arbitrary customer applications or substitute for the Phase 4 member walkthrough.

## Phase 3 acceptance record

1. Labelled synthetic hosted report with OSV, host checks, Tavily and Nemotron: **reviewed and accepted** as described above.
2. Integration code refresh: **reviewed** at `a0fe6d1` / `e3e08a7`. Peter supplied the remediation and Louise supplied independent acceptance. The joint evidence gate is complete; this does not authorize a merge or deployment.

## Separate pre-merge follow-up

The direct decision API findings (empty dismissal reason and malformed scan IDs) were fixed at `5ad047f` and reviewed separately. The effect of merging `main` on Vercel Production still needs confirmation before a merge decision; it is a release gate, not a Phase 3 gate.

The later desktop/mobile/keyboard member journey and public release review belong to Phase 4. The clean-browser submission check belongs to Phase 5.
