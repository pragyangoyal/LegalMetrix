// Demo products with pre-baked realistic OCR data
import { DemoProduct, OcrResult } from '@/types';

const riceOcrResult: OcrResult = {
  rawText: `GOLDEN HARVEST
PREMIUM BASMATI RICE
Long Grain Aged Basmati

Marketed by: Sunrise Agro Foods Pvt. Ltd.
Registered Office: Plot No. 45, Sector 18, Gurugram, Haryana - 122015
Customer Care: 1800-103-4567 | care@sunriseagro.in

Net Qty: 5 kg (5000 g)
MRP ₹650.00 (Inclusive of all taxes)
Best Before: 12 Months from packing date
Pkd: 08/2026
Batch No: BAT-GH-0826-A1

FSSAI Lic. No: 12519013000798
Country of Origin: India

For complaints: consumer.affairs@sunriseagro.in | 1800-103-4567
`,
  confidence: 0.94,
  extractedFields: {
    productName: 'Golden Harvest Premium Basmati Rice',
    manufacturer: 'Sunrise Agro Foods Pvt. Ltd.',
    manufacturerAddress: 'Plot No. 45, Sector 18, Gurugram, Haryana - 122015',
    packer: 'Sunrise Agro Foods Pvt. Ltd.',
    netQuantity: '5 kg (5000 g)',
    mrp: '₹650.00',
    packingDate: '08/2026',
    consumerCareNumber: '1800-103-4567',
    consumerCareEmail: 'care@sunriseagro.in',
    countryOfOrigin: 'India',
    fssaiLicense: '12519013000798',
    batchNumber: 'BAT-GH-0826-A1',
  },
  imageQuality: 'Good',
  analysisTimeMs: 2100,
  fieldsDetected: 10,
  totalFields: 10,
};

const shampooOcrResult: OcrResult = {
  rawText: `NaturaHerb
HERBAL SHAMPOO
With Brahmi & Amla Extract

Manufactured by: Wellness Personal Care Ltd.
Factory: Unit-2, Industrial Estate, Pune, Maharashtra - 411019

Net Contents: 200 mL
MRP: ₹249.00 (Incl. of all taxes)
Mfg: 06/2026

For queries write to: wellness@naturaherbcare.com

FSSAI not required - Cosmetic Product
`,
  confidence: 0.87,
  extractedFields: {
    productName: 'NaturaHerb Herbal Shampoo',
    manufacturer: 'Wellness Personal Care Ltd.',
    manufacturerAddress: 'Unit-2, Industrial Estate, Pune, Maharashtra - 411019',
    netQuantity: '200 mL',
    mrp: '₹249.00',
    manufacturingDate: '06/2026',
    consumerCareEmail: 'wellness@naturaherbcare.com',
    // consumerCareNumber intentionally missing
    // countryOfOrigin intentionally missing
  },
  imageQuality: 'Fair',
  analysisTimeMs: 2800,
  fieldsDetected: 7,
  totalFields: 10,
};

const namkeenOcrResult: OcrResult = {
  rawText: `SPICY CRUNCH
Masala Namkeen
Net Wt. 150g approx

Crispy Gram, Peanuts, Spices, Salt, Oil
Mfg: Shree Snacks

Contact: shreefoods.care@gmail.com
`,
  confidence: 0.71,
  extractedFields: {
    productName: 'Spicy Crunch Masala Namkeen',
    manufacturer: 'Shree Snacks',
    netQuantity: '150g approx',
    // mrp intentionally missing
    // manufacturerAddress intentionally missing
    // manufacturingDate intentionally missing
    // consumerCareNumber intentionally missing
    consumerCareEmail: 'shreefoods.care@gmail.com',
  },
  imageQuality: 'Poor',
  analysisTimeMs: 3400,
  fieldsDetected: 4,
  totalFields: 10,
};

export const DEMO_PRODUCTS: DemoProduct[] = [
  {
    id: 'demo-rice',
    name: 'Golden Harvest Premium Basmati Rice',
    category: 'Food & Grocery',
    expectedStatus: 'COMPLIANT',
    expectedScore: 96,
    ocrResult: riceOcrResult,
  },
  {
    id: 'demo-shampoo',
    name: 'NaturaHerb Herbal Shampoo',
    category: 'Personal Care',
    expectedStatus: 'WARNING',
    expectedScore: 78,
    ocrResult: shampooOcrResult,
  },
  {
    id: 'demo-namkeen',
    name: 'Spicy Crunch Masala Namkeen',
    category: 'Snacks & Beverages',
    expectedStatus: 'NON-COMPLIANT',
    expectedScore: 58,
    ocrResult: namkeenOcrResult,
  },
];

export const getDemoProduct = (id: string): DemoProduct | undefined =>
  DEMO_PRODUCTS.find((p) => p.id === id);
