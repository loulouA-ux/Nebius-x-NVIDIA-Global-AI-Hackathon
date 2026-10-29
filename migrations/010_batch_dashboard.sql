-- A private selection manifest; registration does not enqueue or reserve scans.
CREATE TABLE IF NOT EXISTS sc_batch_plans (
 id uuid PRIMARY KEY,
 workspace_id text NOT NULL REFERENCES sc_workspaces(id),
 owner_id text NOT NULL,
 title text NOT NULL CHECK(length(title) BETWEEN 1 AND 120),
 entries jsonb NOT NULL CHECK(jsonb_typeof(entries)='array' AND jsonb_array_length(entries) BETWEEN 1 AND 500),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sc_batch_plans_owner ON sc_batch_plans(workspace_id,owner_id,created_at DESC);
