# ShipCheck Phase 0 status

Updated 23 October 2026. This is a working handoff alongside the team's project plan, not a replacement for it.

## Phase 0 checkpoint

| Item | Status | Evidence or next action |
| --- | --- | --- |
| Product name, scope and demo story | Confirmed | ShipCheck scans exact dependency versions and a verified staging host, adds Tavily source research and Nemotron explanation, and leaves remediation with the developer. The screen sequence and safety boundary are in [Partner A flow](PARTNER-A-FLOW.md); the [demo walkthrough](DEMO-WALKTHROUGH.md) separates today's working demo from the target flow. |
| Submission deadline | Confirmed | [Devpost rules](https://nebiusglobalaihackathon.devpost.com/rules): Friday 30 October 2026, 10:00 a.m. PDT = 17:00 London. Team target: noon London. The manually updated plan PDF still says 18:00 London. |
| Public repository and MIT licence | Confirmed | GitHub reports the repository as public and recognizes MIT. The default `main` branch still contains only the initial README and licence; source and setup instructions are on the working branches. Peter's integration/release work must put the reviewed product on the submission branch. Keep all keys out of Git. |
| Setup guidance and env example | Present on working branch | Louise's branch has the app source, setup README and `.env.example`. The submitted repository URL must expose these files to judges after integration. |
| Repeatable demo fixture | Present | The app uses a synthetic manifest and a dated OSV advisory snapshot; it does not install the vulnerable package. |
| Live Nebius Token Factory and Tavily calls | Open — Peter | Record a successful runtime call to an NVIDIA open model through Token Factory and a Tavily Search call with the intended account. Confirm model ID, limits and failure behaviour. Do not mark the hackathon platform requirement complete from adapter code alone. |
| App hosting | Configured, not deployed — Peter | Peter reports that the Vercel `hey-salad-inc/shipcheck` project and GitHub connection are configured. No public deployment exists. Vercel deployment authentication is not app session authentication. |
| Storage and Actor contract | Implemented on Peter's branch; hosted access open | Peter's [`59fea3e`](https://github.com/loulouA-ux/Nebius-x-NVIDIA-Global-AI-Hackathon/commit/59fea3e) provisions Neon, adds the schema and defines a server-derived member Actor plus owner-scoped `Store` methods. His reported database smoke passed. Member key hashes are not provisioned, so hosted member login remains pending. Neon billing alerts do not enforce the approved spending limit. |
| Public demo access | Contract agreed; deployment open | Anonymous visitors may use only the fixed offline demo; live scans and project storage require individual member sessions. The public demo URL and hosted acceptance are still pending. ATR Cloudflare hosts the coordination room, not this app. |

Phase 0 closes when live provider access, hosted member login and the public demo path have been checked. Storage and the Actor contract now have a published implementation, but Louise's L1 routes must be wired against the reviewed contract before they can be treated as working. Until the open gates close, Louise can refine product copy and the demo sequence without changing Peter's provider, shared finding type or scan route work.

## Branches and ownership

Current Louise branch: `codex/louise-product-flow`. Use it for the remaining Phase 0 work. Existing Phase 1 verification commits were made here before the phase-by-phase branch convention was agreed; preserve their history. Start a new `codex/louise-phase-1` branch for subsequent Louise Phase 1 work once Phase 0 closes, then a new branch for each later phase. Review and merge the branches in order at the end.

Louise owns project and verification routes, safe host checks, product screens and styles. Peter owns shared finding types, provider adapters and scan orchestration. Agree interfaces in ATR before editing files across that boundary. Recheck ATR before each phase change and before integration.
