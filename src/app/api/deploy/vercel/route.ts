import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, slug, html, businessName, businessType } = body;
  if (action === 'status' || !action) {
    return NextResponse.json({ status: 'ready', target: 'vercel', url: 'https://site-forge-two-lake.vercel.app' });
  }
  if (action === 'deploy' || action === 'redeploy') {
    if (html) {
      const { saveWebsiteToSupabase } = await import('@/lib/supabase-client');
      await saveWebsiteToSupabase(slug, html, businessName || 'ZenForge Site', businessType || 'general');
    }
    const host = `https://${req.headers.get('host') || 'localhost:3000'}`;
    return NextResponse.json({
      success: true, action, slug,
      viewUrl: `${host}/s/${slug}`,
      deployedAt: new Date().toISOString(),
    });
  }
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

export async function GET() {
  return NextResponse.json({ status: 'ready', target: 'vercel', project: 'site-forge-two-lake' });
}
