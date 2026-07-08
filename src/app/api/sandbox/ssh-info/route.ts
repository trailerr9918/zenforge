import { NextResponse } from 'next/server';
export async function GET() {
  return NextResponse.json({
    status: 'connected', host: 'zenforge-sandbox.local', user: 'zenforge',
    port: 22, latency: 12, lastConnected: new Date().toISOString(),
  });
}
