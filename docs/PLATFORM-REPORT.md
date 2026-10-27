# ShipTested platform release ledger

27 October 2026, Europe/London. Phase 0 in progress; Phases 1–5 are not implemented by this change.

## Deployment path and rollback

See DEPLOY.md. Current production was CLI-deployed, but main remains the configured Git production branch. Follow the stricter branch/PR merge gate in Peter's brief. Do not deploy production here. Rollback target: dpl_Fm4WkEEgwavUguCi48Az5BHMy3AN.

## Phase 0 checks

- History: Gitleaks 8.30.1, full unpushed range through 20099f9, zero findings. Re-run before push.
- Clean archived source without local environment/private files: TypeScript pass; 254 unit tests pass; production build pass; 59 main +14 public-demo browser tests pass.
- Initial isolated harness failed because its archive lacked Git metadata; adding a temporary Git index made the source-identity test run. Initial build rejected node_modules symlink outside the root; clean npm ci fixed it. No application tests weakened.
- Axe: 20 captures across landing/report/privacy/security/404, 1440/390 and light/dark. Zero serious/critical violations and no horizontal overflow. Evidence: platform/axe.json and PNGs.
- Headless-shell Lighthouse: landing desktop100/100/100, mobile98/100/100; report desktop100/100/96, mobile95/100/96. All meet90/95/95. Actual404 is not part of this gate and remains unscored.
- Smoke script now supports authenticated `--vercel-preview` transport via the already signed-in CLI, without reading/printing credentials. The www redirect is explicitly not applicable to generated deployment hosts; it remains mandatory in production smoke.
- First fresh preview dpl_7LX1WXX8u8Es4Xut6qBTDMedbfTh failed the demo API refusal check (400 instead of403): it inherited member-mode settings. A replacement preview explicitly selects SHIPTESTED_PUBLIC_DEMO=1 at deployment scope only. Existing project/production variables and protection are unchanged. Final preview result pending below.
- Local smoke: six checks passed; www redirect failed because the temporary server did not configure NEXT_PUBLIC_SITE_URL to its local origin. Browser redirect behavior and actual production smoke must remain separate evidence.

## Remaining gates / Peter actions

- Fresh HEAD preview smoke, final redacted history scan and normal branch push.
- Open PR to main; Peter merges under the explicit Phase0 step4 gate. Live production smoke, demo403, headers, no-JS hero and screenshots are pending that release. Stop before proceeding to platform implementation.
- No npm publishing, DNS changes, paid features, production environment edits, force pushes or main merges are authorized here.
- Packages/core, CLI, local/remote MCP, docs and developer portal remain planned. No npm tarballs or new subdomain projects exist yet. DNS records will be reported from Vercel when those projects are actually provisioned; do not invent them.

## Phase 0 merge handoff

- Fresh HEAD preview: b9f75dc, READY deployment `dpl_5T6eUvRi1e4RUyJXmBJ4SzemQfe1`, https://shipcheck-9uubjm1wu-hey-salad-inc.vercel.app . Deployment-scoped SHIPTESTED_PUBLIC_DEMO=1; protection unchanged.
- `node scripts/smoke.mjs <preview> --vercel-preview`: all six applicable checks passed, including live API403 and nonce/security headers. www redirect is not applicable to the generated preview hostname.
- Existing production smoke: six checks passed; replay-text assertion failed because the older report contains captured/lodash but not the new Replay wording (HTTP200). No release occurred and no rollback was necessary.
- Final pre-push history scan through b9f75dc: zero findings. This handoff commit changes documentation only; tested application code remains identical.
- Phase0 stops at the required main-merge handoff. This is a broad accumulated integration PR (653 files before this documentation update), not only the latest UI styling. Review the complete scope before merging.
- After Peter merges: verify the actual production deployment/revision, rerun full live smoke and no-JS/responsive checks, and roll back on release failures. Phases1–5 follow only after this gate.

Commits this task: 20099f9 deployment discovery; ae3e89d history scan; b9f75dc verification and preview smoke support; this documentation commit records the step4 handoff. Steps5/live-v2 and6/push status are reported by the PR and final response.
