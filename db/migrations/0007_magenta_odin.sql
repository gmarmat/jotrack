CREATE TABLE `status_details` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`status` text NOT NULL,
	`interviewer_blocks` text DEFAULT '[]' NOT NULL,
	`ai_blob` text,
	`keywords_auto` text DEFAULT '[]' NOT NULL,
	`keywords_manual` text DEFAULT '[]' NOT NULL,
	`notes` text DEFAULT '',
	`notes_history` text DEFAULT '[]' NOT NULL,
	`updated_at` integer NOT NULL,
	`ai_refreshed_at` integer,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE cascade
);
