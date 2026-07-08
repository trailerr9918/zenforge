/**
 * Prompt Catalog System
 * =====================
 *
 * Dissects all 121 MotionSites prompts into structured fields:
 * - Videos (type, link, name, description)
 * - Headers (nav styles, layouts)
 * - Footers (link grids, newsletters, social)
 * - Buttons (styles, variants, hover effects)
 * - Typography (fonts, sizes, weights, pairings)
 * - Colors (palettes, gradients, accents)
 *
 * This catalog allows ZenForge to:
 * 1. Pull specific elements (e.g., "use this video for hero")
 * 2. Learn from techniques across prompts
 * 3. Merge elements from multiple prompts
 * 4. Generate websites with curated, premium components
 */

export interface CatalogVideo {
  url: string;
  type: 'hero' | 'about' | 'cta' | 'gallery' | 'background' | 'unknown';
  name: string;
  description: string;
  sourcePrompt: string;
}

export interface CatalogTypography {
  display: string | null;
  body: string | null;
  accent: string | null;
  weights: number[];
  sourcePrompt: string;
}

export interface CatalogColor {
  bg: string;
  text: string;
  accent: string;
  muted: string | null;
  sourcePrompt: string;
}

export interface CatalogButton {
  type: string;
  style: string;
  text: string;
  sourcePrompt: string;
}

export interface CatalogHeader {
  style: string;
  navItems: string[];
  logo: string;
  sourcePrompt: string;
}

export interface CatalogFooter {
  style: string;
  columns: number;
  hasNewsletter: boolean;
  hasSocial: boolean;
  sourcePrompt: string;
}

export interface PromptCatalog {
  videos: CatalogVideo[];
  typographies: CatalogTypography[];
  colors: CatalogColor[];
  buttons: CatalogButton[];
  headers: CatalogHeader[];
  footers: CatalogFooter[];
  totalPrompts: number;
}

/**
 * Extract a catalog from a MotionSites prompt text.
 * Parses the prompt for videos, fonts, colors, buttons, headers, and footers.
 */
export function extractCatalogFromPrompt(promptId: string, promptTitle: string, promptText: string): {
  videos: CatalogVideo[];
  typographies: CatalogTypography[];
  colors: CatalogColor[];
  buttons: CatalogButton[];
  headers: CatalogHeader[];
  footers: CatalogFooter[];
} {
  const videos: CatalogVideo[] = [];
  const typographies: CatalogTypography[] = [];
  const colors: CatalogColor[] = [];
  const buttons: CatalogButton[] = [];
  const headers: CatalogHeader[] = [];
  const footers: CatalogFooter[] = [];

  // Extract video URLs
  const videoUrlPattern = /https?:\/\/[^\s"'<>]+\.(?:mp4|webm)/g;
  const videoUrls = Array.from(new Set(promptText.match(videoUrlPattern) || []));

  for (const url of videoUrls) {
    // Determine video type based on context
    const urlContext = getUrlContext(promptText, url);
    const videoName = extractVideoName(promptText, url);

    videos.push({
      url,
      type: urlContext,
      name: videoName,
      description: `${urlContext} video from ${promptTitle}`,
      sourcePrompt: promptId,
    });
  }

  // Extract fonts
  const knownFonts = [
    'Instrument Serif', 'Inter', 'Playfair Display', 'Space Grotesk',
    'Anton', 'Fraunces', 'Source Sans 3', 'Syne', 'Bricolage Grotesque',
    'DM Serif Display', 'Poppins', 'Nunito', 'Pacifico', 'Cormorant Garamond',
    'Lato', 'Great Vibes', 'Dancing Script', 'Montserrat', 'Merriweather',
    'Open Sans', 'Archivo Black', 'Helvetica Now', 'Kanit', 'Barlow',
    'Oswald', 'Bebas Neue', 'Roboto', 'Roboto Mono', 'JetBrains Mono',
    'IBM Plex Sans', 'IBM Plex Serif', 'IBM Plex Mono', 'Sora', 'Manrope',
    'Outfit', 'Plus Jakarta Sans', 'Geist', 'Geist Mono', 'Condiment',
    'Caveat', 'Space Mono',
  ];

  const foundFonts = new Set<string>();
  for (const font of knownFonts) {
    if (promptText.includes(font)) foundFonts.add(font);
  }

  if (foundFonts.size > 0) {
    const fontArr = Array.from(foundFonts);
    const display = fontArr.find(f => /serif|display|anton|archivo black|fraunces|bebas|oswald/i.test(f)) || fontArr[0];
    const body = fontArr.find(f => /inter|sans|grotesque|barlow|poppins|montserrat|source sans/i.test(f)) || fontArr.find(f => f !== display) || null;
    const accent = fontArr.find(f => /condiment|dancing|pacifico|great vibes|caveat|syne/i.test(f)) || null;

    typographies.push({
      display: display || null,
      body: body || null,
      accent: accent || null,
      weights: [400, 500, 600, 700],
      sourcePrompt: promptId,
    });
  }

  // Extract colors
  const colorPattern = /#[0-9a-fA-F]{6}\b/g;
  const colorMatches = Array.from(new Set(promptText.match(colorPattern) || []));

  if (colorMatches.length > 0) {
    const bg = colorMatches.find(c => isDarkColor(c)) || colorMatches[0];
    const text = colorMatches.find(c => !isDarkColor(c) && c !== bg) || '#ffffff';
    const accent = colorMatches.find(c => c !== bg && c !== text) || colorMatches[0];

    colors.push({
      bg,
      text,
      accent,
      muted: colorMatches.length > 3 ? colorMatches[3] : null,
      sourcePrompt: promptId,
    });
  }

  // Extract button info
  const ctaMatch = promptText.match(/(?:CTA|Button).*?(?:Text|Label):\s*"([^"]+)"/i);
  if (ctaMatch) {
    buttons.push({
      type: 'primary',
      style: 'gradient',
      text: ctaMatch[1],
      sourcePrompt: promptId,
    });
  }

  // Extract header/nav info
  const navMatch = promptText.match(/(?:Menu items|Navigation|Nav links):\s*([\s\S]+?)(?:\n\n|CTA|Layout:|Size:|Hero)/i);
  if (navMatch) {
    const navText = navMatch[1].replace(/\([^)]*\)/g, '').replace(/[^a-zA-Z,\s]/g, ' ').trim();
    const navItems = navText.split(/[,/|]/).map(s => s.trim()).filter(s => s.length > 1 && s.length < 24).slice(0, 6);
    if (navItems.length > 0) {
      headers.push({
        style: navItems.length > 4 ? 'mega' : 'simple',
        navItems,
        logo: promptTitle,
        sourcePrompt: promptId,
      });
    }
  }

  // Extract footer info
  if (promptText.toLowerCase().includes('footer')) {
    footers.push({
      style: promptText.toLowerCase().includes('newsletter') ? 'comprehensive' : 'standard',
      columns: promptText.toLowerCase().includes('column') ? 4 : 3,
      hasNewsletter: promptText.toLowerCase().includes('newsletter'),
      hasSocial: promptText.toLowerCase().includes('social') || promptText.toLowerCase().includes('twitter') || promptText.toLowerCase().includes('instagram'),
      sourcePrompt: promptId,
    });
  }

  return { videos, typographies, colors, buttons, headers, footers };
}

/** Determine the type of video based on surrounding context in the prompt. */
function getUrlContext(text: string, url: string): CatalogVideo['type'] {
  const urlIdx = text.indexOf(url);
  const before = text.slice(Math.max(0, urlIdx - 200), urlIdx).toLowerCase();
  const after = text.slice(urlIdx, urlIdx + 200).toLowerCase();

  if (before.includes('hero') || after.includes('hero')) return 'hero';
  if (before.includes('about') || after.includes('about')) return 'about';
  if (before.includes('cta') || after.includes('cta')) return 'cta';
  if (before.includes('gallery') || after.includes('gallery') || before.includes('card')) return 'gallery';
  if (before.includes('background') || after.includes('background')) return 'background';
  return 'unknown';
}

/** Extract a descriptive name for a video from the prompt. */
function extractVideoName(text: string, url: string): string {
  const urlIdx = text.indexOf(url);
  const context = text.slice(Math.max(0, urlIdx - 100), urlIdx + 100);

  // Try to find a name near the URL
  const nameMatch = context.match(/(?:Video|Background|Hero)(?:\s+URL)?:?\s*([^\n]+)/i);
  if (nameMatch) return nameMatch[1].trim().slice(0, 60);

  // Use the filename from the URL
  const filename = url.split('/').pop() || 'video';
  return filename.replace(/\.(mp4|webm)$/, '');
}

/** Check if a color is dark (for bg/text detection). */
function isDarkColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 0.299 + g * 0.587 + b * 0.114) < 128;
}

/**
 * Build a complete catalog from all MotionSites prompts.
 * This is called by the API endpoint to generate the catalog on-demand.
 */
export async function buildFullCatalog(): Promise<PromptCatalog> {
  const { loadMotionPrompts } = await import('./motionsites-prompts');
  const prompts = loadMotionPrompts();

  const catalog: PromptCatalog = {
    videos: [],
    typographies: [],
    colors: [],
    buttons: [],
    headers: [],
    footers: [],
    totalPrompts: prompts.length,
  };

  for (const prompt of prompts) {
    const extracted = extractCatalogFromPrompt(prompt.id, prompt.title, prompt.promptText);
    catalog.videos.push(...extracted.videos);
    catalog.typographies.push(...extracted.typographies);
    catalog.colors.push(...extracted.colors);
    catalog.buttons.push(...extracted.buttons);
    catalog.headers.push(...extracted.headers);
    catalog.footers.push(...extracted.footers);
  }

  // Deduplicate videos by URL
  const seenUrls = new Set<string>();
  catalog.videos = catalog.videos.filter(v => {
    if (seenUrls.has(v.url)) return false;
    seenUrls.add(v.url);
    return true;
  });

  return catalog;
}
