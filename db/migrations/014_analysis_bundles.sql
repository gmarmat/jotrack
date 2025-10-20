-- Migration 014: Add Analysis Bundle System
-- Purpose: Cache extracted variants to eliminate duplicate extractions
-- Date: October 20, 2025

CREATE TABLE IF NOT EXISTS job_analysis_bundles (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  job_id TEXT NOT NULL UNIQUE,
  
  -- Content Fingerprint (detects if Resume/JD changed)
  fingerprint TEXT NOT NULL, -- SHA256(resume_content + jd_content)
  
  -- Cached Variants (extracted once, reused everywhere!)
  resume_raw TEXT,
  resume_ai_optimized TEXT,
  resume_detailed TEXT,
  jd_raw TEXT,
  jd_ai_optimized TEXT,
  jd_detailed TEXT,
  
  -- Metadata
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  expires_at INTEGER, -- Optional TTL (can be null for permanent)
  
  -- Cost Tracking
  tokens_used INTEGER DEFAULT 0,
  cost_usd REAL DEFAULT 0.0,
  
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_analysis_bundle_job ON job_analysis_bundles(job_id);
CREATE INDEX IF NOT EXISTS idx_analysis_bundle_fingerprint ON job_analysis_bundles(fingerprint);
CREATE INDEX IF NOT EXISTS idx_analysis_bundle_expires ON job_analysis_bundles(expires_at);

-- Trigger to update timestamp
CREATE TRIGGER IF NOT EXISTS update_analysis_bundle_timestamp 
AFTER UPDATE ON job_analysis_bundles
BEGIN
  UPDATE job_analysis_bundles 
  SET updated_at = unixepoch() 
  WHERE id = NEW.id;
END;

