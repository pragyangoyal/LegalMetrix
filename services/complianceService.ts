// Compliance service - runs rules and calculates score
import { OcrResult, RuleResult, AnalysisResult, ComplianceStatus, ScanMode, DEFAULT_THRESHOLDS, ExtractedFields } from '@/types';
import { COMPLIANCE_RULES } from '@/rules/complianceRules';

export function runComplianceChecks(ocrResult: OcrResult): RuleResult[] {
  const { extractedFields, rawText } = ocrResult;
  return COMPLIANCE_RULES.map((rule) => {
    const result = rule.validate(extractedFields, rawText);
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

export function calculateScore(ruleResults: RuleResult[]): number {
  const totalMax = ruleResults.reduce((sum, r) => sum + r.maxScore, 0);
  const totalEarned = ruleResults.reduce((sum, r) => sum + r.scoreEarned, 0);
  return Math.round((totalEarned / totalMax) * 100);
}

export function determineStatus(score: number): ComplianceStatus {
  if (score >= DEFAULT_THRESHOLDS.compliant) return 'COMPLIANT';
  if (score >= DEFAULT_THRESHOLDS.warning) return 'WARNING';
  return 'NON-COMPLIANT';
}

export function generateAiSummary(
  fields: ExtractedFields,
  ruleResults: RuleResult[],
  status: ComplianceStatus
): string {
  const passed = ruleResults.filter((r) => r.status === 'PASS').map((r) => r.ruleName);
  const failed = ruleResults.filter((r) => r.status === 'FAIL').map((r) => r.ruleName);
  const warned = ruleResults.filter((r) => r.status === 'WARNING').map((r) => r.ruleName);

  const productRef = fields.productName ? `for "${fields.productName}"` : 'for this product';

  if (status === 'COMPLIANT') {
    return `The automated analysis ${productRef} found all mandatory declarations present and in an expected format. ${passed.length} compliance checks passed. This product label appears to meet the major requirements of the Legal Metrology (Packaged Commodities) Rules, 2011.`;
  }

  const parts: string[] = [];
  if (passed.length > 0) {
    parts.push(`The system detected ${passed.join(', ')} declarations`);
  }
  if (failed.length > 0) {
    parts.push(`but could not confidently identify ${failed.join(', ')}`);
  }
  if (warned.length > 0) {
    parts.push(`${warned.join(', ')} information appears incomplete or ambiguous`);
  }

  const summary = parts.join('. ') + '.';

  if (status === 'NON-COMPLIANT') {
    return `Potential non-compliance detected ${productRef}. ${summary} These missing declarations may constitute violations under the Legal Metrology (Packaged Commodities) Rules, 2011, and warrant physical verification by an authorized officer.`;
  }

  return `Partial compliance detected ${productRef}. ${summary} Further verification is recommended for the flagged declarations.`;
}

export function buildAnalysisResult(
  ocrResult: OcrResult,
  productName: string,
  imageDataUrl?: string,
  demoProductId?: string,
  scanMode?: ScanMode
): AnalysisResult {
  const ruleResults = runComplianceChecks(ocrResult);
  const complianceScore = calculateScore(ruleResults);
  const complianceStatus = determineStatus(complianceScore);

  return {
    id: `scan-${Date.now()}`,
    timestamp: new Date().toISOString(),
    productName: productName || ocrResult.extractedFields.productName || 'Unknown Product',
    imageDataUrl,
    scanMode: scanMode || (demoProductId ? 'demo' : 'upload'),
    demoProductId,
    ocrResult,
    ruleResults,
    complianceScore,
    complianceStatus,
    issuesCount: ruleResults.filter((r) => r.status === 'FAIL').length,
    warningsCount: ruleResults.filter((r) => r.status === 'WARNING').length,
    passedCount: ruleResults.filter((r) => r.status === 'PASS').length,
    aiSummary: generateAiSummary(ocrResult.extractedFields, ruleResults, complianceStatus),
  };
}
