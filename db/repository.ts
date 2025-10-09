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

