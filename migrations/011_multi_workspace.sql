-- Migrate existing installation choices without widening repository access.
CREATE TABLE IF NOT EXISTS sc_repository_installations (
 workspace_id text NOT NULL,actor_id text NOT NULL,installation_id bigint NOT NULL CHECK(installation_id>0),
 PRIMARY KEY(workspace_id,actor_id,installation_id),
 FOREIGN KEY(workspace_id,actor_id) REFERENCES sc_repository_connections(workspace_id,actor_id) ON DELETE CASCADE
);
INSERT INTO sc_repository_installations(workspace_id,actor_id,installation_id)
 SELECT workspace_id,actor_id,installation_id FROM sc_repository_connections WHERE installation_id IS NOT NULL ON CONFLICT DO NOTHING;
