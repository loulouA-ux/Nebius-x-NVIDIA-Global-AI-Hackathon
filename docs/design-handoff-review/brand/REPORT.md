# ShipCheck brand implementation

26 October 2026 · `codex/branded-dashboard` · local only.

Code commit **a04ca3f — Apply tick-slash identity, evidence-aware brand copy and motion**. Built on the accepted theme update, without changing verdict, authorization, host-proof or repair-approval policy.

## Implemented

- Inline tick-slash ship mark: compact below 32px, full mark at 32px and above, currentColor ink and accent only on the tick. HTML lockup uses Geist 600. Replaced the old shield mark and its alert-icon use.
- Replaced symbol.svg, logo-compact.svg and favicon.svg with supplied source files; added app-icon.svg and a served web manifest. Asset hashes match the handoff (logo-hashes.json). The supplied app/favicon tile is retained as supplied; inline product marks use the tick-only accent rule.
- Exact supplied landing hero, steps, AI explanation, closing CTA, title, description and OG text; supplied README boilerplate and hackathon summary. New wording does not alter stored advisory excerpts.
- Verdict-specific text uses actual counts and singular/plural grammar; replay provenance, advisory-specific finding summary, recommended-change/no-code-changed wording, Nemotron and Tavily labels, approval disclosure/checkbox, report empty state, file-size error, host-verification success and decision success updated.
- Heading/strong weights capped at 600. Color tokens and both themes retained.
- Motion tokens, global reduced-motion override, bracket/tick intro, loading-only bob, button press, verdict/count reveal, coverage segments, page fade and success toast added. No animation dependency.
- Theme cross-fade uses browser View Transitions with CSS opacity animations. Preference is saved immediately so navigation during the fade cannot restore a stale theme. Unsupported browsers and reduced motion switch immediately.
- Existing full-page finding navigation remains. Drawer entrance/exit CSS is supplied for the existing dormant drawer; it is not newly enabled in the route flow.

## Copy and motion exceptions

1. **Scanning:** no per-stage feed or reliable active project label exists in this UI. It retains “Scan in progress”, the real elapsed timer, one running indicator and queued checks, with the brand timeout/incomplete explanation. No invented Checks x of n counter or stage ticks. Cancel waiting still explicitly does not cancel server work.
2. **Snapshot-only Incomplete:** “n checks used snapshot evidence. Nothing is reported as clean.” avoids falsely calling a completed snapshot a timeout. Actual incomplete checks use the prescribed didn't-finish wording. Two unit tests cover count grammar and this distinction.
3. **Provider errors:** no fabricated 15-second assertion or per-provider Retry action. Existing actual provider-error/coverage handling is preserved; the brand's exact wording requires structured timeout provenance and a dedicated retry capability.
4. **Unsaved report:** retains the more accurate unsaved-or-no-access recovery message. A 404/authorization failure does not prove the report was never saved.
5. **Decision success:** exact success sentence, without Undo. Decisions are append-only and no undo API exists. Normal-motion toast holds for four seconds, pauses on hover/focus and exits; under reduced motion it remains available rather than disappearing in 1ms.
6. **Agents:** prescribed positioning is explicitly prefixed Planned and followed by the unavailable-in-preview qualification. IN DEVELOPMENT remains; no shipped MCP/CLI or agent repair integration is claimed.
7. **Finding summary:** the advisory-range wording is used only for advisory evidence with an actual dependency. Credential/HTTP findings retain their own factual scanner summaries. Original advisory titles/excerpts and validated model notes are not rewritten as marketing copy.
8. **Secure keyword:** removed from presentation prose. Technical HTTP cookie Secure parsing, Set-Cookie attributes and cookie findings remain in src/lib and API handlers. Removing those literals would break security behavior or misdescribe evidence. The forbidden-promise browser test scans presentation TSX rather than deleting protocol terms.
9. **Drawer:** the earlier master prompt replaced desktop drawers with full-page links. This brand pass preserves that accepted reload/new-tab/navigation behavior; no active drawer-close animation is claimed.
10. **Theme cross-fade:** implemented via old/new snapshot opacity, complying with transform/opacity/stroke-only motion rather than animating color properties. Instant fallback is intentional.
11. **Approximate timing copy:** the brand-supplied “~10 s” and closing headline refer to opening the replay, not a live scan or measured provider SLA.
12. **Reduced motion:** all checked durations are at most 1ms. No report animation loops. Loading-only ship bob is the explicitly permitted exception to the under-500ms motion principle.

## Verification

Before: 206 unit tests, 50 main browser tests and 1 public-demo browser test passed in the preceding theme milestone.

Final: **typecheck passed; 208 unit tests across 24 files passed; production build passed; 54 main Playwright tests passed; 1 separate public-demo browser test passed; zero skipped tests.** Existing approval, reconciliation and validation assertions remain. Updated tests only change the prescribed approval checkbox and Tavily heading wording; additional tests verify tick-only accent in both themes, served icons/manifest, reduced-motion durations, exact review/empty copy and absent presentation promises.

All 20 requested screenshot combinations fit without horizontal document scroll, recorded in viewport-checks.json. Screenshots cover landing, reports, report, finding and signed-out repair at 1440×900 and 390×844 in dark and light. Full-page output retains content below the viewport. The finding captures use the bundled lodash advisory; report captures use the actual previously recorded live scan. Repair is an honest signed-out state, not a fabricated execution.

The four brand boards were opened in a browser; available Replay/Reduce motion controls were clicked. Their standalone export depends on the design tool's missing support.js runtime, so implementation follows BRAND.md and the supplied SVG paths rather than claiming the exported controls performed a live animation.

## Evidence files

- `{dark,light}-{landing,reports,report,finding,repair}-{1440,390}.png`: 20 screenshots in this directory.
- `motion-demo.mp4` and `motion-demo.webm`: 8.36-second browser recording showing logo intro, report reveal and scan waiting indicator. The scan request is deliberately intercepted locally and the video labels this UI demonstration. No scan/provider execution or security result is claimed from it. MP4 encoded with FFmpeg.
- `viewport-checks.json`: viewport checks.
- `logo-hashes.json`: supplied asset byte-identity checks.

No push, PR, merge, deployment, publishing or access change. No secret files read or committed. No new provider call, sandbox run, fabricated scan evidence or new runtime dependency. Existing untracked .impeccable/ and docs/PHASE-4-BROWSER-CHECK.md remain untouched. Earlier broader UI-review limitations and deferred optional packages remain open.
