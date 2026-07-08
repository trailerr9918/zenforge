import { NextResponse } from 'next/server';

export const maxDuration = 10;
export const dynamic = 'force-dynamic';

/**
 * GET /api/forge/test-llm
 * Tests if the Vercel function can reach the sandbox proxy URL.
 */
export async function GET() {
  const results: any = { tests: [], vercel: true, env: { VERCEL: process.env.VERCEL, NOW_REGION: process.env.NOW_REGION } };

  const SANDBOX_PROXY_URL = 'https://preview-chat-5ee50f7f-17ae-4318-9880-b2d6472d29df.space-z.ai';

  // Test 1: Sandbox proxy health check (3s timeout)
  try {
    const res = await fetch(`${SANDBOX_PROXY_URL}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    const text = await res.text();
    results.tests.push({
      name: 'sandbox-proxy-health',
      status: res.status,
      ok: res.ok,
      bodyPreview: text.slice(0, 200),
    });
  } catch (e) {
    results.tests.push({
      name: 'sandbox-proxy-health',
      error: e instanceof Error ? e.message.slice(0, 200) : 'unknown',
    });
  }

  // Test 2: Sandbox proxy chat call (5s timeout)
  try {
    const res = await fetch(`${SANDBOX_PROXY_URL}/api/chat/rotated`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'process.env.VPS_BRIDGE_KEY || ""',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'OK' }],
        model: 'glm-4-flash',
        max_tokens: 5,
      }),
      signal: AbortSignal.timeout(5000),
    });
    const text = await res.text();
    results.tests.push({
      name: 'sandbox-proxy-chat',
      status: res.status,
      ok: res.ok,
      bodyPreview: text.slice(0, 200),
    });
  } catch (e) {
    results.tests.push({
      name: 'sandbox-proxy-chat',
      error: e instanceof Error ? e.message.slice(0, 200) : 'unknown',
    });
  }

  return NextResponse.json(results);
}
