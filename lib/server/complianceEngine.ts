import { COMPLIANCE_RULES } from '@/rules/complianceRules';
import { ExtractedFields, RuleResult, ComplianceStatus, DEFAULT_THRESHOLDS } from '@/types';

export function runRulesOnFields(fields: ExtractedFields, rawText: string): RuleResult[] {
  return COMPLIANCE_RULES.map((rule) => {
    const result = rule.validate(fields, rawText);
    let scoreEarned = 0;
    if (result.status === 'PASS') {
      scoreEarned = rule.maxScore;
    } else if (result.status === 'WARNING') {
      scoreEarned = Math.round(rule.maxScore * 0.5);
    }
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      category: rule.category,
      severity: rule.severity,
      maxScore: rule.maxScore,
      scoreEarned,
      ...result,
    } as RuleResult;
  });
}

export function computeComplianceScore(ruleResults: RuleResult[]): number {
  const totalMax = ruleResults.reduce((sum, r) => sum + r.maxScore, 0);
  const totalEarned = ruleResults.reduce((sum, r) => sum + r.scoreEarned, 0);
  if (totalMax === 0) return 0;
  return Math.round((totalEarned / totalMax) * 100);
}

export function computeComplianceStatus(score: number): ComplianceStatus {
  if (score >= DEFAULT_THRESHOLDS.compliant) return 'COMPLIANT';
  if (score >= DEFAULT_THRESHOLDS.warning) return 'WARNING';
  return 'NON-COMPLIANT';
}

export function buildAiSummary(
  fields: ExtractedFields,
  ruleResults: RuleResult[],
  status: ComplianceStatus
): string {
  const passed = ruleResults.filter((r) => r.status === 'PASS').map((r) => r.ruleName);
  const failed = ruleResults.filter((r) => r.status === 'FAIL').map((r) => r.ruleName);
  const warned = ruleResults.filter((r) => r.status === 'WARNING').map((r) => r.ruleName);

  const productRef = fields.productName ? `for "${fields.productName}"` : 'for this packaged commodity';

  if (status === 'COMPLIANT') {
    return `The multi-image automated inspection ${productRef} verified that mandatory declarations are present and standard-compliant. All ${passed.length} compliance checks passed. This product package satisfies the primary requirements of the Legal Metrology (Packaged Commodities) Rules, 2011.`;
  }

  const parts: string[] = [];
  if (passed.length > 0) {
    parts.push(`The system successfully verified ${passed.join(', ')} declarations`);
  }
  if (failed.length > 0) {
    parts.push(`but could not find or confirm mandatory declarations for ${failed.join(', ')}`);
  }
  if (warned.length > 0) {
    parts.push(`declarations for ${warned.join(', ')} were flagged as partial, non-standard, or incomplete`);
  }

  const summary = parts.join('. ') + '.';

  if (status === 'NON-COMPLIANT') {
    return `Potential violations detected ${productRef}. ${summary} Under Legal Metrology (Packaged Commodities) Rules, 2011, missing or deficient statutory declarations are punishable offenses. Physical verification by an authorized Legal Metrology Officer is recommended.`;
  }

  return `Partial compliance observed ${productRef}. ${summary} Review of highlighted declarations is recommended to ensure full statutory alignment.`;
}
