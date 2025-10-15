-- Migration 010: Staleness Detection Triggers (v2.7)
-- Auto-mark jobs as stale when attachments or profiles change

-- ========================================
-- Trigger: Mark job stale when attachment changes
-- ========================================
CREATE TRIGGER IF NOT EXISTS mark_analysis_stale_on_attachment
AFTER UPDATE ON attachments
WHEN OLD.is_active != NEW.is_active OR OLD.version != NEW.version
BEGIN
  UPDATE jobs 
  SET analysis_state = 'stale',
      updated_at = unixepoch()
  WHERE id = NEW.job_id;
END;

-- ========================================
-- Trigger: Mark all analyzed jobs stale when global profile updates
-- ========================================
CREATE TRIGGER IF NOT EXISTS mark_all_jobs_stale_on_profile
AFTER UPDATE ON user_profile
BEGIN
  UPDATE jobs 
  SET analysis_state = 'stale'
  WHERE last_full_analysis_at IS NOT NULL;
END;

-- ========================================
-- Trigger: Mark extraction queue item completed when variant created
-- ========================================
CREATE TRIGGER IF NOT EXISTS mark_extraction_completed
AFTER INSERT ON artifact_variants
BEGIN
  UPDATE extraction_queue
  SET status = 'completed',
      completed_at = unixepoch()
  WHERE source_id = NEW.source_id
    AND source_type = NEW.source_type
    AND variant_type = NEW.variant_type
    AND status = 'processing';
END;

