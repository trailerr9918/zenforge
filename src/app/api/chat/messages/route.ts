import { NextRequest, NextResponse } from 'next/server';
const g = globalThis as any;
if (!g.__zenforgeMessages) g.__zenforgeMessages = [];
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get('sessionId');
  let msgs = g.__zenforgeMessages || [];
  if (sessionId) msgs = msgs.filter((m: any) => m.sessionId === sessionId);
  return NextResponse.json({ messages: msgs.slice(-100), count: msgs.length });
}
export async function POST(req: NextRequest) {
  const body = await req.json();
  const msg = { id: `msg_${Date.now().toString(36)}`, timestamp: new Date().toISOString(), ...body };
  g.__zenforgeMessages.push(msg);
  if (g.__zenforgeMessages.length > 1000) g.__zenforgeMessages = g.__zenforgeMessages.slice(-1000);
  return NextResponse.json({ success: true, message: msg });
}
export async function DELETE() { g.__zenforgeMessages = []; return NextResponse.json({ success: true }); }
