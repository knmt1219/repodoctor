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

  it('git-003: should flag binary exceeding custom maxBinarySizeKb', async () => {
    const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'repodoctor-bin-custom-'));
    try {
      const binFile = path.join(tmpDir, 'sample.bin');
      const buffer = Buffer.alloc(600 * 1024); // 600 KB
      await fsp.writeFile(binFile, buffer);

      // Default threshold is 1024KB -> should not flag
      const ctxDefault = await createRuleContext({ rootDir: tmpDir });
      const resDefault = await git003.check(ctxDefault);
      assert.equal(resDefault.length, 0);

      // Custom threshold 500KB -> should flag
      const ctxCustom = await createRuleContext({
        rootDir: tmpDir,
        config: { maxBinarySizeKb: 500 }
      });
      const resCustom = await git003.check(ctxCustom);
      assert.equal(resCustom.length, 1);
      assert.equal(resCustom[0]?.ruleId, 'git-003');
    } finally {
      await fsp.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('git-004: should detect deep nested .git directories in subfolders', async () => {
    const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'repodoctor-nested-git-'));
    try {
      const deepNestedGit = path.join(tmpDir, 'packages', 'core', 'subpkg', '.git');
      await fsp.mkdir(deepNestedGit, { recursive: true });

      const ctx = await createRuleContext({ rootDir: tmpDir });
      const res = await git004.check(ctx);
      assert.equal(res.length, 1);
      assert.equal(res[0]?.ruleId, 'git-004');
      assert.ok(res[0]?.file && res[0].file.includes('packages/core/subpkg'));
    } finally {
      await fsp.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('git-004: should allow registered submodules in .gitmodules', async () => {
    const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'repodoctor-submod-'));
    try {
      const gitmodulesPath = path.join(tmpDir, '.gitmodules');
      await fsp.writeFile(gitmodulesPath, '[submodule "vendor/lib"]\n\tpath = vendor/lib\n\turl = https://example.com/lib.git\n');

      const submoduleGit = path.join(tmpDir, 'vendor', 'lib', '.git');
      await fsp.mkdir(submoduleGit, { recursive: true });

      const ctx = await createRuleContext({ rootDir: tmpDir });
      const res = await git004.check(ctx);
      assert.equal(res.length, 0); // Registered submodule is allowed!
    } finally {
      await fsp.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('git-005: should detect escaping symlinks', async () => {
    const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'repodoctor-symlink-'));
    try {
      const symlinkPath = path.join(tmpDir, 'escape_link.txt');
      let symlinkCreated = false;
      try {
        await fsp.symlink('../../../etc/passwd', symlinkPath);
        symlinkCreated = true;
      } catch {
        // Windows without developer mode / admin may restrict symlink creation
      }

      if (symlinkCreated) {
        const ctx = await createRuleContext({ rootDir: tmpDir });
        const res = await git005.check(ctx);
        assert.ok(res.length >= 1);
        assert.ok(res.some(r => r.ruleId === 'git-005' && r.message.includes('escapes repository root')));
      }
    } finally {
      await fsp.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('git-005: should detect broken symlinks pointing to non-existent local targets', async () => {
    const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'repodoctor-broken-symlink-'));
    try {
      const brokenLink = path.join(tmpDir, 'broken_link.txt');
      let symlinkCreated = false;
      try {
        await fsp.symlink('non_existent_target.txt', brokenLink);
        symlinkCreated = true;
      } catch {
        // Windows symlink permissions
      }

      if (symlinkCreated) {
        const ctx = await createRuleContext({ rootDir: tmpDir });
        const res = await git005.check(ctx);
        assert.ok(res.length >= 1);
        assert.ok(res.some(r => r.ruleId === 'git-005' && r.message.includes('Broken symbolic link')));
      }
    } finally {
      await fsp.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('git-004: should detect arbitrarily deep nested .git directories beyond shallow depth limits', async () => {
    const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'repodoctor-deep-git-'));
    try {
      const veryDeepGit = path.join(tmpDir, 'd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8', '.git');
      await fsp.mkdir(veryDeepGit, { recursive: true });

      const ctx = await createRuleContext({ rootDir: tmpDir });
      const res = await git004.check(ctx);
      assert.equal(res.length, 1);
      assert.equal(res[0]?.ruleId, 'git-004');
      assert.ok(res[0]?.file && res[0].file.includes('d1/d2/d3/d4/d5/d6/d7/d8'));
    } finally {
      await fsp.rm(tmpDir, { recursive: true, force: true });
    }
  });
});
