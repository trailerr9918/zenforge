/**
 * MotionSites Prompt Recreator — V2 (Structured Spec Engine)
 * ==========================================================
 *
 * GOAL
 *   Actually READ a MotionSites prompt and recreate the website it describes —
 *   not "swap colors on a fixed template", but extract the prompt's structural
 *   spec (sections, copy, fonts, colors, animations, media) and render exactly
 *   those sections with exactly those specs.
 *
 * KEY DIFFERENCE FROM V1
 *   V1 extracted fonts/colors/video and poured them into ONE fixed 5-section
 *   template ("The Studio" / "Brand Systems" / "12+ Years" / "Work, About,
 *   Journal" / "Twitter, Instagram, Email"). That body content was hardcoded —
 *   it didn't come from the prompt. So even when extraction was perfect, the
 *   output was still template-bolted-on.
 *
 *   V2 asks the LLM to parse the prompt into a list of SECTIONS, then walks
 *   that list and renders each section by type. If the prompt only describes
 *   a hero (like Aethera), the output is only a hero. If the prompt describes
 *   a multi-section landing page (like Aetheris Voyage), the output has every
 *   section in order.
 *
 * PIPELINE
 *   1. Find prompt by slug/title.
 *   2. extractStructuredSpecsViaLLM(prompt)  → calls ZAI with a strict JSON
 *      schema. Falls back to extractSpecs (regex) if LLM unavailable.
 *   3. renderStructuredSite(spec)            → walks spec.sections and emits
 *      per-section HTML. Each section type has its own renderer.
 */

import { loadMotionPrompts, type MotionPrompt } from './motionsites-prompts';

/* ============================================================================
 * Types — Structured Spec
 * ========================================================================== */

export type SectionType =
  | 'hero-video'
  | 'hero-centered'
  | 'hero-split'
  | 'hero-image'
  | 'features-grid'
  | 'stats-row'
  | 'gallery-masonry'
  | 'gallery-grid'
  | 'partners-row'
  | 'cta-band'
  | 'testimonials'
  | 'faq-accordion'
  | 'about-text'
  | 'pricing'
  | 'contact-form'
  | 'footer'
  | 'team-grid'
  | 'blog-list'
  | 'custom';

export type AnimationType =
  | 'fade-rise' | 'fade' | 'blur' | 'ken-burns'
  | 'parallax' | 'scale' | 'slide' | 'rotate' | 'none';

export interface SectionItem {
  title?: string;
  description?: string;
  /** Longer body text — used for testimonials (quote), FAQ answers, about paragraphs. */
  body?: string | null;
  icon?: string | null;
  mediaUrl?: string | null;
  meta?: string | null;
}

export interface Section {
  type: SectionType;
  id: string;
  headline?: string | null;
  /** Plain-text body / description for the section. */
  body?: string | null;
  /** Italic / emphasized words within the headline (for `<em>` styling). */
  emphasizedWords?: string[];
  /** Cursive/script overlay text rendered in the accentFont alongside the headline. */
  accentText?: string | null;
  items?: SectionItem[];
  cta?: string | null;
  mediaUrl?: string | null;
  animation: AnimationType;
  /** Extra CSS hint (e.g. "letter-spacing:-2.46px;line-height:0.95"). */
  styleHints?: string;
  /** Per-section bg override (hex). */
  bg?: string | null;
  /** Per-section text color override (hex). */
  color?: string | null;
}

export interface AnimationDef {
  name: string;
  definition: string;
}

export interface StructuredSpec {
  businessName: string;
  logo: string;
  tagline?: string | null;
  fonts: {
    display: string | null;
    body: string | null;
    /** Optional third font — cursive/script accent (e.g. "Condiment" alongside "Anton"). */
    accentFont?: string | null;
    weights: number[];
  };
  colors: {
    bg: string;
    text: string;
    muted?: string | null;
    accent?: string | null;
    surface?: string | null;
    border?: string | null;
  };
  promptType: string;
  navItems: string[];
  ctaText: string;
  sections: Section[];
  animations: AnimationDef[];
  media: {
    videoUrls: string[];
    imageUrls: string[];
  };
  styleHints?: string;
  /** Where this spec came from — 'llm' or 'regex-fallback'. */
  source: 'llm' | 'regex-fallback';
  /** Original prompt — kept for reference / UI display. */
  promptId: string;
  promptTitle: string;
}

/* Legacy V1 interface — kept for backward compatibility with existing callers. */
export interface ExtractedSpecs {
  fonts: string[];
  colors: string[];
  videoUrls: string[];
  imageUrls: string[];
  headline: string;
  description: string;
  ctaText: string;
  logo: string;
  navItems: string[];
  animations: string[];
  layout: string;
  businessName: string;
  style: string;
}

/* ============================================================================
 * V1 Regex Extractor — kept as fallback when LLM is unavailable
 * ========================================================================== */

const KNOWN_FONTS = [
  'Instrument Serif', 'Inter', 'Playfair Display', 'Space Grotesk',
  'Anton', 'Fraunces', 'Source Sans 3', 'Syne', 'Bricolage Grotesque',
  'DM Serif Display', 'Poppins', 'Nunito', 'Pacifico', 'Cormorant Garamond',
  'Lato', 'Great Vibes', 'Dancing Script', 'Montserrat', 'Merriweather',
  'Open Sans', 'Archivo Black', 'Helvetica Now', 'Kanit', 'Barlow',
  'Oswald', 'Bebas Neue', 'Roboto', 'Roboto Mono', 'JetBrains Mono',
  'IBM Plex Sans', 'IBM Plex Serif', 'IBM Plex Mono', 'Sora', 'Manrope',
  'Outfit', 'Plus Jakarta Sans', 'Geist', 'Geist Mono',
];

export function extractSpecs(prompt: MotionPrompt): ExtractedSpecs {
  const text = prompt.promptText;

  const fonts = new Set<string>();
  for (const f of KNOWN_FONTS) if (text.includes(f)) fonts.add(f);

  const colors = Array.from(new Set(text.match(/#[0-9a-fA-F]{6}\b/g) || []));

  const videoUrls = text.match(/https?:\/\/[^\s"'<>]+\.(?:mp4|webm)/g) || [];
  const imageUrls = (text.match(/https?:\/\/[^\s"'<>]+\.(?:png|jpg|jpeg|webp|gif)/g) || []).slice(0, 5);

  let headline = '';
  const headlinePatterns = [
    /(?:Headline|Heading):\s*(?:Text:\s*)?"([^"]+)"/i,
    /(?:Headline|Heading):\s*(?:Text:\s*)?([^\n]+)/i,
    /Text:\s*"([^"]{10,})"/i,
    /text['":]\s*"([^"]{10,})"/i,
  ];
  for (const pattern of headlinePatterns) {
    const m = text.match(pattern);
    if (m && m[1] && m[1].length > 5) { headline = m[1].trim(); break; }
  }

  let description = '';
  const descPatterns = [
    /(?:Description|Subtext|Sub|Body text):\s*(?:Text:\s*)?"([^"]+)"/i,
    /(?:Description|Subtext):\s*\n?(?:Text:\s*)?"([^"]+)"/i,
  ];
  for (const pattern of descPatterns) {
    const m = text.match(pattern);
    if (m && m[1] && m[1].length > 10) { description = m[1].trim(); break; }
  }

  let ctaText = 'Get Started';
  const ctaMatch = text.match(/(?:CTA|Button).*?(?:Text|Label):\s*"([^"]+)"/i);
  if (ctaMatch) ctaText = ctaMatch[1];
  else {
    const ctaPhrases = ['Begin Journey', 'Get Started', 'Sign Up', 'Enroll Now', 'Start', 'Learn More', 'Get It Free', 'Start Digging', 'Contact Us', 'Explore', 'Discover'];
    for (const phrase of ctaPhrases) if (text.includes(phrase)) { ctaText = phrase; break; }
  }

  let logo = '';
  const logoMatch = text.match(/Logo:\s*"?([^"\n,]+)"?/i);
  if (logoMatch) logo = logoMatch[1].trim();
  else logo = prompt.title;
  const businessName = logo.replace(/[®™©]/g, '').trim();

  const navItems: string[] = [];
  // Use [\s\S]+? so the lazy match can span newlines (the dot doesn't match \n by default).
  // Strip repeated "Menu items:" lines and styling hints before extracting the names.
  const navMatch = text.match(/(?:Menu items|Navigation|Nav links):\s*([\s\S]+?)(?:\n\n|CTA button|Layout:|Size:|Hero Section)/i);
  if (navMatch) {
    const navText = navMatch[1]
      .replace(/\([^)]*\)/g, '')       // strip parenthesized color/style descriptions
      .replace(/\b(?:text-sm|transition-colors|font-medium|px-\d+|py-\d+|text-[a-z0-9-]+)\b[^,\n]*/gi, ' ') // strip tailwind class hints
      .replace(/Menu items:/gi, ' ')   // remove repeated "Menu items:" labels
      .replace(/\s+/g, ' ')
      .trim();
    const quoted = navText.match(/"([^"]+)"/g);
    if (quoted) quoted.forEach(q => navItems.push(q.replace(/"/g, '')));
    else navItems.push(...navText.split(/[,/|]/).map(s => s.trim()).filter(s => s.length > 1 && s.length < 24));
  }
  if (navItems.length === 0) navItems.push('Home', 'About', 'Services', 'Contact');

  const animations: string[] = [];
  const lowerText = text.toLowerCase();
  if (lowerText.includes('fade-rise') || lowerText.includes('faderise')) animations.push('fade-rise');
  if (lowerText.includes('blur')) animations.push('blur');
  if (lowerText.includes('ken burns') || lowerText.includes('kenburns')) animations.push('ken-burns');
  if (lowerText.includes('parallax')) animations.push('parallax');
  if (lowerText.includes('scale') && (lowerText.includes('hover') || lowerText.includes('animation'))) animations.push('scale');
  if (lowerText.includes('transition')) animations.push('transition');
  if (lowerText.includes('fade') && !animations.includes('fade-rise')) animations.push('fade');
  if (lowerText.includes('slide')) animations.push('slide');
  if (lowerText.includes('rotate') || lowerText.includes('rotation')) animations.push('rotate');

  let layout = 'standard';
  if (lowerText.includes('video') && lowerText.includes('background')) layout = 'video-hero';
  else if (lowerText.includes('split')) layout = 'split';
  else if (lowerText.includes('centered') || lowerText.includes('full-screen') || lowerText.includes('fullscreen')) layout = 'fullscreen-centered';
  else if (lowerText.includes('grid')) layout = 'grid';
  else if (lowerText.includes('masonry')) layout = 'masonry';

  let style = 'modern';
  if (lowerText.includes('cinematic')) style = 'cinematic';
  else if (lowerText.includes('glassmorphic') || lowerText.includes('glass')) style = 'glassmorphic';
  else if (lowerText.includes('minimal')) style = 'minimal';
  else if (lowerText.includes('bold')) style = 'bold';
  else if (lowerText.includes('playful')) style = 'playful';
  else if (lowerText.includes('editorial')) style = 'editorial';
  else if (lowerText.includes('dark')) style = 'dark';

  return {
    fonts: Array.from(fonts), colors, videoUrls, imageUrls,
    headline, description, ctaText, logo, navItems: navItems.slice(0, 6),
    animations, layout, businessName, style,
  };
}

/* ============================================================================
 * V2 LLM-Driven Structural Extractor
 * ========================================================================== */

const EXTRACTION_SYSTEM_PROMPT = `You are a website spec extractor. You read a website design prompt and extract a structured JSON spec that exactly captures what the prompt describes — no more, no less.

CRITICAL RULES:
1. Return ONLY valid JSON. No markdown fences, no commentary, no preamble.
2. ONLY include sections that the prompt ACTUALLY describes. If the prompt only describes a hero section, return exactly ONE section (the hero). Do NOT invent additional body/footer/pricing/testimonial sections that the prompt does not describe.
3. Use the EXACT copy (headline, description, CTA text, nav items, logo) from the prompt — preserve punctuation, italics emphasis, and trademark symbols.
4. Use the EXACT colors (hex) and fonts (family names) from the prompt.
5. If a value is not specified in the prompt, use null for strings or omit the field. Do NOT make up values.
6. The "sections" array reflects the actual structural order described in the prompt.

OUTPUT JSON SHAPE:
{
  "businessName": "string — name without trademark symbols",
  "logo": "string — logo text including ®™© if specified",
  "tagline": "string | null",
  "fonts": {
    "display": "FontName | null — used for headings/logo",
    "body": "FontName | null — used for body/nav",
    "weights": [400, 500]
  },
  "colors": {
    "bg": "#hex — page background",
    "text": "#hex — primary text/headlines",
    "muted": "#hex | null — secondary text/descriptions",
    "accent": "#hex | null — accent color for highlights/CTAs",
    "surface": "#hex | null — card/panel backgrounds",
    "border": "#hex | null — borders"
  },
  "promptType": "hero | landing-page | footer | portfolio | saas | features | 404 | blog | agency | product | pricing | contact",
  "navItems": ["string", "..."],
  "ctaText": "string — primary CTA button label",
  "sections": [
    {
      "type": "hero-video | hero-centered | hero-split | hero-image | features-grid | stats-row | gallery-masonry | gallery-grid | partners-row | cta-band | testimonials | faq-accordion | about-text | pricing | contact-form | footer | team-grid | blog-list | custom",
      "id": "kebab-case-id",
      "headline": "string | null — exact headline text from prompt. For headlines with italic emphasized words, use plain text and list the emphasized phrases in emphasizedWords.",
      "emphasizedWords": ["phrase1", "phrase2"] ,
      "body": "string | null — section description / body copy",
      "items": [{"title": "string", "description": "string", "icon": "string | null", "mediaUrl": "string | null", "meta": "string | null"}],
      "cta": "string | null",
      "mediaUrl": "string | null — primary media (video/image) for this section",
      "animation": "fade-rise | fade | blur | ken-burns | parallax | scale | slide | rotate | none",
      "styleHints": "string — extra CSS like 'letter-spacing:-2.46px;line-height:0.95' or empty string",
      "bg": "#hex | null — section background override",
      "color": "#hex | null — section text color override"
    }
  ],
  "animations": [{"name": "string", "definition": "human-readable definition"}],
  "media": {"videoUrls": ["..."], "imageUrls": ["..."]},
  "styleHints": "string — global CSS hints, e.g. 'border-radius:9999px' or empty string"
}

NOTES:
- For a "Hero Section" prompt: return ONE section of type "hero-video" (if video bg) or "hero-centered" (if solid bg) or "hero-split" (if two-column) or "hero-image" (if image bg). Do NOT add features/stats/footer sections.
- For a "Landing Page" prompt: return all sections described (hero + features + stats + partners + cta + footer etc.) in order.
- For a "Footer Section" prompt: return ONE section of type "footer".
- "emphasizedWords": only fill if the prompt specifies italic / different-color words inside the headline. E.g. for Aethera: headline="Beyond silence, we build the eternal." emphasizedWords=["silence,", "the eternal."].
- "items": for features-grid = feature cards; for stats-row = stat items (title=number, description=label); for partners-row = partner names (title=name); for testimonials = quotes (body=quote, title=author); for faq = questions (title=question, body=answer).
- Keep "body" copy verbatim from the prompt — do not paraphrase.`;

/**
 * Extract a structured spec from a MotionSites prompt using the ZAI LLM.
 * Falls back to the regex extractor (returns a 1-section spec) if LLM fails.
 */
export async function extractStructuredSpecsViaLLM(
  prompt: MotionPrompt,
  opts: { timeoutMs?: number; model?: string; groqExtraction?: any } = {},
): Promise<StructuredSpec> {
  const timeoutMs = opts.timeoutMs ?? 45000;
  const model = opts.model ?? 'mistral-large-latest';

  // Path 0: Use pre-computed client-side Groq extraction if provided.
  // This bypasses the server-side LLM call entirely, avoiding Vercel's
  // 10s Hobby timeout. The browser calls Groq directly (no Vercel timeout),
  // sends the result here, and we just parse + normalize it.
  if (opts.groqExtraction) {
    try {
      const content: string = opts.groqExtraction?.choices?.[0]?.message?.content ?? '';
      const json = parseJsonFromLLM(content);
      if (json) {
        console.log('[recreator] Using pre-computed client-side Groq extraction — instant, no server LLM call');
        return normalizeSpec(json, prompt, 'llm');
      }
      console.warn('[recreator] Client-side Groq extraction had no parseable JSON, falling through to server LLM');
    } catch (e) {
      console.warn('[recreator] Client-side Groq extraction parse failed, falling through:', e);
    }
  }

  try {
    const { zaiChat } = await import('./zai-client');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const response = await zaiChat({
      model,
      temperature: 0,
      maxTokens: 4000,
      messages: [
        { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
        {
          role: 'user',
          content:
            `Extract the structured spec from this website design prompt.\n\n` +
            `PROMPT TITLE: ${prompt.title}\n` +
            `PROMPT CATEGORY: ${prompt.category}\n` +
            `PROMPT TYPE: ${prompt.type}\n\n` +
            `PROMPT TEXT:\n"""\n${prompt.promptText}\n"""\n\n` +
            `Return ONLY the JSON.`,
        },
      ],
    });

    clearTimeout(timeout);

    const content: string =
      response?.choices?.[0]?.message?.content ?? '';
    const json = parseJsonFromLLM(content);
    if (!json) throw new Error('LLM returned no parseable JSON');
    return normalizeSpec(json, prompt, 'llm');
  } catch (err) {
    console.error('[recreator] LLM extraction failed, falling back to regex:', err);
    return buildFallbackSpec(prompt);
  }
}

/** Synchronous version — uses ONLY the regex extractor. Used for instant renders / offline. */
export function extractStructuredSpecsSync(prompt: MotionPrompt): StructuredSpec {
  return buildFallbackSpec(prompt);
}

function parseJsonFromLLM(content: string): any | null {
  if (!content) return null;
  // Strip markdown code fences if present.
  let text = content.trim();
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
  // Find the first { and last } — be tolerant of preamble.
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) return null;
  const slice = text.slice(first, last + 1);
  try {
    return JSON.parse(slice);
  } catch {
    // Try fixing common issues — trailing commas.
    try {
      return JSON.parse(slice.replace(/,(\s*[}\]])/g, '$1'));
    } catch {
      return null;
    }
  }
}

function normalizeSpec(json: any, prompt: MotionPrompt, source: 'llm' | 'regex-fallback'): StructuredSpec {
  const businessName: string = (json.businessName || prompt.title).replace(/[®™©]/g, '').trim();
  const logo: string = json.logo || businessName;

  const fonts = {
    display: json.fonts?.display ?? null,
    body: json.fonts?.body ?? null,
    accentFont: json.fonts?.accentFont ?? null,
    weights: Array.isArray(json.fonts?.weights) ? json.fonts.weights.map((n: any) => Number(n)).filter((n: number) => !isNaN(n)) : [400, 500, 600],
  };

  const colors = {
    bg: json.colors?.bg || '#ffffff',
    text: json.colors?.text || '#000000',
    muted: json.colors?.muted ?? null,
    accent: json.colors?.accent ?? null,
    surface: json.colors?.surface ?? null,
    border: json.colors?.border ?? null,
  };

  const sections: Section[] = Array.isArray(json.sections)
    ? json.sections.map((s: any, i: number) => normalizeSection(s, i))
    : [];

  return {
    businessName,
    logo,
    tagline: json.tagline ?? null,
    fonts,
    colors,
    promptType: json.promptType || prompt.type || 'hero',
    navItems: Array.isArray(json.navItems) ? json.navItems.filter((x: any) => typeof x === 'string').slice(0, 8) : [],
    ctaText: json.ctaText || 'Get Started',
    sections,
    animations: Array.isArray(json.animations) ? json.animations : [],
    media: {
      videoUrls: Array.isArray(json.media?.videoUrls) ? json.media.videoUrls : [],
      imageUrls: Array.isArray(json.media?.imageUrls) ? json.media.imageUrls : [],
    },
    styleHints: json.styleHints || '',
    source,
    promptId: prompt.id,
    promptTitle: prompt.title,
  };
}

function normalizeSection(s: any, idx: number): Section {
  const validTypes: SectionType[] = [
    'hero-video', 'hero-centered', 'hero-split', 'hero-image',
    'features-grid', 'stats-row', 'gallery-masonry', 'gallery-grid',
    'partners-row', 'cta-band', 'testimonials', 'faq-accordion',
    'about-text', 'pricing', 'contact-form', 'footer', 'team-grid',
    'blog-list', 'custom',
  ];
  const type = validTypes.includes(s.type) ? (s.type as SectionType) : 'custom';

  const validAnims: AnimationType[] = ['fade-rise', 'fade', 'blur', 'ken-burns', 'parallax', 'scale', 'slide', 'rotate', 'none'];
  const animation = validAnims.includes(s.animation) ? (s.animation as AnimationType) : 'none';

  return {
    type,
    id: s.id || `section-${idx + 1}`,
    headline: s.headline ?? null,
    emphasizedWords: Array.isArray(s.emphasizedWords) ? s.emphasizedWords : [],
    accentText: s.accentText ?? null,
    body: s.body ?? null,
    items: Array.isArray(s.items) ? s.items.map((it: any) => ({
      title: it.title ?? null,
      description: it.description ?? null,
      body: it.body ?? null,
      icon: it.icon ?? null,
      mediaUrl: it.mediaUrl ?? null,
      meta: it.meta ?? null,
    })) : [],
    cta: s.cta ?? null,
    mediaUrl: s.mediaUrl ?? null,
    animation,
    styleHints: s.styleHints || '',
    bg: s.bg ?? null,
    color: s.color ?? null,
  };
}

/** Build a 1-section fallback spec from the regex extractor (used when LLM fails). */
function buildFallbackSpec(prompt: MotionPrompt): StructuredSpec {
  const specs = extractSpecs(prompt);
  const display = specs.fonts.find(f => /serif|display|anton|archivo black|fraunces/i.test(f)) || specs.fonts[0] || null;
  const body = specs.fonts.find(f => /inter|sans|grotesque|barlow|poppins|montserrat/i.test(f)) || specs.fonts.find(f => f !== display) || null;

  const bg = specs.colors.find(c => parseInt(c.slice(1, 3), 16) > 128) || '#ffffff';
  const text = specs.colors.find(c => parseInt(c.slice(1, 3), 16) < 60) || '#000000';
  const muted = specs.colors.find(c => { const v = parseInt(c.slice(1, 3), 16); return v > 60 && v < 200; }) || null;
  const accent = specs.colors.find(c => c !== bg && c !== text && c !== muted) || null;

  // Decide hero type from regex layout.
  let heroType: SectionType = 'hero-centered';
  if (specs.layout === 'video-hero' && specs.videoUrls.length > 0) heroType = 'hero-video';
  else if (specs.layout === 'split') heroType = 'hero-split';
  else if (specs.imageUrls.length > 0 && specs.layout !== 'fullscreen-centered') heroType = 'hero-image';

  const animation: AnimationType = specs.animations.includes('fade-rise') ? 'fade-rise'
    : specs.animations.includes('blur') ? 'blur'
    : specs.animations.includes('ken-burns') ? 'ken-burns'
    : 'none';

  return {
    businessName: specs.businessName,
    logo: specs.logo,
    tagline: null,
    fonts: { display, body, weights: [400, 500, 600] },
    colors: { bg, text, muted, accent, surface: null, border: null },
    promptType: prompt.type || 'hero',
    navItems: specs.navItems,
    ctaText: specs.ctaText,
    sections: [{
      type: heroType,
      id: 'hero',
      headline: specs.headline || specs.businessName,
      emphasizedWords: [],
      body: specs.description,
      items: [],
      cta: specs.ctaText,
      mediaUrl: specs.videoUrls[0] || specs.imageUrls[0] || null,
      animation,
      styleHints: '',
      bg: null,
      color: null,
    }],
    animations: [],
    media: { videoUrls: specs.videoUrls, imageUrls: specs.imageUrls },
    styleHints: '',
    source: 'regex-fallback',
    promptId: prompt.id,
    promptTitle: prompt.title,
  };
}

/* ============================================================================
 * V2 Spec-Driven Renderer
 * ========================================================================== */

/** Convenience: HTML-escape user content for safe interpolation. */
function esc(s: string | null | undefined): string {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Apply emphasized-words styling to a headline. Returns safe HTML. */
function renderHeadline(headline: string | null | undefined, emphasized: string[] = [], emColor?: string | null): string {
  if (!headline) return '';
  let h = esc(headline);
  if (emphasized && emphasized.length > 0) {
    for (const phrase of emphasized) {
      if (!phrase) continue;
      const safePhrase = esc(phrase).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      try {
        h = h.replace(new RegExp(safePhrase, 'g'), `<em${emColor ? ` style="font-style:italic;color:${emColor}"` : ' style="font-style:italic"'}>$&</em>`);
      } catch { /* skip invalid regex */ }
    }
  }
  return h;
}

/** Build Google Fonts URL from spec. */
function buildFontsHref(spec: StructuredSpec): string {
  const families: string[] = [];
  const { display, body, accentFont } = spec.fonts;
  if (display) {
    const name = display.replace(/\s+/g, '+');
    if (display === 'Instrument Serif') families.push('Instrument+Serif:ital@0;1');
    else if (display === 'Playfair Display') families.push('Playfair+Display:ital,wght@0,400;0,500;0,600;1,400');
    else if (display === 'Anton') families.push('Anton');
    else if (display === 'Space Grotesk') families.push('Space+Grotesk:wght@400;500;600;700');
    else if (display === 'Fraunces') families.push('Fraunces:ital,wght@0,400;0,500;1,400');
    else if (display === 'DM Serif Display') families.push('DM+Serif+Display:ital@0;1');
    else if (display === 'Cormorant Garamond') families.push('Cormorant+Garamond:ital,wght@0,400;1,400');
    else families.push(`${name}:wght@400;500;600;700`);
  }
  if (body && body !== display) {
    const name = body.replace(/\s+/g, '+');
    if (body === 'Inter') families.push('Inter:wght@300;400;500;600;700');
    else if (body === 'Barlow') families.push('Barlow:wght@300;400;500;600');
    else if (body === 'Poppins') families.push('Poppins:wght@300;400;500;600');
    else if (body === 'Montserrat') families.push('Montserrat:wght@300;400;500;600');
    else if (body === 'Source Sans 3') families.push('Source+Sans+3:wght@300;400;500;600');
    else if (body === 'Bricolage Grotesque') families.push('Bricolage+Grotesque:wght@400;500;600;700');
    else families.push(`${name}:wght@300;400;500;600;700`);
  }
  if (families.length === 0) families.push('Inter:wght@300;400;500;600;700');
  // Load accent font (cursive/script) if specified
  if (accentFont && accentFont !== display && accentFont !== body) {
    const name = accentFont.replace(/\s+/g, '+');
    if (accentFont === 'Condiment') families.push('Condiment');
    else if (accentFont === 'Dancing Script') families.push('Dancing+Script:wght@400;700');
    else if (accentFont === 'Pacifico') families.push('Pacifico');
    else if (accentFont === 'Great Vibes') families.push('Great+Vibes');
    else if (accentFont === 'Caveat') families.push('Caveat:wght@400;700');
    else families.push(name);
  }
  return `https://fonts.googleapis.com/css2?${families.map(f => `family=${f}`).join('&')}&display=swap`;
}

interface ColorSet {
  bg: string; text: string; muted: string; accent: string; surface: string; border: string;
}

function resolveColors(spec: StructuredSpec): ColorSet {
  return {
    bg: spec.colors.bg,
    text: spec.colors.text,
    muted: spec.colors.muted || mixColor(spec.colors.text, spec.colors.bg, 0.55),
    accent: spec.colors.accent || spec.colors.text,
    surface: spec.colors.surface || mixColor(spec.colors.text, spec.colors.bg, 0.05),
    border: spec.colors.border || withAlpha(spec.colors.text, 0.1),
  };
}

function mixColor(a: string, b: string, t: number): string {
  const pa = hexToRgb(a), pb = hexToRgb(b);
  if (!pa || !pb) return a;
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * t);
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * t);
  const bl = Math.round(pa[2] + (pb[2] - pa[2]) * t);
  return rgbToHex(r, g, bl);
}

function withAlpha(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
}

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/.exec(hex);
  if (!m) return null;
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Determine if a color is "light" (for choosing contrasting text on top of it). */
function isLight(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  const lum = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
  return lum > 0.5;
}

/* ---------- Per-section renderers ---------- */

function renderSection(section: Section, idx: number, spec: StructuredSpec, colors: ColorSet): string {
  // Per-section color overrides.
  const bg = section.bg || colors.bg;
  const color = section.color || colors.text;
  const muted = section.bg ? (isLight(section.bg) ? colors.muted : mixColor(color, section.bg, 0.6)) : colors.muted;
  const local: ColorSet = { ...colors, bg, text: color, muted };

  switch (section.type) {
    case 'hero-video': return renderHeroVideo(section, idx, spec, local);
    case 'hero-centered': return renderHeroCentered(section, idx, spec, local);
    case 'hero-split': return renderHeroSplit(section, idx, spec, local);
    case 'hero-image': return renderHeroImage(section, idx, spec, local);
    case 'features-grid': return renderFeaturesGrid(section, idx, spec, local);
    case 'stats-row': return renderStatsRow(section, idx, spec, local);
    case 'gallery-masonry':
    case 'gallery-grid': return renderGallery(section, idx, spec, local, section.type === 'gallery-masonry');
    case 'partners-row': return renderPartnersRow(section, idx, spec, local);
    case 'cta-band': return renderCtaBand(section, idx, spec, local);
    case 'testimonials': return renderTestimonials(section, idx, spec, local);
    case 'faq-accordion': return renderFaqAccordion(section, idx, spec, local);
    case 'about-text': return renderAboutText(section, idx, spec, local);
    case 'pricing': return renderPricing(section, idx, spec, local);
    case 'team-grid': return renderTeamGrid(section, idx, spec, local);
    case 'contact-form': return renderContactForm(section, idx, spec, local);
    case 'footer': return renderFooter(section, idx, spec, local);
    case 'blog-list': return renderBlogList(section, idx, spec, local);
    default: return renderCustom(section, idx, spec, local);
  }
}

function animClass(a: AnimationType): string {
  switch (a) {
    case 'fade-rise': return 'sf-fade-rise';
    case 'fade': return 'sf-fade';
    case 'blur': return 'sf-blur';
    case 'ken-burns': return 'sf-ken-burns';
    case 'parallax': return 'sf-parallax';
    case 'scale': return 'sf-scale';
    case 'slide': return 'sf-slide';
    case 'rotate': return 'sf-rotate';
    default: return '';
  }
}

function renderHeroVideo(s: Section, _idx: number, spec: StructuredSpec, c: ColorSet): string {
  const videoUrl = s.mediaUrl || spec.media.videoUrls[0] || '';
  const headline = renderHeadline(s.headline, s.emphasizedWords, c.muted);
  const body = s.body ? `<p class="sf-hero-sub">${esc(s.body)}</p>` : '';
  const cta = s.cta ? `<button class="sf-hero-cta">${esc(s.cta)}</button>` : '';
  const video = videoUrl
    ? `<video class="sf-hero-video" autoplay muted loop playsinline><source src="${esc(videoUrl)}" type="video/mp4"></video>`
    : `<div class="sf-hero-video-bg" style="background:url('https://picsum.photos/seed/${encodeURIComponent(spec.businessName)}/1920/1080') center/cover"></div>`;
  const animCls = animClass(s.animation);
  return `
<section class="sf-hero${animCls ? ' ' + animCls : ''}" id="${esc(s.id)}" style="background:${c.bg}">
  ${video}
  <div class="sf-hero-overlay" style="background:linear-gradient(to bottom,${withAlpha(c.bg, 0.8)} 0%,${withAlpha(c.bg, 0)} 30%,${withAlpha(c.bg, 0)} 70%,${withAlpha(c.bg, 0.93)} 100%)"></div>
  <div class="sf-hero-content">
    ${headline ? `<h1 style="color:${c.text};${s.styleHints || ''}">${headline}</h1>` : ''}
    ${body}
    ${cta}
  </div>
</section>`;
}

function renderHeroCentered(s: Section, _idx: number, spec: StructuredSpec, c: ColorSet): string {
  const headline = renderHeadline(s.headline, s.emphasizedWords, c.muted);
  const body = s.body ? `<p class="sf-hero-sub" style="color:${c.muted}">${esc(s.body)}</p>` : '';
  const cta = s.cta ? `<button class="sf-hero-cta" style="background:${c.text};color:${c.bg}">${esc(s.cta)}</button>` : '';
  const animCls = animClass(s.animation);
  return `
<section class="sf-hero sf-hero-solid${animCls ? ' ' + animCls : ''}" id="${esc(s.id)}" style="background:${c.bg}">
  <div class="sf-hero-content">
    ${headline ? `<h1 style="color:${c.text};${s.styleHints || ''}">${headline}</h1>` : ''}
    ${body}
    ${cta}
  </div>
</section>`;
}

function renderHeroImage(s: Section, _idx: number, spec: StructuredSpec, c: ColorSet): string {
  const imageUrl = s.mediaUrl || spec.media.imageUrls[0] || `https://picsum.photos/seed/${encodeURIComponent(spec.businessName)}/1920/1080`;
  const headline = renderHeadline(s.headline, s.emphasizedWords, isLight(c.bg) ? c.muted : withAlpha(c.bg, 0.7));
  const body = s.body ? `<p class="sf-hero-sub" style="color:${c.muted}">${esc(s.body)}</p>` : '';
  const cta = s.cta ? `<button class="sf-hero-cta" style="background:${c.text};color:${c.bg}">${esc(s.cta)}</button>` : '';
  const animCls = animClass(s.animation);
  return `
<section class="sf-hero${animCls ? ' ' + animCls : ''}" id="${esc(s.id)}" style="background:${c.bg}">
  <div class="sf-hero-video-bg" style="background:url('${esc(imageUrl)}') center/cover"></div>
  <div class="sf-hero-overlay" style="background:linear-gradient(to bottom,${withAlpha(c.bg, 0.7)} 0%,${withAlpha(c.bg, 0.3)} 50%,${withAlpha(c.bg, 0.9)} 100%)"></div>
  <div class="sf-hero-content">
    ${headline ? `<h1 style="color:${c.text};${s.styleHints || ''}">${headline}</h1>` : ''}
    ${body}
    ${cta}
  </div>
</section>`;
}

function renderHeroSplit(s: Section, _idx: number, spec: StructuredSpec, c: ColorSet): string {
  const headline = renderHeadline(s.headline, s.emphasizedWords, c.muted);
  const body = s.body ? `<p class="sf-split-body" style="color:${c.muted}">${esc(s.body)}</p>` : '';
  const cta = s.cta ? `<button class="sf-split-cta" style="background:${c.text};color:${c.bg}">${esc(s.cta)}</button>` : '';
  const mediaUrl = s.mediaUrl || spec.media.imageUrls[0] || spec.media.videoUrls[0] || `https://picsum.photos/seed/${encodeURIComponent(spec.businessName)}/1200/1400`;
  const isVideo = mediaUrl.endsWith('.mp4') || mediaUrl.endsWith('.webm');
  const media = isVideo
    ? `<video class="sf-split-media" autoplay muted loop playsinline><source src="${esc(mediaUrl)}" type="video/mp4"></video>`
    : `<div class="sf-split-media" style="background:url('${esc(mediaUrl)}') center/cover"></div>`;
  const animCls = animClass(s.animation);
  return `
<section class="sf-split${animCls ? ' ' + animCls : ''}" id="${esc(s.id)}" style="background:${c.bg}">
  <div class="sf-split-text">
    ${headline ? `<h1 style="color:${c.text};${s.styleHints || ''}">${headline}</h1>` : ''}
    ${body}
    ${cta}
  </div>
  <div class="sf-split-media-wrap">${media}</div>
</section>`;
}

function renderFeaturesGrid(s: Section, _idx: number, spec: StructuredSpec, c: ColorSet): string {
  const headline = renderHeadline(s.headline, s.emphasizedWords, c.muted);
  const body = s.body ? `<p class="sf-sec-body" style="color:${c.muted}">${esc(s.body)}</p>` : '';
  const items = (s.items || []).map((it) => `
    <div class="sf-feature" style="background:${c.surface};border:1px solid ${c.border}">
      ${it.icon ? `<div class="sf-feature-icon" style="color:${c.accent}">${esc(it.icon)}</div>` : ''}
      ${it.title ? `<h3 style="color:${c.text}">${esc(it.title)}</h3>` : ''}
      ${it.description ? `<p style="color:${c.muted}">${esc(it.description)}</p>` : ''}
    </div>`).join('');
  return `
<section class="sf-section reveal" id="${esc(s.id)}" style="background:${c.bg}">
  <div class="sf-section-inner">
    ${headline ? `<h2 style="color:${c.text};${s.styleHints || ''}">${headline}</h2>` : ''}
    ${body}
    ${items ? `<div class="sf-features-grid">${items}</div>` : ''}
  </div>
</section>`;
}

function renderStatsRow(s: Section, _idx: number, spec: StructuredSpec, c: ColorSet): string {
  const headline = renderHeadline(s.headline, s.emphasizedWords, c.muted);
  const items = (s.items || []).map((it) => `
    <div class="sf-stat">
      <div class="sf-stat-num" style="color:${c.text}">${esc(it.title)}</div>
      ${it.description ? `<div class="sf-stat-lbl" style="color:${c.muted}">${esc(it.description)}</div>` : ''}
    </div>`).join('');
  return `
<section class="sf-stats reveal" id="${esc(s.id)}" style="background:${c.bg}">
  ${headline ? `<h2 style="color:${c.text}">${headline}</h2>` : ''}
  <div class="sf-stats-grid">${items}</div>
</section>`;
}

function renderGallery(s: Section, _idx: number, spec: StructuredSpec, c: ColorSet, masonry: boolean): string {
  const headline = renderHeadline(s.headline, s.emphasizedWords, c.muted);
  const body = s.body ? `<p class="sf-sec-body" style="color:${c.muted}">${esc(s.body)}</p>` : '';
  const items = (s.items || []).map((it, i) => {
    const url = it.mediaUrl || spec.media.imageUrls[i] || `https://picsum.photos/seed/${encodeURIComponent(spec.businessName + i)}/800/600`;
    return `<div class="sf-gallery-item${masonry ? ' sf-masonry-item' : ''}" style="border:1px solid ${c.border}">
      <div style="background:url('${esc(url)}') center/cover;${masonry ? `min-height:${300 + (i % 3) * 100}px` : 'aspect-ratio:4/3'}"></div>
      ${it.title ? `<div class="sf-gallery-cap" style="color:${c.text}">${esc(it.title)}</div>` : ''}
    </div>`;
  }).join('');
  return `
<section class="sf-section reveal" id="${esc(s.id)}" style="background:${c.bg}">
  <div class="sf-section-inner">
    ${headline ? `<h2 style="color:${c.text}">${headline}</h2>` : ''}
    ${body}
    <div class="${masonry ? 'sf-gallery-masonry' : 'sf-gallery-grid'}">${items}</div>
  </div>
</section>`;
}

function renderPartnersRow(s: Section, _idx: number, spec: StructuredSpec, c: ColorSet): string {
  const headline = renderHeadline(s.headline, s.emphasizedWords, c.muted);
  const body = s.body ? `<p class="sf-sec-body" style="color:${c.muted}">${esc(s.body)}</p>` : '';
  const items = (s.items || []).map((it) => `<div class="sf-partner" style="color:${c.text}">${esc(it.title)}</div>`).join('');
  return `
<section class="sf-section sf-partners reveal" id="${esc(s.id)}" style="background:${c.bg}">
  <div class="sf-section-inner">
    ${headline ? `<h2 style="color:${c.text}">${headline}</h2>` : ''}
    ${body}
    <div class="sf-partners-row">${items}</div>
  </div>
</section>`;
}

function renderCtaBand(s: Section, _idx: number, spec: StructuredSpec, c: ColorSet): string {
  // Invert colors for CTA band (use text color as bg).
  const bandBg = c.text;
  const bandFg = c.bg;
  const headline = renderHeadline(s.headline, s.emphasizedWords, withAlpha(bandFg, 0.7));
  const body = s.body ? `<p style="color:${withAlpha(bandFg, 0.8)};max-width:640px;margin:1rem auto 0">${esc(s.body)}</p>` : '';
  const cta = s.cta ? `<button class="sf-cta-band-btn" style="background:${bandFg};color:${bandBg}">${esc(s.cta)}</button>` : '';
  return `
<section class="sf-cta-band reveal" id="${esc(s.id)}" style="background:${bandBg}">
  <div class="sf-section-inner" style="text-align:center">
    ${headline ? `<h2 style="color:${bandFg}">${headline}</h2>` : ''}
    ${body}
    ${cta}
  </div>
</section>`;
}

function renderTestimonials(s: Section, _idx: number, spec: StructuredSpec, c: ColorSet): string {
  const headline = renderHeadline(s.headline, s.emphasizedWords, c.muted);
  const items = (s.items || []).map((it) => `
    <div class="sf-testimonial" style="background:${c.surface};border:1px solid ${c.border}">
      ${it.body ? `<p class="sf-testimonial-quote" style="color:${c.text}">${esc(it.body)}</p>` : ''}
      ${it.title ? `<div class="sf-testimonial-author" style="color:${c.muted}">— ${esc(it.title)}</div>` : ''}
    </div>`).join('');
  return `
<section class="sf-section reveal" id="${esc(s.id)}" style="background:${c.bg}">
  <div class="sf-section-inner">
    ${headline ? `<h2 style="color:${c.text}">${headline}</h2>` : ''}
    <div class="sf-testimonials-grid">${items}</div>
  </div>
</section>`;
}

function renderFaqAccordion(s: Section, _idx: number, spec: StructuredSpec, c: ColorSet): string {
  const headline = renderHeadline(s.headline, s.emphasizedWords, c.muted);
  const items = (s.items || []).map((it, i) => `
    <details class="sf-faq-item" style="border-bottom:1px solid ${c.border}">
      <summary style="color:${c.text}">${esc(it.title)}<span class="sf-faq-toggle">+</span></summary>
      <div class="sf-faq-answer" style="color:${c.muted}">${esc(it.description || it.body || '')}</div>
    </details>`).join('');
  return `
<section class="sf-section reveal" id="${esc(s.id)}" style="background:${c.bg}">
  <div class="sf-section-inner" style="max-width:760px">
    ${headline ? `<h2 style="color:${c.text}">${headline}</h2>` : ''}
    <div class="sf-faq-list">${items}</div>
  </div>
</section>`;
}

function renderAboutText(s: Section, _idx: number, spec: StructuredSpec, c: ColorSet): string {
  const headline = renderHeadline(s.headline, s.emphasizedWords, c.muted);
  const body = s.body ? `<p class="sf-sec-body" style="color:${c.muted}">${esc(s.body)}</p>` : '';
  const items = (s.items || []).map((it) => `
    <p class="sf-sec-body" style="color:${c.muted}">${esc(it.description || it.title || '')}</p>`).join('');
  return `
<section class="sf-section reveal" id="${esc(s.id)}" style="background:${c.bg}">
  <div class="sf-section-inner" style="max-width:760px">
    ${headline ? `<h2 style="color:${c.text}">${headline}</h2>` : ''}
    ${body}
    ${items}
  </div>
</section>`;
}

function renderPricing(s: Section, _idx: number, spec: StructuredSpec, c: ColorSet): string {
  const headline = renderHeadline(s.headline, s.emphasizedWords, c.muted);
  const body = s.body ? `<p class="sf-sec-body" style="color:${c.muted}">${esc(s.body)}</p>` : '';
  const items = (s.items || []).map((it, i) => {
    const featured = i === 1;
    const cardBg = featured ? c.text : c.surface;
    const cardFg = featured ? c.bg : c.text;
    const cardMuted = featured ? withAlpha(c.bg, 0.7) : c.muted;
    return `
      <div class="sf-pricing-card${featured ? ' sf-pricing-featured' : ''}" style="background:${cardBg};color:${cardFg};border:1px solid ${c.border}">
        ${it.title ? `<div class="sf-pricing-name" style="color:${cardMuted}">${esc(it.title)}</div>` : ''}
        ${it.meta ? `<div class="sf-pricing-price">${esc(it.meta)}</div>` : ''}
        ${it.description ? `<p class="sf-pricing-desc" style="color:${cardMuted}">${esc(it.description)}</p>` : ''}
        ${s.cta ? `<button class="sf-pricing-cta" style="background:${featured ? c.bg : c.text};color:${featured ? c.text : c.bg}">${esc(s.cta)}</button>` : ''}
      </div>`;
  }).join('');
  return `
<section class="sf-section reveal" id="${esc(s.id)}" style="background:${c.bg}">
  <div class="sf-section-inner">
    ${headline ? `<h2 style="color:${c.text};text-align:center">${headline}</h2>` : ''}
    ${body ? `<div style="text-align:center">${body}</div>` : ''}
    <div class="sf-pricing-grid">${items}</div>
  </div>
</section>`;
}

function renderTeamGrid(s: Section, _idx: number, spec: StructuredSpec, c: ColorSet): string {
  const headline = renderHeadline(s.headline, s.emphasizedWords, c.muted);
  const items = (s.items || []).map((it, i) => {
    const url = it.mediaUrl || spec.media.imageUrls[i] || `https://picsum.photos/seed/${encodeURIComponent(spec.businessName + '-team-' + i)}/600/700`;
    return `
      <div class="sf-team-card">
        <div class="sf-team-photo" style="background:url('${esc(url)}') center/cover"></div>
        ${it.title ? `<h3 style="color:${c.text}">${esc(it.title)}</h3>` : ''}
        ${it.description ? `<p style="color:${c.muted}">${esc(it.description)}</p>` : ''}
      </div>`;
  }).join('');
  return `
<section class="sf-section reveal" id="${esc(s.id)}" style="background:${c.bg}">
  <div class="sf-section-inner">
    ${headline ? `<h2 style="color:${c.text}">${headline}</h2>` : ''}
    <div class="sf-team-grid">${items}</div>
  </div>
</section>`;
}

function renderContactForm(s: Section, _idx: number, spec: StructuredSpec, c: ColorSet): string {
  const headline = renderHeadline(s.headline, s.emphasizedWords, c.muted);
  const body = s.body ? `<p class="sf-sec-body" style="color:${c.muted}">${esc(s.body)}</p>` : '';
  return `
<section class="sf-section reveal" id="${esc(s.id)}" style="background:${c.bg}">
  <div class="sf-section-inner" style="max-width:560px">
    ${headline ? `<h2 style="color:${c.text}">${headline}</h2>` : ''}
    ${body}
    <form class="sf-contact-form" onsubmit="event.preventDefault();this.querySelector('.sf-contact-success').style.display='block'">
      <input type="text" placeholder="Your name" required style="background:${c.surface};color:${c.text};border:1px solid ${c.border}" />
      <input type="email" placeholder="Your email" required style="background:${c.surface};color:${c.text};border:1px solid ${c.border}" />
      <textarea placeholder="Your message" rows="5" required style="background:${c.surface};color:${c.text};border:1px solid ${c.border}"></textarea>
      <button type="submit" style="background:${c.text};color:${c.bg}">${esc(s.cta || 'Send Message')}</button>
      <div class="sf-contact-success" style="display:none;color:${c.accent};margin-top:1rem">Thanks! We'll be in touch shortly.</div>
    </form>
  </div>
</section>`;
}

function renderBlogList(s: Section, _idx: number, spec: StructuredSpec, c: ColorSet): string {
  const headline = renderHeadline(s.headline, s.emphasizedWords, c.muted);
  const items = (s.items || []).map((it, i) => {
    const url = it.mediaUrl || spec.media.imageUrls[i] || `https://picsum.photos/seed/${encodeURIComponent(spec.businessName + '-blog-' + i)}/800/500`;
    return `
      <article class="sf-blog-card" style="background:${c.surface};border:1px solid ${c.border}">
        <div class="sf-blog-img" style="background:url('${esc(url)}') center/cover"></div>
        <div class="sf-blog-body">
          ${it.meta ? `<div class="sf-blog-meta" style="color:${c.muted}">${esc(it.meta)}</div>` : ''}
          ${it.title ? `<h3 style="color:${c.text}">${esc(it.title)}</h3>` : ''}
          ${it.description ? `<p style="color:${c.muted}">${esc(it.description)}</p>` : ''}
        </div>
      </article>`;
  }).join('');
  return `
<section class="sf-section reveal" id="${esc(s.id)}" style="background:${c.bg}">
  <div class="sf-section-inner">
    ${headline ? `<h2 style="color:${c.text}">${headline}</h2>` : ''}
    <div class="sf-blog-grid">${items}</div>
  </div>
</section>`;
}

function renderFooter(s: Section, _idx: number, spec: StructuredSpec, c: ColorSet): string {
  // Footer inverts colors (dark band).
  const footerBg = c.text;
  const footerFg = c.bg;
  const cols = (s.items || []).slice(0, 4).map((it) => `
    <div>
      ${it.title ? `<h4 style="color:${withAlpha(footerFg, 0.5)};font-size:0.75rem;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:1rem">${esc(it.title)}</h4>` : ''}
      ${(it.description || '').split(/[,\n]/).map(line => line.trim()).filter(Boolean).map(line => `<a style="color:${withAlpha(footerFg, 0.7)}">${esc(line)}</a>`).join('')}
    </div>`).join('');
  const tagline = s.body || spec.tagline || '';
  return `
<footer class="sf-footer" id="${esc(s.id)}" style="background:${footerBg};color:${footerFg}">
  <div class="sf-footer-inner">
    <div class="sf-footer-brand">
      <h3 style="color:${footerFg}">${esc(spec.logo)}</h3>
      ${tagline ? `<p style="color:${withAlpha(footerFg, 0.7)}">${esc(tagline)}</p>` : ''}
    </div>
    ${cols}
  </div>
  <div class="sf-footer-bottom" style="color:${withAlpha(footerFg, 0.4)}">© ${new Date().getFullYear()} ${esc(spec.businessName)}. All rights reserved.</div>
</footer>`;
}

function renderCustom(s: Section, _idx: number, spec: StructuredSpec, c: ColorSet): string {
  // Smart dispatch: pick the best section renderer based on the section's contents.
  // This handles cases where the LLM labeled a section as "custom" but its shape
  // actually matches a known section type.
  const items = s.items || [];
  const hasItems = items.length > 0;
  const hasBody = !!s.body;
  const hasMedia = !!s.mediaUrl;
  const hasCta = !!s.cta;
  const hasHeadline = !!s.headline;

  // Detect stats-row: items where title looks like a number/percentage.
  const looksLikeStats = hasItems && items.every(it =>
    it.title && /^[0-9.,]+\+?$/.test(it.title.trim()) || /^[∞<>]/.test(it.title?.trim() || '')
  );

  // Detect partners-row: items where title is a single short word (no description).
  const looksLikePartners = hasItems && items.every(it =>
    it.title && it.title.trim().length <= 24 && !it.description
  );

  // Detect testimonials: items where body is a long quote.
  const looksLikeTestimonials = hasItems && items.every(it =>
    it.body && it.body.length > 40
  );

  // Detect FAQ: items where title ends with "?" or section headline mentions FAQ.
  const looksLikeFaq = hasItems && (
    items.every(it => it.title?.trim().endsWith('?')) ||
    /faq|frequently.asked/i.test(s.headline || '')
  );

  // Detect pricing: items have meta (price) field populated.
  const looksLikePricing = hasItems && items.every(it => it.meta);

  // Detect gallery: items where mediaUrl is set on all items.
  const looksLikeGallery = hasItems && items.every(it => it.mediaUrl);

  // Detect hero (video/image): no items, has mediaUrl, has headline.
  const looksLikeHeroVideo = !hasItems && hasMedia && hasHeadline && (s.mediaUrl?.endsWith('.mp4') || s.mediaUrl?.endsWith('.webm'));
  const looksLikeHeroImage = !hasItems && hasMedia && hasHeadline && !looksLikeHeroVideo;

  // Detect CTA band: no items, has body + cta, no media.
  const looksLikeCtaBand = !hasItems && hasBody && hasCta && !hasMedia;

  // Detect about-text: no items, has body, no media, no cta.
  const looksLikeAboutText = !hasItems && hasBody && !hasMedia;

  // Dispatch
  if (looksLikeStats) return renderStatsRow(s, _idx, spec, c);
  if (looksLikePartners) return renderPartnersRow(s, _idx, spec, c);
  if (looksLikeTestimonials) return renderTestimonials(s, _idx, spec, c);
  if (looksLikeFaq) return renderFaqAccordion(s, _idx, spec, c);
  if (looksLikePricing) return renderPricing(s, _idx, spec, c);
  if (looksLikeGallery) return renderGallery(s, _idx, spec, c, false);
  if (looksLikeHeroVideo) return renderHeroVideo(s, _idx, spec, c);
  if (looksLikeHeroImage) return renderHeroImage(s, _idx, spec, c);
  if (looksLikeCtaBand) return renderCtaBand(s, _idx, spec, c);
  if (looksLikeAboutText) return renderAboutText(s, _idx, spec, c);
  if (hasItems) return renderFeaturesGrid(s, _idx, spec, c); // default for items-with-content

  // Fallback: minimal section with whatever content is available.
  const headline = renderHeadline(s.headline, s.emphasizedWords, c.muted);
  const body = s.body ? `<p class="sf-sec-body" style="color:${c.muted}">${esc(s.body)}</p>` : '';
  const cta = s.cta ? `<button class="sf-pricing-cta" style="background:${c.text};color:${c.bg};margin-top:1rem;padding:0.875rem 1.5rem;border-radius:9999px;border:none;cursor:pointer;font-size:0.9375rem;font-weight:500;font-family:'${spec.fonts.body || 'Inter'}',sans-serif">${esc(s.cta)}</button>` : '';

  // Render media if present (video or image).
  let media = '';
  if (s.mediaUrl) {
    const isVideo = s.mediaUrl.endsWith('.mp4') || s.mediaUrl.endsWith('.webm');
    if (isVideo) {
      media = `<video style="width:100%;max-height:600px;object-fit:cover;border-radius:16px;margin-bottom:2rem" autoplay muted loop playsinline><source src="${esc(s.mediaUrl)}" type="video/mp4"></video>`;
    } else {
      media = `<div style="width:100%;aspect-ratio:16/9;background:url('${esc(s.mediaUrl)}') center/cover;border-radius:16px;margin-bottom:2rem"></div>`;
    }
  }

  return `
<section class="sf-section reveal" id="${esc(s.id)}" style="background:${c.bg}">
  <div class="sf-section-inner" style="max-width:900px${media ? ';text-align:center' : ''}">
    ${media}
    ${headline ? `<h2 style="color:${c.text}">${headline}</h2>` : ''}
    ${body}
    ${cta}
  </div>
</section>`;
}

/* ---------- Top-level render ---------- */

export function renderStructuredSite(spec: StructuredSpec): string {
  const colors = resolveColors(spec);
  const displayFont = spec.fonts.display || 'Playfair Display';
  const bodyFont = spec.fonts.body || 'Inter';
  const fontsHref = buildFontsHref(spec);

  // Decide whether to render the nav + footer chrome.
  //   - Footer prompts: render only the footer (no nav).
  //   - Hero / landing-page / others: render nav + sections + (auto footer if not present).
  const isFooterOnly = spec.promptType === 'footer' || (spec.sections.length === 1 && spec.sections[0].type === 'footer');
  const hasFooter = spec.sections.some(s => s.type === 'footer');
  const hasHero = spec.sections.some(s => s.type.startsWith('hero-'));

  // Build nav items HTML (must be defined before navHtml since buildNav references it).
  const navItemsHtml = spec.navItems.length > 0
    ? spec.navItems.map((item, i) => `<button class="sf-nav-link"${i === 0 ? ` style="color:${colors.text}"` : ''}>${esc(item)}</button>`).join('\n    ')
    : '';

  // Build nav HTML.
  const navHtml = isFooterOnly ? '' : buildNav(spec, colors);

  // Build sections.
  const sectionsHtml = spec.sections.map((s, i) => renderSection(s, i, spec, colors)).join('\n');

  // Auto-append a minimal footer if the prompt is a hero (not a footer prompt, and no footer was described).
  // We do this so the page isn't dangling — but the footer is minimal and uses spec-derived content only.
  let autoFooter = '';
  if (!isFooterOnly && !hasFooter && (spec.promptType === 'hero' || hasHero)) {
    autoFooter = `
<footer class="sf-footer sf-auto-footer" style="background:${colors.text};color:${colors.bg}">
  <div class="sf-footer-bottom" style="color:${withAlpha(colors.bg, 0.5)};padding:2rem;text-align:center">© ${new Date().getFullYear()} ${esc(spec.businessName)}. All rights reserved.</div>
</footer>`;
  }

  // Build animations CSS.
  const animCss = buildAnimationsCss(spec);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${esc(spec.businessName)}${spec.tagline ? ' — ' + esc(spec.tagline) : ''}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${fontsHref}" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{font-family:'${bodyFont}',sans-serif;background:${colors.bg};color:${colors.text};overflow-x:hidden;-webkit-font-smoothing:antialiased;${spec.styleHints || ''}}
/* Nav */
.sf-nav{position:fixed;top:0;left:0;right:0;z-index:100;display:flex;align-items:center;justify-content:space-between;padding:1.5rem 2rem;max-width:1280px;margin:0 auto}
.sf-logo{font-family:'${displayFont}',serif;font-size:1.875rem;color:${colors.text};letter-spacing:-0.02em;text-decoration:none}
.sf-logo sup{font-size:0.5em}
.sf-nav-links{display:flex;gap:2rem;align-items:center}
.sf-nav-link{font-size:0.875rem;color:${colors.muted};transition:color 0.2s;cursor:pointer;background:none;border:none;font-family:'${bodyFont}',sans-serif;padding:0}
.sf-nav-link:hover{color:${colors.text}}
.sf-nav-cta{background:${colors.text};color:${colors.bg};font-size:0.875rem;font-weight:500;padding:0.625rem 1.5rem;border-radius:9999px;border:none;cursor:pointer;transition:transform 0.2s;font-family:'${bodyFont}',sans-serif}
.sf-nav-cta:hover{transform:scale(1.03)}
.sf-nav-mobile{display:none;flex-direction:column;gap:4px;cursor:pointer}
@media(max-width:768px){.sf-nav-links{display:none}.sf-nav-mobile{display:flex}}
.sf-nav-mobile span{width:24px;height:2px;background:${colors.text};border-radius:2px}
/* Hero (shared) */
.sf-hero{position:relative;min-height:100vh;min-height:100dvh;width:100%;overflow:hidden;background:${colors.bg}}
.sf-hero-solid{background:${colors.bg}}
.sf-hero-video,.sf-hero-video-bg{position:absolute;inset:0;z-index:0;width:100%;height:100%;object-fit:cover}
.sf-hero-video-bg{background-size:cover;background-position:center}
.sf-hero-overlay{position:absolute;inset:0;z-index:1;pointer-events:none}
.sf-hero-content{position:relative;z-index:10;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 1.5rem;padding-top:8rem;padding-bottom:8rem;min-height:100vh;min-height:100dvh}
.sf-hero h1{font-family:'${displayFont}',serif;font-size:clamp(3rem,8vw,6rem);font-weight:400;line-height:0.95;letter-spacing:-2.46px;color:${colors.text};max-width:1280px}
.sf-hero h1 em{font-style:italic;color:${colors.muted}}
.sf-hero-sub{font-size:clamp(1rem,1.5vw,1.125rem);color:${colors.muted};max-width:640px;margin-top:2rem;line-height:1.6}
.sf-hero-cta{margin-top:3rem;background:${colors.text};color:${colors.bg};font-size:1rem;font-weight:500;padding:1.25rem 3.5rem;border-radius:9999px;border:none;cursor:pointer;transition:transform 0.2s;font-family:'${bodyFont}',sans-serif}
.sf-hero-cta:hover{transform:scale(1.03)}
/* Split hero */
.sf-split{display:grid;grid-template-columns:1fr 1fr;min-height:100vh;min-height:100dvh;width:100%;overflow:hidden;background:${colors.bg}}
@media(max-width:900px){.sf-split{grid-template-columns:1fr}}
.sf-split-text{display:flex;flex-direction:column;justify-content:center;padding:2rem 4rem;gap:1.5rem}
@media(max-width:900px){.sf-split-text{padding:6rem 2rem 3rem}}
.sf-split-text h1{font-family:'${displayFont}',serif;font-size:clamp(2.5rem,5vw,4.5rem);font-weight:400;line-height:1;letter-spacing:-0.02em;color:${colors.text}}
.sf-split-text h1 em{font-style:italic;color:${colors.muted}}
.sf-split-body{font-size:1.125rem;line-height:1.7}
.sf-split-cta{align-self:flex-start;padding:1rem 2.5rem;border-radius:9999px;border:none;cursor:pointer;font-size:0.9375rem;font-weight:500;font-family:'${bodyFont}',sans-serif}
.sf-split-media-wrap{position:relative;overflow:hidden}
.sf-split-media{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background-size:cover;background-position:center}
/* Section */
.sf-section{padding:8rem 2rem}
.sf-section-inner{max-width:1100px;margin:0 auto}
.sf-section h2{font-family:'${displayFont}',serif;font-size:clamp(2.5rem,5vw,4rem);font-weight:400;line-height:1;letter-spacing:-0.03em;color:${colors.text};margin-bottom:1.5rem}
.sf-section h2 em{font-style:italic;color:${colors.muted}}
.sf-sec-body{font-size:1.125rem;line-height:1.7;color:${colors.muted};max-width:640px;margin-bottom:2rem}
/* Features grid */
.sf-features-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:2rem;margin-top:3rem}
.sf-feature{padding:2rem;border-radius:16px;transition:transform 0.3s,box-shadow 0.3s}
.sf-feature:hover{transform:translateY(-4px);box-shadow:0 12px 32px ${withAlpha(colors.text, 0.08)}}
.sf-feature-icon{font-size:1.5rem;margin-bottom:0.75rem}
.sf-feature h3{font-family:'${displayFont}',serif;font-size:1.5rem;font-weight:400;margin-bottom:0.75rem}
.sf-feature p{font-size:0.9375rem;line-height:1.6;color:${colors.muted}}
/* Stats */
.sf-stats{padding:5rem 2rem;text-align:center}
.sf-stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:2rem;max-width:1100px;margin:0 auto}
.sf-stat-num{font-family:'${displayFont}',serif;font-size:clamp(2.5rem,5vw,4rem);font-weight:400;line-height:1}
.sf-stat-lbl{font-size:0.75rem;text-transform:uppercase;letter-spacing:0.1em;margin-top:0.5rem}
/* Gallery */
.sf-gallery-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;margin-top:3rem}
.sf-gallery-masonry{columns:3;column-gap:1.5rem;margin-top:3rem}
@media(max-width:900px){.sf-gallery-masonry{columns:2}}
@media(max-width:600px){.sf-gallery-masonry{columns:1}}
.sf-gallery-item{break-inside:avoid;margin-bottom:1.5rem;border-radius:12px;overflow:hidden}
.sf-gallery-item>div{width:100%}
.sf-gallery-cap{padding:1rem;font-size:0.875rem}
/* Partners */
.sf-partners-row{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:3rem;margin-top:3rem}
.sf-partner{font-family:'${displayFont}',serif;font-size:1.5rem;font-weight:400}
/* CTA band */
.sf-cta-band{padding:6rem 2rem}
.sf-cta-band h2{font-size:clamp(2rem,4vw,3rem)}
.sf-cta-band-btn{margin-top:2rem;padding:1.1rem 3rem;border-radius:9999px;border:none;cursor:pointer;font-size:1rem;font-weight:500;font-family:'${bodyFont}',sans-serif}
/* Testimonials */
.sf-testimonials-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:2rem;margin-top:3rem}
.sf-testimonial{padding:2rem;border-radius:16px}
.sf-testimonial-quote{font-family:'${displayFont}',serif;font-size:1.25rem;line-height:1.5;font-style:italic;margin-bottom:1rem}
.sf-testimonial-author{font-size:0.875rem}
/* FAQ */
.sf-faq-list{margin-top:2rem}
.sf-faq-item{padding:1.25rem 0;cursor:pointer}
.sf-faq-item summary{display:flex;justify-content:space-between;align-items:center;font-size:1.0625rem;font-weight:500;list-style:none;cursor:pointer}
.sf-faq-item summary::-webkit-details-marker{display:none}
.sf-faq-toggle{font-size:1.5rem;font-weight:300;color:${colors.muted}}
.sf-faq-item[open] .sf-faq-toggle{transform:rotate(45deg)}
.sf-faq-answer{margin-top:0.75rem;font-size:1rem;line-height:1.6}
/* Pricing */
.sf-pricing-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:2rem;margin-top:3rem}
.sf-pricing-card{padding:2.5rem 2rem;border-radius:16px;display:flex;flex-direction:column;gap:0.75rem}
.sf-pricing-featured{transform:scale(1.03)}
.sf-pricing-name{font-size:0.75rem;text-transform:uppercase;letter-spacing:0.1em}
.sf-pricing-price{font-family:'${displayFont}',serif;font-size:3rem;font-weight:400;line-height:1}
.sf-pricing-desc{font-size:0.9375rem;line-height:1.6}
.sf-pricing-cta{margin-top:1rem;padding:0.875rem 1.5rem;border-radius:9999px;border:none;cursor:pointer;font-size:0.9375rem;font-weight:500;font-family:'${bodyFont}',sans-serif}
/* Team */
.sf-team-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:2rem;margin-top:3rem}
.sf-team-card{text-align:center}
.sf-team-photo{aspect-ratio:3/4;border-radius:12px;margin-bottom:1rem;background-size:cover;background-position:center}
.sf-team-card h3{font-family:'${displayFont}',serif;font-size:1.25rem;font-weight:400;margin-bottom:0.25rem}
.sf-team-card p{font-size:0.875rem;color:${colors.muted}}
/* Blog */
.sf-blog-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:2rem;margin-top:3rem}
.sf-blog-card{border-radius:12px;overflow:hidden}
.sf-blog-img{aspect-ratio:16/10;background-size:cover;background-position:center}
.sf-blog-body{padding:1.5rem}
.sf-blog-meta{font-size:0.75rem;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.5rem}
.sf-blog-card h3{font-family:'${displayFont}',serif;font-size:1.5rem;font-weight:400;margin-bottom:0.5rem}
.sf-blog-card p{font-size:0.9375rem;line-height:1.6;color:${colors.muted}}
/* Contact form */
.sf-contact-form{display:flex;flex-direction:column;gap:1rem;margin-top:2rem}
.sf-contact-form input,.sf-contact-form textarea{padding:0.875rem 1rem;border-radius:8px;font-size:0.9375rem;font-family:'${bodyFont}',sans-serif;outline:none}
.sf-contact-form button{padding:1rem 1.5rem;border-radius:9999px;border:none;cursor:pointer;font-size:1rem;font-weight:500;font-family:'${bodyFont}',sans-serif}
/* Footer */
.sf-footer{padding:4rem 2rem 2rem}
.sf-footer-inner{max-width:1100px;margin:0 auto;display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:3rem}
@media(max-width:768px){.sf-footer-inner{grid-template-columns:1fr 1fr;gap:2rem}}
@media(max-width:480px){.sf-footer-inner{grid-template-columns:1fr}}
.sf-footer-brand h3{font-family:'${displayFont}',serif;font-size:1.5rem;font-weight:400;margin-bottom:1rem}
.sf-footer-brand p{font-size:0.875rem;line-height:1.6;color:${withAlpha(colors.bg, 0.7)}}
.sf-footer h4{font-size:0.75rem;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:1rem}
.sf-footer a{display:block;font-size:0.875rem;margin-bottom:0.5rem;cursor:pointer;transition:color 0.2s;text-decoration:none}
.sf-footer a:hover{color:${colors.bg}}
.sf-footer-bottom{max-width:1100px;margin:3rem auto 0;padding-top:2rem;border-top:1px solid ${withAlpha(colors.bg, 0.1)};text-align:center;font-size:0.8125rem}
.sf-auto-footer .sf-footer-bottom{border-top:none;margin:0;padding:2rem}
/* Reveal-on-scroll */
.reveal{opacity:0;transform:translateY(30px);transition:opacity 0.8s ease-out,transform 0.8s ease-out}
.reveal.visible{opacity:1;transform:translateY(0)}
${animCss}
@media(prefers-reduced-motion:reduce){*{animation:none!important;opacity:1!important;transform:none!important;transition:none!important}}
</style>
</head>
<body>
${navHtml}
${sectionsHtml}
${autoFooter}
<script>
if('IntersectionObserver'in window){var o=new IntersectionObserver(function(e){e.forEach(function(i){if(i.isIntersecting){i.target.classList.add('visible');o.unobserve(i.target)}})},{threshold:0.1});document.querySelectorAll('.reveal').forEach(function(e){o.observe(e)})}else{document.querySelectorAll('.reveal').forEach(function(e){e.classList.add('visible')})}
document.querySelectorAll('.sf-nav-cta').forEach(function(b){b.addEventListener('click',function(){var t=document.querySelector('.sf-section,.sf-split');if(t)t.scrollIntoView({behavior:'smooth'})})});
document.querySelector('.sf-nav-mobile')?.addEventListener('click',function(){document.querySelector('.sf-section,.sf-split')?.scrollIntoView({behavior:'smooth'})});
</script>
</body>
</html>`;

  function buildNav(spec: StructuredSpec, c: ColorSet): string {
    if (spec.navItems.length === 0 && !spec.ctaText) return '';
    return `<nav class="sf-nav">
  <a class="sf-logo" href="#">${spec.logo.includes('®') ? spec.logo.replace('®', '<sup>®</sup>') : spec.logo.includes('™') ? spec.logo.replace('™', '<sup>™</sup>') : spec.logo.includes('©') ? spec.logo.replace('©', '<sup>©</sup>') : esc(spec.logo)}</a>
  <div class="sf-nav-links">
    ${navItemsHtml}
    ${spec.ctaText ? `<button class="sf-nav-cta">${esc(spec.ctaText)}</button>` : ''}
  </div>
  <div class="sf-nav-mobile"><span></span><span></span><span></span></div>
</nav>`;
  }
}

function buildAnimationsCss(spec: StructuredSpec): string {
  let css = '';
  const has = (name: string) => spec.sections.some(s => s.animation === name) || spec.animations.some(a => a.name === name);
  if (has('fade-rise') || has('fade') || has('blur')) {
    css += `
@keyframes sfFadeRise{0%{opacity:0;transform:translateY(20px)}100%{opacity:1;transform:translateY(0)}}
@keyframes sfFade{0%{opacity:0}100%{opacity:1}}
@keyframes sfBlur{0%{opacity:0;filter:blur(10px)}100%{opacity:1;filter:blur(0)}}
`;
  }
  if (has('fade-rise')) {
    css += `.sf-fade-rise .sf-hero-content>*{opacity:0;animation:sfFadeRise 0.8s ease-out forwards}
.sf-fade-rise .sf-hero-content>:nth-child(1){animation-delay:0.2s}
.sf-fade-rise .sf-hero-content>:nth-child(2){animation-delay:0.4s}
.sf-fade-rise .sf-hero-content>:nth-child(3){animation-delay:0.6s}
.sf-fade-rise .sf-split-text>*{opacity:0;animation:sfFadeRise 0.8s ease-out forwards}
.sf-fade-rise .sf-split-text>:nth-child(1){animation-delay:0.1s}
.sf-fade-rise .sf-split-text>:nth-child(2){animation-delay:0.25s}
.sf-fade-rise .sf-split-text>:nth-child(3){animation-delay:0.4s}
`;
  }
  if (has('fade')) {
    css += `.sf-fade .sf-hero-content>*{opacity:0;animation:sfFade 0.8s ease-out forwards}
.sf-fade .sf-hero-content>:nth-child(1){animation-delay:0.1s}
.sf-fade .sf-hero-content>:nth-child(2){animation-delay:0.3s}
.sf-fade .sf-hero-content>:nth-child(3){animation-delay:0.5s}
`;
  }
  if (has('blur')) {
    css += `.sf-blur .sf-hero-content>*{opacity:0;animation:sfBlur 0.9s ease-out forwards}
.sf-blur .sf-hero-content>:nth-child(1){animation-delay:0.2s}
.sf-blur .sf-hero-content>:nth-child(2){animation-delay:0.4s}
.sf-blur .sf-hero-content>:nth-child(3){animation-delay:0.6s}
`;
  }
  if (has('ken-burns')) {
    css += `@keyframes sfKenBurns{0%{transform:scale(1) translate(0,0)}100%{transform:scale(1.1) translate(-1%,-1%)}}
.sf-ken-burns .sf-hero-video,.sf-ken-burns .sf-hero-video-bg{animation:sfKenBurns 20s ease-out alternate infinite}
`;
  }
  if (has('parallax')) {
    css += `.sf-parallax .sf-hero-video,.sf-parallax .sf-hero-video-bg{position:sticky;top:0;height:100vh}
`;
  }
  if (has('scale')) {
    css += `.sf-scale .sf-hero-cta:hover,.sf-scale .sf-nav-cta:hover,.sf-scale .sf-split-cta:hover{transform:scale(1.03)}
`;
  }
  return css;
}

/* ============================================================================
 * Top-level orchestrator
 * ========================================================================== */

export interface RecreateOptions {
  /** Use LLM-driven structured extraction (default true). Falls back to regex if LLM fails. */
  useLLM?: boolean;
  /** LLM model to use. */
  model?: string;
  /** LLM call timeout. */
  timeoutMs?: number;
  /**
   * Pre-computed LLM extraction result (from a client-side Groq call).
   * If provided, the server skips the LLM call entirely and uses this result
   * directly — avoiding Vercel's 10s Hobby timeout.
   * Format: OpenAI-compatible chat completion response.
   */
  groqExtraction?: any;
}

export async function recreateFromPromptAsync(
  slug: string,
  opts: RecreateOptions = {},
): Promise<{ html: string; spec: StructuredSpec; prompt: MotionPrompt } | null> {
  const prompts = loadMotionPrompts();
  const prompt = prompts.find(p => p.id === slug || p.title.toLowerCase().includes(slug.toLowerCase()) || slug.toLowerCase().includes(p.id.toLowerCase()));
  if (!prompt) return null;

  const useLLM = opts.useLLM !== false;
  const spec = useLLM
    ? await extractStructuredSpecsViaLLM(prompt, { model: opts.model, timeoutMs: opts.timeoutMs, groqExtraction: opts.groqExtraction })
    : extractStructuredSpecsSync(prompt);

  const html = renderStructuredSite(spec);
  return { html, spec, prompt };
}

/**
 * Synchronous V1 entry point — kept for backward compatibility.
 * Uses the regex extractor + the V1 single-template renderer.
 * @deprecated Use recreateFromPromptAsync instead.
 */
export function recreateFromPrompt(slug: string): { html: string; specs: ExtractedSpecs; prompt: MotionPrompt } | null {
  const prompts = loadMotionPrompts();
  const prompt = prompts.find(p => p.id === slug || p.title.toLowerCase().includes(slug.toLowerCase()));
  if (!prompt) return null;
  const specs = extractSpecs(prompt);
  // Use the new renderer with the fallback (regex-derived) spec — much better than the V1 template.
  const spec = buildFallbackSpec(prompt);
  const html = renderStructuredSite(spec);
  return { html, specs, prompt };
}

/* ============================================================================
 * Convenience: list prompts (for UI)
 * ========================================================================== */

export function listRecreatablePrompts(): Array<{
  id: string; title: string; category: string; type: string;
  colorCount: number; fontCount: number; charCount: number;
}> {
  return loadMotionPrompts().map(p => ({
    id: p.id,
    title: p.title,
    category: p.category,
    type: p.type,
    colorCount: p.colors.length,
    fontCount: p.fonts.length,
    charCount: p.charCount,
  }));
}
