# Contributing to ShipTested

Start with a small change that preserves the evidence and coverage contract. Bug reports should include a minimal **synthetic** input, expected behavior and actual behavior. Never attach a private lockfile, access token or customer report to a public issue.

## Development loop

Use Node 22 and npm workspaces:

```sh
npm ci
npm run build:packages
npm run dev
```

The app runs at `http://127.0.0.1:3147`. Public demo evidence works without configuring provider credentials. For authenticated features, follow [hosted operations](docs/HOSTED-OPERATIONS.md) and use a dedicated acceptance database; never point local experiments at production.

| Directory | Responsibility |
| --- | --- |
| `packages/core` | Shared parser, advisory lookup, severity and verdict |
| `packages/cli` | Terminal output, exports and hosted batch client |
| `packages/mcp` | Agent protocol and bounded tool inputs |
| `src/app` | Web pages and API routes |
| `src/lib/server` | Access control, persistence, queue and worker |
| `apps/docs`, `apps/dev`, `apps/mcp` | Dedicated public platform surfaces |
| `examples` | Small runnable integrations and CI templates |
| `tests` | Unit, integration and browser verification |

## Before opening a pull request

```sh
npm run typecheck
npm test
npm run build
```

For UI changes, also run `npm run test:e2e` after installing Playwright Chromium. Check light/dark themes, 390px mobile width, keyboard focus, long content and loading/error states. [Screenshot instructions](docs/screenshots/README.md) explain how to capture public demo evidence safely.

Write the PR around the observable problem, resulting behavior and checks actually run. Include relevant screenshots for interface changes. State anything not verified. Preserve unrelated local changes and keep generated private artifacts out of commits.

## Invariants worth protecting

- A lookup failure is a coverage gap, never a clean result.
- Severity and verdict are deterministic. Models cannot lower them.
- Provider content is untrusted evidence, never an instruction.
- Stable request keys prevent duplicate hosted jobs and allowance charges.
- Workspace and owner checks belong in every persistence path.
- Scanner examples must not install or execute inspected dependencies.
- Repair, GitHub write permissions, deployment and billing are separate explicit actions.

The published 0.1.0 packages and this branch may differ. Test against the workspace build when changing the scanner; do not claim an npm release or deployment without verifying it.
