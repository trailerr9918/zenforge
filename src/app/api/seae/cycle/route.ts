import { NextRequest, NextResponse } from 'next/server';
import { runEvolutionCycle, runMultipleCycles, loadPersistedPatterns, startAutoEvolve, stopAutoEvolve } from '@/lib/seae-engine';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    await loadPersistedPatterns();
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'cycle';

    if (action === 'auto-start') {
      await startAutoEvolve(body.interval || 10000);
      return NextResponse.json({ success: true, message: 'Auto-evolution started (persisted)' });
    }

    if (action === 'auto-stop') {
      await stopAutoEvolve();
      return NextResponse.json({ success: true, message: 'Auto-evolution stopped (persisted)' });
    }

    const count = Math.min(body.count || 1, 10);
    if (count === 1) {
      const result = await runEvolutionCycle();
      return NextResponse.json({ success: true, result });
    } else {
      const results = await runMultipleCycles(count);
      return NextResponse.json({ success: true, results, count: results.length });
    }
  } catch (e) {
    return NextResponse.json({ error: 'Cycle failed', message: e instanceof Error ? e.message : 'unknown' }, { status: 500 });
  }
}
