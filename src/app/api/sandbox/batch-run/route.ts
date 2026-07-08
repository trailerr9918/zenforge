import { NextRequest, NextResponse } from 'next/server';
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return NextResponse.json({
    success: true, action: 'batch-run', message: 'batch-run accepted (sandbox stub)',
    received: body, timestamp: new Date().toISOString(),
  });
}
export async function GET() {
  return NextResponse.json({ available: true, action: 'batch-run' });
}
