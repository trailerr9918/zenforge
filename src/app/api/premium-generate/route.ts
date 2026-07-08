import { PREMIUM_GENERATION_PROMPT, generateWebsiteSeed, TECHNIQUE_LIBRARY, HERO_VIDEO_POOL, SECTION_VIDEO_POOL, FONT_PAIRINGS } from '@/lib/premium-website-system';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const VPS_BRIDGE_URL = process.env.VPS_BRIDGE_URL || 'http://localhost:8765';
const VPS_BRIDGE_KEY = process.env.VPS_BRIDGE_KEY || process.env.VPS_BRIDGE_KEY || '';
const MISTRAL_KEY = process.env.MISTRAL_API_KEY || '';

/**
 * Premium LLM Website Generator (Edge function with streaming)
 * =================================================================
 *
 * Provider priority:
 *   1. Mistral (works from server, fast, no 403 blocks) — RECOMMENDED
 *   2. VPS bridge / Z.AI (glm-4-plus, slower)
 *   3. Client-side Groq (passed via groqExtraction)
 *
 * Uses streaming to bypass Vercel's 10s timeout.
 */

interface PremiumRequest {
  prompt: string;
  businessName?: string;
  provider?: 'mistral' | 'zai' | 'auto';
  model?: string;
  customConfig?: {
    colors?: { bg?: string; primary?: string; accent?: string };
    fonts?: { display?: string; body?: string };
    style?: string;
    features?: string[];
  };
  groqExtraction?: any;
}

function detectBizType(prompt: string): string {
  const p = prompt.toLowerCase();
  if (p.match(/coffee|cafe|espresso|barista/)) return 'restaurant';
  if (p.match(/restaurant|dining|chef|menu|food/)) return 'restaurant';
  if (p.match(/tech|startup|saas|software|app|platform|ai|crypto|blockchain/)) return 'tech';
  if (p.match(/salon|spa|beauty|hair|cosmetic/)) return 'beauty';
  if (p.match(/gym|fitness|yoga|wellness/)) return 'fitness';
  if (p.match(/hotel|resort|travel|tourism/)) return 'ecommerce';
  if (p.match(/agency|studio|creative|design|brand/)) return 'agency';
  if (p.match(/shop|store|ecommerce|retail|fashion/)) return 'ecommerce';
  return 'default';
}

export async function POST(req: Request): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const body: PremiumRequest = await req.json();
    const userPrompt = body.prompt || 'modern premium website';
    const businessName = body.businessName || '';
    const provider = body.provider || 'auto';

    const bizType = detectBizType(userPrompt);
    const seed = generateWebsiteSeed(businessName || userPrompt, bizType);
    const ds = seed.designSystem;

    const fullPrompt = `${PREMIUM_GENERATION_PROMPT}

## THIS WEBSITE'S DESIGN SYSTEM
- Background: ${ds.bg}
- Text: ${ds.text}
- Accent: ${ds.accent}
- Accent gradient: ${ds.accentGradient}
- Display font: ${ds.displayFont}
- Body font: ${ds.bodyFont}
- Nav font: ${ds.navFont}
- Mood: ${ds.mood}

## AVAILABLE VIDEO URLS (use these for hero/video backgrounds)
Hero videos (pick ONE for the hero section):
${HERO_VIDEO_POOL.map((v, i) => `${i + 1}. ${v}`).join('\n')}

Section videos (use for about/CTA sections):
${SECTION_VIDEO_POOL.map((v, i) => `${i + 1}. ${v}`).join('\n')}

## USER REQUEST
${userPrompt}

${businessName ? `## BUSINESS NAME\n${businessName}` : ''}

## TECHNIQUE LIBRARY (use these CSS/JS patterns)
${TECHNIQUE_LIBRARY}

## VARIETY SEED (use this to ensure uniqueness)
- Design system: ${ds.id} (${ds.name})
- Variation: ${seed.variation}
- Font pairing: ${ds.displayFont} + ${ds.bodyFont}
- This website MUST look different from any other website. Use the variation seed to create a unique layout, unique color treatment, and unique section arrangements.

## INSTRUCTIONS
Generate a COMPLETE, production-ready website HTML file for the business described above.
Use the design system specified. Include ALL 15 premium pillars.
Use video URLs from the list above for hero and CTA sections.
Make it visually stunning — the quality bar is a $50K agency website that wins Awwwards.
Return ONLY the HTML, starting with <!DOCTYPE html>.`;

    console.log('[premium-generate] Provider:', provider, '| Business:', businessName || userPrompt.slice(0, 50));

    // Path A: Use pre-computed client-side Groq extraction if provided
    if (body.groqExtraction) {
      try {
        const content = body.groqExtraction?.choices?.[0]?.message?.content ?? '';
        if (content.includes('<!DOCTYPE') || content.includes('<html')) {
          console.log('[premium-generate] Using pre-computed client-side extraction');
          return streamResponse(content, ds, corsHeaders);
        }
      } catch {}
    }

    // Determine provider
    const useMistral = provider === 'mistral' || (provider === 'auto' && MISTRAL_KEY);

    if (useMistral) {
      // === Mistral path (works from server, no 403, fast) ===
      console.log('[premium-generate] Using Mistral:', body.model || 'mistral-large-latest');
      const mistralModel = body.model || 'mistral-large-latest';
      const messages = [
        { role: 'user', content: fullPrompt + '\n\nGenerate the complete HTML website now. Return ONLY the HTML starting with <!DOCTYPE html>.' }
      ];

      try {
        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${MISTRAL_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: mistralModel,
            messages,
            temperature: 0.7,
            max_tokens: 8000,
            stream: true,
          }),
        });

        if (response.ok) {
          return streamSSEResponse(response, ds, corsHeaders);
        } else {
          const errText = await response.text().catch(() => '');
          console.error('[premium-generate] Mistral error:', response.status, errText.slice(0, 200));
          // Fall through to VPS bridge
        }
      } catch (e) {
        console.error('[premium-generate] Mistral failed:', e);
        // Fall through to VPS bridge
      }
    }

    // === VPS bridge / Z.AI path (fallback) ===
    console.log('[premium-generate] Using VPS bridge (Z.AI glm-4-plus)');
    const response = await fetch(`${VPS_BRIDGE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VPS_BRIDGE_KEY}`,
      },
      body: JSON.stringify({
        model: body.model || 'glm-4-plus',
        messages: [
          { role: 'system', content: fullPrompt },
          { role: 'user', content: 'Generate the complete HTML website now. Return ONLY the HTML.' },
        ],
        temperature: 0.7,
        max_tokens: 8000,
        stream: true,
        top_p: 0.9,
      }),
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: `All providers failed. Last: VPS bridge ${response.status}` }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return streamSSEResponse(response, ds, corsHeaders);
  } catch (e) {
    console.error('[premium-generate] Error:', e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'unknown' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

/** Stream a pre-computed HTML string back to the browser. */
function streamResponse(html: string, ds: any, corsHeaders: Record<string, string>): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(html));
      controller.enqueue(encoder.encode('|||GENERATION_COMPLETE|||'));
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Design-System': ds.id,
      'X-Design-System-Name': ds.name,
      ...corsHeaders,
    },
  });
}

/** Stream an SSE chat completion response, extracting content deltas. */
function streamSSEResponse(response: Response, ds: any, corsHeaders: Record<string, string>): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const reader = response.body?.getReader();
      if (!reader) {
        controller.close();
        return;
      }
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);
                const delta = parsed?.choices?.[0]?.delta?.content || parsed?.choices?.[0]?.message?.content || '';
                if (delta) {
                  controller.enqueue(encoder.encode(delta));
                }
              } catch {}
            }
          }
        }
        controller.enqueue(encoder.encode('|||GENERATION_COMPLETE|||'));
      } catch (e) {
        controller.enqueue(encoder.encode(`|||GENERATION_ERROR|||${e instanceof Error ? e.message : 'unknown'}`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Design-System': ds.id,
      'X-Design-System-Name': ds.name,
      ...corsHeaders,
    },
  });
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
