/**
 * Design Knowledge Base
 * ======================
 * Loads and indexes the 147 design MD files in src/lib/brain/design-md/.
 * Each file contains structured YAML-ish content with colors, typography,
 * layout principles, and design rationale from brands like Stripe, Apple,
 * Linear, Figma, Vercel, Notion, Pinterest, etc.
 *
 * Used by the strict review machine to evaluate evolved patterns against
 * real-world design principles.
 */

import fs from 'fs';
import path from 'path';

export interface DesignPrinciple {
  brand: string;
  category: string;
  description: string;
  colors: Record<string, string>;
  typography: {
    fontFamily?: string;
    fontSize?: string;
    fontWeight?: string | number;
    lineHeight?: string | number;
    letterSpacing?: string;
  }[];
  layoutRules: string[];
  extractedPrinciples: string[]; // Plain-English principles extracted from description
}

const DESIGN_MD_ROOT = path.join(process.cwd(), 'src', 'lib', 'brain', 'design-md');

let cachedPrinciples: DesignPrinciple[] | null = null;
let cachedCorpus: string | null = null;

/** Parse a single design MD file into a DesignPrinciple */
function parseDesignMd(filePath: string, brand: string): DesignPrinciple | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const principle: DesignPrinciple = {
      brand,
      category: 'general',
      description: '',
      colors: {},
      typography: [],
      layoutRules: [],
      extractedPrinciples: [],
    };

    // Extract description (first block after `description:`)
    const descMatch = content.match(/description:\s*(?:\||")?([\s\S]*?)(?=\n[a-z_-]+:|\n---|\Z)/i);
    if (descMatch) {
      principle.description = descMatch[1].trim().replace(/^"|"$/g, '').replace(/\s+/g, ' ');
    }

    // Extract colors block
    const colorsMatch = content.match(/colors:\s*\n([\s\S]*?)(?=\n[a-z_-]+:|\n---|\Z)/i);
    if (colorsMatch) {
      const colorBlock = colorsMatch[1];
      const colorLines = colorBlock.split('\n');
      for (const line of colorLines) {
        const m = line.match(/^\s*([a-z_-]+):\s*["']?(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|[a-z]+)["']?/i);
        if (m) principle.colors[m[1]] = m[2];
      }
    }

    // Extract typography entries
    const typoBlock = content.match(/typography:\s*\n([\s\S]*?)(?=\n[a-z_-]+:|\n---|\Z)/i);
    if (typoBlock) {
      const entries = typoBlock[1].split(/\n  (?=[a-z])/);
      for (const entry of entries) {
        const t: any = {};
        const fm = entry.match(/fontFamily:\s*(.+)/);
        if (fm) t.fontFamily = fm[1].trim();
        const fs2 = entry.match(/fontSize:\s*(.+)/);
        if (fs2) t.fontSize = fs2[1].trim();
        const fw = entry.match(/fontWeight:\s*(.+)/);
        if (fw) t.fontWeight = fw[1].trim();
        const lh = entry.match(/lineHeight:\s*(.+)/);
        if (lh) t.lineHeight = lh[1].trim();
        const ls = entry.match(/letterSpacing:\s*(.+)/);
        if (ls) t.letterSpacing = ls[1].trim();
        if (Object.keys(t).length > 0) principle.typography.push(t);
      }
    }

    // Extract category from name
    const nameMatch = content.match(/name:\s*([^\n]+)/);
    if (nameMatch) {
      const name = nameMatch[1].trim();
      if (name.includes('landing')) principle.category = 'landing';
      else if (name.includes('pricing')) principle.category = 'pricing';
      else if (name.includes('docs')) principle.category = 'docs';
      else if (name.includes('dashboard')) principle.category = 'dashboard';
      else if (name.includes('blog')) principle.category = 'blog';
      else if (name.includes('portfolio')) principle.category = 'portfolio';
      else if (name.includes('commerce') || name.includes('shop')) principle.category = 'commerce';
      else principle.category = 'marketing';
    }

    // Extract plain-English principles from description
    if (principle.description) {
      const desc = principle.description.toLowerCase();
      const principles: string[] = [];
      // Detect specific design attributes mentioned
      if (desc.includes('mono')) principles.push('uses monochrome palette');
      if (desc.includes('pastel')) principles.push('uses pastel accent blocks');
      if (desc.includes('pill')) principles.push('uses pill-shaped buttons');
      if (desc.includes('rounded')) principles.push('uses rounded corners');
      if (desc.includes('editorial')) principles.push('editorial layout style');
      if (desc.includes('masonry')) principles.push('uses masonry grid layout');
      if (desc.includes('serif')) principles.push('uses serif typography');
      if (desc.includes('sans')) principles.push('uses sans-serif typography');
      if (desc.includes('variable font') || desc.includes('variable type')) principles.push('uses variable typography');
      if (desc.includes('tracking') || desc.includes('letter-spacing')) principles.push('uses letter-spacing tracking');
      if (desc.includes('hover')) principles.push('has hover interactions');
      if (desc.includes('transition')) principles.push('has smooth transitions');
      if (desc.includes('animation')) principles.push('has animations');
      if (desc.includes('sticky')) principles.push('uses sticky positioning');
      if (desc.includes('gradient')) principles.push('uses gradients sparingly');
      if (desc.includes('shadow')) principles.push('uses subtle shadows');
      if (desc.includes('border') && !desc.includes('borderless')) principles.push('uses defined borders');
      if (desc.includes('borderless')) principles.push('prefers borderless design');
      if (desc.includes('whitespace') || desc.includes('white space') || desc.includes('breathing')) principles.push('uses generous whitespace');
      if (desc.includes('responsive')) principles.push('responsive design');
      if (desc.includes('accessible') || desc.includes('accessibility')) principles.push('accessibility-focused');
      if (desc.includes('minimal') || desc.includes('clean')) principles.push('minimal aesthetic');
      if (desc.includes('dense') || desc.includes('compact')) principles.push('dense information layout');
      if (desc.includes('hero')) principles.push('has prominent hero section');
      if (desc.includes('cta')) principles.push('clear call-to-action');
      if (desc.includes('social proof') || desc.includes('testimonial')) principles.push('uses social proof');
      if (desc.includes('pricing')) principles.push('shows pricing clearly');
      principle.extractedPrinciples = principles;
    }

    return principle;
  } catch (e) {
    return null;
  }
}

/** Load all design MD files into a structured principle list */
export function loadDesignPrinciples(): DesignPrinciple[] {
  if (cachedPrinciples) return cachedPrinciples;
  const principles: DesignPrinciple[] = [];
  try {
    if (!fs.existsSync(DESIGN_MD_ROOT)) {
      console.warn('[design-kb] design-md directory not found at', DESIGN_MD_ROOT);
      cachedPrinciples = principles;
      return principles;
    }
    const brands = fs.readdirSync(DESIGN_MD_ROOT);
    for (const brand of brands) {
      const brandDir = path.join(DESIGN_MD_ROOT, brand);
      if (!fs.statSync(brandDir).isDirectory()) continue;
      const files = fs.readdirSync(brandDir);
      for (const file of files) {
        if (!file.endsWith('.md')) continue;
        const p = parseDesignMd(path.join(brandDir, file), brand);
        if (p) principles.push(p);
      }
    }
    cachedPrinciples = principles;
    console.log(`[design-kb] Loaded ${principles.length} design principles from ${brands.length} brands`);
  } catch (e) {
    console.error('[design-kb] Load error:', e);
  }
  return cachedPrinciples || [];
}

/** Get the full text corpus of all design MD files (used for AI context) */
export function getDesignCorpus(): string {
  if (cachedCorpus) return cachedCorpus;
  const principles = loadDesignPrinciples();
  const lines: string[] = [];
  for (const p of principles) {
    lines.push(`# ${p.brand.toUpperCase()} — ${p.category}`);
    lines.push(`Description: ${p.description}`);
    if (Object.keys(p.colors).length > 0) {
      lines.push(`Colors: ${Object.entries(p.colors).slice(0, 8).map(([k, v]) => `${k}=${v}`).join(', ')}`);
    }
    if (p.typography.length > 0) {
      const t = p.typography[0];
      lines.push(`Typography: ${t.fontFamily || 'system'} ${t.fontSize || ''} weight=${t.fontWeight || 'normal'}`);
    }
    if (p.extractedPrinciples.length > 0) {
      lines.push(`Principles: ${p.extractedPrinciples.join(', ')}`);
    }
    lines.push('');
  }
  cachedCorpus = lines.join('\n');
  return cachedCorpus;
}

/** Pick N random design principles for AI context (to avoid token overflow) */
export function sampleDesignPrinciples(n: number = 5): DesignPrinciple[] {
  const all = loadDesignPrinciples();
  if (all.length <= n) return all;
  const shuffled = [...all].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

/** Find principles most relevant to a pattern type */
export function relevantPrinciples(patternType: string, n: number = 5): DesignPrinciple[] {
  const all = loadDesignPrinciples();
  if (all.length === 0) return [];
  // Score each principle by relevance to the pattern type
  const scored = all.map(p => {
    let score = 0;
    const desc = p.description.toLowerCase();
    if (desc.includes(patternType)) score += 5;
    if (p.extractedPrinciples.some(pr => pr.includes(patternType))) score += 3;
    // Hero patterns benefit from hero principles
    if (patternType === 'hero' && (desc.includes('hero') || desc.includes('headline'))) score += 4;
    if (patternType === 'cta' && (desc.includes('cta') || desc.includes('button'))) score += 4;
    if (patternType === 'pricing' && desc.includes('pricing')) score += 4;
    if (patternType === 'testimonials' && (desc.includes('testimonial') || desc.includes('social proof'))) score += 4;
    if (patternType === 'footer' && desc.includes('footer')) score += 3;
    if (patternType === 'nav' && (desc.includes('nav') || desc.includes('sticky'))) score += 4;
    score += Math.random() * 2; // Tiebreaker
    return { p, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, n).map(s => s.p);
}

/** Get total file count for UI display */
export function getDesignFileCount(): number {
  return loadDesignPrinciples().length;
}
