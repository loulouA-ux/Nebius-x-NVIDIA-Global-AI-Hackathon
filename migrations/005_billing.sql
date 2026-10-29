CREATE TABLE IF NOT EXISTS sc_billing_accounts (
 workspace_id text PRIMARY KEY REFERENCES sc_workspaces(id), customer_id text UNIQUE,
 subscription_id text, subscription_status text NOT NULL DEFAULT 'unconfigured',
 revision bigint NOT NULL DEFAULT 0, processed_revision bigint NOT NULL DEFAULT 0,
 lease_token uuid, lease_expires_at timestamptz, reconciled_at timestamptz
);
CREATE TABLE IF NOT EXISTS sc_billing_events (
 id text PRIMARY KEY, customer_id text NOT NULL, event_type text NOT NULL,
 received_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE sc_billing_accounts ADD COLUMN IF NOT EXISTS checkout_lease uuid;
ALTER TABLE sc_billing_accounts ADD COLUMN IF NOT EXISTS checkout_lease_expires_at timestamptz;
ALTER TABLE sc_billing_accounts ADD COLUMN IF NOT EXISTS checkout_session_id text;
