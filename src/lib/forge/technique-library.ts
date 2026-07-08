/**
 * Forge Technique Library
 * =======================
 *
 * Indexes "techniques" extracted from MotionSites prompts AND user-uploaded
 * screenshots. A technique is a single reusable design move — a hero treatment,
 * a footer style, a nav layout, a button hover effect, an animation pattern.
 *
 * The Forge Reasoner (Phase 2) picks from this library when generating new
 * websites. The Review System (Phase 3) updates ratings/avoid-counts based on
 * your 1-5 emoji feedback.
 *
 * STORAGE
 *   - Primary: Supabase table `forge_techniques` (if reachable)
 *   - Cache/Fallback: local JSON at /home/z/my-project/data/techniques.json
 *   - Both are kept in sync; reads hit the in-memory cache first.
 */

import fs from 'fs';
import path from 'path';
import { loadMotionPrompts, type MotionPrompt } from '../motionsites-prompts';
import {
  extractStructuredSpecsViaLLM,
  type StructuredSpec,
  type Section,
  type SectionType,
} from '../prompt-recreator';

/* ============================================================================
 * Types
 * ========================================================================== */

export type PartType =
  | 'hero' | 'footer' | 'nav' | 'button' | 'section'
  | 'background' | 'animation' | 'interaction' | '3d' | 'js'
  | 'stats' | 'gallery' | 'testimonials' | 'faq' | 'pricing'
  | 'team' | 'contact' | 'blog' | 'cta' | 'partners';

export const ALL_PART_TYPES: PartType[] = [
  'hero', 'footer', 'nav', 'button', 'section',
  'background', 'animation', 'interaction', '3d', 'js',
  'stats', 'gallery', 'testimonials', 'faq', 'pricing',
  'team', 'contact', 'blog', 'cta', 'partners',
];

export interface Technique {
  id: string;
  sourcePromptId: string;          // 'aethera-hero' | 'user-upload:filename.png'
  sourcePromptTitle: string;
  sourceType: 'prompt' | 'image';
  partType: PartType;
  subtype?: string;                // 'video-bg' | 'centered' | 'split' | etc.
  name: string;                    // human label
  spec: Partial<Section>;          // the rendered spec snippet
  fonts: string[];
  colors: string[];
  mediaUrls: string[];
  tags: string[];
  userRating?: 1 | 2 | 3 | 4 | 5;
  usageCount: number;
  avoidCount: number;
  avoided: boolean;                // true if trashed 3+ times
  score: number;                   // computed: userRating*2 - avoidCount*1.5 + usageCount*0.3
  extractedAt: string;
}

export interface TechniqueStats {
  total: number;
  byPartType: Record<PartType, number>;
  bySourceType: { prompt: number; image: number };
  topRated: Technique[];
  recentlyAvoided: Technique[];
  totalExtractedFromPrompts: number;
  totalExtractedFromImages: number;
}

/* ============================================================================
 * Mapping: SectionType → PartType
 * ========================================================================== */

const SECTION_TO_PART: Record<SectionType, PartType> = {
  'hero-video': 'hero',
  'hero-centered': 'hero',
  'hero-split': 'hero',
  'hero-image': 'hero',
  'features-grid': 'section',
  'stats-row': 'stats',
  'gallery-masonry': 'gallery',
  'gallery-grid': 'gallery',
  'partners-row': 'partners',
  'cta-band': 'cta',
  'testimonials': 'testimonials',
  'faq-accordion': 'faq',
  'about-text': 'section',
  'pricing': 'pricing',
  'contact-form': 'contact',
  'footer': 'footer',
  'team-grid': 'team',
  'blog-list': 'blog',
  'custom': 'section',
};

/** Subtype label derived from section type + media presence. */
function deriveSubtype(section: Section): string {
  switch (section.type) {
    case 'hero-video': return 'video-bg';
    case 'hero-centered': return 'centered';
    case 'hero-split': return 'split';
    case 'hero-image': return 'image-bg';
    case 'features-grid': return 'grid';
    case 'stats-row': return 'stat-row';
    case 'gallery-masonry': return 'masonry';
    case 'gallery-grid': return 'grid';
    case 'partners-row': return 'logo-row';
    case 'cta-band': return 'inverted-band';
    case 'testimonials': return 'quote-cards';
    case 'faq-accordion': return 'accordion';
    case 'about-text': return 'prose';
    case 'pricing': return 'tier-cards';
    case 'contact-form': return 'form';
    case 'footer': return section.items?.length ? 'multi-col' : 'minimal';
    case 'team-grid': return 'card-grid';
    case 'blog-list': return 'card-grid';
    default: return 'generic';
  }
}

/** Derive style tags from a section's spec. */
function deriveTags(section: Section, spec: StructuredSpec): string[] {
  const tags = new Set<string>();
  const bg = (section.bg || spec.colors.bg || '').toLowerCase();
  const text = (section.color || spec.colors.text || '').toLowerCase();

  // Color-based tags
  if (bg === '#000000' || bg === '#000' || bg.startsWith('#0')) tags.add('dark');
  if (bg === '#ffffff' || bg === '#fff' || bg.startsWith('#f')) tags.add('light');
  if (spec.colors.accent) tags.add('accented');

  // Animation tags
  if (section.animation === 'fade-rise') tags.add('fade-rise');
  if (section.animation === 'blur') tags.add('blur-in');
  if (section.animation === 'ken-burns') tags.add('ken-burns');
  if (section.animation === 'parallax') tags.add('parallax');
  if (section.animation === 'scale') tags.add('hover-scale');

  // Media tags
  if (section.mediaUrl?.endsWith('.mp4') || section.mediaUrl?.endsWith('.webm')) tags.add('video');
  if (section.mediaUrl && !section.mediaUrl.endsWith('.mp4') && !section.mediaUrl.endsWith('.webm')) tags.add('image');

  // Font tags
  if (spec.fonts.display?.includes('Serif')) tags.add('serif-display');
  if (spec.fonts.display?.includes('Anton') || spec.fonts.display?.includes('Archivo Black')) tags.add('bold-display');
  if (spec.fonts.body?.includes('Inter')) tags.add('inter-body');

  // Style hints from spec.styleHints
  if (spec.styleHints?.includes('border-radius:9999px')) tags.add('pill-buttons');
  if (spec.styleHints?.includes('glassmorphic') || spec.styleHints?.includes('glass')) tags.add('glassmorphic');

  // Layout-based tags
  if (section.items && section.items.length >= 3) tags.add('multi-item');
  if (section.styleHints?.toLowerCase().includes('cinematic')) tags.add('cinematic');
  if (section.styleHints?.toLowerCase().includes('minimal')) tags.add('minimal');

  return Array.from(tags);
}

/** Human-readable name for a technique. */
function deriveName(section: Section, prompt: MotionPrompt, partType: PartType): string {
  const subtype = deriveSubtype(section);
  const headlineSnippet = (section.headline || '')
    .split(' ')
    .slice(0, 4)
    .join(' ')
    .replace(/[.,;:!?]$/, '');
  if (headlineSnippet) {
    return `${prompt.title} — ${partType} (${subtype}): "${headlineSnippet}..."`;
  }
  return `${prompt.title} — ${partType} (${subtype})`;
}

/* ============================================================================
 * Extraction: Prompt → Techniques
 * ========================================================================== */

/**
 * Extract techniques from a single MotionSites prompt.
 * Uses the existing V2 LLM extractor (extractStructuredSpecsViaLLM).
 * Returns one Technique per section in the extracted StructuredSpec.
 */
export async function extractTechniquesFromPrompt(
  prompt: MotionPrompt,
  opts: { useLLM?: boolean; timeoutMs?: number } = {},
): Promise<Technique[]> {
  const useLLM = opts.useLLM !== false;
  const spec = useLLM
    ? await extractStructuredSpecsViaLLM(prompt, { timeoutMs: opts.timeoutMs })
    : // Sync fallback path
      (await import('../prompt-recreator')).extractStructuredSpecsSync(prompt);

  const techniques: Technique[] = [];
  const now = new Date().toISOString();

  for (const section of spec.sections) {
    const partType = SECTION_TO_PART[section.type] || 'section';
    const subtype = deriveSubtype(section);
    const fonts = [
      ...(spec.fonts.display ? [spec.fonts.display] : []),
      ...(spec.fonts.body && spec.fonts.body !== spec.fonts.display ? [spec.fonts.body] : []),
    ];
    const colors = [
      spec.colors.bg,
      spec.colors.text,
      ...(spec.colors.muted ? [spec.colors.muted] : []),
      ...(spec.colors.accent ? [spec.colors.accent] : []),
      ...(spec.colors.surface ? [spec.colors.surface] : []),
    ].filter(Boolean) as string[];
    const mediaUrls: string[] = [];
    if (section.mediaUrl) mediaUrls.push(section.mediaUrl);
    if (section.items) {
      for (const it of section.items) {
        if (it.mediaUrl) mediaUrls.push(it.mediaUrl);
      }
    }
    const tags = deriveTags(section, spec);
    const name = deriveName(section, prompt, partType);
    const id = `${prompt.id}::${partType}::${section.id || techniques.length}`;

    techniques.push({
      id,
      sourcePromptId: prompt.id,
      sourcePromptTitle: prompt.title,
      sourceType: 'prompt',
      partType,
      subtype,
      name,
      spec: section as Partial<Section>,
      fonts,
      colors,
      mediaUrls: Array.from(new Set(mediaUrls)).slice(0, 5),
      tags,
      usageCount: 0,
      avoidCount: 0,
      avoided: false,
      score: 0,
      extractedAt: now,
    });
  }

  return techniques;
}

/* ============================================================================
 * Extraction: Image → Techniques (VLM-driven)
 * ========================================================================== */

const IMAGE_EXTRACTION_SYSTEM_PROMPT = `You are a website design analyzer. You look at a website screenshot and extract reusable design techniques. Return ONLY valid JSON — no markdown fences, no commentary.

OUTPUT SHAPE:
{
  "techniques": [
    {
      "partType": "hero | footer | nav | button | section | background | animation | interaction | 3d | js | stats | gallery | testimonials | faq | pricing | team | contact | blog | cta | partners",
      "subtype": "string — e.g. 'video-bg', 'centered', 'split', 'inverted-band'",
      "name": "string — human label, e.g. 'Dark cinematic hero with serif headline'",
      "spec": {
        "type": "hero-video | hero-centered | hero-split | hero-image | features-grid | stats-row | gallery-grid | partners-row | cta-band | testimonials | faq-accordion | about-text | pricing | contact-form | footer | team-grid | blog-list | custom",
        "headline": "string | null — the headline text visible in the screenshot, if any",
        "body": "string | null — visible body/description text, if any",
        "cta": "string | null — visible CTA button label, if any",
        "animation": "fade-rise | fade | blur | ken-burns | parallax | scale | slide | rotate | none — best guess based on visual cues",
        "styleHints": "string — extra CSS hints observed, e.g. 'glassmorphic nav, pill buttons, large display serif'",
        "bg": "#hex | null — observed background color",
        "color": "#hex | null — observed text color"
      },
      "fonts": ["FontName — best guess based on letter shapes"],
      "colors": ["#hex — observed colors, max 6"],
      "tags": ["string — descriptive tags like 'dark', 'cinematic', 'serif-display', 'pill-buttons'"]
    }
  ],
  "overallStyle": "string — one-sentence summary of the overall design language"
}

RULES:
- Extract 1-5 techniques per screenshot (don't over-split).
- Each technique must correspond to a visible UI region (hero, nav, footer, section, etc.).
- Use null for fields you cannot determine from the screenshot.
- For fonts, make educated guesses based on letter shapes (Inter, Playfair Display, Instrument Serif, Anton, etc.).
- For colors, extract the actual hex values you observe.
- Be specific in tags — these power the search/filter UI.`;

export async function extractTechniquesFromImage(
  imageUrl: string,
  opts: { userNote?: string; sourceName?: string; timeoutMs?: number } = {},
): Promise<{ techniques: Technique[]; overallStyle: string }> {
  const { zaiVision } = await import('../zai-client');
  const sourceName = opts.sourceName || imageUrl.split('/').pop() || 'unknown-image';
  const sourcePromptId = `user-upload:${sourceName}`;
  const sourcePromptTitle = `Upload: ${sourceName.replace(/\.[^.]+$/, '')}`;
  const now = new Date().toISOString();

  try {
    const response: any = await Promise.race([
      zaiVision(
        IMAGE_EXTRACTION_SYSTEM_PROMPT +
          `\n\nUSER NOTE: ${opts.userNote || '(none)'}\n\nAnalyze this website screenshot and return the JSON.`,
        imageUrl,
      ),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('VLM timeout')), opts.timeoutMs || 60000),
      ),
    ]);

    const content: string = response?.choices?.[0]?.message?.content ?? '';
    const parsed = parseJsonFromLLM(content);
    if (!parsed || !Array.isArray(parsed.techniques)) {
      throw new Error('VLM returned no parseable techniques array');
    }

    const techniques: Technique[] = parsed.techniques.map((t: any, i: number): Technique => {
      const partType = (ALL_PART_TYPES.includes(t.partType) ? t.partType : 'section') as PartType;
      return {
        id: `${sourcePromptId}::${partType}::${i}`,
        sourcePromptId,
        sourcePromptTitle,
        sourceType: 'image',
        partType,
        subtype: t.subtype || 'generic',
        name: t.name || `${sourcePromptTitle} — ${partType}`,
        spec: t.spec || {},
        fonts: Array.isArray(t.fonts) ? t.fonts.filter((f: any) => typeof f === 'string') : [],
        colors: Array.isArray(t.colors) ? t.colors.filter((c: any) => typeof c === 'string').slice(0, 6) : [],
        mediaUrls: [imageUrl],
        tags: Array.isArray(t.tags) ? t.tags.filter((x: any) => typeof x === 'string') : [],
        usageCount: 0,
        avoidCount: 0,
        avoided: false,
        score: 0,
        extractedAt: now,
      };
    });

    return { techniques, overallStyle: parsed.overallStyle || '' };
  } catch (err) {
    console.error('[technique-library] image extraction failed:', err);
    return { techniques: [], overallStyle: '' };
  }
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
 * Persistence (in-memory cache + JSON file + optional Supabase)
 * ========================================================================== */

const DATA_FILE = '/home/z/my-project/data/techniques.json';
let cache: Technique[] | null = null;
let saveTimer: NodeJS.Timeout | null = null;

/** Load techniques from disk (and Supabase if available). */
export async function loadTechniques(force = false): Promise<Technique[]> {
  if (cache && !force) return cache;

  // Try Supabase first
  try {
    const { supabase } = await import('../supabase-client');
    const { data, error } = await supabase
      .from('forge_techniques')
      .select('*')
      .order('extracted_at', { ascending: true });
    if (!error && data && data.length > 0) {
      cache = data.map(rowToTechnique);
      console.log(`[technique-library] Loaded ${cache.length} techniques from Supabase`);
      return cache;
    }
  } catch (e) {
    console.warn('[technique-library] Supabase load failed, falling back to JSON:', e);
  }

  // Fallback: local JSON file
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed: Technique[] = JSON.parse(raw);
      cache = parsed;
      console.log(`[technique-library] Loaded ${parsed.length} techniques from ${DATA_FILE}`);
      return parsed;
    }
  } catch (e) {
    console.warn('[technique-library] JSON load failed:', e);
  }

  cache = [];
  return cache;
}

/** Persist techniques to disk (debounced) and Supabase (best-effort). */
export async function saveTechniques(techniques: Technique[]): Promise<void> {
  cache = techniques;

  // Debounced JSON write
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
      fs.writeFileSync(DATA_FILE, JSON.stringify(techniques, null, 2));
      console.log(`[technique-library] Saved ${techniques.length} techniques to ${DATA_FILE}`);
    } catch (e) {
      console.error('[technique-library] JSON save failed:', e);
    }
  }, 200);

  // Best-effort Supabase upsert (batch)
  try {
    const { supabase } = await import('../supabase-client');
    const rows = techniques.map(techniqueToRow);
    // Upsert in chunks of 100 to avoid payload limits
    for (let i = 0; i < rows.length; i += 100) {
      const chunk = rows.slice(i, i + 100);
      const { error } = await supabase.from('forge_techniques').upsert(chunk, { onConflict: 'id' });
      if (error) {
        console.warn('[technique-library] Supabase upsert error:', error.message);
        break;
      }
    }
  } catch (e) {
    console.warn('[technique-library] Supabase save failed (JSON fallback active):', e);
  }
}

function techniqueToRow(t: Technique): any {
  return {
    id: t.id,
    source_prompt_id: t.sourcePromptId,
    source_prompt_title: t.sourcePromptTitle,
    source_type: t.sourceType,
    part_type: t.partType,
    subtype: t.subtype || null,
    name: t.name,
    spec: t.spec,
    fonts: t.fonts,
    colors: t.colors,
    media_urls: t.mediaUrls,
    tags: t.tags,
    user_rating: t.userRating || null,
    usage_count: t.usageCount,
    avoid_count: t.avoidCount,
    avoided: t.avoided,
    score: t.score,
    extracted_at: t.extractedAt,
  };
}

function rowToTechnique(r: any): Technique {
  return {
    id: r.id,
    sourcePromptId: r.source_prompt_id,
    sourcePromptTitle: r.source_prompt_title,
    sourceType: r.source_type,
    partType: r.part_type as PartType,
    subtype: r.subtype || undefined,
    name: r.name,
    spec: r.spec || {},
    fonts: r.fonts || [],
    colors: r.colors || [],
    mediaUrls: r.media_urls || [],
    tags: r.tags || [],
    userRating: r.user_rating || undefined,
    usageCount: r.usage_count || 0,
    avoidCount: r.avoid_count || 0,
    avoided: r.avoided || false,
    score: r.score || 0,
    extractedAt: r.extracted_at || new Date().toISOString(),
  };
}

/* ============================================================================
 * Mutation operations
 * ========================================================================== */

/** Add new techniques to the library (dedupes by id). */
export async function addTechniques(newTechniques: Technique[]): Promise<Technique[]> {
  const existing = await loadTechniques();
  const byId = new Map(existing.map((t) => [t.id, t]));
  for (const t of newTechniques) {
    byId.set(t.id, { ...byId.get(t.id), ...t });
  }
  const merged = Array.from(byId.values());
  await saveTechniques(merged);
  return merged;
}

/** Update a single technique (e.g. after a review). */
export async function updateTechnique(id: string, patch: Partial<Technique>): Promise<void> {
  const all = await loadTechniques();
  const idx = all.findIndex((t) => t.id === id);
  if (idx === -1) return;
  const updated = { ...all[idx], ...patch };
  // Recompute score
  updated.score = computeScore(updated);
  all[idx] = updated;
  await saveTechniques(all);
}

/** Mark a technique as used in a generation. */
export async function markTechniqueUsed(ids: string[]): Promise<void> {
  const all = await loadTechniques();
  const idSet = new Set(ids);
  for (const t of all) {
    if (idSet.has(t.id)) {
      t.usageCount++;
      t.score = computeScore(t);
    }
  }
  await saveTechniques(all);
}

/** Mark a technique as leading to a bad review (avoid++). */
export async function markTechniqueAvoided(ids: string[]): Promise<void> {
  const all = await loadTechniques();
  const idSet = new Set(ids);
  for (const t of all) {
    if (idSet.has(t.id)) {
      t.avoidCount++;
      if (t.avoidCount >= 3 && (!t.userRating || t.userRating < 3)) {
        t.avoided = true;
      }
      t.score = computeScore(t);
    }
  }
  await saveTechniques(all);
}

/** Set user rating on a technique (max of existing). */
export async function setTechniqueRating(id: string, rating: 1 | 2 | 3 | 4 | 5): Promise<void> {
  const all = await loadTechniques();
  const idx = all.findIndex((t) => t.id === id);
  if (idx === -1) return;
  const t = all[idx];
  t.userRating = (!t.userRating || rating > t.userRating) ? rating : t.userRating;
  if (rating >= 4 && t.avoided) t.avoided = false; // loved → un-avoid
  t.score = computeScore(t);
  all[idx] = t;
  await saveTechniques(all);
}

function computeScore(t: Technique): number {
  return (t.userRating || 0) * 2 - t.avoidCount * 1.5 + t.usageCount * 0.3;
}

/* ============================================================================
 * Query helpers
 * ========================================================================== */

export async function techniquesByPartType(partType: PartType, limit = 50): Promise<Technique[]> {
  const all = await loadTechniques();
  return all
    .filter((t) => t.partType === partType && !t.avoided)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export async function techniquesByTag(tag: string, limit = 50): Promise<Technique[]> {
  const all = await loadTechniques();
  const lower = tag.toLowerCase();
  return all
    .filter((t) => t.tags.some((x) => x.toLowerCase().includes(lower)) && !t.avoided)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export async function topRatedTechniques(partType: PartType, n = 5): Promise<Technique[]> {
  const all = await loadTechniques();
  return all
    .filter((t) => t.partType === partType && !t.avoided && t.userRating && t.userRating >= 4)
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
}

export async function randomTechnique(partType: PartType, exclude: string[] = []): Promise<Technique | null> {
  const all = await loadTechniques();
  const excludeSet = new Set(exclude);
  const candidates = all.filter((t) => t.partType === partType && !t.avoided && !excludeSet.has(t.id));
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export async function avoidedTechniques(): Promise<Technique[]> {
  const all = await loadTechniques();
  return all.filter((t) => t.avoided);
}

export async function getTechniqueStats(): Promise<TechniqueStats> {
  const all = await loadTechniques();
  const byPartType = {} as Record<PartType, number>;
  for (const pt of ALL_PART_TYPES) byPartType[pt] = 0;
  let promptCount = 0;
  let imageCount = 0;
  for (const t of all) {
    byPartType[t.partType]++;
    if (t.sourceType === 'prompt') promptCount++;
    else imageCount++;
  }
  const topRated = [...all]
    .filter((t) => t.userRating && t.userRating >= 4)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
  const recentlyAvoided = all.filter((t) => t.avoided).slice(-10);
  return {
    total: all.length,
    byPartType,
    bySourceType: { prompt: promptCount, image: imageCount },
    topRated,
    recentlyAvoided,
    totalExtractedFromPrompts: promptCount,
    totalExtractedFromImages: imageCount,
  };
}

/* ============================================================================
 * Bulk extraction helpers
 * ========================================================================== */

/**
 * Extract techniques from ALL MotionSites prompts.
 * Returns progress callbacks for UI streaming.
 */
export async function extractAllFromPrompts(
  opts: {
    useLLM?: boolean;
    onProgress?: (done: number, total: number, current: string) => void;
    skipExisting?: boolean;
  } = {},
): Promise<{ techniques: Technique[]; extracted: number; skipped: number; failed: number }> {
  const prompts = loadMotionPrompts();
  const existing = await loadTechniques();
  const existingPromptIds = new Set(existing.filter((t) => t.sourceType === 'prompt').map((t) => t.sourcePromptId));

  const allNew: Technique[] = [];
  let extracted = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < prompts.length; i++) {
    const prompt = prompts[i];
    opts.onProgress?.(i, prompts.length, prompt.title);

    if (opts.skipExisting && existingPromptIds.has(prompt.id)) {
      skipped++;
      continue;
    }

    try {
      const techniques = await extractTechniquesFromPrompt(prompt, {
        useLLM: opts.useLLM,
        timeoutMs: 30000,
      });
      allNew.push(...techniques);
      extracted++;
    } catch (e) {
      console.error(`[technique-library] Failed to extract from ${prompt.id}:`, e);
      failed++;
    }
  }

  opts.onProgress?.(prompts.length, prompts.length, 'done');

  // Merge with existing
  const merged = await addTechniques(allNew);
  return { techniques: merged, extracted, skipped, failed };
}

/**
 * Extract techniques from a list of image URLs (e.g. user screenshots).
 */
export async function extractAllFromImages(
  imageUrls: Array<{ url: string; name?: string; note?: string }>,
  opts: { onProgress?: (done: number, total: number, current: string) => void } = {},
): Promise<{ techniques: Technique[]; extracted: number; failed: number }> {
  const allNew: Technique[] = [];
  let extracted = 0;
  let failed = 0;

  for (let i = 0; i < imageUrls.length; i++) {
    const { url, name, note } = imageUrls[i];
    opts.onProgress?.(i, imageUrls.length, name || url);
    try {
      const { techniques } = await extractTechniquesFromImage(url, {
        userNote: note,
        sourceName: name,
        timeoutMs: 60000,
      });
      allNew.push(...techniques);
      if (techniques.length > 0) extracted++;
    } catch (e) {
      console.error(`[technique-library] Image extraction failed for ${url}:`, e);
      failed++;
    }
  }

  opts.onProgress?.(imageUrls.length, imageUrls.length, 'done');
  const merged = await addTechniques(allNew);
  return { techniques: merged, extracted, failed };
}

/** Clear all techniques (admin/debug). */
export async function clearAllTechniques(): Promise<void> {
  await saveTechniques([]);
}
