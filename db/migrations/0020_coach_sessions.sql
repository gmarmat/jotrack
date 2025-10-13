-- Coach Mode sessions table to store user progress
CREATE TABLE IF NOT EXISTS coach_sessions (
  job_id TEXT PRIMARY KEY,
  data_json TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_coach_sessions_updated ON coach_sessions(updated_at);

