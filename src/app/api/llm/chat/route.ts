import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

/**
 * POST /api/llm/chat
 * 
 * Multi-provider LLM chat endpoint. Routes to Groq or Z.AI based on the
 * model/provider specified in the request body.
 * 
 * Body: {
 *   "messages": [...],
 *   "model": "llama-3.3-70b-versatile" | "glm-4-flash" | etc,
 *   "provider": "groq" | "zai" | "auto",
 *   "groqKey": "...",   // optional, from Settings UI
 *   "temperature": 0.5,
 *   "maxTokens": 2000
 * }
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1';
const MISTRAL_API_URL = 'https://api.mistral.ai/v1';
const MISTRAL_KEY = process.env.MISTRAL_API_KEY || '';
const SANDBOX_PROXY_URL = 'https://preview-chat-5ee50f7f-17ae-4318-9880-b2d6472d29df.space-z.ai';
const SANDBOX_PROXY_KEY = process.env.VPS_BRIDGE_KEY || '';

const GROQ_MODELS = new Set([
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'mixtral-8x7b-32768',
]);

const MISTRAL_MODELS = new Set([
  'mistral-large-latest',
  'mistral-small-latest',
  'mistral-small-2506',
  'mistral-medium-2505',
  'codestral-latest',
  'codestral-2508',
  'magistral-medium-2509',
  'open-mixtral-8x22b',
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, model, provider, groqKey, temperature, maxTokens } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'messages required' }, { status: 400 });
    }

    const actualModel = model || 'mistral-large-latest';
    const isGroqModel = GROQ_MODELS.has(actualModel);
    const isMistralModel = MISTRAL_MODELS.has(actualModel) || actualModel.startsWith('mistral') || actualModel.startsWith('codestral') || actualModel.startsWith('magistral');
    const wantMistral = provider === 'mistral' || (provider === 'auto' && (isMistralModel || !isGroqModel));
    const wantGroq = provider === 'groq' || (provider === 'auto' && isGroqModel);
    const wantZai = provider === 'zai';

    // === MISTRAL (PRIMARY — always try first if key is available) ===
    if (MISTRAL_KEY && (wantMistral || provider === 'auto')) {
      try {
        const res = await fetch(`${MISTRAL_API_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${MISTRAL_KEY}`,
          },
          body: JSON.stringify({
            model: actualModel,
            messages,
            temperature: temperature ?? 0.5,
            max_tokens: maxTokens || 4000,
            stream: false,
          }),
          signal: AbortSignal.timeout(30000),
        });
        if (res.ok) {
          const data = await res.json();
          return NextResponse.json({ ...data, _provider: 'mistral', _model: actualModel });
        }
        const errText = await res.text().catch(() => '');
        console.warn('[llm/chat] Mistral returned', res.status, errText.slice(0, 100));
      } catch (e) {
        console.warn('[llm/chat] Mistral failed:', e instanceof Error ? e.message : 'unknown');
      }
    }

    // Try Groq if requested
    if (wantGroq && (groqKey || process.env.GROQ_API_KEY)) {
      const key = groqKey || process.env.GROQ_API_KEY;
      try {
        const res = await fetch(`${GROQ_API_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: actualModel,
            messages,
            temperature: temperature ?? 0.5,
            max_tokens: maxTokens || 4000,
            stream: false,
          }),
          signal: AbortSignal.timeout(25000),
        });
        if (res.ok) {
          const data = await res.json();
          return NextResponse.json({ ...data, _provider: 'groq', _model: actualModel });
        }
        const errText = await res.text().catch(() => '');
        console.error('[llm/chat] Groq error:', res.status, errText.slice(0, 200));
      } catch (e) {
        console.error('[llm/chat] Groq failed:', e);
      }
    }

    // Try Z.AI — sandbox proxy fallback (VPS bridge removed due to string-literal env bug)
    if (wantZai || provider === 'auto') {
      const zaiModel = isGroqModel ? 'mistral-small-latest' : actualModel;
      try {
        const res = await fetch(`${SANDBOX_PROXY_URL}/api/chat/rotated`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': SANDBOX_PROXY_KEY,
          },
          body: JSON.stringify({
            messages,
            model: zaiModel,
            temperature: temperature ?? 0.5,
            max_tokens: maxTokens || 4000,
          }),
          signal: AbortSignal.timeout(5000),
        });
        if (res.ok) {
          const data = await res.json();
          return NextResponse.json({ ...data, _provider: 'zai', _model: zaiModel });
        }
      } catch (e) {
        console.error('[llm/chat] Z.AI failed:', e);
      }
    }

    return NextResponse.json(
      { error: 'All LLM providers failed. Set MISTRAL_API_KEY env var for premium generation.' },
      { status: 502 },
    );
  } catch (e) {
    return NextResponse.json(
      { error: 'LLM chat failed', message: e instanceof Error ? e.message : 'unknown' },
      { status: 500 },
    );
  }
}
