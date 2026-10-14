// Compliance rules engine for Legal Metrology (Packaged Commodities) Rules, 2011
import { ExtractedFields, RuleResult } from '@/types';

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  category: string;
  severity: 'critical' | 'major' | 'minor';
  maxScore: number;
  validate: (fields: ExtractedFields, rawText: string) => Omit<RuleResult, 'ruleId' | 'ruleName' | 'category' | 'severity' | 'maxScore' | 'scoreEarned'>;
}

// Helper: check if a string has meaningful content
const hasContent = (val?: string): boolean =>
  !!val && val.trim().length > 2;

// Helper: check if an address looks complete (has PIN or state)
const looksLikeAddress = (val?: string): boolean => {
  if (!hasContent(val)) return false;
  const pinPattern = /\d{6}/;
  const stateKeywords = ['Delhi', 'Mumbai', 'Pune', 'Chennai', 'Bengaluru', 'Bangalore', 'Hyderabad', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Pradesh', 'Maharashtra', 'Karnataka', 'Haryana', 'Rajasthan', 'Gujarat', 'Tamil Nadu', 'West Bengal', 'Telangana', 'Kerala', 'India'];
  return pinPattern.test(val!) || stateKeywords.some((s) => val!.includes(s));
};

// Helper: check MRP-like pattern in raw text
const hasMrpInText = (text: string): boolean => {
  const patterns = [
    /\bm\.?r\.?p\.?\s*[:=]?\s*₹?\s*\d+/i,
    /\bmaximum retail price\s*[:=]?\s*₹?\s*\d+/i,
    /₹\s*\d+(\.\d{2})?/,
    /\brs\.?\s*\d+(\.\d{2})?/i,
    /\binr\s*\d+/i,
  ];
  return patterns.some((p) => p.test(text));
};

// Helper: check quantity pattern
const hasQuantityInText = (text: string): boolean => {
  const patterns = [
    /\bnet\s*(?:qty|quantity|wt|weight|vol|volume|contents?)\s*[:=]?\s*\d+/i,
    /\bnet\s*(?:wt\.?)?\s*[:=]?\s*\d+\s*(?:kg|g|gm|ml|l\b)/i,
  ];
  return patterns.some((p) => p.test(text));
};

// Helper: check date pattern
const hasDateInText = (text: string): boolean => {
  const patterns = [
    /\b(mfg|mfd|manufactured|pkd|packed|packing|import|expiry|best before|use by)\b.*\d{2}\/\d{4}/i,
    /\d{2}\/\d{4}/,
    /\d{2}-\d{4}/,
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{4}/i,
  ];
  return patterns.some((p) => p.test(text));
};

// Helper: check phone pattern
const hasPhoneInText = (text: string): boolean => {
  const patterns = [
    /1800[\s-]?\d{3}[\s-]?\d{4}/,
    /\+91[\s-]?\d{5}[\s-]?\d{5}/,
    /\b\d{10}\b/,
    /helpline|customer care|consumer care|toll.?free/i,
  ];
  return patterns.some((p) => p.test(text));
};

export const COMPLIANCE_RULES: ComplianceRule[] = [
  {
    id: 'R01',
    name: 'Product Identity',
    description: 'Product must have a clear name or identity declaration.',
    category: 'Product Identification',
    severity: 'critical',
    maxScore: 10,
    validate: (fields, rawText) => {
      if (hasContent(fields.productName)) {
        return {
          status: 'PASS',
          confidence: 0.95,
          message: `Product name identified: "${fields.productName}"`,
          evidence: fields.productName,
          explanation: 'Product name declaration was detected with high confidence.',
          weight: 10,
        };
      }
      if (rawText.length > 20) {
        return {
          status: 'WARNING',
          confidence: 0.5,
          message: 'Product name could not be clearly identified.',
          evidence: undefined,
          explanation: 'Text was detected but a specific product name declaration could not be confidently extracted.',
          weight: 10,
        };
      }
      return {
        status: 'FAIL',
        confidence: 0.2,
        message: 'Product name declaration not detected.',
        evidence: undefined,
        explanation: 'No product identification information could be extracted from the label.',
        weight: 10,
      };
    },
  },
  {
    id: 'R02',
    name: 'Manufacturer / Packer / Importer',
    description: 'Name of manufacturer, packer, or importer must be declared.',
    category: 'Manufacturer Information',
    severity: 'critical',
    maxScore: 15,
    validate: (fields) => {
      const entity = fields.manufacturer || fields.packer || fields.importer;
      if (hasContent(entity)) {
        return {
          status: 'PASS',
          confidence: 0.92,
          message: `Entity identified: "${entity}"`,
          evidence: entity,
          explanation: 'Manufacturer / packer / importer declaration detected.',
          weight: 15,
        };
      }
      return {
        status: 'FAIL',
        confidence: 0.15,
        message: 'Manufacturer / packer / importer declaration not detected.',
        evidence: undefined,
        explanation: 'The label does not appear to contain a manufacturer, packer, or importer name as required under Rule 6.',
        weight: 15,
      };
    },
  },
  {
    id: 'R03',
    name: 'Registered Address',
    description: 'Complete address of manufacturer / packer / importer must be declared.',
    category: 'Manufacturer Information',
    severity: 'major',
    maxScore: 10,
    validate: (fields) => {
      if (looksLikeAddress(fields.manufacturerAddress)) {
        return {
          status: 'PASS',
          confidence: 0.88,
          message: `Address detected: "${fields.manufacturerAddress}"`,
          evidence: fields.manufacturerAddress,
          explanation: 'A complete-looking address was identified on the label.',
          weight: 10,
        };
      }
      if (hasContent(fields.manufacturerAddress)) {
        return {
          status: 'WARNING',
          confidence: 0.55,
          message: 'Address detected but may be incomplete.',
          evidence: fields.manufacturerAddress,
          explanation: 'An address was found but it may not include complete details such as PIN code or state.',
          weight: 10,
        };
      }
      return {
        status: 'FAIL',
        confidence: 0.1,
        message: 'Manufacturer / packer address not detected.',
        evidence: undefined,
        explanation: 'No address information could be extracted. A complete registered address is mandatory under Rule 6.',
        weight: 10,
      };
    },
  },
  {
    id: 'R04',
    name: 'Net Quantity',
    description: 'Net quantity in standard units must be declared.',
    category: 'Quantity Declaration',
    severity: 'critical',
    maxScore: 15,
    validate: (fields, rawText) => {
      if (hasContent(fields.netQuantity)) {
        return {
          status: 'PASS',
          confidence: 0.93,
          message: `Net quantity declared: "${fields.netQuantity}"`,
          evidence: fields.netQuantity,
          explanation: 'Net quantity declaration detected in standard metric units.',
          weight: 15,
        };
      }
      if (hasQuantityInText(rawText)) {
        return {
          status: 'WARNING',
          confidence: 0.6,
          message: 'Quantity detected but format may not be standard.',
          evidence: undefined,
          explanation: 'A quantity-like value was found in the text but could not be clearly attributed to a mandatory net quantity declaration.',
          weight: 15,
        };
      }
      return {
        status: 'FAIL',
        confidence: 0.1,
        message: 'Net quantity declaration not detected.',
        evidence: undefined,
        explanation: 'No net quantity information was found. Net quantity declaration is mandatory under Rule 6(1)(b).',
        weight: 15,
      };
    },
  },
  {
    id: 'R05',
    name: 'Maximum Retail Price (MRP)',
    description: 'MRP inclusive of all taxes must be declared in Indian Rupees.',
    category: 'Price Declaration',
    severity: 'critical',
    maxScore: 20,
    validate: (fields, rawText) => {
      if (hasContent(fields.mrp)) {
        return {
          status: 'PASS',
          confidence: 0.95,
          message: `MRP declared: "${fields.mrp}"`,
          evidence: fields.mrp,
          explanation: 'Maximum Retail Price declaration detected.',
          weight: 20,
        };
      }
      if (hasMrpInText(rawText)) {
        return {
          status: 'WARNING',
          confidence: 0.55,
          message: 'Price-like text detected but MRP format may be non-standard.',
          evidence: undefined,
          explanation: 'A price was found but could not be confirmed as a proper MRP declaration inclusive of all taxes.',
          weight: 20,
        };
      }
      return {
        status: 'FAIL',
        confidence: 0.05,
        message: 'MRP declaration not detected.',
        evidence: undefined,
        explanation: 'No MRP (Maximum Retail Price) declaration was found. MRP inclusive of all taxes is mandatory under Rule 6(1)(f) of the Legal Metrology (Packaged Commodities) Rules, 2011.',
        weight: 20,
      };
    },
  },
  {
    id: 'R06',
    name: 'Date of Manufacture / Packing / Import',
    description: 'Month and year of manufacture, packing, or import must be declared.',
    category: 'Date Declaration',
    severity: 'major',
    maxScore: 15,
    validate: (fields, rawText) => {
      const date = fields.manufacturingDate || fields.packingDate || fields.importDate;
      if (hasContent(date)) {
        return {
          status: 'PASS',
          confidence: 0.91,
          message: `Date detected: "${date}"`,
          evidence: date,
          explanation: 'Manufacturing / packing / import date declaration detected.',
          weight: 15,
        };
      }
      if (hasDateInText(rawText)) {
        return {
          status: 'WARNING',
          confidence: 0.55,
          message: 'Date-like text found but type unclear.',
          evidence: undefined,
          explanation: 'A date was detected in the text, but it could not be confirmed as the required manufacturing, packing, or import date.',
          weight: 15,
        };
      }
      return {
        status: 'FAIL',
        confidence: 0.1,
        message: 'Date of manufacture / packing not detected.',
        evidence: undefined,
        explanation: 'No manufacturing or packing date was found. Month and year of manufacture/packing is mandatory under Rule 6(1)(d).',
        weight: 15,
      };
    },
  },
  {
    id: 'R07',
    name: 'Consumer Care Information',
    description: 'Consumer care contact details (phone/email) must be provided.',
    category: 'Consumer Care',
    severity: 'major',
    maxScore: 10,
    validate: (fields, rawText) => {
      const hasPhone = hasContent(fields.consumerCareNumber) || hasPhoneInText(rawText);
      const hasEmail = hasContent(fields.consumerCareEmail);
      if (hasPhone && hasEmail) {
        return {
          status: 'PASS',
          confidence: 0.92,
          message: `Consumer care: ${fields.consumerCareNumber || 'number detected'} | ${fields.consumerCareEmail || 'email detected'}`,
          evidence: `Phone: ${fields.consumerCareNumber || 'detected'}, Email: ${fields.consumerCareEmail}`,
          explanation: 'Both phone and email consumer care details detected.',
          weight: 10,
        };
      }
      if (hasPhone || hasEmail) {
        return {
          status: 'WARNING',
          confidence: 0.65,
          message: 'Consumer care information appears incomplete.',
          evidence: fields.consumerCareEmail || fields.consumerCareNumber,
          explanation: 'Only partial consumer care information was detected. Both a contact number and email are recommended for complete compliance.',
          weight: 10,
        };
      }
      return {
        status: 'FAIL',
        confidence: 0.1,
        message: 'Consumer care information not detected.',
        evidence: undefined,
        explanation: 'No consumer care contact details (phone or email) were found on the label. Consumer care information is required under the Consumer Protection Act.',
        weight: 10,
      };
    },
  },
  {
    id: 'R08',
    name: 'Country of Origin',
    description: 'Country of origin should be declared (mandatory for imports; recommended for domestic).',
    category: 'Origin Declaration',
    severity: 'minor',
    maxScore: 5,
    validate: (fields, rawText) => {
      const hasCountry = hasContent(fields.countryOfOrigin) || /country of origin|made in|product of/i.test(rawText);
      if (hasCountry) {
        return {
          status: 'PASS',
          confidence: 0.88,
          message: `Country of origin: "${fields.countryOfOrigin || 'detected in text'}"`,
          evidence: fields.countryOfOrigin,
          explanation: 'Country of origin declaration was detected.',
          weight: 5,
        };
      }
      return {
        status: 'WARNING',
        confidence: 0.5,
        message: 'Country of origin not explicitly declared.',
        evidence: undefined,
        explanation: 'Country of origin is mandatory for imported goods. For domestic products it is strongly recommended.',
        weight: 5,
      };
    },
  },
];
