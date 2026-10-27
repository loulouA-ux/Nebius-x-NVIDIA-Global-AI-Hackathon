# Cross-engine stamp fix

27 October2026, Europe/London. Follow-up to PR5.

The positioning transform and CSS animation now live on separate nested SVG groups for desktop/phone stamps. The same collision existed on MarkScene's small boat and is also separated. Existing width constraints remain.

Audit: buoy placement is attribute-only; ping animation is on its circle child. Lighthouse phone translation is on an outer group; beam animation is on an inner group. Voyage boat positioning/transition is CSS-only, with bobbing on a child (no transform attribute collision). Moments use HTML positioning; DryDock patch/flag use CSS motion without transform attributes. No further attribute/CSS transform collisions found in these components.

Verification: TypeScript,254 unit tests and production build passed. Initial cross-engine geometry matrix passed96 checks (8 widths ×2 themes ×3 engines ×2 DPR). Final run also adds a no-mixed-transform assertion and the existing Chromium public-demo regressions. Screenshots are generated per project in Playwright test-results.

Release: Peter's latest direct message authorizes live deployment and ATR updates; PR5 remains unmerged. Rollback recorded before release: `vercel rollback dpl_D9K3WZYjpmnMtQJF8CDsr4sgiPJ1 --scope hey-salad-inc`. No production env/protection changes or main merge.

Safari.app WebDriver could not start because Allow Remote Automation is disabled. Do not call WebKit automation a Safari.app pass. Actual Chrome plus WebKit production checks will be recorded separately.
