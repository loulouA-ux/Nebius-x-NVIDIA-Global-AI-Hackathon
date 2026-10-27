# Powered by strip verification — 26 October 2026

Fixed the landing-page strip with a three-column desktop grid and full-content-width stacked tiles below 768px. White tiles preserve original SVG colours; labels sit below each tile. Original alt text and the AI providers aria-label are retained.

- All three SVG SHA-256 hashes match the handoff logos (asset-hashes.json); public/partners is unchanged.
- Typecheck and production build passed.
- Unit suite: 203 tests passed across 22 files.
- Landing/deep-link and strip Playwright tests: 6 passed.
- Computed logo filter is none for all three logos at all four widths.
- Geometry checks confirm logo containment, separate labels, non-overlapping items and no horizontal document scroll.
- Phone tiles fill their grid's content width, respecting the existing landing-page outer gutters.
- Visually inspected powered-by-1440.png, powered-by-1024.png, powered-by-390.png and powered-by-360.png. These screenshots crop the strip at the stated viewport widths.

Local commit only. No push or deployment.
