import fg from 'fast-glob';
import { spawnSync } from 'node:child_process';

const files = await fg('dist-test/tests/**/*.test.js');
if (files.length === 0) {
  console.error('No test files found in dist-test/tests/**/*.test.js');
  process.exit(1);
}
files.sort();

const coverageFlag = process.argv.includes('--coverage') ? ['--experimental-test-coverage'] : [];

let totalFailed = 0;
let totalPassed = 0;

for (const file of files) {
  const result = spawnSync(process.execPath, ['--test', ...coverageFlag, file], {
    stdio: 'inherit',
    shell: false
  });

  if (result.status !== 0) {
    totalFailed++;
  } else {
    totalPassed++;
  }
}

if (totalFailed > 0) {
  console.error(`\n❌ Test run failed: ${totalFailed} suite(s) failed out of ${files.length}.`);
  process.exit(1);
} else {
  console.log(`\n✔ All ${totalPassed} test suites passed successfully.`);
}
