import { NextRequest, NextResponse } from 'next/server';
import {
  loadTechniques,
  techniquesByPartType,
  techniquesByTag,
  topRatedTechniques,
  avoidedTechniques,
  setTechniqueRating,
  ALL_PART_TYPES,
  type PartType,
} from '@/lib/forge/technique-library';

export const dynamic = 'force-dynamic';

/**
 * GET /api/forge/techniques
 * Query params:
 *   ?partType=hero        — filter by part type
 *   ?tag=cinematic        — filter by tag
 *   ?topRated=true        — only 4-5 star rated
 *   ?avoided=true         — only avoided techniques
 *   ?limit=50             — max results
 *
 * Returns the technique library.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const partType = url.searchParams.get('partType') as PartType | null;
  const tag = url.searchParams.get('tag');
  const topRated = url.searchParams.get('topRated') === 'true';
  const avoided = url.searchParams.get('avoided') === 'true';
  const limit = parseInt(url.searchParams.get('limit') || '50', 10);

  if (avoided) {
    const list = await avoidedTechniques();
    return NextResponse.json({ count: list.length, techniques: list });
  }

  if (topRated && partType && ALL_PART_TYPES.includes(partType)) {
    const list = await topRatedTechniques(partType, limit);
    return NextResponse.json({ count: list.length, techniques: list });
  }

  if (partType && ALL_PART_TYPES.includes(partType)) {
    const list = await techniquesByPartType(partType, limit);
    return NextResponse.json({ count: list.length, techniques: list });
  }

  if (tag) {
    const list = await techniquesByTag(tag, limit);
    return NextResponse.json({ count: list.length, techniques: list });
  }

  const all = await loadTechniques();
  return NextResponse.json({
    count: all.length,
    techniques: all.slice(0, limit),
  });
}

/**
 * PATCH /api/forge/techniques
 * Body: { "id": "...", "rating": 1-5 }
 * Set a user rating on a single technique.
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, rating } = body;
    if (!id || ![1, 2, 3, 4, 5].includes(rating)) {
      return NextResponse.json({ error: 'id and rating (1-5) required' }, { status: 400 });
    }
    await setTechniqueRating(id, rating as 1 | 2 | 3 | 4 | 5);
    return NextResponse.json({ ok: true, id, rating });
  } catch (e) {
    return NextResponse.json(
      { error: 'Update failed', message: e instanceof Error ? e.message : 'unknown' },
      { status: 500 },
    );
  }
}
