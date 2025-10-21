-- V2.0: Add web intelligence column to interview questions cache
-- Stores rich 8-dimensional intelligence from Glassdoor/Reddit/Blind

ALTER TABLE interview_questions_cache 
ADD COLUMN web_intelligence_json TEXT;

-- No index needed - already indexed by company_name for lookups

