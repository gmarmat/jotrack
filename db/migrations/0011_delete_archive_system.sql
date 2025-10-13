-- Migration: Add delete and archive system to jobs table
-- v2.0: Soft delete with 5-day trash, archive/unarchive support

ALTER TABLE jobs ADD COLUMN deleted_at INTEGER DEFAULT NULL;
ALTER TABLE jobs ADD COLUMN archived_at INTEGER DEFAULT NULL;
ALTER TABLE jobs ADD COLUMN permanent_delete_at INTEGER DEFAULT NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_deleted_at ON jobs(deleted_at);
CREATE INDEX IF NOT EXISTS idx_jobs_archived_at ON jobs(archived_at);
CREATE INDEX IF NOT EXISTS idx_jobs_permanent_delete_at ON jobs(permanent_delete_at);
