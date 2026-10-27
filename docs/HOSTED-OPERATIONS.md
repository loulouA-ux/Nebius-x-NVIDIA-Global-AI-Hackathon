# Hosted workflow: development and release operations

Status: implementation branch, not an activated hosted service. The public production application remains a recorded demo. Current code forces production demo mode even if `SHIPTESTED_PUBLIC_DEMO=0`; changing that guard is a separate release step, after the acceptance gates in HOSTED-WORKFLOW.md pass.

## Development setup

1. Use Node 22, `npm ci` and `npm run build:packages`.
2. Configure a dedicated development Neon database privately in `.env.local`. Confirm its project and branch in Neon before running `npm run db:migrate`; never infer development isolation from the filename. The migration command applies all numbered plain SQL migrations in one transaction. Take a provider backup/branch before a production migration.
3. Configure GitHub OAuth with this development origin and `/api/auth/github/callback`. Keep a small numeric user allowlist in `SHIPTESTED_GITHUB_MEMBER_IDS`; use two distinct test identities. Keep open registration off until abuse handling and customer onboarding are reviewed.
4. For private repositories, install the configured GitHub App only on selected repositories and configure the administrator-owned actor-to-installation mapping. General customer installation onboarding is not implemented yet. Identity OAuth alone does not authorize private repository reads.
5. Start the app with `npm run dev`. A second terminal can run `node --env-file=.env.local --import tsx scripts/repository-worker.ts` to process one queued job. Jobs are durable, lease-fenced and limited to three attempts. Scans read bounded manifests; they do not execute repository code.
6. Test the complete account → repository → queued job → persisted report journey. Sign out and sign back in to confirm the report URL persists. A second account must get a denial for that private report. Test explicit share creation, expiry, revocation, disabled owner and seat loss separately.

## Trusted scheduling

`GET /api/internal/worker` handles scan work; `GET /api/internal/billing-worker` handles billing reconciliation. Both require `Authorization: Bearer <CRON_SECRET>` with a privately generated secret of at least 32 characters. Do not put this secret in URLs or browser code. No recurring schedule is currently configured.

Configure schedules only on the intended hosted service after identifying its database and verifying public-demo mode is off there. HTTP handlers record worker execution outcomes in `sc_worker_runs`. Each invocation processes at most one job; capacity and backlog monitoring must be measured before offering throughput guarantees. Inspect queued age and repeated worker failures, not just HTTP health. Provider/hosting spend is not yet metered.

## Stripe test configuration

Peter selected HeySalad US, with Team priced at GBP 3 per seat monthly. This is a billing-account decision, not evidence that the connected account has been verified. Stripe reconnection and provider-side test configuration remain outstanding.

Use a test API key with only the permissions required by checkout, customer, subscription, Price and portal operations. Configure an active GBP 300 licensed monthly Price, customer portal and signature-verified webhook endpoint `/api/billing/webhook`. Keep `SHIPTESTED_BILLING_LIVE=0`. Verify currency/account configuration rather than substituting USD. The provisional allowance is five scans per seat per month; overages, AI research and sandbox execution are excluded.

Run a real test checkout, verify the paid invoice and reconciled allowance, then test duplicate events, renewal, failed payment, quantity reduction, cancellation and portal access. The checkout return page never grants seats. Paid capacity comes only from server reconciliation. Live activation, taxes and customer-facing terms need an explicit release review; no real charges are enabled by these instructions.

## CLI, SDK and local MCP

The implementation branch adds the `@heysalad/shiptested/hosted` export and CLI `repo`, `job`, `report`, `usage` commands. These additions have not been published to npm. Build from this checkout for testing; do not assume the existing public 0.1.0 packages contain them.

Create an agent token in `/team`, select read-only or scan permission, and save it privately as `SHIPTESTED_API_TOKEN`. Configure `SHIPTESTED_API_ORIGIN` to the fixed service origin. Tokens expire after 30 days and are revocable. They cannot manage billing, teammates or other tokens. Scan permission consumes the same workspace allowance as the website.

Local MCP uses the same environment variables to enable its managed tools; the anonymous public MCP never receives account tokens. `scan_repository` requires a UUID request key, reused when retrying the same operation. A successful queue response is not a security verdict. Poll the job and inspect the final report's completeness and coverage.

## Release and recovery

Keep schema, package and app versions aligned. Build, typecheck and test before a reviewable PR. Verify a protected hosted deployment with actual authentication and a dedicated database before changing public production. Preserve old reports and audit history during rollback; rolling back code is not permission to drop tables or reset allowances. Revoke a compromised agent token immediately, disable the affected account if necessary, and retain token-free audit evidence.
