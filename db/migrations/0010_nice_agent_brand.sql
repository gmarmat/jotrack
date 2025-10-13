CREATE TABLE `ai_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`session_id` text,
	`capability` text NOT NULL,
	`prompt_version` text NOT NULL,
	`provider` text,
	`inputs_hash` text NOT NULL,
	`result_json` text NOT NULL,
	`meta_json` text DEFAULT '{}' NOT NULL,
	`label` text,
	`is_active` integer DEFAULT false NOT NULL,
	`is_pinned` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`session_id`) REFERENCES `ai_sessions`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `ai_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`capability` text NOT NULL,
	`started_at` integer NOT NULL,
	`ended_at` integer,
	`target_threshold` integer,
	`outcome` text,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `companies` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`website` text,
	`industry` text,
	`subindustry` text,
	`hq_city` text,
	`hq_state` text,
	`hq_country` text,
	`size_bucket` text,
	`revenue_bucket` text,
	`principles` text DEFAULT '[]' NOT NULL,
	`linkedin_url` text,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `job_company_refs` (
	`job_id` text NOT NULL,
	`company_id` text NOT NULL,
	`role_id` text,
	`relevance` text,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`role_id`) REFERENCES `roles_catalog`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `job_people_refs` (
	`job_id` text NOT NULL,
	`person_id` text NOT NULL,
	`rel_type` text NOT NULL,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`person_id`) REFERENCES `people_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `job_skill_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`skill_id` text NOT NULL,
	`source` text NOT NULL,
	`weight` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`skill_id`) REFERENCES `skills_taxonomy`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `knowledge_staleness` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `learning_catalog` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`duration_hours` integer,
	`skill_ids` text DEFAULT '[]' NOT NULL,
	`level` text,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `people_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`title` text,
	`company_id` text,
	`linkedin_url` text,
	`location` text,
	`tenure_months` integer,
	`tech_depth` text,
	`summary` text,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `roles_catalog` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`seniority` text,
	`archetype` text,
	`key_skills` text DEFAULT '[]' NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `salary_benchmarks` (
	`id` text PRIMARY KEY NOT NULL,
	`role_id` text,
	`geo` text NOT NULL,
	`company_size` text,
	`base_min` integer,
	`base_mid` integer,
	`base_max` integer,
	`tc_min` integer,
	`tc_mid` integer,
	`tc_max` integer,
	`sources` text DEFAULT '[]' NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`role_id`) REFERENCES `roles_catalog`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `skills_taxonomy` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`category` text,
	`aliases` text DEFAULT '[]' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sources_cache` (
	`id` text PRIMARY KEY NOT NULL,
	`url` text NOT NULL,
	`source_type` text NOT NULL,
	`title` text,
	`published_at` integer,
	`text` text NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sources_cache_url_unique` ON `sources_cache` (`url`);