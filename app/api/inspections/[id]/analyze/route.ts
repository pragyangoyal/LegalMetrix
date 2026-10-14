import { NextRequest, NextResponse } from 'next/server';
import { getInspectionDetail } from '@/lib/server/inspectionService';
import { analyzeInspectionSession } from '@/lib/server/analysisService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const inspection = getInspectionDetail(id);
    if (!inspection) {
      return NextResponse.json({ error: 'Inspection not found' }, { status: 404 });
    }

    if (inspection.images.length === 0) {
      return NextResponse.json({ error: 'No images uploaded for this inspection' }, { status: 400 });
    }

    const result = await analyzeInspectionSession(id);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Error analyzing inspection:', error);
    const msg = error instanceof Error ? error.message : 'Analysis failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
