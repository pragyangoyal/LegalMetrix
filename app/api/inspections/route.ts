import { NextRequest, NextResponse } from 'next/server';
import { createInspection, listInspections, clearAllInspections } from '@/lib/server/inspectionService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const result = listInspections({ status, search, limit, offset });
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Error listing inspections:', error);
    return NextResponse.json({ error: 'Failed to list inspections' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const scanMode = body.scanMode || 'upload';
    const productName = body.productName || undefined;

    const inspection = createInspection(scanMode, productName);
    return NextResponse.json(inspection, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating inspection:', error);
    return NextResponse.json({ error: 'Failed to create inspection' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    clearAllInspections();
    return NextResponse.json({ success: true, message: 'All inspections cleared' });
  } catch (error: unknown) {
    console.error('Error clearing inspections:', error);
    return NextResponse.json({ error: 'Failed to clear inspections' }, { status: 500 });
  }
}
