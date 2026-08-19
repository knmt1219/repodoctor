import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { applyRuleFixes } from '../src/core/fixers.js';
import { RuleResult } from '../src/core/types.js';
import { createRuleContext } from '../src/core/context.js';
import os from 'node:os';
import path from 'node:path';
import fsp from 'node:fs/promises';
import { fileExists, readFileSafe } from '../src/utils/fs.js';

describe('Auto-Fixers', () => {
  it('should auto-fix git-001 by creating .gitattributes', async () => {
    const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'repodoctor-fix-git-'));
    try {
      const context = await createRuleContext({ rootDir: tmpDir });
      const violations: RuleResult[] = [
        {
          ruleId: 'git-001',
          ruleTitle: 'Gitattributes',
          category: 'git',
          severity: 'warn',
          message: 'Missing .gitattributes',
          fixable: true
        }
      ];

      const fixes = await applyRuleFixes(violations, context);
      assert.equal(fixes.length, 1);
      assert.equal(fixes[0]?.fixed, true);

      const targetPath = path.join(tmpDir, '.gitattributes');
      assert.equal(await fileExists(targetPath), true);
      const content = await readFileSafe(targetPath);
      assert.ok(content?.includes('* text=auto eol=lf'));
    } finally {
      await fsp.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('should auto-fix sec-003 by adding secrets to .gitignore', async () => {
    const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'repodoctor-fix-sec-'));
    try {
      const gitignorePath = path.join(tmpDir, '.gitignore');
      await fsp.writeFile(gitignorePath, 'node_modules\n');

      const context = await createRuleContext({ rootDir: tmpDir });
      const violations: RuleResult[] = [
        {
          ruleId: 'sec-003',
          ruleTitle: 'Gitignore secrets',
          category: 'security',
          severity: 'error',
          file: '.gitignore',
          message: 'Missing .env',
          fixable: true
        }
      ];

      const fixes = await applyRuleFixes(violations, context);
      assert.equal(fixes.length, 1);
      assert.equal(fixes[0]?.fixed, true);

      const content = await readFileSafe(gitignorePath);
      assert.ok(content?.includes('.env'));
      assert.ok(content?.includes('*.key'));
    } finally {
      await fsp.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('should auto-fix oss-005 by creating SECURITY.md', async () => {
    const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'repodoctor-fix-oss5-'));
    try {
      const context = await createRuleContext({ rootDir: tmpDir });
      const violations: RuleResult[] = [
        {
          ruleId: 'oss-005',
          ruleTitle: 'Security policy',
          category: 'oss',
          severity: 'warn',
          message: 'Missing SECURITY.md',
          fixable: true
        }
      ];

      const fixes = await applyRuleFixes(violations, context);
      assert.equal(fixes.length, 1);
      assert.equal(fixes[0]?.fixed, true);

      const targetPath = path.join(tmpDir, 'SECURITY.md');
      assert.equal(await fileExists(targetPath), true);
      const content = await readFileSafe(targetPath);
      assert.ok(content?.includes('Reporting a Vulnerability'));
    } finally {
      await fsp.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('should auto-fix oss-007 by creating pull_request_template.md', async () => {
    const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'repodoctor-fix-oss7-'));
    try {
      const context = await createRuleContext({ rootDir: tmpDir });
      const violations: RuleResult[] = [
        {
          ruleId: 'oss-007',
          ruleTitle: 'PR template',
          category: 'oss',
          severity: 'info',
          message: 'Missing PR template',
          fixable: true
        }
      ];

      const fixes = await applyRuleFixes(violations, context);
      assert.equal(fixes.length, 1);
      assert.equal(fixes[0]?.fixed, true);

      const targetPath = path.join(tmpDir, '.github', 'pull_request_template.md');
      assert.equal(await fileExists(targetPath), true);
      const content = await readFileSafe(targetPath);
      assert.ok(content?.includes('Checklist:'));
    } finally {
      await fsp.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('should auto-fix docker-002 by creating .dockerignore', async () => {
    const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'repodoctor-fix-doc2-'));
    try {
      const context = await createRuleContext({ rootDir: tmpDir });
      const violations: RuleResult[] = [
        {
          ruleId: 'docker-002',
          ruleTitle: 'Dockerignore',
          category: 'docker',
          severity: 'warn',
          message: 'Missing .dockerignore',
          fixable: true
        }
      ];

      const fixes = await applyRuleFixes(violations, context);
      assert.equal(fixes.length, 1);
      assert.equal(fixes[0]?.fixed, true);

      const targetPath = path.join(tmpDir, '.dockerignore');
      assert.equal(await fileExists(targetPath), true);
      const content = await readFileSafe(targetPath);
      assert.ok(content?.includes('node_modules'));
    } finally {
      await fsp.rm(tmpDir, { recursive: true, force: true });
    }
  });
});
