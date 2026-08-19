import path from 'node:path';
import { dirExists, fileExists } from './fs.js';
import fsp from 'node:fs/promises';

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
