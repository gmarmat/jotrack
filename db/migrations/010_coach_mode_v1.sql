-- Coach Mode v1 Database Schema
-- Migration 010: Add tables and columns for comprehensive Coach Mode

-- Job-specific user profile
CREATE TABLE IF NOT EXISTS job_profiles (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  profile_data TEXT,  -- JSON: skills, experience, projects, achievements
  discovery_responses TEXT,  -- JSON: Q&A pairs from wizard
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Coach sessions (iteration tracking)
CREATE TABLE IF NOT EXISTS coach_sessions (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL,  -- 'profile-building', 'resume-gen', 'interview-prep'
  match_score_before REAL,
  match_score_after REAL,
  resume_version INTEGER,  -- Links to attachment version
  created_at INTEGER NOT NULL
);

-- Company interview questions cache (reusable across jobs)
CREATE TABLE IF NOT EXISTS company_interview_questions (
  id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  role_category TEXT NOT NULL,  -- 'engineering', 'product', 'sales', etc
  interview_stage TEXT NOT NULL,  -- 'recruiter', 'hiring-manager', 'peer-panel'
  questions TEXT NOT NULL,  -- JSON array of questions
  sources TEXT,  -- JSON: Where questions came from (URLs, AI-generated, etc)
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL  -- Cache for 90 days
);

-- Create index for efficient company+role+stage lookups
CREATE INDEX IF NOT EXISTS idx_company_questions_lookup 
ON company_interview_questions(company_name, role_category, interview_stage, expires_at);

-- Generated talk tracks (STAR format answers)
CREATE TABLE IF NOT EXISTS talk_tracks (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  interview_stage TEXT NOT NULL,  -- 'recruiter', 'hiring-manager', 'peer-panel'
  question TEXT NOT NULL,
  answer_long TEXT NOT NULL,  -- Full STAR format answer (200-300 words)
  answer_cheat_sheet TEXT NOT NULL,  -- Key points only
  keywords_used TEXT,  -- JSON: Company principles mentioned
  created_at INTEGER NOT NULL
);

-- Add coach-related columns to jobs table
ALTER TABLE jobs ADD COLUMN coach_status TEXT DEFAULT 'not_started';
-- Possible values: 'not_started', 'profile-building', 'resume-ready', 'applied', 'interview-prep'

ALTER TABLE jobs ADD COLUMN applied_at INTEGER;
ALTER TABLE jobs ADD COLUMN applied_resume_version INTEGER;  -- Lock resume version when applied
ALTER TABLE jobs ADD COLUMN job_profile_id TEXT;  -- Links to job_profiles table

-- Create index for foreign key
CREATE INDEX IF NOT EXISTS idx_job_profile_id ON jobs(job_profile_id);

