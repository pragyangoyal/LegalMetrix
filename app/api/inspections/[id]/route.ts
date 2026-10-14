import { NextRequest, NextResponse } from 'next/server';
import { getInspectionDetail, deleteInspection } from '@/lib/server/inspectionService';

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
    return NextResponse.json(detail);
  } catch (error: unknown) {
    console.error('Error fetching inspection:', error);
    return NextResponse.json({ error: 'Failed to fetch inspection' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = deleteInspection(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Inspection not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Inspection deleted' });
  } catch (error: unknown) {
    console.error('Error deleting inspection:', error);
    return NextResponse.json({ error: 'Failed to delete inspection' }, { status: 500 });
  }
}
