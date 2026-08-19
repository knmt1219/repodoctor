import fg from 'fast-glob';
import { spawnSync } from 'node:child_process';

const files = await fg('dist-test/tests/**/*.test.js');
if (files.length === 0) {
  console.error('No test files found');
  process.exit(1);
}
files.sort();

const coverageFlag = process.argv.includes('--coverage') ? ['--experimental-test-coverage'] : [];

// Execute test suites with stdio inherit
const result = spawnSync(process.execPath, ['--test', ...coverageFlag, ...files], {
  stdio: 'inherit',
  shell: false
});

if (result.status !== 0) {
  console.error(`\nBatch test execution failed with exit code ${result.status}. Running individual suites to isolate failure...`);
  for (const file of files) {
    const single = spawnSync(process.execPath, ['--test', file], { encoding: 'utf-8' });
    if (single.status !== 0) {
      console.error(`\n❌ FAILED SUITE: ${file}`);
      if (single.stdout) console.error(single.stdout);
      if (single.stderr) console.error(single.stderr);
    } else {
      console.log(`✔ PASSED: ${file}`);
    }
  }
  process.exit(result.status ?? 1);
}
