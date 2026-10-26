# ShipCheck

Earlier working name: Agent Shielda.

**Check before you ship.** A pre-deployment security assessment for small teams, built around evidence and explicit coverage.

## Status: protected team preview

Implemented: manifest scanning, live OSV matching, Tavily search and bounded advisory extraction, NVIDIA Nemotron explanations through Nebius, member sessions, owner-scoped Neon persistence, saved reports, immutable review decisions, and exact-host proof with bounded passive HTTPS checks.

Live provider and hosted member/storage acceptance have passed. Current evidence and remaining release gates are recorded in [implementation status](docs/IMPLEMENTATION-STATUS.md). Protected preview deployment is separate from a public production release. GitHub ingestion, automated patches, sandbox exploit verification and calibrated live-advisory severity remain outside this implementation.

## Run

Requires Node 22. Run from this directory:

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3147. Select **Explore the demo** (no API keys or external requests), or sign in as a configured member and select **New scan** to query OSV using a pasted manifest.

Supported inputs: `package-lock.json` v2/v3, exact pins in `package.json` (no transitive coverage), and a conservative subset of exact Python pins in `requirements.txt`. Unsupported markers, workspace links, dependency ranges and formats are reported or rejected; they are not treated as clean.

The input limit is 200 KB and 50 unique dependency versions. OSV's version query handles ecosystem-specific version semantics. Never install the demo's vulnerable dependencies. The fixture is data, not a runnable application.

## Private configuration

Copy `.env.example` to `.env.local` and enter keys privately. Never commit them or send them in chat. Restart the app after changing environment variables.

- `DATABASE_URL`: dedicated Neon Postgres connection. Apply `npm run db:migrate` before member use.
- `SHIPCHECK_PETER_KEY_HASH` / `SHIPCHECK_LOUISE_KEY_HASH`: SHA-256 hashes of separate random `sc_` plus 64-hex member keys; raw keys are private and entered only on `/sign-in`. Eight-hour opaque HttpOnly sessions are stored hashed; changing a member hash invalidates that member's sessions.
- `TAVILY_API_KEY`: optional live search of at most three supplied dependency versions, followed by at most two advisory-authority extractions. Search sources are displayed as **unconfirmed**, never automatically promoted to vulnerabilities.
- `NEBIUS_API_KEY`: optional Nemotron explanations for existing findings, requested through Nebius Token Factory.
- `SHIPCHECK_MODEL`: default `nvidia/nemotron-3-super-120b-a12b`. The current adapter uses the fixed US Central Token Factory endpoint; this model passed the live acceptance check on 23 October 2026.

Select the optional research checkbox. Missing keys and failed calls produce explicit incomplete coverage. There is no silent substitution of demo results. The model receives masked finding excerpts and public search snippets, never full manifests, and cannot remove findings or modify policy. Its explanations remain unverified advisory notes.

## Privacy and operating boundary

The dev/start scripts bind to loopback. Public visitors may run only the fixed offline demo. Live scans require a member session and durable global/per-member quotas; all project/report/decision queries filter workspace and owner. Only one scan runs at a time per server process. Provider responses are size-limited and have 15-second per-request deadlines; OSV advisory fetches and Tavily requests have explicit count limits. Full scan duration can exceed a minute if providers are slow.

No source code is executed. No arbitrary target URL is accepted. Raw manifests exist transiently in the request/browser. Masked member reports, projects, hashed sessions and decision events are stored in Postgres. Offline demo reports remain in browser memory. Public research is cached for up to 24 hours with original timestamps; expired records are not reused. OSV receives package names and versions. The optional providers receive public dependency names and masked evidence. Pattern matching does not guarantee detection/redaction of all possible credential types; do not supply real credentials.

Policy v0.1: confirmed high findings block; incomplete/snapshot checks cannot pass; other findings require review. The demo's HIGH severity comes from its OSV snapshot. Live OSV hits conservatively remain review items until severity interpretation is implemented. Runtime exploitability, git history, transitive coverage without a lockfile, and application business logic are not assessed. Staging checks inspect only four fixed public HTTPS endpoints after fresh proof; cookies are assessed by flags without retaining names or values. No fix or incident remediation is verified by this version.

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

Louise (Partner A) owns product flow, project verification and product review. Peter (Partner B) owns provider integration, shared storage/session boundaries, scan orchestration and release coordination. Integration changes and interfaces are shared through ATR; messages are not proof of receipt or completed work.

Remaining: independent partner review, private member-key delivery, public judging access decision, final benchmark/demo recording and submission. Beyond brief: repository ingestion, CI policy and human-reviewed patches with independent verification.

## Sources and attribution

- [OSV API](https://google.github.io/osv.dev/api/) — runtime exact-version advisory matching.
- `fixtures/lodash-advisory.json` — OSV record GHSA-35jh-r3h4-6jhm, downloaded 23 October 2026 from https://api.osv.dev/v1/vulns/GHSA-35jh-r3h4-6jhm. Retained as evidence with its upstream references; upstream data terms apply.
- [Nebius structured output](https://docs.tokenfactory.nebius.com/ai-models-inference/json).
- [Tavily Search](https://docs.tavily.com/documentation/api-reference/endpoint/search).
- Lucide icons and Figtree font retain their upstream licences; Google Fonts is requested by the browser with a system-font fallback.

MIT applies to original ShipCheck code. Third-party dependencies and advisory data retain their licences.

## Recorded live demo capture

Run `node --env-file=.env.local --import tsx scripts/capture-recorded-run.ts` locally with both provider keys configured. This makes one pipeline scan using only the existing synthetic lockfile. It refuses incomplete provider evidence, checks that configured secret values are absent, and never overwrites a capture. Review the sanitized fixture before committing. `/api/demos?mode=recorded` returns an honest unavailable state if no fixture exists; `mode=offline` rebuilds the stable offline demo.
