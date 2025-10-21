/**
 * Refresh Interview Questions Search (Force Cache Invalidation)
 * 
 * This script clears the interview_questions_cache for a specific company
 * so that the next search will re-run and save webIntelligence data.
 * 
 * COST: ~$0.01 for Tavily search (NOT AI tokens!)
 * SAFE: Only clears cache, doesn't modify any other data
 * 
 * Usage: node scripts/refresh-interview-search.mjs "Fortive"
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, '..', 'data', 'jotrack.db');

const companyName = process.argv[2];

if (!companyName) {
  console.error('❌ Usage: node scripts/refresh-interview-search.mjs "Company Name"');
  process.exit(1);
}

console.log(`🔄 Invalidating interview questions cache for: ${companyName}\n`);

const db = new Database(dbPath);

// Check what we're about to delete
const existing = db.prepare(`
  SELECT id, company_name, searched_at, web_intelligence_json IS NOT NULL as has_web_intel
  FROM interview_questions_cache
  WHERE LOWER(company_name) = LOWER(?)
`).get(companyName);

if (!existing) {
  console.log(`⚠️  No cache found for "${companyName}"`);
  console.log('   This company has never been searched yet.');
  db.close();
  process.exit(0);
}

console.log('📋 Current cache:');
console.log(`   Company: ${existing.company_name}`);
console.log(`   Searched: ${new Date(existing.searched_at * 1000).toLocaleString()}`);
console.log(`   Has webIntelligence: ${existing.has_web_intel ? 'YES' : 'NO'}`);

if (existing.has_web_intel) {
  console.log('\n✅ This cache already has webIntelligence data!');
  console.log('   No need to refresh. Evidence should already be available.');
  db.close();
  process.exit(0);
}

console.log('\n🗑️  Deleting cache entry...');

db.prepare(`
  DELETE FROM interview_questions_cache
  WHERE LOWER(company_name) = LOWER(?)
`).run(companyName);

console.log('✅ Cache deleted successfully!');
console.log('\n📝 Next steps:');
console.log('   1. Go to Interview Coach for this job');
console.log('   2. Click the search button');
console.log('   3. Search will re-run with Tavily (~$0.01)');
console.log('   4. webIntelligence will be saved this time');
console.log('   5. Evidence chips will appear in People Profiles!');
console.log('\n💡 This is a ONE-TIME cost to capture the evidence data.');

db.close();

