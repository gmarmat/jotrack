-- Migration 015: Interview Coach State
-- Purpose: Add Interview Coach data storage to existing coach_state table
-- Date: October 20, 2025

-- Extends existing coach_state table (no new table!)
-- Keeps Application Coach and Interview Coach data separate but in same record

ALTER TABLE coach_state ADD COLUMN interview_coach_json TEXT DEFAULT '{}';

-- Index for faster queries (if not exists)
CREATE INDEX IF NOT EXISTS idx_coach_state_job_id ON coach_state(job_id);

