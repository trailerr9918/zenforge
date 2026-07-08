import { NextRequest, NextResponse } from 'next/server';
import {
  reviewGeneration,
  getReviewStats,
  getPendingGenerations,
  getRecentGenerations,
  type EmojiRating,
} from '@/lib/forge/review-system';

export const maxDuration = 45;
export const dynamic = 'force-dynamic';

/**
 * POST /api/forge/review
 * Body: { "generationId": "...", "rating": 1-5, "note"?: "..." }
 *
 * Rates a generation 1-5 emoji. The action taken depends on the rating:
 *   1-2 (😡 😕) → TRASH: techniques avoided++, generation marked trashed
 *   3   (😐)    → IMPROVE: LLM suggests 3 improvements, stored for re-forging
 *   4-5 (😍 🤩) → SAVE: techniques marked loved, generation promoted to template
 *
 * Returns: { action, improvements?, templateId?, techniquesAffected }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { generationId, rating, note } = body;

    if (!generationId) {
      return NextResponse.json({ error: 'generationId required' }, { status: 400 });
    }
    if (![1, 2, 3, 4, 5].includes(rating)) {
      return NextResponse.json({ error: 'rating must be 1-5' }, { status: 400 });
    }

    const result = await reviewGeneration(generationId, rating as EmojiRating, note);
    return NextResponse.json({
      ok: true,
      generationId,
      rating,
      ...result,
    });
  } catch (e) {
    console.error('[forge/review] error:', e);
    return NextResponse.json(
      { error: 'Review failed', message: e instanceof Error ? e.message : 'unknown' },
      { status: 500 },
    );
  }
}

/**
 * GET /api/forge/review
 * Query: ?pending=true&limit=20  (default: recent generations)
 *
 * Returns the review queue — either pending (unreviewed) generations or recent ones.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const pending = url.searchParams.get('pending') === 'true';
  const limit = parseInt(url.searchParams.get('limit') || '20', 10);
  const stats = url.searchParams.get('stats') === 'true';

  if (stats) {
    const s = await getReviewStats();
    return NextResponse.json(s);
  }

  const generations = pending ? await getPendingGenerations(limit) : await getRecentGenerations(limit);
  return NextResponse.json({
    count: generations.length,
    generations: generations.map((g) => ({
      id: g.id,
      businessName: g.businessName,
      target: g.plan?.target,
      status: g.status,
      userRating: g.userRating,
      createdAt: g.createdAt,
      reviewedAt: g.reviewedAt,
      sectionCount: g.plan?.sections?.length || 0,
      overallReason: g.plan?.overallReason,
      // Don't return the full HTML in list view — too heavy. Client can fetch by id if needed.
      previewHtml: g.html.slice(0, 500) + (g.html.length > 500 ? '...' : ''),
    })),
  });
}
