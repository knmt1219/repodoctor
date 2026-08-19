export type Severity = 'error' | 'warn' | 'info' | 'off';

export type Category =
  | 'security'
  | 'oss'
  | 'ci'
  | 'package'
  | 'git'
  | 'docker';

export interface RuleResult {
  ruleId: string;
  ruleTitle: string;
  category: Category;
  severity: 'error' | 'warn' | 'info';
  message: string;
  file?: string;
  line?: number;
  column?: number;
  fixable: boolean;
  remediation?: string;
  details?: Record<string, unknown>;
}

export interface FixResult {
  ruleId: string;
  fixed: boolean;
  message: string;
  file?: string;
}

export interface RuleDoc {
  whyItMatters: string;
  badExample?: string;
  goodExample?: string;
  remediationGuide: string;
}

export interface Rule {
  id: string;
  title: string;
  description: string;
  category: Category;
  defaultSeverity: Severity;
  fixable: boolean;
  docs: RuleDoc;
  check: (context: RuleContext) => Promise<RuleResult[]> | RuleResult[];
  fix?: (context: RuleContext) => Promise<FixResult[]> | FixResult[];
}

export interface ParsedFile {
  path: string; // Relative path from root
  fullPath: string;
  content: string;
  lines: string[];
}

export interface RuleContext {
  rootDir: string;
  files: string[]; // Relative file paths
  readFile: (relPath: string) => Promise<string | null>;
  readJson: <T = unknown>(relPath: string) => Promise<T | null>;
  readYaml: <T = unknown>(relPath: string) => Promise<T | null>;
  fileExists: (relPath: string) => Promise<boolean>;
  dirExists: (relPath: string) => Promise<boolean>;
  listFiles: (pattern?: string) => Promise<string[]>;
  isGitRepo: boolean;
  gitBranch?: string;
  options: {
    fix?: boolean;
    verbose?: boolean;
    config?: Record<string, unknown>;
  };
}

export interface CategoryScore {
  score: number;
  totalChecked: number;
  violations: number;
  errors: number;
  warnings: number;
  infos: number;
}

export interface HealthScore {
  score: number; // 0 - 100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  breakdown: Record<Category, CategoryScore>;
}

export interface ReportSummary {
  total: number;
  errors: number;
  warnings: number;
  infos: number;
  fixable: number;
  passed: number;
  rulesEvaluated: number;
}

export interface EngineReport {
  timestamp: string;
  targetDir: string;
  version: string;
  results: RuleResult[];
  score: HealthScore;
  summary: ReportSummary;
  elapsedMs: number;
}
