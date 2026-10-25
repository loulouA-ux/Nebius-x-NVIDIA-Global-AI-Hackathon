CREATE TABLE IF NOT EXISTS sc_sessions (
 token_hash text PRIMARY KEY, actor_id text NOT NULL, workspace_id text NOT NULL,
 credential_hash text NOT NULL, expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sc_session_expiry ON sc_sessions(expires_at);
CREATE TABLE IF NOT EXISTS sc_projects (
 id uuid PRIMARY KEY, workspace_id text NOT NULL, owner_id text NOT NULL,
 name text NOT NULL CHECK(length(name) BETWEEN 1 AND 80), hostname text NOT NULL,
 challenge jsonb NOT NULL, proof_method text CHECK(proof_method IN ('dns','file')),
 verified_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(id, workspace_id, owner_id)
);
CREATE TABLE IF NOT EXISTS sc_scans (
 id uuid PRIMARY KEY, workspace_id text NOT NULL, owner_id text NOT NULL,
 project_id uuid, report jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(id,workspace_id,owner_id),
 FOREIGN KEY(project_id,workspace_id,owner_id) REFERENCES sc_projects(id,workspace_id,owner_id)
);
CREATE TABLE IF NOT EXISTS sc_decisions (
 id uuid PRIMARY KEY, scan_id uuid NOT NULL, workspace_id text NOT NULL, owner_id text NOT NULL,
 finding_id text NOT NULL, action text NOT NULL CHECK(action IN ('acknowledge','dismiss')),
 reason text NOT NULL CHECK(length(reason) <= 1000), created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(scan_id,workspace_id,owner_id) REFERENCES sc_scans(id,workspace_id,owner_id)
);
CREATE TABLE IF NOT EXISTS sc_quotas (
 bucket text NOT NULL, window_start bigint NOT NULL, used integer NOT NULL,
 PRIMARY KEY(bucket,window_start)
);

CREATE TABLE IF NOT EXISTS sc_research_cache (
 cache_key text PRIMARY KEY, value jsonb NOT NULL, expires_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS sc_oauth_transactions (
 state_hash text PRIMARY KEY, verifier text NOT NULL, browser_hash text NOT NULL,
 expires_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS sc_github_accounts (
 github_id text PRIMARY KEY, login text NOT NULL, disabled boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sc_repairs (
 id uuid PRIMARY KEY, owner_id text NOT NULL, workspace_id text NOT NULL,
 state text NOT NULL CHECK(state IN ('proposed','running','verified','failed','publishing','published')),
 snapshot jsonb NOT NULL, plan jsonb NOT NULL, result jsonb, pr_url text,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sc_repairs ADD COLUMN IF NOT EXISTS publication_commit text;

CREATE TABLE IF NOT EXISTS sc_repair_events (
 sequence bigserial UNIQUE NOT NULL,
 id uuid PRIMARY KEY, repair_id uuid NOT NULL REFERENCES sc_repairs(id),
 actor_id text NOT NULL, workspace_id text NOT NULL,
 event_type text NOT NULL CHECK(event_type IN ('proposal_created','verification_started','verification_passed','verification_failed','patch_approved','publication_commit_created','draft_pr_created','draft_pr_reconciled')),
 details jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sc_repair_event_history ON sc_repair_events(repair_id,sequence);
