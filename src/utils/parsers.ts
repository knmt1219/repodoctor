import YAML from 'yaml';

export function parseJsonSafe<T = unknown>(content: string): { success: true; data: T } | { success: false; error: string } {
  try {
    const data = JSON.parse(content) as T;
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

export function parseYamlSafe<T = unknown>(content: string): { success: true; data: T } | { success: false; error: string } {
  try {
    const data = YAML.parse(content) as T;
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

export function parseLines(content: string): string[] {
  return content.split(/\r?\n/);
}

export function findLineAndColumn(content: string, substringOrRegex: string | RegExp): { line: number; column: number } | null {
  const lines = parseLines(content);

  for (let i = 0; i < lines.length; i++) {
    const lineContent = lines[i]!;
    if (typeof substringOrRegex === 'string') {
      const idx = lineContent.indexOf(substringOrRegex);
      if (idx !== -1) {
        return { line: i + 1, column: idx + 1 };
      }
    } else {
      const match = substringOrRegex.exec(lineContent);
      if (match) {
        return { line: i + 1, column: match.index + 1 };
      }
    }
  }
  return null;
}
