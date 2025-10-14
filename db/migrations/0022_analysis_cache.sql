-- Analysis cache table for cooldown tracking and result caching
CREATE TABLE IF NOT EXISTS analysis_cache (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  analysis_type TEXT NOT NULL,
  inputs_hash TEXT NOT NULL,
  result_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_analysis_cache_job ON analysis_cache(job_id);
CREATE INDEX IF NOT EXISTS idx_analysis_cache_type ON analysis_cache(analysis_type);
CREATE INDEX IF NOT EXISTS idx_analysis_cache_created ON analysis_cache(created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_analysis_cache_unique ON analysis_cache(job_id, analysis_type, inputs_hash);

