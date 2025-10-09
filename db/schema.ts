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

// Types
export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
export type StatusHistory = typeof statusHistory.$inferSelect;
export type NewStatusHistory = typeof statusHistory.$inferInsert;
export type Attachment = typeof attachments.$inferSelect;
export type NewAttachment = typeof attachments.$inferInsert;

