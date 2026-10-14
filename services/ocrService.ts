// OCR Service - abstracts Tesseract.js with demo fallback
import { ExtractedFields, OcrResult } from '@/types';

// Field extraction from raw OCR text using pattern matching
function extractFields(text: string): ExtractedFields {
  const fields: ExtractedFields = {};

  // Product name - look for prominent text at top, or brand-like patterns
  const productNameMatch = text.match(/^([A-Z][A-Z\s&]{2,40})\n/m);
  if (productNameMatch) fields.productName = productNameMatch[1].trim();

  // Manufacturer
  const mfgMatch = text.match(/(?:manufactured|marketed|distributed)\s+by\s*[:.]?\s*([^\n]+)/i);
  if (mfgMatch) fields.manufacturer = mfgMatch[1].trim();

  // Packer
  const packerMatch = text.match(/packed\s+by\s*[:.]?\s*([^\n]+)/i);
  if (packerMatch) fields.packer = packerMatch[1].trim();

  // Importer
  const importerMatch = text.match(/imported\s+by\s*[:.]?\s*([^\n]+)/i);
  if (importerMatch) fields.importer = importerMatch[1].trim();

  // Address - look for lines with PIN codes or state names
  const addressPatterns = [
    /(?:address|registered office|factory|plant|unit[-\s]?\d*)\s*[:.]?\s*([^\n]+(?:\n[^\n]+){0,3})/i,
    /([^,\n]+,\s*[^,\n]+,\s*[^,\n]+\s*[-\s]\s*\d{6})/,
  ];
  for (const p of addressPatterns) {
    const m = text.match(p);
    if (m) { fields.manufacturerAddress = m[1].trim().replace(/\n/g, ', '); break; }
  }

  // Net quantity
  const qtyPatterns = [
    /net\s*(?:qty|quantity|wt\.?|weight|vol\.?|volume|contents?)\s*[:=]?\s*([\d.,]+\s*(?:kg|g|gm|grams?|ml|litre|liter|l\b|pieces?|pcs|units?))/i,
    /(\d+(?:\.\d+)?\s*(?:kg|g|gm|ml|l\b|litre)(?:\s*\([^)]+\))?)/i,
  ];
  for (const p of qtyPatterns) {
    const m = text.match(p);
    if (m) { fields.netQuantity = m[1].trim(); break; }
  }

  // MRP
  const mrpPatterns = [
    /(?:m\.?r\.?p\.?|maximum retail price)\s*[:=]?\s*(₹?\s*[\d,]+(?:\.\d{2})?)/i,
    /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{2})?)\s*(?:\(?incl|inclusive|including)?/i,
  ];
  for (const p of mrpPatterns) {
    const m = text.match(p);
    if (m) {
      const raw = m[1].trim();
      fields.mrp = raw.startsWith('₹') ? raw : `₹${raw}`;
      break;
    }
  }

  // Manufacturing date
  const mfgDateMatch = text.match(/(?:mfg|mfd|manufactured)\s*[:.]?\s*(\d{2}\/\d{4}|\d{2}-\d{4}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4})/i);
  if (mfgDateMatch) fields.manufacturingDate = mfgDateMatch[1].trim();

  // Packing date
  const pkdMatch = text.match(/(?:pkd|packed|packing date?)\s*[:.]?\s*(\d{2}\/\d{4}|\d{2}-\d{4}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4})/i);
  if (pkdMatch) fields.packingDate = pkdMatch[1].trim();

  // Import date
  const importDateMatch = text.match(/(?:import(?:ed)?|imp\.)?\s*date?\s*[:.]?\s*(\d{2}\/\d{4})/i);
  if (importDateMatch) fields.importDate = importDateMatch[1].trim();

  // Expiry
  const expiryMatch = text.match(/(?:best before|use by|expiry|exp\.?)\s*[:.]?\s*(\d{2}\/\d{4}|\d+\s*months?)/i);
  if (expiryMatch) fields.expiryDate = expiryMatch[1].trim();

  // Consumer care number
  const phonePatterns = [
    /1800[\s-]?\d{3}[\s-]?\d{4}/,
    /\+91[\s-]?\d{5}[\s-]?\d{5}/,
    /(?:helpline|consumer care|customer care|toll.?free)\s*[:.]?\s*([\d\s\-+()]{10,15})/i,
  ];
  for (const p of phonePatterns) {
    const m = text.match(p);
    if (m) { fields.consumerCareNumber = (m[1] || m[0]).trim(); break; }
  }

  // Email
  const emailMatch = text.match(/\b([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})\b/);
  if (emailMatch) fields.consumerCareEmail = emailMatch[1];

  // Country of origin
  const countryMatch = text.match(/(?:country of origin|made in|product of)\s*[:.]?\s*([A-Za-z\s]+?)(?:\n|\.)/i);
  if (countryMatch) fields.countryOfOrigin = countryMatch[1].trim();

  // FSSAI
  const fssaiMatch = text.match(/fssai\s*(?:lic(?:ense|ence)?\.?\s*no\.?|no\.?|#)?\s*[:\-]?\s*(\d{14})/i);
  if (fssaiMatch) fields.fssaiLicense = fssaiMatch[1];

  // Batch/Lot
  const batchMatch = text.match(/(?:batch|lot)\s*(?:no\.?|number|#)\s*[:.-]?\s*([A-Z0-9\-]+)/i);
  if (batchMatch) fields.batchNumber = batchMatch[1];

  return fields;
}

function assessImageQuality(confidence: number): 'Good' | 'Fair' | 'Poor' {
  if (confidence >= 0.8) return 'Good';
  if (confidence >= 0.6) return 'Fair';
  return 'Poor';
}

function countFields(fields: ExtractedFields): number {
  const keys: (keyof ExtractedFields)[] = [
    'productName', 'manufacturer', 'manufacturerAddress', 'netQuantity',
    'mrp', 'manufacturingDate', 'packingDate', 'consumerCareNumber',
    'consumerCareEmail', 'countryOfOrigin',
  ];
  return keys.filter((k) => !!fields[k] && (fields[k] as string).trim().length > 0).length;
}

// Real OCR using Tesseract.js (dynamically imported)
export async function analyzeImageWithOCR(imageDataUrl: string): Promise<OcrResult> {
  const start = performance.now();

  try {
    // Dynamic import to avoid SSR issues
    const Tesseract = await import('tesseract.js');
    const { data } = await Tesseract.recognize(imageDataUrl, 'eng', {
      logger: () => {}, // suppress logs
    });

    const rawText = data.text || '';
    const confidence = (data.confidence || 0) / 100;
    const fields = extractFields(rawText);
    const fieldsDetected = countFields(fields);

    return {
      rawText,
      confidence,
      extractedFields: fields,
      imageQuality: assessImageQuality(confidence),
      analysisTimeMs: Math.round(performance.now() - start),
      fieldsDetected,
      totalFields: 10,
    };
  } catch (err) {
    console.error('OCR error:', err);
    // Fallback: return minimal result so app doesn't crash
    return {
      rawText: '',
      confidence: 0,
      extractedFields: {},
      imageQuality: 'Poor',
      analysisTimeMs: Math.round(performance.now() - start),
      fieldsDetected: 0,
      totalFields: 10,
    };
  }
}

// Text-based analysis (for e-commerce listing mode)
export function analyzeText(text: string): OcrResult {
  const start = performance.now();
  const fields = extractFields(text);
  const fieldsDetected = countFields(fields);
  // Estimate confidence based on how many fields found
  const confidence = Math.min(0.5 + fieldsDetected * 0.05, 0.95);

  return {
    rawText: text,
    confidence,
    extractedFields: fields,
    imageQuality: 'Good',
    analysisTimeMs: Math.round(performance.now() - start),
    fieldsDetected,
    totalFields: 10,
  };
}
