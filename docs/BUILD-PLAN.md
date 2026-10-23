# Agent Shielda — first working milestone

Working product name: Agent Shielda. Internal identifiers retain the prototype name ShipCheck.

Suggested ownership, pending Peter/Louise confirming their availability:

- A: Louise — product decisions, user testing, dashboard feedback, submission narrative.
- B: Peter — technical decisions, private account setup, hosting and release approval.
- Codex — implementation and verification across both workstreams. No messages sent to Louise.

## Acceptance criteria (registered before implementation)

- Strict TypeScript and production build pass.
- The demo runs real deterministic rules over synthetic inputs and an explicitly labelled, dated OSV snapshot; no hard-coded report output.
- Exact npm/PyPI pins are parsed; ranges, malformed input, unsupported lockfile versions and missing coverage cannot silently pass.
- Live OSV supports bounded calls and fails visibly; fixtures never silently replace live failures.
- Secrets are masked before returning results or calling external services.
- Nemotron cannot remove/downgrade deterministic findings; missing keys produce explicit incomplete coverage.
- Dashboard supports demo, pasted manifest, finding evidence, and recommended manual actions. No fake fixes/PRs.
- Automated browser checks exercise the flow and responsive layout; screenshots reviewed.
- No deployment, provider account provisioning, credential retrieval, or repository publication in this milestone.

## Next milestones

1. Privately configure Tavily and Nebius; live acceptance checks and model quality evaluation.
2. Verified URL scanning with host ownership, pinned public DNS resolution, redirect/SSRF restrictions and request budgets.
3. Persistent accounts, project history, decision audit log and public-demo abuse controls.
4. Labelled benchmark, independent user review, deployment and submission.
5. Beyond brief: GitHub ingestion, CI policy, human-reviewed patches and isolated behavioural verification.

Deadline: 30 October 2026, 17:00 London. Target: noon. Maintain judging availability through 15 December.
