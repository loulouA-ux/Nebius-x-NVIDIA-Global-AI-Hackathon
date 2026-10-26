# ShipCheck SaaS interface references

Reviewed 26 October 2026. These are relevant developer-product references, not a claimed ranking of the best-performing SaaS companies.

- [Linear UI design review](https://linear.app/now/how-we-redesigned-the-linear-ui): consistent sidebar/header alignment, calm navigation, compact lists, separate evidence/detail region. Official reference imagery reviewed in browser.
- [Vercel deployment resources](https://vercel.com/docs/deployments#resources-tab-and-deployment-summary): search adjacent to technical resources, grouped deployment detail, restrained status presentation. Official documentation screenshots reviewed in browser.

## Applied direction

Preserve ShipCheck's code/check logo, Figtree, navy, blue, teal and mint. Read in order: workspace identity, page task, scan context, findings, evidence. Keep operational screens compact and evidence readable. Group controls in 8–12px intervals, separate sections by 24px, and preserve 44px interaction targets. Mobile uses a two-column filter grid with full-width search and the existing bottom navigation. The sidebar scrolls independently on short desktop viewports.

Refine the shared header/account strip, align dashboard and repairs, constrain setup form measure, reduce welcome/sign-in decoration, and tighten action/findings spacing. Preserve auth, source evidence, review decisions, browser history, explicit repair approval and uncertain-publication recovery.

## Acceptance

Production build and browser regression suite; desktop/mobile screenshots covering empty, report, findings, evidence, scan, project, sign-in, missing route and repair states. Test data is synthetic; UI tests do not establish live provider or production deployment status. Reference screenshots are kept outside application assets; no third-party branding was copied into the product.
