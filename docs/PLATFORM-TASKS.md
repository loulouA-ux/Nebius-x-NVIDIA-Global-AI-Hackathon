# ShipTested platform delivery steps

Commit/PR sequence,27 October2026. Website remains at repository root. Existing production safety boundaries remain.

1. Shared core: extract parser, masking, severity/fix selection and verdict; OSV allowlisted bounded transport; real stage events; golden parity and cancellation/failure tests. PR to the current integration branch (stacked until PR5 merges).
2. Core optional AI entry: BYOK notes only; cannot mutate findings/verdict; test failure and identity boundaries.
3. CLI: scan/explain/mcp/help/version; exit codes, JSON,SARIF, stages, quiet/colour; schema and installed-tarball tests.
4. Local MCP: official SDK, schemas, structured results, safe local paths, stage progress, optional BYOK tool; client integration tests.
5. Remote MCP: stateless Streamable HTTP, deterministic only, input/package/time bounds, OSV allowlist, per-IP rate limits, no content logs, health/connect page; adversarial integration checks.
6. Docs: generated command/schema/type references, real fixture-run examples, privacy/verdict/source/AI/self-hosting guides; verified client setup instructions. Never claim client marketplace approval.
7. Developer portal: honest install/connect/status; optional playground only after remote limits pass. No fake stats, accounts or keys.
8. Package preparation: npm pack and publish dry-run, file lists and real local-tarball execution; Peter performs actual npm publishing.
9. Hosting: Peter approved first production deployments on 27 October; all three apps are public on Vercel aliases. Exact custom-domain DNS records remain Peter’s step.
10. Landing/nav: expose only verified availability and working links; publication flag remains off until npm registry confirms publication. Client badges describe verified setup, not endorsements.
11. Integration/release evidence: cross-surface parity, browser/accessibility/build checks, recordings, PRs and platform report. No main merge, npm publish or DNS changes without the existing required human step.

Core acceptance: identical deterministic functions are imported by web/core; offline fixtures exercise blocked/review/incomplete/clear; OSV failure cannot become clear; secret values never persist in output; real stage events and abort handling verified. CLI/MCP parity uses the same fixture and bounded advisory responses. Live recorded examples are labelled with retrieval time and source, not hand-authored results.

## Status, 27 October 2026

- Steps 1–8: built, locally tested, committed and stacked in PRs 6–13. npm publication remains Peter’s gate.
- Step 9: MCP, docs and developer portal deployed to production with explicit approval; public hosted scan and playground verified. Custom-domain DNS pending.
- Step 10: landing/nav/agent availability built and tested in PR14 preview; main-site production unchanged.
- Step 11: hosted accessibility, Lighthouse, package/CLI/MCP evidence and recordings saved in `docs/platform/verification`; see `docs/PLATFORM-REPORT.md` for exact limits and human release gates.
- Not claimed: full workspace coverage, global rate limits, marketplace approval, npm publication or main merge.

- PR15 closes the remote progress gap: actual stage events reach the playground before completion; response cancellation cancels upstream work. Hosted UI checks pass in both themes at desktop/phone widths. Website scan SSE remains the separate stretch item.
