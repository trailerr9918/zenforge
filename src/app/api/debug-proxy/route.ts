import { NextResponse } from 'next/server';
export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function GET() {
  const results: any = { tests: [] };
  
  // Test 1: Can we reach the sandbox preview URL?
  const sandboxUrl = 'https://preview-chat-5ee50f7f-17ae-4318-9880-b2d6472d29df.space-z.ai';
  try {
    const res = await fetch(`${sandboxUrl}/api/templates`, {
      signal: AbortSignal.timeout(10000),
    });
    results.tests.push({
      name: 'sandbox-preview-api',
      url: `${sandboxUrl}/api/templates`,
      status: res.status,
      ok: res.ok,
      contentType: res.headers.get('content-type'),
      bodyPreview: (await res.text()).slice(0, 200),
    });
  } catch (e) {
    results.tests.push({
      name: 'sandbox-preview-api',
      error: e instanceof Error ? e.message : 'unknown',
    });
  }
  
  // Test 2: Can we reach the sandbox's /api/zai/chat?
  try {
    const res = await fetch(`${sandboxUrl}/api/zai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] }),
      signal: AbortSignal.timeout(30000),
    });
    results.tests.push({
      name: 'sandbox-zai-chat',
      status: res.status,
      ok: res.ok,
      bodyPreview: (await res.text()).slice(0, 300),
    });
  } catch (e) {
    results.tests.push({
      name: 'sandbox-zai-chat',
      error: e instanceof Error ? e.message : 'unknown',
    });
  }
  
  // Test 3: Is /etc/.z-ai-config available?
  try {
    const fs = require('fs');
    results.hasZaiConfig = fs.existsSync('/etc/.z-ai-config');
    results.isVercel = !!process.env.VERCEL;
  } catch (e) {
    results.fsError = e instanceof Error ? e.message : 'unknown';
  }
  
  return NextResponse.json(results);
}
