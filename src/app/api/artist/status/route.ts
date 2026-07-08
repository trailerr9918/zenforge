import { NextResponse } from 'next/server';
import { getArtistStats, getArtistCurrentPhase, loadArtistState, isArtistEvolving, startArtistAutoEvolve, tickArtistAutoEvolve } from '@/lib/virtual-artist';
import { sessionManager } from '@/lib/session-manager';
import { loadMotionPrompts } from '@/lib/motionsites-prompts';
import { loadDesignPrinciples } from '@/lib/design-kb';
import { getEvolutionStats, loadEvolutionMemory } from '@/lib/mutation-engine';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await loadArtistState();
    await loadEvolutionMemory();

    // 24/7 polling fallback
    await tickArtistAutoEvolve();

    // Restore autoEvolve state from Supabase
    const persistedAutoEvolve = await sessionManager.getVAAutoEvolve();
    const currentlyRunning = isArtistEvolving();
    if (persistedAutoEvolve && !currentlyRunning) {
      await startArtistAutoEvolve(15000);
    }

    const stats = getArtistStats();
    const currentPhase = getArtistCurrentPhase();
    const autoEvolve = isArtistEvolving();

    // Get training data counts
    let motionPromptCount = 0;
    let designPrincipleCount = 0;
    try { motionPromptCount = loadMotionPrompts().length; } catch {}
    try { designPrincipleCount = loadDesignPrinciples().length; } catch {}

    // Get evolution stats from mutation engine
    const evoStats = getEvolutionStats();

    return NextResponse.json({
      stats,
      currentPhase,
      autoEvolve,
      trainingData: {
        motionPrompts: motionPromptCount,
        designPrinciples: designPrincipleCount,
        total: motionPromptCount + designPrincipleCount,
      },
      evolution: {
        totalGenerations: evoStats.totalGenerations,
        fitnessTrend: evoStats.fitnessTrend,
        avgFitness: evoStats.fitnessTrend.length > 0 ? Math.round(evoStats.fitnessTrend.reduce((a: number, b: number) => a + b, 0) / evoStats.fitnessTrend.length * 10) / 10 : 0,
        bestCombos: evoStats.bestCombos.length,
        discoveredCompounds: evoStats.discoveredCompounds.map(c => ({
          mutations: c.mutations.map((i: number) => i),
          avgFitness: Math.round(c.avgFitness * 10) / 10,
          count: c.count,
        })),
        topPalettes: Object.entries(evoStats.paletteFitness)
          .map(([k, v]: [string, any]) => ({ index: parseInt(k), avg: Math.round(v.avg * 10) / 10, count: v.count }))
          .sort((a: any, b: any) => b.avg - a.avg)
          .slice(0, 5),
        topFonts: Object.entries(evoStats.fontFitness)
          .map(([k, v]: [string, any]) => ({ index: parseInt(k), avg: Math.round(v.avg * 10) / 10, count: v.count }))
          .sort((a: any, b: any) => b.avg - a.avg)
          .slice(0, 5),
        topMutations: Object.entries(evoStats.mutationFitness)
          .map(([k, v]: [string, any]) => ({ index: parseInt(k), avg: Math.round(v.avg * 10) / 10, count: v.count }))
          .sort((a: any, b: any) => b.avg - a.avg)
          .slice(0, 5),
      },
    });
  } catch (e) {
    return NextResponse.json({ error: 'Failed', message: e instanceof Error ? e.message : 'unknown' }, { status: 500 });
  }
}
