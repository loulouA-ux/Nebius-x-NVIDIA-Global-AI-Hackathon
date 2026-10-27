ALTER TABLE sc_workspaces ADD COLUMN IF NOT EXISTS seat_limit integer NOT NULL DEFAULT 1 CHECK(seat_limit>=1);
ALTER TABLE sc_workspaces ADD COLUMN IF NOT EXISTS seats_used integer NOT NULL DEFAULT 1 CHECK(seats_used>=1);
CREATE TABLE IF NOT EXISTS sc_workspace_invites (
 id uuid PRIMARY KEY, workspace_id text NOT NULL REFERENCES sc_workspaces(id),
 invited_actor_id text NOT NULL, token_hash text NOT NULL UNIQUE,
 role text NOT NULL CHECK(role IN ('admin','member')), created_by text NOT NULL,
 expires_at timestamptz NOT NULL, accepted_at timestamptz, revoked_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sc_report_shares (
 id uuid PRIMARY KEY, scan_id uuid NOT NULL, workspace_id text NOT NULL, owner_id text NOT NULL,
 token_hash text NOT NULL UNIQUE, expires_at timestamptz NOT NULL,
 revoked_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(scan_id,workspace_id,owner_id) REFERENCES sc_scans(id,workspace_id,owner_id)
);
CREATE TABLE IF NOT EXISTS sc_workspace_events (
 sequence bigserial PRIMARY KEY, workspace_id text NOT NULL REFERENCES sc_workspaces(id),
 actor_id text NOT NULL, event_type text NOT NULL, subject_id text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE OR REPLACE RULE sc_workspace_events_no_update AS ON UPDATE TO sc_workspace_events DO INSTEAD NOTHING;
CREATE OR REPLACE RULE sc_workspace_events_no_delete AS ON DELETE TO sc_workspace_events DO INSTEAD NOTHING;
