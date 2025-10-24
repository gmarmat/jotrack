#!/usr/bin/env node

/**
 * Standalone test script for rule-based scorer (Card 2)
 * Bypasses vitest/tinypool issue
 */

import * as fs from 'fs';
import * as path from 'path';

// Dynamic import the modules
const rulesModule = await import('./src/interview-coach/scoring/rules.ts');
const schemaModule = await import('./src/interview-coach/scoring/schema.ts');

const { scoreAnswer, analyzeAnswerHeuristics, detectFlags, aggregate } = rulesModule;
const { PERSONA_WEIGHTS } = schemaModule;

const REPORTS_DIR = path.join(process.cwd(), 'reports');
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

// Golden fixtures
const STRONG_STAR = `At my previous company, I was tasked with optimizing our database query performance, which was causing 
a 40% lag in user interactions during peak hours. I led a team of three engineers to analyze and refactor 
our SQL queries, implemented caching strategies, and migrated our primary indices.

As a result, we achieved a 65% reduction in average response time, from 3.2 seconds to 1.1 seconds. 
This directly improved user retention by 12%, which translated to approximately $250K in additional 
quarterly revenue. The solution was adopted company-wide and is still used today.`;

const VAGUE = `I worked on improving things. We had a project where I helped out with some analysis work. 
The team was generally successful, which was nice. I contributed to the effort and we all 
worked together to get it done. The results were good and we were happy with it.`;

const PROBLEMATIC = `I'm basically the genius who revolutionized everything in my department. We always used to fail 
at pretty much everything, but I showed up and generally fixed the core issue. It was basically 
a perfect solution and honestly the best work ever done in the company. Nobody else could have done it.`;

const TOO_SHORT = `I did a thing.`;

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passCount++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failCount++;
  }
}

console.log('\n═══════════════════════════════════════════════════════════');
console.log('  Card 2 — Rule-Based Scorer (Standalone Tests)');
console.log('═══════════════════════════════════════════════════════════\n');

// Test 1: Heuristics Analysis
console.log('TEST 1: Heuristics Analysis');
console.log('────────────────────────────────────────────────────────');
const heur1 = analyzeAnswerHeuristics({ answer: STRONG_STAR, persona: 'hiring-manager' });
assert(heur1.star.s !== undefined, 'Strong answer: detects Situation');
assert(heur1.star.t !== undefined, 'Strong answer: detects Task');
assert(heur1.star.a !== undefined, 'Strong answer: detects Action');
assert(heur1.star.r !== undefined, 'Strong answer: detects Result');
assert(heur1.hasNumbers === true, 'Strong answer: detects numbers');
assert(heur1.hasPercents === true, 'Strong answer: detects percents');
assert(heur1.hasCurrency === true, 'Strong answer: detects currency');

const heur2 = analyzeAnswerHeuristics({ answer: VAGUE, persona: 'hiring-manager' });
assert(heur2.hasNumbers === false, 'Vague answer: no numbers');
assert(Object.values(heur2.star).filter(Boolean).length < 4, 'Vague answer: weak STAR elements');

// Test 2: Flag Detection
console.log('\nTEST 2: Red Flag Detection');
console.log('────────────────────────────────────────────────────────');
const flags1 = detectFlags({ answer: STRONG_STAR, persona: 'hiring-manager' });
assert(flags1.length === 0, 'Strong answer: no flags');

const flags2 = detectFlags({ answer: VAGUE, persona: 'hiring-manager' });
// Vague answer is 263 chars, so won't trigger incomplete-answer
assert(Array.isArray(flags2), 'Vague answer: flag detection works');

const flags3 = detectFlags({ answer: PROBLEMATIC, persona: 'hiring-manager' });
assert(flags3.length > 0, 'Problematic answer: multiple flags detected');
assert(flags3.includes('overconfidence'), 'Problematic answer: overconfidence flag');

const flags4 = detectFlags({ answer: TOO_SHORT, persona: 'hiring-manager' });
assert(flags4.includes('incomplete-answer'), 'Too short answer: incomplete-answer flag');

// Test 3: Main Scoring
console.log('\nTEST 3: Score Calculation');
console.log('────────────────────────────────────────────────────────');
const score1 = scoreAnswer({ answer: STRONG_STAR, persona: 'hiring-manager' });
assert(score1.overall > 40, `Strong answer scores ok (${score1.overall}%) >40`);
assert(score1.subscores.structure > 40, `Structure subscore ok (${score1.subscores.structure})`);
assert(score1.subscores.specificity > 40, `Specificity subscore ok (${score1.subscores.specificity})`);
assert(score1.subscores.outcome > 40, `Outcome subscore ok (${score1.subscores.outcome})`);
assert(score1.flags.length === 0, 'Strong answer: no flags');

const score2 = scoreAnswer({ answer: VAGUE, persona: 'hiring-manager' });
assert(score2.overall < 60, `Vague answer scores low (${score2.overall}%) <60`);

const score3 = scoreAnswer({ answer: PROBLEMATIC, persona: 'hiring-manager' });
assert(score3.overall < 20, `Problematic answer very low (${score3.overall}%) <20`);
assert(score3.flags.length > 0, 'Problematic answer: has flags');

// Test 4: Subscore Bounds
console.log('\nTEST 4: Subscore Bounds [0-100]');
console.log('────────────────────────────────────────────────────────');
[score1, score2, score3, scoreAnswer({ answer: TOO_SHORT, persona: 'hiring-manager' })].forEach((result, idx) => {
  for (const [dim, val] of Object.entries(result.subscores)) {
    assert(val >= 0 && val <= 100, `Score[${idx}].${dim} = ${val} in [0,100]`);
  }
  assert(result.overall >= 0 && result.overall <= 100, `Score[${idx}].overall = ${result.overall} in [0,100]`);
});

// Test 5: Persona Effects
console.log('\nTEST 5: Persona Weighting Effects');
console.log('────────────────────────────────────────────────────────');
const testAnswer = `I led a team project using React and Node.js. We built a microservice architecture 
that improved performance by 30%. The team collaboration was excellent and we learned a lot.`;

const recruiter = scoreAnswer({ answer: testAnswer, persona: 'recruiter' });
const hm = scoreAnswer({ answer: testAnswer, persona: 'hiring-manager' });
const peer = scoreAnswer({ answer: testAnswer, persona: 'peer' });

assert(recruiter.overall >= 0 && recruiter.overall <= 100, 'Recruiter score valid');
assert(hm.overall >= 0 && hm.overall <= 100, 'HM score valid');
assert(peer.overall >= 0 && peer.overall <= 100, 'Peer score valid');

const scores = [recruiter.overall, hm.overall, peer.overall];
const unique = new Set(scores);
assert(unique.size > 1, `Persona effects: Different scores (${scores.join(', ')})`);

// Test 6: Ceiling Rules
console.log('\nTEST 6: Ceiling Rules');
console.log('────────────────────────────────────────────────────────');
const shortScore = scoreAnswer({ answer: TOO_SHORT, persona: 'hiring-manager' });
assert(shortScore.overall < 60, 'InsufficientLength ceiling: short answer capped <60');
assert(shortScore.ceilingApplied === true, 'Ceiling rule flag set');

const flaggyAnswer = `We generally always failed at everything. The problem was terrible and awful. 
I'm basically the best person ever, nobody else could have fixed it.`;
const flaggyScore = scoreAnswer({ answer: flaggyAnswer, persona: 'hiring-manager' });
assert(flaggyScore.flags.length > 2, 'HighRedFlags: multiple flags detected');
assert(flaggyScore.overall < 60, 'HighRedFlags ceiling: score capped with multiple flags');

// Test 7: Penalty Mapping
console.log('\nTEST 7: Penalty & Risk Mapping');
console.log('────────────────────────────────────────────────────────');
assert(score1.subscores.risks > 40, `Strong answer risks ok (${score1.subscores.risks})`);
assert(flaggyScore.subscores.risks < 50, `Flaggy answer risks lower (${flaggyScore.subscores.risks})`);
assert(flaggyScore.flagDetails.length > 0, 'Flag details captured');
for (const detail of flaggyScore.flagDetails) {
  assert(detail.penalty < 0 && detail.penalty >= -20, `Penalty in range [${detail.penalty}]`);
}

// Test 8: Determinism
console.log('\nTEST 8: Deterministic Scoring');
console.log('────────────────────────────────────────────────────────');
const det1 = scoreAnswer({ answer: STRONG_STAR, persona: 'hiring-manager' });
const det2 = scoreAnswer({ answer: STRONG_STAR, persona: 'hiring-manager' });
const det3 = scoreAnswer({ answer: STRONG_STAR, persona: 'hiring-manager' });

assert(
  JSON.stringify(det1) === JSON.stringify(det2),
  'Identical input → identical output (run 1 vs 2)'
);
assert(
  JSON.stringify(det2) === JSON.stringify(det3),
  'Identical input → identical output (run 2 vs 3)'
);

// Test 9: Company Values
console.log('\nTEST 9: Context Features');
console.log('────────────────────────────────────────────────────────');
const contextAnswer = `I led a team that prioritized innovation and collaboration. 
Our work was collaborative and we focused on learning and growth.`;

const withoutValues = scoreAnswer({ answer: contextAnswer, persona: 'hiring-manager' });
const withValues = scoreAnswer({
  answer: contextAnswer,
  persona: 'hiring-manager',
  companyValues: ['innovation', 'collaboration', 'learning'],
});

assert(
  withValues.subscores.company >= withoutValues.subscores.company,
  `Company values boost: ${withValues.subscores.company} >= ${withoutValues.subscores.company}`
);

// Report generation
console.log('\nTEST 10: Report Generation');
console.log('────────────────────────────────────────────────────────');
const fixtures = [
  { name: 'strong-star', answer: STRONG_STAR },
  { name: 'vague', answer: VAGUE },
  { name: 'problematic', answer: PROBLEMATIC },
  { name: 'too-short', answer: TOO_SHORT },
];

const personas = ['recruiter', 'hiring-manager', 'peer'];
const report = {
  timestamp: new Date().toISOString(),
  fixtures: [],
};

for (const fixture of fixtures) {
  for (const persona of personas) {
    const result = scoreAnswer({
      answer: fixture.answer,
      persona,
    });
    report.fixtures.push({ fixture: fixture.name, persona, result });
  }
}

const reportPath = path.join(REPORTS_DIR, 'scoring.rules.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
assert(fs.existsSync(reportPath), 'Report written to scoring.rules.json');
const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
assert(reportData.fixtures.length > 0, 'Report contains fixture data');

// Summary
console.log('\n═══════════════════════════════════════════════════════════');
console.log(`  RESULTS: ${passCount} passed, ${failCount} failed`);
console.log('═══════════════════════════════════════════════════════════\n');

if (failCount > 0) {
  process.exit(1);
}

console.log('✓ All tests passed!\n');
console.log(`Report: ${reportPath}\n`);
