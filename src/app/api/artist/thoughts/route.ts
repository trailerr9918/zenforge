import { NextRequest, NextResponse } from 'next/server';
import { getArtistThoughts, loadArtistState } from '@/lib/virtual-artist';
// Lazy supabase import

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);

    // First try in-memory (fast)
    let thoughts = getArtistThoughts(limit);

    // If in-memory is empty (after refresh), load from Supabase
    if (thoughts.length === 0) {
      await loadArtistState(); // This loads thoughts into memory
      thoughts = getArtistThoughts(limit);
    }

    // If STILL empty, query Supabase directly
    if (thoughts.length === 0) {
      const { data } = await supabase
        .from('websites')
        .select('id, config, created_at')
        .eq('business_type', 'artist_thought')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (data) {
        thoughts = data.map(row => {
          const config = typeof row.config === 'string' ? JSON.parse(row.config) : row.config;
          return config?.thought || null;
        }).filter(Boolean).reverse(); // Reverse to show newest last (for display)
      }
    }

    return NextResponse.json({ thoughts, count: thoughts.length, source: thoughts.length > 0 ? 'supabase' : 'empty' });
  } catch (e) {
    return NextResponse.json({ error: 'Failed', message: e instanceof Error ? e.message : 'unknown' }, { status: 500 });
  }
}
