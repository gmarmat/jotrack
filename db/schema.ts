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

