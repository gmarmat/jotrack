const { execSync } = require('child_process');
const fs = require('fs');

console.log('Running Coach Mode v1.1 Tests...\n');

const tests = [
  'gather-intake.spec.ts',
  'fit-evidence.spec.ts',
  'no-hallucination.spec.ts',
  'citations.spec.ts'
];

let passed = 0;
let failed = 0;

for (const test of tests) {
  try {
    console.log(`\n▶️  Running ${test}...`);
    const output = execSync(`npx playwright test ${test} --reporter=list --timeout=60000`, {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    console.log(output);
    console.log(`✅ ${test} PASSED\n`);
    passed++;
  } catch (error) {
    console.log(`❌ ${test} FAILED\n`);
    console.log(error.stdout || error.message);
    failed++;
  }
}

console.log('\n' + '='.repeat(60));
console.log(`\nTest Results: ${passed} passed, ${failed} failed`);
console.log('\n' + '='.repeat(60));

if (failed > 0) {
  process.exit(1);
}

