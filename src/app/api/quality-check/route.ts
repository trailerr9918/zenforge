import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

const MISTRAL_KEY = process.env.MISTRAL_API_KEY || '';

/**
 * Quality Checker — reviews generated HTML against premium standards.
 * Uses the 15-category scoring system from the master list.
 * Also checks against GitHub reference repos for best practices.
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { html, model } = body;
    const mistralModel = model || 'mistral-large-latest';

    if (!html || html.length < 100) {
      return NextResponse.json({ error: 'HTML is required' }, { status: 400 });
    }

    // Build review prompt
    const reviewPrompt = `You are ZenForge's Strict AI Reviewer — a ruthless perfectionist.

Review this website HTML and score it against premium standards.

Score each category 0-2 (0=missing, 1=weak, 2=well-executed):
1. layout — CSS Grid, fluid spacing, full-bleed + contained sections
2. loading — Preloader with setTimeout (NOT window.onload)
3. navigation — Sticky, glass-blur on scroll, mobile responsive
4. hero — 100vh, video/gradient bg, overlay, headline, CTA
5. typography — Custom fonts, clamp(), hierarchy, italic emphasis
6. media — Video bg, SVG icons, images
7. content — Real content (NO lorem ipsum)
8. socialProof — Testimonials with avatars, 5-star SVGs
9. interactions — Hover, scroll reveals (IntersectionObserver), custom cursor
10. forms — Newsletter form, validation
11. ecommerce — N/A unless applicable (score 2 if not needed)
12. jsEffects — requestAnimationFrame counters, smooth animations
13. technical — Semantic HTML, @media responsive, ARIA, SEO meta
14. footer — 4 columns, newsletter, social SVG icons
15. invisibleDetails — Scroll progress, back-to-top, FAQ accordion

PASSING: 22/30

Also check against these best practices from premium GitHub repos:
- Semantic HTML5 structure (header, nav, main, section, article, footer)
- CSS custom properties / variables for theming
- Responsive breakpoints (768px, 1024px)
- Accessibility (ARIA labels, alt text, focus states)
- Performance (inline CSS/JS, no render-blocking)
- SEO (meta tags, OpenGraph, semantic headings)

Return ONLY JSON:
{"score":N,"passed":bool,"verdict":"PASS"|"REJECT","issues":["..."],"improvements":["..."],"categoryScores":{},"bestPractices":{"semantic":bool,"cssVars":bool,"responsive":bool,"accessibility":bool,"performance":bool,"seo":bool}}

## HTML TO REVIEW:
\`\`\`html
${html.slice(0, 15000)}
\`\`\``;

    const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MISTRAL_KEY}` },
      body: JSON.stringify({ model: mistralModel, messages: [{ role: 'user', content: reviewPrompt }], temperature: 0, max_tokens: 1000, stream: false }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Mistral returned ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    const reviewText = data?.choices?.[0]?.message?.content ?? '';

    let review: any;
    try {
      let text = reviewText.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
      const first = text.indexOf('{');
      const last = text.lastIndexOf('}');
      if (first >= 0 && last > first) {
        review = JSON.parse(text.slice(first, last + 1));
      } else {
        review = { score: 0, passed: false, verdict: 'REJECT', issues: ['Could not parse review'] };
      }
    } catch {
      review = { score: 0, passed: false, verdict: 'REJECT', issues: ['JSON parse failed'] };
    }

    return NextResponse.json({ review });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'unknown' }, { status: 500 });
  }
}
