import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { applyRuleFixes } from '../src/core/fixers.js';
import { RuleResult } from '../src/core/types.js';
import { createRuleContext } from '../src/core/context.js';
import os from 'node:os';
import path from 'node:path';
import fsp from 'node:fs/promises';
import { fileExists, readFileSafe } from '../src/utils/fs.js';

describe('Auto-Fixers Safety & Idempotency', () => {
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

  it('should be strictly idempotent on .gitignore when run multiple times', async () => {
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

      // First run
      const fixes1 = await applyRuleFixes(violations, context);
      assert.equal(fixes1.length, 1);
      assert.equal(fixes1[0]?.fixed, true);

      const contentAfterFirst = await readFileSafe(gitignorePath);
      assert.ok(contentAfterFirst?.includes('.env'));

      // Second run (simulating re-running fixer on already-fixed repository)
      const context2 = await createRuleContext({ rootDir: tmpDir });
      const fixes2 = await applyRuleFixes(violations, context2);
      assert.equal(fixes2.length, 0); // No additional modifications made!

      const contentAfterSecond = await readFileSafe(gitignorePath);
      assert.equal(contentAfterFirst, contentAfterSecond); // Exactly identical
    } finally {
      await fsp.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('should auto-fix oss-003 by creating CONTRIBUTING.md', async () => {
    const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'repodoctor-fix-oss3-'));
    try {
      const context = await createRuleContext({ rootDir: tmpDir });
      const violations: RuleResult[] = [
        {
          ruleId: 'oss-003',
          ruleTitle: 'Contributing guide',
          category: 'oss',
          severity: 'warn',
          message: 'Missing CONTRIBUTING.md',
          fixable: true
        }
      ];

      const fixes = await applyRuleFixes(violations, context);
      assert.equal(fixes.length, 1);
      assert.equal(fixes[0]?.fixed, true);

      const targetPath = path.join(tmpDir, 'CONTRIBUTING.md');
      assert.equal(await fileExists(targetPath), true);
      const content = await readFileSafe(targetPath);
      assert.ok(content?.includes('Contributing Guide'));
    } finally {
      await fsp.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('should auto-fix oss-004 by creating CODE_OF_CONDUCT.md', async () => {
    const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'repodoctor-fix-oss4-'));
    try {
      const context = await createRuleContext({ rootDir: tmpDir });
      const violations: RuleResult[] = [
        {
          ruleId: 'oss-004',
          ruleTitle: 'Code of conduct',
          category: 'oss',
          severity: 'info',
          message: 'Missing CODE_OF_CONDUCT.md',
          fixable: true
        }
      ];

      const fixes = await applyRuleFixes(violations, context);
      assert.equal(fixes.length, 1);
      assert.equal(fixes[0]?.fixed, true);

      const targetPath = path.join(tmpDir, 'CODE_OF_CONDUCT.md');
      assert.equal(await fileExists(targetPath), true);
      const content = await readFileSafe(targetPath);
      assert.ok(content?.includes('Contributor Covenant Code of Conduct'));
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

  it('should auto-fix oss-006 by creating Issue templates in .github/ISSUE_TEMPLATE/', async () => {
    const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'repodoctor-fix-oss6-'));
    try {
      const context = await createRuleContext({ rootDir: tmpDir });
      const violations: RuleResult[] = [
        {
          ruleId: 'oss-006',
          ruleTitle: 'Issue templates',
          category: 'oss',
          severity: 'info',
          message: 'Missing Issue templates',
          fixable: true
        }
      ];

      const fixes = await applyRuleFixes(violations, context);
      assert.equal(fixes.length, 1);
      assert.equal(fixes[0]?.fixed, true);

      const bugPath = path.join(tmpDir, '.github', 'ISSUE_TEMPLATE', 'bug_report.yml');
      const featPath = path.join(tmpDir, '.github', 'ISSUE_TEMPLATE', 'feature_request.yml');
      assert.equal(await fileExists(bugPath), true);
      assert.equal(await fileExists(featPath), true);
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
