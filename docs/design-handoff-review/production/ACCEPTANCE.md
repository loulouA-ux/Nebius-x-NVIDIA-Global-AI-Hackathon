# ShipTested production acceptance

Required before Gate A: phase commits; rebrand regression check and asset hashes; typecheck, all unit tests, production build and full browser suites; requested desktop/mobile and theme captures; evidence-grounded report metadata; demo-only production fallback and blocked live routes; CSP and headers; canonical/social/manifest/legal/security resources; measured performance/accessibility; self-scan findings; CI and smoke script. No push, production deployment, settings changes or publishing.

Phase 4 follows Peter's deployment gates. CLI/MCP are not available or ready to publish until implemented and tested.

Build/runtime verification uses an isolated copy excluding all `.env*` and `.private` files; no provider credentials are needed. Historical reports retain their names and evidence. Compatibility identifiers preserve sessions, workspace ownership, browser preferences/history, internal events and existing repair branch references.

Gate A fixup proof (27 October 2026): pre-navigation LCP observers on all five public routes; eight Lighthouse shell runs at 85/95/95 plus an honestly recorded new-headless comparison; no root loading screen; exact five-advisory dated OSV snapshot with policy-derived metadata and recomputed verdict; sidebar viewport-bottom assertions after end-of-report scroll in both themes; full typecheck/unit/build/browser/smoke/axe and refreshed screenshots. Resend is a separate member-environment setup: no credentials in this build or public deployment, and no email delivery claim without delivery evidence.
