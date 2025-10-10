#!/usr/bin/env tsx
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db, sqlite } from './client';
import fs from 'fs';
import path from 'path';

console.log('🔄 Running migrations...');

const migrationsFolder = path.join(process.cwd(), 'db/migrations');

// Ensure migrations folder exists
if (!fs.existsSync(migrationsFolder)) {
  fs.mkdirSync(migrationsFolder, { recursive: true });
}

try {
  migrate(db, { migrationsFolder });
  console.log('✅ Migrations completed');
  
  // Backfill is_active for attachments
  console.log('🔄 Backfilling is_active flags...');
  sqlite.exec(`
    UPDATE attachments
    SET is_active = 1
    WHERE id IN (
      SELECT a1.id
      FROM attachments a1
      WHERE a1.deleted_at IS NULL
        AND a1.version = (
          SELECT MAX(a2.version)
          FROM attachments a2
          WHERE a2.job_id = a1.job_id
            AND a2.kind = a1.kind
            AND a2.deleted_at IS NULL
        )
    );
  `);
  console.log('✅ Backfill completed');
  
  // Create index for is_active
  console.log('🔄 Creating index for is_active...');
  sqlite.exec(`
    CREATE INDEX IF NOT EXISTS idx_active_by_job_kind ON attachments(job_id, kind, is_active);
  `);
  console.log('✅ Index created');
  
  // Create FTS5 table and triggers if they don't exist
  console.log('🔄 Setting up FTS5 search...');
  
  sqlite.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS job_search USING fts5(
      job_id UNINDEXED,
      title,
      company,
      notes
    );
    
    -- Trigger to keep FTS in sync on INSERT
    CREATE TRIGGER IF NOT EXISTS job_search_insert AFTER INSERT ON jobs BEGIN
      INSERT INTO job_search(job_id, title, company, notes)
      VALUES (new.id, new.title, new.company, new.notes);
    END;
    
    -- Trigger to keep FTS in sync on UPDATE
    CREATE TRIGGER IF NOT EXISTS job_search_update AFTER UPDATE ON jobs BEGIN
      UPDATE job_search SET title = new.title, company = new.company, notes = new.notes
      WHERE job_id = new.id;
    END;
    
    -- Trigger to keep FTS in sync on DELETE
    CREATE TRIGGER IF NOT EXISTS job_search_delete AFTER DELETE ON jobs BEGIN
      DELETE FROM job_search WHERE job_id = old.id;
    END;
  `);
  
  console.log('✅ FTS5 search configured');
} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
} finally {
  sqlite.close();
}

