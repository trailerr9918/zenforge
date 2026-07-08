import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

/**
 * Site API — get and delete individual websites.
 * GET    /api/site/[slug] — serve the website HTML
 * DELETE /api/site/[slug] — delete the website from Supabase
 */

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const { getWebsiteFromSupabase } = await import('@/lib/supabase-client');
    const site = await getWebsiteFromSupabase(slug);
    if (!site) {
      return new NextResponse(
        `<!DOCTYPE html><html><head><title>Site not found</title></head><body style="font-family:system-ui;background:#0a0a0a;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0"><div style="text-align:center"><h1 style="font-size:48px;margin:0 0 16px">404</h1><p style="color:#888;margin:0 0 24px">Site "${slug}" not found</p><a href="/" style="color:#fff;border:1px solid #333;padding:12px 24px;border-radius:8px;text-decoration:none">← Back to studio</a></div></body></html>`,
        { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }
    return new NextResponse(site.html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=60' },
    });
  } catch (e) {
    return new NextResponse('Server error', { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const { error } = await supabase.from('websites').delete().eq('id', slug);
    if (error) {
      return NextResponse.json({ error: 'Delete failed', message: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, message: `Site "${slug}" deleted` });
  } catch (e) {
    return NextResponse.json({ error: 'Delete failed', message: e instanceof Error ? e.message : 'unknown' }, { status: 500 });
  }
}
