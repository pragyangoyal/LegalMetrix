// LocalStorage persistence service for scan history
import { ScanRecord, AnalysisResult } from '@/types';

const HISTORY_KEY = 'legalmetrix_history';
const CURRENT_RESULT_KEY = 'legalmetrix_current_result';

export function saveToHistory(result: AnalysisResult): void {
  if (typeof window === 'undefined') return;
  const existing = getHistory();
  const record: ScanRecord = {
    id: result.id,
    timestamp: result.timestamp,
    productName: result.productName,
    complianceScore: result.complianceScore,
    complianceStatus: result.complianceStatus,
    issuesCount: result.issuesCount,
    warningsCount: result.warningsCount,
    scanMode: result.scanMode,
    demoProductId: result.demoProductId,
    imageDataUrl: result.imageDataUrl,
  };
  const updated = [record, ...existing].slice(0, 50); // keep last 50
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

export function getHistory(): ScanRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearHistory(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(HISTORY_KEY);
}

export function saveCurrentResult(result: AnalysisResult): void {
  if (typeof window === 'undefined') return;
  try {
    // Don't store full image data in localStorage to avoid quota issues
    const toStore = { ...result, imageDataUrl: result.imageDataUrl ? '[stored]' : undefined };
    sessionStorage.setItem(CURRENT_RESULT_KEY, JSON.stringify(toStore));
  } catch {
    // sessionStorage can fail in private browsing
  }
}

export function getCurrentResult(): AnalysisResult | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(CURRENT_RESULT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearCurrentResult(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(CURRENT_RESULT_KEY);
}

// Optional demo history seeder
export function seedDemoHistory(): void {
  // Do not auto-seed fake static records so users see their real scanned data
}
