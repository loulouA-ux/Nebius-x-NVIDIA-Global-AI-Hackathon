# ShipTested deployment

Verified 27 October 2026, Europe/London using authenticated Vercel CLI project/deployment API and `vercel inspect https://shiptested.com`.

- Team: HeySalad Inc (`hey-salad-inc`). Project: `shipcheck`.
- Root directory: `.`. Next.js, Node 22.x, `npm ci`, `npm run build`.
- Git integration: loulouA-ux/Nebius-x-NVIDIA-Global-AI-Hackathon; production branch `main`. A main push can deploy production. Do not merge or force-push.
- Current production: `dpl_Fm4WkEEgwavUguCi48Az5BHMy3AN`, READY, source `cli`, target `production`, release metadata `6d1967f`. Inspecting shiptested.com resolves to this deployment.
- Both CLI deployment and Git integration exist. Although the current production artifact was CLI-deployed, the project still has Git-triggered production on main. Follow the brief's main-branch gate: push the reviewed branch, open a PR and stop for Peter to merge; do not bypass that gate with a CLI production deployment.
- Rollback target recorded before release: `vercel rollback dpl_Fm4WkEEgwavUguCi48Az5BHMy3AN --scope hey-salad-inc`.
- Existing environment variables and Deployment Protection must remain unchanged.

## Release gate (pending)

1. Redacted Gitleaks scan over every unpushed commit; stop on any finding and report only commit/path/rule.
2. Typecheck, unit suite, production build, full browser suite and axe pass from clean source without reading local secrets.
3. Fresh HEAD preview passes scripts/smoke.mjs; Lighthouse landing and recorded report meet 90 performance /95 accessibility /95 best practices.
4. Record exact release HEAD; deploy only after all gates pass.
5. Live smoke, demo API403, security headers, no-JS hero, and 1440/390 dark/light captures pass; roll back on failure.
6. Normal branch push only after the secret scan passes; never merge main here.
