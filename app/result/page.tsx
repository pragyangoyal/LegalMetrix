'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp,
  FileText, ArrowLeft, Info, Cpu, Clock, Eye, BarChart3, ScanLine,
  Layers, Copy, Check, ExternalLink, ShieldCheck
} from 'lucide-react';
import { AnalysisResult, RuleResult, ComplianceStatus } from '@/types';
import { getCurrentResult } from '@/services/historyService';
import clsx from 'clsx';

function StatusHeader({ status, score, issues, warnings, passed }: {
  status: ComplianceStatus; score: number; issues: number; warnings: number; passed: number;
}) {
  const config = {
    COMPLIANT: {
      bg: 'bg-green-50 border-green-200',
      icon: <CheckCircle2 className="h-8 w-8 text-green-600" />,
      label: 'Compliant',
      labelClass: 'text-green-700 bg-green-100',
      scoreColor: 'text-green-600',
      ring: 'stroke-green-500',
    },
    WARNING: {
      bg: 'bg-amber-50 border-amber-200',
      icon: <AlertTriangle className="h-8 w-8 text-amber-600" />,
      label: 'Potential Warning',
      labelClass: 'text-amber-700 bg-amber-100',
      scoreColor: 'text-amber-600',
      ring: 'stroke-amber-500',
    },
    'NON-COMPLIANT': {
      bg: 'bg-red-50 border-red-200',
      icon: <XCircle className="h-8 w-8 text-red-600" />,
      label: 'Potential Non-Compliance',
      labelClass: 'text-red-700 bg-red-100',
      scoreColor: 'text-red-600',
      ring: 'stroke-red-500',
    },
  }[status] || {
    bg: 'bg-slate-50 border-slate-200',
    icon: <AlertTriangle className="h-8 w-8 text-slate-600" />,
    label: 'Under Review',
    labelClass: 'text-slate-700 bg-slate-100',
    scoreColor: 'text-slate-600',
    ring: 'stroke-slate-500',
  };

  const radius = 42;
  const circ = 2 * Math.PI * radius;
  const dash = (score / 100) * circ;

  return (
    <div className={clsx('rounded-2xl border p-6', config.bg)}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        {/* Score ring */}
        <div className="flex-shrink-0 flex flex-col items-center gap-2">
          <svg width="110" height="110" viewBox="0 0 110 110">
            <circle cx="55" cy="55" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="8" />
            <circle
              cx="55" cy="55" r={radius} fill="none"
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={circ / 4}
              className={config.ring}
              style={{ transition: 'stroke-dasharray 1s ease' }}
            />
            <text x="55" y="51" textAnchor="middle" className={clsx('font-bold', config.scoreColor)} fontSize="20" fill="currentColor" fontFamily="Inter, sans-serif" fontWeight="800">
              {score}
            </text>
            <text x="55" y="66" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="Inter, sans-serif">
              / 100
            </text>
          </svg>
          <span className="text-xs text-slate-500 font-medium">Compliance Score</span>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            {config.icon}
            <span className={clsx('text-lg font-bold px-3 py-1 rounded-full', config.labelClass)}>
              {config.label}
            </span>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="font-semibold text-green-700">{passed}</span>
              <span className="text-slate-500">Passed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="font-semibold text-amber-700">{warnings}</span>
              <span className="text-slate-500">Warnings</span>
            </div>
            <div className="flex items-center gap-1.5">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="font-semibold text-red-700">{issues}</span>
              <span className="text-slate-500">Issues</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Automated statutory assessment under Legal Metrology (Packaged Commodities) Rules, 2011.
          </p>
        </div>
      </div>
    </div>
  );
}

function RuleCard({ rule }: { rule: RuleResult }) {
  const [expanded, setExpanded] = useState(rule.status !== 'PASS');

  return (
    <div
      className={clsx(
        'rounded-xl border transition-all overflow-hidden',
        rule.status === 'PASS' ? 'border-green-200 bg-green-50/50' :
          rule.status === 'WARNING' ? 'border-amber-200 bg-amber-50/50' : 'border-red-200 bg-red-50/50'
      )}
    >
      <button
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-black/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {rule.status === 'PASS'
          ? <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
          : rule.status === 'WARNING'
          ? <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          : <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-900 text-sm">{rule.ruleName}</span>
            <span className="text-xs text-slate-400">{rule.ruleId}</span>
            <span className={clsx(
              'text-xs px-2 py-0.5 rounded-full font-medium ml-auto',
              rule.status === 'PASS' ? 'bg-green-100 text-green-700' :
                rule.status === 'WARNING' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
            )}>
              {rule.status === 'PASS' ? `+${rule.scoreEarned}/${rule.maxScore}` :
                rule.status === 'WARNING' ? `+${rule.scoreEarned}/${rule.maxScore}` : `0/${rule.maxScore}`}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 truncate">{rule.message}</p>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-2 animate-fade-in">
          <div className="h-px bg-slate-100" />
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Assessment Rationale</p>
              <p className="text-sm text-slate-700">{rule.explanation}</p>
            </div>
            {rule.evidence && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Detected Statutory Evidence</p>
                <p className="text-sm text-slate-700 font-mono bg-slate-100 px-2 py-1 rounded break-words">{rule.evidence}</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
            <span>Confidence: {Math.round(rule.confidence * 100)}%</span>
            <span>·</span>
            <span>Category: {rule.category}</span>
            <span>·</span>
            <span>Severity: {rule.severity}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inspectionId = searchParams.get('id');

  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [serverImages, setServerImages] = useState<Array<{ id: string; url: string; label?: string; filename: string }>>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showRawText, setShowRawText] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (inspectionId) {
        try {
          const res = await fetch(`/api/inspections/${inspectionId}`);
          if (res.ok) {
            const detail = await res.json();
            const checks = detail.checks || [];

            const converted: AnalysisResult = {
              id: detail.id,
              timestamp: detail.created_at,
              productName: detail.product_name || 'Packaged Commodity',
              imageDataUrl: detail.images?.[0]?.url || undefined,
              scanMode: detail.scan_mode,
              demoProductId: detail.demo_product_id,
              ocrResult: {
                rawText: detail.raw_ocr_text || '',
                confidence: checks[0]?.confidence || 0.9,
                extractedFields: detail.fields || {},
                imageQuality: 'Good',
                analysisTimeMs: detail.processing_time_ms || 800,
                fieldsDetected: Object.keys(detail.fields || {}).length,
                totalFields: 10,
              },
              ruleResults: checks.map((c: any) => ({
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
              issuesCount: checks.filter((c: any) => c.status === 'FAIL').length,
              warningsCount: checks.filter((c: any) => c.status === 'WARNING').length,
              passedCount: checks.filter((c: any) => c.status === 'PASS').length,
              aiSummary: detail.ai_summary || '',
            };

            setResult(converted);
            if (detail.images && detail.images.length > 0) {
              setServerImages(detail.images);
            }
            setLoading(false);
            return;
          } else if (res.status === 404) {
            setNotFound(true);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error('Failed to load inspection from API:', e);
        }
      }

      // If no ID was in query params, fallback to session storage
      const r = getCurrentResult();
      if (!r) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setResult(r);
      setLoading(false);
    }

    loadData();
  }, [inspectionId, router]);

  const copyOcrText = () => {
    if (!result?.ocrResult.rawText) return;
    navigator.clipboard.writeText(result.ocrResult.rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (notFound || (!loading && !result)) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="card p-10">
          <div className="w-16 h-16 rounded-full bg-slate-100 mx-auto mb-4 flex items-center justify-center">
            <ScanLine className="h-8 w-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Inspection Record Not Found</h2>
          <p className="text-sm text-slate-500 mb-6">
            The requested inspection session was not found. Please scan a product label to view its statutory compliance assessment.
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/scan" className="btn-primary">
              <ScanLine className="h-4 w-4" /> Start New Scan
            </Link>
            <Link href="/history" className="btn-secondary">
              View History
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !result) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <ScanLine className="h-12 w-12 mx-auto text-blue-500 animate-pulse mb-4" />
        <p className="text-slate-600 font-medium">Loading inspection analysis...</p>
      </div>
    );
  }

  const { ocrResult, ruleResults, complianceScore, complianceStatus } = result;
  const fields = ocrResult.extractedFields;
  const failed = ruleResults.filter((r) => r.status === 'FAIL');
  const warned = ruleResults.filter((r) => r.status === 'WARNING');
  const passed = ruleResults.filter((r) => r.status === 'PASS');

  const FIELD_LABELS: { key: keyof typeof fields; label: string; ruleRef: string }[] = [
    { key: 'productName', label: 'Product / Commodity Identity', ruleRef: 'Rule 6(1)(a)' },
    { key: 'manufacturer', label: 'Manufacturer Name', ruleRef: 'Rule 6(1)(a)' },
    { key: 'manufacturerAddress', label: 'Complete Registered Address', ruleRef: 'Rule 6(1)(a)' },
    { key: 'packer', label: 'Packer Name', ruleRef: 'Rule 6(1)(a)' },
    { key: 'importer', label: 'Importer Name', ruleRef: 'Rule 6(1)(a)' },
    { key: 'netQuantity', label: 'Net Quantity', ruleRef: 'Rule 6(1)(b)' },
    { key: 'mrp', label: 'MRP (Incl. of all taxes)', ruleRef: 'Rule 6(1)(f)' },
    { key: 'manufacturingDate', label: 'Manufacturing Date', ruleRef: 'Rule 6(1)(d)' },
    { key: 'packingDate', label: 'Packing Date', ruleRef: 'Rule 6(1)(d)' },
    { key: 'consumerCareNumber', label: 'Consumer Helpline No.', ruleRef: 'Rule 6(1)(g)' },
    { key: 'consumerCareEmail', label: 'Consumer Email', ruleRef: 'Rule 6(1)(g)' },
    { key: 'countryOfOrigin', label: 'Country of Origin', ruleRef: 'Rule 6(10)' },
    { key: 'fssaiLicense', label: 'FSSAI License No.', ruleRef: 'FSSAI Rules' },
    { key: 'batchNumber', label: 'Batch / Lot Code', ruleRef: 'Rule 6(1)(e)' },
  ];

  const detectedFields = FIELD_LABELS.filter((f) => fields[f.key]);
  const activeImg = serverImages[activeImageIndex]?.url || result.imageDataUrl;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Breadcrumb & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-slate-900">Dashboard</Link>
          <span>/</span>
          <Link href="/scan" className="hover:text-slate-900">Scan</Link>
          <span>/</span>
          <span className="text-slate-900 font-medium">Inspection Result</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/report?id=${result.id}`}
            className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5"
          >
            <FileText className="h-3.5 w-3.5" /> View Official Report
          </Link>
          <Link
            href="/scan"
            className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5"
          >
            <ScanLine className="h-3.5 w-3.5" /> New Scan
          </Link>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left Column: Image Gallery & Session Intel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Packaging Images Gallery */}
          <div className="card overflow-hidden">
            {activeImg ? (
              <div className="relative bg-slate-900 flex items-center justify-center min-h-64 max-h-80 overflow-hidden">
                <img
                  src={activeImg}
                  alt={result.productName}
                  className="w-full h-full object-contain"
                />
                {serverImages[activeImageIndex]?.label && (
                  <span className="absolute top-3 left-3 px-2.5 py-1 bg-black/70 text-white rounded-md text-xs font-medium">
                    {serverImages[activeImageIndex].label}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-52 bg-slate-50 text-slate-400">
                <Eye className="h-10 w-10 mb-2 opacity-40" />
                <p className="text-sm font-medium">
                  {result.scanMode === 'demo' ? 'Pre-loaded Demo Inspection' : 'Listing Text Inspection'}
                </p>
                {result.demoProductId && (
                  <span className="mt-2 text-xs font-semibold text-violet-600 bg-violet-50 px-2.5 py-1 rounded">
                    DEMO DATA
                  </span>
                )}
              </div>
            )}

            {/* Thumbnail Strip (if multiple images uploaded) */}
            {serverImages.length > 1 && (
              <div className="p-3 bg-slate-100 border-t border-slate-200">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Layers className="h-3 w-3" /> Inspected Packaging Panels ({serverImages.length})
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {serverImages.map((img, idx) => (
                    <button
                      key={img.id}
                      onClick={() => setActiveImageIndex(idx)}
                      className={clsx(
                        'relative flex-shrink-0 w-16 h-16 rounded-lg border-2 overflow-hidden transition-all',
                        idx === activeImageIndex
                          ? 'border-blue-600 ring-2 ring-blue-300'
                          : 'border-slate-300 hover:border-slate-400 opacity-70 hover:opacity-100'
                      )}
                    >
                      <img src={img.url} alt={img.label || `Image ${idx + 1}`} className="w-full h-full object-cover" />
                      <span className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-[9px] text-center truncate px-0.5">
                        #{idx + 1}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4">
              <p className="font-semibold text-slate-900 text-base">{result.productName}</p>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                <span>ID: {result.id}</span>
                <span>•</span>
                <span>Mode: {result.scanMode.toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* Inspection Metadata Card */}
          <div className="card p-4 space-y-3">
            <p className="section-heading">Inspection Intelligence</p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <p className="text-slate-400 mb-0.5">Panels Inspected</p>
                <p className="font-semibold text-slate-800 flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5 text-blue-600" />
                  {serverImages.length > 0 ? `${serverImages.length} Panels` : '1 Document'}
                </p>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <p className="text-slate-400 mb-0.5">Processing Time</p>
                <p className="font-semibold text-slate-800 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-blue-600" />
                  {ocrResult.analysisTimeMs} ms
                </p>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <p className="text-slate-400 mb-0.5">Declarations Detected</p>
                <p className="font-semibold text-slate-800 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                  {detectedFields.length} Mandatory Fields
                </p>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <p className="text-slate-400 mb-0.5">Legal Metrology Basis</p>
                <p className="font-semibold text-slate-800 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                  PCR 2011 Rules
                </p>
              </div>
            </div>
          </div>

          {/* Extracted Statutory Declarations Summary */}
          <div className="card p-4">
            <p className="section-heading mb-3">Extracted Statutory Declarations</p>
            {detectedFields.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No statutory declarations were clearly identified.</p>
            ) : (
              <div className="space-y-2.5 text-xs">
                {detectedFields.map((f) => (
                  <div key={f.key} className="flex flex-col border-b border-slate-100 pb-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700">{f.label}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{f.ruleRef}</span>
                    </div>
                    <span className="text-slate-900 font-medium mt-0.5 break-words bg-slate-50 px-2 py-1 rounded">
                      {fields[f.key]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Score, Summary, and 8 Compliance Rules */}
        <div className="lg:col-span-3 space-y-6">
          {/* Status Header */}
          <StatusHeader
            status={complianceStatus}
            score={complianceScore}
            issues={result.issuesCount}
            warnings={result.warningsCount}
            passed={result.passedCount}
          />

          {/* AI Executive Assessment Banner */}
          <div className="card p-5 bg-gradient-to-br from-blue-50/50 to-white border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="h-4 w-4 text-blue-700" />
              <p className="font-semibold text-slate-900 text-sm">Automated Legal Assessment</p>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">{result.aiSummary}</p>
          </div>

          {/* Compliance Checklist Rules */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-slate-900 text-base">Legal Metrology Compliance Checks</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  8 statutory checks evaluated under the Packaged Commodities Rules, 2011
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full">
                {passed.length}/8 Passed
              </span>
            </div>

            <div className="space-y-3">
              {ruleResults.map((rule) => (
                <RuleCard key={rule.ruleId} rule={rule} />
              ))}
            </div>
          </div>

          {/* OCR Raw Text Accordion */}
          <div className="card overflow-hidden">
            <button
              onClick={() => setShowRawText(!showRawText)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-semibold text-slate-800">Raw OCR Extracted Text</span>
                <span className="text-xs text-slate-400">({ocrResult.rawText.length} characters)</span>
              </div>
              {showRawText ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
            </button>
            {showRawText && (
              <div className="p-4 bg-slate-900 text-slate-200 border-t border-slate-800 animate-fade-in">
                <div className="flex justify-end mb-2">
                  <button
                    onClick={copyOcrText}
                    className="text-xs flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Copied' : 'Copy Text'}
                  </button>
                </div>
                <pre className="text-xs font-mono whitespace-pre-wrap max-h-72 overflow-y-auto leading-relaxed">
                  {ocrResult.rawText || 'No text extracted.'}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <ScanLine className="h-12 w-12 mx-auto text-blue-500 animate-pulse mb-4" />
        <p className="text-slate-600 font-medium">Loading inspection...</p>
      </div>
    }>
      <ResultContent />
    </Suspense>
  );
}
