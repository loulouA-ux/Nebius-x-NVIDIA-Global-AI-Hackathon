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

## Finding PH3-01: scanner-linked advisory can carry the wrong package label

`src/lib/research-evidence.ts:75-84` creates a Tavily research card for an OSV advisory URL absent from search results, but fills its `package` and `version` from *all first-three dependencies*. `src/app/page.tsx:572-577` presents that combined label beside the single advisory. With a multi-package manifest, the card can imply that unrelated packages match the advisory. A search result already linked to the advisory can also retain the package label of the search that returned it, without checking the OSV finding's package. The underlying OSV finding still has its own exact package/version evidence.

**Owner:** Peter's research/evidence module. Bind each scanner-linked advisory card to the finding that supplied its URL, or omit package/version on that card until an exact association is known. Keep search-only cards labelled unconfirmed. Recheck the report display after the change.

## Remaining Phase 3 acceptance

1. Review one labelled synthetic hosted report with OSV, host checks, Tavily and Nemotron present. For each finding and model sentence, record the supporting code observation or returned source URL/date; flag unsupported or stronger-than-evidence wording. Do not use private credentials or a customer target in the record.
2. Refresh this audit against the new integration commit and obtain joint acknowledgement before marking the Phase 3 gate complete.

## Separate pre-merge follow-up

Peter is triaging the direct decision API findings already sent in ATR: empty dismissal reason and malformed scan IDs returning a generic service error. Confirm server behaviour before the full integration PR is considered for merge. The malformed-ID response is an API quality issue, not a Phase 3 evidence-audit exit criterion. The effect of merging `main` on Vercel Production also needs confirmation before a merge decision; it is a release gate, not a Phase 3 gate.

The later desktop/mobile/keyboard member journey and public release review belong to Phase 4. The clean-browser submission check belongs to Phase 5.
