'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload, Camera, Zap, Image as ImageIcon, X, CheckCircle2,
  AlertCircle, ChevronRight, FlaskConical, FileText, Plus, Layers, Tag
} from 'lucide-react';
import { DEMO_PRODUCTS } from '@/data/demoProducts';
import { saveCurrentResult, saveToHistory } from '@/services/historyService';
import { AnalysisResult } from '@/types';
import clsx from 'clsx';

type Tab = 'image' | 'listing';

interface SelectedImageItem {
  id: string;
  file: File;
  previewUrl: string;
  label: string;
}

const PANEL_LABELS = [
  'Front Panel',
  'Back Panel / Details',
  'MRP & Batch Panel',
  'Side Panel',
  'Ingredients & Nutrition',
  'Other Label',
];

const SCAN_STEPS = [
  'Creating inspection session...',
  'Uploading product package images...',
  'Processing multi-image OCR panels...',
  'Aggregating declarations across sides...',
  'Validating Legal Metrology Rules (2011)...',
  'Generating statutory compliance report...',
];

export default function ScanPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<Tab>('image');
  const [dragOver, setDragOver] = useState(false);
  const [selectedImages, setSelectedImages] = useState<SelectedImageItem[]>([]);
  const [productNameInput, setProductNameInput] = useState('');
  const [listingText, setListingText] = useState('');
  const [listingTitle, setListingTitle] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const addFiles = useCallback((files: FileList | File[]) => {
    const validFiles: SelectedImageItem[] = [];
    const maxFiles = 10;
    const currentCount = selectedImages.length;

    if (currentCount + files.length > maxFiles) {
      setError(`You can upload at most ${maxFiles} images per product inspection.`);
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        setError('Only image files (JPG, PNG, WEBP, etc.) are allowed.');
        continue;
      }
      if (file.size > 20 * 1024 * 1024) {
        setError(`"${file.name}" exceeds the 20MB limit.`);
        continue;
      }

      const defaultLabel = PANEL_LABELS[Math.min(currentCount + i, PANEL_LABELS.length - 1)];
      validFiles.push({
        id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        label: defaultLabel,
      });
    }

    if (validFiles.length > 0) {
      setError(null);
      setSelectedImages((prev) => [...prev, ...validFiles]);
    }
  }, [selectedImages]);

  const removeImage = (id: string) => {
    setSelectedImages((prev) => {
      const item = prev.find((img) => img.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((img) => img.id !== id);
    });
  };

  const updateLabel = (id: string, label: string) => {
    setSelectedImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, label } : img))
    );
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  // Run Multi-Image Inspection via Backend API
  const runMultiImageAnalysis = async () => {
    if (selectedImages.length === 0) {
      setError('Please add at least one image of the product packaging.');
      return;
    }

    setScanning(true);
    setScanStep(0);
    setError(null);

    try {
      // Step 1: Create inspection session
      setScanStep(0);
      const createRes = await fetch('/api/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanMode: 'upload',
          productName: productNameInput.trim() || undefined,
        }),
      });
      if (!createRes.ok) throw new Error('Failed to create inspection session');
      const inspection = await createRes.json();
      const inspectionId = inspection.id;

      // Step 2: Upload images
      setScanStep(1);
      const formData = new FormData();
      selectedImages.forEach((item) => {
        formData.append('images', item.file);
      });
      formData.append('labels', JSON.stringify(selectedImages.map((s) => s.label)));

      const uploadRes = await fetch(`/api/inspections/${inspectionId}/images`, {
        method: 'POST',
        body: formData,
      });
      if (!uploadRes.ok) throw new Error('Failed to upload inspection images');

      // Step 3 & 4: Trigger analysis
      setScanStep(2);
      await new Promise((r) => setTimeout(r, 600));
      setScanStep(3);

      const analyzeRes = await fetch(`/api/inspections/${inspectionId}/analyze`, {
        method: 'POST',
      });
      if (!analyzeRes.ok) {
        const errData = await analyzeRes.json().catch(() => ({}));
        throw new Error(errData.error || 'Multi-image analysis failed');
      }

      setScanStep(4);
      const detail = await analyzeRes.json();
      await new Promise((r) => setTimeout(r, 500));
      setScanStep(5);
      await new Promise((r) => setTimeout(r, 400));

      // Build backward-compatible AnalysisResult for session storage & history
      const firstImg = selectedImages[0]?.previewUrl;
      const legacyResult: AnalysisResult = {
        id: detail.id,
        timestamp: detail.created_at,
        productName: detail.product_name || 'Packaged Commodity',
        imageDataUrl: detail.images?.[0]?.url || firstImg,
        scanMode: 'upload',
        ocrResult: {
          rawText: detail.raw_ocr_text || '',
          confidence: detail.checks?.[0]?.confidence || 0.9,
          extractedFields: detail.fields || {},
          imageQuality: 'Good',
          analysisTimeMs: detail.processing_time_ms || 1000,
          fieldsDetected: Object.keys(detail.fields || {}).length,
          totalFields: 10,
        },
        ruleResults: (detail.checks || []).map((c: any) => ({
          ruleId: c.rule_id,
          ruleName: c.rule_name,
          category: c.category,
          severity: c.severity,
          status: c.status,
          confidence: c.confidence,
          message: c.message,
          evidence: c.evidence,
          explanation: c.explanation,
          weight: c.max_score,
          scoreEarned: c.score_earned,
          maxScore: c.max_score,
        })),
        complianceScore: detail.compliance_score || 0,
        complianceStatus: detail.overall_status || 'NON-COMPLIANT',
        issuesCount: (detail.checks || []).filter((c: any) => c.status === 'FAIL').length,
        warningsCount: (detail.checks || []).filter((c: any) => c.status === 'WARNING').length,
        passedCount: (detail.checks || []).filter((c: any) => c.status === 'PASS').length,
        aiSummary: detail.ai_summary || '',
      };

      saveCurrentResult(legacyResult);
      saveToHistory(legacyResult);

      router.push(`/result?id=${inspectionId}`);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An error occurred during multi-image inspection. Please try again.');
      setScanning(false);
    }
  };

  // Run Demo Product via Backend API
  const runDemoProduct = async (demoId: string) => {
    setScanning(true);
    setScanStep(0);
    setError(null);

    try {
      for (let i = 0; i < 3; i++) {
        setScanStep(i);
        await new Promise((r) => setTimeout(r, 250));
      }

      const res = await fetch('/api/inspections/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demoProductId: demoId }),
      });
      if (!res.ok) throw new Error('Demo inspection failed on server');
      const detail = await res.json();

      setScanStep(4);
      await new Promise((r) => setTimeout(r, 250));
      setScanStep(5);

      const demoProduct = DEMO_PRODUCTS.find((p) => p.id === demoId);
      const legacyResult: AnalysisResult = {
        id: detail.id,
        timestamp: detail.created_at,
        productName: detail.product_name || demoProduct?.name || 'Demo Product',
        scanMode: 'demo',
        demoProductId: demoId,
        ocrResult: demoProduct ? demoProduct.ocrResult : {
          rawText: detail.raw_ocr_text || '',
          confidence: 0.95,
          extractedFields: detail.fields || {},
          imageQuality: 'Good',
          analysisTimeMs: 400,
          fieldsDetected: Object.keys(detail.fields || {}).length,
          totalFields: 10,
        },
        ruleResults: (detail.checks || []).map((c: any) => ({
          ruleId: c.rule_id,
          ruleName: c.rule_name,
          category: c.category,
          severity: c.severity,
          status: c.status,
          confidence: c.confidence,
          message: c.message,
          evidence: c.evidence,
          explanation: c.explanation,
          weight: c.max_score,
          scoreEarned: c.score_earned,
          maxScore: c.max_score,
        })),
        complianceScore: detail.compliance_score || 0,
        complianceStatus: detail.overall_status || 'NON-COMPLIANT',
        issuesCount: (detail.checks || []).filter((c: any) => c.status === 'FAIL').length,
        warningsCount: (detail.checks || []).filter((c: any) => c.status === 'WARNING').length,
        passedCount: (detail.checks || []).filter((c: any) => c.status === 'PASS').length,
        aiSummary: detail.ai_summary || '',
      };

      saveCurrentResult(legacyResult);
      saveToHistory(legacyResult);

      router.push(`/result?id=${detail.id}`);
    } catch (err: unknown) {
      console.error(err);
      setError('Demo failed. Please try again.');
      setScanning(false);
    }
  };

  // Run Listing Analysis via Backend API
  const runListingAnalysis = async () => {
    if (!listingText.trim()) {
      setError('Please paste a product listing or description to analyze.');
      return;
    }
    setScanning(true);
    setScanStep(0);
    setError(null);

    try {
      for (let i = 0; i < 3; i++) {
        setScanStep(i);
        await new Promise((r) => setTimeout(r, 200));
      }

      const res = await fetch('/api/inspections/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: listingText,
          title: listingTitle.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error('Listing inspection failed on server');
      const detail = await res.json();

      setScanStep(4);
      await new Promise((r) => setTimeout(r, 200));
      setScanStep(5);

      const legacyResult: AnalysisResult = {
        id: detail.id,
        timestamp: detail.created_at,
        productName: detail.product_name || 'E-Commerce Product Listing',
        scanMode: 'listing',
        ocrResult: {
          rawText: detail.raw_ocr_text || listingText,
          confidence: 0.9,
          extractedFields: detail.fields || {},
          imageQuality: 'Good',
          analysisTimeMs: 300,
          fieldsDetected: Object.keys(detail.fields || {}).length,
          totalFields: 10,
        },
        ruleResults: (detail.checks || []).map((c: any) => ({
          ruleId: c.rule_id,
          ruleName: c.rule_name,
          category: c.category,
          severity: c.severity,
          status: c.status,
          confidence: c.confidence,
          message: c.message,
          evidence: c.evidence,
          explanation: c.explanation,
          weight: c.max_score,
          scoreEarned: c.score_earned,
          maxScore: c.max_score,
        })),
        complianceScore: detail.compliance_score || 0,
        complianceStatus: detail.overall_status || 'NON-COMPLIANT',
        issuesCount: (detail.checks || []).filter((c: any) => c.status === 'FAIL').length,
        warningsCount: (detail.checks || []).filter((c: any) => c.status === 'WARNING').length,
        passedCount: (detail.checks || []).filter((c: any) => c.status === 'PASS').length,
        aiSummary: detail.ai_summary || '',
      };

      saveCurrentResult(legacyResult);
      saveToHistory(legacyResult);

      router.push(`/result?id=${detail.id}`);
    } catch (err: unknown) {
      console.error(err);
      setError('Analysis failed. Please try again.');
      setScanning(false);
    }
  };

  if (scanning) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center animate-fade-in">
        <div className="card p-10">
          <div className="w-16 h-16 rounded-full bg-blue-50 mx-auto mb-6 flex items-center justify-center">
            <FlaskConical className="h-8 w-8 text-blue-700 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Analyzing Packaged Commodity</h2>
          <p className="text-sm text-slate-500 mb-8">
            {selectedImages.length > 1
              ? `Inspecting ${selectedImages.length} packaging panels across front, back, and sides...`
              : 'Executing automated Legal Metrology compliance checks...'}
          </p>
          <div className="space-y-3 text-left mb-8">
            {SCAN_STEPS.map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                {i < scanStep ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                ) : i === scanStep ? (
                  <div className="h-5 w-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin flex-shrink-0" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-slate-200 flex-shrink-0" />
                )}
                <span className={clsx(
                  'text-sm',
                  i < scanStep ? 'text-slate-500 line-through' :
                    i === scanStep ? 'text-slate-900 font-medium step-active' : 'text-slate-400'
                )}>{step}</span>
              </div>
            ))}
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${((scanStep + 1) / SCAN_STEPS.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold mb-4">
          <Zap className="h-3.5 w-3.5" />
          Multi-Image Legal Metrology Compliance Scanner
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Scan Packaged Commodity</h1>
        <p className="text-slate-500 text-sm max-w-xl mx-auto">
          Upload 1 to 10 images covering front, back, MRP panel, and side declarations.
          The multi-panel engine aggregates and verifies all statutory declarations under Legal Metrology Rules, 2011.
        </p>
      </div>

      {/* Mode Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6 max-w-md mx-auto">
        <button
          onClick={() => setTab('image')}
          className={clsx(
            'flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all',
            tab === 'image' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          )}
        >
          <ImageIcon className="h-4 w-4" /> Package Images ({selectedImages.length})
        </button>
        <button
          onClick={() => setTab('listing')}
          className={clsx(
            'flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all',
            tab === 'listing' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          )}
        >
          <FileText className="h-4 w-4" /> E-Commerce Listing
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-6 animate-fade-in">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto"><X className="h-4 w-4 text-red-400" /></button>
        </div>
      )}

      {tab === 'image' ? (
        <div className="space-y-6">
          {/* Optional Product Name input */}
          <div className="card p-4">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Product / Commodity Title (Optional)
            </label>
            <input
              type="text"
              value={productNameInput}
              onChange={(e) => setProductNameInput(e.target.value)}
              placeholder="e.g., Premium Basmati Rice 5kg or Tata Salt (auto-detected if blank)"
              className="form-input text-sm"
            />
          </div>

          {/* Multi-Image Drag and Drop Area */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={clsx(
              'border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all',
              dragOver
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
            )}
          >
            <Upload className={clsx('h-10 w-10 mx-auto mb-3', dragOver ? 'text-blue-500' : 'text-slate-400')} />
            <p className="font-semibold text-slate-800 mb-1">
              Drag & drop package images (Front, Back, MRP panel, Side)
            </p>
            <p className="text-sm text-slate-500 mb-2">or click to browse from device</p>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-xs text-slate-600">
              <Layers className="h-3.5 w-3.5" /> Multi-Image inspection supported (1–10 images, max 20MB each)
            </div>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                addFiles(e.target.files);
                e.target.value = '';
              }
            }}
          />
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                addFiles(e.target.files);
                e.target.value = '';
              }
            }}
          />

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={() => fileRef.current?.click()} className="btn-secondary flex-1">
              <Plus className="h-4 w-4" /> Add Images
            </button>
            <button onClick={() => cameraRef.current?.click()} className="btn-secondary flex-1">
              <Camera className="h-4 w-4" /> Capture Photo
            </button>
          </div>

          {/* Selected Images Grid */}
          {selectedImages.length > 0 && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 text-sm">
                    Selected Package Panels ({selectedImages.length})
                  </span>
                  <span className="text-xs text-slate-400">
                    Label each panel for clearer evidence tracking
                  </span>
                </div>
                <button
                  onClick={() => setSelectedImages([])}
                  className="text-xs text-red-600 hover:underline"
                >
                  Clear all
                </button>
              </div>

              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {selectedImages.map((img, idx) => (
                  <div
                    key={img.id}
                    className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 relative group flex flex-col"
                  >
                    <div className="relative h-40 bg-slate-100 flex items-center justify-center overflow-hidden">
                      <img
                        src={img.previewUrl}
                        alt={img.label}
                        className="w-full h-full object-contain"
                      />
                      <button
                        onClick={() => removeImage(img.id)}
                        className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full shadow hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Remove image"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 text-white rounded text-[10px] font-mono">
                        #{idx + 1}
                      </span>
                    </div>
                    <div className="p-3 bg-white flex-1 flex flex-col justify-between">
                      <div className="mb-2">
                        <p className="text-xs font-medium text-slate-800 truncate" title={img.file.name}>
                          {img.file.name}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {(img.file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Tag className="h-3 w-3 text-slate-400 flex-shrink-0" />
                        <select
                          value={img.label}
                          onChange={(e) => updateLabel(img.id, e.target.value)}
                          className="text-xs bg-slate-50 border border-slate-200 rounded px-1.5 py-1 w-full text-slate-700 focus:outline-none focus:border-blue-500"
                        >
                          {PANEL_LABELS.map((label) => (
                            <option key={label} value={label}>{label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Inspection CTA Button */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Ready to run 8 statutory Legal Metrology compliance checks.</span>
                </div>
                <button
                  onClick={runMultiImageAnalysis}
                  className="btn-primary w-full sm:w-auto px-6 py-3 text-sm font-semibold shadow-md flex items-center justify-center gap-2"
                >
                  Start Inspection ({selectedImages.length} {selectedImages.length === 1 ? 'image' : 'images'})
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Demo Products Section */}
          <div className="mt-10">
            <p className="section-heading mb-3">Or Try Pre-Loaded Demo Scenarios</p>
            <div className="grid sm:grid-cols-3 gap-3">
              {DEMO_PRODUCTS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => runDemoProduct(p.id)}
                  className={clsx(
                    'text-left p-4 rounded-xl border-2 transition-all hover:-translate-y-0.5 hover:shadow-md',
                    p.expectedStatus === 'COMPLIANT'
                      ? 'border-green-200 bg-green-50 hover:border-green-300'
                      : p.expectedStatus === 'WARNING'
                      ? 'border-amber-200 bg-amber-50 hover:border-amber-300'
                      : 'border-red-200 bg-red-50 hover:border-red-300'
                  )}
                >
                  <span className={clsx(
                    'text-xs font-bold uppercase tracking-wide block mb-1',
                    p.expectedStatus === 'COMPLIANT' ? 'text-green-600' :
                      p.expectedStatus === 'WARNING' ? 'text-amber-600' : 'text-red-600'
                  )}>
                    {p.expectedStatus === 'COMPLIANT' ? '✓' : p.expectedStatus === 'WARNING' ? '⚠' : '✕'}{' '}{p.expectedStatus}
                  </span>
                  <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{p.category}</p>
                  <p className="text-xs font-bold mt-2 text-slate-700">Expected Score: {p.expectedScore}/100</p>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 text-center mt-3">
              Deterministic verification scenarios demonstrating Compliant, Warning, and Non-Compliant classifications.
            </p>
          </div>

          {/* Compliance & Scanning Guidelines */}
          <div className="card p-5">
            <p className="section-heading mb-3">Multi-Image Inspection Recommendations</p>
            <ul className="space-y-2 text-sm text-slate-600">
              {[
                'Capture Front Face: For product identity, brand name, and net quantity.',
                'Capture Back/Side Face: For manufacturer address, customer care, and FSSAI details.',
                'Capture MRP/Batch Panel: For price inclusive of all taxes, MFD/PKD, and batch code.',
                'Good illumination and glare reduction ensure high OCR extraction accuracy.',
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="card p-6">
          <h2 className="font-semibold text-slate-900 mb-1">E-Commerce Listing Compliance Analysis</h2>
          <p className="text-sm text-slate-500 mb-4">
            Verify whether an online marketplace listing provides all mandatory declarations required under Rule 6 of Legal Metrology (Packaged Commodities) Rules, 2011.
          </p>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
              Listing Title
            </label>
            <input
              type="text"
              value={listingTitle}
              onChange={(e) => setListingTitle(e.target.value)}
              placeholder="e.g. Organic Rolled Oats 1kg"
              className="form-input text-sm"
            />
          </div>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
              Listing Description / Technical Specifications
            </label>
            <textarea
              value={listingText}
              onChange={(e) => setListingText(e.target.value)}
              className="form-input min-h-[220px] resize-y font-mono text-xs"
              placeholder={`Paste product listing description here...\n\nExample:\nProduct: Premium Basmati Rice 5kg\nManufacturer: ABC Foods Pvt. Ltd., New Delhi - 110001\nMRP: Rs. 650/- (Inclusive of all taxes)\nNet Qty: 5 kg\nPacked: 08/2026\nConsumer Care: 1800-111-2222 | care@abcfoods.in\nCountry of Origin: India`}
            />
          </div>
          <div className="flex gap-3">
            <button onClick={runListingAnalysis} className="btn-primary">
              Analyze Listing <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => { setListingText(''); setListingTitle(''); }}
              className="btn-secondary"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Footer disclaimer */}
      <p className="text-center text-xs text-slate-400 mt-6">
        🔒 All files and inspection data are stored in a local SQLite database for this prototype.
      </p>
    </div>
  );
}
