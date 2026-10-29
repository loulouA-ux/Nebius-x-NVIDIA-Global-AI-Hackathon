# UI interaction audit — 29 October 2026

Status: local changes and verification. This audit does not deploy anything.

## Scope and acceptance

The audit checks visible control activation, meaningful workflow outcomes, disabled and failure states, keyboard access, branding, contrast/accessibility automation and horizontal overflow. Destructive or consequential operations use intercepted fixture APIs. No real scans, repairs, invitations, permission grants or billing actions are performed.

The app activation sweep covers 16 route states at 1440px and 390px: home, developers, reports, recorded report, scan, hosts, repairs, team, usage, batches, security overview, sign-in, privacy, security, shared link and not-found. It intentionally uses signed-out API responses; authenticated controls are exercised separately by the workflow tests below.

| Activation inventory | Desktop | Mobile | Total |
| --- | ---: | ---: | ---: |
| Local activation/focus with no client exception | 206 | 171 | 377 |
| External destination intercepted | 10 | 8 | 18 |
| Disabled boundary verified | 2 | 2 | 4 |
| Rendered control instances | 218 | 181 | 399 |

These are rendered instances, not 399 unique features. Inputs/selects receive focus; links/buttons/disclosures are activated. Disclosure transitions and skip-link targets are asserted. The sweep is a smoke test, not proof that each control's complete business workflow succeeds.

Machine-readable records are generated in `.private/click-audit/app-1440.json` and `app-390.json`. They include route, element type, label, destination and result.

## Functional checks

| Area | Evidence |
| --- | --- |
| Authentication | Safe return destinations, key sign-in, expired/cancelled OAuth, sign-out failure/retry, session expiry and private-state removal |
| Reports/findings | Open/reload, filters, grouping, evidence, decisions, report/finding navigation, CSV preview/download and audit exports |
| Security dashboard | Overview charts, findings drawer, remediation queue, coverage recovery, process states, deep links, stale and signed-out data |
| Batches | All 215 fixture entries, filters/search, refresh, live polling, skipped/failed states and expired access |
| Repository scans | Repository selection, submission/polling/reload using fixtures, quota gates and session expiry |
| Repairs | Proposal, isolated verification, evidence review, approval gate, publication reconciliation, saved evidence and exports using fixtures |
| Staging hosts | Invalid URL rejection, create project, select project, DNS/file methods, copy name/value, verify and refresh challenge using fixtures |
| Workspace | Switch, remove member, create/revoke/accept invitation, failed revocation recovery, audit disclosure, token create/dismiss/revoke and repository connect/disconnect using fixtures |
| Billing | Seat inputs, disabled checkout gates, failed checkout, refresh, activity disclosure and rejection of unsafe portal redirect using fixtures |
| Developer portal | All four command-copy buttons, clipboard content, theme, fixture loading, streamed result, failed scan and status failure |
| Documentation | Search dialog/results, all 12 destination pages from the introduction sidebar, copy-anchor/code controls on those pages, desktop collapse/expand, mobile drawer open/close and mobile search |
| Visual/accessibility | App and all 13 docs pages, developer home/releases and MCP home in light/dark at desktop/mobile; populated dashboard tabs separately |

## Bugs fixed

1. Failed invitation revocation hid the active invitation code. The code and retry control now remain until the API confirms revocation.
2. Developer status assumed every HTTP response contained a valid status object. HTTP and malformed responses now show an error while retaining the rest of the page.
3. Developer command-copy buttons had unreliable accessible names because their only text was inside a status region. They now have a stable explicit name while retaining copy feedback.
4. Workspace-load failure no longer continues to claim it is loading.

The preceding authentication improvements remain intact and uncommitted.

## Verification commands

- `npm run build` — app build and TypeScript passed.
- `npm run build -w @shiptested/dev` — developer build passed.
- `npm test` — 386 passed.
- `npx playwright test` — 103 passed.
- `npx playwright test --config playwright.platform-ui.config.ts` — 7 passed. The expanded documentation copy/navigation tests were also rerun separately and passed.
- `npx playwright test --config playwright.public-demo.config.ts --output .private/public-ui-test-results` — 30 passed across the configured Chromium, Firefox and WebKit projects. The full authenticated app suite uses Chromium, not all three engines.

Initial new-test failures also revealed locator assumptions: keyboard-only skip links, already-open disclosures, duplicate responsive controls, the docs search combobox, and the docs drawer's own close button. Tests were corrected against rendered UI and library state rather than bypassing actionability checks.

## Limits

This is not a claim that every possible state or data-dependent control across the product has been exhaustively tested. External destinations are intercepted, hosted provider operations are not re-executed, and fixture workflows cannot prove production provider behavior. Browser emulation does not prove physical-device behavior or full screen-reader conformance. A rendered-control inventory plus workflow assertions is stronger evidence than a page screenshot, but it is not complete combinatorial coverage.

Nothing in this audit changes production, authentication permissions, deployment protections or another agent's checkout.
