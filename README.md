# Agent Shielda

**Check before you ship.** A pre-deployment security assessment for small teams, built around evidence and explicit coverage.

## Status: local foundation, not a public beta

Implemented: Next.js dashboard, manifest input, exact dependency extraction, bounded live OSV queries, credential-pattern masking, an offline demo using a dated advisory snapshot, manual recommendations, and provider adapters for Tavily Search / NVIDIA Nemotron on Nebius Token Factory.

Live Tavily and Nebius credentials have not been configured or tested. URL verification/probing, accounts, persistence, Extract, calibrated severity for live advisories, GitHub integration, patching and sandbox verification are not implemented. A successful local build is not a deployment approval.

## Run

Requires Node 22. Run from this directory:

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3147. Select **Explore the demo** (no API keys or external requests), or **New scan** to query OSV using a pasted manifest.

Supported inputs: `package-lock.json` v2/v3, exact pins in `package.json` (no transitive coverage), and a conservative subset of exact Python pins in `requirements.txt`. Unsupported markers, workspace links, dependency ranges and formats are reported or rejected; they are not treated as clean.

The input limit is 200 KB and 50 unique dependency versions. OSV's version query handles ecosystem-specific version semantics. Never install the demo's vulnerable dependencies. The fixture is data, not a runnable application.

## Optional provider setup

Copy `.env.example` to `.env.local` and enter keys privately. Never commit them or send them in chat. Restart the app after changing environment variables.

- `TAVILY_API_KEY`: optional live search of at most three supplied dependency versions. Search sources are displayed as **unconfirmed**, never automatically promoted to vulnerabilities.
- `NEBIUS_API_KEY`: optional Nemotron explanations for existing findings, requested through Nebius Token Factory.
- `SHIPCHECK_MODEL`: default `nvidia/nemotron-3-super-120b-a12b`. The current adapter uses the fixed US Central Token Factory endpoint; model/account access still requires a live check.

Select the optional research checkbox. Missing keys and failed calls produce explicit incomplete coverage. There is no silent substitution of demo results. The model receives masked finding excerpts and public search snippets, never full manifests, and cannot remove findings or modify policy. Its explanations remain unverified advisory notes.

## Privacy and operating boundary

The dev/start scripts bind to loopback. This build has no authentication, durable rate limits or multi-user isolation; **do not expose it publicly**. Only one scan runs at a time per server process. Provider responses are size-limited and have 15-second per-request deadlines; OSV advisory fetches and Tavily requests have explicit count limits. Full scan duration can exceed a minute if providers are slow.

No source code is executed. No arbitrary target URL is accepted. Inputs exist transiently in the request/browser; no database is used. The browser keeps the current report in memory until reload. OSV receives package names and versions. The optional providers receive public dependency names and masked evidence. Pattern matching does not guarantee detection/redaction of all possible credential types; do not supply real credentials.

Policy v0.1: confirmed high findings block; incomplete/snapshot checks cannot pass; other findings require review. The demo's HIGH severity comes from its OSV snapshot. Live OSV hits conservatively remain review items until severity interpretation is implemented. Runtime exploitability, git history, transitive coverage without a lockfile, and staging infrastructure are not assessed. No fix or incident remediation is verified by this version.

## Verify

```sh
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Browser tests launch a separate production server on 127.0.0.1:3148. Tests include affected/unaffected versions, incomplete provider responses, secret masking, invalid input and responsive UI. The acceptance ledger and next milestones are in `docs/BUILD-PLAN.md`.

## Team and roadmap

Suggested: Louise (A) owns product, feedback and submission; Peter (B) owns technical decisions, private accounts and release approval; Codex implements and tests both workstreams. These assignments await the team's confirmation.

Next: live provider acceptance, safe verified-URL scanning, persistent projects, benchmark and public-demo hardening. Beyond the original brief: GitHub ingestion, CI policy and human-reviewed, independently verified patches. Agent Shielda is the current working name; internal package and environment-variable names retain the prototype name ShipCheck.

## Sources and attribution

- [OSV API](https://google.github.io/osv.dev/api/) — runtime exact-version advisory matching.
- `fixtures/lodash-advisory.json` — OSV record GHSA-35jh-r3h4-6jhm, downloaded 23 October 2026 from https://api.osv.dev/v1/vulns/GHSA-35jh-r3h4-6jhm. Retained as evidence with its upstream references; upstream data terms apply.
- [Nebius structured output](https://docs.tokenfactory.nebius.com/ai-models-inference/json).
- [Tavily Search](https://docs.tavily.com/documentation/api-reference/endpoint/search).
- Lucide icons and Figtree font retain their upstream licences; Google Fonts is requested by the browser with a system-font fallback.

MIT applies to original ShipCheck code. Third-party dependencies and advisory data retain their licences.
