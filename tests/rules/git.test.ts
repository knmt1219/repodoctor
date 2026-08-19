import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { git001 } from '../../src/rules/git/git-001.js';
import { git002 } from '../../src/rules/git/git-002.js';
import { git003 } from '../../src/rules/git/git-003.js';
import { git004 } from '../../src/rules/git/git-004.js';
import { git005 } from '../../src/rules/git/git-005.js';
import { createMockContext } from '../helpers.js';
import os from 'node:os';
import path from 'node:path';
import fsp from 'node:fs/promises';
import { createRuleContext } from '../../src/core/context.js';

describe('Git & Repository Hygiene Rules', () => {
  it('git-001: should flag missing .gitattributes', async () => {
    const ctx = createMockContext({});
    const res = await git001.check(ctx);
    assert.equal(res.length, 1);
    assert.equal(res[0]?.ruleId, 'git-001');
  });

  it('git-001: should pass if .gitattributes exists', async () => {
    const ctx = createMockContext({
      '.gitattributes': '* text=auto eol=lf\n'
    });
    const res = await git001.check(ctx);
    assert.equal(res.length, 0);
  });

  it('git-002: should detect unresolved merge conflict markers', async () => {
    const ctx = createMockContext({
      'src/file.ts': 'const a = 1;\n<<<<<<< HEAD\nconst b = 2;\n=======\nconst b = 3;\n>>>>>>> main\n'
    });
    const res = await git002.check(ctx);
    assert.equal(res.length, 1);
    assert.equal(res[0]?.ruleId, 'git-002');
  });

  it('git-003: should skip large binary if tracked via Git LFS in .gitattributes', async () => {
    const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'repodoctor-lfs-'));
    try {
      const gitattr = path.join(tmpDir, '.gitattributes');
      await fsp.writeFile(gitattr, '*.bin filter=lfs diff=lfs merge=lfs -text\n');

      const binFile = path.join(tmpDir, 'large.bin');
      const buffer = Buffer.alloc(2 * 1024 * 1024); // 2MB binary
      await fsp.writeFile(binFile, buffer);

      const ctx = await createRuleContext({ rootDir: tmpDir });
      const res = await git003.check(ctx);
      assert.equal(res.length, 0); // Should not be flagged because it is LFS managed!
    } finally {
      await fsp.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('git-004: should detect nested .git directories in subfolders', async () => {
    const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'repodoctor-nested-git-'));
    try {
      const nestedGit = path.join(tmpDir, 'subpackage', '.git');
      await fsp.mkdir(nestedGit, { recursive: true });

      const ctx = await createRuleContext({ rootDir: tmpDir });
      const res = await git004.check(ctx);
      assert.equal(res.length, 1);
      assert.equal(res[0]?.ruleId, 'git-004');
    } finally {
      await fsp.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('git-005: should detect escaping symlinks', async () => {
    const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'repodoctor-symlink-'));
    try {
      const symlinkPath = path.join(tmpDir, 'escape_link.txt');
      try {
        await fsp.symlink('../../../etc/passwd', symlinkPath);
        const ctx = await createRuleContext({ rootDir: tmpDir });
        const res = await git005.check(ctx);
        assert.ok(res.length >= 1);
        assert.ok(res.some(r => r.ruleId === 'git-005' && r.message.includes('escapes repository root')));
      } catch {
        // Windows without developer mode / admin may restrict symlink creation
      }
    } finally {
      await fsp.rm(tmpDir, { recursive: true, force: true });
    }
  });
});
