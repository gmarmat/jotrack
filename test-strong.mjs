const rulesModule = await import('./src/interview-coach/scoring/rules.ts');
const {scoreAnswer, detectFlags} = rulesModule;

const STRONG_STAR_ANSWER = `At my previous company, I was tasked with optimizing our database query performance, which was causing 
a 40% lag in user interactions during peak hours. I led a team of three engineers to analyze and refactor 
our SQL queries, implemented caching strategies, and migrated our primary indices.

As a result, we achieved a 65% reduction in average response time, from 3.2 seconds to 1.1 seconds. 
This directly improved user retention by 12%, which translated to approximately $250K in additional 
quarterly revenue. The solution was adopted company-wide and is still used today.`;

const flags = detectFlags({answer: STRONG_STAR_ANSWER, persona: 'hiring-manager'});
console.log('Flags detected:', flags);

const result = scoreAnswer({answer: STRONG_STAR_ANSWER, persona: 'hiring-manager'});
console.log('Result:', result);
