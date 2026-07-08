import { NextRequest, NextResponse } from 'next/server';
import { getGeneration } from '@/lib/forge/review-system';

export const dynamic = 'force-dynamic';

/**
 * GET /api/forge/generations?id=...
 * Returns the full generation record (including HTML) by ID.
 * Used by the review UI when re-opening a past generation.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id query param required' }, { status: 400 });
  }
  const gen = await getGeneration(id);
  if (!gen) {
    return NextResponse.json({ error: 'Generation not found' }, { status: 404 });
  }
  return NextResponse.json({
    id: gen.id,
    businessName: gen.businessName,
    plan: gen.plan,
    spec: gen.spec,
    html: gen.html,
    status: gen.status,
    userRating: gen.userRating,
    userNote: gen.userNote,
    improvementSuggestions: gen.improvementSuggestions,
    templateId: gen.templateId,
    createdAt: gen.createdAt,
    reviewedAt: gen.reviewedAt,
    sourceTechniqueIds: gen.sourceTechniqueIds,
    reasoningTrace: gen.plan?.sections?.map((s: any) => ({
      partType: s.partType,
      technique: s.pickedTechniqueName,
      source: s.sourcePromptTitle,
      reason: s.reason,
      mutations: s.mutations,
    })) || [],
  });
}
