# Local development

[Back to the README](../README.md) · [Recorded demo and judge walkthrough](RECORDED-DEMO.md)

## Start with the report demo

Use Node.js 22 and npm, from the repository root:

```sh
npm ci
npm run build:packages
npm run dev
```

Open http://127.0.0.1:3147 and select **Run the demo**. The landing page opens the stored `demo-recorded` report. The `demo-offline` route uses the fixed offline fixture. Neither is evidence of a new live provider call. Without database configuration, the member-access area can say it is temporarily unavailable; the fixture report still opens. The Next.js server and installed packages are needed, but no database, account or API key is required for these reports.

The development and production-start commands bind to loopback. Package installation requires internet; after installation, fixture reports require no live security-provider access. Do not install dependencies from vulnerable demo fixtures: they are scan input data.

## Configure live workflows separately

Copy the template, then edit it privately:

```sh
cp .env.example .env.local
```

Restart the server after changing configuration. Keep actual credentials out of Git, screenshots, logs and issue reports. This guide uses the current `SHIPTESTED_` names; older historical documents may use the supported `SHIPCHECK_` aliases.

| Capability | Required setup |
| --- | --- |
| Member sessions and saved reports | A dedicated Neon/Postgres `DATABASE_URL`, schema migration and configured member identity. |
| Private team-key sign-in | Separate `SHIPTESTED_PETER_KEY_HASH` / `SHIPTESTED_LOUISE_KEY_HASH` values. These are SHA-256 hashes of private random member keys, not the keys themselves. |
| GitHub identity sign-in | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, fixed `SHIPTESTED_APP_ORIGIN`, and admitted numeric IDs in `SHIPTESTED_GITHUB_MEMBER_IDS`. Register the callback at `/api/auth/github/callback`. |
| Nemotron-assisted manifest review | `NEBIUS_API_KEY`; `SHIPTESTED_MODEL` defaults to `nvidia/nemotron-3-super-120b-a12b`. Missing or failed provider evidence remains explicit. |
| Optional live research | `TAVILY_API_KEY`. Search results remain unconfirmed context rather than new verified vulnerabilities. |
| Selected-repository access | A separate GitHub App, `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, and the server-admin mapping in `SHIPTESTED_GITHUB_INSTALLATIONS`. |
| Sandbox repair verification | Vercel Sandbox authentication, an explicitly enabled `SHIPTESTED_REPAIR_SANDBOX_ENABLED`, and reviewed daily/lifetime execution allowances. Cloud execution can incur charges. |

Before using member workflows, migrate the database:

```sh
npm run db:migrate
```

GitHub OAuth grants identity access only. Repository permissions belong to the separate GitHub App installation. A sandbox run does not approve publication; the user must review the exact patch and verification evidence before a draft PR is created. The [repair architecture](GITHUB-REPAIR-LOOP.md) describes snapshot binding, the supported direct npm upgrade path and historical implementation checkpoints.

**Hosted/source distinction:** the 30 October video shows the configured hosted application, including newer repository-scan and account screens. This source baseline supports fixture replay and configured member/repair workflows; it is not a complete deployment recipe for every screen in that recording. In particular, the source's production guard forces demo-only mode when `VERCEL_ENV=production`. Do not infer a live production release from a successful local build.

## Privacy and scope

- OSV receives exact package names and versions, not the raw lockfile. The scanner does not execute repository code.
- Optional enrichment receives bounded, masked finding context. Nemotron cannot change deterministic findings or verdicts; Tavily results remain explicitly unconfirmed.
- Raw scan manifests are transient request/browser data. Saved masked reports, projects, decisions and hashed sessions use owner/workspace-scoped storage. Configured repair workflows separately persist the selected repository snapshot and verification evidence.
- Supported credential-pattern detection is limited; it is not a guarantee of complete secret discovery or redaction. Do not supply real credentials as scan input.
- Input and provider budgets differ between web, CLI and MCP. See [core limits](../packages/core/README.md), [CLI behavior](../packages/cli/README.md) and [MCP limits](../packages/mcp/README.md). Unsupported or truncated coverage is never silently treated as a pass.
- Lockfile scanning supports npm v2/v3. Exact `package.json` pins do not supply transitive coverage; Python requirements support is conservative. Business logic, runtime exploitability and git history are not assessed.
- Staging checks require fresh ownership proof and inspect a bounded set of public HTTPS endpoints. They are passive checks, not a penetration test.
- Repair tests run in a separate bounded sandbox, with installation lifecycle scripts disabled and test-time egress denied. Review baseline and patched outcomes, scan deltas, missing checks and cleanup independently.

## Verification

```sh
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

The build/typecheck/test scripts build the shared packages through their pre-scripts. The normal browser suite launches a separate production server on http://127.0.0.1:3148. Read the current test configuration before adding a custom running server.

For a read-only demo deployment, `SHIPTESTED_PUBLIC_DEMO=1` restricts the app to fixture-backed views. Live operations are denied before provider/database work. After a production build, verify that boundary with:

```sh
npx playwright test -c playwright.public-demo.config.ts
```

A passing fixture suite proves local behavior; it does not prove live OAuth, cloud execution, publication or production deployment. Keep those acceptance results separate.

## Historical records

Older dated checkpoints are retained for traceability in [implementation status](IMPLEMENTATION-STATUS.md), [deployment notes](DEPLOY.md), [verification](VERIFICATION.md) and [the repair log](GITHUB-REPAIR-LOOP.md). Their outstanding items and deployment identifiers describe their recorded dates. Use the [30 October demo evidence](RECORDED-DEMO.md) for the walkthrough shown on the README, and verify current live state before making operational changes.
