/**
 * Z.AI SDK Client — VPS Bridge Mode
 * ===================================
 *
 * Routes all Z.AI requests through the user's VPS bridge at
 * (process.env.VPS_BRIDGE_URL || '') (OpenAI-compatible proxy with credential
 * rotation, supports glm-5.1 / glm-4-plus / glm-4-flash / streaming).
 *
 * API key: (process.env.VPS_BRIDGE_KEY || '')
 *
 * Why this approach:
 *   The Z.AI SDK only works inside the Z.AI sandbox (needs /etc/.z-ai-config).
 *   The user has set up a VPS bridge (bridge-v7.js) that exposes an
 *   OpenAI-compatible API at port 8765, with credential rotation across
 *   2 chat sessions for 600 daily requests. This is the production-grade
 *   path that works from Vercel, Modal, E2B, Daytona, anywhere.
 *
 * Endpoints used:
 *   POST /v1/chat/completions              — chat (streaming + non-streaming)
 *   GET  /v1/models                        — list available models
 *   POST /api/images/generate              — image generation
 *   POST /api/web-search                   — web search
 *   POST /api/page-reader                  — page reader
 *   POST /api/chat/vision                  — vision / image analysis
 *
 * Fallbacks:
 *   If the VPS bridge is unreachable, falls back to the Next.js /api/zai
 *   proxy route (which tries the SDK on sandbox, or proxies to the sandbox
 *   preview URL on Vercel). If that also fails, throws a clear error.
 */

// VPS bridge — primary endpoint (works from any environment)
const VPS_BRIDGE_URL = process.env.ZAI_VPS_BRIDGE_URL || process.env.VPS_BRIDGE_URL || '';
const VPS_BRIDGE_KEY = process.env.ZAI_VPS_BRIDGE_KEY || process.env.VPS_BRIDGE_KEY || '';

// Sandbox preview URL — secondary fallback (only works from same browser session)
const SANDBOX_PREVIEW = process.env.SANDBOX_PREVIEW_URL || '';
const PROXY_KEY = VPS_BRIDGE_KEY;

// /api/zai route — tertiary fallback (Next.js route, only useful on sandbox)
const LOCAL_PROXY = '/api/zai';

export const ZAI_MODELS = {
  GLM_5_2: 'glm-5.2',
  GLM_5_1: 'glm-5.1',
  GLM_5: 'glm-5',
  GLM_4_7: 'glm-4.7',
  GLM_5V_TURBO: 'glm-5v-turbo',
  GLM_4_PLUS: 'glm-4-plus',
  GLM_4V_PLUS: 'glm-4v-plus',
  GLM_4_FLASH: 'glm-4-flash',
  GLM_Z1_AIR: 'glm-z1-air',
  // OpenAI-compatible aliases (the bridge auto-maps these)
  GPT_4: 'gpt-4',
  GPT_4O: 'gpt-4o',
  GPT_4O_MINI: 'gpt-4o-mini',
} as const;

interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | any[];
}

interface ChatOptions {
  model?: string;
  messages: ChatMessage[];
  thinking?: boolean;
  tools?: any[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

/**
 * Check VPS bridge availability + list models.
 */
export async function zaiAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${VPS_BRIDGE_URL}/v1/models`, {
      headers: { 'Authorization': `Bearer ${VPS_BRIDGE_KEY}` },
      signal: AbortSignal.timeout(8000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Get the active mode for debugging.
 */
export async function getZaiMode(): Promise<string> {
  if (await zaiAvailable()) return 'vps-bridge';
  return 'unavailable';
}

/**
 * Chat completion — non-streaming.
 * Returns the full response object (OpenAI-compatible shape).
 */
export async function zaiChat(opts: ChatOptions): Promise<any> {
  const params: any = {
    model: opts.model || ZAI_MODELS.GLM_4_PLUS,
    messages: opts.messages,
    stream: false,
    ...(opts.tools ? { tools: opts.tools } : {}),
    ...(opts.temperature != null ? { temperature: opts.temperature } : {}),
    ...(opts.maxTokens ? { max_tokens: opts.maxTokens } : {}),
  };

  // Primary: VPS bridge (works everywhere)
  try {
    const res = await fetch(`${VPS_BRIDGE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VPS_BRIDGE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(60000),
    });
    if (res.ok) return await res.json();
    console.error('[zai] VPS bridge returned', res.status, await res.text().catch(() => ''));
  } catch (e) {
    console.error('[zai] VPS bridge failed:', e);
  }

  // Fallback 1: local /api/zai proxy (only useful on sandbox)
  try {
    const res = await fetch(`${LOCAL_PROXY}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': PROXY_KEY },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(45000),
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.error('[zai] local proxy failed:', e);
  }

  // Fallback 2: direct SDK (sandbox only — reads /etc/.z-ai-config)
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();
    return await zai.chat.completions.create(params);
  } catch (e) {
    console.error('[zai] all modes failed:', e);
    throw new Error(`Z.AI unavailable. VPS bridge at ${VPS_BRIDGE_URL} not responding. Last error: ${e instanceof Error ? e.message : 'unknown'}`);
  }
}

/**
 * Chat completion with streaming — yields token chunks.
 * Uses VPS bridge's OpenAI-compatible SSE streaming.
 */
export async function* zaiChatStream(opts: ChatOptions): AsyncGenerator<string> {
  const params: any = {
    model: opts.model || ZAI_MODELS.GLM_4_PLUS,
    messages: opts.messages,
    stream: true,
    ...(opts.temperature != null ? { temperature: opts.temperature } : {}),
    ...(opts.maxTokens ? { max_tokens: opts.maxTokens } : {}),
  };
  if (opts.thinking) {
    params.thinking = { type: 'enabled' };
  }

  // Primary: VPS bridge streaming
  try {
    const res = await fetch(`${VPS_BRIDGE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VPS_BRIDGE_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(120000),
    });

    if (!res.ok || !res.body) {
      throw new Error(`VPS bridge stream failed: ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') return;
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch {
          // Skip malformed chunks
        }
      }
    }
    return;
  } catch (e) {
    console.error('[zai] VPS bridge stream failed:', e);
    // Fall through to non-streaming fallback below
  }

  // Fallback: non-streaming via zaiChat, then yield the whole content
  try {
    const response = await zaiChat({ ...opts, stream: false });
    const content = response.choices?.[0]?.message?.content || '';
    if (content) {
      // Yield word-by-word to simulate streaming
      const words = content.split(/(\s+)/);
      for (const w of words) {
        yield w;
        await new Promise((r) => setTimeout(r, 10));
      }
    }
  } catch (e) {
    console.error('[zai] all stream modes failed:', e);
    throw e;
  }
}

/**
 * Generate an image from a text prompt.
 * Uses VPS bridge's /api/images/generate endpoint.
 */
export async function zaiImageGenerate(prompt: string, size: string = '1024x1024'): Promise<string> {
  // Primary: VPS bridge
  try {
    const res = await fetch(`${VPS_BRIDGE_URL}/api/images/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VPS_BRIDGE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, size }),
      signal: AbortSignal.timeout(120000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.data?.[0]?.base64) return `data:image/png;base64,${data.data[0].base64}`;
      if (data.data?.[0]?.url) return data.data[0].url;
    }
  } catch (e) {
    console.error('[zai] VPS bridge image gen failed:', e);
  }

  // Fallback: local /api/zai proxy
  try {
    const res = await fetch(`${LOCAL_PROXY}/images/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': PROXY_KEY },
      body: JSON.stringify({ prompt, size }),
      signal: AbortSignal.timeout(120000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.data?.[0]?.base64) return `data:image/png;base64,${data.data[0].base64}`;
      if (data.data?.[0]?.url) return data.data[0].url;
    }
  } catch (e) {
    console.error('[zai] local proxy image gen failed:', e);
  }

  // Fallback: direct SDK (sandbox only)
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();
    const response = await zai.images.generations.create({ prompt, size } as any);
    if (response.data?.[0]?.base64) return `data:image/png;base64,${response.data[0].base64}`;
    if (response.data?.[0]?.url) return response.data[0].url;
  } catch (e) {
    console.error('[zai] all image modes failed:', e);
  }

  throw new Error('Image generation unavailable. VPS bridge and SDK both failed.');
}

/**
 * Web search via Z.AI (uses the web_search function).
 * Returns an array of search results.
 */
export async function zaiWebSearch(query: string, num: number = 10): Promise<any[]> {
  // Primary: VPS bridge
  try {
    const res = await fetch(`${VPS_BRIDGE_URL}/api/web-search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VPS_BRIDGE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, num }),
      signal: AbortSignal.timeout(30000),
    });
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : (data?.results || []);
    }
  } catch (e) {
    console.error('[zai] VPS bridge web search failed:', e);
  }

  // Fallback: local /api/zai proxy
  try {
    const res = await fetch(`${LOCAL_PROXY}/web-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': PROXY_KEY },
      body: JSON.stringify({ query, num }),
      signal: AbortSignal.timeout(30000),
    });
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : (data?.results || []);
    }
  } catch (e) {
    console.error('[zai] local proxy web search failed:', e);
  }

  // Fallback: direct SDK (sandbox only)
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();
    const response = await (zai as any).functions.invoke('web_search', { query, num });
    return Array.isArray(response) ? response : (response?.results || []);
  } catch (e) {
    console.error('[zai] all web search modes failed:', e);
  }

  return [];
}

/**
 * Read a web page via Z.AI (uses the page_reader function).
 */
export async function zaiPageReader(url: string): Promise<any> {
  // Primary: VPS bridge
  try {
    const res = await fetch(`${VPS_BRIDGE_URL}/api/page-reader`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VPS_BRIDGE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(30000),
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.error('[zai] VPS bridge page reader failed:', e);
  }

  // Fallback: local /api/zai proxy
  try {
    const res = await fetch(`${LOCAL_PROXY}/page-reader`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': PROXY_KEY },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(30000),
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.error('[zai] local proxy page reader failed:', e);
  }

  // Fallback: direct SDK (sandbox only)
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();
    return await (zai as any).functions.invoke('page_reader', { url });
  } catch (e) {
    throw e;
  }
}

/**
 * Vision / image analysis via Z.AI.
 */
export async function zaiVision(prompt: string, imageUrl: string, model?: string): Promise<any> {
  const body = {
    model: model || ZAI_MODELS.GLM_5V_TURBO,
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: imageUrl } },
      ],
    }],
  };

  // Primary: VPS bridge
  try {
    const res = await fetch(`${VPS_BRIDGE_URL}/api/chat/vision`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VPS_BRIDGE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120000),
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.error('[zai] VPS bridge vision failed:', e);
  }

  // Fallback: local /api/zai proxy
  try {
    const res = await fetch(`${LOCAL_PROXY}/chat/vision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': PROXY_KEY },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120000),
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.error('[zai] local proxy vision failed:', e);
  }

  // Fallback: direct SDK (sandbox only)
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();
    return await zai.chat.completions.createVision({ ...body, stream: false } as any);
  } catch (e) {
    throw e;
  }
}

/**
 * Text-to-speech via Z.AI.
 */
export async function zaiTTS(text: string, voice: string = 'tongtong'): Promise<ArrayBuffer> {
  // Primary: VPS bridge
  try {
    const res = await fetch(`${VPS_BRIDGE_URL}/api/audio/tts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VPS_BRIDGE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: text, voice }),
      signal: AbortSignal.timeout(30000),
    });
    if (res.ok) return await res.arrayBuffer();
  } catch (e) {
    console.error('[zai] VPS bridge TTS failed:', e);
  }

  // Fallback: local /api/zai proxy
  try {
    const res = await fetch(`${LOCAL_PROXY}/audio/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': PROXY_KEY },
      body: JSON.stringify({ input: text, voice }),
      signal: AbortSignal.timeout(30000),
    });
    if (res.ok) return await res.arrayBuffer();
  } catch (e) {
    console.error('[zai] local proxy TTS failed:', e);
  }

  // Fallback: direct SDK (sandbox only)
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();
    return await zai.audio.tts.create({ input: text, voice } as any);
  } catch (e) {
    throw e;
  }
}
