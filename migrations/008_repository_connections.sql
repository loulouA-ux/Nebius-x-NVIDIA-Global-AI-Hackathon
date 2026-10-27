CREATE TABLE IF NOT EXISTS sc_repository_connect_flows (
 state_hash text PRIMARY KEY,workspace_id text NOT NULL REFERENCES sc_workspaces(id),actor_id text NOT NULL,
 verifier text NOT NULL,browser_hash text NOT NULL,expires_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS sc_repository_connections (
 workspace_id text NOT NULL REFERENCES sc_workspaces(id),actor_id text NOT NULL,
 encrypted_token text NOT NULL,expires_at timestamptz NOT NULL,installation_id bigint,
 PRIMARY KEY(workspace_id,actor_id)
);
