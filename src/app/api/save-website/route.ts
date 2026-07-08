import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 10;
export const dynamic = 'force-dynamic';

/**
 * Save generated website HTML to Supabase.
 * Used by the premium generator (which streams HTML to the browser,
 * then the browser sends it here for saving).
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { html, businessName, businessType } = body;

    if (!html || html.length < 100) {
      return NextResponse.json({ error: 'HTML is required' }, { status: 400 });
    }

    const { supabase } = await import('@/lib/supabase-client');
    const name = businessName || 'ZenForge Site';
    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}-${Math.random().toString(36).slice(2, 6)}`;

    const { error } = await supabase.from('websites').upsert({
      id: slug,
      html,
      business_name: name,
      business_type: businessType || 'premium',
      config: {
        renderer: 'premium-llm-v1',
        timestamp: Date.now(),
      },
    });

    if (error) {
      console.error('[save-website] Supabase error:', error.message);
      return NextResponse.json({ error: `Save failed: ${error.message}` }, { status: 500 });
    }

    console.log('[save-website] ✓ Saved', slug, `(${html.length} bytes)`);

    const host = req.headers.get('host');
    const protocol = req.headers.get('x-forwarded-proto') || 'https';
    const baseUrl = host ? `${protocol}://${host}` : `http://localhost:${process.env.PORT || 3000}`;
    const viewUrl = `${baseUrl}/s/${slug}`;

    return NextResponse.json({ slug, viewUrl, businessName: name });
  } catch (e) {
    console.error('[save-website] Error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'unknown' },
      { status: 500 }
    );
  }
}
