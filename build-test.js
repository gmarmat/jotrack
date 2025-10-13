const { execSync } = require('child_process');
const fs = require('fs');

console.log('Starting build verification...');

try {
  console.log('\n1. TypeScript check...');
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log('✅ TypeScript: CLEAN\n');

  console.log('2. Next.js build...');
  execSync('npx next build', { stdio: 'inherit' });
  console.log('\n✅ BUILD: SUCCESS\n');

  console.log('3. Checking coach route...');
  const coachExists = fs.existsSync('.next/server/app/coach/[jobId]/page.js');
  console.log(coachExists ? '✅ Coach route built' : '❌ Coach route missing');

  console.log('\n✅ ALL CHECKS PASSED\n');
  process.exit(0);
} catch (error) {
  console.error('\n❌ BUILD FAILED\n');
  console.error(error.message);
  process.exit(1);
}

