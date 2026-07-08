import { NextRequest, NextResponse } from 'next/server';
import {
  extractAllFromPrompts,
  extractAllFromImages,
  getTechniqueStats,
} from '@/lib/forge/technique-library';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

/**
 * POST /api/forge/extract
 * Body: { "source": "prompts" | "images" | "all", "useLLM"?: true, "imageUrls"?: [{url, name?, note?}] }
 *
 * Extracts techniques from MotionSites prompts and/or user-uploaded images,
 * persists them to the technique library (Supabase + local JSON fallback).
 *
 * For "prompts" extraction, runs across all 121 prompts — may take 2-5 minutes
 * with LLM. Set useLLM=false to use the regex fallback (much faster, but
 * produces only 1 hero technique per prompt instead of multiple sections).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const source = body.source || 'prompts';
    const useLLM = body.useLLM !== false;

    if (source === 'prompts' || source === 'all') {
      console.log('[forge/extract] Starting prompt extraction (useLLM=' + useLLM + ')');
      const result = await extractAllFromPrompts({
        useLLM,
        skipExisting: body.skipExisting !== false,
      });
      return NextResponse.json({
        source: 'prompts',
        extracted: result.extracted,
        skipped: result.skipped,
        failed: result.failed,
        totalTechniques: result.techniques.length,
      });
    }

    if (source === 'images') {
      const imageUrls = body.imageUrls || [];
      if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
        return NextResponse.json(
          { error: 'images source requires imageUrls array' },
          { status: 400 },
        );
      }
      const result = await extractAllFromImages(imageUrls);
      return NextResponse.json({
        source: 'images',
        extracted: result.extracted,
        failed: result.failed,
        totalTechniques: result.techniques.length,
      });
    }

    return NextResponse.json({ error: 'source must be prompts, images, or all' }, { status: 400 });
  } catch (e) {
    console.error('[forge/extract] error:', e);
    return NextResponse.json(
      { error: 'Extraction failed', message: e instanceof Error ? e.message : 'unknown' },
      { status: 500 },
    );
  }
}

/**
 * GET /api/forge/extract
 * Returns current technique library stats.
 */
export async function GET() {
  const stats = await getTechniqueStats();
  return NextResponse.json(stats);
}
