-- Migration 009: Headhunter Support for Interview Coach
-- Date: October 21, 2025
-- Purpose: Add executive search recruiter context to people profiles
-- Impact: Enables Layer 8 (Headhunter Context) in Interview Coach algorithm

-- Add headhunter fields to people_profiles table
ALTER TABLE people_profiles ADD COLUMN recruiter_type TEXT DEFAULT NULL;
  -- Values: NULL (not recruiter), 'company' (internal recruiter), 'headhunter' (executive search)
  -- Only populated for people with rel_type = 'recruiter' in job_people_refs

ALTER TABLE people_profiles ADD COLUMN search_firm_name TEXT DEFAULT NULL;
  -- Executive search firm name (e.g., 'Korn Ferry', 'Heidrick & Struggles')
  -- Only populated if recruiter_type = 'headhunter'

ALTER TABLE people_profiles ADD COLUMN search_firm_tier TEXT DEFAULT NULL;
  -- Values: 'tier_1' (Big 5), 'tier_2' (established), 'boutique' (specialized)
  -- Calculated from firm name or manually set

ALTER TABLE people_profiles ADD COLUMN practice_area TEXT DEFAULT NULL;
  -- Recruiter's specialty (e.g., 'Technology C-Suite', 'Healthcare VP+')
  -- Extracted from LinkedIn headline/about section

ALTER TABLE people_profiles ADD COLUMN placement_level TEXT DEFAULT NULL;
  -- Level they typically place (e.g., 'VP+', 'Director+', 'C-Suite', 'Board')
  -- Extracted from LinkedIn activity/posts

-- Create index for efficient headhunter queries
CREATE INDEX IF NOT EXISTS idx_people_recruiter_type 
  ON people_profiles(recruiter_type) 
  WHERE recruiter_type IS NOT NULL;

-- Create index for search firm lookups
CREATE INDEX IF NOT EXISTS idx_people_search_firm 
  ON people_profiles(search_firm_name) 
  WHERE search_firm_name IS NOT NULL;

-- Note: No data migration needed (existing records keep NULL values = company recruiters)

