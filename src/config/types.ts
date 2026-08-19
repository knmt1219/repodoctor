import { Category, Severity } from '../core/types.js';

export interface RepoDoctorConfig {
  extends?: string | string[];
  rules?: Record<string, Severity | { severity?: Severity; [key: string]: unknown }>;
  categories?: Partial<Record<Category, boolean | { severity?: Severity }>>;
  ignore?: string[];
  scoreThreshold?: number;
  maxWarnings?: number;
  options?: {
    checkTrackedOnly?: boolean;
    secretScanEntropy?: boolean;
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
