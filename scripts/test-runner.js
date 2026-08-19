import fg from 'fast-glob';
import { spawnSync } from 'node:child_process';
import fsp from 'node:fs/promises';

const files = await fg('dist-test/tests/**/*.test.js');
if (files.length === 0) {
  console.error('No test files found in dist-test/tests/**/*.test.js');
  process.exit(1);
}
files.sort();

const coverageFlag = process.argv.includes('--coverage') ? ['--experimental-test-coverage'] : [];

const suiteResults = [];

for (const file of files) {
  console.log(`\n========================================`);
  console.log(`▶ RUNNING SUITE: ${file}`);
  console.log(`========================================`);
  const result = spawnSync(process.execPath, ['--test', ...coverageFlag, file], {
    stdio: 'pipe',
    encoding: 'utf-8',
    shell: false
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  const passed = result.status === 0;
  console.log(`◀ FINISHED: ${file} (Exit code: ${result.status})\n`);

  suiteResults.push({
    file,
    status: result.status,
    passed,
    error: passed ? null : (result.stderr || result.stdout || 'Unknown failure')
  });
}

const failedSuites = suiteResults.filter(s => !s.passed);

if (process.env.GITHUB_STEP_SUMMARY) {
  let summary = `### Test Run Summary (${process.platform} - Node ${process.version})\n\n`;
  summary += `| Suite | Status | Exit Code |\n|---|---|---|\n`;
  for (const s of suiteResults) {
    summary += `| \`${s.file}\` | ${s.passed ? '✅ PASS' : '❌ FAIL'} | ${s.status} |\n`;
  }
  if (failedSuites.length > 0) {
    summary += `\n#### Failures:\n`;
    for (const f of failedSuites) {
      summary += `\n**${f.file}**:\n\`\`\`text\n${f.error}\n\`\`\`\n`;
    }
  }
  await fsp.appendFile(process.env.GITHUB_STEP_SUMMARY, summary, 'utf-8').catch(() => {});
}

if (failedSuites.length > 0) {
  console.error(`\n❌ TEST RUN FAILED: ${failedSuites.length} suite(s) failed out of ${files.length}.`);
  for (const f of failedSuites) {
    console.error(`  - ${f.file} (Exit code: ${f.status})`);
  }
  process.exit(1);
} else {
  console.log(`\n✔ ALL ${suiteResults.length} TEST SUITES PASSED SUCCESSFULLY.`);
}
