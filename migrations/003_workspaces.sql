CREATE TABLE IF NOT EXISTS sc_workspaces (
 id text PRIMARY KEY, owner_id text NOT NULL,
 name text NOT NULL CHECK(length(name) BETWEEN 1 AND 80),
 plan text NOT NULL DEFAULT 'free' CHECK(plan IN ('free','team')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sc_workspace_members (
 workspace_id text NOT NULL REFERENCES sc_workspaces(id), actor_id text NOT NULL,
 role text NOT NULL CHECK(role IN ('owner','admin','member')),
 created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(workspace_id,actor_id)
);
