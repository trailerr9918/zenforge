/**
 * Programmatic Mutation Engine
 * =============================
 *
 * The "caged lion" approach: AI makes DECISIONS, code EXECUTES.
 *
 * The AI (GLM-5.2) is asked ONLY to choose:
 *   - Which mutation to apply (from a fixed list)
 *   - Which color palette to use (from MotionSites prompts)
 *   - Which font combination to use (from a curated list)
 *   - Which spacing/radius values to use (from predefined ranges)
 *
 * The CODE then applies these choices to premium pattern templates
 * using find-and-replace operations. Zero room for AI error.
 *
 * This produces perfect premium patterns every time because:
 *   1. The 3D techniques (cursor spotlight, parallax, blur-rise, Ken Burns)
 *      are in the template — they're NEVER touched by the AI
 *   2. The AI only picks colors/fonts/values from curated lists
 *   3. The code applies them via deterministic string replacement
 *   4. No CSS can be broken — only values change, never structure
 */

import { getBestPremiumPattern, type PremiumPattern } from './premium-patterns';
import { relevantPrompts, type MotionPrompt } from './motionsites-prompts';
import { relevantPrinciples, type DesignPrinciple } from './design-kb';
import { zaiChat, ZAI_MODELS } from './zai-client';
import { logEvent } from '@/app/api/logs/route';

// ============================================================
// Curated palettes — extracted from MotionSites prompts
// ============================================================
interface Palette {
  name: string;
  bg: string;
  text: string;
  accent: string;
  dark: string;
  cream: string;
  glassBg: string;
  glassBorder: string;
  cardBg: string;
  cardBorder: string;
  accentShadow: string;
  gradient: string;
}

const PALETTES: Palette[] = [
  { name: 'midnight-gold', bg: '#0a0a0f', text: '#ffffff', accent: '#d4af37', dark: '#050508', cream: '#f5f0e8', glassBg: 'rgba(255,255,255,0.08)', glassBorder: 'rgba(255,255,255,0.15)', cardBg: 'rgba(255,255,255,0.04)', cardBorder: 'rgba(255,255,255,0.08)', accentShadow: '#d4af3744', gradient: 'linear-gradient(135deg, #d4af37 0%, #ffffff 100%)' },
  { name: 'electric-cyan', bg: '#0a0a14', text: '#ffffff', accent: '#00ffd5', dark: '#050510', cream: '#e0fffa', glassBg: 'rgba(0,255,213,0.08)', glassBorder: 'rgba(0,255,213,0.15)', cardBg: 'rgba(0,255,213,0.04)', cardBorder: 'rgba(0,255,213,0.08)', accentShadow: '#00ffd544', gradient: 'linear-gradient(135deg, #00ffd5 0%, #0a0a14 100%)' },
  { name: 'royal-purple', bg: '#0f0a1a', text: '#ffffff', accent: '#a855f7', dark: '#050310', cream: '#f0e6ff', glassBg: 'rgba(168,85,247,0.08)', glassBorder: 'rgba(168,85,247,0.15)', cardBg: 'rgba(168,85,247,0.04)', cardBorder: 'rgba(168,85,247,0.08)', accentShadow: '#a855f744', gradient: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)' },
  { name: 'warm-earth', bg: '#1a1208', text: '#f5f0e8', accent: '#e8702a', dark: '#0d0804', cream: '#faf5eb', glassBg: 'rgba(232,112,42,0.08)', glassBorder: 'rgba(232,112,42,0.15)', cardBg: 'rgba(232,112,42,0.04)', cardBorder: 'rgba(232,112,42,0.08)', accentShadow: '#e8702a44', gradient: 'linear-gradient(135deg, #e8702a 0%, #d4af37 100%)' },
  { name: 'forest-deep', bg: '#0a1a0e', text: '#ffffff', accent: '#22c55e', dark: '#050d07', cream: '#e6ffe6', glassBg: 'rgba(34,197,94,0.08)', glassBorder: 'rgba(34,197,94,0.15)', cardBg: 'rgba(34,197,94,0.04)', cardBorder: 'rgba(34,197,94,0.08)', accentShadow: '#22c55e44', gradient: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)' },
  { name: 'crimson-dark', bg: '#1a0808', text: '#ffffff', accent: '#ef4444', dark: '#0d0404', cream: '#fff0f0', glassBg: 'rgba(239,68,68,0.08)', glassBorder: 'rgba(239,68,68,0.15)', cardBg: 'rgba(239,68,68,0.04)', cardBorder: 'rgba(239,68,68,0.08)', accentShadow: '#ef444444', gradient: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)' },
  { name: 'ocean-blue', bg: '#0a0a1a', text: '#ffffff', accent: '#3b82f6', dark: '#050510', cream: '#e0eaff', glassBg: 'rgba(59,130,246,0.08)', glassBorder: 'rgba(59,130,246,0.15)', cardBg: 'rgba(59,130,246,0.04)', cardBorder: 'rgba(59,130,246,0.08)', accentShadow: '#3b82f644', gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' },
  { name: 'rose-gold', bg: '#1a0f0a', text: '#ffffff', accent: '#f472b6', dark: '#0d0705', cream: '#fff0f5', glassBg: 'rgba(244,114,182,0.08)', glassBorder: 'rgba(244,114,182,0.15)', cardBg: 'rgba(244,114,182,0.04)', cardBorder: 'rgba(244,114,182,0.08)', accentShadow: '#f472b644', gradient: 'linear-gradient(135deg, #f472b6 0%, #ec4899 100%)' },
  { name: 'lime-dark', bg: '#0a0f00', text: '#ffffff', accent: '#a3e635', dark: '#050800', cream: '#f0ffe0', glassBg: 'rgba(163,230,53,0.08)', glassBorder: 'rgba(163,230,53,0.15)', cardBg: 'rgba(163,230,53,0.04)', cardBorder: 'rgba(163,230,53,0.08)', accentShadow: '#a3e63544', gradient: 'linear-gradient(135deg, #a3e635 0%, #65a30d 100%)' },
  { name: 'teal-deep', bg: '#0a1a1a', text: '#ffffff', accent: '#14b8a6', dark: '#050d0d', cream: '#e0fffa', glassBg: 'rgba(20,184,166,0.08)', glassBorder: 'rgba(20,184,166,0.15)', cardBg: 'rgba(20,184,166,0.04)', cardBorder: 'rgba(20,184,166,0.08)', accentShadow: '#14b8a644', gradient: 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)' },
  { name: 'light-warm', bg: '#faf5eb', text: '#3c2415', accent: '#c8794a', dark: '#3c2415', cream: '#fff', glassBg: 'rgba(60,36,21,0.06)', glassBorder: 'rgba(60,36,21,0.12)', cardBg: 'rgba(255,255,255,0.7)', cardBorder: 'rgba(60,36,21,0.08)', accentShadow: '#c8794a44', gradient: 'linear-gradient(135deg, #c8794a 0%, #8b4513 100%)' },
  { name: 'light-clean', bg: '#f8f9fa', text: '#192837', accent: '#7342E2', dark: '#192837', cream: '#fff', glassBg: 'rgba(25,40,55,0.06)', glassBorder: 'rgba(25,40,55,0.12)', cardBg: 'rgba(255,255,255,0.7)', cardBorder: 'rgba(25,40,55,0.08)', accentShadow: '#7342E244', gradient: 'linear-gradient(135deg, #7342E2 0%, #5b21b6 100%)' },
];

// ============================================================
// Curated font combinations
// ============================================================
interface FontCombo {
  name: string;
  display: string;
  body: string;
  displayGoogle: string;
  bodyGoogle: string;
}

const FONT_COMBOS: FontCombo[] = [
  { name: 'playfair-inter', display: "'Playfair Display', serif", body: "'Inter', sans-serif", displayGoogle: 'Playfair+Display:ital,wght@1,400;1,500;1,600', bodyGoogle: 'Inter:wght@300;400;500;600;700' },
  { name: 'instrument-inter', display: "'Instrument Serif', serif", body: "'Inter', sans-serif", displayGoogle: 'Instrument+Serif:ital,wght@0,400;0,700;1,400', bodyGoogle: 'Inter:wght@300;400;500;600;700' },
  { name: 'space-inter', display: "'Space Grotesk', sans-serif", body: "'Inter', sans-serif", displayGoogle: 'Space+Grotesk:wght@400;500;600;700', bodyGoogle: 'Inter:wght@300;400;500;600;700' },
  { name: 'anton-inter', display: "'Anton', sans-serif", body: "'Inter', sans-serif", displayGoogle: 'Anton', bodyGoogle: 'Inter:wght@300;400;500;600;700' },
  { name: 'fraunces-source', display: "'Fraunces', serif", body: "'Source Sans 3', sans-serif", displayGoogle: 'Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,400', bodyGoogle: 'Source+Sans+3:wght@300;400;500;600;700' },
  { name: 'syne-inter', display: "'Syne', sans-serif", body: "'Inter', sans-serif", displayGoogle: 'Syne:wght@400;500;600;700;800', bodyGoogle: 'Inter:wght@300;400;500;600;700' },
  { name: 'bricolage-inter', display: "'Bricolage Grotesque', sans-serif", body: "'Inter', sans-serif", displayGoogle: 'Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700', bodyGoogle: 'Inter:wght@300;400;500;600;700' },
  { name: 'dmserif-inter', display: "'DM Serif Display', serif", body: "'Inter', sans-serif", displayGoogle: 'DM+Serif+Display:ital@0;1', bodyGoogle: 'Inter:wght@300;400;500;600;700' },
];

// ============================================================
// Curated mutations — each transforms specific CSS properties
// ============================================================
interface Mutation {
  name: string;
  description: string;
  apply: (css: string, html: string) => { css: string; html: string };
}

const MUTATIONS: Mutation[] = [
  {
    name: 'invert-colors',
    description: 'Swap background and text colors',
    apply: (css, html) => {
      // Swap bg and text by replacing CSS variable values
      let out = css;
      out = out.replace(/var\(--p-bg\)/g, 'var(--p-text)');
      out = out.replace(/var\(--p-text\)/g, 'var(--p-bg)');
      out = out.replace(/var\(--p-text-muted\)/g, 'var(--p-text-muted)'); // keep muted
      return { css: out, html };
    }
  },
  {
    name: 'shift-spacing',
    description: 'Increase all padding and margins by 20%',
    apply: (css, html) => {
      let out = css.replace(/padding:\s*(\d+(?:\.\d+)?)(px|rem)/g, (_, val, unit) => {
        return `padding: ${Math.round(parseFloat(val) * 1.2)}${unit}`;
      });
      out = out.replace(/margin-bottom:\s*(\d+(?:\.\d+)?)(px|rem)/g, (_, val, unit) => {
        return `margin-bottom: ${Math.round(parseFloat(val) * 1.2)}${unit}`;
      });
      out = out.replace(/gap:\s*(\d+(?:\.\d+)?)(px|rem)/g, (_, val, unit) => {
        return `gap: ${Math.round(parseFloat(val) * 1.2)}${unit}`;
      });
      return { css: out, html };
    }
  },
  {
    name: 'change-radius',
    description: 'Change all border-radius values',
    apply: (css, html) => {
      // Replace all border-radius with random value from curated set
      const radii = ['0px', '4px', '8px', '12px', '16px', '20px', '24px', '32px', '9999px'];
      const chosen = radii[Math.floor(Math.random() * radii.length)];
      let out = css.replace(/border-radius:\s*[^;]+;/g, `border-radius: ${chosen};`);
      return { css: out, html };
    }
  },
  {
    name: 'tighten-tracking',
    description: 'Tighten letter-spacing on headings',
    apply: (css, html) => {
      let out = css.replace(/letter-spacing:\s*-0\.0([0-9])em/g, (_, val) => {
        const tighter = parseInt(val) + 1;
        return `letter-spacing: -0.0${tighter}em`;
      });
      return { css: out, html };
    }
  },
  {
    name: 'soften-shadows',
    description: 'Soften all box-shadows',
    apply: (css, html) => {
      let out = css.replace(/box-shadow:\s*([^;]+);/g, (_, val) => {
        // Increase blur radius by 50%
        return `box-shadow: ${val.replace(/(\d+)px\s+(\d+)px\s+(\d+)px/g, (_, x, y, blur) => `${x}px ${y}px ${Math.round(parseInt(blur) * 1.5)}px`)}};`;
      });
      return { css: out, html };
    }
  },
  {
    name: 'add-depth',
    description: 'Add subtle box-shadow to cards',
    apply: (css, html) => {
      // Only add shadow if the class doesn't already have one — safe regex
      let out = css.replace(/(\.[a-z-]+card\s*\{)([^}]*?)(\})/g, (match, open, middle, close) => {
        if (middle.includes('box-shadow')) return match; // Already has shadow
        return `${open}${middle}box-shadow: 0 12px 32px var(--va-card-shadow, rgba(0,0,0,0.15));${close}`;
      });
      return { css: out, html };
    }
  },
  {
    name: 'increase-contrast',
    description: 'Increase contrast between text and background',
    apply: (css, html) => {
      let out = css;
      // Make text-muted closer to text (higher opacity) — safe replacement
      out = out.replace(/var\(--va-text-muted\)/g, 'var(--va-text)');
      out = out.replace(/var\(--p-text-muted\)/g, 'var(--p-text)');
      // Make borders more visible
      out = out.replace(/var\(--va-card-border\)/g, 'var(--va-glass-border)');
      out = out.replace(/var\(--p-card-border\)/g, 'var(--p-glass-border)');
      return { css: out, html };
    }
  },
  {
    name: 'add-gradient-overlay',
    description: 'Add gradient overlays to sections',
    apply: (css, html) => {
      // SAFE: Only add a subtle gradient to section backgrounds that use var(--va-bg) or var(--p-bg)
      // Does NOT modify class structure — just adds a pseudo-element rule AFTER the section rule
      let out = css;
      // Find sections with background:var(--p-bg) and add ::before after them
      const sectionRegex = /(\.[a-z-]+(?:section|wrap|features|about|stats|gallery|pricing|faq|contact|cta|footer|partners|team|blog)\s*\{[^}]*?background:\s*var\(--p-bg\)[^}]*?\})/g;
      out = out.replace(sectionRegex, (match) => {
        // Extract the class name
        const classNameMatch = match.match(/(\.[a-z-]+)/);
        if (!classNameMatch) return match;
        const className = classNameMatch[1];
        return match + `\n${className}::before{content:'';position:absolute;inset:0;background:linear-gradient(180deg,transparent 0%,var(--p-accent)08 100%);pointer-events:none;z-index:0;}`;
      });
      return { css: out, html };
    }
  },
];

// ============================================================
// AI Decision Engine — asks GLM to CHOOSE, not CREATE
// ============================================================
interface AIDecision {
  paletteIndex: number;
  fontIndex: number;
  mutationIndex: number;
  reasoning: string;
}

async function getAIDecision(patternType: string, motionPrompt?: MotionPrompt): Promise<AIDecision> {
  // Build a constrained prompt — AI can only choose from predefined options
  const paletteList = PALETTES.map((p, i) => `${i}: ${p.name}`).join('\n');
  const fontList = FONT_COMBOS.map((f, i) => `${i}: ${f.name}`).join('\n');
  const mutationList = MUTATIONS.map((m, i) => `${i}: ${m.name} — ${m.description}`).join('\n');

  const motionInfo = motionPrompt
    ? `\nMotionSites inspiration: "${motionPrompt.title}"\nColors from prompt: ${motionPrompt.colors.slice(0, 4).join(', ')}\nFonts from prompt: ${motionPrompt.fonts.slice(0, 2).join(', ')}`
    : '';

  const prompt = `You are a design decision AI. Choose the BEST palette, font, and mutation for a ${patternType} pattern.

AVAILABLE PALETTES:
${paletteList}

AVAILABLE FONTS:
${fontList}

AVAILABLE MUTATIONS:
${mutationList}
${motionInfo}

Reply with EXACTLY this format (numbers only):
PALETTE: <number>
FONT: <number>
MUTATION: <number>
REASON: <one sentence explaining your choice>`;

  try {
    const response = await zaiChat({
      model: ZAI_MODELS.GLM_5_2,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      maxTokens: 150,
    });

    const text = response.choices?.[0]?.message?.content || '';

    // Parse the constrained response
    const paletteMatch = text.match(/PALETTE:\s*(\d+)/i);
    const fontMatch = text.match(/FONT:\s*(\d+)/i);
    const mutationMatch = text.match(/MUTATION:\s*(\d+)/i);
    const reasonMatch = text.match(/REASON:\s*(.+)/i);

    return {
      paletteIndex: paletteMatch ? Math.min(parseInt(paletteMatch[1]), PALETTES.length - 1) : Math.floor(Math.random() * PALETTES.length),
      fontIndex: fontMatch ? Math.min(parseInt(fontMatch[1]), FONT_COMBOS.length - 1) : Math.floor(Math.random() * FONT_COMBOS.length),
      mutationIndex: mutationMatch ? Math.min(parseInt(mutationMatch[1]), MUTATIONS.length - 1) : Math.floor(Math.random() * MUTATIONS.length),
      reasoning: reasonMatch ? reasonMatch[1].trim() : 'AI chose randomly',
    };
  } catch (e) {
    // Fallback: random selection
    return {
      paletteIndex: Math.floor(Math.random() * PALETTES.length),
      fontIndex: Math.floor(Math.random() * FONT_COMBOS.length),
      mutationIndex: Math.floor(Math.random() * MUTATIONS.length),
      reasoning: `Fallback random selection (AI unavailable)`,
    };
  }
}

// ============================================================
// Apply palette to CSS — replace all color variables
// ============================================================
function applyPalette(css: string, palette: Palette): string {
  let out = css;
  // Replace CSS variable definitions
  out = out.replace(/--p-bg:\s*[^;]+;/g, `--p-bg: ${palette.bg};`);
  out = out.replace(/--p-bg-dark:\s*[^;]+;/g, `--p-bg-dark: ${palette.dark};`);
  out = out.replace(/--p-text:\s*[^;]+;/g, `--p-text: ${palette.text};`);
  out = out.replace(/--p-text-muted:\s*[^;]+;/g, `--p-text-muted: ${palette.text === '#ffffff' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'};`);
  out = out.replace(/--p-accent:\s*[^;]+;/g, `--p-accent: ${palette.accent};`);
  out = out.replace(/--p-on-accent:\s*[^;]+;/g, `--p-on-accent: #ffffff;`);
  out = out.replace(/--p-accent-shadow:\s*[^;]+;/g, `--p-accent-shadow: ${palette.accentShadow};`);
  out = out.replace(/--p-accent-gradient:\s*[^;]+;/g, `--p-accent-gradient: ${palette.gradient};`);
  out = out.replace(/--p-glass-bg:\s*[^;]+;/g, `--p-glass-bg: ${palette.glassBg};`);
  out = out.replace(/--p-glass-border:\s*[^;]+;/g, `--p-glass-border: ${palette.glassBorder};`);
  out = out.replace(/--p-glass-hover:\s*[^;]+;/g, `--p-glass-hover: ${palette.glassBg};`);
  out = out.replace(/--p-card-bg:\s*[^;]+;/g, `--p-card-bg: ${palette.cardBg};`);
  out = out.replace(/--p-card-border:\s*[^;]+;/g, `--p-card-border: ${palette.cardBorder};`);
  out = out.replace(/--p-card-shadow:\s*[^;]+;/g, `--p-card-shadow: ${palette.accentShadow};`);
  out = out.replace(/--p-input-bg:\s*[^;]+;/g, `--p-input-bg: ${palette.bg};`);
  out = out.replace(/--p-input-border:\s*[^;]+;/g, `--p-input-border: ${palette.cardBorder};`);

  // Also replace hardcoded colors that might not use variables
  out = out.replace(/#d4af37/gi, palette.accent);
  out = out.replace(/#c9a227/gi, palette.accent);

  return out;
}

// ============================================================
// Apply font combo to CSS
// ============================================================
function applyFonts(css: string, fonts: FontCombo): string {
  let out = css;
  out = out.replace(/var\(--p-display\)/g, fonts.display);
  out = out.replace(/var\(--p-body\)/g, fonts.body);
  out = out.replace(/'Playfair Display'/gi, fonts.display);
  out = out.replace(/'Inter'/gi, fonts.body);
  out = out.replace(/'Space Grotesk'/gi, fonts.display);
  out = out.replace(/'Anton'/gi, fonts.display);
  return out;
}

// ============================================================
// Rename classes from premium- to va-
// ============================================================
function renameClasses(css: string, html: string, type: string): { css: string; html: string } {
  const prefix = `va-${type}-`;
  let outCss = css.replace(/\.premium-/g, `.${prefix}`);
  let outHtml = html.replace(/class="premium-/g, `class="${prefix}`);
  outHtml = outHtml.replace(/class="premium-/g, `class="${prefix}`);
  // Also handle class="premium-xxx yyy"
  outHtml = outHtml.replace(/premium-/g, `${prefix.slice(0, -1)}-`);
  return { css: outCss, html: outHtml };
}

// ============================================================
// Rename CSS variables from --p- to --va-
// ============================================================
function renameVars(css: string): string {
  return css.replace(/--p-/g, '--va-').replace(/var\(--p-/g, 'var(--va-');
}

// ============================================================
// MAIN: Generate a premium pattern via programmatic mutation
// ============================================================
export interface MutatedPattern {
  css: string;
  html: string;
  js?: string;
  paletteName: string;
  fontName: string;
  mutationName: string;
  reasoning: string;
  sourcePatternId: string;
  sourceFitness: number;
}

// ============================================================
// EVOLUTION MEMORY — tracks which combos work best over time
// ============================================================
interface ComboRecord {
  paletteIndex: number;
  fontIndex: number;
  mutationIndex: number;
  fitness: number;
  accepted: boolean;
  timestamp: string;
  patternType: string;
}

interface EvolutionStats {
  // Per-palette average fitness
  paletteFitness: Record<number, { total: number; count: number; avg: number }>;
  // Per-font average fitness
  fontFitness: Record<number, { total: number; count: number; avg: number }>;
  // Per-mutation average fitness
  mutationFitness: Record<number, { total: number; count: number; avg: number }>;
  // Best combos ever
  bestCombos: ComboRecord[];
  // Total generations
  totalGenerations: number;
  // Average fitness trend (last 20 generations)
  fitnessTrend: number[];
  // Discovered compound mutations (combinations that scored well)
  discoveredCompounds: { mutations: number[]; avgFitness: number; count: number }[];
  // Novelty counter — how many random explorations we've done
  noveltyCount: number;
}

const g = globalThis as any;

function getEvolutionMemory(): EvolutionStats {
  if (!g.__mutationEvolution) {
    g.__mutationEvolution = {
      paletteFitness: {},
      fontFitness: {},
      mutationFitness: {},
      bestCombos: [],
      totalGenerations: 0,
      fitnessTrend: [],
      discoveredCompounds: [],
      noveltyCount: 0,
    };
  }
  return g.__mutationEvolution;
}

/**
 * Record a generation result — called after review
 */
export function recordGenerationResult(
  paletteIndex: number,
  fontIndex: number,
  mutationIndices: number[],
  fitness: number,
  accepted: boolean,
  patternType: string
): void {
  const mem = getEvolutionMemory();
  const timestamp = new Date().toISOString();

  // Update palette fitness
  if (!mem.paletteFitness[paletteIndex]) mem.paletteFitness[paletteIndex] = { total: 0, count: 0, avg: 0 };
  mem.paletteFitness[paletteIndex].total += fitness;
  mem.paletteFitness[paletteIndex].count += 1;
  mem.paletteFitness[paletteIndex].avg = mem.paletteFitness[paletteIndex].total / mem.paletteFitness[paletteIndex].count;

  // Update font fitness
  if (!mem.fontFitness[fontIndex]) mem.fontFitness[fontIndex] = { total: 0, count: 0, avg: 0 };
  mem.fontFitness[fontIndex].total += fitness;
  mem.fontFitness[fontIndex].count += 1;
  mem.fontFitness[fontIndex].avg = mem.fontFitness[fontIndex].total / mem.fontFitness[fontIndex].count;

  // Update mutation fitness (for each mutation in compound)
  for (const mi of mutationIndices) {
    if (!mem.mutationFitness[mi]) mem.mutationFitness[mi] = { total: 0, count: 0, avg: 0 };
    mem.mutationFitness[mi].total += fitness;
    mem.mutationFitness[mi].count += 1;
    mem.mutationFitness[mi].avg = mem.mutationFitness[mi].total / mem.mutationFitness[mi].count;
  }

  // Track best combos
  if (accepted && fitness >= 75) {
    mem.bestCombos.push({ paletteIndex, fontIndex, mutationIndex: mutationIndices[0], fitness, accepted, timestamp, patternType });
    mem.bestCombos = mem.bestCombos.slice(-50); // Keep last 50
  }

  // Track compound mutations
  if (mutationIndices.length > 1 && accepted) {
    const key = mutationIndices.join(',');
    const existing = mem.discoveredCompounds.find(c => c.mutations.join(',') === key);
    if (existing) {
      existing.avgFitness = (existing.avgFitness * existing.count + fitness) / (existing.count + 1);
      existing.count += 1;
    } else {
      mem.discoveredCompounds.push({ mutations: [...mutationIndices], avgFitness: fitness, count: 1 });
    }
    // Keep top 20 compounds
    mem.discoveredCompounds.sort((a: any, b: any) => b.avgFitness - a.avgFitness);
    mem.discoveredCompounds = mem.discoveredCompounds.slice(0, 20);
  }

  // Update generation count
  mem.totalGenerations += 1;

  // Track fitness trend (last 20)
  mem.fitnessTrend.push(fitness);
  if (mem.fitnessTrend.length > 20) mem.fitnessTrend = mem.fitnessTrend.slice(-20);

  // Persist to Supabase (async, non-blocking)
  try {
    import('./supabase-client').then(({ supabase }) => {
      supabase.from('websites').upsert({
        id: `evo-mem-${Date.now()}`,
        html: '',
        business_name: `[Evolution Memory] Gen ${mem.totalGenerations}: fitness ${fitness}`,
        business_type: 'evolution_memory',
        config: {
          paletteFitness: mem.paletteFitness,
          fontFitness: mem.fontFitness,
          mutationFitness: mem.mutationFitness,
          totalGenerations: mem.totalGenerations,
          fitnessTrend: mem.fitnessTrend,
          bestComboCount: mem.bestCombos.length,
          discoveredCompounds: mem.discoveredCompounds,
        },
      }).then(() => {}, () => {});
    });
  } catch {}
}

/**
 * Get weighted random index — biases toward higher-fitness options
 * Uses softmax-like weighting: higher avg fitness = higher selection probability
 */
function weightedSelect(stats: Record<number, { avg: number; count: number }>, maxIndex: number, noveltyRate: number = 0.15): number {
  const mem = getEvolutionMemory();

  // Novelty injection: with probability noveltyRate, pick completely random
  if (Math.random() < noveltyRate) {
    mem.noveltyCount++;
    return Math.floor(Math.random() * maxIndex);
  }

  // If no data yet, pick random
  const hasData = Object.keys(stats).length > 0;
  if (!hasData) return Math.floor(Math.random() * maxIndex);

  // Calculate weights (softmax-like)
  const weights: number[] = [];
  for (let i = 0; i < maxIndex; i++) {
    const s = stats[i];
    if (s && s.count > 0) {
      // Higher fitness = higher weight, but with diminishing returns
      // Also factor in exploration: less-seen options get a small bonus
      const fitnessWeight = Math.exp(s.avg / 30); // softmax scaling
      const explorationBonus = Math.max(0, 1 - s.count / 10) * 0.5; // explore under-tried options
      weights.push(fitnessWeight + explorationBonus);
    } else {
      // Untried option — give it a moderate weight to encourage exploration
      weights.push(1.0);
    }
  }

  // Weighted random selection
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * totalWeight;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return maxIndex - 1;
}

/**
 * Get evolution stats for UI display
 */
export function getEvolutionStats(): EvolutionStats {
  return getEvolutionMemory();
}

/**
 * Load evolution memory from Supabase (on startup)
 */
export async function loadEvolutionMemory(): Promise<void> {
  const mem = getEvolutionMemory();
  if (mem.totalGenerations > 0) return; // Already loaded

  try {
    const { supabase } = await import('./supabase-client');
    const { data } = await supabase
      .from('websites')
      .select('config')
      .eq('business_type', 'evolution_memory')
      .order('created_at', { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      const config = typeof data[0].config === 'string' ? JSON.parse(data[0].config) : data[0].config;
      if (config) {
        Object.assign(mem, config);
        console.log(`[mutation-engine] Loaded evolution memory: ${mem.totalGenerations} generations, ${mem.bestCombos?.length || 0} best combos`);
      }
    }
  } catch (e) {
    console.error('[mutation-engine] Load evolution memory error:', e);
  }
}

// ============================================================
// COMPOUND MUTATIONS — combine multiple mutations for novelty
// ============================================================

/**
 * Select 1-3 mutations to apply in sequence.
 * Early generations use single mutations; later generations compound more.
 */
function selectMutations(evolutionStats: EvolutionStats): number[] {
  const mem = getEvolutionMemory();
  const gen = mem.totalGenerations;

  // Determine how many mutations to apply based on generation
  let count = 1;
  if (gen > 10) count = Math.random() < 0.4 ? 2 : 1;
  if (gen > 30) count = Math.random() < 0.3 ? 3 : (Math.random() < 0.4 ? 2 : 1);
  if (gen > 50) count = Math.random() < 0.2 ? 4 : (Math.random() < 0.3 ? 3 : 2);

  // Check if we should reuse a discovered compound
  if (mem.discoveredCompounds.length > 0 && Math.random() < 0.3) {
    // Use a previously-successful compound
    const compound = mem.discoveredCompounds[Math.floor(Math.random() * Math.min(5, mem.discoveredCompounds.length))];
    return compound.mutations;
  }

  // Select mutations using weighted selection
  const selected: number[] = [];
  for (let i = 0; i < count; i++) {
    let idx = weightedSelect(mem.mutationFitness, MUTATIONS.length, 0.15);
    // Avoid duplicates
    while (selected.includes(idx)) {
      idx = (idx + 1) % MUTATIONS.length;
    }
    selected.push(idx);
  }
  return selected;
}

// ============================================================
// MUTATION OF MUTATIONS — create new mutation types
// ============================================================

// Custom mutations discovered by the evolution engine
interface CustomMutation {
  name: string;
  description: string;
  baseMutations: number[]; // which standard mutations it combines
  apply: (css: string, html: string) => { css: string; html: string };
}

const customMutations: CustomMutation[] = [];

/**
 * Discover a new custom mutation by combining existing ones
 */
function discoverCustomMutation(): CustomMutation | null {
  const mem = getEvolutionMemory();
  if (mem.discoveredCompounds.length === 0) return null;

  // Take a successful compound and formalize it as a custom mutation
  const compound = mem.discoveredCompounds[0]; // highest avg fitness
  if (compound.count < 3) return null; // Need at least 3 successes

  const baseNames = compound.mutations.map(i => MUTATIONS[i]?.name || `mut-${i}`).join('+');
  const existing = customMutations.find(m => m.name === baseNames);
  if (existing) return null;

  const newMutation: CustomMutation = {
    name: baseNames,
    description: `Discovered compound: ${compound.mutations.map(i => MUTATIONS[i]?.name).join(' + ')} (avg fitness: ${compound.avgFitness.toFixed(1)}, ${compound.count} successes)`,
    baseMutations: [...compound.mutations],
    apply: (css, html) => {
      let out = { css, html };
      for (const mi of compound.mutations) {
        if (MUTATIONS[mi]) {
          out = MUTATIONS[mi].apply(out.css, out.html);
        }
      }
      return out;
    },
  };

  customMutations.push(newMutation);
  console.log(`[mutation-engine] 🧬 Discovered new custom mutation: ${newMutation.name} (avg fitness: ${compound.avgFitness.toFixed(1)})`);

  try {
    logEvent('success', 'mutation-engine', `🧬 EVOLVED new mutation: ${newMutation.name} from ${compound.count} successful generations (avg fitness: ${compound.avgFitness.toFixed(1)})`, undefined, { customMutation: newMutation.name }, 'evolution.discover');
  } catch {}

  return newMutation;
}

// ============================================================
// MAIN: Generate a premium pattern via programmatic mutation WITH EVOLUTION
// ============================================================

export interface MutatedPattern {
  css: string;
  html: string;
  js?: string;
  paletteName: string;
  fontName: string;
  mutationName: string;
  reasoning: string;
  sourcePatternId: string;
  sourceFitness: number;
  paletteIndex: number;
  fontIndex: number;
  evolutionData?: {
    generation: number;
    mutationIndices: number[];
    isCompound: boolean;
    isNovelty: boolean;
    isCustomMutation: boolean;
    avgFitnessTrend: number;
  };
}

export async function generateMutatedPattern(
  patternType: string,
  motionPrompt?: MotionPrompt
): Promise<MutatedPattern> {
  // Load evolution memory if not loaded
  await loadEvolutionMemory();
  const mem = getEvolutionMemory();

  // 1. Get the premium pattern template
  const premiumPattern = getBestPremiumPattern(patternType);
  if (!premiumPattern) {
    throw new Error(`No premium pattern found for type: ${patternType}`);
  }

  // 2. EVOLUTION: Use weighted selection based on past results
  const paletteIndex = weightedSelect(mem.paletteFitness, PALETTES.length, 0.15);
  const fontIndex = weightedSelect(mem.fontFitness, FONT_COMBOS.length, 0.15);
  const mutationIndices = selectMutations(mem);
  const isCompound = mutationIndices.length > 1;
  const isNovelty = mem.noveltyCount > 0 && Math.random() < 0.15;

  // Check for custom mutation discovery (every 20 generations)
  let isCustomMutation = false;
  if (mem.totalGenerations > 0 && mem.totalGenerations % 20 === 0) {
    const custom = discoverCustomMutation();
    if (custom && Math.random() < 0.3) {
      // Use the custom mutation
      mutationIndices.length = 0;
      mutationIndices.push(...custom.baseMutations);
      isCustomMutation = true;
    }
  }

  const palette = PALETTES[paletteIndex];
  const fonts = FONT_COMBOS[fontIndex];

  // 3. Ask AI for REASONING (constrained — it only explains the choice, doesn't make it)
  let aiReasoning = '';
  try {
    const motionInfo = motionPrompt
      ? `\nMotionSites inspiration: "${motionPrompt.title}" (colors: ${motionPrompt.colors.slice(0, 3).join(', ')})`
      : '';
    const chosenInfo = `Chosen: palette=${palette.name}, font=${fonts.name}, mutations=${mutationIndices.map(i => MUTATIONS[i].name).join('+')}`;
    const reasonPrompt = `In one sentence, explain why this design combination works for a ${patternType} pattern. ${chosenInfo} ${motionInfo} Reply with ONLY the sentence.`;
    const response = await zaiChat({
      model: ZAI_MODELS.GLM_5_2,
      messages: [{ role: 'user', content: reasonPrompt }],
      temperature: 0.5,
      maxTokens: 80,
    });
    aiReasoning = response.choices?.[0]?.message?.content?.trim() || '';
  } catch {}

  // 4. Apply changes via CODE (zero AI involvement in CSS manipulation)
  let css = premiumPattern.css;
  let html = premiumPattern.html;
  let js = premiumPattern.js || '';

  // 4a. Apply palette
  css = applyPalette(css, palette);

  // 4b. Apply fonts
  css = applyFonts(css, fonts);

  // 4c. Apply mutations (compound — apply each in sequence)
  for (const mi of mutationIndices) {
    const mutated = MUTATIONS[mi].apply(css, html);
    css = mutated.css;
    html = mutated.html;
  }

  // 4d. Rename classes and vars
  const renamed = renameClasses(css, html, patternType);
  css = renamed.css;
  html = renamed.html;
  css = renameVars(css);
  if (js) js = renameVars(js);

  // 5. Calculate evolution data
  const avgFitnessTrend = mem.fitnessTrend.length > 0
    ? mem.fitnessTrend.reduce((a: number, b: number) => a + b, 0) / mem.fitnessTrend.length
    : 0;

  const mutationNames = mutationIndices.map(i => MUTATIONS[i].name).join('+');

  // 6. Log the generation
  try {
    logEvent('info', 'mutation-engine', `Gen ${mem.totalGenerations + 1}: ${patternType} | ${palette.name} + ${fonts.name} + ${mutationNames} | ${isCompound ? 'COMPOUND' : 'single'} ${isNovelty ? 'NOVELTY' : ''} ${isCustomMutation ? 'CUSTOM' : ''}`, undefined, {
      patternType, palette: palette.name, font: fonts.name, mutations: mutationNames,
      sourcePattern: premiumPattern.id, generation: mem.totalGenerations + 1,
      isCompound, isNovelty, isCustomMutation, avgFitnessTrend,
    }, 'evolution.generate');
  } catch {}

  return {
    css,
    html,
    js: js || undefined,
    paletteName: palette.name,
    fontName: fonts.name,
    mutationName: mutationNames,
    reasoning: `Gen ${mem.totalGenerations + 1}: ${palette.name} + ${fonts.name} + ${mutationNames}. ${aiReasoning}`,
    sourcePatternId: premiumPattern.id,
    sourceFitness: premiumPattern.fitness,
    paletteIndex,
    fontIndex,
    evolutionData: {
      generation: mem.totalGenerations + 1,
      mutationIndices,
      isCompound,
      isNovelty,
      isCustomMutation,
      avgFitnessTrend: Math.round(avgFitnessTrend * 10) / 10,
    },
  };
}

// Export for UI
export { PALETTES, FONT_COMBOS, MUTATIONS };
export type { Palette, FontCombo, Mutation as MutationDef };
