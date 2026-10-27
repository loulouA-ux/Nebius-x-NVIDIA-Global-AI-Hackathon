# Phase 1 — ShipTested

Verified 27 October 2026. Typecheck and 224 unit tests pass; isolated secret-free build passes; all 58 browser tests pass. Twelve captures cover landing, report and sign-in at 1440×900 and 390×844 in both themes. All supplied top-level SVG files match the handoff byte-for-byte; existing asset aliases use those same bytes.

User-facing product strings, exports, metadata, package name and wordmark use ShipTested. The new SHIPTESTED_* variables take precedence, with a once-per-name warning for legacy aliases; values are never logged.

Kept for compatibility: shipcheck_session and shipcheck_github_flow cookies; shipcheck-team workspace ID; shipcheck-theme storage; shipcheckView history state; shipcheck:decision-recorded and shipcheck:session-expired internal events; shipcheck-repair-* branch references and sandbox labels. Existing database tables, sc_ key format and agent-shielda= host proofs remain unchanged. Archived operational documentation and recorded evidence retain historical names. New logo filenames follow the supplied shiptested-* assets despite the stale filenames in BRAND.md's asset table.

The browser suite previously depended on private database configuration for the invalid-key UI test. That test now supplies a deterministic 401 response; real invalid-key rejection remains covered by storage/session tests. File-limit assertions select the relevant alert when an independent missing-database alert is present. Limits and rejection expectations are unchanged.

No push, deployment or settings change.
