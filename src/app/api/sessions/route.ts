import { NextRequest, NextResponse } from 'next/server';
const g = globalThis as any;
if (!g.__zenforgeSessions) g.__zenforgeSessions = [];
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get('limit') || '50', 10);
  return NextResponse.json({ sessions: (g.__zenforgeSessions || []).slice(0, limit), count: (g.__zenforgeSessions || []).length });
}
export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.action === 'save' && body.session) {
    const idx = (g.__zenforgeSessions || []).findIndex((s: any) => s.id === body.session.id);
    if (idx >= 0) g.__zenforgeSessions[idx] = { ...body.session, updatedAt: new Date().toISOString() };
    else g.__zenforgeSessions.unshift({ ...body.session, id: body.session.id || `sess_${Date.now().toString(36)}`, createdAt: new Date().toISOString() });
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
export async function DELETE() { g.__zenforgeSessions = []; return NextResponse.json({ success: true }); }
