import { NextRequest, NextResponse } from 'next/server';
import { forgeGenerate } from '@/lib/forge/forge-reasoner';
import { recordGeneration, reviewGeneration } from '@/lib/forge/review-system';
import { markTechniqueUsed, getTechniqueStats } from '@/lib/forge/technique-library';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

/**
 * POST /api/forge/auto-evolve
 *
 * Runs one auto-evolution cycle:
 * 1. Generate a new website (random target, medium creativity)
 * 2. Record it to the review queue
 * 3. Return the result
 *
 * The client calls this on an interval (every 30s when auto-forge is on).
 * Combined with auto-review logic, this creates 24/7 evolution.
 *
 * Body: {
 *   "creativity"?: number,  // default 0.5
 *   "target"?: string,      // default "random"
 *   "autoReview"?: boolean, // default false — if true, auto-rates based on quality heuristics
 * }
 */

// Track auto-evolution state across calls (warm serverless)
let _autoEvolveCount = 0;
let _lastAutoEvolveTime = 0;
const _autoEvolveHistory: Array<{ id: string; businessName: string; time: string; sections: number; rating?: number }> = [];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const creativity = typeof body.creativity === 'number' ? body.creativity : 0.5;
    const target = body.target || 'random';
    const autoReview = body.autoReview === true;

    // Set Groq key if provided
    if (body.groqKey) process.env.GROQ_API_KEY = body.groqKey;

    // Generate
    const result = await forgeGenerate({
      target,
      creativity,
      model: body.model || 'mistral-large-latest',
      timeoutMs: 20000,
    });

    // Safety check — result might be incomplete if LLM failed
    if (!result || !result.plan || !result.html) {
      return NextResponse.json({ error: 'Forge generation produced no result' }, { status: 500 });
    }

    const sections = result.plan.sections || [];
    const pickedIds = sections.map((s: any) => s.pickedTechniqueId);
    try { await markTechniqueUsed(pickedIds); } catch {}

    // Record generation
    const generationId = result.plan.id || `auto-${Date.now()}`;
    try {
      await recordGeneration({
        id: generationId,
        plan: result.plan,
        spec: result.spec,
        html: result.html,
        businessName: result.businessName,
        sourceTechniqueIds: pickedIds,
      });

      // Save to websites table for /s/{slug} preview
      try {
        const { supabase } = await import('@/lib/supabase-client');
        const slug = `${result.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}-auto-${Math.random().toString(36).slice(2, 6)}`;
        await supabase.from('websites').upsert({
          id: slug, html: result.html, business_name: result.businessName,
          business_type: 'auto-evolved',
          config: { renderer: 'auto-evolve', plan: result.plan, generationId },
        });
      } catch {}
    } catch (e) { console.warn('[auto-evolve] record failed:', e); }

    // Auto-review if requested (quality heuristics)
    let autoRating: 1 | 2 | 3 | 4 | 5 | null = null;
    if (autoReview) {
      autoRating = assessQuality(result);
      try { await reviewGeneration(generationId, autoRating); } catch {}
    }

    // Track state
    _autoEvolveCount++;
    _lastAutoEvolveTime = Date.now();
    _autoEvolveHistory.unshift({
      id: generationId,
      businessName: result.businessName,
      time: new Date().toISOString(),
      sections: sections.length,
      rating: autoRating || undefined,
    });
    if (_autoEvolveHistory.length > 20) _autoEvolveHistory.pop();

    // Get updated stats
    const stats = await getTechniqueStats();

    return NextResponse.json({
      ok: true,
      cycle: _autoEvolveCount,
      generation: {
        id: generationId,
        businessName: result.businessName,
        sectionCount: sections.length,
        overallReason: result.plan.overallReason,
        html: result.html,
        reasoningTrace: sections.map(s => ({
          partType: s.partType,
          technique: s.pickedTechniqueName,
          reason: s.reason,
        })),
      },
      autoRating,
      stats: {
        totalGenerations: _autoEvolveCount,
        techniqueTotal: stats?.total || 0,
        topRated: stats?.topRatedTechniques?.length || 0,
      },
      history: _autoEvolveHistory.slice(0, 5),
      lastEvolveTime: new Date(_lastAutoEvolveTime).toISOString(),
    });
  } catch (e) {
    console.error('[auto-evolve] error:', e);
    return NextResponse.json(
      { error: 'Auto-evolve failed', message: e instanceof Error ? e.message : 'unknown' },
      { status: 500 },
    );
  }
}

/**
 * GET /api/forge/auto-evolve
 * Returns the current auto-evolution state.
 */
export async function GET() {
  return NextResponse.json({
    cycles: _autoEvolveCount,
    lastEvolveTime: _lastAutoEvolveTime > 0 ? new Date(_lastAutoEvolveTime).toISOString() : null,
    history: _autoEvolveHistory.slice(0, 10),
    isRunning: _lastAutoEvolveTime > 0 && (Date.now() - _lastAutoEvolveTime) < 120000, // active if < 2 min ago
  });
}

/**
 * Quality assessment heuristics — auto-rates the generated website.
 * Returns 1-5 based on section count, technique variety, and palette coherence.
 */
function assessQuality(result: { html: string; plan: any; businessName: string }): 1 | 2 | 3 | 4 | 5 {
  let score = 0;
  const sections = result?.plan?.sections || [];

  // Section count (more = better, up to 5)
  const sectionCount = sections.length;
  if (sectionCount >= 5) score += 2;
  else if (sectionCount >= 3) score += 1;

  // HTML size (bigger = more content)
  if (result.html.length > 15000) score += 2;
  else if (result.html.length > 10000) score += 1;

  // Technique variety (different source prompts = better)
  const sources = new Set(sections.map((s: any) => s.sourcePromptId));
  if (sources.size >= 3) score += 1;

  // Has video (visual richness)
  const hasVideo = sections.some((s: any) => s.sectionSpec?.mediaUrl?.endsWith('.mp4'));
  if (hasVideo) score += 1;

  // Convert score to rating
  if (score >= 5) return 4; // Good — save as potential template
  if (score >= 3) return 3; // OK — suggest improvements
  if (score >= 1) return 2; // Mediocre
  return 1; // Bad
}
