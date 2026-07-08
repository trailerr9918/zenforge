import { NextRequest, NextResponse } from 'next/server';
import { getSavedTemplates, useTemplate, type UseTemplateVariables } from '@/lib/forge/review-system';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

/**
 * GET /api/forge/templates
 * Lists all saved templates (loved websites, recallable with variable swaps).
 */
export async function GET() {
  const templates = await getSavedTemplates();
  return NextResponse.json({
    count: templates.length,
    templates: templates.map((t) => ({
      id: t.id,
      name: t.name,
      userRating: t.userRating,
      usageCount: t.usageCount,
      variables: t.variables,
      createdAt: t.createdAt,
      sourceTechniqueIds: t.sourceTechniqueIds,
      // Return spec + html so the UI can preview without another round-trip
      spec: t.spec,
      html: t.html,
    })),
  });
}

/**
 * POST /api/forge/templates
 * Body: { "templateId": "...", "variables": { "businessName"?, "headline"?, "ctaText"?, "navItems"?, "body"? } }
 *
 * Deploys a saved template with swapped variables. Returns the new HTML + spec
 * + a new generationId (so the deployed site can also be reviewed).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { templateId, variables } = body;
    if (!templateId) {
      return NextResponse.json({ error: 'templateId required' }, { status: 400 });
    }
    const result = await useTemplate(templateId, (variables || {}) as UseTemplateVariables);
    if (!result) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Save the deployed site to the websites table for /s/{slug} preview
    let slug = '';
    let viewUrl = '';
    try {
      const { supabase } = await import('@/lib/supabase-client');
      slug = `${result.spec.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}-tpl-${Math.random().toString(36).slice(2, 6)}`;
      await supabase.from('websites').upsert({
        id: slug,
        html: result.html,
        business_name: result.spec.businessName,
        business_type: 'template-deployed',
        config: { renderer: 'forge-template', sourceTemplateId: templateId, spec: result.spec, generationId: result.newGenerationId },
      });
      const host = req.headers.get('host');
      const protocol = req.headers.get('x-forwarded-proto') || 'https';
      const baseUrl = host ? `${protocol}://${host}` : `http://localhost:${process.env.PORT || 3000}`;
      viewUrl = `${baseUrl}/s/${slug}`;
    } catch (e) { console.error('[forge/templates] save error:', e); }

    return NextResponse.json({
      ok: true,
      html: result.html,
      spec: result.spec,
      slug: slug || undefined,
      viewUrl: viewUrl || undefined,
      generationId: result.newGenerationId,
    });
  } catch (e) {
    console.error('[forge/templates] error:', e);
    return NextResponse.json(
      { error: 'Template deploy failed', message: e instanceof Error ? e.message : 'unknown' },
      { status: 500 },
    );
  }
}
