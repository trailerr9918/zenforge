/**
 * Forge Review System
 * ===================
 *
 * The 1-5 emoji rating flow that drives learning.
 *
 *   😡 (1) → TRASH:    mark every technique used as avoided++, delete the generation
 *   😕 (2) → TRASH:    same as 1
 *   😐 (3) → IMPROVE:  LLM suggests 3 improvements, store for next forge run
 *   😍 (4) → SAVE:     promote to saved_templates, mark techniques as loved
 *   🤩 (5) → SAVE:     same as 4
 *
 * The learning loop:
 *   - Trashed techniques get avoidCount++. After 3 trashes + no high rating,
 *     they're marked `avoided=true` and the Forge Reasoner never picks them again.
 *   - Saved generations become templates you can recall with variable swaps.
 *   - Improvement suggestions feed back into the Forge Reasoner's prompt as
 *     "things to avoid".
 */

import { loadTechniques, saveTechniques, markTechniqueAvoided, setTechniqueRating, type Technique } from './technique-library';
import type { StructuredSpec } from '../prompt-recreator';
import { zaiChat } from '../zai-client';

/* ============================================================================
 * Types
 * ========================================================================== */

export type EmojiRating = 1 | 2 | 3 | 4 | 5;

export const EMOJI_MAP: Record<EmojiRating, { emoji: string; label: string; action: 'trash' | 'improve' | 'save' }> = {
  1: { emoji: '😡', label: 'Hated it', action: 'trash' },
  2: { emoji: '😕', label: 'Disliked', action: 'trash' },
  3: { emoji: '😐', label: 'Meh', action: 'improve' },
  4: { emoji: '😍', label: 'Loved it', action: 'save' },
  5: { emoji: '🤩', label: 'All-time favorite', action: 'save' },
};

export interface ForgeGeneration {
  id: string;
  plan: any;                // ForgePlan
  spec: StructuredSpec;
  html: string;
  businessName: string;
  sourceTechniqueIds: string[];
  status: 'pending_review' | 'trashed' | 'improvement_suggested' | 'saved_as_template';
  userRating?: EmojiRating;
  userNote?: string;
  improvementSuggestions?: string[];
  templateId?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface SavedTemplate {
  id: string;
  name: string;
  sourceGenerationId: string;
  sourceTechniqueIds: string[];
  html: string;
  spec: StructuredSpec;
  variables: string[];      // ['businessName', 'headline', 'ctaText', ...]
  userRating: 4 | 5;
  usageCount: number;
  createdAt: string;
}

export interface ReviewResult {
  action: 'trashed' | 'improvement_suggested' | 'saved_as_template';
  improvements?: string[];
  templateId?: string;
  techniquesAffected: number;
}

/* ============================================================================
 * Persistence (JSON file fallback + best-effort Supabase)
 * ========================================================================== */

const GENERATIONS_FILE = '/home/z/my-project/data/forge-generations.json';
const TEMPLATES_FILE = '/home/z/my-project/data/forge-templates.json';

let generationsCache: ForgeGeneration[] | null = null;
let templatesCache: SavedTemplate[] | null = null;

async function loadGenerations(): Promise<ForgeGeneration[]> {
  if (generationsCache) return generationsCache;
  // Try Supabase first
  try {
    const { supabase } = await import('../supabase-client');
    const { data, error } = await supabase
      .from('forge_generations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (!error && data && data.length > 0) {
      generationsCache = data.map(rowToGeneration);
      return generationsCache;
    }
  } catch {}
  // Fallback: JSON file
  try {
    const fs = await import('fs');
    if (fs.existsSync(GENERATIONS_FILE)) {
      generationsCache = JSON.parse(fs.readFileSync(GENERATIONS_FILE, 'utf-8'));
      return generationsCache!;
    }
  } catch {}
  generationsCache = [];
  return generationsCache;
}

async function saveGenerations(generations: ForgeGeneration[]): Promise<void> {
  generationsCache = generations;
  try {
    const fs = await import('fs');
    fs.mkdirSync('/home/z/my-project/data', { recursive: true });
    fs.writeFileSync(GENERATIONS_FILE, JSON.stringify(generations, null, 2));
  } catch (e) { console.error('[review-system] JSON save failed:', e); }
  // Best-effort Supabase upsert
  try {
    const { supabase } = await import('../supabase-client');
    for (const g of generations.slice(0, 50)) {  // only sync recent 50 to avoid payload limits
      await supabase.from('forge_generations').upsert({
        id: g.id,
        plan: g.plan,
        spec: g.spec,
        html: g.html,
        business_name: g.businessName,
        prompt_type: g.spec.promptType,
        source_technique_ids: g.sourceTechniqueIds,
        status: g.status,
        user_rating: g.userRating || null,
        user_note: g.userNote || null,
        improvement_suggestions: g.improvementSuggestions || null,
        template_id: g.templateId || null,
        created_at: g.createdAt,
        reviewed_at: g.reviewedAt || null,
      });
    }
  } catch (e) { /* table may not exist yet — JSON fallback active */ }
}

async function loadTemplates(): Promise<SavedTemplate[]> {
  if (templatesCache) return templatesCache;
  try {
    const { supabase } = await import('../supabase-client');
    const { data, error } = await supabase
      .from('forge_saved_templates')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data && data.length > 0) {
      templatesCache = data.map(rowToTemplate);
      return templatesCache;
    }
  } catch {}
  try {
    const fs = await import('fs');
    if (fs.existsSync(TEMPLATES_FILE)) {
      templatesCache = JSON.parse(fs.readFileSync(TEMPLATES_FILE, 'utf-8'));
      return templatesCache!;
    }
  } catch {}
  templatesCache = [];
  return templatesCache;
}

async function saveTemplates(templates: SavedTemplate[]): Promise<void> {
  templatesCache = templates;
  try {
    const fs = await import('fs');
    fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(templates, null, 2));
  } catch (e) { console.error('[review-system] templates JSON save failed:', e); }
  try {
    const { supabase } = await import('../supabase-client');
    for (const t of templates) {
      await supabase.from('forge_saved_templates').upsert({
        id: t.id,
        name: t.name,
        source_generation_id: t.sourceGenerationId,
        source_technique_ids: t.sourceTechniqueIds,
        html: t.html,
        spec: t.spec,
        variables: t.variables,
        user_rating: t.userRating,
        usage_count: t.usageCount,
        created_at: t.createdAt,
      });
    }
  } catch (e) { /* table may not exist */ }
}

function rowToGeneration(r: any): ForgeGeneration {
  return {
    id: r.id,
    plan: r.plan,
    spec: r.spec,
    html: r.html,
    businessName: r.business_name,
    sourceTechniqueIds: r.source_technique_ids || [],
    status: r.status,
    userRating: r.user_rating,
    userNote: r.user_note || undefined,
    improvementSuggestions: r.improvement_suggestions || undefined,
    templateId: r.template_id || undefined,
    createdAt: r.created_at,
    reviewedAt: r.reviewed_at || undefined,
  };
}

function rowToTemplate(r: any): SavedTemplate {
  return {
    id: r.id,
    name: r.name,
    sourceGenerationId: r.source_generation_id,
    sourceTechniqueIds: r.source_technique_ids || [],
    html: r.html,
    spec: r.spec,
    variables: r.variables || [],
    userRating: r.user_rating,
    usageCount: r.usage_count || 0,
    createdAt: r.created_at,
  };
}

/* ============================================================================
 * Record a new generation (called by /api/forge/generate after producing HTML)
 * ========================================================================== */

export async function recordGeneration(gen: Omit<ForgeGeneration, 'status' | 'createdAt'>): Promise<ForgeGeneration> {
  const full: ForgeGeneration = {
    ...gen,
    status: 'pending_review',
    createdAt: new Date().toISOString(),
  };
  const all = await loadGenerations();
  // Cap the pending-review queue at 50 (auto-trash oldest pending)
  const pending = all.filter((g) => g.status === 'pending_review');
  if (pending.length >= 50) {
    const toTrash = pending.slice(50 - 1);  // oldest beyond index 49
    for (const g of toTrash) {
      g.status = 'trashed';
      g.reviewedAt = new Date().toISOString();
    }
  }
  all.unshift(full);
  await saveGenerations(all);
  return full;
}

/* ============================================================================
 * Review a generation (the main entry point)
 * ========================================================================== */

export async function reviewGeneration(
  generationId: string,
  rating: EmojiRating,
  note?: string,
): Promise<ReviewResult> {
  const all = await loadGenerations();
  const idx = all.findIndex((g) => g.id === generationId);
  if (idx === -1) throw new Error(`Generation not found: ${generationId}`);

  const gen = all[idx];
  gen.userRating = rating;
  gen.userNote = note;
  gen.reviewedAt = new Date().toISOString();

  const action = EMOJI_MAP[rating].action;
  let result: ReviewResult;

  if (action === 'trash') {
    // Mark every technique used as avoided++
    try { await markTechniqueAvoided(gen.sourceTechniqueIds); } catch (e) { console.warn('[review] markTechniqueAvoided failed:', e); }
    gen.status = 'trashed';
    result = { action: 'trashed', techniquesAffected: gen.sourceTechniqueIds.length };
  } else if (action === 'improve') {
    // Ask LLM for 3 improvement suggestions
    const improvements = await suggestImprovements(gen, note);
    gen.status = 'improvement_suggested';
    gen.improvementSuggestions = improvements;
    result = { action: 'improvement_suggested', improvements, techniquesAffected: gen.sourceTechniqueIds.length };
  } else {
    // Save as template
    const template = await promoteToTemplate(gen, rating as 4 | 5);
    gen.status = 'saved_as_template';
    gen.templateId = template.id;
    // Mark every technique as loved (rating 4-5)
    for (const tid of gen.sourceTechniqueIds) {
      try { await setTechniqueRating(tid, rating); } catch (e) { console.warn('[review] setTechniqueRating failed:', e); }
    }
    result = { action: 'saved_as_template', templateId: template.id, techniquesAffected: gen.sourceTechniqueIds.length };
  }

  all[idx] = gen;
  await saveGenerations(all);
  return result;
}

/* ============================================================================
 * Improve path: LLM suggests 3 improvements
 * ========================================================================== */

async function suggestImprovements(gen: ForgeGeneration, userNote?: string): Promise<string[]> {
  try {
    const response = await zaiChat({
      model: 'glm-4-flash',
      temperature: 0.4,
      maxTokens: 600,
      messages: [
        {
          role: 'system',
          content: `You are a website design critic. The user rated this generated website 😐 (meh). Suggest 3 specific, actionable improvements. Be concrete — reference specific sections, colors, or copy. Return ONLY a JSON array of 3 strings, no markdown fences.`,
        },
        {
          role: 'user',
          content:
            `BUSINESS: ${gen.businessName}\n` +
            `TARGET: ${gen.plan?.target || 'unknown'}\n` +
            `USER NOTE: ${userNote || '(none)'}\n` +
            `SECTIONS:\n${(gen.plan?.sections || []).map((s: any, i: number) => `  ${i + 1}. [${s.partType}] from ${s.sourcePromptTitle} — ${s.reason}`).join('\n')}\n\n` +
            `HTML (first 2000 chars):\n${gen.html.slice(0, 2000)}\n\n` +
            `Suggest 3 improvements as a JSON array of strings.`,
        },
      ],
    });
    const content: string = response?.choices?.[0]?.message?.content ?? '';
    const parsed = parseJsonArray(content);
    if (parsed && parsed.length > 0) return parsed.slice(0, 3);
  } catch (e) {
    console.warn('[review] suggestImprovements failed (LLM unavailable):', e);
  }
  // Fallback suggestions if LLM fails
  return [
    'Try a different hero treatment — the current one may not fit the target audience.',
    'Consider tightening the color palette for more visual cohesion.',
    'The copy could be more specific to the business type.',
  ];
}

function parseJsonArray(content: string): string[] | null {
  if (!content) return null;
  let text = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
  const first = text.indexOf('[');
  const last = text.lastIndexOf(']');
  if (first === -1 || last === -1) return null;
  try {
    const arr = JSON.parse(text.slice(first, last + 1));
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : null;
  } catch {
    return null;
  }
}

/* ============================================================================
 * Save path: promote generation to template
 * ========================================================================== */

async function promoteToTemplate(gen: ForgeGeneration, rating: 4 | 5): Promise<SavedTemplate> {
  const variables = detectVariables(gen.spec);
  const template: SavedTemplate = {
    id: `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: `${gen.businessName} (${rating}★)`,
    sourceGenerationId: gen.id,
    sourceTechniqueIds: gen.sourceTechniqueIds,
    html: gen.html,
    spec: gen.spec,
    variables,
    userRating: rating,
    usageCount: 0,
    createdAt: new Date().toISOString(),
  };
  const all = await loadTemplates();
  all.unshift(template);
  await saveTemplates(all);
  return template;
}

/** Detect which spec fields are user-editable when re-using this template. */
function detectVariables(spec: StructuredSpec): string[] {
  const vars: string[] = ['businessName'];
  if (spec.sections.some((s) => s.headline)) vars.push('headline');
  if (spec.sections.some((s) => s.cta)) vars.push('ctaText');
  if (spec.navItems.length > 0) vars.push('navItems');
  if (spec.sections.some((s) => s.body)) vars.push('body');
  return vars;
}

/* ============================================================================
 * Template usage: deploy a saved template with swapped variables
 * ========================================================================== */

export interface UseTemplateVariables {
  businessName?: string;
  headline?: string;
  ctaText?: string;
  navItems?: string[];
  body?: string;
}

export async function useTemplate(templateId: string, vars: UseTemplateVariables): Promise<{ html: string; spec: StructuredSpec; newGenerationId: string } | null> {
  const all = await loadTemplates();
  const idx = all.findIndex((t) => t.id === templateId);
  if (idx === -1) return null;

  const template = all[idx];
  // Deep-clone the spec so we can mutate safely
  const spec: StructuredSpec = JSON.parse(JSON.stringify(template.spec));

  // Apply variable swaps
  if (vars.businessName) {
    spec.businessName = vars.businessName;
    spec.logo = vars.businessName;
  }
  if (vars.headline) {
    for (const s of spec.sections) {
      if (s.headline) s.headline = vars.headline;
    }
  }
  if (vars.ctaText) {
    spec.ctaText = vars.ctaText;
    for (const s of spec.sections) {
      if (s.cta) s.cta = vars.ctaText;
    }
  }
  if (vars.navItems && vars.navItems.length > 0) {
    spec.navItems = vars.navItems;
  }
  if (vars.body) {
    for (const s of spec.sections) {
      if (s.body) s.body = vars.body;
    }
  }

  // Re-render
  const { renderStructuredSite } = await import('../prompt-recreator');
  const html = renderStructuredSite(spec);

  // Bump usage count
  template.usageCount++;
  all[idx] = template;
  await saveTemplates(all);

  // Record as a new generation (so it can be reviewed/rated too)
  const newGenId = `forge-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  await recordGeneration({
    id: newGenId,
    plan: { ...template.spec, id: newGenId, target: `template:${template.name}`, sections: [], palette: { bg: spec.colors.bg, text: spec.colors.text, muted: spec.colors.muted || '', accent: spec.colors.accent || '' }, fonts: spec.fonts, overallReason: `Deployed from saved template: ${template.name}`, generatedAt: new Date().toISOString(), creativity: 0 } as any,
    spec,
    html,
    businessName: spec.businessName,
    sourceTechniqueIds: template.sourceTechniqueIds,
  });

  return { html, spec, newGenerationId: newGenId };
}

/* ============================================================================
 * Query helpers
 * ========================================================================== */

export async function getPendingGenerations(limit = 20): Promise<ForgeGeneration[]> {
  const all = await loadGenerations();
  return all.filter((g) => g.status === 'pending_review').slice(0, limit);
}

export async function getRecentGenerations(limit = 20): Promise<ForgeGeneration[]> {
  const all = await loadGenerations();
  return all.slice(0, limit);
}

export async function getGeneration(id: string): Promise<ForgeGeneration | null> {
  const all = await loadGenerations();
  return all.find((g) => g.id === id) || null;
}

export async function getSavedTemplates(): Promise<SavedTemplate[]> {
  return await loadTemplates();
}

export async function getSavedTemplate(id: string): Promise<SavedTemplate | null> {
  const all = await loadTemplates();
  return all.find((t) => t.id === id) || null;
}

export interface ReviewStats {
  totalGenerations: number;
  pendingReview: number;
  trashed: number;
  improvementSuggested: number;
  savedAsTemplates: number;
  averageRating: number;
  topRatedTechniques: Technique[];
}

export async function getReviewStats(): Promise<ReviewStats> {
  const all = await loadGenerations();
  const rated = all.filter((g) => g.userRating);
  const avgRating = rated.length > 0 ? rated.reduce((sum, g) => sum + (g.userRating || 0), 0) / rated.length : 0;
  const techniques = await loadTechniques();
  const topRated = techniques
    .filter((t) => t.userRating && t.userRating >= 4)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  return {
    totalGenerations: all.length,
    pendingReview: all.filter((g) => g.status === 'pending_review').length,
    trashed: all.filter((g) => g.status === 'trashed').length,
    improvementSuggested: all.filter((g) => g.status === 'improvement_suggested').length,
    savedAsTemplates: all.filter((g) => g.status === 'saved_as_template').length,
    averageRating: avgRating,
    topRatedTechniques: topRated,
  };
}
