import { NextRequest, NextResponse } from 'next/server';
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, html, inject } = body;
    let outHtml = html;
    if (inject?.whatsapp) {
      const phone = inject.whatsapp.phone || '+1234567890';
      const msg = encodeURIComponent(inject.whatsapp.message || 'Hello!');
      outHtml = outHtml.replace('</body>', `<a href="https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${msg}" target="_blank" style="position:fixed;bottom:20px;right:20px;width:60px;height:60px;background:#25D366;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:28px;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.2)">💬</a></body>`);
    }
    if (inject?.floatingForm) {
      outHtml = outHtml.replace('</body>', `<div style="position:fixed;bottom:20px;right:90px;background:#fff;padding:16px;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,0.15);z-index:9999;max-width:280px"><h4 style="margin:0 0 12px;font-size:14px">Contact us</h4><input style="display:block;width:100%;margin-bottom:8px;padding:8px;border:1px solid #ddd;border-radius:6px" placeholder="Name" /><input style="display:block;width:100%;margin-bottom:8px;padding:8px;border:1px solid #ddd;border-radius:6px" placeholder="Email" /><button style="width:100%;padding:8px;background:#007bff;color:#fff;border:none;border-radius:6px;cursor:pointer">Send</button></div></body>`);
    }
    const { saveWebsiteToSupabase } = await import('@/lib/supabase-client');
    await saveWebsiteToSupabase(slug, outHtml, body.businessName || 'Site', 'injected');
    return NextResponse.json({ success: true, html: outHtml, slug });
  } catch (e) {
    return NextResponse.json({ error: 'Failed', message: e instanceof Error ? e.message : 'unknown' }, { status: 500 });
  }
}
