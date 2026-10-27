# ShipTested platform release evidence

Checked 27 October 2026, Europe/London (GMT). The library, CLI, local MCP, public remote MCP, documentation and developer portal are implemented. Package publication and main-branch integration remain separate human release steps. A successful dependency check is not proof of application security.

The earlier Phase 0 evidence is preserved in [the historical ledger](platform/PHASE-0-LEDGER.md).

## Delivery and review chain

These are stacked PRs: review and integrate in order. No PR was merged by Codex.

| PR | Commit | Work |
|---|---|---|
| [6](https://github.com/loulouA-ux/Nebius-x-NVIDIA-Global-AI-Hackathon/pull/6) | `de18288` | Shared deterministic core, bounded OSV transport, real stages |
| [7](https://github.com/loulouA-ux/Nebius-x-NVIDIA-Global-AI-Hackathon/pull/7) | `9d21b04` | Optional BYOK AI notes, immutable findings/verdict |
| [8](https://github.com/loulouA-ux/Nebius-x-NVIDIA-Global-AI-Hackathon/pull/8) | `6afeefd` | CLI, JSON, SARIF, exit codes |
| [9](https://github.com/loulouA-ux/Nebius-x-NVIDIA-Global-AI-Hackathon/pull/9) | `b5b8c4d` | Local stdio MCP, safe path boundaries |
| [10](https://github.com/loulouA-ux/Nebius-x-NVIDIA-Global-AI-Hackathon/pull/10) | `22e818a` | Stateless remote MCP and limits |
| [11](https://github.com/loulouA-ux/Nebius-x-NVIDIA-Global-AI-Hackathon/pull/11) | `4804c0f` | Generated docs, real example outputs, agent instructions |
| [12](https://github.com/loulouA-ux/Nebius-x-NVIDIA-Global-AI-Hackathon/pull/12) | `c0630b8` | Developer portal, live registry status, remote playground |
| [13](https://github.com/loulouA-ux/Nebius-x-NVIDIA-Global-AI-Hackathon/pull/13) | `c8a622d`, `9bbd021` | Pack/install/publish dry-run and subprocess gates |
| [14](https://github.com/loulouA-ux/Nebius-x-NVIDIA-Global-AI-Hackathon/pull/14) | `a855dce`, `e0fd2a9`, `87ea5b7` | Hosted connection URLs, truthful landing/nav, scoped CI builds, phone wrapping, app icons |

PR6 is based on the existing PR5 integration branch. The website remains at repository root. The root prebuild now generates Fumadocs types before Next's workspace typecheck, fixing the earlier package-stack preview failure.

## What is live

Peter explicitly approved the new apps' first production deployments. Existing website protection, environment settings and DNS were not changed. Public Vercel aliases work without a Vercel session; unique deployment URLs retain Vercel authentication.

| Surface | Public URL | Current deployment |
|---|---|---|
| MCP | https://shiptested-mcp.vercel.app/mcp | `dpl_2vf2aLZ7UB1Rijy7bcc3sWjJx7Te` — https://shiptested-kieuc9x2k-hey-salad-inc.vercel.app |
| Docs | https://shiptested-docs.vercel.app | `dpl_5vSywQigh4Uz43K818GHTvrWJBNa` — https://shiptested-docs-gqqg28t2k-hey-salad-inc.vercel.app |
| Developer portal | https://shiptested-dev.vercel.app | `dpl_EYvdFiDhLBtEJZi6GUgKVEe3wvqc` — https://shiptested-m65af4l8l-hey-salad-inc.vercel.app |

Landing-page availability and navigation changes are in PR14's tested preview, **not yet on shiptested.com**. npm availability remains false; source commands and the live remote endpoint are shown honestly. No vendor app-directory approval is claimed.

Rollback targets for the new apps: MCP `dpl_EUBZxjvGXjEceF7Wu8ChzzV9xVgC`, docs `dpl_5946wGTdwzYq9pU55Xsnf9ppwQuw`, dev `dpl_HRCQqYsGanm2LobSEd22Yh1pS4My` (pre-icon versions). Existing website production remains `dpl_BrSu3JHjqhjXUDpV43Xh8dVKvpmR`, previous rollback `dpl_D9K3WZYjpmnMtQJF8CDsr4sgiPJ1`. Do not roll back automatically.

Two initial MCP deployment attempts were removed after discovering that Vercel promotes a new project's first deployment to production even when preview is requested. The production deployments listed above followed Peter's explicit approval.

## Verification

- 277 unit tests across 38 files and TypeScript passed. Root website and all three app production builds passed.
- 59 regular Playwright tests and 28 public-demo tests passed during integration; the updated developer route was rechecked after switching to verified public URLs. Public live API remains 403 in demo mode.
- Actual installed-tarball CLI scan: synthetic lodash fixture, five findings, Blocked, exit 1. JSON parsed; SARIF validates against the official OASIS 2.1.0 schema in tests.
- Actual installed-tarball local MCP connected through the official SDK and listed exactly the three deterministic tools. SDK integration tests exercise structured results, local path boundaries and progress events.
- Public HTTP MCP: real OSV scan and single-package check returned Blocked with five findings. Cross-origin POST returned 403; GET /mcp returned 405. Advisory retrieval also tested separately. Oversized body returned 413, remote path input was rejected, and health responses include CSP, nosniff and DENY framing. [Boundary checks](platform/verification/hosted-boundaries.json). [Hosted evidence](platform/verification/mcp-hosted-live.json).
- Hosted developer playground performed an actual remote MCP scan and displayed the same verdict and count. No mocked report is used in that flow.
- Docs search endpoint and visible search dialog returned CLI and scan results.
- Hosted docs/dev/MCP: 1440 and 390 px, light and dark, zero axe violations, no page errors, no page horizontal overflow. The initial MCP phone overflow was corrected and rechecked; use [final MCP checks](platform/verification/hosted-mcp-final-ui.json), which supersede that portion of the initial combined run.
- Local Lighthouse: docs home 97/100/100, CLI reference 93/100/100; dev home and releases 98/100/100. Hosted Lighthouse: docs home 96/100/100; CLI reference 97/100/100 on a valid isolated run; dev home 99/100/100 and releases 100/100/100. Results are saved separately. One reference-page run produced no valid performance score; a separate run succeeded. Missing favicon requests were corrected on all three apps.
- GitHub Actions and Vercel preview were green at `a855dce`; follow-up icon/wrapping/evidence commits are tracked by the same PR checks.
- Gitleaks redacted history and evidence-directory scans: no leaks found. The final evidence commit is included in the pre-push history scan. No private env files or credential values are included.

The root monorepo CLI self-scan resolves 650 dependencies but reports **Incomplete** for unresolved workspace links. CI preserves that observational JSON rather than pretending it is a complete clean scan. [Repository scan](platform/verification/repository-scan.json). Fixture parity and safety tests remain gating checks.

## Package release

All packages are 0.1.0, ESM, MIT, Node >=20.19.0 (Node 22 recommended for the workspace). Actual tarballs contain only dist JS/declarations, README, LICENSE and package.json. Complete file lists, integrity hashes and sizes: [packages.json](platform/verification/packages.json).

| Package | Packed bytes | Publication |
|---|---:|---|
| `@heysalad/shiptested` | 13,360 | pack + publish dry-run only |
| `@heysalad/shiptested-cli` | 4,980 | pack + publish dry-run only |
| `@heysalad/shiptested-mcp` | 5,663 | pack + publish dry-run only |

Peter publishes core → CLI → MCP with his npm login/2FA, following [PUBLISH.md](platform/PUBLISH.md). Only after registry verification should `AGENT_PACKAGES_PUBLISHED` switch to true. npm publishing has not occurred.

## DNS handoff for Peter

Vercel domain bindings are created. Cloudflare DNS has not been changed. Keep these records DNS-only (proxy off):

| Host | Type | Exact Vercel target | Proxy |
|---|---|---|---|
| `mcp` | CNAME | `d94af750e75f4cce.vercel-dns-016.com.` | DNS only |
| `docs` | CNAME | `8aba67891d4d320b.vercel-dns-016.com.` | DNS only |
| `dev` | CNAME | `0d96d9a5882fe3ea.vercel-dns-016.com.` | DNS only |

After propagation, verify all three domains and MCP client connections before replacing the working Vercel aliases in links/snippets. No existing root/www/mail records need changing.

## Transport, clients and honest boundaries

Official MCP SDK 1.32.2: local stdio; remote WebStandardStreamableHTTPServerTransport, stateless JSON-response mode. Remote tools accept content only, expose no AI, do not execute code, and use only the bounded OSV transport. Maximum 2 MB body / 5,000 packages / 20 seconds; redirects refused. In-memory advisory cache and rate-limiter maps are bounded. No uploaded-content persistence or application logging.

Rate limit is 30 requests/minute/IP **per server instance**, not a distributed global quota. Peter may optionally configure a Vercel Firewall rule after reviewing plan cost. OAuth and tenant quotas are planned. Hosting/provider infrastructure metadata is outside the application's no-content-logging guarantee.

Manual snippets were checked against official Claude Code, Codex, Cursor, Gemini CLI and ChatGPT documentation on 27 October 2026; linked sources are in the agent guide. Protocol tests do not imply every client was individually tested. ChatGPT plan/workspace permissions still apply. There are no marketplace approvals.

Recordings: [actual CLI output replay](platform/verification/cli-demo.mp4), [source terminal capture](platform/verification/cli.cast), [actual hosted playground scan](platform/verification/hosted-playground.mp4). Claude Code’s configured GLM-through-Cloudflare integration check succeeded: one actual `mcp__shiptested__scan_lockfile` call, five findings, Blocked, correct coverage caveats. [Captured client/tool transcript](platform/verification/claude-glm-mcp.json) and [actual-output replay](platform/verification/claude-glm-mcp.mp4). This tests Claude Code with GLM, not an Anthropic model.

Remote JSON mode returns completed structured evidence; it does not stream intermediate progress to the playground. The UI says it is waiting, never simulates progress. Local CLI/MCP emit real stages. Website scan SSE remains a stretch item. Existing OSV advisory-detail budget can yield Incomplete for large inputs; 5,000 packages is an input cap, not a full-coverage guarantee. Workspace-link resolution, pnpm/yarn support, automatic remediation, exploitability and compliance certification are not added by this release.

## Remaining human release gates

1. Peter: publish npm packages in dependency order and report completion for registry verification.
2. Peter: apply the three DNS records, then request domain checks.
3. Peter: review/integrate the PR stack; landing-page updates remain preview-only until the approved main-site release.
4. Team: review this evidence and any client-specific acceptance results. Do not call a manual configuration a marketplace listing.
