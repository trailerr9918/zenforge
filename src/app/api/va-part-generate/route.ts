import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const MISTRAL_KEY = process.env.MISTRAL_API_KEY || '';

/**
 * VA Part Generator — generates individual premium website PARTS (not full websites).
 *
 * The VA 24/7 autonomous loop calls this to produce heroes, navs, cards, footers,
 * CTAs, typography systems, effects, etc. Each part is a self-contained HTML
 * snippet with inline CSS+JS that can be reviewed, rated, and promoted to the
 * Pattern Explorer.
 *
 * Caged Lion Protocol:
 *   Phase 1 (internal): Research & Planning — picks part type + style
 *   Phase 2: Structured spec — defines exact colors, fonts, animations
 *   Phase 3: Implementation — Mistral generates the HTML
 *   Phase 4: Self-critique — Mistral reviews its own output
 *   Phase 5: Strict review — separate /api/va-part-review call
 *
 * Body: {
 *   partType: 'hero' | 'nav' | 'card' | 'footer' | 'cta' | 'typography' | 'effects' | 'features',
 *   style?: 'cinematic' | 'editorial' | 'glassmorphic' | 'brutalist' | 'minimal' | 'warm',
 *   businessContext?: string,  // e.g. "luxury fashion brand"
 *   model?: string,            // default mistral-large-latest
 * }
 *
 * Response: NDJSON stream of { step, message? } then { step: 'done', html, spec, partType, style }
 */

interface PartRequest {
  partType: string;
  style?: string;
  businessContext?: string;
  model?: string;
}

const PART_TYPES: Record<string, { desc: string; requirements: string }> = {
  hero: {
    desc: 'hero section',
    requirements: 'Full-viewport (100vh) hero with bold headline, subheadline, CTA button, background treatment (gradient mesh, video overlay, or glassmorphism), scroll-reveal animation',
  },
  nav: {
    desc: 'navigation bar',
    requirements: 'Sticky nav with glass-blur on scroll, logo, 4-5 nav links, CTA button, mobile hamburger, smooth transitions',
  },
  card: {
    desc: 'feature card set (3 cards)',
    requirements: '3 glassmorphism cards with backdrop-filter blur, gradient borders, icon, title, description, hover lift + glow effect, staggered scroll reveal',
  },
  footer: {
    desc: 'footer section',
    requirements: '4-column footer with newsletter form, SVG social icons (Twitter, GitHub, LinkedIn, Instagram), copyright bar, dark background with subtle gradient',
  },
  cta: {
    desc: 'CTA band section',
    requirements: 'Full-width CTA with gradient or video background, bold headline, subheadline, prominent button with hover animation, scroll-reveal',
  },
  typography: {
    desc: 'typography showcase section',
    requirements: 'Display font + body font pairing, fluid clamp() sizes, italic emphasis, letter-spacing hierarchy, gradient text on key words',
  },
  effects: {
    desc: 'effects/animation showcase',
    requirements: 'Custom cursor, parallax scroll, blur-rise reveal, Ken Burns zoom, magnetic buttons, staggered delays',
  },
  features: {
    desc: 'features section',
    requirements: '6 feature cards in a responsive grid, each with icon, title, description, hover effect, glassmorphism, scroll-reveal staggered',
  },
};

const STYLES: Record<string, { palette: string; mood: string }> = {
  cinematic: { palette: '#0A0A0A bg, #FFFFFF text, #DCFF00 accent', mood: 'dark, dramatic, video-driven' },
  editorial: { palette: '#FAFAF7 bg, #1A1A1A text, #E63946 accent', mood: 'light, serif, magazine-like' },
  glassmorphic: { palette: '#0F0E17 bg, #FFFFFE text, #A78BFA accent', mood: 'blur, transparency, gradient mesh' },
  brutalist: { palette: '#0A0A0A bg, #FFFFFF text, #FF00FF accent', mood: 'bold, raw, high contrast' },
  minimal: { palette: '#FFFFFF bg, #0A0A0A text, #6366F1 accent', mood: 'whitespace, subtle, clean' },
  warm: { palette: '#1A1208 bg, #F5F0E8 text, #E8702A accent', mood: 'earthy, organic, inviting' },
};

async function callMistral(model: string, messages: any[], maxTokens: number, temp: number): Promise<string> {
  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MISTRAL_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: temp,
      max_tokens: maxTokens,
      stream: false,
    }),
    signal: AbortSignal.timeout(45000),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Mistral ${response.status}: ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content ?? '';
}

export async function POST(req: NextRequest) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const body: PartRequest = await req.json();
    const partType = body.partType || 'hero';
    const style = body.style || ['cinematic', 'editorial', 'glassmorphic', 'minimal', 'warm'][Math.floor(Math.random() * 5)];
    const businessContext = body.businessContext || 'a premium brand';
    const model = body.model || 'mistral-large-latest';

    if (!MISTRAL_KEY) {
      return NextResponse.json({ error: 'MISTRAL_API_KEY not set' }, { status: 500, headers: corsHeaders });
    }

    const partInfo = PART_TYPES[partType];
    if (!partInfo) {
      return NextResponse.json({ error: `Unknown part type: ${partType}` }, { status: 400, headers: corsHeaders });
    }
    const styleInfo = STYLES[style];
    if (!styleInfo) {
      return NextResponse.json({ error: `Unknown style: ${style}` }, { status: 400, headers: corsHeaders });
    }

    // Stream NDJSON
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (obj: any) => controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'));

        try {
          // === Phase 1: Research & Planning ===
          send({ step: 'thinking', message: `Analyzing catalog for ${partType} (${style} style)...` });
          send({ step: 'thinking', message: `Loading MotionSites + UI Pro Max + Awesome Design references...` });

          // === Phase 2: Structured Spec ===
          send({ step: 'thinking', message: `Building spec: ${styleInfo.palette}, ${styleInfo.mood}...` });

          // === Phase 3: Implementation — Mistral generates the part ===
          send({ step: 'thinking', message: `Generating ${partInfo.desc} with Mistral ${model}...` });

          const generationPrompt = `You are ZenForge's Virtual Artist — an elite premium web designer. Generate a SINGLE ${partInfo.desc} for ${businessContext}.

## DESIGN SYSTEM (use these exact values)
- Palette: ${styleInfo.palette}
- Mood: ${styleInfo.mood}
- Use Google Fonts (Instrument Serif for display, Inter for body — OR Playfair Display + Source Sans 3 for editorial style)

## REQUIREMENTS
${partInfo.requirements}

## 16 PREMIUM FEATURES (must include all that apply to this part type)
1. Semantic HTML5 tags (<section>, <nav>, <header>, <footer>, <article>)
2. CSS Custom Properties (:root { --accent: ... })
3. Fluid typography with clamp() for ALL text sizes
4. Glassmorphism (backdrop-filter: blur(20px) + rgba borders) where cards exist
5. Gradient accents + hover effects (glow, scale, translateY)
6. Strong visual hierarchy + breathing room
7. Responsive @media (max-width: 768px) and (max-width: 1024px)
8. IntersectionObserver scroll reveals (.reveal + .delay-1/.delay-2/.delay-3 classes)
9. Animated counters if stats exist (requestAnimationFrame + data-target)
10. Scroll progress bar (if full page context)
11. Back-to-top button (if full page context)
12. Smooth FAQ accordion if FAQ exists
13. Testimonials with avatars + 5-star SVG ratings if testimonials exist
14. Newsletter form in footer if footer exists
15. Preloader with setTimeout(2000) hide
16. Custom cursor (pointer:fine check)

## ANTI-SLOP RULES (CRITICAL)
- NO generic templates. This must feel unique and premium.
- NO lorem ipsum. Use real, persuasive copy about ${businessContext}.
- NO repeated layouts from previous generations.
- NO default blue as the only accent.
- MUST use fluid clamp() typography.
- MUST include scroll-reveal animations.
- MUST have strong visual hierarchy with intentional whitespace.

## OUTPUT FORMAT
Return ONLY a complete HTML snippet (no <!DOCTYPE>, no <html>, no <head> — just the section(s) with inline <style> and <script>).
Start with <style> then the HTML then <script> if needed.
Keep it under 8KB. Single self-contained block.`;

          let html = await callMistral(model, [
            { role: 'system', content: 'You are an elite premium web designer. Output ONLY HTML/CSS/JS — no explanations, no markdown fences.' },
            { role: 'user', content: generationPrompt },
          ], 4000, 0.7);

          // Clean up markdown fences if present
          html = html.replace(/^```(?:html)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

          if (!html || html.length < 200) {
            throw new Error('Generated HTML too short');
          }

          send({ step: 'thinking', message: `Part generated (${html.length} bytes). Running self-critique...` });

          // === Phase 4: Self-Critique ===
          const critiquePrompt = `You are a strict design reviewer. Review this HTML/CSS/JS snippet and score it 0-30 based on:
- Visual hierarchy (5pts)
- Typography quality + clamp() usage (5pts)
- Color/contrast/glassmorphism (5pts)
- Responsive + accessibility (5pts)
- Animation/interaction quality (5pts)
- Overall premium feel (5pts)

Return ONLY JSON: {"score": N, "verdict": "PASS"|"REJECT", "issues": ["..."], "strengths": ["..."]}

HTML TO REVIEW:
${html.slice(0, 6000)}`;

          let reviewText = await callMistral(model, [
            { role: 'user', content: critiquePrompt },
          ], 500, 0.0);

          let review: any;
          try {
            let text = reviewText.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
            const first = text.indexOf('{');
            const last = text.lastIndexOf('}');
            if (first >= 0 && last > first) {
              review = JSON.parse(text.slice(first, last + 1));
            } else {
              review = { score: 15, verdict: 'REJECT', issues: ['Could not parse review'], strengths: [] };
            }
          } catch {
            review = { score: 15, verdict: 'REJECT', issues: ['Review JSON invalid'], strengths: [] };
          }

          send({ step: 'thinking', message: `Review complete: ${review.score}/30 — ${review.verdict}` });

          // === Phase 5: Done ===
          send({
            step: 'done',
            html,
            partType,
            style,
            businessContext,
            review,
            score: review.score,
            spec: {
              partType,
              style,
              palette: styleInfo.palette,
              mood: styleInfo.mood,
              model,
            },
          });

          controller.close();
        } catch (e) {
          send({ step: 'error', message: e instanceof Error ? e.message : 'unknown error' });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        ...corsHeaders,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'unknown' },
      { status: 500, headers: corsHeaders },
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
