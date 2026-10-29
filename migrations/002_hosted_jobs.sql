CREATE TABLE IF NOT EXISTS sc_scan_allowances (
 workspace_id text NOT NULL, period_start date NOT NULL,
 scan_limit integer NOT NULL CHECK(scan_limit >= 0),
 reserved integer NOT NULL DEFAULT 0 CHECK(reserved >= 0 AND reserved <= scan_limit),
 PRIMARY KEY(workspace_id,period_start)
);
CREATE TABLE IF NOT EXISTS sc_scan_jobs (
 id uuid PRIMARY KEY, workspace_id text NOT NULL, owner_id text NOT NULL,
 request_key text NOT NULL, repository text NOT NULL, commit_sha text NOT NULL,
 state text NOT NULL DEFAULT 'queued' CHECK(state IN ('queued','running','completed','failed','cancelled')),
 period_start date NOT NULL, report_id uuid, failure_code text,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(workspace_id,owner_id,request_key),
 FOREIGN KEY(workspace_id,period_start) REFERENCES sc_scan_allowances(workspace_id,period_start),
 FOREIGN KEY(report_id,workspace_id,owner_id) REFERENCES sc_scans(id,workspace_id,owner_id)
);
CREATE INDEX IF NOT EXISTS sc_scan_job_queue ON sc_scan_jobs(state,created_at);
ALTER TABLE sc_scan_jobs ADD COLUMN IF NOT EXISTS lease_token uuid;
ALTER TABLE sc_scan_jobs ADD COLUMN IF NOT EXISTS lease_expires_at timestamptz;
ALTER TABLE sc_scan_jobs ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 3);
ALTER TABLE sc_scan_jobs ADD COLUMN IF NOT EXISTS tree_sha text;
ALTER TABLE sc_scan_jobs ADD COLUMN IF NOT EXISTS private_repository boolean NOT NULL DEFAULT false;
