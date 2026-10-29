# Workspace authentication review — 29 October 2026

Status: implemented and tested locally; not committed or deployed.

## Acceptance and evidence

- Return to the originating workspace page after GitHub or access-key sign-in: allowlisted destinations, callback unit tests and desktop/mobile browser tests pass. Query strings are deliberately discarded; filter restoration is not included.
- Recover from cancelled, expired and unavailable OAuth callbacks: same-origin recovery screen, transient cookie cleanup and no reflected provider messages or authorization codes; six callback tests pass.
- Sign-out shows progress, retains recovery after failure and confirms success: browser test covers a failed DELETE followed by a successful retry. Successful sign-out clears in-memory reports and replaces the current history entry.
- Preserve security: identity scope remains read:user; existing origin checks, PKCE, one-use state and server-side session revocation remain in place. Invalid/external return paths fall back to Reports. Production demo restrictions and Vercel protection are unchanged.
- Sidebar account controls: explicit signed-out state, correct GitHub account label, retry action, active Team/Usage links and separated account area.
- Desktop/mobile appearance: inspected rendered sign-in at 1280px and 390px, in light and dark themes. Removed the oversized decorative scene so the primary action appears earlier.

## Verification

- `npm run build`: passed, including TypeScript checks.
- `npm test`: 386 tests passed across 53 files.
- Focused browser suite: 30 passed, covering authentication, accessibility, repository selection, report decisions, repairs and responsive layouts.
- Initial browser pass caught two locator issues: the retry button changed the error text node, and the identity assertion matched the hidden sidebar as well as the visible content. Error text now has its own span; the identity assertion targets the visible main content. The final affected suite passed.
- Hosted baseline: GitHub sign-in succeeded as the existing chilu18 account without a new grant; sign-out removed member reports, and a second sign-in restored the member session. This tested the existing deployment, not the new local callback changes.

## Limits

No permissions, production deployment, repository scan or repair was started. New OAuth routing was tested with mocked provider/session boundaries locally; a complete hosted OAuth round trip for this revision requires deployment to the protected preview. Multi-tab sign-out synchronization is not added in this change.
