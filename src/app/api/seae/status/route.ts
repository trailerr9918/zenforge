import { NextRequest, NextResponse } from 'next/server';
import { getEvolutionStats, getRecentHistory, loadPersistedPatterns, isAutoEvolving, startAutoEvolve, tickAutoEvolve } from '@/lib/seae-engine';
import { sessionManager } from '@/lib/session-manager';
import { getDesignFileCount } from '@/lib/design-kb';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await loadPersistedPatterns();

    // 24/7 mode polling fallback — runs a cycle if it's been > 10s
    // This is what makes 24/7 mode survive Vercel serverless cold starts
    await tickAutoEvolve();

    // Check if autoEvolve should be running (restores after refresh)
    const persistedAutoEvolve = await sessionManager.getEvoAutoEvolve();
    const currentlyRunning = isAutoEvolving();
    if (persistedAutoEvolve && !currentlyRunning) {
      await startAutoEvolve(10000);
    }

    const stats = getEvolutionStats();
    const history = getRecentHistory(30);
    const autoEvolve = isAutoEvolving();
    const designFiles = getDesignFileCount();
    return NextResponse.json({ stats, history, autoEvolve, designFiles });
  } catch (e) {
    return NextResponse.json({ error: 'Failed', message: e instanceof Error ? e.message : 'unknown' }, { status: 500 });
  }
}
