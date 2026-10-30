# Devpost image captions

Upload the three PNGs in `png/`, in the order below. These are unmodified architecture diagrams dated 28 October 2026. The later live demo is separate execution evidence.

## 01-hosted-repository-scanning.png

**Hosted scanning infrastructure.** Authenticated requests become durable jobs in Neon. A separate Node.js worker reads a pinned GitHub snapshot, runs deterministic dependency checks with OSV, and saves workspace-scoped reports and progress. Repository code is not executed during scanning. Architecture snapshot: 28 October 2026.

## 02-enriched-scan-and-repository-batch.png

**Where NVIDIA Nemotron and Nebius fit.** The manifest scan can use optional Tavily research and NVIDIA Nemotron on Nebius Token Factory to select validated scanner notes. Deterministic rules retain control of the verdict. The repository batch path runs dependency checks without Tavily or Nemotron; the demo shows the AI-enabled manifest scan separately. Architecture snapshot: 28 October 2026.

## 03-repair-verification-and-approval.png

**From a finding to a reviewed repair.** A supported npm patch is verified in Vercel Sandbox, with baseline/patched tests and dependency rescanning. A human approves the exact patch before a draft GitHub PR is created. This diagram preserves the 28 October permission/status labels. The 30 October demo subsequently completed this workflow using a separately authorized repair App; nothing was automatically merged or deployed.
