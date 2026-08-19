import { ALL_RULES } from '../../rules/index.js';
import { colors } from '../../utils/colors.js';
import { Category } from '../../core/types.js';

export async function runRulesCommand(categoryFilter?: string): Promise<number> {
  console.log('');
  console.log(`${colors.bold(colors.cyan('RepoDoctor Rules Catalog'))} (${ALL_RULES.length} rules available)`);
  console.log(colors.dim('─'.repeat(70)));
  console.log('');

  const categories: Category[] = ['security', 'oss', 'ci', 'package', 'git', 'docker'];

  for (const cat of categories) {
    if (categoryFilter && categoryFilter.toLowerCase() !== cat) {
      continue;
    }

    const catRules = ALL_RULES.filter(r => r.category === cat);
    if (catRules.length === 0) continue;

    console.log(colors.bold(colors.underline(cat.toUpperCase())));

    for (const rule of catRules) {
      const sevColor = rule.defaultSeverity === 'error' ? colors.red : rule.defaultSeverity === 'warn' ? colors.yellow : colors.blue;
      const fixBadge = rule.fixable ? colors.green('[fixable]') : '';
      console.log(`  ${colors.bold(rule.id)}: ${rule.title}`);
      console.log(`    ${colors.dim('Severity:')} ${sevColor(rule.defaultSeverity)} ${fixBadge}`);
      console.log(`    ${colors.dim(rule.description)}`);
      console.log('');
    }
  }

  console.log(colors.dim(`Run 'repodoctor explain <rule-id>' to view detailed rationale and examples.`));
  console.log('');
  return 0;
}
