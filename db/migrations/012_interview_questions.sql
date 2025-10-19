-- Interview Questions Feature
-- Supports web search (cached 90 days per company) + AI generation (per job)

-- Company-wide cache for web-searched questions (shared across all jobs at same company)
CREATE TABLE IF NOT EXISTS interview_questions_cache (
  id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  role_category TEXT,
  searched_questions TEXT,  -- JSON array of questions from web
  search_sources TEXT,       -- JSON array of source URLs
  searched_at INTEGER,
  created_at INTEGER NOT NULL,
  expires_at INTEGER         -- 90 days from creation
);

CREATE INDEX idx_interview_cache_company ON interview_questions_cache(company_name);
CREATE INDEX idx_interview_cache_expires ON interview_questions_cache(expires_at);

-- Job-specific AI-generated questions (3 personas)
CREATE TABLE IF NOT EXISTS job_interview_questions (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  recruiter_questions TEXT,      -- JSON array
  hiring_manager_questions TEXT, -- JSON array
  peer_questions TEXT,           -- JSON array
  generated_at INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

CREATE INDEX idx_job_interview_questions_job ON job_interview_questions(job_id);

-- Add timestamps to jobs table for tracking when questions were generated
ALTER TABLE jobs ADD COLUMN interview_questions_searched_at INTEGER;
ALTER TABLE jobs ADD COLUMN interview_questions_generated_at INTEGER;

