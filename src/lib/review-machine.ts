/**
 * Strict Review Machine
 * ======================
 * Multi-pass review system that evaluates generated patterns against
 * real-world design principles extracted from 147 design MD files
 * (Stripe, Apple, Linear, Figma, Vercel, Notion, Pinterest, etc.).
 *
 * Review passes (each scores 0-100, all must pass thresholds):
 *   1. Typography review — font sizing, weight, tracking, line-height
 *   2. Color review — palette discipline, contrast, accent usage
 *   3. Layout review — grid system, spacing, alignment, max-width
 *   4. Accessibility review — WCAG basics, focus states, reduced motion
 *   5. Brand-consistency review (AI) — vs. real-world brand patterns
 *   6. Originality review — vs. existing evolved patterns
 *
 * Final score = weighted average. Acceptance threshold = 70 (strict).
 * Each rejection includes a specific, actionable reason.
 */

import { zaiChat, ZAI_MODELS } from './zai-client';
import { relevantPrinciples, type DesignPrinciple } from './design-kb';

export interface ReviewPass {
  name: string;
  score: number;       // 0-100
  maxScore: number;    // usually 100
  passed: boolean;
  findings: string[];  // Specific notes — what was good/bad
  failures: string[];  // Specific reasons for point loss
}

export interface ReviewResult {
  finalScore: number;
  passed: boolean;     // true if finalScore >= 70
  passes: ReviewPass[];
  summary: string;     // One-line summary
  recommendations: string[];  // Actionable improvements
  inspirationSource?: string; // Design principle that inspired this review
}

const ACCEPT_THRESHOLD = 75;
const HARD_FAIL_PASSES = ['typography', 'layout', 'accessibility']; // Must each be >= 60
const HARD_FAIL_THRESHOLD = 60;

/** Pass 1: Typography review */
function reviewTypography(css: string, html: string): ReviewPass {
  const findings: string[] = [];
  const failures: string[] = [];
  let score = 0;

  // clamp() usage = responsive typography (Linear/Raycast principle)
  if (css.includes('clamp(')) {
    score += 25;
    findings.push('Uses clamp() for responsive typography (Linear/Raycast pattern)');
  } else {
    failures.push('No clamp() — typography will not scale fluidly (Linear uses clamp everywhere)');
  }

  // Negative letter-spacing on headings (Stripe/Apple principle)
  if (css.match(/letter-spacing:\s*-0\.0[12]/)) {
    score += 15;
    findings.push('Tight letter-spacing on headings (Stripe/Apple pattern)');
  } else if (css.match(/letter-spacing:\s*-/)) {
    score += 10;
    findings.push('Negative letter-spacing present');
  } else {
    failures.push('No negative letter-spacing on headings — modern display type needs tight tracking');
  }

  // Proper line-height (1.1-1.5 for headings, 1.5-1.7 for body)
  if (css.match(/line-height:\s*1\.[1-5]/)) {
    score += 15;
    findings.push('Heading line-height in optimal range (1.1-1.5)');
  } else if (css.match(/line-height:\s*1\.[6-7]/)) {
    score += 8;
    findings.push('Body line-height in readable range');
  } else {
    failures.push('Line-height not in optimal range — use 1.1-1.5 for headings, 1.5-1.7 for body');
  }

  // Bold weight on headings (Stripe/Linear)
  if (css.match(/font-weight:\s*(600|700|800)/)) {
    score += 15;
    findings.push('Bold heading weight (Stripe/Linear pattern)');
  } else {
    failures.push('No bold heading weight — headings should be 600-700');
  }

  // Font-size hierarchy — multiple sizes used
  const fontSizes = (css.match(/font-size:\s*[^;]+/g) || []).length;
  if (fontSizes >= 3) {
    score += 15;
    findings.push(`${fontSizes} distinct font sizes — good hierarchy`);
  } else if (fontSizes >= 2) {
    score += 8;
    findings.push(`${fontSizes} font sizes — minimal hierarchy`);
  } else {
    failures.push('Insufficient font-size hierarchy — need at least 3 sizes');
  }

  // Variable font weight or specific font family (Figma principle)
  if (css.match(/font-family:\s*[^;]*(inter|sans|geist|figma|söhne|sohne)/i)) {
    score += 15;
    findings.push('Modern sans-serif font family (Inter/Geist/Söhne pattern)');
  } else if (css.match(/font-family:/)) {
    score += 8;
    findings.push('Custom font family specified');
  } else {
    failures.push('No font-family specified — falls back to browser default');
  }

  score = Math.min(100, score);
  return {
    name: 'typography',
    score,
    maxScore: 100,
    passed: score >= 50,
    findings,
    failures,
  };
}

/** Pass 2: Color review */
function reviewColor(css: string, html: string): ReviewPass {
  const findings: string[] = [];
  const failures: string[] = [];
  let score = 0;

  // Check for hex colors AND CSS variables (var(--va-accent) or var(--p-accent))
  const hexColors = new Set(css.match(/#[0-9a-fA-F]{3,8}/g) || []);
  const cssVars = new Set(css.match(/var\(--[a-z-]*(?:bg|text|accent|primary|color|border|glass|card|shadow)[a-z-]*\)/gi) || []);
  const totalColorSources = hexColors.size + cssVars.size;

  if (totalColorSources >= 3 && totalColorSources <= 12) {
    score += 25;
    findings.push(`${hexColors.size} hex + ${cssVars.size} CSS var colors — disciplined palette (Stripe uses ~6)`);
  } else if (totalColorSources > 12) {
    score += 5;
    failures.push(`${totalColorSources} color sources — palette is undisciplined`);
  } else if (totalColorSources > 0) {
    score += 15;
    findings.push(`${totalColorSources} color sources — minimal palette`);
  } else {
    failures.push('No hex colors or CSS variables found — design needs a defined palette');
  }

  // rgba/opacity usage for subtle layering (Apple/Vercel principle)
  if (css.match(/rgba\(/) || css.match(/opacity:\s*0?\.\d/)) {
    score += 15;
    findings.push('Uses rgba/opacity for subtle layering (Apple/Vercel pattern)');
  } else {
    failures.push('No opacity usage — modern designs layer with rgba(0,0,0,0.04) etc.');
  }

  // Defined accent color (Stripe/Linear principle)
  if (css.match(/(accent|primary|brand):\s*#/) || css.match(/#[0-9a-fA-F]{6}/)) {
    score += 15;
    findings.push('Has defined brand color');
  }

  // Background + foreground contrast (basic check)
  const hasDarkBg = css.match(/background[^:]*:\s*(?:#0|rgba\(0|black|#000)/i);
  const hasLightFg = css.match(/color:\s*(?:#f|white|#fff|rgba\(255)/i);
  const hasLightBg = css.match(/background[^:]*:\s*(?:#f|white|#fff|rgba\(255)/i);
  const hasDarkFg = css.match(/color:\s*(?:#0|black|#000|rgba\(0)/i);
  if ((hasDarkBg && hasLightFg) || (hasLightBg && hasDarkFg)) {
    score += 20;
    findings.push('Clear fg/bg contrast defined');
  } else {
    failures.push('Unclear contrast — define explicit bg + fg colors');
  }

  // No rainbow colors (anti-pattern)
  const rainbowTest = /(#ff0000|#00ff00|#0000ff|#ffff00|#ff00ff|#00ffff)/i;
  if (rainbowTest.test(css)) {
    score -= 20;
    failures.push('Rainbow primary colors detected — use refined brand palette instead');
  }

  // Border color definition (Linear principle)
  if (css.match(/border[^:]*:\s*1px\s+solid/) || css.match(/border-color:/)) {
    score += 15;
    findings.push('Defines subtle borders (Linear pattern)');
  } else {
    failures.push('No borders defined — Linear/Vercel use 1px borders everywhere');
  }

  // Border-radius consistency
  const radii = new Set(css.match(/border-radius:\s*[^;]+/g) || []);
  if (radii.size >= 1 && radii.size <= 4) {
    score += 10;
    findings.push(`${radii.size} distinct border-radii — consistent corners`);
  } else if (radii.size > 4) {
    failures.push(`${radii.size} distinct border-radii — too inconsistent`);
  }

  score = Math.max(0, Math.min(100, score));
  return {
    name: 'color',
    score,
    maxScore: 100,
    passed: score >= 50,
    findings,
    failures,
  };
}

/** Pass 3: Layout review */
function reviewLayout(css: string, html: string): ReviewPass {
  const findings: string[] = [];
  const failures: string[] = [];
  let score = 0;

  // Grid usage (modern layouts)
  if (css.includes('display:grid') || css.includes('display: grid')) {
    score += 25;
    findings.push('Uses CSS grid (modern layout pattern)');
  } else {
    failures.push('No CSS grid — modern layouts use grid for 2D structure');
  }

  // Flexbox usage
  if (css.includes('display:flex') || css.includes('display: flex')) {
    score += 15;
    findings.push('Uses flexbox for 1D layouts');
  } else {
    failures.push('No flexbox — needed for alignment');
  }

  // Responsive — @media queries (CRITICAL)
  if (css.includes('@media')) {
    score += 25;
    findings.push('Has responsive @media queries');
    if (css.match(/@media[^{]*max-width:\s*768px/)) {
      score += 5;
      findings.push('Mobile breakpoint at 768px (standard)');
    }
  } else {
    failures.push('CRITICAL: No @media queries — will break on mobile');
  }

  // max-width constraint (centered content)
  if (css.match(/max-width:\s*\d+px/)) {
    score += 15;
    findings.push('Has max-width constraint (centered content)');
  } else {
    failures.push('No max-width — content will stretch full-width on large screens');
  }

  // Gap property (modern spacing)
  if (css.match(/gap:\s*\d+/)) {
    score += 10;
    findings.push('Uses gap property (modern spacing)');
  }

  // Padding consistency
  const paddings = new Set(css.match(/padding:\s*[^;]+/g) || []);
  if (paddings.size >= 2 && paddings.size <= 6) {
    score += 10;
    findings.push(`${paddings.size} padding values — consistent spacing scale`);
  } else if (paddings.size > 6) {
    failures.push(`${paddings.size} padding values — needs a spacing scale (Tailwind uses 8)`);
  }

  // Auto-margin centering
  if (css.match(/margin:\s*0\s+auto/)) {
    score += 5;
    findings.push('Uses auto-margin centering');
  }

  score = Math.max(0, Math.min(100, score));
  return {
    name: 'layout',
    score,
    maxScore: 100,
    passed: score >= 50,
    findings,
    failures,
  };
}

/** Pass 4: Accessibility review */
function reviewAccessibility(css: string, html: string): ReviewPass {
  const findings: string[] = [];
  const failures: string[] = [];
  let score = 0;

  // Reduced motion support (WCAG 2.3.3) — only required if pattern has animations
  const hasAnimations = css.includes('@keyframes') || css.includes('animation:') || css.includes('transition:');
  if (css.match(/prefers-reduced-motion/)) {
    score += 25;
    findings.push('Respects prefers-reduced-motion (WCAG 2.3.3)');
  } else if (hasAnimations) {
    failures.push('No prefers-reduced-motion — fails WCAG 2.3.3 for motion sensitivity');
  } else {
    // No animations in this pattern — reduced-motion not required
    score += 15;
    findings.push('No animations — reduced-motion not required');
  }

  // Focus states — only required for interactive elements (buttons, links, inputs)
  const hasInteractive = css.includes(':hover') || css.includes('button') || css.includes('cursor:') || html.includes('<button') || html.includes('<a ') || html.includes('<input');
  if (css.match(/:focus/) || html.includes('tabindex')) {
    score += 20;
    findings.push('Has focus styles (keyboard accessibility)');
  } else if (hasInteractive) {
    failures.push('No :focus styles — keyboard users cannot navigate');
  } else {
    // No interactive elements — focus styles not required
    score += 10;
    findings.push('No interactive elements — focus styles not required');
  }

  // ARIA attributes
  if (html.includes('aria-') || html.includes('role=')) {
    score += 15;
    findings.push('Includes ARIA attributes (screen reader support)');
  } else {
    failures.push('No ARIA attributes — screen reader users get no context');
  }

  // Sufficient font-size (no smaller than 14px)
  if (css.match(/font-size:\s*(1[4-9]|[2-9]\d)px/) || css.match(/font-size:\s*clamp\(/)) {
    score += 15;
    findings.push('Body font-size >= 14px (WCAG readable)');
  } else {
    failures.push('Body font-size < 14px — fails WCAG readability');
  }

  // Sufficient line-height
  if (css.match(/line-height:\s*(1\.[5-9]|[2-9])/)) {
    score += 15;
    findings.push('Body line-height >= 1.5 (WCAG readable)');
  } else if (css.match(/line-height:\s*1\.[2-4]/)) {
    score += 8;
    findings.push('Heading line-height — verify body uses 1.5+');
  }

  // Color contrast (basic check — would need real parser for full WCAG)
  // Just check that contrast ratio consideration exists
  if (css.match(/contrast/i) || (css.match(/color:\s*#fff/i) && css.match(/background[^:]*:\s*#0/i))) {
    score += 10;
    findings.push('High-contrast color pairing');
  }

  score = Math.max(0, Math.min(100, score));
  return {
    name: 'accessibility',
    score,
    maxScore: 100,
    passed: score >= 50,
    findings,
    failures,
  };
}

/** Pass 5: AI brand-consistency review using Z.AI + design principles */
async function reviewBrandConsistency(
  css: string,
  html: string,
  patternType: string,
  principles: DesignPrinciple[]
): Promise<ReviewPass> {
  const findings: string[] = [];
  const failures: string[] = [];
  let score = 50; // Start neutral; AI adjusts

  if (principles.length === 0) {
    return {
      name: 'brand-consistency',
      score: 50,
      maxScore: 100,
      passed: true,
      findings: ['No design principles loaded — skipping brand review'],
      failures: [],
    };
  }

  // Build context for AI
  const principleSummaries = principles.map(p =>
    `${p.brand} (${p.category}): ${p.description.slice(0, 200)}${p.extractedPrinciples.length > 0 ? ` [${p.extractedPrinciples.join(', ')}]` : ''}`
  ).join('\n');

  const prompt = `You are a STRICT senior design reviewer evaluating a ${patternType} pattern against real-world brand design principles.

DESIGN PRINCIPLES (from real brands):
${principleSummaries}

PATTERN TO REVIEW:
CSS (first 800 chars): ${css.slice(0, 800)}
HTML (first 400 chars): ${html.slice(0, 400)}

Rate this pattern on a scale of 0-100 for brand-consistency. Be STRICT — most patterns should score 40-70. Only score 80+ if it clearly matches high-end brand aesthetics (Stripe, Apple, Linear, Figma, Vercel, Notion level).

Return your response in this exact format:
SCORE: <number 0-100>
GOOD: <one sentence on what works>
BAD: <one sentence on what doesn't match brand standards>
IMPROVE: <one specific actionable recommendation>`;

  try {
    const response = await zaiChat({
      model: ZAI_MODELS.GLM_4_PLUS,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      maxTokens: 300,
    });

    const text = response.choices?.[0]?.message?.content || '';
    const scoreMatch = text.match(/SCORE:\s*(\d+)/i);
    const goodMatch = text.match(/GOOD:\s*([^\n]+)/i);
    const badMatch = text.match(/BAD:\s*([^\n]+)/i);
    const improveMatch = text.match(/IMPROVE:\s*([^\n]+)/i);

    if (scoreMatch) {
      score = Math.max(0, Math.min(100, parseInt(scoreMatch[1], 10)));
    }
    if (goodMatch) findings.push(goodMatch[1].trim());
    if (badMatch) failures.push(badMatch[1].trim());
    if (improveMatch) findings.push(`Recommendation: ${improveMatch[1].trim()}`);

    findings.push(`AI-reviewed against ${principles.length} brand principles (e.g. ${principles.slice(0, 2).map(p => p.brand).join(', ')})`);
  } catch (e) {
    // Fallback: simple heuristic based on principle matching
    failures.push('AI review unavailable — using heuristic only');
    let matches = 0;
    for (const p of principles) {
      for (const principle of p.extractedPrinciples) {
        if (principle.includes('rounded') && css.includes('border-radius')) matches++;
        if (principle.includes('pill') && css.match(/border-radius:\s*(999|9999|50%)/)) matches++;
        if (principle.includes('sans') && css.match(/font-family/i)) matches++;
        if (principle.includes('hover') && css.includes(':hover')) matches++;
        if (principle.includes('transition') && css.includes('transition')) matches++;
      }
    }
    score = Math.min(80, 40 + matches * 8);
    findings.push(`Heuristic match: ${matches} principle alignments`);
  }

  return {
    name: 'brand-consistency',
    score,
    maxScore: 100,
    passed: score >= 50,
    findings,
    failures,
  };
}

/** Pass 6: Originality review (vs existing patterns) */
function reviewOriginality(
  css: string,
  html: string,
  patternType: string,
  existing: { type: string; css: string }[]
): ReviewPass {
  const findings: string[] = [];
  const failures: string[] = [];
  let score = 90; // Start high, deduct for similarity

  if (existing.length === 0) {
    return {
      name: 'originality',
      score: 95,
      maxScore: 100,
      passed: true,
      findings: ['First pattern of its kind — full originality'],
      failures: [],
    };
  }

  // Compare against each existing pattern of the same type
  const sameType = existing.filter(e => e.type === patternType);
  if (sameType.length === 0) {
    findings.push(`First ${patternType} pattern — novel`);
    return { name: 'originality', score: 92, maxScore: 100, passed: true, findings, failures };
  }

  const sig = css.slice(0, 300).replace(/[^a-z]/g, '');
  let maxSimilarity = 0;
  for (const e of sameType) {
    const eSig = e.css.slice(0, 300).replace(/[^a-z]/g, '');
    const setA = new Set(sig), setB = new Set(eSig);
    let common = 0;
    setA.forEach(c => { if (setB.has(c)) common++; });
    const similarity = common / Math.max(setA.size, setB.size);
    if (similarity > maxSimilarity) maxSimilarity = similarity;
  }

  // Deduct based on similarity
  if (maxSimilarity > 0.85) {
    score -= 50;
    failures.push(`Too similar to existing ${patternType} pattern (${Math.round(maxSimilarity * 100)}% match)`);
  } else if (maxSimilarity > 0.7) {
    score -= 30;
    failures.push(`Quite similar to existing pattern (${Math.round(maxSimilarity * 100)}% match)`);
  } else if (maxSimilarity > 0.5) {
    score -= 15;
    findings.push(`Moderately different from existing (${Math.round(maxSimilarity * 100)}% match)`);
  } else {
    findings.push(`Sufficiently original (${Math.round(maxSimilarity * 100)}% max similarity)`);
  }

  // Bonus for unique selectors
  const selectors = new Set(css.match(/\.[a-z_-]+/g) || []);
  if (selectors.size >= 3) {
    score += 5;
    findings.push(`${selectors.size} unique selectors — good specificity`);
  }

  score = Math.max(0, Math.min(100, score));
  return {
    name: 'originality',
    score,
    maxScore: 100,
    passed: score >= 50,
    findings,
    failures,
  };
}

/**
 * Run all review passes and return a comprehensive result.
 */
export async function reviewPattern(
  css: string,
  html: string,
  patternType: string,
  existing: { type: string; css: string }[]
): Promise<ReviewResult> {
  // Pick 5 most relevant design principles
  const principles = relevantPrinciples(patternType, 5);

  // Run synchronous passes in parallel where possible
  const typoPass = reviewTypography(css, html);
  const colorPass = reviewColor(css, html);
  const layoutPass = reviewLayout(css, html);
  const a11yPass = reviewAccessibility(css, html);
  const originalityPass = reviewOriginality(css, html, patternType, existing);
  const brandPass = await reviewBrandConsistency(css, html, patternType, principles);

  const passes: ReviewPass[] = [typoPass, colorPass, layoutPass, a11yPass, brandPass, originalityPass];

  // Weighted final score
  const weights: Record<string, number> = {
    typography: 0.20,
    color: 0.15,
    layout: 0.20,
    accessibility: 0.15,
    'brand-consistency': 0.20,
    originality: 0.10,
  };

  let finalScore = 0;
  let totalWeight = 0;
  for (const pass of passes) {
    const w = weights[pass.name] || 0;
    finalScore += pass.score * w;
    totalWeight += w;
  }
  finalScore = totalWeight > 0 ? Math.round(finalScore / totalWeight) : 0;

  // Hard-fail if any critical pass scores below 50
  let hardFailed = false;
  for (const passName of HARD_FAIL_PASSES) {
    const p = passes.find(p => p.name === passName);
    if (p && p.score < HARD_FAIL_THRESHOLD) {
      hardFailed = true;
      break;
    }
  }

  const passed = !hardFailed && finalScore >= ACCEPT_THRESHOLD;

  // Build summary
  const acceptedCount = passes.filter(p => p.passed).length;
  const summary = `${acceptedCount}/${passes.length} passes · ${passed ? 'ACCEPTED' : 'REJECTED'} · ${hardFailed ? 'hard-fail' : 'soft'}`;

  // Collect recommendations
  const recommendations: string[] = [];
  for (const pass of passes) {
    if (!pass.passed) {
      recommendations.push(`[${pass.name}] ${pass.failures[0] || 'Below threshold'}`);
    }
  }

  return {
    finalScore,
    passed,
    passes,
    summary,
    recommendations,
    inspirationSource: principles.length > 0
      ? `Reviewed against ${principles.length} design principles (${principles.slice(0, 2).map(p => p.brand).join(', ')}, ...)`
      : undefined,
  };
}

export const REVIEW_THRESHOLD = ACCEPT_THRESHOLD;
