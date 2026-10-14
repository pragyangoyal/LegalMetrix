import { getDb } from './db';
import { v4 as uuidv4 } from 'uuid';
import { ExtractedFields, RuleResult, ComplianceStatus, ScanMode } from '@/types';
import { deleteInspectionFiles } from './storageService';

export interface InspectionRecord {
  id: string;
  created_at: string;
  updated_at: string;
  status: 'UPLOADED' | 'ANALYZING' | 'COMPLETED' | 'FAILED';
  scan_mode: ScanMode;
  product_name?: string;
  compliance_score?: number;
  overall_status?: ComplianceStatus;
  raw_ocr_text?: string;
  ai_summary?: string;
  processing_time_ms: number;
  images_count: number;
  images_analyzed: number;
  demo_product_id?: string;
}

export interface InspectionImageRecord {
  id: string;
  inspection_id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  image_order: number;
  label?: string;
  file_path: string;
  status: 'PENDING' | 'ANALYZING' | 'COMPLETED' | 'FAILED';
  ocr_text?: string;
  ocr_confidence?: number;
  processing_time_ms: number;
  created_at: string;
  url?: string;
}

export interface ExtractedFieldRecord {
  id: string;
  inspection_id: string;
  field_name: string;
  value: string;
  confidence: number;
  source_image_id?: string;
  status: string;
}

export interface ComplianceCheckRecord {
  id: string;
  inspection_id: string;
  rule_id: string;
  rule_name: string;
  category: string;
  severity: string;
  status: 'PASS' | 'WARNING' | 'FAIL';
  message?: string;
  evidence?: string;
  explanation?: string;
  confidence: number;
  score_earned: number;
  max_score: number;
}

export interface FullInspectionDetail extends InspectionRecord {
  images: InspectionImageRecord[];
  fields: Record<string, string>;
  fieldRecords: ExtractedFieldRecord[];
  checks: ComplianceCheckRecord[];
}

export function createInspection(scanMode: ScanMode = 'upload', productName?: string, demoProductId?: string): InspectionRecord {
  const db = getDb();
  const id = `insp-${Date.now()}-${uuidv4().substring(0, 8)}`;
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO inspections (
      id, created_at, updated_at, status, scan_mode, product_name, demo_product_id
    ) VALUES (?, ?, ?, 'UPLOADED', ?, ?, ?)
  `);

  stmt.run(id, now, now, scanMode, productName || null, demoProductId || null);

  return {
    id,
    created_at: now,
    updated_at: now,
    status: 'UPLOADED',
    scan_mode: scanMode,
    product_name: productName,
    processing_time_ms: 0,
    images_count: 0,
    images_analyzed: 0,
    demo_product_id: demoProductId,
  };
}

export function addInspectionImage(
  inspectionId: string,
  image: {
    id?: string;
    filename: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    filePath: string;
    imageOrder?: number;
    label?: string;
  }
): InspectionImageRecord {
  const db = getDb();
  const id = image.id || uuidv4();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO inspection_images (
      id, inspection_id, filename, original_name, mime_type, size_bytes,
      image_order, label, file_path, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)
  `);

  stmt.run(
    id,
    inspectionId,
    image.filename,
    image.originalName,
    image.mimeType,
    image.sizeBytes,
    image.imageOrder || 0,
    image.label || null,
    image.filePath,
    now
  );

  db.prepare(`
    UPDATE inspections
    SET images_count = (SELECT COUNT(*) FROM inspection_images WHERE inspection_id = ?),
        updated_at = ?
    WHERE id = ?
  `).run(inspectionId, now, inspectionId);

  return {
    id,
    inspection_id: inspectionId,
    filename: image.filename,
    original_name: image.originalName,
    mime_type: image.mimeType,
    size_bytes: image.sizeBytes,
    image_order: image.imageOrder || 0,
    label: image.label,
    file_path: image.filePath,
    status: 'PENDING',
    processing_time_ms: 0,
    created_at: now,
    url: `/api/uploads/${inspectionId}/${image.filename}`,
  };
}

export function updateImageOcrResult(
  imageId: string,
  data: {
    status: 'COMPLETED' | 'FAILED';
    ocrText: string;
    ocrConfidence: number;
    processingTimeMs: number;
  }
) {
  const db = getDb();
  db.prepare(`
    UPDATE inspection_images
    SET status = ?, ocr_text = ?, ocr_confidence = ?, processing_time_ms = ?
    WHERE id = ?
  `).run(data.status, data.ocrText, data.ocrConfidence, data.processingTimeMs, imageId);
}

export function saveExtractedFields(
  inspectionId: string,
  fields: Array<{ fieldName: string; value: string; confidence: number; sourceImageId?: string }>
) {
  const db = getDb();
  // Clear any existing extracted fields for this inspection
  db.prepare('DELETE FROM extracted_fields WHERE inspection_id = ?').run(inspectionId);

  const insertStmt = db.prepare(`
    INSERT INTO extracted_fields (id, inspection_id, field_name, value, confidence, source_image_id, status)
    VALUES (?, ?, ?, ?, ?, ?, 'DETECTED')
  `);

  const insertMany = db.transaction((items) => {
    for (const item of items) {
      insertStmt.run(uuidv4(), inspectionId, item.fieldName, item.value, item.confidence, item.sourceImageId || null);
    }
  });

  insertMany(fields);
}

export function saveComplianceChecks(inspectionId: string, checks: RuleResult[]) {
  const db = getDb();
  db.prepare('DELETE FROM compliance_checks WHERE inspection_id = ?').run(inspectionId);

  const insertStmt = db.prepare(`
    INSERT INTO compliance_checks (
      id, inspection_id, rule_id, rule_name, category, severity, status,
      message, evidence, explanation, confidence, score_earned, max_score
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((rules) => {
    for (const r of rules) {
      insertStmt.run(
        uuidv4(),
        inspectionId,
        r.ruleId,
        r.ruleName,
        r.category,
        r.severity,
        r.status,
        r.message,
        r.evidence || null,
        r.explanation,
        r.confidence,
        r.scoreEarned,
        r.maxScore
      );
    }
  });

  insertMany(checks);
}

export function completeInspection(
  inspectionId: string,
  data: {
    productName: string;
    complianceScore: number;
    overallStatus: ComplianceStatus;
    rawOcrText: string;
    aiSummary: string;
    processingTimeMs: number;
    imagesAnalyzed: number;
  }
) {
  const db = getDb();
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE inspections
    SET status = 'COMPLETED',
        product_name = ?,
        compliance_score = ?,
        overall_status = ?,
        raw_ocr_text = ?,
        ai_summary = ?,
        processing_time_ms = ?,
        images_analyzed = ?,
        updated_at = ?
    WHERE id = ?
  `).run(
    data.productName,
    data.complianceScore,
    data.overallStatus,
    data.rawOcrText,
    data.aiSummary,
    data.processingTimeMs,
    data.imagesAnalyzed,
    now,
    inspectionId
  );
}

export function failInspection(inspectionId: string, errorMessage: string) {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE inspections
    SET status = 'FAILED',
        ai_summary = ?,
        updated_at = ?
    WHERE id = ?
  `).run(errorMessage, now, inspectionId);
}

export function getInspectionDetail(id: string): FullInspectionDetail | null {
  const db = getDb();
  const inspection = db.prepare('SELECT * FROM inspections WHERE id = ?').get(id) as InspectionRecord | undefined;
  if (!inspection) return null;

  const images = db.prepare('SELECT * FROM inspection_images WHERE inspection_id = ? ORDER BY image_order ASC').all(id) as InspectionImageRecord[];
  const mappedImages = images.map((img) => ({
    ...img,
    url: `/api/uploads/${id}/${img.filename}`,
  }));

  const fieldRecords = db.prepare('SELECT * FROM extracted_fields WHERE inspection_id = ?').all(id) as ExtractedFieldRecord[];
  const fieldsMap: Record<string, string> = {};
  for (const f of fieldRecords) {
    fieldsMap[f.field_name] = f.value;
  }

  const checks = db.prepare('SELECT * FROM compliance_checks WHERE inspection_id = ?').all(id) as ComplianceCheckRecord[];

  return {
    ...inspection,
    images: mappedImages,
    fields: fieldsMap,
    fieldRecords,
    checks,
  };
}

export function listInspections(options?: {
  status?: string;
  limit?: number;
  offset?: number;
  search?: string;
}): { items: InspectionRecord[]; total: number } {
  const db = getDb();
  let query = 'SELECT * FROM inspections WHERE 1=1';
  let countQuery = 'SELECT COUNT(*) as cnt FROM inspections WHERE 1=1';
  const params: unknown[] = [];
  const countParams: unknown[] = [];

  if (options?.status && options.status !== 'ALL') {
    query += ' AND overall_status = ?';
    countQuery += ' AND overall_status = ?';
    params.push(options.status);
    countParams.push(options.status);
  }

  if (options?.search) {
    query += ' AND (product_name LIKE ? OR id LIKE ?)';
    countQuery += ' AND (product_name LIKE ? OR id LIKE ?)';
    const s = `%${options.search}%`;
    params.push(s, s);
    countParams.push(s, s);
  }

  query += ' ORDER BY created_at DESC';

  const limit = options?.limit || 50;
  const offset = options?.offset || 0;
  query += ' LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const items = db.prepare(query).all(...params) as InspectionRecord[];
  const countRow = db.prepare(countQuery).get(...countParams) as { cnt: number };

  return {
    items,
    total: countRow ? countRow.cnt : 0,
  };
}

export function deleteInspection(id: string): boolean {
  const db = getDb();
  deleteInspectionFiles(id);
  const result = db.prepare('DELETE FROM inspections WHERE id = ?').run(id);
  return result.changes > 0;
}

export function clearAllInspections(): void {
  const db = getDb();
  const allInspections = db.prepare('SELECT id FROM inspections').all() as { id: string }[];
  for (const row of allInspections) {
    deleteInspectionFiles(row.id);
  }
  db.prepare('DELETE FROM compliance_checks').run();
  db.prepare('DELETE FROM extracted_fields').run();
  db.prepare('DELETE FROM inspection_images').run();
  db.prepare('DELETE FROM inspections').run();
}
