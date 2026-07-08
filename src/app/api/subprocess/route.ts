import { NextRequest, NextResponse } from 'next/server';
import { appendMemory } from '@/lib/va-memory';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const MISTRAL_KEY = process.env.MISTRAL_API_KEY || '';

/**
 * Subprocess System — real AI sub-agents that perform tasks.
 * Each subprocess type has a specific role and uses Mistral.
 *
 * Types:
 * - generator: Creates websites using learning prompts
 * - reviewer: Reviews HTML against 30-point scoring
 * - mutator: Mutates existing HTML with specific changes
 * - researcher: Researches design trends and best practices
 * - custom: User-defined task
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, subprocessType, task, html, model } = body;
    const mistralModel = model || 'mistral-large-latest';

    if (action === 'execute') {
      const timestamp = new Date().toISOString();
      let result: any = {};

      if (subprocessType === 'reviewer' && html) {
        // Review subprocess
        const reviewPrompt = `You are a strict website reviewer. Score this HTML 0-30.
Categories: layout, loading, navigation, hero, typography, media, content, socialProof, interactions, forms, ecommerce, jsEffects, technical, footer, invisibleDetails (each 0-2).
Pass = 22/30. Return JSON: {"score":N,"passed":bool,"verdict":"PASS"|"REJECT","issues":[],"improvements":[]}

HTML:
\`\`\`html
${html.slice(0, 12000)}
\`\`\``;

        const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MISTRAL_KEY}` },
          body: JSON.stringify({ model: mistralModel, messages: [{ role: 'user', content: reviewPrompt }], temperature: 0, max_tokens: 500, stream: false }),
        });

        if (res.ok) {
          const data = await res.json();
          const text = data?.choices?.[0]?.message?.content ?? '';
          try {
            let t = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
            const f = t.indexOf('{'); const l = t.lastIndexOf('}');
            if (f >= 0 && l > f) result = JSON.parse(t.slice(f, l + 1));
          } catch {}
        }
        result.type = 'review';
      }

      else if (subprocessType === 'researcher' && task) {
        // Research subprocess
        const researchPrompt = `You are a design researcher. Research this topic and provide actionable insights for website design: ${task}. Return 3-5 specific recommendations with CSS/JS implementation tips. Be concise.`;

        const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MISTRAL_KEY}` },
          body: JSON.stringify({ model: mistralModel, messages: [{ role: 'user', content: researchPrompt }], temperature: 0.7, max_tokens: 500, stream: false }),
        });

        if (res.ok) {
          const data = await res.json();
          result = { type: 'research', insights: data?.choices?.[0]?.message?.content ?? 'No insights' };
        }
      }

      else if (subprocessType === 'mutator' && html) {
        // Mutator subprocess
        const mutations = ['Change color scheme', 'Rearrange sections', 'Add a section', 'Change hero layout', 'Update typography', 'Add micro-interactions'];
        const mutation = mutations[Math.floor(Math.random() * mutations.length)];

        const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MISTRAL_KEY}` },
          body: JSON.stringify({ model: mistralModel, messages: [{ role: 'user', content: `Mutate this HTML: ${mutation}. Keep ALL features. Return COMPLETE HTML.\n\n${html.slice(0, 10000)}` }], temperature: 0.7, max_tokens: 8000, stream: false }),
        });

        if (res.ok) {
          const data = await res.json();
          let mutated = data?.choices?.[0]?.message?.content ?? '';
          mutated = mutated.replace(/^```(?:html)?\s*/i, '').replace(/\s*```\s*$/i, '');
          const docIdx = mutated.indexOf('<!DOCTYPE');
          if (docIdx > 0) mutated = mutated.slice(docIdx);
          result = { type: 'mutate', mutation, html: mutated };
        }
      }

      else if (subprocessType === 'generator' && task) {
        // Generator subprocess — uses learning system
        const { buildLearningPrompt } = await import('@/lib/learning-system');
        const prompt = buildLearningPrompt('Generated Site', task);

        const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MISTRAL_KEY}` },
          body: JSON.stringify({ model: mistralModel, messages: [{ role: 'user', content: prompt }], temperature: 0.8, max_tokens: 8000, stream: false }),
        });

        if (res.ok) {
          const data = await res.json();
          let genHtml = data?.choices?.[0]?.message?.content ?? '';
          genHtml = genHtml.replace(/^```(?:html)?\s*/i, '').replace(/\s*```\s*$/i, '');
          const docIdx = genHtml.indexOf('<!DOCTYPE');
          if (docIdx > 0) genHtml = genHtml.slice(docIdx);
          result = { type: 'generate', html: genHtml, task };
        }
      }

      else if (subprocessType === 'custom' && task) {
        // Custom subprocess
        const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MISTRAL_KEY}` },
          body: JSON.stringify({ model: mistralModel, messages: [{ role: 'user', content: task }], temperature: 0.7, max_tokens: 2000, stream: false }),
        });

        if (res.ok) {
          const data = await res.json();
          result = { type: 'custom', response: data?.choices?.[0]?.message?.content ?? 'No response' };
        }
      }

      appendMemory({ timestamp, type: 'note', content: `Subprocess ${subprocessType} executed task: ${task || 'review/mutate'}` });

      return NextResponse.json({ success: true, result, subprocessType, timestamp });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'unknown' }, { status: 500 });
  }
}
