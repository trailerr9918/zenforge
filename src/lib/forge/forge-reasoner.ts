/**
 * Forge Reasoner
 * ==============
 *
 * The "brain" of the Forge Engine. Given a target description (or "random"),
 * picks techniques from the Technique Library, explains WHY each was picked,
 * applies mutations (color/font/copy swaps), and assembles a novel
 * StructuredSpec that the V2 renderer can render.
 *
 * The output is a ForgePlan — a structured explanation of every decision —
 * which the UI streams in real-time so you can watch the reasoning happen.
 *
 * LEARNING LOOP
 *   - Top-rated techniques (4-5★) are preferred.
 *   - Avoided techniques (avoidCount >= 3 + low rating) are never picked.
 *   - Improvement suggestions from 😐 reviews are passed as "things to avoid".
 */

import { zaiChat } from '../zai-client';
import { callLLM } from '../llm-provider';
import {
  loadTechniques,
  techniquesByPartType,
  topRatedTechniques,
  randomTechnique,
  type Technique,
  type PartType,
} from './technique-library';
import type { StructuredSpec, Section, SectionType } from '../prompt-recreator';

/* ============================================================================
 * Types
 * ========================================================================== */

export interface ForgePlanSection {
  partType: PartType;
  pickedTechniqueId: string;
  pickedTechniqueName: string;
  sourcePromptId: string;
  sourcePromptTitle: string;
  reason: string;          // "Aethera's hero-video-fade-rise because you rated it 5★"
  mutations: string[];     // ["swapped Inter → Source Sans 3", "darkened bg by 8%"]
  sectionSpec: Section;    // the final mutated section to render
}

export interface ForgePlan {
  id: string;
  target: string;          // "boutique law firm" | "random" | "Aethera-inspired"
  creativity: number;      // 0.0 = safe (top-rated only), 1.0 = wild (try untested)
  sections: ForgePlanSection[];
  palette: { bg: string; text: string; muted: string; accent: string };
  fonts: { display: string; body: string };
  overallReason: string;
  generatedAt: string;
}

export interface ForgeGenerateOptions {
  target?: string;                  // business description | "random" (default)
  creativity?: number;              // 0.0-1.0, default 0.5
  inspirationIds?: string[];        // technique IDs to bias toward
  avoidIds?: string[];              // technique IDs to avoid (from bad reviews)
  imageInspiration?: string;        // image URL to bias toward (VLM summary)
  sectionCount?: number;            // 2-6, default 3-4
  model?: string;                   // default glm-4-flash
  timeoutMs?: number;               // default 30000
}

export interface ForgeGenerationResult {
  plan: ForgePlan;
  spec: StructuredSpec;
  html: string;
  businessName: string;
}

/* ============================================================================
 * Plan generation (LLM-driven)
 * ========================================================================== */

const REASONER_SYSTEM_PROMPT = `You are the Forge Reasoner — a website design combiner. You pick techniques from a library of extracted design moves and combine them into a novel website plan.

YOUR JOB
1. Read the target description (or "random") and the available techniques.
2. Pick 2-6 techniques (at least 1 hero, 0-1 footer, 0-4 sections) that would combine well.
3. For each pick, explain WHY (1 sentence) — citing user rating if available, or novelty if exploring.
4. Apply mutations — swap colors, fonts, or copy to make the combination coherent (not a frankenstein).
5. Return a structured JSON plan.

CREATIVITY DIAL
- 0.0 = Safe: only pick techniques with userRating 4-5. Pick techniques that already work together (e.g. dark hero + dark footer).
- 0.5 = Balanced: 50% top-rated, 50% untested but promising.
- 1.0 = Wild: prioritize untested techniques. Try unusual combinations (e.g. cinematic hero + minimalist footer).

OUTPUT JSON SHAPE (return ONLY JSON, no markdown fences):
{
  "businessName": "string — generated from target, e.g. 'Lumen Studio' or 'Apex Digital'",
  "sections": [
    {
      "partType": "hero | footer | section | stats | gallery | testimonials | faq | pricing | cta | partners | blog | team | contact | nav | button | background | animation | interaction | 3d | js",
      "pickedTechniqueId": "string — the ID of the technique from the library",
      "reason": "string — 1 sentence why this was picked, citing rating or novelty",
      "mutations": ["string — specific mutations applied, e.g. 'swapped bg #000 → #0a0a0a'", "'changed headline to target-specific copy'"]
    }
  ],
  "palette": {
    "bg": "#hex",
    "text": "#hex",
    "muted": "#hex",
    "accent": "#hex"
  },
  "fonts": {
    "display": "FontName",
    "body": "FontName"
  },
  "overallReason": "string — 1-2 sentence summary of the overall combination strategy"
}

RULES
- Pick at least 1 hero (required).
- Pick at most 1 footer.
- Pick 2-6 sections total (including hero + footer).
- The palette and fonts must be coherent — don't mix warm earth tones with neon cyberpunk.
- Mutations should make the combination feel intentional, not random.
- If the target is "random", pick a cohesive aesthetic (cinematic, minimal, editorial, etc.) and stick to it.
- If the target is a specific business type, mutate copy (headline, body, CTA) to match.
- Cite user ratings in reasons: "rated 5★ by you" or "untested but matches target aesthetic".`;

export async function planForgeGeneration(opts: ForgeGenerateOptions = {}): Promise<ForgePlan> {
  const target = opts.target || 'random';
  const creativity = typeof opts.creativity === 'number' ? opts.creativity : 0.5;
  const sectionCount = opts.sectionCount || (creativity > 0.7 ? 5 : creativity > 0.3 ? 4 : 3);
  const model = opts.model || 'glm-4-flash';
  const timeoutMs = opts.timeoutMs || 30000;

  // 1. Gather candidate techniques for each part type.
  const candidates = await gatherCandidates(creativity, opts.inspirationIds, opts.avoidIds);

  // 2. Build the user prompt with technique options.
  const techniqueOptions = formatTechniqueOptions(candidates);

  // 3. Call the LLM to plan — tries multi-provider (Groq + Z.AI)
  const userPrompt = `TARGET: ${target}\nCREATIVITY: ${creativity} (0=safe, 1=wild)\nDESIRED SECTION COUNT: ${sectionCount}\n${opts.imageInspiration ? `IMAGE INSPIRATION SUMMARY: ${opts.imageInspiration}\n` : ''}\nAVAILABLE TECHNIQUES (pick from these):\n${techniqueOptions}\n\nReturn ONLY the JSON plan.`;

  // Try multi-provider LLM first (Groq if configured, then Z.AI)
  const response = await callLLM(
    [
      { role: 'system', content: REASONER_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    {
      model: opts.model || 'llama-3.3-70b-versatile', // Default to Groq's most intelligent model
      temperature: 0.5 + creativity * 0.5,
      maxTokens: 2000,
      provider: 'auto',
      timeoutMs: 20000,
    },
  );

  // If LLM unavailable, fall back to smart random selection
  if (!response) {
    console.warn('[forge-reasoner] LLM unavailable, using smart random selection');
    return await planForgeRandom(target, creativity, sectionCount, candidates);
  }

  const content: string = response?.choices?.[0]?.message?.content ?? '';
  const json = parseJsonFromLLM(content);
  if (!json) {
    console.warn('[forge-reasoner] LLM returned unparseable JSON, using smart random selection');
    return await planForgeRandom(target, creativity, sectionCount, candidates);
  }

  // 4. Resolve each picked technique ID → full Technique + apply mutations.
  const allTechniques = await loadTechniques();
  const byId = new Map(allTechniques.map((t) => [t.id, t]));

  const planSections: ForgePlanSection[] = [];
  for (const s of json.sections || []) {
    const technique = byId.get(s.pickedTechniqueId);
    if (!technique) {
      // LLM hallucinated an ID — fall back to a random technique of the right partType
      const fallback = await randomTechnique(s.partType);
      if (!fallback) continue;
      console.warn(`[forge-reasoner] Technique ${s.pickedTechniqueId} not found, using fallback ${fallback.id}`);
      planSections.push({
        partType: s.partType,
        pickedTechniqueId: fallback.id,
        pickedTechniqueName: fallback.name,
        sourcePromptId: fallback.sourcePromptId,
        sourcePromptTitle: fallback.sourcePromptTitle,
        reason: s.reason || `Fallback pick (original not found)`,
        mutations: s.mutations || [],
        sectionSpec: applyMutations(fallback, json.palette, json.fonts, target),
      });
      continue;
    }
    planSections.push({
      partType: s.partType,
      pickedTechniqueId: technique.id,
      pickedTechniqueName: technique.name,
      sourcePromptId: technique.sourcePromptId,
      sourcePromptTitle: technique.sourcePromptTitle,
      reason: s.reason || 'Picked for combination',
      mutations: s.mutations || [],
      sectionSpec: applyMutations(technique, json.palette, json.fonts, target),
    });
  }

  const plan: ForgePlan = {
    id: `forge-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    target,
    creativity,
    sections: planSections,
    palette: {
      bg: json.palette?.bg || '#0a0a0a',
      text: json.palette?.text || '#ffffff',
      muted: json.palette?.muted || '#888888',
      accent: json.palette?.accent || '#ffffff',
    },
    fonts: {
      display: json.fonts?.display || 'Instrument Serif',
      body: json.fonts?.body || 'Inter',
    },
    overallReason: json.overallReason || `Combined ${planSections.length} techniques for ${target}.`,
    generatedAt: new Date().toISOString(),
  };

  return plan;
}

/* ============================================================================
 * Apply mutations to a technique → produce a renderable Section
 * ========================================================================== */

function applyMutations(
  technique: Technique,
  palette: { bg: string; text: string; muted: string; accent: string },
  fonts: { display: string; body: string },
  target: string,
): Section {
  // Start from the technique's spec (a copy, not a reference)
  const base: Section = JSON.parse(JSON.stringify(technique.spec)) as Section;

  // Apply palette overrides — but only if the technique doesn't have a per-section override
  // (per-section overrides are intentional design decisions we want to preserve)
  if (!base.bg) {
    // Mutate the bg to the plan palette (with some randomness for variety)
    base.bg = palette.bg;
  }
  if (!base.color) {
    base.color = palette.text;
  }

  // If the technique had a headline, keep it (it's part of the technique's identity).
  // If not, generate a target-specific one.
  if (!base.headline && target !== 'random') {
    base.headline = generateHeadline(target);
  }

  // If the technique had a CTA, keep it. Otherwise use a generic one.
  if (!base.cta) {
    base.cta = target === 'random' ? 'Get Started' : 'Start Today';
  }

  // Ensure the section has an ID
  if (!base.id) {
    base.id = `${technique.partType}-${Math.random().toString(36).slice(2, 6)}`;
  }

  return base;
}

function generateHeadline(target: string): string {
  // Simple heuristic — for a real version, the LLM would generate this.
  const words = target.split(/\s+/).filter((w) => w.length > 2);
  if (words.length === 0) return 'Build something beautiful.';
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  if (target.toLowerCase().includes('coffee')) return 'Brewed with intention.';
  if (target.toLowerCase().includes('law') || target.toLowerCase().includes('legal')) return 'Counsel you can trust.';
  if (target.toLowerCase().includes('tech') || target.toLowerCase().includes('saas')) return 'Tools for builders.';
  if (target.toLowerCase().includes('gym') || target.toLowerCase().includes('fitness')) return 'Stronger every day.';
  if (target.toLowerCase().includes('restaurant') || target.toLowerCase().includes('dining')) return 'A taste of somewhere else.';
  if (target.toLowerCase().includes('salon') || target.toLowerCase().includes('spa')) return 'Rest. Restore. Return.';
  if (target.toLowerCase().includes('estate') || target.toLowerCase().includes('realty')) return 'Find your place.';
  // Generic
  return `${cap(words[0])}, reimagined.`;
}

/* ============================================================================
 * Assemble StructuredSpec from a ForgePlan
 * ========================================================================== */

export function applyForgePlan(plan: ForgePlan): StructuredSpec {
  const sections: Section[] = plan.sections.map((ps) => ps.sectionSpec);

  // Derive businessName from plan or first section
  const businessName = (plan as any).businessName || deriveBusinessName(plan.target);

  return {
    businessName,
    logo: businessName,
    tagline: null,
    fonts: {
      display: plan.fonts.display,
      body: plan.fonts.body,
      weights: [400, 500, 600],
    },
    colors: {
      bg: plan.palette.bg,
      text: plan.palette.text,
      muted: plan.palette.muted,
      accent: plan.palette.accent,
      surface: null,
      border: null,
    },
    promptType: 'landing-page',
    navItems: ['Home', 'About', 'Services', 'Contact'],
    ctaText: 'Get Started',
    sections,
    animations: [],
    media: { videoUrls: [], imageUrls: [] },
    styleHints: '',
    source: 'llm',
    promptId: plan.id,
    promptTitle: `Forge: ${plan.target}`,
  };
}

function deriveBusinessName(target: string): string {
  if (target === 'random' || !target) return 'Studio Forge';
  const words = target.split(/\s+/).filter((w) => w.length > 2);
  if (words.length === 0) return 'Studio Forge';
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  // Take the first meaningful word + "Studio" / "Co" / "Labs"
  const suffixes = ['Studio', 'Co', 'Labs', 'Collective', 'House'];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  return `${cap(words[0])} ${suffix}`;
}

/* ============================================================================
 * Orchestrator: plan → apply → render → return
 * ========================================================================== */

export async function forgeGenerate(opts: ForgeGenerateOptions = {}): Promise<ForgeGenerationResult> {
  // 1. Plan
  const plan = await planForgeGeneration(opts);

  // 2. Apply → StructuredSpec
  const spec = applyForgePlan(plan);

  // 3. Render via V2 renderer
  const { renderStructuredSite } = await import('../prompt-recreator');
  const html = renderStructuredSite(spec);

  return {
    plan,
    spec,
    html,
    businessName: spec.businessName,
  };
}

/* ============================================================================
 * Helpers
 * ========================================================================== */

async function gatherCandidates(
  creativity: number,
  inspirationIds: string[] = [],
  avoidIds: string[] = [],
): Promise<Record<PartType, Technique[]>> {
  const all = await loadTechniques();
  const avoidSet = new Set(avoidIds);
  const inspirationSet = new Set(inspirationIds);

  // Filter out avoided techniques
  const usable = all.filter((t) => !t.avoided && !avoidSet.has(t.id));

  // For each part type, gather top-rated + untested (creativity-weighted)
  const partTypes: PartType[] = ['hero', 'section', 'footer', 'cta', 'stats', 'testimonials', 'partners', 'faq', 'pricing', 'blog', 'gallery', 'team', 'contact'];
  const candidates: Record<PartType, Technique[]> = {} as any;
  for (const pt of partTypes) {
    const ofPart = usable.filter((t) => t.partType === pt);
    // Top-rated (4-5★)
    const top = ofPart.filter((t) => t.userRating && t.userRating >= 4).sort((a, b) => b.score - a.score).slice(0, 5);
    // Untested but high-potential (no rating, not avoided)
    const untested = ofPart.filter((t) => !t.userRating).slice(0, 10);
    // Inspiration-biased (if user passed inspirationIds, prefer these)
    const inspired = ofPart.filter((t) => inspirationSet.has(t.id));

    // Mix based on creativity:
    // - creativity 0: all top-rated
    // - creativity 0.5: 50/50 top-rated + untested
    // - creativity 1: all untested
    const topCount = Math.round((1 - creativity) * 5);
    const untestedCount = Math.round(creativity * 5) + 2;
    const picked = [
      ...inspired.slice(0, 2),
      ...top.slice(0, topCount),
      ...untested.slice(0, untestedCount),
    ].slice(0, 8);

    candidates[pt] = picked.length > 0 ? picked : ofPart.slice(0, 5);
  }

  return candidates;
}

function formatTechniqueOptions(candidates: Record<PartType, Technique[]>): string {
  const lines: string[] = [];
  for (const [pt, techniques] of Object.entries(candidates)) {
    if (techniques.length === 0) continue;
    lines.push(`\n${pt.toUpperCase()} (${techniques.length} available):`);
    for (const t of techniques) {
      const rating = t.userRating ? ` [rated ${t.userRating}★]` : ' [untested]';
      const tags = t.tags.length > 0 ? ` tags: ${t.tags.slice(0, 4).join(',')}` : '';
      const colors = t.colors.length > 0 ? ` colors: ${t.colors.slice(0, 3).join(',')}` : '';
      const fonts = t.fonts.length > 0 ? ` fonts: ${t.fonts.slice(0, 2).join(',')}` : '';
      lines.push(`  - id: ${t.id}${rating} — ${t.name.slice(0, 80)}${tags}${colors}${fonts}`);
    }
  }
  return lines.join('\n');
}

function parseJsonFromLLM(content: string): any | null {
  if (!content) return null;
  let text = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) return null;
  try {
    return JSON.parse(text.slice(first, last + 1));
  } catch {
    try {
      return JSON.parse(text.slice(first, last + 1).replace(/,(\s*[}\]])/g, '$1'));
    } catch {
      return null;
    }
  }
}

/* ============================================================================
 * Random fallback (when LLM is unavailable)
 * ========================================================================== */

/**
 * Pick techniques randomly without LLM reasoning.
 * Used when the LLM is rate-limited or unavailable.
 * Still produces a valid ForgePlan with a coherent palette + fonts.
 */
async function planForgeRandom(
  target: string,
  creativity: number,
  sectionCount: number,
  candidates: Record<PartType, Technique[]>,
): Promise<ForgePlan> {
  // SMART RANDOM — picks a cohesive palette from the hero, then matches
  // all subsequent sections to that palette for visual consistency.
  
  const picks: ForgePlanSection[] = [];

  // Step 1: Pick a hero — this determines the palette
  const heroTechniques = candidates['hero'] || [];
  if (heroTechniques.length === 0) {
    // No heroes available — return empty plan
    return {
      id: `forge-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      target, creativity, sections: [],
      palette: { bg: '#0a0a0a', text: '#ffffff', muted: '#888888', accent: '#ffffff' },
      fonts: { display: 'Instrument Serif', body: 'Inter' },
      overallReason: 'No techniques available.',
      generatedAt: new Date().toISOString(),
    };
  }

  const hero = heroTechniques[Math.floor(Math.random() * heroTechniques.length)];
  
  // Derive palette from hero's colors
  const heroColors = hero.colors || [];
  const isDark = heroColors.some(c => {
    const v = parseInt(c.slice(1, 3), 16);
    return v < 60;
  });
  
  // Use the hero's actual colors, or a sensible default
  const palette = {
    bg: heroColors[0] || (isDark ? '#0a0a0a' : '#FFFFFF'),
    text: heroColors[1] || (isDark ? '#FFFFFF' : '#000000'),
    muted: heroColors[2] || (isDark ? '#888888' : '#6F6F6F'),
    accent: heroColors[3] || heroColors[1] || (isDark ? '#FFFFFF' : '#000000'),
  };
  
  // Derive fonts from hero
  const fonts = {
    display: hero.fonts[0] || 'Instrument Serif',
    body: hero.fonts[1] || hero.fonts[0] || 'Inter',
  };
  
  picks.push({
    partType: 'hero',
    pickedTechniqueId: hero.id,
    pickedTechniqueName: hero.name,
    sourcePromptId: hero.sourcePromptId,
    sourcePromptTitle: hero.sourcePromptTitle,
    reason: `Selected ${hero.sourcePromptTitle} hero — ${isDark ? 'dark' : 'light'} aesthetic with ${fonts.display}`,
    mutations: [`Inherited palette from hero: ${palette.bg}/${palette.text}`],
    sectionSpec: applyMutations(hero, palette, fonts, target),
  });

  // Step 2: Pick 1-2 sections that match the hero's palette
  const sectionTechniques = (candidates['section'] || []).filter(t => {
    // Prefer sections with similar color scheme
    const tIsDark = (t.colors || []).some(c => parseInt(c.slice(1, 3), 16) < 60);
    return tIsDark === isDark;
  });
  
  // Vary section count: 1-3 sections + optional CTA + optional stats + footer
  const numSections = Math.min(Math.floor(Math.random() * 3) + 1, sectionTechniques.length); // 1-3 random
  const usedIds = new Set([hero.id]);
  // Shuffle the section techniques for variety
  const shuffledSections = [...sectionTechniques].sort(() => Math.random() - 0.5);
  for (let i = 0; i < numSections; i++) {
    const available = shuffledSections.filter(t => !usedIds.has(t.id));
    if (available.length === 0) break;
    const t = available[Math.floor(Math.random() * available.length)];
    usedIds.add(t.id);
    picks.push({
      partType: 'section',
      pickedTechniqueId: t.id,
      pickedTechniqueName: t.name,
      sourcePromptId: t.sourcePromptId,
      sourcePromptTitle: t.sourcePromptTitle,
      reason: `Added ${t.sourcePromptTitle} section — matches ${isDark ? 'dark' : 'light'} theme`,
      mutations: [`Adapted colors to match hero palette`],
      sectionSpec: applyMutations(t, palette, fonts, target),
    });
  }

  // Step 3: Add a footer if available and matching
  const footerTechniques = (candidates['footer'] || []).filter(t => {
    const tIsDark = (t.colors || []).some(c => parseInt(c.slice(1, 3), 16) < 60);
    return tIsDark === isDark;
  });
  if (footerTechniques.length > 0) {
    const t = footerTechniques[Math.floor(Math.random() * footerTechniques.length)];
    if (!usedIds.has(t.id)) {
      usedIds.add(t.id);
      picks.push({
        partType: 'footer',
        pickedTechniqueId: t.id,
        pickedTechniqueName: t.name,
        sourcePromptId: t.sourcePromptId,
        sourcePromptTitle: t.sourcePromptTitle,
        reason: `Added ${t.sourcePromptTitle} footer — completes the ${isDark ? 'dark' : 'light'} theme`,
        mutations: [`Adapted to match palette`],
        sectionSpec: applyMutations(t, palette, fonts, target),
      });
    }
  }

  // Step 4: Optionally add a CTA section (50% chance)
  const ctaTechniques = candidates['cta'] || [];
  if (ctaTechniques.length > 0 && Math.random() > 0.5) {
    const t = ctaTechniques[Math.floor(Math.random() * ctaTechniques.length)];
    if (!usedIds.has(t.id)) {
      usedIds.add(t.id);
      picks.push({
        partType: 'cta',
        pickedTechniqueId: t.id,
        pickedTechniqueName: t.name,
        sourcePromptId: t.sourcePromptId,
        sourcePromptTitle: t.sourcePromptTitle,
        reason: `Added ${t.sourcePromptTitle} CTA — drives action`,
        mutations: [`Adapted to match palette`],
        sectionSpec: applyMutations(t, palette, fonts, target),
      });
    }
  }

  // Step 5: Optionally add stats (30% chance)
  const statsTechniques = candidates['stats'] || [];
  if (statsTechniques.length > 0 && Math.random() > 0.7) {
    const t = statsTechniques[Math.floor(Math.random() * statsTechniques.length)];
    if (!usedIds.has(t.id)) {
      usedIds.add(t.id);
      picks.push({
        partType: 'stats',
        pickedTechniqueId: t.id,
        pickedTechniqueName: t.name,
        sourcePromptId: t.sourcePromptId,
        sourcePromptTitle: t.sourcePromptTitle,
        reason: `Added ${t.sourcePromptTitle} stats — shows credibility`,
        mutations: [`Adapted to match palette`],
        sectionSpec: applyMutations(t, palette, fonts, target),
      });
    }
  }

  return {
    id: `forge-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    target, creativity,
    sections: picks,
    palette,
    fonts,
    overallReason: `Cohesive ${isDark ? 'dark' : 'light'} website with ${fonts.display} + ${fonts.body}, combining ${picks.length} matching techniques. ${target !== 'random' ? `Tailored for: ${target}.` : ''}`,
    generatedAt: new Date().toISOString(),
  };
}
