import { ExtractedFields } from '@/types';

export interface ExtractedFieldItem {
  fieldName: keyof ExtractedFields;
  value: string;
  confidence: number;
  sourceImageId?: string;
}

export function extractFieldsFromText(text: string, sourceImageId?: string): {
  fields: ExtractedFields;
  fieldItems: ExtractedFieldItem[];
} {
  const fields: ExtractedFields = {};
  const fieldItems: ExtractedFieldItem[] = [];

  const addField = (name: keyof ExtractedFields, value: string, confidence: number) => {
    const cleanVal = value.trim().replace(/^[:=\-\s]+/, '').replace(/[\s]+$/, '');
    if (cleanVal.length > 0 && !fields[name]) {
      fields[name] = cleanVal;
      fieldItems.push({
        fieldName: name,
        value: cleanVal,
        confidence,
        sourceImageId,
      });
    }
  };

  // 1. Product Name - Look for title case or uppercase header lines or explicit "Product:" prefix
  const productLabelMatch = text.match(/(?:product|commodity|item|brand)\s*(?:name)?\s*[:=]\s*([^\n\r]+)/i);
  if (productLabelMatch) {
    addField('productName', productLabelMatch[1], 0.95);
  } else {
    // Look for prominent line near the beginning, excluding nutrition/ingredient terms
    const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 2);
    const candidate = lines.slice(0, 8).find((l) => {
      // Must contain actual letters
      if (!/[A-Za-z]{3,}/.test(l)) return false;
      // Filter out non-product name lines and dividers
      if (/^[\W\d_—\-\.]+$/.test(l)) return false;
      if (/^(nutrition|ingredients?|serving|facts?|calories|daily value|amount per|total fat|trans fat|cholesterol|sodium|carbohydrate|sugars?|protein|vitamin|calcium|iron|potassium|contains|keep in|store in|mrp|net\s|mfg|batch|fssai|packed|manufactured|warning|best before|customer care|helpline|regd)/i.test(l)) return false;
      if (/\b(serving size|per serving|daily value|calories|less fat|added sugars)\b/i.test(l)) return false;
      return l.length >= 3 && l.length <= 50;
    });
    if (candidate) {
      addField('productName', candidate, 0.8);
    }
  }

  // 2. Manufacturer
  const mfgMatch = text.match(/\b(?:manufactured|mfd\.?|marketed|distributed)\s+by\s*[:.]?\s*([^\n\r,;]+)/i);
  if (mfgMatch) {
    addField('manufacturer', mfgMatch[1].trim(), 0.92);
  }

  // 3. Packer
  const packerMatch = text.match(/\b(?:packed|pkd\.?|packaging)\s+by\s*[:.]?\s*([^\n\r,;]+)/i);
  if (packerMatch) {
    addField('packer', packerMatch[1].trim(), 0.9);
  }

  // 4. Importer
  const importerMatch = text.match(/\b(?:imported|import)\s+by\s*[:.]?\s*([^\n\r,;]+)/i);
  if (importerMatch) {
    addField('importer', importerMatch[1].trim(), 0.9);
  }

  // 5. Address (Look for PIN codes, State names, or address labels)
  const addressPatterns = [
    /(?:address|regd\.?\s*office|factory|plant|unit[-\s]?\d*|works)\s*[:.]?\s*([^\n]+(?:\n[^\n]+){0,2})/i,
    /([^,\n]+,\s*[^,\n]+,\s*[^,\n]+\s*[-\s]\s*\d{6})/,
    /([A-Za-z0-9\s,.-]+(?:Delhi|Mumbai|Pune|Chennai|Bengaluru|Bangalore|Hyderabad|Kolkata|Ahmedabad|Jaipur|Pradesh|Maharashtra|Karnataka|Haryana|Rajasthan|Gujarat|Tamil Nadu|West Bengal|Telangana|Kerala|Noida|Gurugram)\s*[-\s]?\s*\d{6})/i,
  ];
  for (const p of addressPatterns) {
    const m = text.match(p);
    if (m) {
      let rawAddr = m[1].replace(/\n/g, ', ').trim();
      rawAddr = rawAddr.split(/,\s*(?:net\s*qty|net\s*quantity|net\s*wt|m\.?r\.?p|maximum retail|pkd|mfg|manufactured|batch|customer care|consumer care|email|phone)/i)[0].trim();
      addField('manufacturerAddress', rawAddr, 0.88);
      break;
    }
  }

  // 6. Net Quantity (Strictly require Net or Net Qty / Net Wt, avoiding serving sizes)
  const qtyPatterns = [
    /\bnet\s*(?:qty|quantity|wt\.?|weight|vol\.?|volume|contents?)\s*[:=]?\s*([\d.,]+\s*(?:kg|g|gm|grams?|ml|litre|liter|l\b|pieces?|pcs|units?))/i,
    /\bnet\s*(?:wt\.?|weight)?\s*[:=]?\s*(\d+(?:\.\d+)?\s*(?:kg|g|gm|ml|l\b|litre))\b/i,
  ];
  for (const p of qtyPatterns) {
    const m = text.match(p);
    if (m) {
      addField('netQuantity', m[1], 0.93);
      break;
    }
  }

  // 7. Maximum Retail Price (MRP) - Strict word boundaries to avoid matching sugars or calories
  const mrpPatterns = [
    /\b(?:m\.?r\.?p\.?|maximum retail price)\s*[:=]?\s*(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d{2})?(?:\s*\/\-)?(?:\s*\(?incl\.?(?:usive)?\s*(?:of)?\s*all\s*taxes\)?)?)/i,
    /\b(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d{2})?)\s*(?:\(?\s*incl|\/\-)/i,
  ];
  for (const p of mrpPatterns) {
    const m = text.match(p);
    if (m) {
      let raw = m[1].trim();
      if (!raw.startsWith('₹') && !raw.toLowerCase().startsWith('rs')) {
        raw = `₹${raw}`;
      }
      addField('mrp', raw, 0.94);
      break;
    }
  }

  // 8. Manufacturing date
  const mfgDateMatch = text.match(/(?:mfg|mfd|manufactured)\s*[:.]?\s*(\d{2}\/\d{4}|\d{2}-\d{4}|\d{2}\.\d{4}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4})/i);
  if (mfgDateMatch) {
    addField('manufacturingDate', mfgDateMatch[1], 0.91);
  }

  // 9. Packing date
  const pkdMatch = text.match(/(?:pkd|packed|packing date?)\s*[:.]?\s*(\d{2}\/\d{4}|\d{2}-\d{4}|\d{2}\.\d{4}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4})/i);
  if (pkdMatch) {
    addField('packingDate', pkdMatch[1], 0.91);
  }

  // 10. Import date
  const importDateMatch = text.match(/(?:import(?:ed)?|imp\.)\s*date?\s*[:.]?\s*(\d{2}\/\d{4}|\d{2}-\d{4})/i);
  if (importDateMatch) {
    addField('importDate', importDateMatch[1], 0.9);
  }

  // 11. Expiry / Best Before
  const expiryMatch = text.match(/(?:best before|use by|expiry|exp\.?)\s*[:.]?\s*(\d{2}\/\d{4}|\d{2}-\d{4}|\d+\s*months?(?:\s*from\s*(?:mfg|packing|date))?)/i);
  if (expiryMatch) {
    addField('expiryDate', expiryMatch[1], 0.88);
  }

  // 12. Consumer Care Number
  const phonePatterns = [
    /1800[\s-]?\d{3}[\s-]?\d{4}/,
    /\+91[\s-]?\d{5}[\s-]?\d{5}/,
    /(?:helpline|consumer care|customer care|toll.?free)\s*[:.]?\s*([\d\s\-+()]{10,16})/i,
    /\b\d{10}\b/,
  ];
  for (const p of phonePatterns) {
    const m = text.match(p);
    if (m) {
      addField('consumerCareNumber', (m[1] || m[0]).trim(), 0.92);
      break;
    }
  }

  // 13. Consumer Care Email
  const emailMatch = text.match(/\b([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})\b/);
  if (emailMatch) {
    addField('consumerCareEmail', emailMatch[1], 0.95);
  }

  // 14. Country of Origin
  const countryPatterns = [
    /(?:country of origin|made in|product of)\s*[:.]?\s*([A-Za-z\s]+?)(?:\n|\.|\,|$)/i,
  ];
  for (const p of countryPatterns) {
    const m = text.match(p);
    if (m) {
      addField('countryOfOrigin', m[1].trim(), 0.92);
      break;
    }
  }

  // 15. FSSAI License
  const fssaiMatch = text.match(/fssai\s*(?:lic(?:ense|ence)?\.?\s*no\.?|no\.?|#)?\s*[:\-]?\s*(\d{14})/i);
  if (fssaiMatch) {
    addField('fssaiLicense', fssaiMatch[1], 0.96);
  }

  // 16. Batch / Lot Number
  const batchMatch = text.match(/(?:batch|lot)\s*(?:no\.?|number|#)\s*[:.-]?\s*([A-Z0-9\-]+)/i);
  if (batchMatch) {
    addField('batchNumber', batchMatch[1], 0.9);
  }

  return { fields, fieldItems };
}

/**
 * Merge extracted fields from multiple images into a unified set of fields.
 * If multiple images detect the same field, highest confidence wins.
 */
export function mergeMultiImageFields(
  results: Array<{ sourceImageId?: string; text: string }>
): {
  unifiedFields: ExtractedFields;
  allFieldItems: ExtractedFieldItem[];
  aggregatedText: string;
} {
  const unifiedFields: ExtractedFields = {};
  const allFieldItems: ExtractedFieldItem[] = [];
  const textParts: string[] = [];

  for (const item of results) {
    if (item.text) {
      textParts.push(item.text);
      const { fieldItems } = extractFieldsFromText(item.text, item.sourceImageId);

      for (const fi of fieldItems) {
        allFieldItems.push(fi);
        const existingVal = unifiedFields[fi.fieldName];
        if (!existingVal) {
          unifiedFields[fi.fieldName] = fi.value;
        }
      }
    }
  }

  return {
    unifiedFields,
    allFieldItems,
    aggregatedText: textParts.join('\n\n--- Next Panel / Side ---\n\n'),
  };
}
