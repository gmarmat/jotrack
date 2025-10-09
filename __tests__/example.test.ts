import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { eq, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import * as schema from '../db/schema';
import fs from 'fs';
import path from 'path';

// Test database setup
const testDbPath = path.join(process.cwd(), 'data', 'test.db');

describe('Job Repository Tests', () => {
  let testDb: ReturnType<typeof drizzle>;
  let testSqlite: Database.Database;

  beforeEach(() => {
    // Remove test db if exists
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    // Create new test database
    testSqlite = new Database(testDbPath);
    testSqlite.pragma('foreign_keys = ON');
    testDb = drizzle(testSqlite, { schema });

    // Create tables
    testSqlite.exec(`
      CREATE TABLE jobs (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        company TEXT NOT NULL,
        status TEXT NOT NULL,
        notes TEXT DEFAULT '',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE status_history (
        id TEXT PRIMARY KEY,
        job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        status TEXT NOT NULL,
        changed_at INTEGER NOT NULL
      );

      CREATE VIRTUAL TABLE job_search USING fts5(
        job_id UNINDEXED,
        title,
        company,
        notes,
        content='jobs',
        content_rowid='rowid'
      );

      CREATE TRIGGER job_search_insert AFTER INSERT ON jobs BEGIN
        INSERT INTO job_search(job_id, title, company, notes)
        VALUES (new.id, new.title, new.company, new.notes);
      END;

      CREATE TRIGGER job_search_update AFTER UPDATE ON jobs BEGIN
        UPDATE job_search SET title = new.title, company = new.company, notes = new.notes
        WHERE job_id = new.id;
      END;

      CREATE TRIGGER job_search_delete AFTER DELETE ON jobs BEGIN
        DELETE FROM job_search WHERE job_id = old.id;
      END;
    `);
  });

  afterAll(() => {
    // Clean up test database
    if (testSqlite) {
      testSqlite.close();
    }
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  it('should create a job with valid data', () => {
    const jobId = uuidv4();
    const now = Date.now();

    const job = {
      id: jobId,
      title: 'Software Engineer',
      company: 'Test Corp',
      status: 'APPLIED' as const,
      notes: 'Test notes',
      createdAt: now,
      updatedAt: now,
    };

    testDb.insert(schema.jobs).values(job).run();

    const result = testDb.select().from(schema.jobs).where(eq(schema.jobs.id, jobId)).get();
    
    expect(result).toBeDefined();
    expect(result?.title).toBe('Software Engineer');
    expect(result?.company).toBe('Test Corp');
    expect(result?.status).toBe('APPLIED');
  });

  it('should search jobs using FTS5', () => {
    const now = Date.now();
    const jobs = [
      { id: uuidv4(), title: 'React Developer', company: 'Facebook', status: 'APPLIED' as const, notes: 'Great company', createdAt: now, updatedAt: now },
      { id: uuidv4(), title: 'Vue Developer', company: 'Google', status: 'APPLIED' as const, notes: 'Another opportunity', createdAt: now, updatedAt: now },
    ];

    jobs.forEach(job => {
      testDb.insert(schema.jobs).values(job).run();
    });

    const stmt = testSqlite.prepare(`
      SELECT j.id, j.title, j.company
      FROM jobs j
      INNER JOIN job_search js ON j.id = js.job_id
      WHERE job_search MATCH ?
    `);

    const results = stmt.all('React') as Array<{ id: string; title: string; company: string }>;
    
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('React Developer');
  });

  it('should list jobs ordered by updated date', () => {
    const now = Date.now();
    const jobs = [
      { id: uuidv4(), title: 'Job 1', company: 'A', status: 'APPLIED' as const, notes: '', createdAt: now - 2000, updatedAt: now - 2000 },
      { id: uuidv4(), title: 'Job 2', company: 'B', status: 'APPLIED' as const, notes: '', createdAt: now - 1000, updatedAt: now - 1000 },
      { id: uuidv4(), title: 'Job 3', company: 'C', status: 'APPLIED' as const, notes: '', createdAt: now, updatedAt: now },
    ];

    jobs.forEach(job => {
      testDb.insert(schema.jobs).values(job).run();
    });

    const results = testDb.select().from(schema.jobs).orderBy(desc(schema.jobs.updatedAt)).all();
    
    expect(results).toHaveLength(3);
    expect(results[0].title).toBe('Job 3');
    expect(results[1].title).toBe('Job 2');
    expect(results[2].title).toBe('Job 1');
  });

  it('should update job status and append to status history', () => {
    const jobId = uuidv4();
    const now = Date.now();

    // Create initial job
    const job = {
      id: jobId,
      title: 'Software Engineer',
      company: 'TechCorp',
      status: 'APPLIED' as const,
      notes: 'Initial application',
      createdAt: now,
      updatedAt: now,
    };

    testDb.insert(schema.jobs).values(job).run();

    // Add initial status history
    testDb.insert(schema.statusHistory).values({
      id: uuidv4(),
      jobId: jobId,
      status: 'APPLIED' as const,
      changedAt: now,
    }).run();

    // Update status to Phone Screen
    const newStatus = 'PHONE_SCREEN' as const;
    const updateTime = now + 1000;

    testDb.update(schema.jobs)
      .set({ status: newStatus, updatedAt: updateTime })
      .where(eq(schema.jobs.id, jobId))
      .run();

    testDb.insert(schema.statusHistory).values({
      id: uuidv4(),
      jobId: jobId,
      status: newStatus,
      changedAt: updateTime,
    }).run();

    // Verify job was updated
    const updatedJob = testDb.select().from(schema.jobs).where(eq(schema.jobs.id, jobId)).get();
    expect(updatedJob?.status).toBe('PHONE_SCREEN');
    expect(updatedJob?.updatedAt).toBe(updateTime);

    // Verify status history has 2 entries
    const history = testDb.select()
      .from(schema.statusHistory)
      .where(eq(schema.statusHistory.jobId, jobId))
      .orderBy(desc(schema.statusHistory.changedAt))
      .all();

    expect(history).toHaveLength(2);
    expect(history[0].status).toBe('PHONE_SCREEN');
    expect(history[1].status).toBe('APPLIED');
  });

  it('should maintain status history order across multiple updates', () => {
    const jobId = uuidv4();
    const now = Date.now();
    const statuses = ['APPLIED', 'PHONE_SCREEN', 'ONSITE', 'OFFER'] as const;

    // Create initial job
    testDb.insert(schema.jobs).values({
      id: jobId,
      title: 'Full Stack Developer',
      company: 'StartupXYZ',
      status: statuses[0] as 'APPLIED',
      notes: '',
      createdAt: now,
      updatedAt: now,
    }).run();

    // Add status history for each status
    statuses.forEach((status, index) => {
      const changedAt = now + (index * 1000);
      
      testDb.insert(schema.statusHistory).values({
        id: uuidv4(),
        jobId: jobId,
        status: status as any,
        changedAt: changedAt,
      }).run();

      if (index > 0) {
        testDb.update(schema.jobs)
          .set({ status: status as any, updatedAt: changedAt })
          .where(eq(schema.jobs.id, jobId))
          .run();
      }
    });

    // Verify history is in correct order (most recent first)
    const history = testDb.select()
      .from(schema.statusHistory)
      .where(eq(schema.statusHistory.jobId, jobId))
      .orderBy(desc(schema.statusHistory.changedAt))
      .all();

    expect(history).toHaveLength(4);
    expect(history[0].status).toBe('OFFER');
    expect(history[1].status).toBe('ONSITE');
    expect(history[2].status).toBe('PHONE_SCREEN');
    expect(history[3].status).toBe('APPLIED');

    // Verify timestamps are in descending order
    for (let i = 0; i < history.length - 1; i++) {
      expect(history[i].changedAt).toBeGreaterThan(history[i + 1].changedAt);
    }
  });
});

