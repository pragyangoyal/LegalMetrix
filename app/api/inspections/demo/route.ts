import { NextRequest, NextResponse } from 'next/server';
import { createAndAnalyzeDemoInspection } from '@/lib/server/analysisService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const demoProductId = body.demoProductId;

    if (!demoProductId) {
      return NextResponse.json({ error: 'demoProductId is required' }, { status: 400 });
    }

    const result = await createAndAnalyzeDemoInspection(demoProductId);
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating demo inspection:', error);
    const msg = error instanceof Error ? error.message : 'Demo inspection failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
