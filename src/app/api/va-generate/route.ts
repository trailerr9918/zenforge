import { STRICT_REVIEWER_PROMPT, buildTeachingPrompt } from '@/lib/va-teaching-system';

// Can't use buildFullCatalog in edge runtime (uses fs). Hardcode catalog data.
const CATALOG_VIDEOS = [
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_045634_e1c98c76-1265-4f5c-882a-4276f2080894.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_151551_992053d1-3d3e-4b8c-abac-45f22158f411.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_055729_72d66327-b59e-4ae9-bb70-de6ccb5ecdb0.mp4',
];

const DESIGN_SYSTEMS = [
  { id: 'cinematic-dark', name: 'Cinematic Dark', bg: '#0A0A0A', text: '#FFFFFF', accent: '#DCFF00', accentGradient: 'linear-gradient(135deg, #DCFF00, #64CEFB)', displayFont: 'Instrument Serif', bodyFont: 'Inter', navFont: 'Space Grotesk', mood: 'cinematic' },
  { id: 'aurora', name: 'Aurora', bg: '#0F0E17', text: '#FFFFFE', accent: '#A78BFA', accentGradient: 'linear-gradient(135deg, #A78BFA, #EC4899)', displayFont: 'Bricolage Grotesque', bodyFont: 'Inter', navFont: 'Bricolage Grotesque', mood: 'modern' },
  { id: 'editorial', name: 'Editorial', bg: '#FAFAF7', text: '#1A1A1A', accent: '#E63946', accentGradient: 'linear-gradient(135deg, #E63946, #F4A261)', displayFont: 'Playfair Display', bodyFont: 'Source Sans 3', navFont: 'Space Grotesk', mood: 'editorial' },
  { id: 'brutalist', name: 'Brutalist', bg: '#0A0A0A', text: '#FFFFFF', accent: '#FF00FF', accentGradient: 'linear-gradient(135deg, #FF00FF, #00FFFF)', displayFont: 'Archivo Black', bodyFont: 'Space Mono', navFont: 'Archivo Black', mood: 'bold' },
];

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MISTRAL_KEY = process.env.MISTRAL_API_KEY || '';

/**
 * VA Generate — Edge function with streaming (bypasses Vercel 10s timeout)
 *
 * Streams thoughts + HTML back to the browser.
 */

interface VARequest {
  action: 'generate' | 'review' | 'chat' | 'mutate';
  prompt?: string;
  businessName?: string;
  html?: string;
  message?: string;
  model?: string;
}

function detectBizType(prompt: string): string {
  const p = prompt.toLowerCase();
  if (p.match(/coffee|cafe|restaurant|food/)) return 'restaurant';
  if (p.match(/tech|startup|saas|software|app|ai|crypto/)) return 'tech';
  if (p.match(/gym|fitness|yoga/)) return 'fitness';
  if (p.match(/agency|studio|creative|design/)) return 'agency';
  if (p.match(/shop|store|fashion/)) return 'ecommerce';
  return 'default';
}

async function callMistralStream(model: string, messages: any[], maxTokens: number, temp: number): Promise<string> {
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
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Mistral ${response.status}: ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content ?? '';
}

export async function POST(req: Request): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const body: VARequest = await req.json();
    const model = body.model || 'mistral-large-latest';

    // === CHAT (fast, non-streaming) ===
    if (body.action === 'chat' && body.message) {
      // Check if user wants to generate
      const lower = body.message.toLowerCase();
      const wantsGenerate = lower.includes('build') || lower.includes('create') || lower.includes('make') || lower.includes('design') || lower.includes('generate') || lower.includes('anything') || lower.includes('okay') || lower.includes('do as you like') || lower.includes('run wild') || lower.includes('go ahead') || lower.includes('yes') || lower.includes('sure') || lower.includes('whatever');

      if (wantsGenerate) {
        // Pick a random business if user said "anything"
        const businesses = [
          { name: 'Aurora', desc: 'A premium aurora-themed wellness retreat in Iceland' },
          { name: 'Voltage', desc: 'An electric vehicle charging network startup' },
          { name: 'Cipher', desc: 'A cybersecurity SaaS platform for enterprises' },
          { name: 'Bloom', desc: 'A sustainable flower delivery service' },
          { name: 'Pulse', desc: 'A music streaming platform for indie artists' },
          { name: 'Forge', desc: 'A premium fitness coaching app for athletes' },
          { name: 'Lumina', desc: 'A luxury AI design agency' },
          { name: 'Nebula', desc: 'An AI project management platform' },
        ];
        const biz = businesses[Math.floor(Math.random() * businesses.length)];

        return new Response(JSON.stringify({
          action: 'auto-generate',
          prompt: biz.desc,
          businessName: biz.name,
          response: `Perfect — I'll create "${biz.name}" right now. ${biz.desc}. Generating now...`,
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Regular chat
      const chatPrompt = `You are ZenForge's Virtual Artist. Be concise (1-2 sentences max). You're an elite web designer who creates premium websites. When someone asks you to build something, just say "On it!" and the system will generate it. Don't ask follow-up questions — just build.

User: ${body.message}`;

      const response = await callMistralStream(model, [
        { role: 'user', content: chatPrompt }
      ], 200, 0.8);

      return new Response(JSON.stringify({
        action: 'chat',
        response: response || 'On it! Let me build that for you.',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // === GENERATE (streaming) ===
    if (body.action === 'generate' && body.prompt) {
      const businessName = body.businessName || 'ZenForge Site';
      const bizType = detectBizType(body.prompt);
      const ds = DESIGN_SYSTEMS[Math.floor(Math.random() * DESIGN_SYSTEMS.length)];
      const catalogVideos = CATALOG_VIDEOS;
      const catalogFont = null; // Edge runtime can't read catalog

      // Build teaching prompt
      const teachingPrompt = buildTeachingPrompt(
        businessName,
        body.prompt,
        ds as any,
        catalogVideos,
        catalogFont,
      );

      // Stream the generation process
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Step 1: Thinking
            controller.enqueue(encoder.encode(JSON.stringify({ step: 'thinking', message: `Analyzing catalog for ${businessName}...` }) + '\n'));

            // Step 2: Generate
            controller.enqueue(encoder.encode(JSON.stringify({ step: 'thinking', message: `Generating website with ${model}...` }) + '\n'));

            let html = await callMistralStream(model, [
              { role: 'user', content: teachingPrompt }
            ], 8000, 0.8);

            html = html.replace(/^```(?:html)?\s*/i, '').replace(/\s*```\s*$/i, '');
            const docIdx = html.indexOf('<!DOCTYPE');
            if (docIdx > 0) html = html.slice(docIdx);

            if (html.length < 2000) {
              controller.enqueue(encoder.encode(JSON.stringify({ step: 'error', message: 'Generated HTML too short' }) + '\n'));
              controller.close();
              return;
            }

            controller.enqueue(encoder.encode(JSON.stringify({ step: 'thinking', message: `Website generated (${html.length} bytes). Running strict AI review...` }) + '\n'));

            // Step 3: Review
            const reviewPrompt = `${STRICT_REVIEWER_PROMPT}\n\n## WEBSITE HTML TO REVIEW\n\`\`\`html\n${html.slice(0, 15000)}\n\`\`\`\n\nReturn ONLY the JSON.`;
            let reviewResult = await callMistralStream(model, [
              { role: 'user', content: reviewPrompt }
            ], 1000, 0.0);

            let review: any;
            try {
              let text = reviewResult.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
              const first = text.indexOf('{');
              const last = text.lastIndexOf('}');
              if (first >= 0 && last > first) {
                review = JSON.parse(text.slice(first, last + 1));
              } else {
                review = { score: 15, passed: false, verdict: 'REVIEW_PARSE_FAIL', issues: ['Could not parse review'] };
              }
            } catch {
              review = { score: 15, passed: false, verdict: 'REVIEW_PARSE_FAIL', issues: ['Review JSON invalid'] };
            }

            // Step 4: Save to Supabase
            controller.enqueue(encoder.encode(JSON.stringify({ step: 'thinking', message: `Review complete: ${review.score}/30. Saving to Supabase...` }) + '\n'));

            let slug = '';
            let viewUrl = '';
            try {
              // Save via the save-website API (works in edge runtime)
              const host = req.headers.get('host');
              const protocol = req.headers.get('x-forwarded-proto') || 'https';
              const baseUrl = host ? protocol + '://' + host : 'https://zenforge.site';

              const saveRes = await fetch(baseUrl + '/api/save-website', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ html, businessName, businessType: 'va-' + bizType }),
              });
              if (saveRes.ok) {
                const saveData = await saveRes.json();
                slug = saveData.slug || '';
                viewUrl = saveData.viewUrl || '';
              }
            } catch (e) {
              console.error('[va] Save error:', e);
            }

            // Step 5: Done
            controller.enqueue(encoder.encode(JSON.stringify({
              step: 'done',
              html,
              review,
              slug,
              viewUrl,
              businessName,
              designSystem: { id: ds.id, name: ds.name },
              score: review.score,
              passed: review.score >= 22,
            }) + '\n'));

            controller.close();
          } catch (e) {
            controller.enqueue(encoder.encode(JSON.stringify({
              step: 'error',
              message: e instanceof Error ? e.message : 'unknown error',
            }) + '\n'));
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
    }

    // === REVIEW ONLY ===
    if (body.action === 'review' && body.html) {
      const reviewPrompt = `${STRICT_REVIEWER_PROMPT}\n\n## WEBSITE HTML TO REVIEW\n\`\`\`html\n${body.html.slice(0, 15000)}\n\`\`\`\n\nReturn ONLY the JSON.`;
      const reviewResult = await callMistralStream(model, [{ role: 'user', content: reviewPrompt }], 1000, 0.0);

      let review: any;
      try {
        let text = reviewResult.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
        const first = text.indexOf('{');
        const last = text.lastIndexOf('}');
        if (first >= 0 && last > first) review = JSON.parse(text.slice(first, last + 1));
        else review = { score: 0, passed: false, verdict: 'REJECT', issues: ['No JSON'] };
      } catch { review = { score: 0, passed: false, verdict: 'REJECT', issues: ['Parse failed'] }; }

      return new Response(JSON.stringify({ action: 'review', review }), {
        status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // === MUTATE ===
    if (body.action === 'mutate' && body.html) {
      const mutations = ['Change the color scheme', 'Rearrange sections', 'Add a new section', 'Change hero layout', 'Update typography'];
      const mutation = mutations[Math.floor(Math.random() * mutations.length)];
      const mutatePrompt = `Take this HTML and apply: ${mutation}. Keep ALL features. Return COMPLETE HTML.\n\n${body.html.slice(0, 12000)}`;
      let html = await callMistralStream(model, [{ role: 'user', content: mutatePrompt }], 8000, 0.7);
      html = html.replace(/^```(?:html)?\s*/i, '').replace(/\s*```\s*$/i, '');
      const docIdx = html.indexOf('<!DOCTYPE');
      if (docIdx > 0) html = html.slice(docIdx);

      return new Response(JSON.stringify({ action: 'mutate', html, mutation }), {
        status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'unknown' }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
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
