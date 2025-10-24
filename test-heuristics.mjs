const rulesModule = await import('./src/interview-coach/scoring/rules.ts');
const {analyzeAnswerHeuristics} = rulesModule;

const answer = `At my company, I led a team that improved performance by 30%. We achieved great results using SQL optimization with advanced caching.`;

const result = analyzeAnswerHeuristics({answer, persona: 'hiring-manager'});
console.log('Heuristics result:', JSON.stringify(result, null, 2));
