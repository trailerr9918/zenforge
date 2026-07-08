/**
 * MotionSites Prompt Library
 * ===========================
 * Parses the 3 uploaded MOTIONSITES_FREE_PROMPTS MD files (140+ prompts total)
 * into structured prompt objects. Each prompt contains:
 *   - title, slug, category, type
 *   - full prompt text (the recreation instructions)
 *   - extracted colors (hex codes)
 *   - extracted fonts (Google Fonts families)
 *   - extracted design tokens (border-radius, spacing, etc.)
 *
 * Used by:
 *   - Virtual Artist engine as training data (each cycle picks a random prompt
 *     as inspiration for generating a new pattern)
 *   - AI Agent as reference for high-end design examples
 *   - V6 Ultra Renderer for palette + typography options
 */

import fs from 'fs';
import path from 'path';

export interface MotionPrompt {
  id: string;            // slug
  title: string;
  category: string;      // Hero Section, Landing Page, Footer Section, etc.
  type: string;          // hero, landing-page, footer, etc.
  promptText: string;    // Full recreation prompt
  colors: string[];      // Extracted hex codes
  fonts: string[];       // Extracted font families
  designTokens: {
    borderRadius?: string;
    spacing?: string;
    maxWidth?: string;
    bgColor?: string;
    textColor?: string;
    accentColor?: string;
  };
  extractedPrinciples: string[]; // Plain-English design principles
  source?: string;
  charCount: number;
}

const UPLOAD_DIR = '/home/z/my-project/upload';
const BUNDLED_DIR = path.join(process.cwd(), 'src', 'lib', 'brain', 'motionsites');
const PROMPT_FILES = [
  'MOTIONSITES_FREE_PROMPTS.md',
  'MOTIONSITES_FREE_PROMPTS (1).md',
  'motionsites_free_prompts-1.md',
];

/** Resolve a prompt file path — checks bundled location first, then upload dir */
function resolvePromptFile(file: string): string | null {
  // Try bundled location first (works on Vercel)
  const bundled = path.join(BUNDLED_DIR, file);
  try {
    if (fs.existsSync(bundled)) return bundled;
  } catch {}
  // Fall back to upload dir (local sandbox only)
  const uploaded = path.join(UPLOAD_DIR, file);
  try {
    if (fs.existsSync(uploaded)) return uploaded;
  } catch {}
  return null;
}

let cachedPrompts: MotionPrompt[] | null = null;

/** Extract all hex colors from text */
function extractColors(text: string): string[] {
  const matches = text.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
  // Dedupe, filter to 8 max
  return Array.from(new Set(matches)).slice(0, 12);
}

/** Extract font families from text */
function extractFonts(text: string): string[] {
  const fonts = new Set<string>();
  // Match 'FontName' or "FontName" patterns
  const quoted = text.match(/['"]([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)['"]/g) || [];
  for (const q of quoted) {
    const name = q.replace(/['"]/g, '');
    // Filter common font names
    if (/serif|sans|inter|anton|playfair|montserrat|poppins|fraunces|syne|archivo|bricolage|merriweather|cormorant|lato|vibes|dancing|nunito|pacifico|grotesque|space|instrument/i.test(name)) {
      fonts.add(name);
    }
  }
  // Also match explicit font-family declarations
  const fontFamilyMatches = text.match(/fontFamily:\s*['"]([^'"]+)['"]/gi) || [];
  for (const m of fontFamilyMatches) {
    const name = m.match(/['"]([^'"]+)['"]/);
    if (name) fonts.add(name[1]);
  }
  return Array.from(fonts).slice(0, 6);
}

/** Extract design tokens from text */
function extractTokens(text: string): MotionPrompt['designTokens'] {
  const tokens: MotionPrompt['designTokens'] = {};
  // bg color
  const bg = text.match(/bg\s*[:=]\s*['"]?(#[0-9a-fA-F]{3,8})/i) || text.match(/background[^'"]*['"]?(#[0-9a-fA-F]{3,8})/i);
  if (bg) tokens.bgColor = bg[1];
  // text color
  const fg = text.match(/text[^'"]*['"]?(#[0-9a-fA-F]{3,8})/i);
  if (fg) tokens.textColor = fg[1];
  // accent color (lime, primary)
  const accent = text.match(/(?:accent|primary|lime)['"]?\s*[:=]\s*['"]?(#[0-9a-fA-F]{3,8})/i);
  if (accent) tokens.accentColor = accent[1];
  // border radius
  const radius = text.match(/border-radius:\s*([^;\n]+)/i) || text.match(/rounded(?:-(?:full|lg|md|sm|xl))?:?\s*\[?([^\s\]]+)\]?/i);
  if (radius) tokens.borderRadius = radius[1].trim();
  // max-width
  const maxW = text.match(/max-width:\s*([^;\n]+)/i) || text.match(/max-w-\[([^\]]+)\]/i);
  if (maxW) tokens.maxWidth = maxW[1].trim();
  return tokens;
}

/** Extract plain-English design principles from prompt text */
function extractPrinciples(text: string): string[] {
  const principles = new Set<string>();
  const lower = text.toLowerCase();
  if (lower.includes('glassmorphic') || lower.includes('glass')) principles.add('glassmorphic aesthetic');
  if (lower.includes('cinematic')) principles.add('cinematic feel');
  if (lower.includes('looping video') || lower.includes('video background')) principles.add('video background');
  if (lower.includes('gradient overlay')) principles.add('gradient overlay');
  if (lower.includes('fade-rise') || lower.includes('fade in')) principles.add('fade-rise animation');
  if (lower.includes('hover') && lower.includes('translate')) principles.add('hover translate effect');
  if (lower.includes('rounded-full') || lower.includes('rounded pill')) principles.add('pill-shaped buttons');
  if (lower.includes('rounded-[14px]') || lower.includes('rounded-[10px]')) principles.add('rounded card corners');
  if (lower.includes('instrument serif')) principles.add('Instrument Serif display');
  if (lower.includes('inter') && lower.includes('sans')) principles.add('Inter body font');
  if (lower.includes('tracking-tight') || lower.includes('letter-spacing')) principles.add('tight letter-spacing');
  if (lower.includes('leading-relaxed') || lower.includes('line-height')) principles.add('relaxed line-height');
  if (lower.includes('group-hover:scale')) principles.add('group-hover scale animation');
  if (lower.includes('aspectratio') || lower.includes('aspect-ratio')) principles.add('aspect-ratio preserved');
  if (lower.includes('shadow-2xl') || lower.includes('shadow-xl')) principles.add('dramatic shadow');
  if (lower.includes('ring-1') || lower.includes('border border')) principles.add('subtle border');
  if (lower.includes('min-h-screen')) principles.add('fullscreen layout');
  if (lower.includes('grid grid-cols')) principles.add('CSS grid layout');
  if (lower.includes('flex flex-col')) principles.add('flex column layout');
  if (lower.includes('absolute inset-0')) principles.add('absolute overlay layering');
  if (lower.includes('z-10') || lower.includes('z-50')) principles.add('z-index layering');
  if (lower.includes('backdrop-blur')) principles.add('backdrop blur effect');
  if (lower.includes('prefers-reduced-motion')) principles.add('reduced-motion support');
  if (lower.includes('aria-') || lower.includes('role=')) principles.add('ARIA accessibility');
  if (lower.includes('responsive') || lower.includes('@media')) principles.add('responsive breakpoints');
  if (lower.includes('dark mode') || lower.includes('bg-[#0')) principles.add('dark theme');
  if (lower.includes('light') && lower.includes('bg-[#f')) principles.add('light theme');
  if (lower.includes('framer-motion') || lower.includes('motion/react')) principles.add('Framer Motion animations');
  if (lower.includes('lucide-react')) principles.add('Lucide icons');
  if (lower.includes('cdntailwindcss') || lower.includes('tailwind')) principles.add('Tailwind CSS utility classes');
  return Array.from(principles);
}

/** Parse a single MD file into MotionPrompt objects */
function parseMdFile(filePath: string): MotionPrompt[] {
  const prompts: MotionPrompt[] = [];
  let content: string;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch { return prompts; }

  // Try format 1: "## N. Title" sections (MOTIONSITES_FREE_PROMPTS files)
  const sections = content.split(/\n(?=## \d+\.\s)/);
  for (const section of sections) {
    if (!/^## \d+\.\s/.test(section)) continue;
    const titleMatch = section.match(/^## \d+\.\s+(.+?)$/m);
    if (!titleMatch) continue;
    const title = titleMatch[1].trim();
    const slugMatch = section.match(/\*\*Slug:\*\*\s*`([^`]+)`/);
    const slug = slugMatch ? slugMatch[1] : title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const catMatch = section.match(/\*\*Category:\*\*\s*([^\n]+)/);
    const category = catMatch ? catMatch[1].trim() : 'General';
    const typeMatch = section.match(/\*\*Type:\*\*\s*([^\n]+)/);
    const type = typeMatch ? typeMatch[1].trim() : 'hero';
    const srcMatch = section.match(/\*\*Source:\*\*\s*<([^>]+)>/);
    const source = srcMatch ? srcMatch[1] : undefined;
    const promptMatch = section.match(/```(?:text)?\s*\n([\s\S]*?)\n```/);
    if (!promptMatch) continue;
    const promptText = promptMatch[1].trim();
    if (promptText.length < 200) continue;
    const colors = extractColors(promptText);
    const fonts = extractFonts(promptText);
    const designTokens = extractTokens(promptText);
    const extractedPrinciples = extractPrinciples(promptText);
    prompts.push({
      id: slug, title, category, type, promptText,
      colors, fonts, designTokens, extractedPrinciples,
      source, charCount: promptText.length,
    });
  }

  // If format 1 didn't yield anything, try format 2: "### Title" + "#### Prompt Text"
  // (used in motionsites_free_prompts-1.md)
  if (prompts.length === 0) {
    // Split by "### " headers
    const subSections = content.split(/\n(?=### )/);
    let currentCategory = 'General';
    for (const section of subSections) {
      if (!/^### /.test(section)) {
        // Check if this is a category header like "## Category Name (N prompts)"
        const catHeader = section.match(/^##\s+([^\n(]+?)\s+\(\d+\s*prompts\)/m);
        if (catHeader) currentCategory = catHeader[1].trim();
        continue;
      }
      const titleMatch = section.match(/^###\s+(.+?)$/m);
      if (!titleMatch) continue;
      const title = titleMatch[1].trim();
      const idMatch = section.match(/\*\*ID:\*\*\s*`([^`]+)`/);
      const slug = idMatch ? idMatch[1] : title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      // Find prompt text — could be in #### Prompt Text block or directly in ```
      const promptMatch = section.match(/```\s*\n([\s\S]*?)\n```/);
      if (!promptMatch) continue;
      const promptText = promptMatch[1].trim();
      if (promptText.length < 200) continue;
      const colors = extractColors(promptText);
      const fonts = extractFonts(promptText);
      const designTokens = extractTokens(promptText);
      const extractedPrinciples = extractPrinciples(promptText);
      // Guess type from category
      let type = 'hero';
      const lowerCat = currentCategory.toLowerCase();
      if (lowerCat.includes('footer')) type = 'footer';
      else if (lowerCat.includes('landing')) type = 'landing-page';
      else if (lowerCat.includes('portfolio')) type = 'portfolio';
      else if (lowerCat.includes('saas')) type = 'saas';
      else if (lowerCat.includes('features')) type = 'features';
      else if (lowerCat.includes('404')) type = '404';
      else if (lowerCat.includes('blog')) type = 'blog';
      else if (lowerCat.includes('agency')) type = 'agency';
      prompts.push({
        id: slug, title, category: currentCategory, type,
        promptText, colors, fonts, designTokens, extractedPrinciples,
        charCount: promptText.length,
      });
    }
  }

  return prompts;
}

/** Load all MotionSites prompts (cached) */
export function loadMotionPrompts(): MotionPrompt[] {
  if (cachedPrompts) return cachedPrompts;
  const all: MotionPrompt[] = [];
  const seenSlugs = new Set<string>();
  for (const file of PROMPT_FILES) {
    const fullPath = resolvePromptFile(file);
    if (!fullPath) continue;
    const prompts = parseMdFile(fullPath);
    for (const p of prompts) {
      if (!seenSlugs.has(p.id)) {
        seenSlugs.add(p.id);
        all.push(p);
      }
    }
  }
  cachedPrompts = all;
  console.log(`[motionsites] Loaded ${all.length} unique prompts from ${PROMPT_FILES.length} files`);
  return all;
}

/** Get a random prompt as inspiration */
export function randomPrompt(): MotionPrompt | null {
  const all = loadMotionPrompts();
  if (all.length === 0) return null;
  return all[Math.floor(Math.random() * all.length)];
}

/** Get prompts by category */
export function promptsByCategory(category: string): MotionPrompt[] {
  return loadMotionPrompts().filter(p => p.category.toLowerCase().includes(category.toLowerCase()));
}

/** Get prompts by type */
export function promptsByType(type: string): MotionPrompt[] {
  return loadMotionPrompts().filter(p => p.type.toLowerCase() === type.toLowerCase());
}

/** Get N most relevant prompts for a pattern type */
export function relevantPrompts(patternType: string, n: number = 3): MotionPrompt[] {
  const all = loadMotionPrompts();
  if (all.length === 0) return [];
  // Map pattern types to MotionSites types/categories
  const typeMap: Record<string, string[]> = {
    hero: ['Hero Section', 'Landing Page', 'hero', 'landing-page'],
    footer: ['Footer Section', 'footer'],
    cta: ['Hero Section', 'Landing Page', 'cta'],
    features: ['Features Section', 'features'],
    pricing: ['SaaS', 'pricing'],
    testimonials: ['Landing Page', 'testimonials'],
    nav: ['Hero Section', 'nav'],
    button: ['hero', 'button'],
    about: ['Landing Page', 'about'],
    gallery: ['Portfolio', 'gallery'],
    faq: ['faq'],
    stats: ['stats'],
    team: ['team'],
    contact: ['contact'],
    partners: ['partners'],
    blog: ['blog'],
  };
  const targetCats = typeMap[patternType] || ['hero'];
  // Score each prompt by category match
  const scored = all.map(p => {
    let score = 0;
    for (const cat of targetCats) {
      if (p.category.toLowerCase().includes(cat.toLowerCase())) score += 5;
      if (p.type.toLowerCase() === cat.toLowerCase()) score += 3;
    }
    score += Math.random() * 2;
    return { p, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, n).map(s => s.p);
}

/** Build a context string for AI prompts (concatenated inspiration) */
export function buildInspirationContext(patternType: string, n: number = 3): string {
  const prompts = relevantPrompts(patternType, n);
  if (prompts.length === 0) return '';
  return prompts.map((p, i) =>
    `INSPIRATION ${i + 1}: ${p.title} (${p.category})\n` +
    `Colors: ${p.colors.slice(0, 6).join(', ')}\n` +
    `Fonts: ${p.fonts.slice(0, 3).join(', ')}\n` +
    `Principles: ${p.extractedPrinciples.join(', ')}\n` +
    `Excerpt: ${p.promptText.slice(0, 400)}...`
  ).join('\n\n---\n\n');
}

/** Get summary stats for UI display */
export function getPromptStats(): { total: number; byCategory: Record<string, number>; byType: Record<string, number> } {
  const all = loadMotionPrompts();
  const byCategory: Record<string, number> = {};
  const byType: Record<string, number> = {};
  for (const p of all) {
    byCategory[p.category] = (byCategory[p.category] || 0) + 1;
    byType[p.type] = (byType[p.type] || 0) + 1;
  }
  return { total: all.length, byCategory, byType };
}
