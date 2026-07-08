import { NextResponse } from 'next/server';
export async function GET() {
  try {
    const { listWebsitesFromSupabase } = await import('@/lib/supabase-client');
    const sites = await listWebsitesFromSupabase(100);
    return NextResponse.json({
      sites: sites.map(s => ({
        slug: s.id, businessName: s.business_name,
        businessType: s.business_type, createdAt: s.created_at,
      })),
      count: sites.length,
    });
  } catch (e) {
    return NextResponse.json({ sites: [], count: 0, error: 'Failed' }, { status: 500 });
  }
}
