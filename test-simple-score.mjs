const rulesModule = await import('./src/interview-coach/scoring/rules.ts');
const {scoreAnswer} = rulesModule;

const answer = `I led the project and achieved results.`;

const result = scoreAnswer({answer, persona: 'hiring-manager'});
console.log('Simple score:', result);
