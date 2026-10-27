# Light/dark theme and hero update

26 October 2026. Code commit: `3d0ae88` — Add persistent light and dark themes and revise landing hero. Local branch `codex/branded-dashboard`; no push or deployment.

The revised master prompt now points to `shipcheck-codex-theme-prompt.md`. This update implements that new scope on top of `71938f9`, preserving the previous review's remaining limitations.

| Requirement | Result |
|---|---|
| Theme tokens | Fixed. Handoff dark/light sets in globals.css; existing component colors reference semantic tokens. No literal hex/rgb colors remain in app CSS modules or inline TSX styles. |
| System preference and storage | Fixed. Unset choice follows prefers-color-scheme, including changes; explicit choice persists as shipcheck-theme in localStorage. Root inline script sets data-theme before body paint; storage failure is tolerated. |
| Native controls | Fixed. color-scheme follows data-theme. |
| Theme controls | Fixed. Accessible sun/moon button in landing/header and desktop sidebar footer, dynamic action labels and sidebar text. |
| Official logo variants | Fixed. Six supplied files match the handoff byte-for-byte; theme CSS displays the appropriate set, without filters, background tiles or recoloring. Hidden images are excluded from accessible rendering. |
| Hero headline | Fixed. Check before you ship., weight 600, 58px desktop/40px phone; requested mono eyebrow. Retired headline removed from UI/tests/README. |
| Hero composition | Fixed. Two columns on desktop, copy and logos left, real recorded report preview right; one column on phone with full-width hero actions. Dotted 22px background uses the handoff theme token. |
| Preview evidence | Fixed. Actual recorded verdict, seven actual check segments and three captured findings. Unsupported repair-tests-passed line omitted. Replay timing copy retained instead of promising a measured ten-second run. |
| Heading weights | Fixed. Landing headings use 600. |
| Contrast | Fixed for 68 audited principal text/badge foreground/background pairs, minimum 4.82:1. Details in contrast-checks.json. This is not a complete assistive-technology certification. |
| Screenshots | Fixed. Landing, reports and report at 1440×900 and 390×844 in each theme; full-page captures retain below-fold content. Twelve PNGs. |
| Verification | Fixed. Typecheck, 206 unit tests, production build, 50 main browser tests and 1 public-demo browser test pass. No skipped tests or weakened safety assertions. |

## Contrast adjustment

Light completion bars retain `--ok: #14B8A6` as supplied. Text for successful statuses uses `--success-text: #0F766E` (the handoff light accent) so it passes against the soft success background; dark text remains #2DD4BF. Other handoff principal text values did not require adjustment. Muted/subtle text, high/medium/unrated, blocked verdict and primary-button combinations are included in the committed audit. The audit normalizes browser-serialized three-digit hex values before calculating luminance.

## Tests and reference limitation

Baseline: typecheck/build passed, 206 unit tests and 47 main browser tests passed. Three added theme tests cover desktop/phone switching, logo filenames/filter, persistence after reload, theme on the first animation frame, full-width mobile CTA, and system-preference changes. Existing design/landing assertions now expect the new heading; default regression color scheme is explicitly dark, while new tests cover both themes. Public-demo test also expects the new heading.

The three reference HTML files were opened and their theme controls clicked. Their exported `text/x-dc` scripts require the missing support.js design-tool runtime, so the standalone exports do not execute that interaction. The actual token objects and theme logic were read from Main, MLanding and Dashboard; the implemented app's toggle was tested in a real browser.

## Screenshots

- theme-dark-landing-1440.png / theme-dark-landing-390.png
- theme-light-landing-1440.png / theme-light-landing-390.png
- theme-dark-reports-1440.png / theme-dark-reports-390.png
- theme-light-reports-1440.png / theme-light-reports-390.png
- theme-dark-report-1440.png / theme-dark-report-390.png
- theme-light-report-1440.png / theme-light-report-390.png

All paths are relative to this directory. `theme-logo-hashes.json` records all six matching asset hashes. Older dark-only screenshots document the earlier build, not the latest hero.

No runtime dependencies added. No secrets read, printed or committed; no fabricated evidence; no push, PR, access change or deployment. Existing untracked .impeccable/ and docs/PHASE-4-BROWSER-CHECK.md remain untouched. Prior broader master-prompt partial items and deferred optional packages remain as documented in docs/ui-review/REPORT.md.
