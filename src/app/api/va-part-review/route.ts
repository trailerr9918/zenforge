import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

const MISTRAL_KEY = process.env.MISTRAL_API_KEY || '';

/**
 * VA Part Reviewer — strict 30-point review of a generated HTML part.
 *
 * Scores across 6 categories (5pts each):
 *   1. Visual hierarchy
 *   2. Typography (clamp, hierarchy, fonts)
 *   3. Color/contrast/glassmorphism
 *   4. Responsive + accessibility
 *   5. Animation/interaction quality
 *   6. Overall premium feel
 *
 * Returns: { score, verdict, issues, strengths, categoryScores }
 *
 * Passing threshold: 22/30
 */

async function callMistral(model: string, messages: any[], maxTokens: number, temp: number): Promise<string> {
  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: method_POST(),
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
    signal: AbortSignal.timeout(20000),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Mistral ${response.status}: ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content ?? '';
}

// Fix: helper to avoid TS confusion
function method_POST(): string { return 'POST'; }

export async function POST(req: NextRequest) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const body = await req.json();
    const { html, partType, model } = body;

    if (!html || html.length < 100) {
      return NextResponse.json({ error: 'HTML required (min 100 chars)' }, { status: 400, headers: corsHeaders });
    }

    if (!MISTRAL_KEY) {
      return NextResponse.json({ error: 'MISTRAL_API_KEY not set' }, { status: 500, headers: corsHeaders });
    }

    const mistralModel = model || 'mistral-small-latest';

    const reviewPrompt = `You are ZenForge's Strict AI Reviewer — a ruthless perfectionist.

Review this ${partType || 'website part'} HTML and score it against premium standards.

Score each category 0-5 (0=missing, 1=weak, 3=acceptable, 5=well-executed):
1. hierarchy — visual hierarchy, spacing, breathing room, intentional whitespace
2. typography — clamp() usage, font hierarchy, letter-spacing, line-height, custom fonts
3. color — palette discipline, contrast, glassmorphism, gradient accents
4. responsive — @media breakpoints, mobile-first, accessibility (ARIA, alt, focus)
5. animation — scroll reveals, hover effects, IntersectionObserver, smooth transitions
6. premium — overall cohesion, originality, "$50K agency" feel

PASSING: 22/30

Also check against best practices from premium GitHub repos:
- Semantic HTML5 structure
- CSS custom properties for theming
- Responsive breakpoints (768px, 1024px)
- Accessibility (ARIA labels, focus states)
- Performance (inline CSS/JS, no render-blocking)

Return ONLY JSON:
{"score":N,"passed":bool,"verdict":"PASS"|"REJECT","issues":["..."],"strengths":["..."],"categoryScores":{"hierarchy":N,"typography":N,"color":N,"responsive":N,"animation":N,"premium":N}}

## HTML TO REVIEW:
${html.slice(0, 12000)}`;

    const reviewText = await callMistral(mistralModel, [
      { role: 'user', content: reviewPrompt },
    ], 800, 0.0);

    let review: any;
    try {
      let text = reviewText.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
      const first = text.indexOf('{');
      const last = text.lastIndexOf('}');
      if (first >= 0 && last > first) {
        review = JSON.parse(text.slice(first, last + 1));
      } else {
        review = { score: 0, passed: false, verdict: 'REJECT', issues: ['Could not parse review JSON'], strengths: [], categoryScores: {} };
      }
    } catch {
      review = { score: 0, passed: false, verdict: 'REJECT', issues: ['Review JSON invalid'], strengths: [], categoryScores: {} };
    }

    return NextResponse.json({ review, partType: partType || 'unknown' }, { headers: corsHeaders });
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
