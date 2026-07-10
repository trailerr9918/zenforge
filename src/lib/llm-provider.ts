/**
 * Multi-Provider LLM Client
 * =========================
 *
 * Supports Mistral (PRIMARY — premium quality), Z.AI (fallback), and Groq (optional).
 *
 * ⚠️ MISTRAL IS THE DEFAULT AND PREFERRED PROVIDER.
 * GLM models must NEVER be used for website generation — only for review/vision
 * tasks where Mistral is unavailable.
 *
 * Mistral models (premium quality, direct API):
 *   - mistral-large-latest: Flagship, best for premium websites
 *   - mistral-small-latest: Fast, good for extraction
 *   - codestral-latest: Code/HTML specialist
 *
 * Groq models (free tier, OpenAI-compatible API):
 *   - llama-3.3-70b-versatile: Most intelligent, 1000 req/day
 *   - llama-3.1-8b-instant: Fastest, 14400 req/day
 *
 * Z.AI models (fallback only — via sandbox proxy with credential rotation):
 *   - glm-4-plus: More capable, good for reasoning
 *   - glm-4-flash: Fast, good for extraction
 */

export type LLMProvider = 'mistral' | 'zai' | 'groq' | 'auto';

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
  // Mistral models (PRIMARY — premium quality, recommended)
  {
    id: 'mistral-large-latest',
    label: 'Mistral Large (Recommended)',
    provider: 'mistral',
    description: 'Flagship — best for premium website generation',
    speed: 'balanced',
    intelligence: 'excellent',
    maxTokens: 8000,
  },
  {
    id: 'mistral-small-latest',
    label: 'Mistral Small',
    provider: 'mistral',
    description: 'Fast — good for extraction and quick tasks',
    speed: 'fast',
    intelligence: 'high',
    maxTokens: 8000,
  },
  {
    id: 'codestral-latest',
    label: 'Codestral',
    provider: 'mistral',
    description: 'Code/HTML specialist',
    speed: 'fast',
    intelligence: 'excellent',
    maxTokens: 8000,
  },
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
const MISTRAL_API_URL = 'https://api.mistral.ai/v1';
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || '';
const SANDBOX_PROXY_URL = 'https://preview-chat-5ee50f7f-17ae-4318-9880-b2d6472d29df.space-z.ai';
const SANDBOX_PROXY_KEY = process.env.VPS_BRIDGE_KEY || '';

// Get settings from localStorage (browser) or env (server)
export function getLLMSettings(): { provider: LLMProvider; model: string; groqKey: string } {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('sf-llm-settings');
    if (stored) {
      try { return JSON.parse(stored); } catch {}
    }
  }
  return {
    provider: (process.env.LLM_PROVIDER as LLMProvider) || 'mistral',
    model: process.env.LLM_MODEL || 'mistral-large-latest',
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
 * Call an LLM with retry logic and smart model switching.
 *
 * Retry: 3 attempts with exponential backoff (1s, 2s, 4s).
 * Smart switching: if a Large model fails, retries with Small.
 * Token tracking: accumulates usage stats on globalThis.
 *
 * Returns the OpenAI-compatible response, or null on failure.
 */

// Token usage tracker
interface TokenUsage { total: number; prompt: number; completion: number; calls: number; }
const usage: TokenUsage = { total: 0, prompt: 0, completion: 0, calls: 0 };
export function getTokenUsage(): TokenUsage { return { ...usage }; }
export function resetTokenUsage(): void { usage.total = 0; usage.prompt = 0; usage.completion = 0; usage.calls = 0; }

function trackUsage(data: any): void {
  if (data?.usage) {
    usage.total += data.usage.total_tokens || 0;
    usage.prompt += data.usage.prompt_tokens || 0;
    usage.completion += data.usage.completion_tokens || 0;
    usage.calls++;
  }
}

// Smart model switching: Large for reasoning, Small for fast tasks
export function getSmartModel(taskType: 'reasoning' | 'extraction' | 'code' | 'fast'): string {
  switch (taskType) {
    case 'reasoning': return 'mistral-large-latest';
    case 'code': return 'codestral-latest';
    case 'extraction': return 'mistral-small-latest';
    case 'fast': return 'mistral-small-latest';
    default: return 'mistral-large-latest';
  }
}

export async function callLLM(
  messages: Array<{ role: string; content: string }>,
  opts: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    provider?: LLMProvider;
    groqKey?: string;
    timeoutMs?: number;
    retries?: number;
  } = {},
): Promise<any | null> {
  const maxRetries = opts.retries ?? 3;
  const settings = getLLMSettings();
  let model = opts.model || settings.model;
  const provider = opts.provider || settings.provider;

  // === Retry loop with exponential backoff + smart model switching ===
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
      await new Promise(r => setTimeout(r, delay));
      // Smart switching: on retry 2+, downgrade to mistral-small for reliability
      if (attempt >= 2 && model.includes('large')) {
        console.warn('[llm] Retrying with mistral-small-latest (large failed twice)');
        model = 'mistral-small-latest';
      }
    }

    const modelInfo = getModelInfo(model);
    const actualProvider = provider === 'auto'
      ? (modelInfo?.provider || 'mistral')
      : provider;

    // === MISTRAL (PRIMARY) ===
    if (MISTRAL_API_KEY && (actualProvider === 'mistral' || modelInfo?.provider === 'mistral' || actualProvider === 'auto')) {
      try {
        const res = await fetch(`${MISTRAL_API_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${MISTRAL_API_KEY}`,
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
        if (res.ok) {
          const data = await res.json();
          trackUsage(data);
          return data;
        }
        const errText = await res.text().catch(() => '');
        console.warn(`[llm] Mistral attempt ${attempt + 1}/${maxRetries} returned ${res.status}: ${errText.slice(0, 100)}`);
        // Don't retry on 4xx (bad request) — only retry on 5xx or network errors
        if (res.status >= 400 && res.status < 500) break;
      } catch (e) {
        console.warn(`[llm] Mistral attempt ${attempt + 1}/${maxRetries} failed:`, e instanceof Error ? e.message : 'unknown');
      }
    }

    // === GROQ (fallback) ===
    if (actualProvider === 'groq' || modelInfo?.provider === 'groq') {
      const groqKey = opts.groqKey || settings.groqKey;
      if (groqKey) {
        try {
          const res = await fetch(`${GROQ_API_URL}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
            body: JSON.stringify({ model, messages, temperature: opts.temperature ?? 0.5, max_tokens: opts.maxTokens || modelInfo?.maxTokens || 4000, stream: false }),
            signal: AbortSignal.timeout(opts.timeoutMs || 30000),
          });
          if (res.ok) {
            const data = await res.json();
            trackUsage(data);
            return data;
          }
        } catch (e) {
          console.error('[llm] Groq failed:', e);
        }
      }
    }

    // === Z.AI (last resort) ===
    if (actualProvider === 'zai' || modelInfo?.provider === 'zai' || actualProvider === 'auto') {
      try {
        const res = await fetch(`${SANDBOX_PROXY_URL}/api/chat/rotated`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': SANDBOX_PROXY_KEY },
          body: JSON.stringify({ messages, model, temperature: opts.temperature ?? 0.5, max_tokens: opts.maxTokens || modelInfo?.maxTokens || 4000 }),
          signal: AbortSignal.timeout(opts.timeoutMs || 5000),
        });
        if (res.ok) {
          const data = await res.json();
          trackUsage(data);
          return data;
        }
      } catch (e) {
        console.error('[llm] Z.AI failed:', e);
      }
    }
  }

  return null;
}
