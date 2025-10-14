-- Migration: Add analysis_workflows table for multi-step AI analysis
-- This table stores workflow state for future AI agent integration

CREATE TABLE IF NOT EXISTS analysis_workflows (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  workflow_type TEXT NOT NULL, -- 'company_intelligence', 'people_analysis', 'match_analysis'
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  current_step_index INTEGER NOT NULL DEFAULT 0,
  steps_json TEXT NOT NULL, -- JSON array of AnalysisStep[]
  results_json TEXT, -- JSON object of step results
  created_at INTEGER NOT NULL,
  completed_at INTEGER,
  
  FOREIGN KEY (job_id) REFERENCES jobs (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_workflows_job_id ON analysis_workflows (job_id);
CREATE INDEX IF NOT EXISTS idx_workflows_type ON analysis_workflows (workflow_type);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON analysis_workflows (status);

