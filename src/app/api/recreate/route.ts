import { NextRequest, NextResponse } from 'next/server';
import { recreateFromPromptAsync, listRecreatablePrompts } from '@/lib/prompt-recreator';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * POST /api/recreate
 * Body: { "slug": "aethera-hero" } or { "title": "Aethera" }
 *       Optional: { "useLLM": true (default), "model": "mistral-large-latest" }
 *
 * Reads a MotionSites prompt, asks the LLM to extract a STRUCTURED spec
 * (sections array + per-section type/copy/style/animation), then renders
 * only the sections the prompt actually describes — no bolted-on fake body.
 *
 * Falls back to the regex extractor if the LLM is unavailable.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const slug = body.slug || body.title || body.prompt || '';
    const useLLM = body.useLLM !== false; // default true

    if (!slug) {
      return NextResponse.json({ error: 'Missing slug or title' }, { status: 400 });
    }

    const result = await recreateFromPromptAsync(slug, {
      useLLM,
      model: body.model,
      timeoutMs: body.timeoutMs || 45000,
      // Pass pre-computed client-side Groq extraction if provided.
      // This bypasses the server-side LLM call entirely, avoiding Vercel's
      // 10s Hobby timeout. The browser calls Groq directly (no timeout),
      // then sends the result here for instant rendering.
      groqExtraction: body.groqExtraction,
    });
    if (!result) {
      return NextResponse.json({ error: `Prompt not found: ${slug}` }, { status: 404 });
    }

    const { html, spec, prompt } = result;

    // Save to Supabase (optional — never blocks the response)
    let slugId = '';
    let viewUrl = '';
    if (body.save !== false) {
      try {
        const { supabase } = await import('@/lib/supabase-client');
        slugId = `${spec.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}-${Math.random().toString(36).slice(2, 6)}`;
        await supabase.from('websites').upsert({
          id: slugId,
          html,
          business_name: spec.businessName,
          business_type: `recreated-${spec.promptType}`,
          config: {
            renderer: 'prompt-recreator-v2',
            sourcePrompt: prompt.id,
            sourceTitle: prompt.title,
            spec,
          },
        });
        const host = req.headers.get('host');
        const protocol = req.headers.get('x-forwarded-proto') || 'https';
        const baseUrl = host ? `${protocol}://${host}` : `http://localhost:${process.env.PORT || 3000}`;
        viewUrl = `${baseUrl}/s/${slugId}`;
      } catch (e) { console.error('[recreate] Save error:', e); }
    }

    return NextResponse.json({
      html,
      slug: slugId || undefined,
      viewUrl: viewUrl || undefined,
      businessName: spec.businessName,
      renderer: 'prompt-recreator-v2',
      extractor: spec.source,
      sourcePrompt: prompt.id,
      sourceTitle: prompt.title,
      promptType: spec.promptType,
      sectionCount: spec.sections.length,
      sectionTypes: spec.sections.map(s => s.type),
      promptText: prompt.promptText,
      spec,
    });
  } catch (e) {
    console.error('[recreate] Error:', e);
    return NextResponse.json(
      { error: 'Recreation failed', message: e instanceof Error ? e.message : 'unknown' },
      { status: 500 },
    );
  }
}

/**
 * GET /api/recreate
 * No query → lists all MotionSites prompts available for recreation.
 * ?slug=xxx → returns single prompt with full text (for client-side LLM calls).
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const slug = url.searchParams.get('slug');

  if (slug) {
    // Return single prompt with full text — needed by the client-side
    // Groq extraction (browser fetches prompt text, calls Groq directly,
    // then sends the result to POST /api/recreate for rendering).
    const { loadMotionPrompts } = await import('@/lib/motionsites-prompts');
    const prompts = loadMotionPrompts();
    const prompt = prompts.find(p => p.id === slug || p.title.toLowerCase().includes(slug.toLowerCase()));
    if (!prompt) {
      return NextResponse.json({ error: `Prompt not found: ${slug}` }, { status: 404 });
    }
    return NextResponse.json({
      id: prompt.id,
      title: prompt.title,
      category: prompt.category,
      type: prompt.type,
      promptText: prompt.promptText,
      charCount: prompt.charCount,
    });
  }

  const prompts = listRecreatablePrompts();
  return NextResponse.json({ count: prompts.length, prompts });
}
