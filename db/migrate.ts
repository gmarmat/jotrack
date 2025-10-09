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

