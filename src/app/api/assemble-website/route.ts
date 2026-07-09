import { NextRequest, NextResponse } from 'next/server';
import { renderV7 } from '@/lib/v7-renderer';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const MISTRAL_KEY = process.env.MISTRAL_API_KEY || '';

/**
 * POST /api/assemble-website
 *
 * The "master chef" endpoint. Instead of generating raw HTML from an LLM,
 * this route uses Mistral for high-level REASONING (which sections to pick,
 * what style, what order) and assembles the final website from the Pattern
 * Explorer library (premium patterns + VA-approved patterns).
 *
 * Body: {
 *   prompt: string,             // business description
 *   style?: string,             // cinematic | editorial | glassmorphic | minimal | warm | brutalist
 *   fullCreative?: boolean,     // if true, Mistral plans sections; if false, deterministic
 *   model?: string,             // default mistral-large-latest
 *   save?: boolean,             // save to Supabase (default true)
 * }
 *
 * Response: NDJSON stream
 *   { step: 'thinking', message: string }
 *   { step: 'done', html, plan, patternsUsed, viewUrl? }
 *   { step: 'error', message: string }
 */

export async function POST(req: NextRequest) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const body = await req.json();
    const { prompt, style, fullCreative, model, save } = body;

    if (!prompt || prompt.length < 5) {
      return NextResponse.json({ error: 'Prompt required (min 5 chars)' }, { status: 400, headers: corsHeaders });
    }

    if (!MISTRAL_KEY) {
      return NextResponse.json({ error: 'MISTRAL_API_KEY not set' }, { status: 500, headers: corsHeaders });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (obj: any) => controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'));

        try {
          // Run V7 Max renderer
          const result = await renderV7({
            prompt,
            style,
            fullCreative: fullCreative === true,
            model: model || 'mistral-large-latest',
            mistralKey: MISTRAL_KEY,
            randomizedPicks: body.randomizedPicks,
          });

          // Stream reasoning trace as thinking steps
          for (const step of result.reasoningTrace) {
            send({ step: 'thinking', message: step });
          }

          // Save to Supabase if requested
          let slug = '';
          let viewUrl = '';
          if (save !== false) {
            try {
              const { supabase } = await import('@/lib/supabase-client');
              const businessName = result.plan.businessName;
              slug = `${businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}-${Math.random().toString(36).slice(2, 6)}`;
              await supabase.from('websites').upsert({
                id: slug,
                html: result.html,
                business_name: businessName,
                business_type: `v7-${result.plan.businessType}`,
                config: {
                  renderer: 'v7-max',
                  plan: result.plan,
                  patternsUsed: result.patternsUsed,
                },
              });
              const host = req.headers.get('host');
              const protocol = req.headers.get('x-forwarded-proto') || 'https';
              const baseUrl = host ? `${protocol}://${host}` : `http://localhost:${process.env.PORT || 3000}`;
              viewUrl = `${baseUrl}/s/${slug}`;
            } catch (e) {
              console.error('[assemble-website] Save error:', e);
            }
          }

          // Log to VA memory
          try {
            await fetch(`${req.headers.get('x-forwarded-proto') || 'https'}://${req.headers.get('host') || 'localhost'}/api/va-part-memory`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'note',
                partType: 'full-website',
                style: result.plan.style,
                businessContext: result.plan.businessName,
                feedback: `Assembled website with ${result.patternsUsed.length} patterns: ${result.patternsUsed.join(', ')}`,
              }),
            });
          } catch {}

          send({
            step: 'done',
            html: result.html,
            plan: result.plan,
            patternsUsed: result.patternsUsed,
            renderer: 'v7-max',
            slug,
            viewUrl,
            businessName: result.plan.businessName,
            businessType: result.plan.businessType,
            style: result.plan.style,
            layoutComposition: result.plan.layoutComposition,
            sectionCount: result.plan.sections.length,
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
