import path from 'node:path';
import { fileExists, readFileSafe } from '../utils/fs.js';
import { parseJsonSafe, parseYamlSafe } from '../utils/parsers.js';
import { DEFAULT_CONFIG } from './defaults.js';
import { RepoDoctorConfig, ResolvedConfig } from './types.js';
import { Category, Severity } from '../core/types.js';

const CONFIG_FILENAMES = [
  '.repodoctor.json',
  '.repodoctor.yaml',
  '.repodoctor.yml',
  '.repodoctorrc',
  '.repodoctorrc.json',
  '.repodoctorrc.yaml',
  '.repodoctorrc.yml'
];

export async function findConfigFile(rootDir: string): Promise<string | null> {
  for (const filename of CONFIG_FILENAMES) {
    const fullPath = path.join(rootDir, filename);
    if (await fileExists(fullPath)) {
      return fullPath;
    }
  }
  return null;
}

export async function loadConfig(rootDir: string, customConfigPath?: string): Promise<ResolvedConfig> {
  let userConfig: RepoDoctorConfig = {};

  if (customConfigPath) {
    const resolvedPath = path.resolve(rootDir, customConfigPath);
    if (await fileExists(resolvedPath)) {
      userConfig = await parseConfigFile(resolvedPath);
    } else {
      throw new Error(`Specified configuration file does not exist: ${customConfigPath}`);
    }
  } else {
    const foundPath = await findConfigFile(rootDir);
    if (foundPath) {
      userConfig = await parseConfigFile(foundPath);
    } else {
      // Check package.json for "repodoctor" property
      const pkgPath = path.join(rootDir, 'package.json');
      if (await fileExists(pkgPath)) {
        const pkgContent = await readFileSafe(pkgPath);
        if (pkgContent) {
          const parsed = parseJsonSafe<{ repodoctor?: RepoDoctorConfig }>(pkgContent);
          if (parsed.success && parsed.data && typeof parsed.data === 'object' && parsed.data.repodoctor) {
            userConfig = parsed.data.repodoctor;
          }
        }
      }
    }
  }

  return resolveConfig(userConfig);
}

async function parseConfigFile(filePath: string): Promise<RepoDoctorConfig> {
  const content = await readFileSafe(filePath);
  if (!content) return {};

  if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
    const parsed = parseYamlSafe<RepoDoctorConfig>(content);
    if (!parsed.success) {
      throw new Error(`Failed to parse YAML configuration at ${filePath}: ${parsed.error}`);
    }
    return parsed.data || {};
  }

  // JSON or fallback
  const parsed = parseJsonSafe<RepoDoctorConfig>(content);
  if (!parsed.success) {
    // Try YAML if JSON parse fails
    const yamlParsed = parseYamlSafe<RepoDoctorConfig>(content);
    if (yamlParsed.success && yamlParsed.data) {
      return yamlParsed.data;
    }
    throw new Error(`Failed to parse configuration at ${filePath}: ${parsed.error}`);
  }
  return parsed.data || {};
}

export function resolveConfig(userConfig: RepoDoctorConfig): ResolvedConfig {
  const ruleSettings = new Map<string, { severity: Severity; options: Record<string, unknown> }>();
  const categorySettings = new Map<Category, boolean>();

  // Initialize categories with default
  const defaultCategories: Category[] = ['security', 'oss', 'ci', 'package', 'git', 'docker'];
  for (const cat of defaultCategories) {
    const val = userConfig.categories?.[cat] ?? DEFAULT_CONFIG.categories?.[cat] ?? true;
    categorySettings.set(cat, typeof val === 'boolean' ? val : true);
  }

  // Merge default rules
  if (DEFAULT_CONFIG.rules) {
    for (const [ruleId, ruleDef] of Object.entries(DEFAULT_CONFIG.rules)) {
      if (typeof ruleDef === 'string') {
        ruleSettings.set(ruleId, { severity: ruleDef as Severity, options: {} });
      } else if (typeof ruleDef === 'object' && ruleDef !== null) {
        const { severity = 'error', ...opts } = ruleDef as { severity?: Severity; [k: string]: unknown };
        ruleSettings.set(ruleId, { severity, options: opts });
      }
    }
  }

  // Override with user rules
  if (userConfig.rules) {
    for (const [ruleId, ruleDef] of Object.entries(userConfig.rules)) {
      if (typeof ruleDef === 'string') {
        ruleSettings.set(ruleId, { severity: ruleDef as Severity, options: {} });
      } else if (typeof ruleDef === 'object' && ruleDef !== null) {
        const { severity = 'error', ...opts } = ruleDef as { severity?: Severity; [k: string]: unknown };
        ruleSettings.set(ruleId, { severity, options: opts });
      }
    }
  }

  const ignorePatterns = [
    ...(DEFAULT_CONFIG.ignore || []),
    ...(userConfig.ignore || [])
  ];

  return {
    ...DEFAULT_CONFIG,
    ...userConfig,
    options: {
      ...DEFAULT_CONFIG.options,
      ...userConfig.options
    },
    ruleSettings,
    categorySettings,
    ignorePatterns: Array.from(new Set(ignorePatterns))
  };
}
