const rulesModule = await import('./src/interview-coach/scoring/rules.ts');
const schemaModule = await import('./src/interview-coach/scoring/schema.ts');

console.log('Available exports from rules:', Object.keys(rulesModule));
console.log('Available exports from schema:', Object.keys(schemaModule));

const {scoreAnswer} = rulesModule;
const {PERSONA_WEIGHTS} = schemaModule;

if (!scoreAnswer) {
  console.log('scoreAnswer is NOT exported!');
  process.exit(1);
}

console.log('\nTesting scoreAnswer...');
const result = scoreAnswer({
  answer: 'I led a team that improved performance by 30%.',
  persona: 'hiring-manager'
});

console.log('Result structure:', Object.keys(result));
console.log('Overall:', result.overall);
console.log('Subscores:', result.subscores);
