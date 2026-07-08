import { NextResponse } from 'next/server';
import { resetEvolution } from '@/lib/seae-engine';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    await resetEvolution();
    return NextResponse.json({ success: true, message: 'Evolution engine reset' });
  } catch (e) {
    return NextResponse.json({ error: 'Failed', message: e instanceof Error ? e.message : 'unknown' }, { status: 500 });
  }
}
