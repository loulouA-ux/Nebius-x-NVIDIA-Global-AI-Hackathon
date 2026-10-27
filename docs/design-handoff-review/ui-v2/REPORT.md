# ShipTested UI v2 — sailing journey

27 Oct 2026 · Europe/London. Branch `codex/branded-dashboard`. Baseline `6d1967f`.

The UI is ready for **protected preview review**, not a claim that all live stage-streaming behavior in the brief is implemented. Production was not deployed; nothing was pushed and no Vercel settings were changed.

## Preview

Ready: https://shipcheck-c61v7w5bm-hey-salad-inc.vercel.app
Deployment: dpl_BGbNhQvD7RvrXZyRDD8WxyRuqGGG (preview target, not production).

Authorized Vercel CLI checks: landing/report200, live scan and sign-in403, unknown page404, demo health200; all six passed. Unauthenticated access returns302 to protection. See preview-smoke.json. Hosted browser screenshot saved as preview-browser.png.

## Built

- Full-width SVG voyage leads the landing, with separate phone geometry, recorded-result moments, evidence-derived verdict/fix version, once-per-session replay and an SSR final frame.
- Four self-hosted font families, new dark/light semantic tokens, static complete header mark, larger report counts, compact provenance chip, mobile report actions, one wrapping findings toolbar, full navigation and source previews.
- Clean quiet-state marks; repair imagery responds to returned verification evidence. Failed tests never raise the flag. Explicit review/approval remains required.
- Branded public-demo access response preserves HTTP403. API refusals, nonce CSP/security headers, deterministic verdict rules and unconfirmed research labels remain intact. No CSP policy relaxation; the gated HTML uses the existing request nonce.
- Design system: root DESIGN.md plus .impeccable/design.json.

## Verification

|Check|Result|
|---|---|
|Build + TypeScript|Pass, isolated mirror without .env/private files|
|Unit suite|254 passed /32 files|
|Main Playwright suite|59 passed|
|Public-demo Playwright suite|14 passed|
|Smoke script, local production build|7/7 passed|
|Axe,8 routes ×2 themes ×2 sizes|Zero serious/critical issues in32 captures|
|Horizontal overflow /h1 /reduced motion|32/32 fit, one h1, zero settled animations|
|Hero|No-JS final frame, once/session/replay, event-derived moments, reduced motion tests pass|
|Logo|Visible brackets/tick both themes; filters none at1440/1024/390/360;8 SVG assets hash-match handoff|
|Repair|Runner command exit codes recognized; failed flag absent; approval remains gated. Synthetic verified/failed UI captures, not live executions|
|Contrast|All48 semantic text/background pairs ≥4.5, see CONTRAST.md|
|Scene budget|6,747 bytes gzipped for isolated minified JS+CSS;15,360-byte budget|
|All production JS/CSS chunks|265,607→279,601 gzip bytes;delta13,994; excludes fonts, includes shared app changes|
|Independent design review|SHIP for UI preview review; repair streaming/counts remain documented gaps|

### Lighthouse

Chrome headless shell, desktop/mobile. JSON and summary in `lighthouse/`.

|Route|Desktop P/A/BP|Mobile P/A/BP|
|---|---|---|
|Landing|100/100/100|95/100/100|
|Recorded report|100/100/96|95/100/96|
|Actual404|Unscored|Unscored|

Lighthouse refuses the real404 with `ERRORED_DOCUMENT_REQUEST`. Its command exits1; this is **not** counted as a pass. The404 is separately captured, axe-checked, keyboard navigable and preserves HTTP404. No artificial200 was substituted to obtain a score. Layout-shift/long-task measurements remain in the raw audits; this report does not claim exhaustive animation tracing.

## Evidence

- `before-*`32 screenshots from baseline6d1967f; `after-*`32 matching screenshots at1440×900 and390×844, both themes. Additional1280 landing captures in each theme. Full-page captures retain viewport dimensions; fixed bottom tabs appear at their viewport position.
- `after-audit.json` contains actual geometry, h1 count, animation count and serious/critical axe findings per page. Member routes use explicitly mocked session/data requests in a local member-mode build; public deployment still refuses those routes.
- `repair-verified-fixture-final.png`, `repair-failed-fixture-final.png`, `scan-waiting-fixture-final.png`: synthetic browser network fixtures only.
- `recordings/hero-voyage.mp4` and WebM;404 mark;report interactions;slow scan response fixture;repair sea-trial fixture. No sandbox expenditure, provider calls or PR mutations for these captures.
- `TOKENS.md`, `CONTRAST.md`, `bundle.json`, `logo-hashes.json`; before/after contact sheets.

## Decisions, deviations and remaining work

1. **No invented counts.** The reference's412 packages,4 sources and48/48 tests are illustrative. The real capture has1 resolved dependency,5 advisory findings,5 sources,5 explanations. The highest shared candidate fix is4.18.0 from the current captured advisory metadata; it is not hard-coded4.17.21. Secret check copy says supported patterns checked, without inventing masked-value counts.
2. **Live scan stage stream is absent.** The API returns one report. The boat waits at the start with a truthful queued log; a deliberately slow API response demonstrates no false travel. The component accepts real stage events and derives contiguous completion/failure, but the requested slow-stage ping/moment recording cannot be a live stage recording until a backend event stream exists. No timer-based pretend progress was added.
3. **Repair stage stream/counts are absent.** The API returns completed evidence, not four independent event updates. Patch/flag animations occur on a newly returned result. Runner output supplies test-command exit codes, not normalized individual test counts. Exact48/48 counters, per-step repair pills and full staged sea-trial choreography are deferred. Synthetic before/after success/failure captures prove UI gating only.
4. **Existing accessible full-page finding/evidence view retained.** Back restores report context. It was not replaced with a new drawer merely to demonstrate a drawer animation. CSV/source dialogs remain available. Replay uses a focused dialog on desktop and bottom sheet on phones.
5. **Motion is restrained.** Quiet notes fade instead of clip-path drawing, following the transform/opacity-only constraint. The filter uses selected-button styling rather than an animated sliding indicator. No arrival sweep runs indefinitely after the hero stops. The special fog/incomplete sketch and phone sticky repair-approval bar remain refinements; existing incomplete explanation and approval controls remain truthful and usable.
6. **Public access403 is script-free HTML.** It uses the same palette, clean mark,44px action and system font fallback; it does not load next/font or an animation runtime. A route handler is required because an App Router page rewrite lost the403 status; tests caught and fixed that regression.
7. **No optional Rive.** `public/motion/shiptested-voyage.riv` is absent. No Rive dependency/wasm, CSP change or size cost introduced.
8. **Reference inspection:** file:// reference opening was rejected by browser policy. Reference HTML/SVG/timing markup was read from disk; no workaround URL was used. Impeccable context and detector commands each failed once with permission denied; direct source/reference review and independent review were used, without claiming those commands passed.
9. **Limits:** no claim of real-device phone performance, every possible touch target, zero animation-caused long tasks, or production verification. Actual404 Lighthouse score remains unavailable. Full functional brief closure requires the live scan/repair event contracts above.

## Local section commits

1. ed81add — typography
2. 26dc187 — theme tokens
3. f3d4555 — voyage and landing
4. 5466f74 — event-derived moments
5. 761ab36 — report/navigation
6. 4c816dc — quiet marks
7. 29efcdd — motion/repair states
8. 472a99e — copy/responsive providers
9. 2f3b52e — Gate A Lighthouse checks
10. This report's commit — verification fixes, tests, captures and documentation.

## Next checklist

1. Open the protected preview and run the smoke checks with authorized preview access.
2. Peter reviews the hero on a real phone; production promotion is a separate decision.
3. Optional: add `public/motion/shiptested-voyage.riv`, then follow section6's lazy/self-hosted path.
4. Complete backend stage streaming and remaining UI refinements; then CLI/MCP Phase4, Parts3–5 of the separate prompt.
5. Push the branch when approved so the public hackathon repository is current before 30 Oct 2026, 17:00 London.
