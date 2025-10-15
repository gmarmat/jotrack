import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import type { JobStatus } from '@/lib/status';

// Attachment kinds
export const ATTACHMENT_KINDS = ['resume', 'jd', 'cover_letter', 'other'] as const;
export type AttachmentKind = typeof ATTACHMENT_KINDS[number];

export const jobs = sqliteTable('jobs', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  company: text('company').notNull(),
  status: text('status').$type<JobStatus>().notNull(),
  postingUrl: text('posting_url'),
  notes: text('notes').default(''),
  createdAt: integer('created_at', { mode: 'number' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'number' }).notNull(),
  // v2.0: Delete & Archive system
  deletedAt: integer('deleted_at', { mode: 'number' }).$type<number | null>().default(null),
  archivedAt: integer('archived_at', { mode: 'number' }).$type<number | null>().default(null),
  permanentDeleteAt: integer('permanent_delete_at', { mode: 'number' }).$type<number | null>().default(null),
  // v2.7: Analysis state tracking
  analysisState: text('analysis_state').$type<'pending' | 'fresh' | 'stale' | 'analyzing'>().default('pending'),
  analysisFingerprint: text('analysis_fingerprint'),
  lastFullAnalysisAt: integer('last_full_analysis_at', { mode: 'number' }),
});

export const statusHistory = sqliteTable('status_history', {
  id: text('id').primaryKey(),
  jobId: text('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  status: text('status').$type<JobStatus>().notNull(),
  changedAt: integer('changed_at', { mode: 'number' }).notNull(),
});

export const attachments = sqliteTable('attachments', {
  id: text('id').primaryKey(),
  jobId: text('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  filename: text('filename').notNull(),
  path: text('path').notNull(),
  size: integer('size', { mode: 'number' }).notNull().default(0),
  kind: text('kind').$type<AttachmentKind>().notNull().default('other'),
  version: integer('version', { mode: 'number' }).notNull().default(1),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'number' }).notNull(),
  deletedAt: integer('deleted_at', { mode: 'number' }).$type<number | null>().default(null),
});

export const statusDetails = sqliteTable('status_details', {
  id: text('id').primaryKey(),
  jobId: text('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  status: text('status').$type<JobStatus>().notNull(),
  // JSON columns for structured data
  interviewerBlocks: text('interviewer_blocks').notNull().default('[]'), // JSON array
  aiBlob: text('ai_blob'), // Markdown/text from AI analysis
  keywordsAuto: text('keywords_auto').notNull().default('[]'), // JSON array from AI
  keywordsManual: text('keywords_manual').notNull().default('[]'), // JSON array user-added
  notes: text('notes').default(''),
  notesHistory: text('notes_history').notNull().default('[]'), // JSON array of {text, timestamp}
  updatedAt: integer('updated_at', { mode: 'number' }).notNull(),
  aiRefreshedAt: integer('ai_refreshed_at', { mode: 'number' }),
});

export const jobStatusEvents = sqliteTable('job_status_events', {
  id: text('id').primaryKey(),
  jobId: text('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  status: text('status').$type<JobStatus>().notNull(),
  enteredAt: integer('entered_at', { mode: 'number' }).notNull(),
  leftAt: integer('left_at', { mode: 'number' }),
});

export const appSettings = sqliteTable('app_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

// Coach Mode: Knowledge Tables (reusable across jobs)
export const companies = sqliteTable('companies', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  website: text('website'),
  industry: text('industry'),
  subindustry: text('subindustry'),
  hqCity: text('hq_city'),
  hqState: text('hq_state'),
  hqCountry: text('hq_country'),
  sizeBucket: text('size_bucket'), // e.g., "1-10", "11-50", "51-200", etc.
  revenueBucket: text('revenue_bucket'),
  principles: text('principles').notNull().default('[]'), // JSON array of strings
  linkedinUrl: text('linkedin_url'),
  updatedAt: integer('updated_at', { mode: 'number' }).notNull(),
});

export const peopleProfiles = sqliteTable('people_profiles', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  title: text('title'),
  companyId: text('company_id').references(() => companies.id, { onDelete: 'set null' }),
  linkedinUrl: text('linkedin_url'),
  location: text('location'),
  tenureMonths: integer('tenure_months', { mode: 'number' }),
  techDepth: text('tech_depth'), // e.g., "high", "medium", "low"
  summary: text('summary'),
  updatedAt: integer('updated_at', { mode: 'number' }).notNull(),
});

export const rolesCatalog = sqliteTable('roles_catalog', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  seniority: text('seniority'), // e.g., "entry", "mid", "senior", "staff", "principal"
  archetype: text('archetype'), // e.g., "IC", "Manager", "Executive"
  keySkills: text('key_skills').notNull().default('[]'), // JSON array of strings
  updatedAt: integer('updated_at', { mode: 'number' }).notNull(),
});

export const skillsTaxonomy = sqliteTable('skills_taxonomy', {
  id: text('id').primaryKey(),
  label: text('label').notNull(),
  category: text('category'), // e.g., "technical", "soft", "domain"
  aliases: text('aliases').notNull().default('[]'), // JSON array of strings
});

export const sourcesCache = sqliteTable('sources_cache', {
  id: text('id').primaryKey(),
  url: text('url').notNull().unique(),
  sourceType: text('source_type').notNull(), // e.g., "linkedin", "company_website", "jd", "resume"
  title: text('title'),
  publishedAt: integer('published_at', { mode: 'number' }),
  text: text('text').notNull(),
  metadata: text('metadata').notNull().default('{}'), // JSON object
  updatedAt: integer('updated_at', { mode: 'number' }).notNull(),
});

export const salaryBenchmarks = sqliteTable('salary_benchmarks', {
  id: text('id').primaryKey(),
  roleId: text('role_id').references(() => rolesCatalog.id, { onDelete: 'cascade' }),
  geo: text('geo').notNull(), // e.g., "US-SF", "US-NYC", "US-Remote"
  companySize: text('company_size'),
  baseMin: integer('base_min', { mode: 'number' }),
  baseMid: integer('base_mid', { mode: 'number' }),
  baseMax: integer('base_max', { mode: 'number' }),
  tcMin: integer('tc_min', { mode: 'number' }),
  tcMid: integer('tc_mid', { mode: 'number' }),
  tcMax: integer('tc_max', { mode: 'number' }),
  sources: text('sources').notNull().default('[]'), // JSON array of source URLs/citations
  updatedAt: integer('updated_at', { mode: 'number' }).notNull(),
});

export const learningCatalog = sqliteTable('learning_catalog', {
  id: text('id').primaryKey(),
  provider: text('provider').notNull(), // e.g., "Coursera", "Udemy", "YouTube"
  title: text('title').notNull(),
  url: text('url').notNull(),
  durationHours: integer('duration_hours', { mode: 'number' }),
  skillIds: text('skill_ids').notNull().default('[]'), // JSON array of skill IDs
  level: text('level'), // e.g., "beginner", "intermediate", "advanced"
  updatedAt: integer('updated_at', { mode: 'number' }).notNull(),
});

// Coach Mode: Job-scoped tables
export const jobCompanyRefs = sqliteTable('job_company_refs', {
  jobId: text('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  companyId: text('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  roleId: text('role_id').references(() => rolesCatalog.id, { onDelete: 'set null' }),
  relevance: text('relevance'), // e.g., "primary", "competitor", "similar"
});

export const jobPeopleRefs = sqliteTable('job_people_refs', {
  jobId: text('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  personId: text('person_id').notNull().references(() => peopleProfiles.id, { onDelete: 'cascade' }),
  relType: text('rel_type').notNull(), // e.g., "recruiter", "hiring_manager", "peer", "interviewer"
});

export const jobSkillSnapshots = sqliteTable('job_skill_snapshots', {
  id: text('id').primaryKey(),
  jobId: text('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  skillId: text('skill_id').notNull().references(() => skillsTaxonomy.id, { onDelete: 'cascade' }),
  source: text('source').notNull(), // e.g., "jd", "resume", "inferred"
  weight: integer('weight', { mode: 'number' }).notNull().default(1),
});

export const aiSessions = sqliteTable('ai_sessions', {
  id: text('id').primaryKey(),
  jobId: text('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  capability: text('capability').notNull(), // e.g., "fit_analysis", "resume_improve", "skill_path"
  startedAt: integer('started_at', { mode: 'number' }).notNull(),
  endedAt: integer('ended_at', { mode: 'number' }),
  targetThreshold: integer('target_threshold', { mode: 'number' }),
  outcome: text('outcome'), // e.g., "achieved", "applied_anyway", "abandoned"
});

export const aiRuns = sqliteTable('ai_runs', {
  id: text('id').primaryKey(),
  jobId: text('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  sessionId: text('session_id').references(() => aiSessions.id, { onDelete: 'set null' }),
  capability: text('capability').notNull(),
  promptVersion: text('prompt_version').notNull(),
  provider: text('provider'), // e.g., "openai", "local_dry_run"
  inputsHash: text('inputs_hash').notNull(),
  resultJson: text('result_json').notNull(), // JSON object with structured results
  metaJson: text('meta_json').notNull().default('{}'), // JSON object with metadata
  label: text('label'), // User-assigned label
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(false),
  isPinned: integer('is_pinned', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'number' }).notNull(),
});

export const knowledgeStaleness = sqliteTable('knowledge_staleness', {
  key: text('key').primaryKey(), // e.g., "company:[companyId]", "person:[personId]"
  value: text('value').notNull(), // JSON with {ttlDays, lastUpdated, source}
});

// v2.7: Data Strategy Tables
export const userProfile = sqliteTable('user_profile', {
  id: text('id').primaryKey().default('singleton'),
  profileData: text('profile_data').notNull().default('{}'),
  skillsAccumulated: text('skills_accumulated').notNull().default('[]'),
  experiencesAccumulated: text('experiences_accumulated').notNull().default('[]'),
  version: integer('version', { mode: 'number' }).notNull().default(1),
  updatedAt: integer('updated_at', { mode: 'number' }).notNull(),
});

export const VARIANT_TYPES = ['raw', 'ui', 'ai_optimized', 'detailed'] as const;
export type VariantType = typeof VARIANT_TYPES[number];

export const SOURCE_TYPES = ['attachment', 'company_intel', 'profile', 'ecosystem', 'signals'] as const;
export type SourceType = typeof SOURCE_TYPES[number];

export const artifactVariants = sqliteTable('artifact_variants', {
  id: text('id').primaryKey(),
  sourceId: text('source_id').notNull(),
  sourceType: text('source_type').$type<SourceType>().notNull(),
  variantType: text('variant_type').$type<VariantType>().notNull(),
  version: integer('version', { mode: 'number' }).notNull().default(1),
  content: text('content').notNull(),
  contentHash: text('content_hash').notNull(),
  tokenCount: integer('token_count', { mode: 'number' }),
  extractionModel: text('extraction_model'),
  extractionPromptVersion: text('extraction_prompt_version'),
  createdAt: integer('created_at', { mode: 'number' }).notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
});

export const analysisDependencies = sqliteTable('analysis_dependencies', {
  id: text('id').primaryKey(),
  jobId: text('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  analysisType: text('analysis_type').notNull(),
  dependsOn: text('depends_on').notNull(), // JSON array of variant IDs
  createdAt: integer('created_at', { mode: 'number' }).notNull(),
  isValid: integer('is_valid', { mode: 'boolean' }).notNull().default(true),
});

export const EXTRACTION_STATUSES = ['queued', 'processing', 'completed', 'failed'] as const;
export type ExtractionStatus = typeof EXTRACTION_STATUSES[number];

export const extractionQueue = sqliteTable('extraction_queue', {
  id: text('id').primaryKey(),
  sourceId: text('source_id').notNull(),
  sourceType: text('source_type').$type<SourceType>().notNull(),
  variantType: text('variant_type').$type<VariantType>().notNull(),
  priority: integer('priority', { mode: 'number' }).notNull().default(5),
  status: text('status').$type<ExtractionStatus>().notNull().default('queued'),
  attempts: integer('attempts', { mode: 'number' }).notNull().default(0),
  errorMessage: text('error_message'),
  createdAt: integer('created_at', { mode: 'number' }).notNull(),
  startedAt: integer('started_at', { mode: 'number' }),
  completedAt: integer('completed_at', { mode: 'number' }),
});

// Types
export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
export type StatusHistory = typeof statusHistory.$inferSelect;
export type NewStatusHistory = typeof statusHistory.$inferInsert;
export type Attachment = typeof attachments.$inferSelect;
export type NewAttachment = typeof attachments.$inferInsert;
export type StatusDetail = typeof statusDetails.$inferSelect;
export type NewStatusDetail = typeof statusDetails.$inferInsert;
export type JobStatusEvent = typeof jobStatusEvents.$inferSelect;
export type NewJobStatusEvent = typeof jobStatusEvents.$inferInsert;
export type AppSetting = typeof appSettings.$inferSelect;
export type NewAppSetting = typeof appSettings.$inferInsert;

// Coach Mode types
export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
export type PeopleProfile = typeof peopleProfiles.$inferSelect;
export type NewPeopleProfile = typeof peopleProfiles.$inferInsert;
export type RoleCatalog = typeof rolesCatalog.$inferSelect;
export type NewRoleCatalog = typeof rolesCatalog.$inferInsert;
export type SkillTaxonomy = typeof skillsTaxonomy.$inferSelect;
export type NewSkillTaxonomy = typeof skillsTaxonomy.$inferInsert;
export type SourceCache = typeof sourcesCache.$inferSelect;
export type NewSourceCache = typeof sourcesCache.$inferInsert;
export type SalaryBenchmark = typeof salaryBenchmarks.$inferSelect;
export type NewSalaryBenchmark = typeof salaryBenchmarks.$inferInsert;
export type LearningCatalog = typeof learningCatalog.$inferSelect;
export type NewLearningCatalog = typeof learningCatalog.$inferInsert;
export type JobCompanyRef = typeof jobCompanyRefs.$inferSelect;
export type NewJobCompanyRef = typeof jobCompanyRefs.$inferInsert;
export type JobPeopleRef = typeof jobPeopleRefs.$inferSelect;
export type NewJobPeopleRef = typeof jobPeopleRefs.$inferInsert;
export type JobSkillSnapshot = typeof jobSkillSnapshots.$inferSelect;
export type NewJobSkillSnapshot = typeof jobSkillSnapshots.$inferInsert;
export type AiSession = typeof aiSessions.$inferSelect;
export type NewAiSession = typeof aiSessions.$inferInsert;
export type AiRun = typeof aiRuns.$inferSelect;
export type NewAiRun = typeof aiRuns.$inferInsert;
export type KnowledgeStaleness = typeof knowledgeStaleness.$inferSelect;
export type NewKnowledgeStaleness = typeof knowledgeStaleness.$inferInsert;

// v2.7: Data Strategy types
export type UserProfile = typeof userProfile.$inferSelect;
export type NewUserProfile = typeof userProfile.$inferInsert;
export type ArtifactVariant = typeof artifactVariants.$inferSelect;
export type NewArtifactVariant = typeof artifactVariants.$inferInsert;
export type AnalysisDependency = typeof analysisDependencies.$inferSelect;
export type NewAnalysisDependency = typeof analysisDependencies.$inferInsert;
export type ExtractionQueueItem = typeof extractionQueue.$inferSelect;
export type NewExtractionQueueItem = typeof extractionQueue.$inferInsert;

// Typed structures for JSON columns
export type InterviewerBlock = {
  id: string;
  name: string;
  title: string;
  linkedinUrl?: string;
  email?: string;
  notes?: string;
  aiPersonaSummary?: string;
  keywords?: string[];
};

export type NotesHistoryEntry = {
  text: string;
  timestamp: number;
};

