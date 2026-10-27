# Hosted workflow implementation and evidence ledger

Goal: GitHub account → authorised repository → bounded scan → private saved report → team review → usage accounting and paid capacity.

## Acceptance gates (registered before implementation)

1. Identity and access: two accounts cannot read each other's private repositories, jobs or reports; tests exercise forged workspace IDs, revoked sessions and missing membership.
2. Repository ingestion: only GitHub API hosts, immutable commit snapshots, bounded supported files, no repository code execution; fixtures cover invalid URLs, private access denial, monorepos and incomplete coverage.
3. Durable jobs: queued/running/completed/failed/cancelled states; idempotent submissions, bounded retries, cancellation and recovery after worker failure; database integration tests.
4. Reports: stable authenticated URL survives a new session; source commit, scanner version and coverage visible; explicit expiring/revocable share link; anonymous and cross-account negative tests.
5. Usage: atomic allowance reservation and idempotent accounting under concurrent submissions; durable terminal outcomes; failed and partial scans distinguished from clean results.
6. Teams and audit: verified membership and role checks; invite/revoke lifecycle; append-only history for scan, share and decision actions; no secrets in event payloads.
7. Billing: server-selected plans/prices, verified idempotent webhook lifecycle, customer portal, failed-payment handling and entitlement enforcement; Stripe test-mode lifecycle evidence before activation.
8. Metrics: account-scoped usage and outcomes plus restricted operational metrics; provider cost marked estimated unless metered; no private source in analytics.
9. Clients: website, authenticated CLI and MCP use the same hosted allowance and access boundary; existing local/self-hosted usage remains possible.
10. Release: typecheck, relevant database/unit tests, builds, browser journey at desktop/mobile and independent-account access checks; production migration and deployment verified separately.

## Delivery order

- PR 1: durable jobs, usage and provenance foundations.
- PR 2: GitHub ingestion, worker execution and private report journey.
- PR 3: workspace memberships, report sharing and audit events.
- PR 4: usage dashboard, operational metrics and authenticated clients.
- PR 5: subscription checkout, webhook reconciliation and quota enforcement.
- PR 6: self-hosting/licensing documentation, browser acceptance and deployment.

## Existing licence and rights

The root and published packages currently carry MIT licences. Preserve existing copyright and licence notices. Existing releases remain available under their supplied licence; do not claim exclusivity or remove Louise's attribution.

MIT permits commercial hosted services and commercial redistribution with its notice conditions. A future network-copyleft approach (such as AGPL for appropriate new server code) needs an explicit scope and rights review before changing any licence. Do not substitute a custom noncommercial restriction and call it open source. No licence change has been made in this milestone.

References: https://opensource.org/license/mit and https://www.gnu.org/licenses/agpl-3.0.html

## Current evidence

- Inventory: existing GitHub OAuth, actor-scoped stored scans, quotas and repair audit exist; they are not yet a complete customer workspace or billing system.
- Pending: all ten end-to-end gates above. Nothing in this ledger is a completion claim or production activation.

### Foundation checkpoint

- Added idempotent allowance reservations, actor/workspace isolation, immutable commit identities, queued cancellation, worker leases, fencing and three-attempt recovery.
- Migration runner now includes ordered idempotent schema files. Migration 002 has only been exercised in local PGlite; no hosted database migration has run.
- Verified: 14 tests across `scan-jobs.test.ts` and existing `storage.test.ts`; `npx tsc --noEmit`; `npm run build`; `git diff --check`.
- No HTTP endpoint exposes these jobs yet. No worker is scheduled and no subscription or payment is activated.
- Reservation policy in this foundation counts accepted attempts, including cancellation; billing/refund policy must be connected explicitly before charging customers.
