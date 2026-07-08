/**
 * Multi-Provider LLM Client
 * =========================
 *
 * Supports Z.AI (via sandbox proxy) and Groq (direct API) as LLM providers.
 * Switchable at runtime via the LLM_PROVIDER env var or the Settings UI.
 *
 * Groq models (free tier, OpenAI-compatible API):
 *   - llama-3.3-70b-versatile: Most intelligent, 1000 req/day
 *   - llama-3.1-8b-instant: Fastest, 14400 req/day
 *   - mixtral-8x7b-32768: Balanced, 14400 req/day
 *
 * Z.AI models (via sandbox proxy with credential rotation):
 *   - glm-4-flash: Fast, good for extraction
 *   - glm-4-plus: More capable, good for reasoning
 */

export type LLMProvider = 'zai' | 'groq' | 'auto';

export interface LLMModel {
  id: string;
  label: string;
  provider: LLMProvider;
  description: string;
  speed: 'instant' | 'fast' | 'balanced' | 'slow';
  intelligence: 'basic' | 'good' | 'high' | 'excellent';
  maxTokens: number;
}

export const AVAILABLE_MODELS: LLMModel[] = [
  // Groq models (free, fast, OpenAI-compatible)
  {
    id: 'llama-3.3-70b-versatile',
    label: 'Llama 3.3 70B (Groq)',
    provider: 'groq',
    description: 'Most intelligent — best for complex reasoning and design decisions',
    speed: 'fast',
    intelligence: 'excellent',
    maxTokens: 8000,
  },
  {
    id: 'llama-3.1-8b-instant',
    label: 'Llama 3.1 8B Instant (Groq)',
    provider: 'groq',
    description: 'Fastest model — instant responses, great for quick extractions',
    speed: 'instant',
    intelligence: 'good',
    maxTokens: 8000,
  },
  {
    id: 'mixtral-8x7b-32768',
    label: 'Mixtral 8x7B (Groq)',
    provider: 'groq',
    description: 'Balanced — good speed + intelligence, 32K context window',
    speed: 'fast',
    intelligence: 'high',
    maxTokens: 8000,
  },
  // Z.AI models (via sandbox proxy)
  {
    id: 'glm-4-flash',
    label: 'GLM-4 Flash (Z.AI)',
    provider: 'zai',
    description: 'Z.AI fast model — good for structured extraction',
    speed: 'fast',
    intelligence: 'good',
    maxTokens: 4000,
  },
  {
    id: 'glm-4-plus',
    label: 'GLM-4 Plus (Z.AI)',
    provider: 'zai',
    description: 'Z.AI capable model — better reasoning, slower',
    speed: 'balanced',
    intelligence: 'high',
    maxTokens: 4000,
  },
];

const GROQ_API_URL = 'https://api.groq.com/openai/v1';
const SANDBOX_PROXY_URL = 'https://preview-chat-5ee50f7f-17ae-4318-9880-b2d6472d29df.space-z.ai';
const SANDBOX_PROXY_KEY = 'process.env.VPS_BRIDGE_KEY || ""';

// Get settings from localStorage (browser) or env (server)
export function getLLMSettings(): { provider: LLMProvider; model: string; groqKey: string } {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('sf-llm-settings');
    if (stored) {
      try { return JSON.parse(stored); } catch {}
    }
  }
  return {
    provider: (process.env.LLM_PROVIDER as LLMProvider) || 'zai',
    model: process.env.LLM_MODEL || 'glm-4-flash',
    groqKey: process.env.GROQ_API_KEY || '',
  };
}

export function setLLMSettings(settings: { provider: LLMProvider; model: string; groqKey: string }) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('sf-llm-settings', JSON.stringify(settings));
  }
}

export function getModelInfo(modelId: string): LLMModel | undefined {
  return AVAILABLE_MODELS.find(m => m.id === modelId);
}

/**
 * Call an LLM with the specified model. Automatically routes to the correct provider.
 * Returns the OpenAI-compatible response, or null on failure.
 */
export async function callLLM(
  messages: Array<{ role: string; content: string }>,
  opts: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    provider?: LLMProvider;
    groqKey?: string;
    timeoutMs?: number;
  } = {},
): Promise<any | null> {
  const settings = getLLMSettings();
  const model = opts.model || settings.model;
  const provider = opts.provider || settings.provider;
  const modelInfo = getModelInfo(model);
  const actualProvider = provider === 'auto'
    ? (modelInfo?.provider || 'zai')
    : provider;

  // Route to Groq
  if (actualProvider === 'groq' || modelInfo?.provider === 'groq') {
    const groqKey = opts.groqKey || settings.groqKey;
    if (!groqKey) {
      console.warn('[llm] No Groq API key configured, falling back to Z.AI');
    } else {
      try {
        const res = await fetch(`${GROQ_API_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: opts.temperature ?? 0.5,
            max_tokens: opts.maxTokens || modelInfo?.maxTokens || 4000,
            stream: false,
          }),
          signal: AbortSignal.timeout(opts.timeoutMs || 30000),
        });
        if (res.ok) return await res.json();
        console.error('[llm] Groq returned', res.status, await res.text().catch(() => ''));
      } catch (e) {
        console.error('[llm] Groq failed:', e);
      }
    }
  }

  // Route to Z.AI — VPS bridge first (it's back online!), then sandbox proxy
  if (actualProvider === 'zai' || modelInfo?.provider === 'zai') {
    // Path 1: VPS bridge (fast, reliable)
    try {
      const res = await fetch('http://process.env.VPS_BRIDGE_HOST || "127.0.0.1":8765/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer process.env.VPS_BRIDGE_KEY || ""',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: opts.temperature ?? 0.5,
          max_tokens: opts.maxTokens || modelInfo?.maxTokens || 4000,
          stream: false,
        }),
        signal: AbortSignal.timeout(opts.timeoutMs || 8000),
      });
      if (res.ok) return await res.json();
      console.error('[llm] VPS bridge returned', res.status);
    } catch (e) {
      console.error('[llm] VPS bridge failed:', e);
    }

    // Path 2: Sandbox proxy (fallback)
    try {
      const res = await fetch(`${SANDBOX_PROXY_URL}/api/chat/rotated`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': SANDBOX_PROXY_KEY,
        },
        body: JSON.stringify({
          messages,
          model,
          temperature: opts.temperature ?? 0.5,
          max_tokens: opts.maxTokens || modelInfo?.maxTokens || 4000,
        }),
        signal: AbortSignal.timeout(opts.timeoutMs || 5000),
      });
      if (res.ok) return await res.json();
      console.error('[llm] Z.AI sandbox proxy returned', res.status);
    } catch (e) {
      console.error('[llm] Z.AI sandbox proxy failed:', e);
    }
  }

  return null;
}
