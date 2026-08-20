import { Category, EngineReport, FixResult, HealthScore, ReportSummary, Rule, RuleResult } from './types.js';
import { ResolvedConfig } from '../config/types.js';
import { createRuleContext } from './context.js';
import { ALL_RULES } from '../rules/index.js';
import { calculateHealthScore } from './score.js';
import { applyRuleFixes } from './fixers.js';

export interface RunOptions {
  rootDir: string;
  config: ResolvedConfig;
  fix?: boolean;
  verbose?: boolean;
  customRules?: Rule[];
}

export class RepoDoctorEngine {
  private config: ResolvedConfig;
  private rootDir: string;
  private rules: Rule[];
  private isFixMode: boolean;

  constructor(options: RunOptions) {
    this.rootDir = options.rootDir;
    this.config = options.config;
    this.rules = options.customRules || ALL_RULES;
    this.isFixMode = !!options.fix;
  }

  public async run(): Promise<{ report: EngineReport; fixes?: FixResult[] }> {
    const startTime = Date.now();

    // 1. Create context
    const context = await createRuleContext({
      rootDir: this.rootDir,
      ignorePatterns: this.config.ignorePatterns,
      fix: this.isFixMode,
      checkTrackedOnly: this.config.options?.checkTrackedOnly,
      verbose: false,
      config: this.config.options
    });

    // 2. Determine active rules and count per category
    const activeRulesByCategory: Record<Category, number> = {
      security: 0,
      oss: 0,
      ci: 0,
      package: 0,
      git: 0,
      docker: 0
    };

    const activeRules: Array<{ rule: Rule; severity: 'error' | 'warn' | 'info' }> = [];

    for (const rule of this.rules) {
      // Check if category is enabled
      const isCatEnabled = this.config.categorySettings.get(rule.category) ?? true;
      if (!isCatEnabled) continue;

      // Check rule severity override
      const ruleSetting = this.config.ruleSettings.get(rule.id);
      const severity = ruleSetting ? ruleSetting.severity : rule.defaultSeverity;

      if (severity === 'off') continue;

      activeRulesByCategory[rule.category] = (activeRulesByCategory[rule.category] || 0) + 1;
      activeRules.push({ rule, severity });
    }

    // 3. Execute all active rules
    const allResults: RuleResult[] = [];

    const checkPromises = activeRules.map(async ({ rule, severity }) => {
      try {
        const results = await rule.check(context);
        for (const res of results) {
          allResults.push({
            ...res,
            severity, // Enforce configured severity
            ruleTitle: rule.title
          });
        }
      } catch (err: unknown) {
        // Rule execution failure shouldn't crash the engine
        const message = err instanceof Error ? err.message : String(err);
        allResults.push({
          ruleId: rule.id,
          ruleTitle: rule.title,
          category: rule.category,
          severity: 'warn',
          message: `Rule failed to execute: ${message}`,
          fixable: false
        });
      }
    });

    await Promise.all(checkPromises);

    // 4. Sort results deterministically: errors first, then warnings, then infos, then by file/line
    allResults.sort((a, b) => {
      const sevOrder = { error: 0, warn: 1, info: 2 };
      if (sevOrder[a.severity] !== sevOrder[b.severity]) {
        return sevOrder[a.severity] - sevOrder[b.severity];
      }
      if (a.file && b.file && a.file !== b.file) {
        return a.file.localeCompare(b.file);
      }
      return (a.line || 0) - (b.line || 0);
    });

    // 5. Calculate score
    const score: HealthScore = calculateHealthScore(allResults, activeRulesByCategory);

    // 6. Summary metrics
    const summary: ReportSummary = {
      total: allResults.length,
      errors: allResults.filter(r => r.severity === 'error').length,
      warnings: allResults.filter(r => r.severity === 'warn').length,
      infos: allResults.filter(r => r.severity === 'info').length,
      fixable: allResults.filter(r => r.fixable).length,
      passed: Object.values(activeRulesByCategory).reduce((a, b) => a + b, 0) - new Set(allResults.map(r => r.ruleId)).size,
      rulesEvaluated: activeRules.length
    };

    const report: EngineReport = {
      timestamp: new Date().toISOString(),
      targetDir: this.rootDir,
      version: '0.1.3',
      results: allResults,
      score,
      summary,
      elapsedMs: Date.now() - startTime
    };

    return { report };
  }

  public async fix(): Promise<{ report: EngineReport; fixes: FixResult[] }> {
    // First run to find issues
    const { report } = await this.run();

    // Re-create context for applying fixes
    const context = await createRuleContext({
      rootDir: this.rootDir,
      ignorePatterns: this.config.ignorePatterns,
      fix: true,
      checkTrackedOnly: this.config.options?.checkTrackedOnly
    });

    // Apply fixes
    const fixes = await applyRuleFixes(report.results, context);

    // Re-run after fixes to get updated report
    const updated = await this.run();

    return {
      report: updated.report,
      fixes
    };
  }
}
