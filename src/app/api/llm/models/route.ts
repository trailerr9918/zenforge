import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/llm/models
 * Returns the list of available LLM models across all providers.
 */
export async function GET() {
  return NextResponse.json({
    models: [
      {
        id: 'llama-3.3-70b-versatile',
        label: 'Llama 3.3 70B',
        provider: 'groq',
        description: 'Most intelligent — best for complex reasoning and design decisions',
        speed: 'fast',
        intelligence: 'excellent',
        maxTokens: 8000,
        free: true,
        dailyLimit: '1000 req/day',
      },
      {
        id: 'llama-3.1-8b-instant',
        label: 'Llama 3.1 8B Instant',
        provider: 'groq',
        description: 'Fastest model — instant responses, great for quick extractions',
        speed: 'instant',
        intelligence: 'good',
        maxTokens: 8000,
        free: true,
        dailyLimit: '14400 req/day',
      },
      {
        id: 'mixtral-8x7b-32768',
        label: 'Mixtral 8x7B',
        provider: 'groq',
        description: 'Balanced — good speed + intelligence, 32K context window',
        speed: 'fast',
        intelligence: 'high',
        maxTokens: 8000,
        free: true,
        dailyLimit: '14400 req/day',
      },
      {
        id: 'glm-4-flash',
        label: 'GLM-4 Flash (Z.AI)',
        provider: 'zai',
        description: 'Z.AI fast model — good for structured extraction',
        speed: 'fast',
        intelligence: 'good',
        maxTokens: 4000,
        free: true,
        dailyLimit: '~300 req/day per credential',
      },
      {
        id: 'glm-4-plus',
        label: 'GLM-4 Plus (Z.AI)',
        provider: 'zai',
        description: 'Z.AI capable model — better reasoning, slower',
        speed: 'balanced',
        intelligence: 'high',
        maxTokens: 4000,
        free: true,
        dailyLimit: '~300 req/day per credential',
      },
    ],
    providers: {
      groq: {
        name: 'Groq',
        url: 'https://console.groq.com/keys',
        description: 'Free, fast, generous limits. Get your API key at console.groq.com',
        requiresKey: true,
      },
      zai: {
        name: 'Z.AI',
        url: 'https://z.ai',
        description: 'Built-in proxy with 7 credentials. No key needed.',
        requiresKey: false,
      },
    },
  });
}
