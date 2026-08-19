import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runCheckCommand } from '../src/cli/commands/check.js';
import { runExplainCommand } from '../src/cli/commands/explain.js';
import { runRulesCommand } from '../src/cli/commands/rules.js';
import os from 'node:os';
import path from 'node:path';
import fsp from 'node:fs/promises';

describe('CLI Commands Integration', () => {
  it('runRulesCommand should execute successfully', async () => {
    const code = await runRulesCommand();
    assert.equal(code, 0);
  });

  it('runRulesCommand should filter by category', async () => {
    const code = await runRulesCommand('security');
    assert.equal(code, 0);
  });

  it('runExplainCommand should return 0 for valid rule', async () => {
    const code = await runExplainCommand('sec-001');
    assert.equal(code, 0);
  });

  it('runExplainCommand should return 1 for non-existent rule', async () => {
    const code = await runExplainCommand('non-existent-rule');
    assert.equal(code, 1);
  });

  it('runCheckCommand should run and return an exit code', async () => {
    const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'repodoctor-cli-test-'));
    try {
      // Empty directory will have missing LICENSE, README, etc. and score will trigger non-zero code or warnings
      const code = await runCheckCommand(tmpDir, { format: 'json' });
      assert.ok(code === 0 || code === 1);
    } finally {
      await fsp.rm(tmpDir, { recursive: true, force: true });
    }
  });
});
