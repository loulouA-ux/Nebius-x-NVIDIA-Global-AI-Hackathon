CREATE TABLE IF NOT EXISTS sc_api_tokens (
 id uuid PRIMARY KEY, token_hash text NOT NULL UNIQUE,
 workspace_id text NOT NULL REFERENCES sc_workspaces(id), actor_id text NOT NULL,
 name text NOT NULL CHECK(length(name) BETWEEN 1 AND 80), can_scan boolean NOT NULL DEFAULT false,
 expires_at timestamptz NOT NULL, revoked_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), last_used_at timestamptz
);
