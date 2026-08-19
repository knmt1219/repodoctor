import fsp from 'node:fs/promises';
import path from 'node:path';
import fg from 'fast-glob';

export function normalizePath(p: string): string {
  return p.replace(/\\/g, '/');
}

/**
 * Checks if targetPath is strictly inside or equal to rootDir, preventing path traversal attacks.
 */
export function isPathInside(rootDir: string, targetPath: string): boolean {
  const resolvedRoot = path.resolve(rootDir);
  const resolvedTarget = path.resolve(targetPath);

  // Equal path or child path
  if (resolvedRoot === resolvedTarget) return true;
  const rel = path.relative(resolvedRoot, resolvedTarget);
  return !rel.startsWith('..') && !path.isAbsolute(rel);
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    const stat = await fsp.stat(filePath);
    return stat.isFile();
  } catch {
    return false;
  }
}

export async function dirExists(dirPath: string): Promise<boolean> {
  try {
    const stat = await fsp.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

export async function isSymlink(filePath: string): Promise<boolean> {
  try {
    const lstat = await fsp.lstat(filePath);
    return lstat.isSymbolicLink();
  } catch {
    return false;
  }
}

export async function readFileSafe(filePath: string, maxBytes = 10 * 1024 * 1024, rootBoundary?: string): Promise<string | null> {
  try {
    // If a root boundary is provided, ensure path does not escape
    if (rootBoundary && !isPathInside(rootBoundary, filePath)) {
      return null;
    }

    // Check lstat to prevent following malicious external symlinks
    const lstat = await fsp.lstat(filePath);
    if (lstat.isSymbolicLink()) {
      const real = await fsp.realpath(filePath);
      if (rootBoundary && !isPathInside(rootBoundary, real)) {
        return null;
      }
    }

    if (!lstat.isFile() && !lstat.isSymbolicLink()) {
      return null;
    }

    if (lstat.size > maxBytes) {
      return null;
    }

    return await fsp.readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
}

export async function writeFileSafe(filePath: string, content: string, rootBoundary?: string): Promise<boolean> {
  try {
    if (rootBoundary && !isPathInside(rootBoundary, filePath)) {
      return false;
    }

    const dir = path.dirname(filePath);
    if (rootBoundary && !isPathInside(rootBoundary, dir)) {
      return false;
    }

    await fsp.mkdir(dir, { recursive: true });
    await fsp.writeFile(filePath, content, 'utf-8');
    return true;
  } catch {
    return false;
  }
}

export async function scanDirectory(
  rootDir: string,
  ignorePatterns: string[] = []
): Promise<string[]> {
  try {
    const normalizedRoot = normalizePath(path.resolve(rootDir));
    const defaultIgnores = [
      '**/node_modules/**',
      '**/.git/**',
      '**/dist/**',
      '**/dist-test/**',
      '**/build/**',
      '**/coverage/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/vendor/**',
      '**/target/**'
    ];

    const combinedIgnores = Array.from(new Set([...defaultIgnores, ...ignorePatterns]));

    const entries = await fg(['**/*', '**/.*'], {
      cwd: normalizedRoot,
      dot: true,
      onlyFiles: true,
      ignore: combinedIgnores,
      followSymbolicLinks: false
    });

    return entries.map(normalizePath).sort();
  } catch {
    // Fallback if glob fails
    return [];
  }
}

export async function getFileSize(filePath: string): Promise<number> {
  try {
    const stat = await fsp.stat(filePath);
    return stat.size;
  } catch {
    return 0;
  }
}

export function isBinaryFile(buffer: Buffer): boolean {
  // Check first 512 bytes for null bytes or excessive non-printable chars
  const length = Math.min(buffer.length, 512);
  for (let i = 0; i < length; i++) {
    if (buffer[i] === 0) {
      return true;
    }
  }
  return false;
}
