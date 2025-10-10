ALTER TABLE `attachments` ADD `version` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_attachments_job_kind_version ON attachments(job_id, kind, version DESC);

