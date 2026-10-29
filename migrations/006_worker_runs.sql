CREATE TABLE IF NOT EXISTS sc_worker_runs (
 id uuid PRIMARY KEY, kind text NOT NULL CHECK(kind IN ('scan','billing')),
 state text NOT NULL CHECK(state IN ('running','completed','failed')),
 started_at timestamptz NOT NULL DEFAULT now(), finished_at timestamptz,
 duration_ms integer, processed boolean
);
CREATE INDEX IF NOT EXISTS sc_worker_runs_latest ON sc_worker_runs(kind,started_at DESC);
