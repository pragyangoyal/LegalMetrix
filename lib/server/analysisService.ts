import { performServerOcr } from './ocrService';
import { mergeMultiImageFields } from './fieldExtractionService';
import {
  runRulesOnFields,
  computeComplianceScore,
  computeComplianceStatus,
  buildAiSummary,
} from './complianceEngine';
import { getDb } from './db';
import {
  getInspectionDetail,
  updateImageOcrResult,
  saveExtractedFields,
  saveComplianceChecks,
  completeInspection,
  failInspection,
  FullInspectionDetail,
  createInspection,
} from './inspectionService';
import { DEMO_PRODUCTS } from '@/data/demoProducts';
import { ExtractedFields } from '@/types';
import { syncInspectionToSupabase } from './supabaseService';

export async function analyzeInspectionSession(inspectionId: string): Promise<FullInspectionDetail> {
  const start = Date.now();
  const db = getDb();

  // Mark status as ANALYZING
  db.prepare(`UPDATE inspections SET status = 'ANALYZING', updated_at = ? WHERE id = ?`).run(
    new Date().toISOString(),
    inspectionId
  );

  const detail = getInspectionDetail(inspectionId);
  if (!detail) {
    throw new Error(`Inspection ${inspectionId} not found`);
  }

  try {
    const images = detail.images;
    const imageOcrResults: Array<{ sourceImageId: string; text: string }> = [];

    // Process images (up to 3 concurrent)
    const concurrency = 3;
    for (let i = 0; i < images.length; i += concurrency) {
      const slice = images.slice(i, i + concurrency);
      await Promise.all(
        slice.map(async (img) => {
          const ocr = await performServerOcr(img.file_path);
          updateImageOcrResult(img.id, {
            status: ocr.text.trim().length > 0 ? 'COMPLETED' : 'COMPLETED',
            ocrText: ocr.text,
            ocrConfidence: ocr.confidence,
            processingTimeMs: ocr.processingTimeMs,
          });
          imageOcrResults.push({
            sourceImageId: img.id,
            text: ocr.text,
          });
        })
      );
    }

    // Merge multi-image fields
    const { unifiedFields, allFieldItems, aggregatedText } = mergeMultiImageFields(imageOcrResults);

    // If product name wasn't manually set or detected, deduce or default
    const productName = detail.product_name || unifiedFields.productName || 'Packaged Commodity';
    unifiedFields.productName = productName;

    // Run compliance checks
    const ruleResults = runRulesOnFields(unifiedFields, aggregatedText);
    const complianceScore = computeComplianceScore(ruleResults);
    const overallStatus = computeComplianceStatus(complianceScore);
    const aiSummary = buildAiSummary(unifiedFields, ruleResults, overallStatus);
    const processingTimeMs = Date.now() - start;

    // Save fields and checks
    saveExtractedFields(inspectionId, allFieldItems);
    saveComplianceChecks(inspectionId, ruleResults);

    // Complete inspection
    completeInspection(inspectionId, {
      productName,
      complianceScore,
      overallStatus,
      rawOcrText: aggregatedText,
      aiSummary,
      processingTimeMs,
      imagesAnalyzed: images.length,
    });

    const completed = getInspectionDetail(inspectionId);
    if (!completed) throw new Error('Failed to retrieve completed inspection');

    // Asynchronously sync to Supabase if credentials are provided
    syncInspectionToSupabase(completed).catch((err) => {
      console.warn('Background Supabase sync notice:', err);
    });

    return completed;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Analysis failed';
    failInspection(inspectionId, message);
    throw err;
  }
}

/**
 * Handle a demo product inspection in the database
 */
export async function createAndAnalyzeDemoInspection(demoProductId: string): Promise<FullInspectionDetail> {
  const product = DEMO_PRODUCTS.find((p) => p.id === demoProductId);
  if (!product) {
    throw new Error(`Demo product ${demoProductId} not found`);
  }

  const start = Date.now();
  const inspection = createInspection('demo', product.name, product.id);

  const fields = product.ocrResult.extractedFields;
  const rawText = product.ocrResult.rawText;
  const ruleResults = runRulesOnFields(fields, rawText);
  const complianceScore = computeComplianceScore(ruleResults);
  const overallStatus = computeComplianceStatus(complianceScore);
  const aiSummary = buildAiSummary(fields, ruleResults, overallStatus);
  const processingTimeMs = Date.now() - start;

  const fieldItems = Object.entries(fields)
    .filter(([_, val]) => !!val)
    .map(([key, val]) => ({
      fieldName: key,
      value: val as string,
      confidence: 0.95,
    }));

  saveExtractedFields(inspection.id, fieldItems);
  saveComplianceChecks(inspection.id, ruleResults);
  completeInspection(inspection.id, {
    productName: product.name,
    complianceScore,
    overallStatus,
    rawOcrText: rawText,
    aiSummary,
    processingTimeMs,
    imagesAnalyzed: 1,
  });

  const completed = getInspectionDetail(inspection.id);
  if (!completed) throw new Error('Failed to retrieve demo inspection');
  syncInspectionToSupabase(completed).catch(() => {});
  return completed;
}

/**
 * Handle a raw text / e-commerce listing inspection
 */
export async function createAndAnalyzeTextInspection(text: string, title?: string): Promise<FullInspectionDetail> {
  const start = Date.now();
  const inspection = createInspection('listing', title || 'E-Commerce Product Listing');

  const { unifiedFields, allFieldItems, aggregatedText } = mergeMultiImageFields([
    { text },
  ]);

  const productName = title || unifiedFields.productName || 'E-Commerce Product Listing';
  unifiedFields.productName = productName;

  const ruleResults = runRulesOnFields(unifiedFields, aggregatedText);
  const complianceScore = computeComplianceScore(ruleResults);
  const overallStatus = computeComplianceStatus(complianceScore);
  const aiSummary = buildAiSummary(unifiedFields, ruleResults, overallStatus);
  const processingTimeMs = Date.now() - start;

  saveExtractedFields(inspection.id, allFieldItems);
  saveComplianceChecks(inspection.id, ruleResults);
  completeInspection(inspection.id, {
    productName,
    complianceScore,
    overallStatus,
    rawOcrText: aggregatedText,
    aiSummary,
    processingTimeMs,
    imagesAnalyzed: 0,
  });

  const completed = getInspectionDetail(inspection.id);
  if (!completed) throw new Error('Failed to retrieve text inspection');
  syncInspectionToSupabase(completed).catch(() => {});
  return completed;
}
