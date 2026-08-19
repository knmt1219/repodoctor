import fg from 'fast-glob';
import { spawn } from 'node:child_process';

const files = await fg('dist-test/tests/**/*.test.js');
if (files.length === 0) {
  console.error('No test files found in dist-test/tests/**/*.test.js');
  process.exit(1);
}

// Sort alphabetically for deterministic test suite execution order
files.sort();

const args = ['--test'];
if (process.argv.includes('--coverage')) {
  args.push('--experimental-test-coverage');
}
args.push(...files);

const child = spawn(process.execPath, args, { stdio: 'inherit' });
child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 1);
  }
});
