# ShipCheck demo walkthrough — Phase 0 draft

This is the product story and a truthful rehearsal path. It is not a claim that the full staging-host workflow is shipped.

## Audience and problem

A small team is about to deploy a release candidate. It wants a quick, evidence-backed view of known dependency risks and a staging site it controls, without granting a scanner broad access or handing remediation decisions to an AI model.

## Working local demo today

1. Open ShipCheck and select **Explore the demo**. Say that the fixture contains synthetic data and a dated OSV advisory snapshot; it makes no live provider calls.
2. Show the blocked report and its three findings. Open a finding to show the evidence and manual action. Point out that the displayed synthetic credential is masked.
3. Show the coverage states. Explain that an offline snapshot or incomplete provider check cannot produce a clean pass.
4. Open **New scan** and show supported exact-version manifests. A live manifest scan sends package names and versions to OSV; optional Tavily/Nemotron calls require private keys and still need live acceptance.
5. Open **Project setup**. Show the exact-host and DNS/well-known proof flow as planned work. The screen explicitly says verification and staging scans are pending.

## Target judging flow after core implementation

Create a project → verify the exact staging hostname → scan a supported manifest and the verified host → inspect OSV and passive-host evidence → see recent Tavily sources and a bounded Nemotron explanation → acknowledge or dismiss a finding without changing the scanner verdict. The demo must show source dates, unknowns, and the result of each provider separately.

## Demo readiness checks

- Peter records one successful live Tavily call and one NVIDIA model call through Nebius Token Factory, with model ID and failure behavior.
- The team agrees the app host, persistent storage, actor/session boundary and resettable public demo path.
- Louise and Peter rehearse the target flow from a clean browser using only synthetic inputs. Any missing capability is labelled as such in the script and UI.
- Choose the submission track by 29 October. Submit by the team target of noon London on 30 October; the official cutoff is 17:00 London.
