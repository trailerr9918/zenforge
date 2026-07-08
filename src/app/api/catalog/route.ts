import { NextRequest, NextResponse } from 'next/server';
import { buildFullCatalog, extractCatalogFromPrompt } from '@/lib/prompt-catalog';
import { loadMotionPrompts } from '@/lib/motionsites-prompts';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

/**
 * GET /api/catalog
 * Returns the full prompt catalog (videos, typography, colors, buttons, headers, footers).
 * Query params:
 *   ?type=videos — only videos
 *   ?type=typography — only typography
 *   ?type=colors — only colors
 *   ?slug=xxx — catalog for a single prompt
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type');
    const slug = url.searchParams.get('slug');

    // Single prompt catalog
    if (slug) {
      const prompts = loadMotionPrompts();
      const prompt = prompts.find(p => p.id === slug || p.title.toLowerCase().includes(slug.toLowerCase()));
      if (!prompt) {
        return NextResponse.json({ error: `Prompt not found: ${slug}` }, { status: 404 });
      }
      const catalog = extractCatalogFromPrompt(prompt.id, prompt.title, prompt.promptText);
      return NextResponse.json({ slug: prompt.id, title: prompt.title, catalog });
    }

    // Full catalog
    const catalog = await buildFullCatalog();

    if (type && type in catalog) {
      return NextResponse.json({ type, count: (catalog as any)[type].length, items: (catalog as any)[type] });
    }

    return NextResponse.json(catalog);
  } catch (e) {
    console.error('[catalog] Error:', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'unknown' }, { status: 500 });
  }
}
