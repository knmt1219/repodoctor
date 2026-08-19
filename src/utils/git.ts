import path from 'node:path';
import { dirExists, fileExists, normalizePath } from './fs.js';
import fsp from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export interface GitInfo {
  isGitRepo: boolean;
  branch?: string;
  gitDir?: string;
}

export async function detectGitInfo(rootDir: string): Promise<GitInfo> {
  const gitPath = path.join(rootDir, '.git');
  try {
    const isDir = await dirExists(gitPath);
    if (!isDir) {
      // It might be a git submodule or worktree where .git is a file
      const isFile = await fileExists(gitPath);
      if (!isFile) {
        return { isGitRepo: false };
      }
    }

    // Try reading HEAD
    const headPath = isDir ? path.join(gitPath, 'HEAD') : null;
    let branch: string | undefined;
    if (headPath && (await fileExists(headPath))) {
      const headContent = await fsp.readFile(headPath, 'utf-8');
      const match = headContent.trim().match(/^ref: refs\/heads\/(.+)$/);
      if (match && match[1]) {
        branch = match[1];
      } else {
        branch = 'detached';
      }
    }

    return {
      isGitRepo: true,
      branch,
      gitDir: gitPath
    };
  } catch {
    return { isGitRepo: false };
  }
}

/**
 * Lists all git-tracked files using safe argument array execution (git ls-files -z).
 * Returns null if git command fails or directory is not a git repository.
 */
export async function listTrackedFiles(rootDir: string): Promise<string[] | null> {
  try {
    const { stdout } = await execFileAsync('git', ['ls-files', '-z'], {
      cwd: rootDir,
      encoding: 'utf-8',
      windowsHide: true,
      maxBuffer: 20 * 1024 * 1024
    });

    if (!stdout) return [];

    const files = stdout
      .split('\0')
      .map(f => f.trim())
      .filter(Boolean)
      .map(normalizePath);

    return Array.from(new Set(files)).sort();
  } catch {
    return null;
  }
}
