import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isPathInside, readFileSafe, writeFileSafe } from '../src/utils/fs.js';
import os from 'node:os';
import path from 'node:path';
import fsp from 'node:fs/promises';

describe('Filesystem Security & Traversal Prevention', () => {
  it('isPathInside should return true for files inside root directory', () => {
    assert.equal(isPathInside('/app/repo', '/app/repo/src/index.ts'), true);
    assert.equal(isPathInside('/app/repo', '/app/repo/sub/nested/file.txt'), true);
    assert.equal(isPathInside('/app/repo', '/app/repo'), true);
  });

  it('isPathInside should return false for traversal attempts escaping root directory', () => {
    assert.equal(isPathInside('/app/repo', '/app/repo/../secret.txt'), false);
    assert.equal(isPathInside('/app/repo', '/etc/passwd'), false);
    assert.equal(isPathInside('C:\\repo', 'C:\\Windows\\System32'), false);
    assert.equal(isPathInside('C:\\repo', 'C:\\repo\\..\\outside'), false);
  });

  it('readFileSafe should refuse to read files outside rootBoundary', async () => {
    const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'repodoctor-fs-read-'));
    try {
      const outsideDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'repodoctor-outside-'));
      const outsideFile = path.join(outsideDir, 'secret.txt');
      await fsp.writeFile(outsideFile, 'confidential', 'utf-8');

      // Attempt to read outsideFile while declaring rootBoundary as tmpDir
      const content = await readFileSafe(outsideFile, 1024 * 1024, tmpDir);
      assert.equal(content, null);

      await fsp.rm(outsideDir, { recursive: true, force: true });
    } finally {
      await fsp.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('writeFileSafe should refuse to write files outside rootBoundary', async () => {
    const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'repodoctor-fs-write-'));
    try {
      const outsidePath = path.join(tmpDir, '..', 'should_not_write.txt');
      const ok = await writeFileSafe(outsidePath, 'danger', tmpDir);
      assert.equal(ok, false);
    } finally {
      await fsp.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('writeFileSafe should refuse to write through an existing symlink that resolves outside rootBoundary', async () => {
    const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'repodoctor-fs-sym-write-'));
    const outsideDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'repodoctor-fs-sym-out-'));
    try {
      const outsideTarget = path.join(outsideDir, 'external_target.txt');
      await fsp.writeFile(outsideTarget, 'original content', 'utf-8');

      const symlinkInRoot = path.join(tmpDir, 'symlink_in_root.txt');
      let symlinkCreated = false;
      try {
        await fsp.symlink(outsideTarget, symlinkInRoot);
        symlinkCreated = true;
      } catch {
        // Symlink creation might require privileges on Windows
      }

      if (symlinkCreated) {
        const ok = await writeFileSafe(symlinkInRoot, 'malicious overwrite', tmpDir);
        assert.equal(ok, false);
        // Verify outside content remained unchanged
        const outsideContent = await fsp.readFile(outsideTarget, 'utf-8');
        assert.equal(outsideContent, 'original content');
      }
    } finally {
      await fsp.rm(outsideDir, { recursive: true, force: true });
      await fsp.rm(tmpDir, { recursive: true, force: true });
    }
  });
});
