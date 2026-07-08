/**
 * SEAE Engine v3 — Strict Self-Evolving Abstract Engine
 * ==========================================================
 *
 * Major upgrade from v2:
 *   1. Uses the new strict review machine (6-pass review against 147 design MD files)
 *   2. Each cycle pulls inspiration from real-world brand design principles
 *   3. AI is prompted with actual design MD corpus context (Stripe, Apple, Linear, etc.)
 *   4. 24/7 mode survives refreshes via Supabase persistence
 *   5. Each cycle logs detailed review breakdown to logs API
 */

import { zaiChat, ZAI_MODELS } from './zai-client';
import { supabase } from './supabase-client';
import { sessionManager } from './session-manager';
import { reviewPattern, REVIEW_THRESHOLD, type ReviewResult } from './review-machine';
import { relevantPrinciples, type DesignPrinciple } from './design-kb';

type PatternType =
  | 'hero' | 'features' | 'about' | 'gallery' | 'cta' | 'footer'
  | 'nav' | 'button' | 'testimonials' | 'pricing' | 'faq' | 'stats'
  | 'partners' | 'blog' | 'team' | 'contact';

interface EvolvedPattern {
  id: string;
  type: PatternType;
  name: string;
  css: string;
  html: string;
  fitness: number;
  uniqueness: number;
  accessibility: number;
  generation: number;
  inspiration?: string;
  reasoning?: string;
  review?: ReviewResult;  // Full review breakdown
  createdAt: string;
  accepted: boolean;
}

interface EvolutionStats {
  totalCycles: number;
  totalGenerated: number;
  totalAccepted: number;
  totalRejected: number;
  averageFitness: number;
  bestFitness: number;
  patternCounts: Record<string, number>;
  currentGeneration: number;
  isRunning: boolean;
  lastCycleAt: string;
  history: CycleResult[];
}

interface CycleResult {
  cycle: number;
  type: PatternType;
  name: string;
  fitness: number;
  accepted: boolean;
  inspiration?: string;
  reasoning?: string;
  reviewSummary?: string;
  recommendations?: string[];
  timestamp: string;
}

const g = globalThis as any;

function getEngine(): any {
  if (!g.__seae_v3) {
    g.__seae_v3 = {
      patterns: [] as EvolvedPattern[],
      stats: {
        totalCycles: 0, totalGenerated: 0, totalAccepted: 0, totalRejected: 0,
        averageFitness: 0, bestFitness: 0, patternCounts: {} as Record<string, number>,
        currentGeneration: 0, isRunning: false, lastCycleAt: new Date().toISOString(),
        history: [] as CycleResult[],
      },
      cycleInProgress: false,
      autoEvolve: false,
      autoEvolveInterval: null as any,
      loaded: false,
      // Track last cycle time so the polling fallback knows when to run
      lastAutoCycleAt: 0,
    };
    const types: PatternType[] = ['hero','features','about','gallery','cta','footer','nav','button','testimonials','pricing','faq','stats','partners','blog','team','contact'];
    types.forEach(t => { g.__seae_v3.stats.patternCounts[t] = 0; });
  }
  return g.__seae_v3;
}

// Load persisted patterns from Supabase
export async function loadPersistedPatterns(): Promise<void> {
  const engine = getEngine();
  if (engine.loaded) return;
  engine.loaded = true;

  try {
    const { data, error } = await supabase
      .from('websites')
      .select('*')
      .like('id', 'seae-%')
      .order('created_at', { ascending: false })
      .limit(500);

    if (!error && data) {
      for (const row of data) {
        try {
          const config = typeof row.config === 'string' ? JSON.parse(row.config) : row.config;
          if (config && config.pattern) {
            const p: EvolvedPattern = config.pattern;
            engine.patterns.push(p);
            engine.stats.totalCycles++;
            engine.stats.totalGenerated++;
            if (p.accepted) {
              engine.stats.totalAccepted++;
              engine.stats.patternCounts[p.type] = (engine.stats.patternCounts[p.type] || 0) + 1;
            } else {
              engine.stats.totalRejected++;
            }
            if (p.fitness > engine.stats.bestFitness) engine.stats.bestFitness = p.fitness;
          }
        } catch {}
      }
      const accepted = engine.patterns.filter((p: EvolvedPattern) => p.accepted);
      if (accepted.length > 0) {
        engine.stats.averageFitness = accepted.reduce((s: number, p: EvolvedPattern) => s + p.fitness, 0) / accepted.length;
      }
      engine.stats.currentGeneration = Math.floor(engine.stats.totalCycles / 10);
      console.log(`[seae-v3] Loaded ${engine.patterns.length} persisted patterns from Supabase`);
    }
  } catch (e) {
    console.error('[seae-v3] Load error:', e);
  }
}

// Persist a pattern to Supabase
async function persistPattern(pattern: EvolvedPattern): Promise<void> {
  try {
    await supabase.from('websites').upsert({
      id: pattern.id,
      html: pattern.html,
      business_name: `SEAE: ${pattern.type} #${pattern.id.split('-').pop()}`,
      business_type: 'evolved_pattern',
      config: { pattern, css: pattern.css },
    });
  } catch (e) {
    console.error('[seae-v3] Persist error:', e);
  }
}

const PATTERN_TYPES: PatternType[] = [
  'hero', 'features', 'about', 'gallery', 'cta', 'footer',
  'nav', 'button', 'testimonials', 'pricing', 'faq', 'stats',
];

const MUTATIONS = [
  'flip-layout', 'invert-colors', 'shift-spacing', 'change-radius',
  'scale-typography', 'add-animation', 'simplify', 'add-depth',
  'restructure-grid', 'change-alignment', 'tighten-tracking',
  'soften-shadows', 'increase-contrast', 'add-layered-depth',
];

function randomMutation(): string {
  return MUTATIONS[Math.floor(Math.random() * MUTATIONS.length)];
}

function generateProceduralPattern(type: PatternType, mutation: string, principles: DesignPrinciple[]): { css: string; html: string; inspiration: string } {
  // Use a real brand palette from design MD if available
  let palette = { bg: '#0a0a0a', fg: '#ffffff', accent: '#3b82f6' };
  let inspiration = 'procedural';
  if (principles.length > 0) {
    const p = principles[Math.floor(Math.random() * principles.length)];
    if (p.colors.primary) palette.accent = p.colors.primary;
    if (p.colors.canvas) palette.bg = p.colors.canvas;
    if (p.colors.ink || p.colors['on-primary']) palette.fg = p.colors.ink || p.colors['on-primary'];
    inspiration = `${p.brand}-inspired`;
  }

  const radius = Math.floor(Math.random() * 20) + 4;
  const padding = Math.floor(Math.random() * 40) + 60;
  return {
    css: `.seae-${type}-wrap{padding:${padding}px 24px;background:${palette.bg};color:${palette.fg};max-width:1200px;margin:0 auto}
.seae-${type}-head{text-align:center;margin-bottom:48px}
.seae-${type}-head h2{font-size:clamp(28px,4vw,44px);font-weight:700;color:${palette.fg};letter-spacing:-0.02em;line-height:1.15}
.seae-${type}-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px}
.seae-${type}-card{background:${palette.fg}08;border:1px solid ${palette.fg}22;border-radius:${radius}px;padding:32px;transition:transform .3s}
.seae-${type}-card:hover{transform:translateY(-4px)}
.seae-${type}-card h3{font-size:20px;font-weight:600;margin-bottom:12px;color:${palette.accent};letter-spacing:-0.01em}
.seae-${type}-card p{font-size:15px;line-height:1.6;opacity:.8}
@media(max-width:768px){.seae-${type}-wrap{padding:48px 16px}}
@media(prefers-reduced-motion:reduce){.seae-${type}-card{transition:none}}`,
    html: `<section class="seae-${type}-wrap v5-reveal" role="region" aria-label="${type}"><div class="seae-${type}-head"><h2>${type.charAt(0).toUpperCase() + type.slice(1)}</h2></div><div class="seae-${type}-grid"><div class="seae-${type}-card"><h3>Feature One</h3><p>Description of the first feature and why it matters.</p></div><div class="seae-${type}-card"><h3>Feature Two</h3><p>Description of the second feature with clear value.</p></div><div class="seae-${type}-card"><h3>Feature Three</h3><p>Description of the third feature that sets you apart.</p></div></div></section>`,
    inspiration,
  };
}

export async function runEvolutionCycle(): Promise<CycleResult> {
  const engine = getEngine();
  if (engine.cycleInProgress) {
    return { cycle: engine.stats.totalCycles, type: 'hero', name: 'Skipped (in progress)', fitness: 0, accepted: false, timestamp: new Date().toISOString() };
  }
  engine.cycleInProgress = true;
  engine.stats.isRunning = true;

  try {
    const type = PATTERN_TYPES[Math.floor(Math.random() * PATTERN_TYPES.length)];
    const mutation = randomMutation();
    // Pull 5 real-world brand design principles for this pattern type
    const principles = relevantPrinciples(type, 5);

    // Build AI prompt WITH design MD context
    const principleContext = principles.map(p =>
      `${p.brand.toUpperCase()} (${p.category}): ${p.description.slice(0, 250)}${p.extractedPrinciples.length > 0 ? ` [Patterns: ${p.extractedPrinciples.slice(0, 5).join(', ')}]` : ''}${Object.keys(p.colors).length > 0 ? ` [Colors: ${Object.entries(p.colors).slice(0, 4).map(([k,v]) => `${k}=${v}`).join(', ')}]` : ''}`
    ).join('\n\n');

    const prompt = `You are an ELITE web design AI. Generate a NEW ${type} section for a website.

DESIGN INSPIRATION (from real-world brand analyses):
${principleContext}

Apply this mutation: ${mutation}

Generate ONLY valid CSS and HTML. Requirements:
- Use class prefix "seae-${type}-"
- HTML should be a complete <section> element with class "v5-reveal" and an aria-label
- Use clamp() for responsive typography
- Use negative letter-spacing on headings (-0.02em)
- Use line-height: 1.1-1.5 for headings, 1.6 for body
- Include @media (max-width: 768px) for mobile
- Include @media (prefers-reduced-motion: reduce) for accessibility
- Use a refined palette (3-6 colors max) inspired by the brands above
- Include :hover states and transitions
- Use display:grid or display:flex
- Max-width: 1200px, centered with margin: 0 auto
- Include role and aria-label attributes for accessibility

Format your response EXACTLY as:
CSS: <css here>
HTML: <html here>

Take inspiration from the brand principles but DO NOT copy directly. Be original. Max 400 words of CSS.`;

    let generatedCss = '';
    let generatedHtml = '';
    let inspiration = 'procedural';
    let reasoning = '';

    try {
      const response = await zaiChat({
        model: ZAI_MODELS.GLM_5_2,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.85,
        maxTokens: 2000,
      });

      const responseText = response.choices?.[0]?.message?.content || '';

      const cssMatch = responseText.match(/CSS:\s*([\s\S]*?)(?:HTML:|$)/i);
      const htmlMatch = responseText.match(/HTML:\s*([\s\S]*?)$/i);
      if (cssMatch) generatedCss = cssMatch[1].trim();
      if (htmlMatch) generatedHtml = htmlMatch[1].trim();
      if (!generatedCss) {
        const cssBlock = responseText.match(/```css\s*([\s\S]*?)```/);
        if (cssBlock) generatedCss = cssBlock[1].trim();
      }
      if (!generatedHtml) {
        const htmlBlock = responseText.match(/```html?\s*([\s\S]*?)```/);
        if (htmlBlock) generatedHtml = htmlBlock[1].trim();
      }
      inspiration = `glm-4-plus + ${principles.length} brand principles`;
      reasoning = `Generated ${type} with ${mutation} mutation, inspired by ${principles.slice(0, 3).map(p => p.brand).join(', ')}.`;
    } catch (e) {
      const fallback = generateProceduralPattern(type, mutation, principles);
      generatedCss = fallback.css;
      generatedHtml = fallback.html;
      inspiration = fallback.inspiration;
      reasoning = `Procedural fallback (GLM unavailable): ${mutation} on ${type}, inspired by ${principles.length > 0 ? principles[0].brand : 'defaults'}.`;
    }

    if (!generatedCss || generatedCss.length < 50) {
      const fallback = generateProceduralPattern(type, mutation, principles);
      generatedCss = fallback.css;
      generatedHtml = fallback.html;
      inspiration = fallback.inspiration;
    }

    // === STRICT REVIEW MACHINE — 6-pass evaluation ===
    const review = await reviewPattern(generatedCss, generatedHtml, type, engine.patterns);

    const accepted = review.passed;

    // Log detailed review breakdown
    try {
      const { logEvent } = await import('@/app/api/logs/route');
      logEvent(
        accepted ? 'success' : 'warn',
        'evolution',
        `${accepted ? '✓' : '✗'} ${type} → fitness ${review.finalScore} ${accepted ? 'ACCEPTED' : 'REJECTED'} [${review.summary}] ← ${inspiration}`,
        undefined,
        { review: review.passes.map(p => ({ name: p.name, score: p.score, passed: p.passed, topFailure: p.failures[0] })) }
      );
      if (!accepted) {
        logEvent('warn', 'evolution', `REJECT REASONS: ${review.recommendations.join(' | ')}`);
      }
    } catch {}

    const pattern: EvolvedPattern = {
      id: `seae-${type}-${engine.stats.totalCycles + 1}-${Date.now().toString(36)}`,
      type, name: `${type}-${mutation}-${Date.now().toString(36)}`,
      css: generatedCss, html: generatedHtml,
      fitness: review.finalScore,
      uniqueness: review.passes.find(p => p.name === 'originality')?.score || 0,
      accessibility: review.passes.find(p => p.name === 'accessibility')?.score || 0,
      generation: engine.stats.currentGeneration,
      inspiration, reasoning,
      review,  // Store full review breakdown
      accepted,
      createdAt: new Date().toISOString(),
    };

    engine.patterns.push(pattern);
    engine.stats.totalCycles++;
    engine.stats.totalGenerated++;
    if (accepted) {
      engine.stats.totalAccepted++;
      engine.stats.patternCounts[type] = (engine.stats.patternCounts[type] || 0) + 1;
      await persistPattern(pattern);
    } else {
      engine.stats.totalRejected++;
    }
    const acceptedPatterns = engine.patterns.filter((p: EvolvedPattern) => p.accepted);
    if (acceptedPatterns.length > 0) {
      engine.stats.averageFitness = acceptedPatterns.reduce((s: number, p: EvolvedPattern) => s + p.fitness, 0) / acceptedPatterns.length;
      engine.stats.bestFitness = Math.max(...acceptedPatterns.map((p: EvolvedPattern) => p.fitness));
    }
    engine.stats.lastCycleAt = new Date().toISOString();
    engine.lastAutoCycleAt = Date.now();
    if (engine.stats.totalCycles % 10 === 0) engine.stats.currentGeneration++;

    const result: CycleResult = {
      cycle: engine.stats.totalCycles, type, name: pattern.name,
      fitness: review.finalScore, accepted, inspiration, reasoning,
      reviewSummary: review.summary,
      recommendations: review.recommendations,
      timestamp: new Date().toISOString(),
    };
    engine.stats.history.push(result);
    if (engine.stats.history.length > 100) engine.stats.history = engine.stats.history.slice(-100);

    return result;
  } finally {
    engine.cycleInProgress = false;
    engine.stats.isRunning = false;
  }
}

export async function runMultipleCycles(count: number): Promise<CycleResult[]> {
  const results: CycleResult[] = [];
  for (let i = 0; i < count; i++) {
    results.push(await runEvolutionCycle());
    await new Promise(r => setTimeout(r, 100));
  }
  return results;
}

/**
 * 24/7 auto-evolution — persists flag to Supabase.
 * On Vercel serverless, the in-memory timer doesn't survive between requests,
 * so we rely on a polling fallback: each /api/seae/status call checks if
 * autoEvolve is on AND it's been > 10s since the last cycle, then runs one.
 */
export async function startAutoEvolve(intervalMs: number = 10000): Promise<void> {
  const engine = getEngine();
  engine.autoEvolve = true;
  engine.lastAutoCycleAt = Date.now();
  try { await sessionManager.setEvoAutoEvolve(true); } catch {}

  // Try to start in-memory timer (works on sandbox, not Vercel serverless)
  if (engine.autoEvolveInterval) clearTimeout(engine.autoEvolveInterval);
  const run = async () => {
    if (!getEngine().autoEvolve) return;
    try { await runEvolutionCycle(); } catch {}
    if (getEngine().autoEvolve) {
      engine.autoEvolveInterval = setTimeout(run, intervalMs);
    }
  };
  run();
}

export async function stopAutoEvolve(): Promise<void> {
  const engine = getEngine();
  engine.autoEvolve = false;
  if (engine.autoEvolveInterval) {
    clearTimeout(engine.autoEvolveInterval);
    engine.autoEvolveInterval = null;
  }
  try { await sessionManager.setEvoAutoEvolve(false); } catch {}
}

/**
 * Polling fallback for 24/7 mode on Vercel serverless.
 * Called by /api/seae/status. If autoEvolve is on AND it's been > interval
 * since the last cycle, runs a single cycle. This ensures 24/7 mode keeps
 * evolving even when the in-memory timer has been killed.
 */
export async function tickAutoEvolve(): Promise<void> {
  const engine = getEngine();
  // Check Supabase for persisted autoEvolve state
  const persisted = await sessionManager.getEvoAutoEvolve();
  if (!persisted) {
    if (engine.autoEvolve) {
      engine.autoEvolve = false; // Sync local state
    }
    return;
  }
  // Persisted ON but local is OFF — start it
  if (!engine.autoEvolve) {
    engine.autoEvolve = true;
  }
  // If a cycle is in progress, skip
  if (engine.cycleInProgress) return;
  // If it's been > 10s since last cycle, run one
  const interval = 10000;
  if (Date.now() - (engine.lastAutoCycleAt || 0) > interval) {
    try { await runEvolutionCycle(); } catch {}
  }
}

export function isAutoEvolving(): boolean {
  return getEngine().autoEvolve;
}

export function getEvolutionStats(): EvolutionStats {
  return getEngine().stats;
}

export function getEvolvedPatterns(accepted = true, limit = 50): EvolvedPattern[] {
  const engine = getEngine();
  return engine.patterns.filter((p: EvolvedPattern) => p.accepted === accepted).slice(-limit).reverse();
}

export function getRecentHistory(limit = 20): CycleResult[] {
  return getEngine().stats.history.slice(-limit).reverse();
}

export async function resetEvolution(): Promise<void> {
  const engine = getEngine();
  await stopAutoEvolve();
  try {
    await supabase.from('websites').delete().like('id', 'seae-%');
  } catch {}
  engine.patterns = [];
  engine.stats.totalCycles = 0;
  engine.stats.totalGenerated = 0;
  engine.stats.totalAccepted = 0;
  engine.stats.totalRejected = 0;
  engine.stats.averageFitness = 0;
  engine.stats.bestFitness = 0;
  engine.stats.currentGeneration = 0;
  engine.stats.history = [];
  const types: PatternType[] = ['hero','features','about','gallery','cta','footer','nav','button','testimonials','pricing','faq','stats','partners','blog','team','contact'];
  types.forEach(t => { engine.stats.patternCounts[t] = 0; });
}

export type { EvolvedPattern, EvolutionStats, CycleResult, PatternType, ReviewResult };
