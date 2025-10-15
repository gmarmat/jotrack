-- ATS Signals Schema
-- Stores both standard and dynamic signals, plus their evaluation results

-- Store ATS signal definitions (both standard and dynamic)
CREATE TABLE IF NOT EXISTS ats_signals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('technical', 'experience', 'soft')),
  type TEXT NOT NULL CHECK(type IN ('ats_standard', 'dynamic')),
  base_weight REAL NOT NULL DEFAULT 0.5 CHECK(base_weight >= 0 AND base_weight <= 1),
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Store job-specific dynamic signals
CREATE TABLE IF NOT EXISTS job_dynamic_signals (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  signal_id TEXT NOT NULL,
  adjusted_weight REAL NOT NULL DEFAULT 0.5 CHECK(adjusted_weight >= 0 AND adjusted_weight <= 1),
  reasoning TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Store signal evaluation results (versioned by analysis run)
CREATE TABLE IF NOT EXISTS signal_evaluations (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  signal_id TEXT NOT NULL,
  
  -- Version tracking
  resume_version INTEGER,
  jd_version INTEGER,
  analysis_run_at INTEGER NOT NULL DEFAULT (unixepoch()),
  
  -- Scores
  jd_score REAL CHECK(jd_score >= 0 AND jd_score <= 1),
  resume_score REAL CHECK(resume_score >= 0 AND resume_score <= 1),
  overall_score REAL CHECK(overall_score >= 0 AND overall_score <= 1),
  
  -- Evidence and reasoning
  jd_evidence TEXT,
  resume_evidence TEXT,
  ai_reasoning TEXT,
  
  -- Metadata
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_ats_signals_category ON ats_signals(category);
CREATE INDEX IF NOT EXISTS idx_ats_signals_type ON ats_signals(type);
CREATE INDEX IF NOT EXISTS idx_ats_signals_active ON ats_signals(is_active);
CREATE INDEX IF NOT EXISTS idx_job_dynamic_signals_job ON job_dynamic_signals(job_id);
CREATE INDEX IF NOT EXISTS idx_signal_evaluations_job ON signal_evaluations(job_id);
CREATE INDEX IF NOT EXISTS idx_signal_evaluations_signal ON signal_evaluations(signal_id);
CREATE INDEX IF NOT EXISTS idx_signal_evaluations_versions ON signal_evaluations(job_id, resume_version, jd_version);

