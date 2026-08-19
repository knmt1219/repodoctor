import { EngineReport } from '../core/types.js';
import { ALL_RULES } from '../rules/index.js';
import { normalizePath } from '../utils/fs.js';

export function formatSarifReport(report: EngineReport): string {
  const ruleIndexMap = new Map<string, number>();

  const sarifRules = ALL_RULES.map((rule, idx) => {
    ruleIndexMap.set(rule.id, idx);
    return {
      id: rule.id,
      name: rule.id.replace(/-/g, '_'),
      shortDescription: {
        text: rule.title
      },
      fullDescription: {
        text: rule.description
      },
      help: {
        text: `${rule.docs.whyItMatters}\n\nRemediation:\n${rule.docs.remediationGuide}`,
        markdown: `### Why it matters\n${rule.docs.whyItMatters}\n\n### Remediation\n${rule.docs.remediationGuide}`
      },
      properties: {
        category: rule.category,
        defaultSeverity: rule.defaultSeverity
      }
    };
  });

  const sarifResults = report.results.map(res => {
    const level = res.severity === 'error' ? 'error' : res.severity === 'warn' ? 'warning' : 'note';
    const ruleIndex = ruleIndexMap.get(res.ruleId);

    const locations = res.file
      ? [
          {
            physicalLocation: {
              artifactLocation: {
                uri: normalizePath(res.file),
                uriBaseId: '%SRCROOT%'
              },
              region: {
                startLine: Math.max(1, res.line || 1),
                startColumn: Math.max(1, res.column || 1)
              }
            }
          }
        ]
      : [];

    return {
      ruleId: res.ruleId,
      ruleIndex: ruleIndex !== undefined ? ruleIndex : -1,
      level,
      message: {
        text: res.message
      },
      locations
    };
  });

  const sarif = {
    $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: 'RepoDoctor',
            version: report.version,
            informationUri: 'https://github.com/knmt1219/repodoctor',
            rules: sarifRules
          }
        },
        results: sarifResults
      }
    ]
  };

  return JSON.stringify(sarif, null, 2);
}
