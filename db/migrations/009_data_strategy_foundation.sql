-- Migration 009: Data Strategy Foundation (v2.7)
-- Artifact variants, user profile, analysis dependencies, extraction queue

-- ========================================
-- User Profile (Singleton for now)
-- ========================================
CREATE TABLE IF NOT EXISTS user_profile (
  id TEXT PRIMARY KEY DEFAULT 'singleton',
  profile_data TEXT NOT NULL DEFAULT '{}',
  skills_accumulated TEXT NOT NULL DEFAULT '[]',
  experiences_accumulated TEXT NOT NULL DEFAULT '[]',
  version INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL,
  CHECK (id = 'singleton')
);

-- Initialize singleton row
INSERT OR IGNORE INTO user_profile (id, updated_at) 
VALUES ('singleton', unixepoch());

-- ========================================
-- Artifact Variants (3 types per source)
-- ========================================
CREATE TABLE IF NOT EXISTS artifact_variants (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN (
    'attachment', 'company_intel', 'profile', 'ecosystem', 'signals'
  )),
  variant_type TEXT NOT NULL CHECK (variant_type IN (
    'raw', 'ui', 'ai_optimized', 'detailed'
  )),
  version INTEGER NOT NULL DEFAULT 1,
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  token_count INTEGER,
  extraction_model TEXT,
  extraction_prompt_version TEXT,
  created_at INTEGER NOT NULL,
  is_active INTEGER DEFAULT 1,
  
  UNIQUE(source_id, source_type, variant_type, version)
);

CREATE INDEX IF NOT EXISTS idx_variants_lookup ON artifact_variants(
  source_id, source_type, variant_type, is_active
);
CREATE INDEX IF NOT EXISTS idx_variants_hash ON artifact_variants(content_hash);
CREATE INDEX IF NOT EXISTS idx_variants_created ON artifact_variants(created_at);

-- ========================================
-- Analysis Staleness Tracking
-- ========================================
-- Add columns to jobs table for change detection
ALTER TABLE jobs ADD COLUMN analysis_state TEXT DEFAULT 'pending';
ALTER TABLE jobs ADD COLUMN analysis_fingerprint TEXT;
ALTER TABLE jobs ADD COLUMN last_full_analysis_at INTEGER;

CREATE INDEX IF NOT EXISTS idx_jobs_analysis_state ON jobs(analysis_state);

-- ========================================
-- Cross-Section Data Reuse Registry
-- ========================================
CREATE TABLE IF NOT EXISTS analysis_dependencies (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  analysis_type TEXT NOT NULL,
  depends_on TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  is_valid INTEGER DEFAULT 1,
  
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_analysis_deps_job ON analysis_dependencies(job_id);
CREATE INDEX IF NOT EXISTS idx_analysis_deps_type ON analysis_dependencies(analysis_type);

-- ========================================
-- Extraction Jobs Queue (async processing)
-- ========================================
CREATE TABLE IF NOT EXISTS extraction_queue (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  source_type TEXT NOT NULL,
  variant_type TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 5,
  status TEXT NOT NULL CHECK (status IN (
    'queued', 'processing', 'completed', 'failed'
  )) DEFAULT 'queued',
  attempts INTEGER DEFAULT 0,
  error_message TEXT,
  created_at INTEGER NOT NULL,
  started_at INTEGER,
  completed_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_extraction_queue_status ON extraction_queue(status, priority DESC);
CREATE INDEX IF NOT EXISTS idx_extraction_queue_source ON extraction_queue(source_id, source_type);

