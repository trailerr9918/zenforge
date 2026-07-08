import { NextRequest, NextResponse } from 'next/server';
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return NextResponse.json({
    success: true, action: 'daytona-preview', message: 'daytona-preview accepted (sandbox stub)',
    received: body, timestamp: new Date().toISOString(),
  });
}
export async function GET() {
  return NextResponse.json({ available: true, action: 'daytona-preview' });
}
