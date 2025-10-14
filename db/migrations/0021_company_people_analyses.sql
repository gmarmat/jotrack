-- Migration: Add company and people analyses tables
-- v2.4: Cache AI analysis results to prevent token waste

-- Company analyses table
CREATE TABLE IF NOT EXISTS company_analyses (
  job_id TEXT PRIMARY KEY,
  result_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

-- People analyses table  
CREATE TABLE IF NOT EXISTS people_analyses (
  job_id TEXT PRIMARY KEY,
  result_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_company_analyses_created ON company_analyses(created_at);
CREATE INDEX IF NOT EXISTS idx_people_analyses_created ON people_analyses(created_at);

