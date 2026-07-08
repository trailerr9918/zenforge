import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

// Allow up to 60 seconds for Z.AI API responses
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * Z.AI Proxy Route — Direct SDK Access
 * =====================================
 *
 * This route runs INSIDE the Next.js server on the sandbox (port 3000).
 * It uses the Z.AI SDK directly (reads /etc/.z-ai-config automatically).
 *
 * On Vercel: This route won't have /etc/.z-ai-config, so it falls back
 * to proxying through the sandbox preview URL with XTransformPort=3000.
 *
 * Chain: Vercel → sandbox preview URL → this route → Z.AI SDK → GLM-4-plus
 */

const SANDBOX_PREVIEW = 'https://preview-chat-5ee50f7f-17ae-4318-9880-b2d6472d29df.space-z.ai';
const PROXY_KEY = 'process.env.VPS_BRIDGE_KEY || ""';

let zaiInstance: any = null;

async function getZAI(): Promise<any> {
  if (zaiInstance) return zaiInstance;
  try {
    zaiInstance = await ZAI.create();
    return zaiInstance;
  } catch (e) {
    console.error('[zai-route] SDK init failed:', e);
    throw e;
  }
}

function isSandbox(): boolean {
  // On the sandbox, /etc/.z-ai-config exists
  // On Vercel, it doesn't
  try {
    const fs = require('fs');
    return fs.existsSync('/etc/.z-ai-config');
  } catch {
    return false;
  }
}

const TIMEOUTS: Record<string, number> = {
  chat: 60000, vision: 120000, image: 120000, think: 120000,
  tts: 30000, asr: 60000, 'web-search': 30000, 'page-reader': 30000,
};

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

// --- Handlers (sandbox mode — direct SDK) ---

async function handleChatSandbox(body: any): Promise<any> {
  const zai = await getZAI();
  const params: any = {
    model: body.model || 'glm-4-plus',
    messages: body.messages || [],
    stream: false,
  };
  if (body.tools) params.tools = body.tools;
  if (typeof body.temperature === 'number') params.temperature = body.temperature;
  if (typeof body.max_tokens === 'number') params.max_tokens = body.max_tokens;
  return withTimeout(zai.chat.completions.create(params), TIMEOUTS.chat, 'chat');
}

async function handleChatStreamSandbox(body: any): Promise<Response> {
  const zai = await getZAI();
  const params: any = {
    model: body.model || 'glm-4-plus',
    messages: body.messages || [],
    stream: true,
  };
  if (typeof body.temperature === 'number') params.temperature = body.temperature;
  if (typeof body.max_tokens === 'number') params.max_tokens = body.max_tokens;

  const stream = await zai.chat.completions.create(params);

  if (stream && typeof stream[Symbol.asyncIterator] === 'function') {
    const transformedStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of stream) {
            const content = chunk.choices?.[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch (e: any) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: e.message })}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(transformedStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // Non-streaming fallback
  const result = await Promise.resolve(stream);
  return NextResponse.json(result);
}

async function handleImageSandbox(body: any): Promise<any> {
  const zai = await getZAI();
  if (!body.prompt) throw new Error('prompt is required');
  return withTimeout(
    zai.images.generations.create({ prompt: body.prompt, size: body.size || '1024x1024' }),
    TIMEOUTS.image, 'image-gen'
  );
}

async function handleWebSearchSandbox(body: any): Promise<any> {
  const zai = await getZAI();
  if (!body.query) throw new Error('query is required');
  return withTimeout(
    (zai as any).functions.invoke('web_search', { query: body.query, num: body.num || 10 }),
    TIMEOUTS['web-search'], 'web-search'
  );
}

async function handlePageReaderSandbox(body: any): Promise<any> {
  const zai = await getZAI();
  if (!body.url) throw new Error('url is required');
  return withTimeout(
    (zai as any).functions.invoke('page_reader', { url: body.url }),
    TIMEOUTS['page-reader'], 'page-reader'
  );
}

async function handleVisionSandbox(body: any): Promise<any> {
  const zai = await getZAI();
  return withTimeout(
    zai.chat.completions.createVision({
      model: body.model || 'glm-5v-turbo',
      messages: body.messages || [],
      stream: false,
    }),
    TIMEOUTS.vision, 'vision'
  );
}

// --- Handlers (Vercel mode — proxy to sandbox) ---

async function proxyToSandbox(path: string, req: NextRequest): Promise<Response> {
  const url = `${SANDBOX_PREVIEW}/api/zai/${path}`;
  const body = req.method === 'POST' ? await req.text() : undefined;

  try {
    const res = await fetch(url, {
      method: req.method,
      headers: { 'Content-Type': req.headers.get('Content-Type') || 'application/json' },
      body,
      signal: AbortSignal.timeout(120000),
    });

    const contentType = res.headers.get('Content-Type') || '';

    if (contentType.includes('text/event-stream')) {
      return new Response(res.body, {
        status: res.status,
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const data = await res.text();
    return new Response(data, {
      status: res.status,
      headers: { 'Content-Type': contentType || 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (e) {
    return NextResponse.json({ error: 'Sandbox unreachable', message: e instanceof Error ? e.message : 'unknown' }, { status: 502 });
  }
}

// --- Main route handler ---

async function handleRequest(req: NextRequest, pathParts: string[]): Promise<Response> {
  const path = pathParts.join('/');
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key, Authorization',
  };

  // Health check
  if (path === 'health' || path === '') {
    try {
      const zai = await getZAI();
      return NextResponse.json({
        service: 'Z.AI Proxy', status: 'running', sdkLoaded: true,
        mode: isSandbox() ? 'sandbox-direct' : 'vercel-proxy',
        timestamp: new Date().toISOString(),
      }, { headers: corsHeaders });
    } catch {
      return NextResponse.json({
        service: 'Z.AI Proxy', status: 'error', sdkLoaded: false,
        mode: isSandbox() ? 'sandbox-direct' : 'vercel-proxy',
        timestamp: new Date().toISOString(),
      }, { status: 500, headers: corsHeaders });
    }
  }

  // On Vercel, proxy to sandbox
  if (!isSandbox()) {
    return proxyToSandbox(path, req);
  }

  // On sandbox, use SDK directly
  try {
    const body = req.method === 'POST' ? await req.json() : {};

    switch (path) {
      case 'chat': {
        const result = await handleChatSandbox(body);
        return NextResponse.json(result, { headers: corsHeaders });
      }
      case 'chat/stream': {
        return await handleChatStreamSandbox(body);
      }
      case 'chat/vision':
      case 'vision': {
        const result = await handleVisionSandbox(body);
        return NextResponse.json(result, { headers: corsHeaders });
      }
      case 'images/generate': {
        const result = await handleImageSandbox(body);
        return NextResponse.json(result, { headers: corsHeaders });
      }
      case 'web-search': {
        const result = await handleWebSearchSandbox(body);
        return NextResponse.json(result, { headers: corsHeaders });
      }
      case 'page-reader': {
        const result = await handlePageReaderSandbox(body);
        return NextResponse.json(result, { headers: corsHeaders });
      }
      default:
        return NextResponse.json({ error: `Unknown path: ${path}` }, { status: 404, headers: corsHeaders });
    }
  } catch (e) {
    console.error('[zai-route] Error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'unknown', type: 'api_error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return handleRequest(req, path);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return handleRequest(req, path);
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key, Authorization',
    },
  });
}
