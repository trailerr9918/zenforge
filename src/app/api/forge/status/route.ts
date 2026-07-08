import { NextResponse } from 'next/server';
import { getTechniqueStats } from '@/lib/forge/technique-library';

export const dynamic = 'force-dynamic';

/**
 * GET /api/forge/status
 * Returns the current Forge Engine status — technique counts, distribution
 * by part type, top-rated, recently avoided.
 */
export async function GET() {
  const stats = await getTechniqueStats();
  return NextResponse.json({
    ...stats,
    ready: stats.total > 0,
  });
}
