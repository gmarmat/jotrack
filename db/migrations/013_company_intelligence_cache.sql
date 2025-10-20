-- Migration 013: Add Company Intelligence Cache
-- Purpose: Cache company intelligence data for 30 days to reduce AI costs
-- Date: October 20, 2025

CREATE TABLE IF NOT EXISTS company_intelligence_cache (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  
  -- Company Identification
  company_name TEXT NOT NULL UNIQUE, -- Only one cache per company
  industry TEXT,                      -- "Technology", "Finance", etc.
  
  -- Cached Intelligence Data (Full JSON)
  intelligence_data TEXT NOT NULL,    -- Complete company intelligence (JSON)
  
  -- Metadata
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  expires_at INTEGER NOT NULL,        -- created_at + 30 days (2592000 seconds)
  
  -- Fingerprint (detect if context changed)
  context_fingerprint TEXT,           -- Hash of company name (simple for now)
  
  -- Stats
  confidence TEXT DEFAULT 'medium',   -- 'low', 'medium', 'high'
  
  -- Source Attribution (for transparency)
  sources TEXT,                        -- JSON array of sources used
  
  -- Cost Tracking
  tokens_used INTEGER,
  cost_usd REAL,
  
  -- Web Search Tracking
  web_searches_used INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_company_intel_company ON company_intelligence_cache(company_name);
CREATE INDEX IF NOT EXISTS idx_company_intel_expires ON company_intelligence_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_company_intel_industry ON company_intelligence_cache(industry);

-- Trigger to update timestamp
CREATE TRIGGER IF NOT EXISTS update_company_intel_cache_timestamp 
AFTER UPDATE ON company_intelligence_cache
BEGIN
  UPDATE company_intelligence_cache 
  SET updated_at = unixepoch() 
  WHERE id = NEW.id;
END;

