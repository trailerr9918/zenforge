/**
 * VA Teaching System
 * ==================
 *
 * Instead of using the template statically, we TEACH the LLM by:
 * 1. Showing it a PERFECT example (the template)
 * 2. Explaining WHY each feature matters
 * 3. Asking it to create its OWN version with different layout/content
 * 4. Using the catalog for real video URLs, fonts, colors
 *
 * The LLM learns the PATTERN, not the template.
 * Each generation gets a different design system + different layout approach.
 */

import { HERO_VIDEO_POOL, SECTION_VIDEO_POOL, FONT_PAIRINGS, DESIGN_SYSTEMS, type DesignSystem } from './premium-website-system';

/** The teaching example — a perfect 16/16 website that the LLM studies */
export const TEACHING_EXAMPLE_SUMMARY = `
## TEACHING EXAMPLE — This is what a PERFECT website looks like

Study this structure. Your output must match this quality level, but with DIFFERENT layout, colors, and content.

### What makes this perfect (16/16):
1. PRELOADER: A div with class="preloader" that is hidden after 2s via setTimeout. The preloader shows the brand name with a gradient text effect.
2. SCROLL PROGRESS: A fixed bar at top (class="scroll-progress") that updates width based on scroll position.
3. NAV: Fixed, transparent initially, adds .scrolled class on scroll (glassmorphism with backdrop-filter:blur). Logo left, nav links center, CTA button right.
4. HERO: 100vh height, video background with opacity 0.4, gradient overlay, centered content with h1 (italic emphasis on key words via <em>), subheading, CTA button.
5. FEATURES: 4 cards in a CSS Grid (auto-fit, minmax(250px,1fr)). Each card has: backdrop-filter:blur(12px) for glassmorphism, inline SVG icon, h3 title, p description, :hover translateY(-8px) + box-shadow.
6. STATS: 4 numbers in a grid. Each has data-target="NUMBER" attribute. Animated count-up using requestAnimationFrame triggered by IntersectionObserver (threshold: 0.5).
7. TESTIMONIALS: 3 cards. Each has: picsum.photos avatar (48px circle), 5 inline SVG star icons, quote text, name (h3), role (p).
8. FAQ: 5 items. Each has .faq-q (question + "+" icon) and .faq-a (answer with max-height:0 transition). Click toggles .open class, max-height animates to 200px.
9. CTA SECTION: Centered, large heading with <em> emphasis, subheading, gradient CTA button.
10. FOOTER: 4-column grid. Column 1: brand + newsletter <form> (email input + submit button) + 4 inline SVG social icons (Twitter, GitHub, LinkedIn, Instagram). Columns 2-4: link lists. Bottom: copyright bar.
11. BACK-TO-TOP: Fixed button bottom-right, appears after 300px scroll, smooth scroll to top.
12. JAVASCRIPT: IntersectionObserver for .reveal elements (adds .visible class), counter observer for [data-target], FAQ click handlers, custom cursor (pointer:fine check), scroll listener for nav + progress bar + back-to-top.
13. CSS: clamp() for ALL font sizes, :root variables for colors, .reveal class with transition + staggered delays, @media 768px and 1024px breakpoints.
14. REAL CONTENT: Specific, meaningful copy about the business. NO lorem ipsum.
15. SEMANTIC HTML: <section>, <nav>, <footer>, <header> tags used properly.
16. SINGLE FILE: All CSS in <style>, all JS in <script>, only external deps are Google Fonts + video URL.

### The JavaScript pattern (USE THIS EXACT PATTERN):
- setTimeout for preloader (2s)
- window.addEventListener('scroll') for nav, progress bar, back-to-top
- new IntersectionObserver for .reveal elements
- new IntersectionObserver for [data-target] counters
- requestAnimationFrame for counter animation
- click event listeners for FAQ items
- window.matchMedia('(pointer:fine)') check for custom cursor
`;

/** Build a teaching prompt for the LLM */
export function buildTeachingPrompt(
  businessName: string,
  businessDescription: string,
  designSystem: DesignSystem,
  catalogVideos: string[],
  catalogFonts: { display: string; body: string } | null,
): string {
  // Pick a random video from catalog
  const heroVideo = catalogVideos[0] || HERO_VIDEO_POOL[0];
  const ctaVideo = catalogVideos[1] || SECTION_VIDEO_POOL[0];

  // Pick a random layout variant for variety
  const layouts = [
    'centered hero with features below in a row',
    'split hero (text left, visual right) with features in a 2x2 grid',
    'full-bleed hero with features in a horizontal scroll',
    'minimal hero with large typography and features in a staggered grid',
    'video hero with features as overlapping cards',
  ];
  const layoutChoice = layouts[Math.floor(Math.random() * layouts.length)];

  // Pick nav style
  const navStyles = [
    'transparent → glass-blur on scroll, logo left, links center, CTA right',
    'solid bar from start, logo center, links left, CTA right',
    'floating pill nav (centered, rounded), transparent → solid on scroll',
    'minimal: logo left, hamburger right, full-screen overlay menu on click',
  ];
  const navChoice = navStyles[Math.floor(Math.random() * navStyles.length)];

  return `You are ZenForge AI, an elite website designer that creates $50K-agency-grade websites.

${TEACHING_EXAMPLE_SUMMARY}

## YOUR TASK
Create a COMPLETE website for: ${businessName}
Description: ${businessDescription}

## DESIGN SYSTEM (use these exact values)
- Background: ${designSystem.bg}
- Text: ${designSystem.text}
- Accent 1: ${designSystem.accent}
- Accent 2: ${designSystem.accentGradient.includes(',') ? designSystem.accentGradient.split(',')[1].trim().replace('linear-gradient(135deg, ', '').replace(')', '') : designSystem.accent}
- Display font: ${catalogFonts?.display || designSystem.displayFont}
- Body font: ${catalogFonts?.body || designSystem.bodyFont}
- Nav font: ${designSystem.navFont}

## LAYOUT (make it UNIQUE — different from the teaching example)
- Hero style: ${layoutChoice}
- Nav style: ${navChoice}
- Use a DIFFERENT section order than the example if it makes sense for the business

## VIDEO URLS (from catalog — use these)
- Hero background: ${heroVideo}
- CTA section background: ${ctaVideo}

## CRITICAL RULES
1. You MUST include ALL 16 features from the teaching example
2. You MUST use the EXACT JavaScript patterns shown (setTimeout, IntersectionObserver, requestAnimationFrame)
3. You MUST write REAL content about ${businessName} — no lorem ipsum
4. You MUST use <section>, <nav>, <footer>, <header> semantic tags
5. You MUST use clamp() for all font sizes
6. You MUST include @media (max-width:768px) and (max-width:1024px) breakpoints
7. The preloader MUST hide after 2s via setTimeout — NOT window.onload
8. Each feature card MUST have backdrop-filter:blur for glassmorphism
9. Stats MUST have data-target attributes and animated counters
10. FAQ MUST be an accordion with smooth max-height transition
11. Footer MUST have 4 inline SVG social icons
12. Include a custom cursor (pointer:fine check)
13. Include a scroll progress bar
14. Include a back-to-top button
15. Return ONLY HTML starting with <!DOCTYPE html>
16. Single file, inline CSS+JS, target 20-35KB

Remember: You are LEARNING from the example, not copying it. Create your own unique layout with the same quality level.

Return ONLY the complete HTML.`;
}

/** Strict review prompt — the AI subprocess reviewer */
export const STRICT_REVIEWER_PROMPT = `You are ZenForge's Strict AI Reviewer — a ruthless perfectionist.

Review the website HTML and score it. Be BRUTAL.

Score each category 0-2:
- 0 = Missing or broken
- 1 = Present but weak/generic
- 2 = Well-executed, premium quality

Categories (15 total, max score 30):
1. layout — CSS Grid, fluid spacing, full-bleed + contained sections
2. loading — Preloader with setTimeout hide (NOT window.onload)
3. navigation — Sticky, glass-blur on scroll, mobile responsive
4. hero — 100vh, video/gradient bg, overlay, headline, CTA
5. typography — Custom fonts, clamp(), hierarchy, italic emphasis
6. media — Video bg, SVG icons, picsum images
7. content — Real content (NO lorem ipsum), meaningful copy
8. socialProof — Testimonials with avatars, 5-star SVGs, names, roles
9. interactions — Hover effects, scroll reveals (IntersectionObserver), custom cursor
10. forms — Newsletter form, validation, success state
11. ecommerce — N/A unless applicable (score 2 if not needed)
12. jsEffects — requestAnimationFrame counters, smooth animations
13. technical — Semantic HTML, @media responsive, ARIA, SEO meta
14. footer — 4 columns, newsletter, social SVG icons, copyright
15. invisibleDetails — Scroll progress bar, back-to-top, FAQ accordion

PASSING THRESHOLD: 22/30

Return ONLY JSON:
{"score":N,"passed":bool,"verdict":"PASS"|"REJECT","issues":["..."],"improvements":["..."],"categoryScores":{"layout":N,"loading":N,...}}`;

/** Emoji review options for the human reviewer */
export const REVIEW_EMOJIS = [
  { emoji: '🤩', label: 'Love it', value: 5, action: 'approve' },
  { emoji: '😍', label: 'Great', value: 4, action: 'approve' },
  { emoji: '😐', label: 'Okay', value: 3, action: 'neutral' },
  { emoji: '😕', label: 'Needs work', value: 2, action: 'iterate' },
  { emoji: '😡', label: 'Trash', value: 1, action: 'reject' },
] as const;

/** Subprocess types */
export interface Subprocess {
  id: string;
  name: string;
  type: 'generator' | 'reviewer' | 'mutator' | 'researcher' | 'custom';
  status: 'idle' | 'thinking' | 'generating' | 'reviewing' | 'done' | 'error';
  model: string;
  task?: string;
  result?: string;
  thoughts: string[];
  createdAt: number;
}

/** VA state — tracks the current session */
export interface VAState {
  generated: { html: string; review: any; slug: string; url: string; score: number }[];
  approvedCount: number;
  rejectedCount: number;
  subprocesses: Subprocess[];
  chatMessages: { role: 'user' | 'assistant' | 'system'; content: string; timestamp: number }[];
  currentTask: string | null;
  isThinking: boolean;
}
