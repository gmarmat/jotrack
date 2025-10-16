-- v2.7: Add analysis result caching to jobs table
-- Stores latest analysis results to survive page refreshes

-- Add columns for caching analysis results
ALTER TABLE jobs ADD COLUMN company_intelligence_data TEXT; -- JSON
ALTER TABLE jobs ADD COLUMN company_intelligence_analyzed_at INTEGER;

ALTER TABLE jobs ADD COLUMN match_score_data TEXT; -- JSON
ALTER TABLE jobs ADD COLUMN match_score_analyzed_at INTEGER;

ALTER TABLE jobs ADD COLUMN people_profiles_data TEXT; -- JSON
ALTER TABLE jobs ADD COLUMN people_profiles_analyzed_at INTEGER;

-- Note: Ecosystem already has its own cache table (company_ecosystem_cache)
-- Note: Match Matrix uses signal_evaluations table

