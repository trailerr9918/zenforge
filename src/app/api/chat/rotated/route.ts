import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * POST /api/chat/rotated
 *
 * Uses the Z.AI SDK with the sandbox's own credential (/etc/.z-ai-config).
 * The SDK is memory-efficient and stable with ONE instance.
 *
 * ~300 req/day from the sandbox credential. When rate-limited (429),
 * Vercel falls back to regex/random mode gracefully.
 */

const PROXY_API_KEY = 'process.env.VPS_BRIDGE_KEY || ""';

let _zaiInstance: any = null;
let _zaiInitPromise: Promise<any> | null = null;

async function getZAI(): Promise<any> {
  if (_zaiInstance) return _zaiInstance;
  if (!_zaiInitPromise) {
    _zaiInitPromise = (async () => {
      console.log('[chat/rotated] Initializing Z.AI SDK...');
      const ZAI = (await import('z-ai-web-dev-sdk')).default;
      const inst = await ZAI.create();
      _zaiInstance = inst;
      console.log('[chat/rotated] Z.AI SDK ready.');
      return inst;
    })();
  }
  return _zaiInitPromise;
}

// Initialize on module load
getZAI().catch(e => {
  console.error('[chat/rotated] SDK init failed:', e);
  _zaiInitPromise = null;
});

function validateKey(req: NextRequest): boolean {
  const key = req.headers.get('x-api-key') || (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  return key === PROXY_API_KEY;
}

export async function POST(req: NextRequest) {
  if (!validateKey(req)) {
    return NextResponse.json({ error: { message: 'Invalid API key', status: 401 } }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (!body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json({ error: { message: 'messages array required', status: 400 } }, { status: 400 });
    }

    const zai = await getZAI();
    const result = await zai.chat.completions.create({
      model: body.model || 'glm-4-flash',
      messages: body.messages,
      temperature: body.temperature ?? 0.5,
      max_tokens: body.max_tokens || 2000,
      thinking: body.thinking || { type: 'disabled' },
      stream: false,
    });

    return NextResponse.json(result);
  } catch (e: any) {
    console.error('[chat/rotated] error:', e?.message?.slice(0, 200));
    const msg = e?.message || 'unknown error';
    let status = 500;
    if (msg.includes('429') || msg.includes('rate limit')) status = 429;
    else if (msg.includes('401') || msg.includes('unauthorized')) status = 401;
    return NextResponse.json(
      { error: { message: msg, status, type: status === 429 ? 'rate_limit_error' : 'api_error' } },
      { status },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: '/api/chat/rotated',
    sdkReady: !!_zaiInstance,
    method: 'sdk-single-credential',
  });
}
