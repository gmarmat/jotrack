import { db, sqlite } from './client';
import { jobs, statusHistory, type NewJob, type Job } from './schema';
import { v4 as uuidv4 } from 'uuid';
import { eq, desc, SQL } from 'drizzle-orm';
import type { JobStatus } from '@/lib/status';

export interface CreateJobInput {
  title: string;
  company: string;
  status: JobStatus | string; // Accept both for backward compatibility
  notes?: string;
}

export async function createJob(input: CreateJobInput): Promise<Job> {
  const now = Date.now();
  const jobId = uuidv4();
  
  const newJob: NewJob = {
    id: jobId,
    title: input.title,
    company: input.company,
    status: input.status as JobStatus,
    notes: input.notes || '',
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(jobs).values(newJob);
  
  // Add initial status history entry
  await db.insert(statusHistory).values({
    id: uuidv4(),
    jobId: jobId,
    status: input.status as JobStatus,
    changedAt: now,
  });

  return newJob as Job;
}

export async function listJobs(): Promise<Job[]> {
  return db.select().from(jobs).orderBy(desc(jobs.updatedAt));
}

export interface SearchJobsResult {
  id: string;
  title: string;
  company: string;
  status: string;
  notes: string;
  createdAt: number;
  updatedAt: number;
}

export function searchJobs(query: string): SearchJobsResult[] {
  const stmt = sqlite.prepare(`
    SELECT j.id, j.title, j.company, j.status, j.notes, j.created_at as createdAt, j.updated_at as updatedAt
    FROM jobs j
    INNER JOIN job_search js ON j.id = js.job_id
    WHERE job_search MATCH ?
    ORDER BY j.updated_at DESC
  `);
  
  return stmt.all(query) as SearchJobsResult[];
}

export function updateJobStatus(jobId: string, status: JobStatus | string): Job | null {
  const now = Date.now();
  const historyId = uuidv4();
  
  // Use a transaction to safely handle FTS5 triggers
  const transaction = sqlite.transaction(() => {
    // Update the job
    sqlite.prepare(`
      UPDATE jobs 
      SET status = ?, updated_at = ? 
      WHERE id = ?
    `).run(status, now, jobId);
    
    // Insert status history
    sqlite.prepare(`
      INSERT INTO status_history (id, job_id, status, changed_at)
      VALUES (?, ?, ?, ?)
    `).run(historyId, jobId, status, now);
  });
  
  // Execute the transaction
  transaction();
  
  // Return the updated job
  const selectStmt = sqlite.prepare(`
    SELECT id, title, company, status, notes, created_at as createdAt, updated_at as updatedAt
    FROM jobs 
    WHERE id = ?
  `);
  const updatedJob = selectStmt.get(jobId) as Job | undefined;
  return updatedJob || null;
}

export function getJobStatusHistory(jobId: string) {
  const stmt = sqlite.prepare(`
    SELECT id, job_id as jobId, status, changed_at as changedAt
    FROM status_history
    WHERE job_id = ?
    ORDER BY changed_at DESC
  `);
  
  return stmt.all(jobId) as Array<{
    id: string;
    jobId: string;
    status: string;
    changedAt: number;
  }>;
}

export interface AttachmentSummary {
  jobId: string;
  kind: string;
  count: number;
  latest: number | null;
}

export function getAttachmentSummaries(jobIds: string[]): AttachmentSummary[] {
  if (jobIds.length === 0) return [];
  
  const placeholders = jobIds.map(() => '?').join(',');
  const stmt = sqlite.prepare(`
    SELECT 
      job_id as jobId,
      kind,
      COUNT(*) as count,
      MAX(created_at) as latest
    FROM attachments
    WHERE job_id IN (${placeholders})
    GROUP BY job_id, kind
  `);
  
  return stmt.all(...jobIds) as AttachmentSummary[];
}

export function getMaxVersion(jobId: string, kind: string): number {
  const stmt = sqlite.prepare(`
    SELECT COALESCE(MAX(version), 0) as maxVersion
    FROM attachments
    WHERE job_id = ? AND kind = ?
  `);
  
  const result = stmt.get(jobId, kind) as { maxVersion: number } | undefined;
  return result?.maxVersion || 0;
}

export interface VersionInfo {
  id: string;
  version: number;
  filename: string;
  path?: string;
  size: number;
  createdAt: number;
  deletedAt: number | null;
  isActive: boolean;
}

export function listVersions(jobId: string, kind: string): VersionInfo[] {
  const stmt = sqlite.prepare(`
    SELECT id, version, filename, path, size, created_at as createdAt, deleted_at as deletedAt, is_active as isActive
    FROM attachments
    WHERE job_id = ? AND kind = ?
    ORDER BY version DESC
  `);
  
  const rows = stmt.all(jobId, kind) as any[];
  return rows.map(row => ({
    ...row,
    isActive: Boolean(row.isActive), // Convert 0/1 to false/true
  })) as VersionInfo[];
}

