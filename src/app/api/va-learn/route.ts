import { NextRequest, NextResponse } from 'next/server';
import { buildLearningPrompt } from '@/lib/learning-system';
import { STRICT_REVIEWER_PROMPT } from '@/lib/va-teaching-system';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const MISTRAL_KEY = process.env.MISTRAL_API_KEY || '';

/**
 * VA Learn — Uses the 100 learning websites to teach the LLM.
 * This is a serverless function (not edge) so it can use fs.
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, businessName, model } = body;
    const mistralModel = model || 'mistral-large-latest';

    // Build learning prompt from 100 training websites
    const learningPrompt = buildLearningPrompt(businessName || 'ZenForge Site', prompt || 'premium website');

    // Generate
    const genResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MISTRAL_KEY}`,
      },
      body: JSON.stringify({
        model: mistralModel,
        messages: [{ role: 'user', content: learningPrompt }],
        temperature: 0.8,
        max_tokens: 8000,
        stream: false,
      }),
    });

    if (!genResponse.ok) {
      return NextResponse.json({ error: `Mistral returned ${genResponse.status}` }, { status: 502 });
    }

    const genData = await genResponse.json();
    let html = genData?.choices?.[0]?.message?.content ?? '';
    html = html.replace(/^```(?:html)?\s*/i, '').replace(/\s*```\s*$/i, '');
    const docIdx = html.indexOf('<!DOCTYPE');
    if (docIdx > 0) html = html.slice(docIdx);

    if (html.length < 2000) {
      return NextResponse.json({ error: 'Generated HTML too short' }, { status: 500 });
    }

    // Review
    const reviewPrompt = `${STRICT_REVIEWER_PROMPT}\n\n## WEBSITE HTML TO REVIEW\n\`\`\`html\n${html.slice(0, 15000)}\n\`\`\`\n\nReturn ONLY the JSON.`;
    const reviewResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MISTRAL_KEY}`,
      },
      body: JSON.stringify({
        model: mistralModel,
        messages: [{ role: 'user', content: reviewPrompt }],
        temperature: 0,
        max_tokens: 1000,
        stream: false,
      }),
    });

    let review: any = { score: 0, passed: false, verdict: 'REJECT' };
    if (reviewResponse.ok) {
      const reviewData = await reviewResponse.json();
      const reviewText = reviewData?.choices?.[0]?.message?.content ?? '';
      try {
        let text = reviewText.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
        const first = text.indexOf('{');
        const last = text.lastIndexOf('}');
        if (first >= 0 && last > first) {
          review = JSON.parse(text.slice(first, last + 1));
        }
      } catch {}
    }

    // Save
    let slug = '';
    let viewUrl = '';
    try {
      const { supabase } = await import('@/lib/supabase-client');
      slug = `${(businessName || 'zenforge').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}-${Math.random().toString(36).slice(2, 6)}`;
      await supabase.from('websites').upsert({
        id: slug, html, business_name: businessName || 'ZenForge Site',
        business_type: 'va-learn', config: { renderer: 'va-learn-v1', reviewScore: review.score, review },
      });
      const host = req.headers.get('host');
      const protocol = req.headers.get('x-forwarded-proto') || 'https';
      viewUrl = `${protocol}://${host}/s/${slug}`;
    } catch (e) { console.error('[va-learn] Save error:', e); }

    return NextResponse.json({
      html, slug, viewUrl,
      businessName: businessName || 'ZenForge Site',
      review, score: review.score, passed: review.score >= 22,
      htmlSize: html.length,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'unknown' }, { status: 500 });
  }
}
