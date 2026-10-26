# ShipCheck design handoff integration

Target: the approved 26 October handoff in `shipcheck-design-handoff/README.md` and its desktop/mobile screen references. Changes remain local to `codex/branded-dashboard`.

## Acceptance ledger

- Shared dark palette, Geist/Geist Mono, teal focus and links, white primary controls: inspect screenshots.
- Public landing, reports index, scan, hosts, sign-in, report/finding and repair paths: browser navigation/reload tests.
- Existing query links, Back/Forward, evidence previews and decision controls: full browser regression suite.
- Actual recorded/offline values; no invented severity/CVSS, provider progress, saved counts or runnable agent tooling: inspect fixture-backed UI and source mapping.
- Existing identity, owner isolation, approval and sandbox safeguards: unit suite and browser repair tests.
- Desktop/mobile screen fit: screenshot and document-width assertions.
- Production build and TypeScript: command exit status.

## Deliberate differences from illustrative screens

Recorded evidence currently has five Unrated findings and seven checks. Saved-report summary responses do not include findings or coverage counts, so rows invite opening the report instead of inventing values. Progress remains queued/elapsed because the API does not stream stage completion. No cancellation control claims to stop server work. MCP/CLI/library interfaces are explicitly planned. Full excerpts remain in source preview dialogs. Sign-in retains the existing individual-key fallback and preview-membership limits.

## Verification

Verified locally on 26 October 2026:
- `npm run typecheck`: passed. `npm run build`: passed, including TypeScript and all new routes.
- `npm test`: 203 tests passed in 22 files.
- `npm run test:e2e`: 40 tests passed. This includes the 38 retained regression checks and two new desktop/mobile clean-route journeys. Legacy tests now enter through `/?view=overview`; their security and evidence assertions remain intact. The return-from-repair test uses the Report breadcrumb and canonical URL.
- 16 screenshots captured across eight screens at 1440 and 390 pixels. The 14 page-width checks passed; finding fit is also covered by browser tests.
- Seven principal token contrast pairs passed 4.5:1 (see `contrast-checks.json`). This is a token check, not a claim of full WCAG certification.
- `git diff --check`: passed.

Browser repair checks use intercepted synthetic responses; no cloud sandbox, provider call, GitHub write, deployment or fresh OAuth authorization was performed for this design task. Screenshots are anonymous synthetic/demo evidence, with no credentials. Existing full-flow browser tests verify loading, errors, review decisions, approval and uncertain-publication recovery.

Preview: http://127.0.0.1:3162/ — local production build. Nothing pushed or deployed.
