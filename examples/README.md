# Small, inspectable examples

From the repository root, run `npm ci && npm run build:packages` with Node 22.

| Example | Run | Network |
| --- | --- | --- |
| Inspect exact dependency versions | `node examples/inspect-lockfile.mjs` | None |
| Produce a live JSON report | `node examples/scan-lockfile.mjs /path/to/package-lock.json` | OSV |
| Add a CI gate | Adapt [github-actions.yml](github-actions.yml) | npm, OSV |

The default inspection fixture is synthetic data. Never run `npm install` inside it. Inspection is parsing, **not** a vulnerability assessment. Live examples do not use GitHub authorization, create hosted jobs, or alter the current batch.

For CLI/SARIF and agent configuration, see [CLI](../packages/cli/README.md), [MCP](../packages/mcp/README.md), and [hosted workflow](../docs/HOSTED-WORKFLOW.md). Published 0.1.0 packages may differ from this development branch; these examples use the locally built workspaces.
