import { NextRequest, NextResponse } from 'next/server';
import { getArtistPatterns, loadArtistState } from '@/lib/virtual-artist';
// Lazy supabase import

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const accepted = url.searchParams.get('accepted') !== 'false';
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);

    // First try in-memory
    let patterns = getArtistPatterns(accepted, limit);

    // If empty, load from Supabase
    if (patterns.length === 0) {
      await loadArtistState();
      patterns = getArtistPatterns(accepted, limit);
    }

    // If STILL empty, query Supabase directly
    if (patterns.length === 0) {
      const { data } = await supabase
        .from('websites')
        .select('id, config, created_at')
        .eq('business_type', 'virtual_artist_pattern')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (data) {
        patterns = data.map(row => {
          const config = typeof row.config === 'string' ? JSON.parse(row.config) : row.config;
          return config?.pattern || null;
        }).filter(Boolean);
      }
    }

    return NextResponse.json({ patterns, count: patterns.length, source: patterns.length > 0 ? 'supabase' : 'empty' });
  } catch (e) {
    return NextResponse.json({ error: 'Failed', message: e instanceof Error ? e.message : 'unknown' }, { status: 500 });
  }
}
