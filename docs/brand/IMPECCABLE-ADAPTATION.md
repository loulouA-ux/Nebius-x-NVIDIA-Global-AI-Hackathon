# Desktop and mobile adaptation — 26 October 2026

Applied the official pbakaus/impeccable skill v4.7.1, installed to the local Codex skill directory through the skill-installer. Read its adapt and craft-floor guidance. The context launcher returned permission denied, so project context was read directly as directed by the skill. No detector execution or hook installation is claimed.

The approved ShipCheck palette, logo, Figtree typography and slogan remain the visual authority. This is an operational interface, not a replacement marketing identity.

## Implemented
- Desktop: persistent sidebar on wide screens; before/proposed manifest comparison in two columns.
- Tablet: two-column workflow cards, with the review card spanning the row.
- Mobile: bottom navigation with Overview, New scan, Findings, Repairs and More. More exposes Project setup, Recommended actions and member sign-in. Existing actions remain accessible.
- Repair-to-dashboard links select the corresponding view using an allowlisted query parameter.
- Mobile file comparisons stack; bottom padding accounts for the fixed bar and safe areas.
- Decorative heading eyebrows removed from sign-in, first-check hero and not-found.
- Selection/caret colours use brand tokens.

## Verification
- Production build including TypeScript passed.
- All 16 browser checks passed, including 360, 768 and 1440 px layout/flow matrix.
- Mobile screenshot reviewed; no document-level horizontal overflow in the matrix.
- Previous backend suite: 203 passing before this navigation-only pass; not rerun here.
- Physical devices, Safari/iOS and Android browser performance not yet tested. Viewport tests do not prove real touch behaviour.
- No production merge or deployment.
