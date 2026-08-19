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

const VALID_SEVERITIES = new Set<string>(['error', 'warn', 'info', 'off']);
const VALID_CATEGORIES = new Set<string>(['security', 'oss', 'ci', 'package', 'git', 'docker']);

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
  // Validate scoreThreshold
  if (userConfig.scoreThreshold !== undefined) {
    if (typeof userConfig.scoreThreshold !== 'number' || isNaN(userConfig.scoreThreshold) || userConfig.scoreThreshold < 0 || userConfig.scoreThreshold > 100) {
      throw new Error(`Invalid configuration: scoreThreshold must be a number between 0 and 100 (received ${userConfig.scoreThreshold})`);
    }
  }

  // Validate maxWarnings
  if (userConfig.maxWarnings !== undefined) {
    if (typeof userConfig.maxWarnings !== 'number' || isNaN(userConfig.maxWarnings) || userConfig.maxWarnings < -1) {
      throw new Error(`Invalid configuration: maxWarnings must be an integer >= -1 (received ${userConfig.maxWarnings})`);
    }
  }

  const ruleSettings = new Map<string, { severity: Severity; options: Record<string, unknown> }>();
  const categorySettings = new Map<Category, boolean>();

  // Validate and initialize categories
  const defaultCategories: Category[] = ['security', 'oss', 'ci', 'package', 'git', 'docker'];
  for (const cat of defaultCategories) {
    const val = userConfig.categories?.[cat] ?? DEFAULT_CONFIG.categories?.[cat] ?? true;
    if (typeof val !== 'boolean') {
      throw new Error(`Invalid configuration: category "${cat}" must be a boolean (received "${String(val)}")`);
    }
    categorySettings.set(cat, val);
  }

  if (userConfig.categories) {
    for (const catKey of Object.keys(userConfig.categories)) {
      if (!VALID_CATEGORIES.has(catKey)) {
        throw new Error(`Invalid configuration: unknown category "${catKey}". Valid categories: ${Array.from(VALID_CATEGORIES).join(', ')}`);
      }
    }
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

  // Override with user rules and validate severity
  if (userConfig.rules) {
    for (const [ruleId, ruleDef] of Object.entries(userConfig.rules)) {
      let severity: Severity = 'error';
      let options: Record<string, unknown> = {};

      if (typeof ruleDef === 'string') {
        severity = ruleDef as Severity;
      } else if (typeof ruleDef === 'object' && ruleDef !== null) {
        const { severity: s = 'error', ...opts } = ruleDef as { severity?: Severity; [k: string]: unknown };
        severity = s;
        options = opts;
      } else {
        throw new Error(`Invalid configuration for rule "${ruleId}": expected severity string or object`);
      }

      if (!VALID_SEVERITIES.has(severity)) {
        throw new Error(`Invalid configuration for rule "${ruleId}": unknown severity "${severity}". Valid values: error, warn, info, off`);
      }

      ruleSettings.set(ruleId, { severity, options });
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
