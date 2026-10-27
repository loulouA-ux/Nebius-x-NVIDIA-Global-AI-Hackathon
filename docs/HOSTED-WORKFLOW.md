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

### Repository execution checkpoint

- Added GitHub URL normalisation, anonymous public-repository reads and server-bound private installation checks; pinned commit/tree identity and Git blob integrity validation; bounded manifest-only retrieval. No repository code executes.
- Supported manifest aggregation preserves per-file findings and reports skipped or unsupported formats as incomplete. Saved provenance includes repository, commit, scanner version and file coverage.
- Added authenticated enqueue/status/cancel routes, a trusted one-shot worker, and atomic fenced report persistence. Existing private report routes can read the result under the same actor/workspace boundary.
- Verified: 293 unit/database tests; typecheck; production build. Public-demo API guard now exercises 22 handlers, including all three new handlers, with no external calls.
- Live GitHub + OSV evidence: nicedeck at `2bb5203218e88f2993ec0d96dcd997d3ba86e96e`, two requirements files, four direct dependencies, zero returned findings. Local report: `../outputs/nicedeck-hosted-pipeline-2026-10-27/report.json`. This is not a hosted customer report or a whole-repository security audit.
- Still required: UI integration, scheduled worker hosting, provisioning, team lifecycle, sharing, metrics, paid entitlements and full hosted acceptance. Production remains demo-only.

### Customer scan UI and personal workspace checkpoint

- GitHub URL input, private installation option, remaining allowance, queued cancellation, polling and report links are connected to the new API routes. A job ID in the URL restores status after reload; a lost submission response reuses its request key in the mounted form.
- Reports display repository/commit provenance and scanned/omitted files. GitHub OAuth provisions a personal workspace, owner membership and five free scans without resetting usage at sign-in. Open registration requires `SHIPTESTED_OPEN_REGISTRATION=1`; this flag has not been activated on a hosted deployment.
- Verified: 294 unit/database tests, typecheck and production build; eight focused browser checks, then the strengthened two-test repository flow (including private report navigation and reload) passed. Browser APIs are fixtures; this proves UI behavior, not hosted account integration. Mobile screenshot inspected; captures retained in `../outputs/hosted-workflow-ui/`.
- Peter selected **GBP 3 per seat per month** for Team. Working allowance assumption: five repository scans per seat per month, configurable, overages disabled, AI and sandbox execution excluded. Payments remain unconfigured/test-only until verified.
- Remaining: actual scheduled worker and hosted migration, team invitations/roles and shared access, revocable report sharing, billing lifecycle, metrics dashboard, authenticated hosted CLI/MCP, and end-to-end hosted acceptance. Public production is unchanged.

### Team access and explicit report sharing checkpoint

- Targeted seven-day invitations bind to numeric GitHub identities. Only owners manage invitations/removals; accepting consumes an available Team seat atomically. Switching workspaces validates membership. Removal deletes active workspace sessions; each subsequent GitHub session check revalidates membership.
- Report owners can create/revoke seven-day read-only links. Tokens are stored hashed and are carried in the browser fragment/POST body, not ordinary request URLs. Report evidence remains owner-private until explicitly shared. Team membership alone does not expose another member's reports.
- Added workspace settings, seat display, invitation acceptance and audit history; shared-report rendering omits mutation actions. Audit rows omit tokens and are protected against ordinary UPDATE/DELETE statements by database rules (not tamper-proof against a database administrator).
- Verified: 298 unit/database tests, typecheck and build; five focused browser tests and a final three-test sharing run pass. Captures: `../outputs/hosted-workflow-sharing/`. Browser responses are fixtures; database tests exercise real PGlite/Postgres semantics.
- Not deployed. Billing must reconcile Team plan and seat limits before real customers can invite teammates. Hosted lifecycle, client authentication, metrics and billing gates remain open.

### Billing backend checkpoint

- Added Stripe SDK 23.0.1 (registry-verified version), owner-only checkout/portal routes, a bounded raw-body signature-verified webhook and a trusted reconciliation worker.
- Configured Price must be active, GBP 300 minor units per licensed seat per month and match test/live mode. Live keys are rejected without explicit `SHIPTESTED_BILLING_LIVE=1`. No automatic tax or overages are enabled.
- Signed events only mark a known customer for reconciliation. The worker fetches current subscription state, requires active status and a paid latest invoice for paid seats, and uses a lease/revision to retain events that arrive during processing. Duplicate webhook IDs do not duplicate grants.
- Payment failure/cancellation returns the workspace to free limits, preserves used scans, and removes excess seats/sessions with audit events. Membership access independently checks the current plan and seat ranking. Checkout creation uses a workspace lease, provider idempotency, existing-subscription checks and reuse of an open matching checkout.
- Verified locally: 306 unit/database tests, including real SDK signature checks, event deduplication, lease fencing, seat downgrade and preserved usage; typecheck and build. No Stripe account checkout has been executed, no webhook endpoint configured and no charge enabled.
- External gate: Stripe connector returned reauthentication required. Peter has been asked to reconnect it and choose the billing business account. Credentials must remain private. Remaining configuration: restricted test API key, GBP 3 monthly Price, endpoint secret, customer portal settings and worker scheduling. Live tax/business configuration must be settled before paid activation.
- Provider references read via Stripe CLI: https://docs.stripe.com/billing/subscriptions/overview and https://docs.stripe.com/webhooks . The skill's `/references/billing` URL returned 404; the official subscription guide was used instead.
