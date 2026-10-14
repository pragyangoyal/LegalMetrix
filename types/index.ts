// Core types for LegalMetrix

export interface ExtractedFields {
  productName?: string;
  manufacturer?: string;
  manufacturerAddress?: string;
  packer?: string;
  importer?: string;
  netQuantity?: string;
  mrp?: string;
  manufacturingDate?: string;
  packingDate?: string;
  importDate?: string;
  expiryDate?: string;
  consumerCareNumber?: string;
  consumerCareEmail?: string;
  countryOfOrigin?: string;
  fssaiLicense?: string;
  batchNumber?: string;
}

export type RuleStatus = 'PASS' | 'WARNING' | 'FAIL';
export type ComplianceStatus = 'COMPLIANT' | 'WARNING' | 'NON-COMPLIANT';
export type ScanMode = 'upload' | 'camera' | 'demo' | 'listing';

export interface RuleResult {
  ruleId: string;
  ruleName: string;
  category: string;
  severity: 'critical' | 'major' | 'minor';
  status: RuleStatus;
  confidence: number;
  message: string;
  evidence?: string;
  explanation: string;
  weight: number;
  scoreEarned: number;
  maxScore: number;
}

export interface OcrResult {
  rawText: string;
  confidence: number;
  extractedFields: ExtractedFields;
  imageQuality: 'Good' | 'Fair' | 'Poor';
  analysisTimeMs: number;
  fieldsDetected: number;
  totalFields: number;
}

export interface AnalysisResult {
  id: string;
  timestamp: string;
  productName: string;
  imageDataUrl?: string;
  scanMode: ScanMode;
  demoProductId?: string;
  ocrResult: OcrResult;
  ruleResults: RuleResult[];
  complianceScore: number;
  complianceStatus: ComplianceStatus;
  issuesCount: number;
  warningsCount: number;
  passedCount: number;
  aiSummary: string;
}

export interface DemoProduct {
  id: string;
  name: string;
  category: string;
  imageUrl?: string;
  expectedStatus: ComplianceStatus;
  expectedScore: number;
  ocrResult: OcrResult;
}

export interface ScanRecord {
  id: string;
  timestamp: string;
  productName: string;
  complianceScore: number;
  complianceStatus: ComplianceStatus;
  issuesCount: number;
  warningsCount: number;
  scanMode: ScanMode;
  demoProductId?: string;
  imageDataUrl?: string;
}

export interface ComplianceThresholds {
  compliant: number;
  warning: number;
}

export const DEFAULT_THRESHOLDS: ComplianceThresholds = {
  compliant: 90,
  warning: 70,
};
