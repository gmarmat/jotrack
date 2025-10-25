-- Migration: Add suggestion cache table for AI-optimized answer suggestions
-- Date: October 25, 2025
-- Purpose: Cache AI-generated answer suggestions to reduce API costs and improve performance

CREATE TABLE IF NOT EXISTS suggestion_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cache_key TEXT UNIQUE NOT NULL,
  result_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  job_id TEXT,
  persona TEXT,
  question_hash TEXT
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_suggestion_cache_key ON suggestion_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_suggestion_cache_job ON suggestion_cache(job_id);
CREATE INDEX IF NOT EXISTS idx_suggestion_cache_created ON suggestion_cache(created_at);

-- Clean up old entries (older than 7 days)
CREATE TRIGGER IF NOT EXISTS cleanup_suggestion_cache
  AFTER INSERT ON suggestion_cache
  BEGIN
    DELETE FROM suggestion_cache 
    WHERE created_at < (strftime('%s', 'now') * 1000) - (7 * 24 * 60 * 60 * 1000);
  END;
