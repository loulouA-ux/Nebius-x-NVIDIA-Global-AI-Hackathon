# ShipCheck integration status — 23 October 2026

## Completed and observed

- Vercel HeySalad Inc / shipcheck is connected to GitHub; protected previews deploy. Production credentials/public release are separate.
- Dedicated Neon is connected to Development/Preview. Existing and default compute are 0.25 CU with five-minute autosuspend. £15 budget is not an enforced cap.
- Distinct Peter and Louise key hashes are configured. Raw member keys remain only in ignored private local files; Louise still needs private delivery from Peter.
- Live Development Tavily Search and Nebius NVIDIA Nemotron smoke passed. Model: nvidia/nemotron-3-super-120b-a12b.
- Hosted acceptance on commit 8885cb5 passed login/logout for both members, secure cookies, anonymous demo, anonymous live denial, project create/list/challenge rotation, cross-member isolation, live providers, saved scans and immutable review decisions.
- Louise's Phase 1 branch c8c80c8 is integrated, including DNS/file proof and per-scan proof recheck. Expired proof requires a refreshed challenge and new publication.

## Current integration additions

- Tavily extracts up to two scanner-linked or search-selected advisory-authority pages; 24-hour database cache retains original retrieval dates. Live extraction of two OSV-linked pages and cache readback passed. Search snippets stay explicitly unconfirmed.
- Missing/duplicate model explanations fail validation; only supplied finding IDs accepted, with an explicit 12-finding coverage limit.
- Member UI exposes saved reports, sign-out and append-only acknowledge/dismiss decisions. Original verdict remains unchanged.
- Passive host module uses Louise's pinned HTTPS fetch helper for exactly four fixed requests: GET /, GET /robots.txt, GET /.well-known/security.txt, OPTIONS /. It does not follow redirects, retain bodies or cookie values, execute scripts, authenticate to targets, enumerate paths, exploit vulnerabilities or apply patches.
- Host findings are configuration reviews, not exploitability claims. Failed/incomplete requests cannot become a passing assessment.
- Protected preview acceptance at code commit `23711d4` passed all four real passive host checks, OSV, Tavily search/extraction and Nemotron explanation coverage. Target: dedicated synthetic Cloudflare Worker; no customer target was scanned.
- Local validation: 81 unit/integration tests, six browser tests, typecheck and production build passed. GitHub CI passed.
- Fixed Node 22 pinned DNS lookup array handling while retaining TLS hostname verification; regression tests cover array lookup, redirects, size limits and TLS options.
- Verified preview: https://shipcheck-6v2ykt8yg-hey-salad-inc.vercel.app/

## Remaining release gates

- Independent partner review of the integrated changes; draft PR #1 targets main and remains unmerged.
- Private delivery of Louise's member key and her successful sign-in.
- Peter chose to keep the protected team preview on 23 October. Public judging access and Production provisioning are deferred; no public release is approved.
- Integrate reviewed code into the submission branch (main is not yet the submitted product).
- Final labelled benchmark/demo rehearsal, recording, approved Devpost narrative and human submission. A submission draft and recording outline are in SUBMISSION-DRAFT.md; no video or submission is complete.

The API smoke script retains labelled synthetic acceptance projects/reports for review. Test credentials, session cookies and API response files are never committed; temporary request files are removed after checks.

## Phase 3 remediation — 24 October 2026

- API validation fixes are on 5ad047f and Louise reports both findings resolved.
- Model notes now use an exact per-finding allowlist of scanner-authored descriptions/actions. Nemotron selects a note; it cannot add free-form claims. Unsupported wording is replaced with a labelled scanner fallback and model coverage becomes incomplete. Invalid identity/schema/reference output remains rejected. Legacy saved notes without provenance are displayed using the scanner description, not their old model prose.
- Advisory sources receive structured dependencies from OSV finding evidence. Search-query package/version labels are removed from matched advisory cards; multiple exact associations remain separate tuples. Unknown attribution is explicitly unavailable. Search-only cards label their package as search context. A versioned cache key avoids old attribution entries.
- Regression checks cover all seven audited model overstatements, cross-finding note substitution, multi-package and shared-advisory associations, wrong search labels and missing attribution.
- Local gate: 126 tests, build/typecheck and six browser tests passed. Fresh hosted acceptance and Louise’s joint audit remain pending at this entry; no claim that Phase 3 is closed.
