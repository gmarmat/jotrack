-- Migration: Company Ecosystem Cache
-- Purpose: Cache expensive company research data for 7 days to save costs
-- Pattern: Similar to artifact_variants (reuse vs re-research)
-- Savings: 95%+ (reuse across multiple jobs for same company)

CREATE TABLE IF NOT EXISTS company_ecosystem_cache (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  
  -- Company Identification
  company_name TEXT NOT NULL,
  industry TEXT,                      -- "Technology", "Finance", etc.
  
  -- Cached Research Data (Full JSON)
  research_data TEXT NOT NULL,        -- Complete 10 company dataset (JSON array)
  
  -- Metadata
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  expires_at INTEGER NOT NULL,        -- created_at + 7 days (604800 seconds)
  
  -- Fingerprint (detect if context changed)
  context_fingerprint TEXT,           -- Hash of job industry/role/level
  
  -- Stats
  company_count INTEGER DEFAULT 10,
  avg_confidence TEXT DEFAULT 'medium',
  
  -- Source Attribution (for transparency)
  sources TEXT,                        -- JSON array of sources used
  
  -- Cost Tracking
  tokens_used INTEGER,
  cost_usd REAL,
  
  -- Web Search Tracking
  web_searches_used INTEGER DEFAULT 0,
  
  -- Ensure one cache per company+industry combination
  UNIQUE(company_name, industry)
);

-- Index for cache lookups (by company name)
CREATE INDEX IF NOT EXISTS idx_company_cache_company ON company_ecosystem_cache(company_name);

-- Index for cache expiration cleanup
CREATE INDEX IF NOT EXISTS idx_company_cache_expires ON company_ecosystem_cache(expires_at);

-- Index for industry-specific lookups
CREATE INDEX IF NOT EXISTS idx_company_cache_industry ON company_ecosystem_cache(industry);

-- Trigger to auto-update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_company_cache_timestamp 
AFTER UPDATE ON company_ecosystem_cache
BEGIN
  UPDATE company_ecosystem_cache 
  SET updated_at = unixepoch() 
  WHERE id = NEW.id;
END;

