import { NextRequest, NextResponse } from 'next/server';
import { assembleWebsite } from '@/lib/pattern-designer';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

/**
 * V6 Ultra Premium Renderer — PATTERN DESIGNER MODE
 * ==================================================
 *
 * This route does NOT call GLM-4-plus. Instead, it assembles a complete
 * website from stored patterns that Virtual Artist + Evolution have
 * already created and refined 24/7.
 *
 * Flow:
 *   1. Virtual Artist (24/7) → creates premium section patterns → Supabase
 *   2. Evolution (24/7) → creates premium section patterns → Supabase
 *   3. User requests website → Pattern Designer loads best patterns →
 *      assembles into complete HTML → applies custom config → returns INSTANTLY
 *
 * This is the correct architecture: the "factory" (Virtual Artist + Evolution)
 * runs 24/7 building patterns, and the "assembler" (Pattern Designer) combines
 * them instantly when needed. No per-request AI generation.
 *
 * If the pattern library is empty or sparse, falls back to V5 built-in variants.
 */

interface CustomConfig {
  businessName?: string;
  tagline?: string;
  hero?: string;
  sub?: string;
  ctaText?: string;
  colors?: { bg?: string; primary?: string; accent?: string; dark?: string; cream?: string };
  fonts?: { display?: string; body?: string };
  style?: string;
}

function detectBizType(prompt: string): string {
  const p = prompt.toLowerCase();
  if (p.match(/coffee|cafe|espresso|barista/)) return 'cafe';
  if (p.match(/restaurant|dining|chef|menu/)) return 'restaurant';
  if (p.match(/jet|aviation|private flight|charter/)) return 'aviation';
  if (p.match(/tech|startup|saas|software|app|platform|ai/)) return 'tech';
  if (p.match(/salon|spa|beauty|hair/)) return 'beauty';
  if (p.match(/gym|fitness|yoga/)) return 'fitness';
  if (p.match(/hotel|resort|travel/)) return 'hospitality';
  if (p.match(/agency|studio|creative|design/)) return 'agency';
  if (p.match(/shop|store|ecommerce|retail/)) return 'commerce';
  return 'general';
}

export async function POST(req: NextRequest) {
  try {
    const t0 = Date.now();
    const body = await req.json();
    const prompt = body.prompt || 'modern website';
    const customConfig: CustomConfig = body.customConfig || {};
    const save = body.save !== false;

    const bizType = detectBizType(prompt);

    // === ASSEMBLE WEBSITE FROM STORED PATTERNS ===
    // This is INSTANT — no AI call. Patterns are already built by Virtual Artist + Evolution.
    const result = await assembleWebsite(prompt, customConfig);

    // Save to Supabase
    if (save && result.html) {
      try {
        const { supabase } = await import('@/lib/supabase-client');
        await supabase.from('websites').upsert({
          id: result.slug,
          html: result.html,
          business_name: result.businessName,
          business_type: bizType,
          config: {
            renderer: 'v6-ultra-pattern-designer',
            customConfig,
            prompt,
            patternsUsed: result.patterns,
            assemblyDuration: result.duration,
          },
        });
      } catch (e) { console.error('[render-premium] Save error:', e); }
    }

    const host = req.headers.get('host');
    const protocol = req.headers.get('x-forwarded-proto') || 'https';
    const baseUrl = host ? `${protocol}://${host}` : `http://localhost:${process.env.PORT || 3000}`;
    const totalDuration = Date.now() - t0;

    try {
      const { logEvent } = await import('@/app/api/logs/route');
      logEvent('success', 'render-premium', `V6 Pattern Designer: "${result.businessName}" — ${result.html.length} bytes, ${totalDuration}ms, ${result.patterns.length} sections`, totalDuration, {
        patterns: result.patterns,
      });
    } catch {}

    return NextResponse.json({
      html: result.html,
      slug: result.slug,
      businessName: result.businessName,
      businessType: bizType,
      viewUrl: `${baseUrl}/s/${result.slug}`,
      renderer: 'v6-ultra-pattern-designer',
      designDNA: {
        renderer: 'v6-ultra-pattern-designer',
        businessName: result.businessName,
        businessType: bizType,
        style: customConfig.style || 'auto',
        patternsUsed: result.patterns,
        patternCount: result.patterns.length,
      },
      duration: totalDuration,
      assemblyTime: result.duration,
      patterns: result.patterns,
    });
  } catch (e) {
    console.error('[render-premium] Error:', e);
    return NextResponse.json({ error: 'Pattern assembly failed', message: e instanceof Error ? e.message : 'unknown' }, { status: 500 });
  }
}
