# Navigation and account review — 26 October 2026

- Shared desktop sidebar now spans dashboard and Repairs, with active-page indication.
- Mobile retains bottom navigation and More menu.
- Repairs includes the existing member session and sign-out controls. Saved-scan selection remains on the dashboard.
- Dashboard navigation writes view/report/finding references to browser history. Report content remains in a bounded in-memory cache, not URLs or persistent browser storage.
- Back and Forward restore the viewed finding/report, including across a client-side visit to Repairs. Saved reports absent from memory are loaded through the existing authenticated API. Unavailable reports have an explicit recovery message.
- Sign-out and session expiry clear cached reports. Existing expiry UI remains intact.
- Source/advisory links remain within finding evidence. A new visualisation has not been implemented pending clarification.

Verification: production build including TypeScript passed; 17 browser checks passed, including Back/Forward across Repairs with exactly one scan request. Desktop Repairs screenshot reviewed. No production merge or deployment.
