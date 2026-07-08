import { NextRequest, NextResponse } from 'next/server';
import { buildLearningPrompt } from '@/lib/learning-system';
import { appendMemory, readMemory, getMemorySummary } from '@/lib/va-memory';
import { STRICT_REVIEWER_PROMPT } from '@/lib/va-teaching-system';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const MISTRAL_KEY = process.env.MISTRAL_API_KEY || '';

const AUTONOMOUS_BUSINESSES = [
  { name: 'Aurora Wellness', desc: 'luxury wellness retreat in Iceland' },
  { name: 'Voltage EV', desc: 'electric vehicle charging network' },
  { name: 'Cipher Security', desc: 'cybersecurity SaaS platform' },
  { name: 'Bloom Flowers', desc: 'sustainable flower delivery service' },
  { name: 'Pulse Music', desc: 'music streaming platform for indie artists' },
  { name: 'Forge Fitness', desc: 'premium fitness coaching app' },
  { name: 'Nebula PM', desc: 'AI project management platform' },
  { name: 'Vela Fashion', desc: 'sustainable luxury fashion brand' },
  { name: 'Quantum Code', desc: 'AI-powered code review platform' },
  { name: 'Ember Coffee', desc: 'specialty coffee subscription service' },
];

/**
 * VA Autonomous — generates websites without user input.
 * Picks a random business, generates, reviews, and logs to memory.
 * Can be called on a timer or manually.
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || 'generate';
    const mistralModel = body.model || 'mistral-large-latest';

    if (action === 'status') {
      const summary = getMemorySummary();
      const memory = readMemory();
      return NextResponse.json({ summary, memory: memory.slice(0, 5000), memoryLength: memory.length });
    }

    if (action === 'generate') {
      // Pick random business
      const biz = AUTONOMOUS_BUSINESSES[Math.floor(Math.random() * AUTONOMOUS_BUSINESSES.length)];
      const timestamp = new Date().toISOString();

      appendMemory({ timestamp, type: 'generate', content: `Starting autonomous generation for ${biz.name} (${biz.desc})` });

      // Build learning prompt
      const learningPrompt = buildLearningPrompt(biz.name, biz.desc);

      // Generate
      const genRes = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MISTRAL_KEY}` },
        body: JSON.stringify({ model: mistralModel, messages: [{ role: 'user', content: learningPrompt }], temperature: 0.8, max_tokens: 8000, stream: false }),
      });

      if (!genRes.ok) {
        appendMemory({ timestamp, type: 'note', content: `Generation failed: Mistral returned ${genRes.status}` });
        return NextResponse.json({ error: 'Generation failed' }, { status: 502 });
      }

      const genData = await genRes.json();
      let html = genData?.choices?.[0]?.message?.content ?? '';
      html = html.replace(/^```(?:html)?\s*/i, '').replace(/\s*```\s*$/i, '');
      const docIdx = html.indexOf('<!DOCTYPE');
      if (docIdx > 0) html = html.slice(docIdx);

      if (html.length < 2000) {
        appendMemory({ timestamp, type: 'note', content: `Generated HTML too short (${html.length} bytes), skipping` });
        return NextResponse.json({ error: 'HTML too short' }, { status: 500 });
      }

      // Review
      const reviewPrompt = `${STRICT_REVIEWER_PROMPT}\n\n## WEBSITE HTML TO REVIEW\n\`\`\`html\n${html.slice(0, 15000)}\n\`\`\`\n\nReturn ONLY the JSON.`;
      const reviewRes = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MISTRAL_KEY}` },
        body: JSON.stringify({ model: mistralModel, messages: [{ role: 'user', content: reviewPrompt }], temperature: 0, max_tokens: 1000, stream: false }),
      });

      let review: any = { score: 0, passed: false, verdict: 'REJECT' };
      if (reviewRes.ok) {
        const reviewData = await reviewRes.json();
        const reviewText = reviewData?.choices?.[0]?.message?.content ?? '';
        try {
          let text = reviewText.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
          const first = text.indexOf('{');
          const last = text.lastIndexOf('}');
          if (first >= 0 && last > first) review = JSON.parse(text.slice(first, last + 1));
        } catch {}
      }

      // Save
      let slug = '';
      let viewUrl = '';
      try {
        const { supabase } = await import('@/lib/supabase-client');
        slug = `${biz.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}-${Math.random().toString(36).slice(2, 6)}`;
        await supabase.from('websites').upsert({ id: slug, html, business_name: biz.name, business_type: 'va-autonomous', config: { renderer: 'va-autonomous', reviewScore: review.score, review } });
        const host = req.headers.get('host');
        const protocol = req.headers.get('x-forwarded-proto') || 'https';
        viewUrl = `${protocol}://${host}/s/${slug}`;
      } catch (e) { console.error('[va-auto] Save error:', e); }

      // Log to memory
      appendMemory({
        timestamp, type: 'review',
        content: `Generated ${biz.name} — ${html.length} bytes. Review: ${review.score}/30 (${review.verdict}). Issues: ${(review.issues || []).slice(0, 3).join(', ')}`,
        score: review.score, url: viewUrl,
      });

      if (review.score >= 22) {
        appendMemory({ timestamp, type: 'learn', content: `PASSED! ${biz.name} scored ${review.score}/30. Added to approved list.` });
      }

      return NextResponse.json({
        business: biz.name,
        html, slug, viewUrl,
        review, score: review.score, passed: review.score >= 22,
        htmlSize: html.length,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'unknown' }, { status: 500 });
  }
}
