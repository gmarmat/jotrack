const rulesModule = await import('./src/interview-coach/scoring/rules.ts');
const schemaModule = await import('./src/interview-coach/scoring/schema.ts');

const {analyzeAnswerHeuristics, detectFlags, scoreAnswer} = rulesModule;
const {PERSONA_WEIGHTS} = schemaModule;

const answer = `At my company, I was tasked with optimizing performance. I led a team that implemented SQL optimization.
As a result, we improved performance by 30% and this saved the company $250K annually.`;

console.log('Step 1: Heuristics');
const heur = analyzeAnswerHeuristics({answer, persona: 'hiring-manager'});
console.log('- STAR count:', Object.values(heur.star).filter(Boolean).length);
console.log('- Has numbers:', heur.hasNumbers);
console.log('- Has percents:', heur.hasPercents);
console.log('- Has currency:', heur.hasCurrency);

console.log('\nStep 2: Flags');
const flags = detectFlags({answer, persona: 'hiring-manager'});
console.log('- Flags found:', flags);
console.log('- Flag count:', flags.length);

console.log('\nStep 3: Score');
const result = scoreAnswer({answer, persona: 'hiring-manager'});
console.log('- Overall:', result.overall);
console.log('- Subscores:', result.subscores);
console.log('- Ceiling applied:', result.ceilingApplied);
console.log('- Flags:', result.flags);
