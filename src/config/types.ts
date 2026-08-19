import { Category, Severity } from '../core/types.js';

export interface RepoDoctorConfig {
  rules?: Record<string, Severity | { severity?: Severity; [key: string]: unknown }>;
  categories?: Partial<Record<Category, boolean>>;
  ignore?: string[];
  scoreThreshold?: number;
  maxWarnings?: number;
  options?: {
    checkTrackedOnly?: boolean;
    allowedLicenses?: string[];
    requiredScripts?: string[];
    maxBinarySizeKb?: number;
  };
}

export interface ResolvedConfig extends RepoDoctorConfig {
  ruleSettings: Map<string, { severity: Severity; options: Record<string, unknown> }>;
  categorySettings: Map<Category, boolean>;
  ignorePatterns: string[];
}
