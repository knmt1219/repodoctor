import { Category, CategoryScore, HealthScore, RuleResult } from './types.js';

const CATEGORIES: Category[] = ['security', 'oss', 'ci', 'package', 'git', 'docker'];

// Weights of each category in overall score (total = 1.0)
const CATEGORY_WEIGHTS: Record<Category, number> = {
  security: 0.30, // 30%
  ci: 0.20,       // 20%
  package: 0.15,  // 15%
  oss: 0.15,      // 15%
  git: 0.10,      // 10%
  docker: 0.10    // 10%
};

export function calculateHealthScore(
  results: RuleResult[],
  activeRulesByCategory: Record<Category, number>
): HealthScore {
  const breakdown: Record<Category, CategoryScore> = {
    security: { score: 100, totalChecked: activeRulesByCategory.security || 0, violations: 0, errors: 0, warnings: 0, infos: 0 },
    oss: { score: 100, totalChecked: activeRulesByCategory.oss || 0, violations: 0, errors: 0, warnings: 0, infos: 0 },
    ci: { score: 100, totalChecked: activeRulesByCategory.ci || 0, violations: 0, errors: 0, warnings: 0, infos: 0 },
    package: { score: 100, totalChecked: activeRulesByCategory.package || 0, violations: 0, errors: 0, warnings: 0, infos: 0 },
    git: { score: 100, totalChecked: activeRulesByCategory.git || 0, violations: 0, errors: 0, warnings: 0, infos: 0 },
    docker: { score: 100, totalChecked: activeRulesByCategory.docker || 0, violations: 0, errors: 0, warnings: 0, infos: 0 }
  };

  // Group results by category
  for (const r of results) {
    const cat = breakdown[r.category];
    if (!cat) continue;

    cat.violations++;
    if (r.severity === 'error') {
      cat.errors++;
    } else if (r.severity === 'warn') {
      cat.warnings++;
    } else if (r.severity === 'info') {
      cat.infos++;
    }
  }

  // Calculate score for each category
  for (const cat of CATEGORIES) {
    const data = breakdown[cat];
    // Each error costs 25 points from that category, each warning costs 10 points
    const penalty = (data.errors * 25) + (data.warnings * 10);
    data.score = Math.max(0, 100 - penalty);
  }

  // Weighted total score
  let weightedSum = 0;
  let activeWeightTotal = 0;

  for (const cat of CATEGORIES) {
    const weight = CATEGORY_WEIGHTS[cat];
    weightedSum += breakdown[cat].score * weight;
    activeWeightTotal += weight;
  }

  const finalScore = Math.round(activeWeightTotal > 0 ? (weightedSum / activeWeightTotal) : 100);

  let grade: HealthScore['grade'] = 'F';
  if (finalScore >= 95) grade = 'A+';
  else if (finalScore >= 85) grade = 'A';
  else if (finalScore >= 70) grade = 'B';
  else if (finalScore >= 55) grade = 'C';
  else if (finalScore >= 40) grade = 'D';
  else grade = 'F';

  return {
    score: finalScore,
    grade,
    breakdown
  };
}
