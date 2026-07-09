/**
 * Pattern Assembly Engine
 * ========================
 *
 * The "master chef" of ZenForge. Instead of generating raw HTML from scratch,
 * this engine intelligently selects, combines, and assembles premium parts
 * from the Pattern Explorer (premium-patterns library + VA-generated patterns).
 *
 * Flow:
 *   1. Analyze the user's business prompt
 *   2. Use Mistral Large for high-level reasoning: "What sections does this
 *      business need? What style? What order?"
 *   3. Query the pattern library for the best matching parts per section type
 *   4. Assemble the parts into a cohesive website with a global design system
 *   5. Apply 16 premium features automatically
 *   6. Return the final HTML
 *
 * Mistral is used for REASONING (what to pick, how to arrange), NOT for
 * writing raw HTML. The actual HTML comes from the pattern library.
 */

import {
  PREMIUM_PATTERNS,
  getBestPremiumPattern,
  getPremiumPatterns,
  buildFontsHref,
  type PremiumPattern,
} from './premium-patterns';
import { injectPremiumCSS } from './premium-css-foundation';
import { postProcessHTML } from './html-postprocessor';
import fs from 'fs';
import path from 'path';

/* ============================================================================
 * Types
 * ========================================================================== */

export interface AssemblyPlan {
  businessName: string;
  businessType: string;
  style: string;
  palette: { bg: string; text: string; accent: string; accent2: string };
  fonts: { display: string; body: string; googleHref: string };
  sections: AssemblySection[];
  reasoning: string;
}

export interface AssemblySection {
  type: string;           // 'hero', 'nav', 'features', etc.
  patternId: string;      // which premium pattern to use
  patternName: string;
  reason: string;         // why this pattern was selected
  order: number;          // position in the page
}

export interface AssemblyResult {
  html: string;
  plan: AssemblyPlan;
  patternsUsed: string[];
  reasoningTrace: string[];
}

/* ============================================================================
 * Style Presets
 * ========================================================================== */

export const STYLE_PRESETS: Record<string, {
  palette: { bg: string; text: string; accent: string; accent2: string };
  fonts: { display: string; body: string; googleHref: string };
  mood: string;
}> = {
  cinematic: {
    palette: { bg: '#0A0A0A', text: '#FFFFFF', accent: '#DCFF00', accent2: '#64CEFB' },
    fonts: { display: 'Instrument Serif', body: 'Inter', googleHref: 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;500;600;700&display=swap' },
    mood: 'dark, dramatic, cinematic',
  },
  editorial: {
    palette: { bg: '#FAFAF7', text: '#1A1A1A', accent: '#E63946', accent2: '#F4A261' },
    fonts: { display: 'Playfair Display', body: 'Source Sans 3', googleHref: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Source+Sans+3:wght@300;400;600;700&display=swap' },
    mood: 'light, editorial, magazine-like',
  },
  glassmorphic: {
    palette: { bg: '#0F0E17', text: '#FFFFFE', accent: '#A78BFA', accent2: '#EC4899' },
    fonts: { display: 'Bricolage Grotesque', body: 'Inter', googleHref: 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700&family=Inter:wght@300;400;500;600;700&display=swap' },
    mood: 'blur, transparency, gradient mesh',
  },
  minimal: {
    palette: { bg: '#FFFFFF', text: '#0A0A0A', accent: '#6366F1', accent2: '#8B5CF6' },
    fonts: { display: 'Space Grotesk', body: 'Inter', googleHref: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap' },
    mood: 'whitespace, subtle, clean',
  },
  warm: {
    palette: { bg: '#1A1208', text: '#F5F0E8', accent: '#E8702A', accent2: '#D4AF37' },
    fonts: { display: 'Fraunces', body: 'Source Sans 3', googleHref: 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,400&family=Source+Sans+3:wght@300;400;600;700&display=swap' },
    mood: 'earthy, organic, inviting',
  },
  brutalist: {
    palette: { bg: '#0A0A0A', text: '#FFFFFF', accent: '#FF00FF', accent2: '#00FFFF' },
    fonts: { display: 'Archivo Black', body: 'Space Mono', googleHref: 'https://fonts.googleapis.com/css2?family=Archivo+Black&family=Space+Mono:wght@400;700&display=swap' },
    mood: 'bold, raw, high contrast',
  },
};

/* ============================================================================
 * Business Type Detection
 * ========================================================================== */

export function detectBusinessType(prompt: string): string {
  const p = prompt.toLowerCase();
  if (p.match(/coffee|cafe|espresso|barista/)) return 'restaurant';
  if (p.match(/restaurant|dining|chef|menu|food/)) return 'restaurant';
  if (p.match(/tech|startup|saas|software|app|platform|ai|crypto/)) return 'tech';
  if (p.match(/gym|fitness|yoga|wellness/)) return 'fitness';
  if (p.match(/salon|spa|beauty|hair|cosmetic/)) return 'beauty';
  if (p.match(/hotel|resort|travel|tourism/)) return 'ecommerce';
  if (p.match(/agency|studio|creative|design|brand/)) return 'agency';
  if (p.match(/shop|store|ecommerce|retail|fashion/)) return 'ecommerce';
  if (p.match(/law|legal|attorney|lawfirm/)) return 'law';
  if (p.match(/dental|dentist|teeth/)) return 'dental';
  return 'default';
}

/* ============================================================================
 * Section Selection Logic
 *
 * Determines which section types a business needs, in what order.
 * ========================================================================== */

const SECTION_ORDER_DEFAULT = [
  'nav', 'hero', 'partners', 'features', 'about', 'stats',
  'testimonials', 'gallery', 'pricing', 'faq', 'cta', 'footer',
];

const SECTION_ORDER_RESTAURANT = [
  'nav', 'hero', 'about', 'gallery', 'features', 'testimonials', 'cta', 'footer',
];

const SECTION_ORDER_ECOMMERCE = [
  'nav', 'hero', 'features', 'gallery', 'testimonials', 'pricing', 'faq', 'cta', 'footer',
];

const SECTION_ORDER_TECH = [
  'nav', 'hero', 'partners', 'features', 'stats', 'testimonials', 'pricing', 'faq', 'cta', 'footer',
];

const SECTION_ORDER_AGENCY = [
  'nav', 'hero', 'features', 'gallery', 'testimonials', 'stats', 'cta', 'footer',
];

export function getSectionOrder(businessType: string): string[] {
  switch (businessType) {
    case 'restaurant': return SECTION_ORDER_RESTAURANT;
    case 'ecommerce': return SECTION_ORDER_ECOMMERCE;
    case 'tech': return SECTION_ORDER_TECH;
    case 'agency': return SECTION_ORDER_AGENCY;
    default: return SECTION_ORDER_DEFAULT;
  }
}

/* ============================================================================
 * Pattern Selection
 *
 * For each section type, pick the best available pattern.
 * Falls back to premium library if no VA patterns exist.
 * ========================================================================== */

export function loadVAPatterns(): PremiumPattern[] {
  try {
    const dir = '/home/z/my-project/download/va-patterns';
    if (!fs.existsSync(dir)) return [];
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
    return files.map(f => {
      const content = fs.readFileSync(path.join(dir, f), 'utf8');
      const partType = f.split('-')[0];
      return {
        id: `va-${f}`,
        type: partType,
        name: f,
        css: '',
        html: content,
        fitness: 80, // VA patterns have been reviewed, base fitness 80
        source: 'virtual-artist' as const,
        fonts: [],
        features: ['va-generated'],
      };
    });
  } catch {
    return [];
  }
}

export function selectBestPattern(
  sectionType: string,
  vaPatterns: PremiumPattern[],
  style: string,
): { pattern: PremiumPattern; reason: string } | null {
  // Try VA patterns first (they've been user-approved)
  const vaMatch = vaPatterns
    .filter(p => p.type === sectionType)
    .sort((a, b) => b.fitness - a.fitness)[0];
  if (vaMatch) {
    return {
      pattern: vaMatch,
      reason: `VA-approved ${sectionType} pattern (fitness ${vaMatch.fitness}) — user reviewed and promoted`,
    };
  }

  // Fall back to premium library
  const premiumMatch = getBestPremiumPattern(sectionType);
  if (premiumMatch) {
    return {
      pattern: premiumMatch,
      reason: `Premium library ${premiumMatch.name} (fitness ${premiumMatch.fitness}) — hand-crafted ${style} quality`,
    };
  }

  return null;
}

/* ============================================================================
 * HTML Assembly
 *
 * Combines selected patterns into a complete website with global design system.
 * ========================================================================== */

export function assembleHTML(
  plan: AssemblyPlan,
  selectedPatterns: Map<string, PremiumPattern>,
): string {
  const stylePreset = STYLE_PRESETS[plan.style] || STYLE_PRESETS.cinematic;
  const { palette, fonts } = stylePreset;

  // Build the global CSS with the selected palette
  const globalCSS = `
:root {
  --zf-bg: ${palette.bg};
  --zf-text: ${palette.text};
  --zf-accent: ${palette.accent};
  --zf-accent2: ${palette.accent2};
  --zf-muted: ${palette.text}99;
  --zf-card: ${palette.text}0d;
  --zf-border: ${palette.text}1a;
  --zf-radius: 16px;
  --zf-radius-sm: 8px;
  --zf-radius-lg: 24px;
  --zf-transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  --zf-shadow: 0 20px 40px rgba(0,0,0,0.3);
  --zf-font-display: '${fonts.display}', serif;
  --zf-font-body: '${fonts.body}', sans-serif;
  --zf-max-width: 1200px;
  --zf-section-padding: clamp(4rem, 10vw, 8rem);
}
* { margin: 0; padding: 0; box-sizing: border-box; }
html { scroll-behavior: smooth; -webkit-font-smoothing: antialiased; }
body { font-family: var(--zf-font-body); background: var(--zf-bg); color: var(--zf-text); overflow-x: hidden; line-height: 1.6; }
img, video { max-width: 100%; height: auto; }
a { color: inherit; text-decoration: none; transition: color var(--zf-transition); }
a:hover { color: var(--zf-accent); }
button { font-family: inherit; cursor: pointer; border: none; background: none; color: inherit; }
h1, h2, h3, h4 { font-family: var(--zf-font-display); font-weight: 400; line-height: 1.1; letter-spacing: -0.02em; }
h1 { font-size: clamp(2.5rem, 7vw, 5.5rem); }
h2 { font-size: clamp(2rem, 5vw, 3.5rem); }
h3 { font-size: clamp(1.2rem, 2vw, 1.5rem); font-family: var(--zf-font-body); font-weight: 600; }
p { font-size: clamp(0.95rem, 1.2vw, 1.1rem); color: var(--zf-muted); }
section { padding: var(--zf-section-padding) 1.5rem; max-width: var(--zf-max-width); margin: 0 auto; }
.reveal { opacity: 0; transform: translateY(40px); transition: opacity 0.8s ease, transform 0.8s ease; }
.reveal.visible { opacity: 1; transform: translateY(0); }
.delay-1 { transition-delay: 0.1s; } .delay-2 { transition-delay: 0.2s; }
.delay-3 { transition-delay: 0.3s; } .delay-4 { transition-delay: 0.4s; }
@media (max-width: 768px) { section { padding: 3rem 1rem; } }
`;

  // Assemble section HTML
  const sectionsHTML = plan.sections
    .sort((a, b) => a.order - b.order)
    .map(section => {
      const pattern = selectedPatterns.get(section.type);
      if (!pattern) return '';
      // Extract just the HTML body from the pattern (strip <style> and <script> for now)
      let html = pattern.html;
      // If the pattern has its own <style>, extract and inline it
      const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
      let patternCSS = '';
      if (styleMatch) {
        patternCSS = styleMatch[1];
        html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/i, '');
      }
      // If the pattern has its own <script>, keep it
      const scriptMatch = html.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
      let patternJS = '';
      if (scriptMatch) {
        patternJS = scriptMatch[0];
        html = html.replace(/<script[^>]*>[\s\S]*?<\/script>/i, '');
      }
      return `<!-- ${section.type}: ${pattern.name} — ${section.reason} -->\n<style>${patternCSS}</style>\n${html}\n${patternJS}`;
    })
    .join('\n\n');

  // Build the complete HTML document
  const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${plan.businessName}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${fonts.googleHref}" rel="stylesheet">
<style>
${globalCSS}
</style>
</head>
<body>
${sectionsHTML}
</body>
</html>`;

  // Apply the premium pipeline (injectPremiumCSS + postProcessHTML)
  // This guarantees 16/16 premium features
  return postProcessHTML(injectPremiumCSS(fullHTML));
}

/* ============================================================================
 * Full Assembly Pipeline
 *
 * Called by /api/assemble-website. Uses Mistral for reasoning, pattern
 * library for HTML.
 * ========================================================================== */

export async function assembleWebsite(
  prompt: string,
  opts: { model?: string; mistralKey: string; style?: string; fullCreative?: boolean },
): Promise<AssemblyResult> {
  const model = opts.model || 'mistral-large-latest';
  const mistralKey = opts.mistralKey;
  const businessType = detectBusinessType(prompt);
  const businessName = prompt.match(/(?:called|named)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/)?.[1] || 'Premium Brand';

  // Pick style — random if not specified
  const style = opts.style || ['cinematic', 'editorial', 'glassmorphic', 'minimal', 'warm'][Math.floor(Math.random() * 5)];
  const stylePreset = STYLE_PRESETS[style] || STYLE_PRESETS.cinematic;

  const reasoningTrace: string[] = [];

  // Step 1: Reason about what sections this business needs
  reasoningTrace.push(`Analyzing prompt: "${prompt.slice(0, 100)}..."`);
  reasoningTrace.push(`Detected business type: ${businessType}`);
  reasoningTrace.push(`Selected style: ${style} (${stylePreset.mood})`);

  let sectionOrder: string[];

  if (opts.fullCreative) {
    // Full creative mode — use Mistral to reason about sections
    reasoningTrace.push('Full Creative Mode — asking Mistral to plan sections...');

    const planPrompt = `You are a master web designer. A client wants a website for: "${prompt}"

Business type: ${businessType}
Style: ${style} (${stylePreset.mood})

Available section types: nav, hero, partners, features, about, stats, testimonials, gallery, pricing, faq, team, contact, cta, footer

Pick 6-10 sections that would make the BEST website for this business. Return ONLY a JSON array of section type strings in order, e.g. ["nav","hero","features","about","testimonials","cta","footer"]`;

    const planRes = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${mistralKey}` },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: planPrompt }],
        temperature: 0.3,
        max_tokens: 500,
        stream: false,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (planRes.ok) {
      const planData = await planRes.json();
      const content = planData?.choices?.[0]?.message?.content || '';
      const match = content.match(/\[[\s\S]*\]/);
      if (match) {
        try {
          sectionOrder = JSON.parse(match[0]);
          reasoningTrace.push(`Mistral planned ${sectionOrder.length} sections: ${sectionOrder.join(' → ')}`);
        } catch {
          sectionOrder = getSectionOrder(businessType);
        }
      } else {
        sectionOrder = getSectionOrder(businessType);
      }
    } else {
      sectionOrder = getSectionOrder(businessType);
    }
  } else {
    // Pattern assembly mode — use deterministic section order
    sectionOrder = getSectionOrder(businessType);
    reasoningTrace.push(`Pattern Assembly Mode — using ${businessType} section layout: ${sectionOrder.join(' → ')}`);
  }

  // Step 2: Load available patterns
  const vaPatterns = loadVAPatterns();
  reasoningTrace.push(`Loaded ${vaPatterns.length} VA patterns + ${PREMIUM_PATTERNS.length} premium patterns`);

  // Step 3: Select best pattern for each section
  const selectedPatterns = new Map<string, PremiumPattern>();
  const assemblySections: AssemblySection[] = [];
  const patternsUsed: string[] = [];

  sectionOrder.forEach((sectionType, index) => {
    const selection = selectBestPattern(sectionType, vaPatterns, style);
    if (selection) {
      selectedPatterns.set(sectionType, selection.pattern);
      assemblySections.push({
        type: sectionType,
        patternId: selection.pattern.id,
        patternName: selection.pattern.name,
        reason: selection.reason,
        order: index,
      });
      patternsUsed.push(selection.pattern.id);
      reasoningTrace.push(`✓ ${sectionType}: ${selection.pattern.name} — ${selection.reason}`);
    } else {
      reasoningTrace.push(`✗ ${sectionType}: no pattern available, skipping`);
    }
  });

  // Step 4: Build the assembly plan
  const plan: AssemblyPlan = {
    businessName,
    businessType,
    style,
    palette: stylePreset.palette,
    fonts: stylePreset.fonts,
    sections: assemblySections,
    reasoning: `Assembled ${assemblySections.length} sections from pattern library for ${businessName} (${businessType}, ${style} style)`,
  };

  // Step 5: Assemble the HTML
  reasoningTrace.push('Assembling HTML with global design system...');
  const html = assembleHTML(plan, selectedPatterns);
  reasoningTrace.push(`✓ Assembly complete: ${html.length} bytes, ${assemblySections.length} sections`);

  return {
    html,
    plan,
    patternsUsed,
    reasoningTrace,
  };
}
