import { NextRequest, NextResponse } from 'next/server';
import { getEvolvedPatterns, loadPersistedPatterns } from '@/lib/seae-engine';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await loadPersistedPatterns();
    const url = new URL(req.url);
    const accepted = url.searchParams.get('accepted') !== 'false';
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const patterns = getEvolvedPatterns(accepted, limit);
    return NextResponse.json({ patterns, count: patterns.length });
  } catch (e) {
    return NextResponse.json({ error: 'Failed', message: e instanceof Error ? e.message : 'unknown' }, { status: 500 });
  }
}
