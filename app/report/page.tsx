'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2, XCircle, AlertTriangle, Printer, ArrowLeft, ScanLine,
  Layers, ShieldCheck, FileCheck
} from 'lucide-react';
import { AnalysisResult, RuleResult, ComplianceStatus } from '@/types';
import { getCurrentResult } from '@/services/historyService';
import clsx from 'clsx';

function StatusLabel({ status }: { status: string }) {
  if (status === 'COMPLIANT') return <span className="text-green-700 font-bold">COMPLIANT</span>;
  if (status === 'WARNING') return <span className="text-amber-700 font-bold">POTENTIAL WARNING</span>;
  return <span className="text-red-700 font-bold">POTENTIAL NON-COMPLIANCE</span>;
}

interface ReportData {
  inspectionId: string;
  generatedAt: string;
  inspectionDate: string;
  productName: string;
  scanMode: string;
  overallStatus: ComplianceStatus;
  complianceScore: number;
  processingTimeMs: number;
  imagesCount: number;
  imagesAnalyzed: number;
  aiSummary: string;
  rawOcrText: string;
  fields: Record<string, string>;
  images?: Array<{ id: string; url: string; label?: string; filename: string }>;
  stats: {
    totalRules: number;
    passedCount: number;
    warningCount: number;
    failedCount: number;
  };
  checks: {
    passed: any[];
    warning: any[];
    failed: any[];
    all: any[];
  };
}

function ReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inspectionId = searchParams.get('id');

  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      if (inspectionId) {
        try {
          const res = await fetch(`/api/inspections/${inspectionId}/report`);
          if (res.ok) {
            const data: ReportData = await res.json();
            setReport(data);
            setLoading(false);
            return;
          } else if (res.status === 404) {
            setNotFound(true);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error('Error fetching report:', e);
        }
      }

      // Fallback to session storage only if no inspectionId was specified
      const r = getCurrentResult();
      if (!r) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const checks = r.ruleResults || [];
      const passedChecks = checks.filter((c) => c.status === 'PASS');
      const warningChecks = checks.filter((c) => c.status === 'WARNING');
      const failedChecks = checks.filter((c) => c.status === 'FAIL');

      const legacyReport: ReportData = {
        inspectionId: r.id,
        generatedAt: new Date().toISOString(),
        inspectionDate: r.timestamp,
        productName: r.productName,
        scanMode: r.scanMode,
        overallStatus: r.complianceStatus,
        complianceScore: r.complianceScore,
        processingTimeMs: r.ocrResult.analysisTimeMs,
        imagesCount: r.imageDataUrl ? 1 : 0,
        imagesAnalyzed: r.imageDataUrl ? 1 : 0,
        aiSummary: r.aiSummary,
        rawOcrText: r.ocrResult.rawText,
        fields: r.ocrResult.extractedFields as Record<string, string>,
        images: r.imageDataUrl ? [{ id: '1', url: r.imageDataUrl, filename: 'primary_image.jpg', label: 'Primary Panel' }] : [],
        stats: {
          totalRules: checks.length,
          passedCount: passedChecks.length,
          warningCount: warningChecks.length,
          failedCount: failedChecks.length,
        },
        checks: {
          passed: passedChecks,
          warning: warningChecks,
          failed: failedChecks,
          all: checks,
        },
      };

      setReport(legacyReport);
      setLoading(false);
    }

    load();
  }, [inspectionId, router]);

  if (notFound || (!loading && !report)) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="card p-10">
          <div className="w-16 h-16 rounded-full bg-slate-100 mx-auto mb-4 flex items-center justify-center">
            <ScanLine className="h-8 w-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Inspection Report Not Found</h2>
          <p className="text-sm text-slate-500 mb-6">
            The requested inspection report was not found. Please start a new scan to generate a statutory assessment report.
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

  if (loading || !report) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <ScanLine className="h-12 w-12 mx-auto text-blue-500 animate-pulse mb-4" />
        <p className="text-slate-500 font-medium">Generating official inspection report...</p>
      </div>
    );
  }

  const { fields, stats, checks } = report;

  const FIELD_ROWS: { key: string; label: string; rule: string }[] = [
    { key: 'productName', label: 'Product Name / Identity', rule: 'Rule 6(1)(a)' },
    { key: 'manufacturer', label: 'Manufacturer Name', rule: 'Rule 6(1)(a)' },
    { key: 'manufacturerAddress', label: 'Registered Office Address', rule: 'Rule 6(1)(a)' },
    { key: 'packer', label: 'Packer Name (if applicable)', rule: 'Rule 6(1)(a)' },
    { key: 'importer', label: 'Importer Name (if applicable)', rule: 'Rule 6(1)(a)' },
    { key: 'netQuantity', label: 'Net Quantity (Metric Units)', rule: 'Rule 6(1)(b)' },
    { key: 'mrp', label: 'MRP (Inclusive of all taxes)', rule: 'Rule 6(1)(f)' },
    { key: 'manufacturingDate', label: 'Month & Year of Manufacture', rule: 'Rule 6(1)(d)' },
    { key: 'packingDate', label: 'Month & Year of Packing', rule: 'Rule 6(1)(d)' },
    { key: 'importDate', label: 'Import Date (if applicable)', rule: 'Rule 6(1)(d)' },
    { key: 'expiryDate', label: 'Best Before / Expiry Date', rule: 'Rule 6(1)(d)' },
    { key: 'consumerCareNumber', label: 'Consumer Helpline Telephone', rule: 'Rule 6(1)(g)' },
    { key: 'consumerCareEmail', label: 'Consumer Care Email Address', rule: 'Rule 6(1)(g)' },
    { key: 'countryOfOrigin', label: 'Country of Origin', rule: 'Rule 6(10)' },
    { key: 'fssaiLicense', label: 'FSSAI License No.', rule: 'FSS Act 2006' },
    { key: 'batchNumber', label: 'Batch / Lot Code', rule: 'Rule 6(1)(e)' },
  ];

  const inspDate = new Date(report.inspectionDate).toLocaleString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <>
      {/* Print Toolbar */}
      <div className="no-print bg-slate-900 text-white py-3 px-4 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <Link href={`/result?id=${report.inspectionId}`} className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back to Assessment
          </Link>
          <span className="text-slate-600">|</span>
          <span className="text-sm text-slate-300">
            Official Report · {report.productName} ({report.inspectionId})
          </span>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow"
        >
          <Printer className="h-4 w-4" />
          Print / Save as PDF
        </button>
      </div>

      {/* Printable Report Document */}
      <div className="max-w-4xl mx-auto px-6 py-8 print-full animate-fade-in bg-white">
        {/* Report Header */}
        <div className="border-b-2 border-blue-900 pb-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center">
                  <ShieldCheck className="text-white h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-blue-900 uppercase tracking-widest">
                    Government of India · Ministry of Consumer Affairs
                  </p>
                  <p className="text-xs text-slate-600">Department of Consumer Affairs (Legal Metrology Division)</p>
                </div>
              </div>
              <h1 className="text-xl font-bold text-slate-900 mt-2">
                Statutory Packaged Commodity Inspection Report
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluation under Legal Metrology (Packaged Commodities) Rules, 2011 &amp; Legal Metrology Act, 2009
              </p>
            </div>
            <div className="text-right text-xs text-slate-500">
              <p className="font-semibold text-slate-700 mb-1">Inspection Reference</p>
              <p className="font-mono text-slate-900 font-bold">{report.inspectionId}</p>
              <p className="mt-2 font-semibold text-slate-700">Verification Date</p>
              <p>{inspDate}</p>
            </div>
          </div>
        </div>

        {/* Commodity & Overall Assessment Summary */}
        <div className="grid sm:grid-cols-2 gap-6 mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Packaged Commodity</p>
            <p className="text-lg font-bold text-slate-900">{report.productName}</p>
            <p className="text-xs text-slate-500 mt-1">
              Mode: <span className="font-medium text-slate-700 capitalize">{report.scanMode}</span>
              {report.images && report.images.length > 0 && ` (${report.images.length} packaging panels scanned)`}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Overall Statutory Classification</p>
            <div className={clsx(
              'inline-block px-3 py-1.5 rounded-lg border font-bold text-sm',
              report.overallStatus === 'COMPLIANT' ? 'bg-green-50 border-green-200 text-green-800' :
                report.overallStatus === 'WARNING' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-red-50 border-red-200 text-red-800'
            )}>
              <StatusLabel status={report.overallStatus} />
            </div>
            <p className="text-xs text-slate-600 mt-2">
              Compliance Index Score: <strong>{report.complianceScore}/100</strong>
            </p>
          </div>
        </div>

        {/* Rule Summary Statistics Pills */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl p-3 border text-center bg-green-50 border-green-200">
            <div className="flex justify-center mb-1">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.passedCount}</p>
            <p className="text-xs text-slate-500 mt-0.5">Rules Complied</p>
          </div>
          <div className="rounded-xl p-3 border text-center bg-amber-50 border-amber-200">
            <div className="flex justify-center mb-1">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.warningCount}</p>
            <p className="text-xs text-slate-500 mt-0.5">Warnings / Deficiencies</p>
          </div>
          <div className="rounded-xl p-3 border text-center bg-red-50 border-red-200">
            <div className="flex justify-center mb-1">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.failedCount}</p>
            <p className="text-xs text-slate-500 mt-0.5">Missing Mandatory Declarations</p>
          </div>
        </div>

        {/* Multi-Panel Evidence Gallery (if images present) */}
        {report.images && report.images.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 border-b border-slate-200 pb-2 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-blue-700" /> Captured Packaging Panel Evidence
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {report.images.map((img, idx) => (
                <div key={img.id} className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                  <div className="h-28 bg-slate-100 flex items-center justify-center overflow-hidden">
                    <img src={img.url} alt={img.label || `Panel ${idx + 1}`} className="w-full h-full object-contain" />
                  </div>
                  <div className="p-2 text-[11px] bg-white border-t border-slate-100">
                    <p className="font-semibold text-slate-800 truncate">{img.label || `Panel #${idx + 1}`}</p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">{img.filename}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mandatory Declarations Table */}
        <div className="mb-6">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 border-b border-slate-200 pb-2">
            Section 1: Mandatory Label Declarations (Rule 6, PCR 2011)
          </h2>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700">
                <th className="text-left p-2.5 border border-slate-200 uppercase w-1/3">Statutory Declaration</th>
                <th className="text-left p-2.5 border border-slate-200 uppercase w-1/2">Detected Value / Evidence</th>
                <th className="text-left p-2.5 border border-slate-200 uppercase">Verification Status</th>
              </tr>
            </thead>
            <tbody>
              {FIELD_ROWS.map(({ key, label, rule }) => {
                const value = fields[key];
                const hasValue = value && value.trim().length > 0;
                return (
                  <tr key={key} className="border-b border-slate-100">
                    <td className="p-2.5 border border-slate-200 text-slate-700">
                      <div className="font-medium text-slate-900">{label}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{rule}</div>
                    </td>
                    <td className="p-2.5 border border-slate-200 text-slate-800 font-mono break-words">
                      {hasValue ? value : <span className="text-slate-400 italic">Not detected on package faces</span>}
                    </td>
                    <td className="p-2.5 border border-slate-200">
                      {hasValue ? (
                        <span className="text-green-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Declared
                        </span>
                      ) : (
                        <span className="text-red-600 font-semibold flex items-center gap-1">
                          <XCircle className="h-3 w-3" /> Undetected
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Compliance Checks Results */}
        <div className="mb-6">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 border-b border-slate-200 pb-2">
            Section 2: Rule-by-Rule Compliance Findings
          </h2>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700">
                <th className="text-left p-2.5 border border-slate-200 uppercase w-12">Rule ID</th>
                <th className="text-left p-2.5 border border-slate-200 uppercase">Requirement</th>
                <th className="text-left p-2.5 border border-slate-200 uppercase">System Assessment Finding</th>
                <th className="text-center p-2.5 border border-slate-200 uppercase w-16">Score</th>
                <th className="text-left p-2.5 border border-slate-200 uppercase w-20">Result</th>
              </tr>
            </thead>
            <tbody>
              {checks.all.map((c: any) => (
                <tr key={c.rule_id || c.ruleId} className={clsx(
                  'border-b border-slate-100',
                  c.status === 'FAIL' ? 'bg-red-50/40' : c.status === 'WARNING' ? 'bg-amber-50/40' : ''
                )}>
                  <td className="p-2.5 border border-slate-200 text-[11px] font-mono text-slate-500">
                    {c.rule_id || c.ruleId}
                  </td>
                  <td className="p-2.5 border border-slate-200 font-medium text-slate-800">
                    {c.rule_name || c.ruleName}
                  </td>
                  <td className="p-2.5 border border-slate-200 text-slate-600">
                    {c.message}
                  </td>
                  <td className="p-2.5 border border-slate-200 text-center font-semibold">
                    {c.score_earned ?? c.scoreEarned}/{c.max_score ?? c.maxScore}
                  </td>
                  <td className="p-2.5 border border-slate-200 font-bold">
                    {c.status === 'PASS' ? (
                      <span className="text-green-700">PASS</span>
                    ) : c.status === 'WARNING' ? (
                      <span className="text-amber-700">WARNING</span>
                    ) : (
                      <span className="text-red-700">FAIL</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* AI Statutory Analysis Explanation */}
        <div className="mb-6 p-4 bg-blue-50/60 border border-blue-200 rounded-xl">
          <p className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">
            Section 3: Automated Statutory Compliance Analysis
          </p>
          <p className="text-xs text-slate-800 leading-relaxed">
            {report.aiSummary}
          </p>
        </div>

        {/* Official Officer Sign-off Block */}
        <div className="mt-8 pt-6 border-t-2 border-slate-300">
          <div className="grid grid-cols-2 gap-8 text-xs">
            <div>
              <p className="font-bold text-slate-900 mb-1">Inspected &amp; Audited By:</p>
              <p className="text-slate-600">Legal Metrology Automated Inspector (LegalMetrix)</p>
              <p className="text-slate-400 text-[11px] mt-2">Processing Time: {report.processingTimeMs} ms</p>
              <p className="text-slate-400 text-[11px]">System: SIH 2026 Problem ID: 26034</p>
            </div>
            <div className="text-right flex flex-col justify-between">
              <div>
                <p className="font-bold text-slate-900 mb-1">Authorized Officer Sign-off:</p>
                <div className="h-14 border-b border-dashed border-slate-400 mt-2"></div>
                <p className="text-slate-500 text-[11px] mt-1">Signature, Seal &amp; Verification Date</p>
              </div>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="mt-8 pt-4 border-t border-slate-200 text-[10px] text-slate-400 text-center leading-relaxed">
          Statutory Disclaimer: This automated inspection report is generated for preliminary statutory screening under the Legal Metrology (Packaged Commodities) Rules, 2011. Final enforcement action requires physical inspection and confirmation by an authorized Legal Metrology Officer.
        </div>
      </div>
    </>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <ScanLine className="h-12 w-12 mx-auto text-blue-500 animate-pulse mb-4" />
        <p className="text-slate-500 font-medium">Loading report...</p>
      </div>
    }>
      <ReportContent />
    </Suspense>
  );
}
