-- Migration 011: Add optimization tracking to people profiles
-- Date: 2025-10-19
-- Purpose: Track AI extraction/optimization status per profile

-- Add optimization tracking fields
ALTER TABLE people_profiles ADD COLUMN raw_text TEXT;
ALTER TABLE people_profiles ADD COLUMN optimized_at INTEGER;
ALTER TABLE people_profiles ADD COLUMN is_optimized INTEGER DEFAULT 0;

-- Migrate existing data: move summary to raw_text
UPDATE people_profiles SET raw_text = summary WHERE summary IS NOT NULL;
UPDATE people_profiles SET summary = NULL;

