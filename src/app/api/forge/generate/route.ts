import { NextRequest, NextResponse } from 'next/server';
import { forgeGenerate, type ForgeGenerateOptions } from '@/lib/forge/forge-reasoner';
import { markTechniqueUsed } from '@/lib/forge/technique-library';
import { recordGeneration } from '@/lib/forge/review-system';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * POST /api/forge/generate
 * Body: ForgeGenerateOptions
 *   {
 *     "target": "boutique law firm" | "random" (default),
 *     "creativity": 0.0-1.0 (default 0.5),
 *     "inspirationIds": ["technique-id-1", ...],   // optional
 *     "avoidIds": ["technique-id-1", ...],          // optional
 *     "imageInspiration": "url",                    // optional
 *     "sectionCount": 3-6,                          // optional
 *     "save": true                                  // default true, persists to forge_generations + websites
 *   }
 *
 * Returns: { plan, spec, html, businessName, slug?, viewUrl?, generationId }
 *
 * The plan contains every technique pick + reason + mutations, which the UI
 * streams in real-time so you can watch the reasoning happen.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as ForgeGenerateOptions & { save?: boolean; groqKey?: string };
    const opts: ForgeGenerateOptions = {
      target: body.target || 'random',
      creativity: typeof body.creativity === 'number' ? body.creativity : 0.5,
      inspirationIds: body.inspirationIds,
      avoidIds: body.avoidIds,
      imageInspiration: body.imageInspiration,
      sectionCount: body.sectionCount,
      model: body.model || 'llama-3.3-70b-versatile', // Default to Groq's most intelligent model
      timeoutMs: body.timeoutMs || 25000,
    };

    // Set Groq key in process env if provided (for multi-provider system)
    if (body.groqKey) {
      process.env.GROQ_API_KEY = body.groqKey;
    }

    const result = await forgeGenerate(opts);

    // Mark every picked technique as used (increments usageCount, recomputes score)
    const pickedIds = result.plan.sections.map((s) => s.pickedTechniqueId);
    try { await markTechniqueUsed(pickedIds); } catch (e) { console.warn('[forge/generate] markTechniqueUsed failed:', e); }

    // Record the generation for the review queue
    let generationId = result.plan.id;
    if (body.save !== false) {
      try {
        await recordGeneration({
          id: generationId,
          plan: result.plan,
          spec: result.spec,
          html: result.html,
          businessName: result.businessName,
          sourceTechniqueIds: pickedIds,
        });
      } catch (e) { console.warn('[forge/generate] recordGeneration failed:', e); }

      // Also save to websites table for /s/{slug} preview
      try {
        const { supabase } = await import('@/lib/supabase-client');
        const slug = `${result.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}-forge-${Math.random().toString(36).slice(2, 6)}`;
        await supabase.from('websites').upsert({
          id: slug,
          html: result.html,
          business_name: result.businessName,
          business_type: `forge-generated`,
          config: {
            renderer: 'forge-engine-v1',
            plan: result.plan,
            spec: result.spec,
            generationId,
          },
        });
        const host = req.headers.get('host');
        const protocol = req.headers.get('x-forwarded-proto') || 'https';
        const baseUrl = host ? `${protocol}://${host}` : `http://localhost:${process.env.PORT || 3000}`;
        const viewUrl = `${baseUrl}/s/${slug}`;
        return NextResponse.json({
          plan: result.plan,
          spec: result.spec,
          html: result.html,
          businessName: result.businessName,
          slug,
          viewUrl,
          generationId,
          reasoningTrace: result.plan.sections.map((s) => ({
            partType: s.partType,
            technique: s.pickedTechniqueName,
            source: s.sourcePromptTitle,
            reason: s.reason,
            mutations: s.mutations,
          })),
          overallReason: result.plan.overallReason,
          sectionCount: result.plan.sections.length,
          creativity: result.plan.creativity,
          target: result.plan.target,
        });
      } catch (e) { console.error('[forge/generate] Save error:', e); }
    }

    return NextResponse.json({
      plan: result.plan,
      spec: result.spec,
      html: result.html,
      businessName: result.businessName,
      generationId,
      reasoningTrace: result.plan.sections.map((s) => ({
        partType: s.partType,
        technique: s.pickedTechniqueName,
        source: s.sourcePromptTitle,
        reason: s.reason,
        mutations: s.mutations,
      })),
      overallReason: result.plan.overallReason,
      sectionCount: result.plan.sections.length,
      creativity: result.plan.creativity,
      target: result.plan.target,
    });
  } catch (e) {
    console.error('[forge/generate] error:', e);
    return NextResponse.json(
      { error: 'Forge generation failed', message: e instanceof Error ? e.message : 'unknown' },
      { status: 500 },
    );
  }
}
