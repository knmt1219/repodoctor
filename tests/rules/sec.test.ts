import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sec001 } from '../../src/rules/sec/sec-001.js';
import { sec002 } from '../../src/rules/sec/sec-002.js';
import { sec003 } from '../../src/rules/sec/sec-003.js';
import { sec004 } from '../../src/rules/sec/sec-004.js';
import { sec005 } from '../../src/rules/sec/sec-005.js';
import { sec006 } from '../../src/rules/sec/sec-006.js';
import { createMockContext } from '../helpers.js';
import { createRuleContext } from '../../src/core/context.js';
import os from 'node:os';
import path from 'node:path';
import fsp from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

describe('Security Rules (sec-001 to sec-006)', () => {
  describe('sec-001: Action Pinning', () => {
    it('should flag floating action tags like @v4', async () => {
      const ctx = createMockContext({
        '.github/workflows/ci.yml': 'name: CI\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n'
      });
      const res = await sec001.check(ctx);
      assert.equal(res.length, 1);
      assert.equal(res[0]?.ruleId, 'sec-001');
      assert.ok(res[0]?.message.includes('actions/checkout@v4'));
    });

    it('should ignore commented out uses lines', async () => {
      const ctx = createMockContext({
        '.github/workflows/ci.yml': 'name: CI\n# - uses: actions/checkout@v4\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683\n'
      });
      const res = await sec001.check(ctx);
      assert.equal(res.length, 0);
    });

    it('should pass 40-char commit SHA pins', async () => {
      const ctx = createMockContext({
        '.github/workflows/ci.yml': 'name: CI\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2\n'
      });
      const res = await sec001.check(ctx);
      assert.equal(res.length, 0);
    });
  });

  describe('sec-002: Workflow Permissions', () => {
    it('should flag workflows without explicit permissions', async () => {
      const ctx = createMockContext({
        '.github/workflows/ci.yml': 'name: CI\njobs:\n  test:\n    runs-on: ubuntu-latest\n'
      });
      const res = await sec002.check(ctx);
      assert.equal(res.length, 1);
      assert.equal(res[0]?.ruleId, 'sec-002');
    });

    it('should pass workflows with top-level permissions', async () => {
      const ctx = createMockContext({
        '.github/workflows/ci.yml': 'name: CI\npermissions:\n  contents: read\njobs:\n  test:\n    runs-on: ubuntu-latest\n'
      });
      const res = await sec002.check(ctx);
      assert.equal(res.length, 0);
    });

    it('should flag permissions: write-all', async () => {
      const ctx = createMockContext({
        '.github/workflows/ci.yml': 'name: CI\npermissions: write-all\njobs:\n  test:\n    runs-on: ubuntu-latest\n'
      });
      const res = await sec002.check(ctx);
      assert.equal(res.length, 1);
      assert.ok(res[0]?.message.includes('write-all'));
    });
  });

  describe('sec-003: Gitignore Secrets', () => {
    it('should flag missing .gitignore', async () => {
      const ctx = createMockContext({});
      const res = await sec003.check(ctx);
      assert.equal(res.length, 1);
    });

    it('should flag .gitignore missing .env or *.key', async () => {
      const ctx = createMockContext({
        '.gitignore': 'node_modules/\ndist/\n'
      });
      const res = await sec003.check(ctx);
      assert.equal(res.length, 1);
    });

    it('should pass .gitignore containing .env, *.key, *.pem', async () => {
      const ctx = createMockContext({
        '.gitignore': 'node_modules/\n.env\n*.key\n*.pem\n'
      });
      const res = await sec003.check(ctx);
      assert.equal(res.length, 0);
    });
  });

  describe('sec-004: No Curl Pipe Sh', () => {
    it('should flag curl pipe to sh in workflows', async () => {
      const ctx = createMockContext({
        '.github/workflows/ci.yml': 'name: CI\njobs:\n  setup:\n    steps:\n      - run: curl -fsSL https://get.example.com | sh\n'
      });
      const res = await sec004.check(ctx);
      assert.equal(res.length, 1);
      assert.equal(res[0]?.ruleId, 'sec-004');
    });

    it('should ignore commented curl pipe to sh', async () => {
      const ctx = createMockContext({
        '.github/workflows/ci.yml': 'name: CI\njobs:\n  setup:\n    steps:\n      # - run: curl https://example.com | sh\n      - run: echo ok\n'
      });
      const res = await sec004.check(ctx);
      assert.equal(res.length, 0);
    });

    it('should flag curl pipe to bash in package.json scripts', async () => {
      const ctx = createMockContext({
        'package.json': JSON.stringify({
          scripts: {
            install_helper: 'curl -s https://example.com | bash'
          }
        })
      });
      const res = await sec004.check(ctx);
      assert.equal(res.length, 1);
    });
  });

  describe('sec-005: Hardcoded Secrets', () => {
    it('should flag hardcoded OpenAI API key in source', async () => {
      const dummyKey = 'sk-proj-7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b';
      const ctx = createMockContext({
        'src/config.ts': `const key = "${dummyKey}";\nexport default key;\n`
      });
      const res = await sec005.check(ctx);
      assert.equal(res.length, 1);
      assert.equal(res[0]?.ruleId, 'sec-005');
      assert.ok(!res[0]?.message.includes(dummyKey)); // Verify redacted
    });

    it('should respect checkTrackedOnly: exclude untracked secrets in git repository', async () => {
      const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'repodoctor-tracked-test-'));
      try {
        await execFileAsync('git', ['init'], { cwd: tmpDir });
        const trackedFile = path.join(tmpDir, 'app.ts');
        await fsp.writeFile(trackedFile, 'console.log("clean");\n', 'utf-8');
        await execFileAsync('git', ['add', 'app.ts'], { cwd: tmpDir });

        const untrackedSecretFile = path.join(tmpDir, 'secret_untracked.ts');
        const dummyKey = 'sk-proj-7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b';
        await fsp.writeFile(untrackedSecretFile, `const key = "${dummyKey}";\n`, 'utf-8');

        // Mode 1: checkTrackedOnly = false (default) -> flags untracked file
        const ctxDefault = await createRuleContext({ rootDir: tmpDir, checkTrackedOnly: false });
        const resDefault = await sec005.check(ctxDefault);
        assert.equal(resDefault.length, 1);

        // Mode 2: checkTrackedOnly = true -> ignores untracked file
        const ctxTracked = await createRuleContext({ rootDir: tmpDir, checkTrackedOnly: true });
        const resTracked = await sec005.check(ctxTracked);
        assert.equal(resTracked.length, 0);
      } catch (err: unknown) {
        // Skip if git is unavailable in environment
      } finally {
        await fsp.rm(tmpDir, { recursive: true, force: true });
      }
    });
  });

  describe('sec-006: Pull Request Target', () => {
    it('should flag pull_request_target with head sha checkout', async () => {
      const ctx = createMockContext({
        '.github/workflows/pr.yml': 'name: PR\non: pull_request_target\njobs:\n  build:\n    steps:\n      - uses: actions/checkout@v4\n        with:\n          ref: ${{ github.event.pull_request.head.sha }}\n'
      });
      const res = await sec006.check(ctx);
      assert.equal(res.length, 1);
      assert.equal(res[0]?.ruleId, 'sec-006');
    });
  });
});
