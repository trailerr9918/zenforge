/**
 * Edge function: LLM Extraction Proxy (Streaming version)
 * =========================================================
 *
 * Streams the LLM response back to the browser to keep the connection alive
 * past Vercel's timeout limits. The browser receives the full response even
 * if the LLM takes 30+ seconds.
 *
 * Flow:
 *   Browser → POST /api/llm-extract (Edge, streaming) → VPS bridge → Z.AI
 *   Browser accumulates streamed chunks → sends to /api/recreate for rendering
 */

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const VPS_BRIDGE_URL = process.env.VPS_BRIDGE_URL || 'http://localhost:8765';
const VPS_BRIDGE_KEY = process.env.VPS_BRIDGE_KEY || process.env.VPS_BRIDGE_KEY || '';
const MISTRAL_KEY = process.env.MISTRAL_API_KEY || '';

const EXTRACTION_SYSTEM_PROMPT = `You are a website spec extractor. You read a website design prompt and extract a structured JSON spec that exactly captures what the prompt describes — no more, no less.

CRITICAL RULES:
1. Return ONLY valid JSON. No markdown fences, no commentary, no preamble.
2. ONLY include sections that the prompt ACTUALLY describes. If the prompt only describes a hero section, return exactly ONE section (the hero). Do NOT invent additional body/footer/pricing/testimonial sections that the prompt does not describe.
3. Use the EXACT copy (headline, description, CTA text, nav items, logo) from the prompt — preserve punctuation, italics emphasis, and trademark symbols.
4. Use the EXACT colors (hex) and fonts (family names) from the prompt.
5. If a value is not specified in the prompt, use null for strings or omit the field. Do NOT make up values.
6. The "sections" array reflects the actual structural order described in the prompt.

OUTPUT JSON SHAPE:
{
  "businessName": "string — name without trademark symbols",
  "logo": "string — logo text including ®™© if specified",
  "tagline": "string | null",
  "fonts": {
    "display": "FontName | null — used for headings/logo",
    "body": "FontName | null — used for body/nav",
    "accentFont": "FontName | null — used for cursive/script accents",
    "weights": [400, 500]
  },
  "colors": {
    "bg": "#hex — page background",
    "text": "#hex — primary text/headlines",
    "muted": "#hex | null — secondary text/descriptions",
    "accent": "#hex | null — accent color for highlights/CTAs",
    "surface": "#hex | null — card/panel backgrounds",
    "border": "#hex | null — borders"
  },
  "promptType": "hero | landing-page | footer | portfolio | saas | features | 404 | blog | agency | product | pricing | contact",
  "navItems": ["string", "..."],
  "ctaText": "string — primary CTA button label",
  "sections": [
    {
      "type": "hero-video | hero-centered | hero-split | hero-image | features-grid | stats-row | gallery-masonry | gallery-grid | partners-row | cta-band | testimonials | faq-accordion | about-text | pricing | contact-form | footer | team-grid | blog-list | custom",
      "id": "kebab-case-id",
      "headline": "string | null — exact headline text from prompt",
      "emphasizedWords": ["phrase1", "phrase2"],
      "accentText": "string | null — cursive/script overlay text rendered in the accentFont alongside the headline",
      "body": "string | null — section description / body copy",
      "items": [{"title": "string", "description": "string", "icon": "string | null", "mediaUrl": "string | null", "meta": "string | null"}],
      "cta": "string | null",
      "mediaUrl": "string | null — primary media (video/image) for this section",
      "animation": "fade-rise | fade | blur | ken-burns | parallax | scale | slide | rotate | none",
      "styleHints": "string — extra CSS like 'letter-spacing:-2.46px;line-height:0.95' or empty string",
      "bg": "#hex | null — section background override",
      "color": "#hex | null — section text color override"
    }
  ],
  "animations": [{"name": "string", "definition": "human-readable definition"}],
  "media": {"videoUrls": ["..."], "imageUrls": ["..."]},
  "styleHints": "string — global CSS hints like 'liquid-glass UI effect, texture overlay' or empty string"
}

NOTES:
- For a "Hero Section" prompt: return ONE section of type "hero-video" (if video bg) or "hero-centered" (if solid bg) or "hero-split" (if two-column) or "hero-image" (if image bg). Do NOT add features/stats/footer sections.
- For a "Landing Page" prompt: return all sections described (hero + features + stats + partners + cta + footer etc.) in order.
- For a "Footer Section" prompt: return ONE section of type "footer".
- "emphasizedWords": only fill if the prompt specifies italic / different-color words inside the headline.
- "accentText": cursive/script overlay text rendered in the accentFont alongside the headline.
- "items": for features-grid = feature cards; for stats-row = stat items; for gallery-grid = NFT cards with rarity scores in title.
- "accentFont": include if the prompt mentions a cursive/script accent font alongside the main display font.
- "styleHints": include any global UI effect hints like "liquid-glass UI effect", "texture overlay".
- Keep "body" copy verbatim from the prompt — do not paraphrase.`;

export async function POST(req: Request): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const body = await req.json();
    const { promptText, promptTitle, promptCategory, promptType, model } = body;

    if (!promptText) {
      return new Response(JSON.stringify({ error: 'promptText is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log('[llm-extract] Extracting spec for:', promptTitle, `(${promptText.length} chars)`);

    // Determine provider and model
    // Mistral is the default (works from server, fast, no 403 blocks)
    const requestedModel = model || '';
    const isMistralModel = requestedModel.startsWith('mistral') || requestedModel.startsWith('codestral') || requestedModel.startsWith('magistral') || !requestedModel || requestedModel === 'auto';
    
    const messages = [
      { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
      {
        role: 'user',
        content:
          `Extract the structured spec from this website design prompt.\n\n` +
          `PROMPT TITLE: ${promptTitle || ''}\n` +
          `PROMPT CATEGORY: ${promptCategory || ''}\n` +
          `PROMPT TYPE: ${promptType || ''}\n\n` +
          `PROMPT TEXT:\n"""\n${promptText}\n"""\n\n` +
          `Return ONLY the JSON.`,
      },
    ];

    let response: Response;

    if (isMistralModel && MISTRAL_KEY) {
      // === Mistral path (fast, works from server) ===
      const mistralModel = requestedModel && requestedModel !== 'auto' ? requestedModel : 'mistral-small-latest';
      console.log('[llm-extract] Using Mistral:', mistralModel);
      response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MISTRAL_KEY}`,
        },
        body: JSON.stringify({
          model: mistralModel,
          messages,
          temperature: 0,
          max_tokens: 6000,
          stream: true,
        }),
      });
    } else {
      // === VPS bridge / Z.AI path (fallback) ===
      const zaiModel = requestedModel || (promptText.length < 5000 ? 'glm-4-flash' : 'glm-4-plus');
      console.log('[llm-extract] Using VPS bridge (Z.AI):', zaiModel);
      response = await fetch(`${VPS_BRIDGE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${VPS_BRIDGE_KEY}`,
        },
        body: JSON.stringify({
          model: zaiModel,
          messages,
          temperature: 0,
          max_tokens: 6000,
          stream: true,
          top_p: 0.9,
        }),
      });
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.error('[llm-extract] LLM provider returned', response.status, errText.slice(0, 200));
      return new Response(JSON.stringify({ error: `LLM provider returned ${response.status}` }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Stream the response back to the browser.
    // We transform the SSE stream into a simple text stream
    // that the browser can accumulate.
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }
        const decoder = new TextDecoder();
        let buffer = ''; // Buffer for partial SSE lines

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            
            // Process complete lines (ending with \n)
            const lines = buffer.split('\n');
            // Keep the last (potentially incomplete) line in the buffer
            buffer = lines.pop() || '';
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                if (data === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(data);
                  const delta = parsed?.choices?.[0]?.delta?.content || '';
                  if (delta) {
                    controller.enqueue(encoder.encode(delta));
                  }
                } catch {
                  // Not valid JSON, skip
                }
              }
            }
          }
          
          // Process any remaining data in buffer
          if (buffer.startsWith('data: ')) {
            const data = buffer.slice(6).trim();
            if (data && data !== '[DONE]') {
              try {
                const parsed = JSON.parse(data);
                const delta = parsed?.choices?.[0]?.delta?.content || '';
                if (delta) {
                  controller.enqueue(encoder.encode(delta));
                }
              } catch {}
            }
          }
          
          controller.enqueue(encoder.encode('\n|||EXTRACTION_COMPLETE|||'));
        } catch (e) {
          console.error('[llm-extract] Stream error:', e);
          controller.enqueue(encoder.encode(`\n|||EXTRACTION_ERROR|||${e instanceof Error ? e.message : 'unknown'}`));
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
        ...corsHeaders,
      },
    });
  } catch (e) {
    console.error('[llm-extract] Error:', e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'unknown' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
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
