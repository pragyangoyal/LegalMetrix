import { NextRequest, NextResponse } from 'next/server';
import { createAndAnalyzeTextInspection } from '@/lib/server/analysisService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const text = body.text;
    const title = body.title;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ error: 'Valid listing text is required' }, { status: 400 });
    }

    const result = await createAndAnalyzeTextInspection(text, title);
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    console.error('Error analyzing text inspection:', error);
    const msg = error instanceof Error ? error.message : 'Text inspection failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
