const rulesModule = await import('./src/interview-coach/scoring/rules.ts');
const {analyzeAnswerHeuristics} = rulesModule;

// Need to manually calculate subscores without ceilings
const STRONG_STAR_ANSWER = `At my previous company, I was tasked with optimizing our database query performance, which was causing 
a 40% lag in user interactions during peak hours. I led a team of three engineers to analyze and refactor 
our SQL queries, implemented caching strategies, and migrated our primary indices.

As a result, we achieved a 65% reduction in average response time, from 3.2 seconds to 1.1 seconds. 
This directly improved user retention by 12%, which translated to approximately $250K in additional 
quarterly revenue. The solution was adopted company-wide and is still used today.`;

const heur = analyzeAnswerHeuristics({answer: STRONG_STAR_ANSWER, persona: 'hiring-manager'});
console.log('STAR analysis:');
console.log('- s:', heur.star.s ? 'YES' : 'NO');
console.log('- t:', heur.star.t ? 'YES' : 'NO');
console.log('- a:', heur.star.a ? 'YES' : 'NO');
console.log('- r:', heur.star.r ? 'YES' : 'NO');
const starCount = Object.values(heur.star).filter(Boolean).length;
console.log('- STAR count:', starCount);

console.log('\nExpected subscores (before ceilings):');
console.log('- structure: Math.min(5, ' + starCount + ' * 1.25) = ' + Math.min(5, starCount * 1.25));
console.log('- has numbers:', heur.hasNumbers);
console.log('- has percents:', heur.hasPercents);
console.log('- has currency:', heur.hasCurrency);

// Manually calc specificity
let specificityScore = 2;
if (heur.hasNumbers) specificityScore += 1.5;
if (heur.hasPercents) specificityScore += 0.75;
if (heur.hasCurrency) specificityScore += 0.75;
if (/\b(sql|python|javascript|typescript|java|react|node|aws|azure|salesforce|jira|confluence)\b/i.test(STRONG_STAR_ANSWER)) {
  specificityScore += 0.5;
}
console.log('- specificity: ' + Math.min(5, specificityScore));

// Check answer length
const answerLength = STRONG_STAR_ANSWER.trim().length;
console.log('\nAnswer length:', answerLength);
console.log('- >= 100 chars? YES - should not trigger InsufficientLength ceiling');
