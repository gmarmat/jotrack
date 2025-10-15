import Database from 'better-sqlite3';
import { ATS_STANDARD_SIGNALS } from '../lib/matchSignals';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'jotrack.db');
const db = new Database(dbPath);

export function seedAtsSignals() {
  console.log('Seeding ATS signals...');

  // Delete existing signals
  db.prepare('DELETE FROM ats_signals').run();

  // Insert ATS standard signals
  const insertSignal = db.prepare(`
    INSERT INTO ats_signals (id, name, description, category, type, base_weight, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, unixepoch(), unixepoch())
  `);

  let count = 0;
  for (const signal of ATS_STANDARD_SIGNALS) {
    insertSignal.run(
      signal.id,
      signal.name,
      signal.description,
      signal.category,
      signal.type,
      signal.baseWeight
    );
    count++;
  }

  console.log(`✅ Seeded ${count} ATS signals`);
}

// Run if called directly
if (require.main === module) {
  try {
    seedAtsSignals();
    db.close();
    console.log('Done!');
  } catch (error) {
    console.error('Error seeding ATS signals:', error);
    process.exit(1);
  }
}

