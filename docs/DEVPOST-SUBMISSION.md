## Inspiration

Building software is getting faster. Knowing whether it is ready to ship is still difficult.

Small teams often face a gap between finding a vulnerable dependency and confidently fixing it. A security alert identifies a problem, but developers still need to understand the evidence, choose an update, check for regressions, and review the change.

We built **ShipTested.com** to connect those steps. Our guiding principle is simple: **AI can help developers understand findings, but evidence, tests, and human approval should determine what happens next.**

## What it does

ShipTested takes developers from dependency warnings to reviewed, tested repairs.

Users can scan supported dependency manifests or use the hosted repository workflow to inspect a GitHub repository. Reports show affected versions, advisory sources, severity, and coverage gaps.

**NVIDIA Nemotron, served through Nebius Token Factory, assists with finding review.** It selects relevant scanner-authored notes, and ShipTested validates those selections before displaying them. The model cannot remove findings, lower severity, or change the security verdict.

For supported direct npm dependency upgrades, ShipTested proposes a patch and runs verification in isolated sandboxes. It compares tests before and after the change, regenerates the lockfile, and rescans the resulting dependencies. The developer reviews that evidence before approving a draft GitHub pull request.

Nothing is automatically merged or deployed.

## How we built it

We built ShipTested with **OpenAI Codex as a coding collaborator**, working alongside us throughout implementation, debugging, testing, and documentation.

Codex helped us develop application flows, investigate scan-worker and provider-integration issues, run automated checks, inspect the real browser workflow, and prepare the demo assets and repository documentation. We directed the product, reviewed results, and approved consequential account and publication actions.

The application uses **Next.js, React, and TypeScript**, with **Neon Postgres** for persistent reports, sessions, and review records. Shared scanning logic supports the web application, a CLI, and an MCP server for agent workflows.

The dependency scanner matches exact package versions against **OSV advisory data**. For AI-assisted review, we integrated **NVIDIA Nemotron 3 Super (`nvidia/nemotron-3-super-120b-a12b`) through Nebius Token Factory**. Scanner evidence remains authoritative, and invalid model output falls back to scanner-authored notes.

GitHub OAuth handles identity, while a separate GitHub App provides access to selected repositories. **Vercel Sandbox** runs baseline and patched tests in temporary environments, keeping repository execution separate from scanning.

Codex helped us build and verify the product; Nemotron on Nebius powers the application's demonstrated AI-assisted finding review.

## Challenges we ran into

The biggest challenge was making the complete workflow reliable across several independent systems: repository access, scanning, model inference, sandbox execution, and pull-request publication.

A user being signed into GitHub did not mean the application had permission to repair their repository. We had to handle identity and repository authorization separately and make failures understandable.

We also needed to make scan progress useful. A "worker queued" message gave users little information, so we improved the hosted flow to expose stages of the scan.

Another challenge was deciding how much authority to give AI. Security explanations can sound convincing without being supported. We constrained Nemotron's output to approved scanner notes and kept severity, verdicts, and repair acceptance outside model control.

Finally, we insisted on demonstrating a real repair rather than stopping at a proposed patch. That meant checking baseline tests, patched tests, the generated lockfile, the dependency rescan, and the actual GitHub diff.

## Accomplishments that we're proud of

We completed and recorded a real workflow using an authenticated account and a fresh public demo repository:

- Scanned the repository and reviewed five dependency advisories.
- Ran a separate manifest scan through Nemotron on Nebius, producing **five validated note selections with zero fallbacks**.
- Prepared a **lodash upgrade from 4.17.20 to 4.18.1**.
- Passed the project's tests before and after the update.
- Reduced the dependency advisory count from **five to zero** in the verification scan.
- Published a human-approved draft PR changing only the manifest and lockfile.

The [draft pull request](https://github.com/chilu18/shiptested-fresh-judge-demo/pull/1) and [2:45 narrated demonstration](https://youtu.be/JDITvuA2lD8) make that result inspectable. The zero-advisory result applies to the scanned dependencies; it is not a claim that the entire application is secure.

## What we learned

We learned that a useful security product must explain both its findings and its limits. An incomplete check should remain visible, and a passing test should never stand in for a check that was not performed.

We also learned that AI does not need unrestricted control to be useful. Giving Nemotron a bounded role lets it assist with review while preserving traceable evidence and predictable decisions.

Building with Codex reinforced the importance of testing the actual user journey. Generated code, a successful build, and a working end-to-end product are different milestones. We used automated checks and real browser interactions to establish what worked.

Most importantly, a suggested fix and a verified repair are different deliverables. Connecting the patch to tests, a fresh dependency scan, and explicit human approval made the workflow much more meaningful.

## What's next for ShipTested.com

Our next priorities are broader repair coverage, easier repository onboarding, and stronger evaluation across diverse real-world projects.

We plan to support more dependency ecosystems and lockfile formats, improve recovery from interrupted scans, and make verification evidence easier for teams to review together. We also want to expand our evaluation benchmark to measure the usefulness and reliability of AI-assisted notes.

We are exploring a future **Reverse Engineer** workspace for controlled static and dynamic analysis in isolated environments. This is a planned extension, not part of the current demonstrated feature set.

Our direction remains the same: help developers understand what was checked, verify supported fixes, and stay in control of what ships.
