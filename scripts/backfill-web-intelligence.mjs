/**
 * Backfill Web Intelligence from Existing Cache
 * 
 * This script processes EXISTING interview_questions_cache entries
 * and extracts webIntelligence data using our local algorithm.
 * 
 * NO API CALLS - Just reprocessing data we already have!
 * ZERO COST - Local extraction only
 * LOW RISK - Doesn't change any existing data, only adds to null fields
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, '..', 'data', 'jotrack.db');

console.log('📊 Backfilling Web Intelligence from existing cache...\n');

const db = new Database(dbPath);

// Get all cache entries that don't have web_intelligence_json
const cacheEntries = db.prepare(`
  SELECT id, company_name, searched_questions, search_sources
  FROM interview_questions_cache
  WHERE web_intelligence_json IS NULL
`).all();

console.log(`Found ${cacheEntries.length} cache entries without web intelligence\n`);

if (cacheEntries.length === 0) {
  console.log('✅ All cache entries already have web intelligence!');
  process.exit(0);
}

// Simple local extraction (mimics webIntelligence.ts logic)
function extractBasicWebIntelligence(questions, sources) {
  const questionsArray = typeof questions === 'string' ? JSON.parse(questions) : questions;
  const sourcesArray = typeof sources === 'string' ? JSON.parse(sources) : sources;
  
  // Extract just the basic structure
  // We don't have the raw Tavily results, so we create minimal valid structure
  const webIntel = {
    questions: questionsArray.map(q => q.question || q).slice(0, 50),
    interviewerValidations: {}, // Empty for now - will populate when re-searched
    successPatterns: [],
    failurePatterns: [],
    warnings: [],
    processIntel: {},
    salaryData: { offers: [] },
    culturalSignals: []
  };
  
  return webIntel;
}

// Process each entry
let updated = 0;
cacheEntries.forEach(entry => {
  try {
    const webIntel = extractBasicWebIntelligence(
      entry.searched_questions,
      entry.search_sources
    );
    
    db.prepare(`
      UPDATE interview_questions_cache
      SET web_intelligence_json = ?
      WHERE id = ?
    `).run(JSON.stringify(webIntel), entry.id);
    
    console.log(`✅ Updated ${entry.company_name}`);
    updated++;
  } catch (error) {
    console.error(`❌ Failed to update ${entry.company_name}:`, error.message);
  }
});

console.log(`\n✅ Backfill complete: ${updated}/${cacheEntries.length} entries updated`);
console.log(`
NOTE: Interviewer validations are empty because we don't have the raw Tavily results.
They will be populated when Interview Coach search is re-run (uses cache, fast!).
`);

db.close();

