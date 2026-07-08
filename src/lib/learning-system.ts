/**
 * ZenForge Learning System
 * ========================
 *
 * Analyzes the 100 premium learning websites to extract patterns,
 * techniques, and design knowledge that ZenForge uses to generate
 * its own unique websites.
 *
 * The 100 websites are in /download/learning-websites/ with an index.json
 * containing metadata about each (style, layout, colors, fonts, business type).
 */

import fs from 'fs';
import path from 'path';

export interface LearningWebsite {
  index: number;
  file: string;
  business: string;
  desc: string;
  style: string;
  layout: string;
  colors: { bg: string; accent: string };
  fonts: { display: string; body: string };
  size: number;
}

export interface DesignPattern {
  style: string;
  bgColors: string[];
  accentColors: string[];
  fontPairings: { display: string; body: string }[];
  layoutTypes: string[];
  businessTypes: string[];
  count: number;
}

/**
 * Load the index of all 100 learning websites.
 */
export function loadLearningIndex(): LearningWebsite[] {
  try {
    const indexPath = path.join(process.cwd(), 'download/learning-websites/index.json');
    if (fs.existsSync(indexPath)) {
      const data = fs.readFileSync(indexPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('[learning] Failed to load index:', e);
  }
  return [];
}

/**
 * Analyze patterns across all 100 learning websites.
 * Returns design patterns grouped by style.
 */
export function analyzePatterns(): DesignPattern[] {
  const websites = loadLearningIndex();
  const byStyle: Record<string, LearningWebsite[]> = {};

  for (const w of websites) {
    if (!byStyle[w.style]) byStyle[w.style] = [];
    byStyle[w.style].push(w);
  }

  return Object.entries(byStyle).map(([style, sites]) => ({
    style,
    bgColors: [...new Set(sites.map(s => s.colors.bg))],
    accentColors: [...new Set(sites.map(s => s.colors.accent))],
    fontPairings: [...new Set(sites.map(s => JSON.stringify(s.fonts)))].map(s => JSON.parse(s)),
    layoutTypes: [...new Set(sites.map(s => s.layout))],
    businessTypes: [...new Set(sites.map(s => s.business))],
    count: sites.length,
  }));
}

/**
 * Get a random learning website for reference.
 */
export function getRandomLearningWebsite(): LearningWebsite | null {
  const websites = loadLearningIndex();
  if (websites.length === 0) return null;
  return websites[Math.floor(Math.random() * websites.length)];
}

/**
 * Get learning websites by style.
 */
export function getByStyle(style: string): LearningWebsite[] {
  return loadLearningIndex().filter(w => w.style === style);
}

/**
 * Build a learning prompt that teaches the LLM from the 100 websites.
 * Instead of showing a static template, this shows MULTIPLE examples
 * with different styles, helping the LLM understand variety.
 */
export function buildLearningPrompt(businessName: string, businessDesc: string): string {
  const websites = loadLearningIndex();
  
  // Pick 3 random examples with DIFFERENT styles
  const shuffled = [...websites].sort(() => Math.random() - 0.5);
  const examples = shuffled.slice(0, 3);
  
  const exampleSummaries = examples.map((w, i) => `
### Example ${i + 1}: ${w.business} (${w.style} style)
- Background: ${w.colors.bg}
- Accent: ${w.colors.accent}
- Display font: ${w.fonts.display}
- Body font: ${w.fonts.body}
- Layout: ${w.layout}
- Business: ${w.desc}
- All 16 premium features present (IntersectionObserver, setTimeout preloader, animated counters, FAQ accordion, social SVGs, glassmorphism, clamp(), responsive, custom cursor, scroll progress, back-to-top, testimonials, newsletter form, video bg, semantic HTML, real content)
`).join('\n');

  return `You are ZenForge AI, an elite website designer trained on 100 premium websites.

## YOUR TRAINING DATA
You have studied 100 unique premium websites, each with different styles, layouts, colors, and business types. Here are 3 random examples from your training set:

${exampleSummaries}

## YOUR TASK
Create a COMPLETE website for: ${businessName}
Description: ${businessDesc}

## CRITICAL REQUIREMENTS (ALL 16 must be present)
1. <!DOCTYPE html> at start
2. <section>, <nav>, <footer> semantic tags
3. Preloader with setTimeout hide after 2s
4. Hero: 100vh, video bg with overlay, headline with <em> emphasis, CTA
5. Features: 4 cards with backdrop-filter:blur, SVG icons, :hover translateY
6. Stats: 4 numbers with data-target, requestAnimationFrame, IntersectionObserver
7. Testimonials: 3 cards, picsum avatars, 5-star SVGs, names, roles
8. FAQ: accordion, smooth max-height, click to toggle .open
9. Footer: 4 columns, newsletter <form>, inline SVG social icons (Twitter, GitHub, LinkedIn, Instagram)
10. IntersectionObserver for .reveal elements
11. Scroll progress bar (fixed top, gradient, updates on scroll)
12. clamp() for ALL font sizes
13. @media (max-width:768px) and (max-width:1024px) responsive
14. Custom cursor (pointer:fine check)
15. Back-to-top button
16. Real content about ${businessName} (NO lorem ipsum)

## VARIETY RULES
- Pick a DIFFERENT style than the examples above
- Pick a DIFFERENT color palette
- Pick a DIFFERENT font pairing
- Create a UNIQUE layout — don't copy any example
- Each section should have a different arrangement

## OUTPUT
Return ONLY complete HTML starting with <!DOCTYPE html>. Single file, inline CSS+JS. Target 20-35KB.`;
}
