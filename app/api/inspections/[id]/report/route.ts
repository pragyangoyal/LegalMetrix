import { NextRequest, NextResponse } from 'next/server';
import { getInspectionDetail } from '@/lib/server/inspectionService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const detail = getInspectionDetail(id);
    if (!detail) {
      return NextResponse.json({ error: 'Inspection not found' }, { status: 404 });
    }

    const passedChecks = detail.checks.filter((c) => c.status === 'PASS');
    const warningChecks = detail.checks.filter((c) => c.status === 'WARNING');
    const failedChecks = detail.checks.filter((c) => c.status === 'FAIL');

    const report = {
      inspectionId: detail.id,
      generatedAt: new Date().toISOString(),
      inspectionDate: detail.created_at,
      productName: detail.product_name || 'Packaged Commodity',
      scanMode: detail.scan_mode,
      overallStatus: detail.overall_status,
      complianceScore: detail.compliance_score,
      processingTimeMs: detail.processing_time_ms,
      imagesCount: detail.images_count,
      imagesAnalyzed: detail.images_analyzed,
      aiSummary: detail.ai_summary,
      rawOcrText: detail.raw_ocr_text,
      fields: detail.fields,
      fieldRecords: detail.fieldRecords,
      images: detail.images,
      stats: {
        totalRules: detail.checks.length,
        passedCount: passedChecks.length,
        warningCount: warningChecks.length,
        failedCount: failedChecks.length,
      },
      checks: {
        passed: passedChecks,
        warning: warningChecks,
        failed: failedChecks,
        all: detail.checks,
      },
    };

    return NextResponse.json(report);
  } catch (error: unknown) {
    console.error('Error generating inspection report:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
