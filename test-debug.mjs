import { scoreAnswer, analyzeAnswerHeuristics, detectFlags } from './src/interview-coach/scoring/rules.ts';

const answer = `At my previous company, I was tasked with optimizing our database query performance, which was causing 
a 40% lag in user interactions during peak hours. I led a team of three engineers to analyze and refactor 
our SQL queries, implemented caching strategies, and migrated our primary indices.

As a result, we achieved a 65% reduction in average response time, from 3.2 seconds to 1.1 seconds. 
This directly improved user retention by 12%, which translated to approximately $250K in additional 
quarterly revenue. The solution was adopted company-wide and is still used today.`;

const ctx = { answer, persona: 'hiring-manager' };

console.log('Analyzing heuristics...');
const heur = analyzeAnswerHeuristics(ctx);
console.log('Heuristics:', JSON.stringify(heur, null, 2));

console.log('\nDetecting flags...');
const flags = detectFlags(ctx);
console.log('Flags:', flags);

console.log('\nScoring answer...');
const result = scoreAnswer(ctx);
console.log('Result:', JSON.stringify(result, null, 2));
