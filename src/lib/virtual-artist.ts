/**
 * Hyper Hive Mind Virtual Artist
 * ================================
 *
 * A 24/7 self-evolving AI artist that creates premium website patterns
 * (headers, CTAs, footers, menus, typography, spacing, etc.) by:
 *
 *   1. THINKING — Analyzes the MotionSites prompt database + 147 design MD
 *      files + existing patterns to decide what to create next
 *   2. ITERATING — Generates multiple variants with different mutations
 *   3. BUILDING — Creates actual CSS + HTML for each pattern
 *   4. REVIEWING — Runs each through the strict 6-pass review machine
 *   5. ADDING — Accepted patterns are added to the template engine library
 *   6. DELETING — Underperforming patterns (low fitness, high similarity)
 *      are pruned to keep the library fresh
 *   7. REPEATING — 24/7 mode runs continuously, even across refreshes
 *
 * Neural Score: Each cycle updates a "neural score" that tracks the artist's
 * improvement over time. The score is a weighted average of:
 *   - Average fitness of last 50 patterns
 *   - Diversity (unique pattern types created)
 *   - Innovation (patterns that scored 80+)
 *   - Learning rate (improvement vs. earlier patterns)
 *
 * The artist's "thinking" is logged in real-time so the UI can show
 * what it's currently working on.
 */

import { zaiChat, ZAI_MODELS } from './zai-client';
import { supabase } from './supabase-client';
import { sessionManager } from './session-manager';
import { reviewPattern, type ReviewResult } from './review-machine';
import { relevantPrinciples, type DesignPrinciple } from './design-kb';
import { relevantPrompts, type MotionPrompt } from './motionsites-prompts';
import { getBestPremiumPattern, type PremiumPattern } from './premium-patterns';
import { logEvent } from '@/app/api/logs/route';

// === Types ===

type PatternType =
  | 'hero' | 'features' | 'about' | 'gallery' | 'cta' | 'footer'
  | 'nav' | 'button' | 'testimonials' | 'pricing' | 'faq' | 'stats'
  | 'partners' | 'blog' | 'team' | 'contact' | 'menu' | 'portfolio'
  | 'typography' | 'spacing' | 'color-system';

type Phase = 'thinking' | 'iterating' | 'building' | 'reviewing' | 'adding' | 'deleting' | 'idle' | 'learning';

interface ArtistPattern {
  id: string;
  type: PatternType;
  name: string;
  css: string;
  html: string;
  js?: string;
  fitness: number;
  uniqueness: number;
  accessibility: number;
  brandConsistency: number;
  generation: number;
  inspiration?: string;        // Source prompt/brand that inspired it
  reasoning?: string;          // AI's reasoning for this pattern
  review?: ReviewResult;
  createdAt: string;
  accepted: boolean;
  neuralContribution?: number; // How much this pattern improved the neural score
}

interface ThoughtStream {
  id: string;
  timestamp: string;
  phase: Phase;
  message: string;
  details?: any;
}

interface NeuralScore {
  current: number;             // 0-100
  trend: 'up' | 'down' | 'stable';
  history: { timestamp: string; score: number }[];
  components: {
    averageFitness: number;
    diversity: number;         // 0-100, based on unique pattern types
    innovation: number;        // 0-100, based on 80+ patterns
    learningRate: number;      // 0-100, improvement vs earlier patterns
  };
}

interface ArtistStats {
  totalThoughts: number;
  totalPatterns: number;
  acceptedPatterns: number;
  rejectedPatterns: number;
  deletedPatterns: number;
  currentGeneration: number;
  neuralScore: NeuralScore;
  patternsByType: Record<string, number>;
  averageFitness: number;
  bestFitness: number;
  lastCycleAt: string;
  uptime: number;              // seconds since artist started
  startedAt: string;
}

// === Engine state (global, survives across requests within same instance) ===

const g = globalThis as any;

function getArtist(): any {
  if (!g.__virtualArtist) {
    g.__virtualArtist = {
      patterns: [] as ArtistPattern[],
      thoughts: [] as ThoughtStream[],
      stats: {
        totalThoughts: 0,
        totalPatterns: 0,
        acceptedPatterns: 0,
        rejectedPatterns: 0,
        deletedPatterns: 0,
        currentGeneration: 0,
        neuralScore: {
          current: 50,
          trend: 'stable',
          history: [],
          components: {
            averageFitness: 0,
            diversity: 0,
            innovation: 0,
            learningRate: 0,
          },
        },
        patternsByType: {} as Record<string, number>,
        averageFitness: 0,
        bestFitness: 0,
        lastCycleAt: new Date().toISOString(),
        uptime: 0,
        startedAt: new Date().toISOString(),
      },
      cycleInProgress: false,
      autoEvolve: false,
      autoEvolveInterval: null as any,
      lastAutoCycleAt: 0,
      loaded: false,
      currentPhase: 'idle' as Phase,
      startedAt: Date.now(),
    };
  }
  return g.__virtualArtist;
}

// === Thought stream (real-time logging + Supabase persistence) ===

function think(phase: Phase, message: string, details?: any): void {
  const artist = getArtist();
  const thought: ThoughtStream = {
    id: `thought-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    phase,
    message,
    details,
  };
  artist.thoughts.push(thought);
  if (artist.thoughts.length > 200) artist.thoughts = artist.thoughts.slice(-200);
  artist.stats.totalThoughts++;
  artist.currentPhase = phase;

  // Log to the main log system
  try {
    logEvent('info', 'virtual-artist', `[${phase}] ${message}`, undefined, details, `think.${phase}`);
  } catch {}

  // Persist to Supabase (async, non-blocking) — survives across refreshes
  try {
    supabase.from('websites').upsert({
      id: thought.id,
      html: '',
      business_name: `[${phase}] ${message}`.slice(0, 255),
      business_type: 'artist_thought',
      config: { thought, phase, timestamp: thought.timestamp },
    }).then(() => {}, () => {});
  } catch {}
}

// === Pattern generation ===

const PATTERN_TYPES: PatternType[] = [
  'hero', 'features', 'about', 'gallery', 'cta', 'footer',
  'nav', 'button', 'testimonials', 'pricing', 'faq', 'stats',
  'partners', 'blog', 'team', 'contact', 'menu', 'portfolio',
  'typography', 'spacing', 'color-system',
];

const MUTATIONS = [
  'flip-layout', 'invert-colors', 'shift-spacing', 'change-radius',
  'scale-typography', 'add-animation', 'simplify', 'add-depth',
  'restructure-grid', 'change-alignment', 'tighten-tracking',
  'soften-shadows', 'increase-contrast', 'add-layered-depth',
  'introduce-glassmorphism', 'add-gradient-overlay',
  'increase-whitespace', 'add-micro-interactions',
];

function randomMutation(): string {
  return MUTATIONS[Math.floor(Math.random() * MUTATIONS.length)];
}

function randomPatternType(): PatternType {
  // Weight towards common pattern types
  const weighted: PatternType[] = [
    'hero', 'hero', 'hero', 'hero',  // 4x weight
    'cta', 'cta', 'cta',              // 3x
    'features', 'features',           // 2x
    'footer', 'footer',
    'nav', 'nav',
    'testimonials', 'pricing', 'faq', 'stats',
    'about', 'gallery', 'contact',
    'button', 'menu', 'typography', 'spacing', 'color-system',
  ];
  return weighted[Math.floor(Math.random() * weighted.length)];
}

// === Procedural pattern generation (fallback when AI unavailable) ===

function proceduralPattern(type: PatternType, mutation: string, principles: DesignPrinciple[], motionPrompt?: MotionPrompt): { css: string; html: string; inspiration: string } {
  // Use a real brand palette from design MD if available
  let palette = { bg: '#0a0a0a', fg: '#ffffff', accent: '#3b82f6' };
  let inspiration = 'procedural';
  if (motionPrompt && motionPrompt.colors.length > 0) {
    palette.accent = motionPrompt.colors[0];
    if (motionPrompt.colors.length > 1) palette.bg = motionPrompt.colors[1];
    if (motionPrompt.colors.length > 2) palette.fg = motionPrompt.colors[2];
    inspiration = `motionsites:${motionPrompt.id}`;
  } else if (principles.length > 0) {
    const p = principles[Math.floor(Math.random() * principles.length)];
    if (p.colors.primary) palette.accent = p.colors.primary;
    if (p.colors.canvas) palette.bg = p.colors.canvas;
    if (p.colors.ink || p.colors['on-primary']) palette.fg = p.colors.ink || p.colors['on-primary'];
    inspiration = `brand:${p.brand}`;
  }

  const radius = Math.floor(Math.random() * 20) + 4;
  const padding = Math.floor(Math.random() * 40) + 60;

  return {
    css: `.va-${type}-wrap{padding:${padding}px 24px;background:${palette.bg};color:${palette.fg};max-width:1200px;margin:0 auto}.va-${type}-head{text-align:center;margin-bottom:48px}.va-${type}-head h2{font-size:clamp(28px,4vw,44px);font-weight:700;color:${palette.fg};letter-spacing:-0.02em;line-height:1.15}.va-${type}-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px}.va-${type}-card{background:${palette.fg}08;border:1px solid ${palette.fg}22;border-radius:${radius}px;padding:32px;transition:transform .3s}.va-${type}-card:hover{transform:translateY(-4px)}.va-${type}-card h3{font-size:20px;font-weight:600;margin-bottom:12px;color:${palette.accent};letter-spacing:-0.01em}.va-${type}-card p{font-size:15px;line-height:1.6;opacity:.8}@media(max-width:768px){.va-${type}-wrap{padding:48px 16px}}@media(prefers-reduced-motion:reduce){.va-${type}-card{transition:none}}`,
    html: `<section class="va-${type}-wrap v5-reveal" role="region" aria-label="${type}"><div class="va-${type}-head"><h2>${type.charAt(0).toUpperCase() + type.slice(1)}</h2></div><div class="va-${type}-grid"><div class="va-${type}-card"><h3>Feature One</h3><p>Description of the first feature and why it matters.</p></div><div class="va-${type}-card"><h3>Feature Two</h3><p>Description of the second feature with clear value.</p></div><div class="va-${type}-card"><h3>Feature Three</h3><p>Description of the third feature that sets you apart.</p></div></div></section>`,
    inspiration,
  };
}

// === AI-powered pattern generation ===

async function aiGeneratePattern(
  type: PatternType,
  mutation: string,
  principles: DesignPrinciple[],
  motionPrompt?: MotionPrompt
): Promise<{ css: string; html: string; js?: string; reasoning: string; inspiration: string }> {
  // === SUBPROCESS: Code Adaptation Mode ===
  // Instead of asking GLM-4-plus to CREATE 3D effects from scratch (which it can't do well),
  // we feed it ACTUAL working premium code and ask it to ADAPT it.
  // This produces quality patterns because the 3D techniques are already in the code.

  const premiumPattern = getBestPremiumPattern(type);

  // Debug: log whether premium pattern was found
  think('building', `Subprocess check: premiumPattern for ${type} = ${premiumPattern ? premiumPattern.id : 'NULL'}`, {
    hasPremium: !!premiumPattern,
    premiumId: premiumPattern?.id || 'none',
    premiumFitness: premiumPattern?.fitness || 0,
  });

  // Build the adaptation prompt
  const motionColors = motionPrompt?.colors?.slice(0, 4).join(', ') || '';
  const motionFonts = motionPrompt?.fonts?.slice(0, 2).join(', ') || '';
  const motionTitle = motionPrompt?.title || 'none';

  // If we have a premium pattern to adapt, use adaptation mode
  if (premiumPattern && premiumPattern.css && premiumPattern.html) {
    const adaptPrompt = `You are a code adaptation AI. I'm giving you WORKING premium CSS/HTML code that already has 3D interactive effects. Your job is to ADAPT it — keep the 3D techniques, change the visual style.

SECTION TYPE: ${type}
MUTATION TO APPLY: ${mutation}

INSPIRATION FROM MOTIONSITES PROMPT: "${motionTitle}"
- Colors to use: ${motionColors}
- Fonts to use: ${motionFonts}
- Techniques from prompt: ${motionPrompt?.extractedPrinciples?.join(', ') || 'none'}

HERE IS THE WORKING PREMIUM CODE TO ADAPT:

--- CSS ---
${premiumPattern.css.slice(0, 1500)}

--- HTML ---
${premiumPattern.html.slice(0, 800)}

${premiumPattern.js ? `--- JS ---\n${premiumPattern.js.slice(0, 800)}` : ''}

INSTRUCTIONS:
1. KEEP all 3D techniques from the premium code (cursor spotlight, parallax, blur-rise, Ken Burns, 3D tilt, glassmorphic, staggered animations, etc.)
2. CHANGE the colors to match the MotionSites inspiration: ${motionColors}
3. CHANGE the fonts to: ${motionFonts || 'keep original'}
4. APPLY the mutation: ${mutation} (e.g., "flip-layout" = mirror the layout, "shift-spacing" = increase spacing, "add-animation" = add more animations)
5. CHANGE the class names from "premium-" to "va-${type}-" so they don't conflict
6. KEEP the CSS variables system but rename from --p- to --va-
7. Keep all @keyframes, all JS interactivity, all hover effects
8. Make it look DIFFERENT from the original but equally premium

Output the ADAPTED code in this format:
CSS: <adapted css here>
HTML: <adapted html here>
JS: <adapted js here, or empty>`;

    try {
      const response = await zaiChat({
        model: ZAI_MODELS.GLM_5_2,
        messages: [{ role: 'user', content: adaptPrompt }],
        temperature: 0.75,
        maxTokens: 2500,
      });

      const text = response.choices?.[0]?.message?.content || '';
      const cssMatch = text.match(/CSS:\s*([\s\S]*?)(?:HTML:|$)/i);
      const htmlMatch = text.match(/HTML:\s*([\s\S]*?)(?:JS:|$)/i);
      const jsMatch = text.match(/JS:\s*([\s\S]*?)$/i);
      let css = cssMatch ? cssMatch[1].trim() : '';
      let html = htmlMatch ? htmlMatch[1].trim() : '';
      let js = jsMatch ? jsMatch[1].trim() : '';
      if (!css) { const cb = text.match(/```css\s*([\s\S]*?)```/); if (cb) css = cb[1].trim(); }
      if (!html) { const hb = text.match(/```html?\s*([\s\S]*?)```/); if (hb) html = hb[1].trim(); }

      const inspiration = motionPrompt
        ? `adapted:${premiumPattern.id} + motionsites:${motionPrompt.id}`
        : `adapted:${premiumPattern.id}`;
      const reasoning = `ADAPTED premium pattern "${premiumPattern.name}" (fitness ${premiumPattern.fitness}) with ${mutation} mutation, inspired by ${motionTitle}. Kept 3D techniques, changed colors to ${motionColors}.`;

      return { css, html, js: js || undefined, reasoning, inspiration };
    } catch (e: any) {
      console.error('[virtual-artist] Adaptation failed:', e?.message || e);
      think('idle', `⚠️ GLM-5.1 adaptation failed: ${e instanceof Error ? e.message : 'unknown error'}. Falling back to scratch generation.`, { error: e instanceof Error ? e.message : String(e) });
    }
  }

  // === FALLBACK: Generate from scratch (original approach) ===
  const principleContext = principles.slice(0, 4).map(p =>
    `${p.brand.toUpperCase()}: ${p.description.slice(0, 150)}`
  ).join('\n');

  const motionContext = motionPrompt
    ? `\nMotionSites prompt: ${motionPrompt.title}\nColors: ${motionColors}\nFonts: ${motionFonts}\nTechniques: ${motionPrompt.extractedPrinciples.join(', ')}\nExcerpt: ${motionPrompt.promptText.slice(0, 400)}...`
    : '';

  const prompt = `Create a premium ${type} section. ${motionContext}

Design principles: ${principleContext}

Requirements: Use CSS variables (--va-bg, --va-text, --va-accent), clamp() for responsive type, @media(max-width:768px), @media(prefers-reduced-motion), backdrop-filter for glassmorphic, @keyframes for animations, staggered animation-delays, real images from picsum.photos.

Format: CSS: <css> HTML: <html> JS: <js or empty>`;

  try {
    const response = await zaiChat({
      model: ZAI_MODELS.GLM_5_2,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.85,
      maxTokens: 2500,
    });

    const text = response.choices?.[0]?.message?.content || '';
    const cssMatch = text.match(/CSS:\s*([\s\S]*?)(?:HTML:|$)/i);
    const htmlMatch = text.match(/HTML:\s*([\s\S]*?)(?:JS:|$)/i);
    const jsMatch = text.match(/JS:\s*([\s\S]*?)$/i);
    let css = cssMatch ? cssMatch[1].trim() : '';
    let html = htmlMatch ? htmlMatch[1].trim() : '';
    let js = jsMatch ? jsMatch[1].trim() : '';

    const inspiration = motionPrompt
      ? `glm-4-plus + motionsites:${motionPrompt.id}`
      : `glm-4-plus + ${principles.length} brand principles`;
    const reasoning = `Generated ${type} with ${mutation} mutation, inspired by ${motionPrompt?.title || 'defaults'}.`;

    return { css, html, js: js || undefined, reasoning, inspiration };
  } catch (e) {
    const fallback = proceduralPattern(type, mutation, principles, motionPrompt);
    return { ...fallback, reasoning: `Procedural fallback: ${mutation} on ${type}.`, inspiration: fallback.inspiration };
  }
}

// === Neural score calculation ===

function updateNeuralScore(): void {
  const artist = getArtist();
  const patterns = artist.patterns;
  if (patterns.length === 0) {
    artist.stats.neuralScore.current = 50;
    return;
  }

  // Component 1: Average fitness of last 50 patterns
  const recent = patterns.slice(-50);
  const avgFitness = recent.reduce((s: number, p: ArtistPattern) => s + p.fitness, 0) / recent.length;

  // Component 2: Diversity (unique pattern types)
  const types = new Set(patterns.map((p: ArtistPattern) => p.type));
  const diversity = Math.min(100, (types.size / PATTERN_TYPES.length) * 100);

  // Component 3: Innovation (patterns scoring 80+)
  const innovative = patterns.filter((p: ArtistPattern) => p.fitness >= 80).length;
  const innovation = Math.min(100, (innovative / Math.max(patterns.length, 1)) * 200);

  // Component 4: Learning rate (improvement vs earlier patterns)
  const first10 = patterns.slice(0, 10);
  const last10 = patterns.slice(-10);
  const earlyAvg = first10.length > 0 ? first10.reduce((s: number, p: ArtistPattern) => s + p.fitness, 0) / first10.length : 50;
  const lateAvg = last10.length > 0 ? last10.reduce((s: number, p: ArtistPattern) => s + p.fitness, 0) / last10.length : 50;
  const learningRate = Math.max(0, Math.min(100, 50 + (lateAvg - earlyAvg) * 2));

  // Weighted neural score
  const score = Math.round(
    avgFitness * 0.35 +
    diversity * 0.20 +
    innovation * 0.25 +
    learningRate * 0.20
  );

  // Trend
  const prevScore = artist.stats.neuralScore.history.slice(-1)[0]?.score || score;
  const trend: 'up' | 'down' | 'stable' = score > prevScore + 2 ? 'up' : score < prevScore - 2 ? 'down' : 'stable';

  artist.stats.neuralScore = {
    current: Math.max(0, Math.min(100, score)),
    trend,
    history: [
      ...artist.stats.neuralScore.history.slice(-99),
      { timestamp: new Date().toISOString(), score },
    ],
    components: {
      averageFitness: Math.round(avgFitness),
      diversity: Math.round(diversity),
      innovation: Math.round(innovation),
      learningRate: Math.round(learningRate),
    },
  };
}

// === Pattern persistence (to Supabase) ===

async function persistPattern(pattern: ArtistPattern): Promise<void> {
  try {
    await supabase.from('websites').upsert({
      id: pattern.id,
      html: pattern.html,
      business_name: `VA: ${pattern.type} #${pattern.id.split('-').pop()}`,
      business_type: 'virtual_artist_pattern',
      config: { pattern, css: pattern.css, neuralScore: pattern.neuralContribution },
    });
  } catch (e) {
    console.error('[virtual-artist] Persist error:', e);
  }
}

async function deletePersistedPattern(patternId: string): Promise<void> {
  try {
    await supabase.from('websites').delete().eq('id', patternId);
  } catch (e) {
    console.error('[virtual-artist] Delete error:', e);
  }
}

// === Load persisted patterns on startup ===

export async function loadArtistState(): Promise<void> {
  const artist = getArtist();
  if (artist.loaded) return;
  artist.loaded = true;

  try {
    // Load patterns from Supabase
    const { data: patternData, error: patternError } = await supabase
      .from('websites')
      .select('*')
      .eq('business_type', 'virtual_artist_pattern')
      .order('created_at', { ascending: false })
      .limit(500);

    if (!patternError && patternData) {
      for (const row of patternData) {
        try {
          const config = typeof row.config === 'string' ? JSON.parse(row.config) : row.config;
          if (config && config.pattern) {
            artist.patterns.push(config.pattern as ArtistPattern);
            artist.stats.totalPatterns++;
            if (config.pattern.accepted) {
              artist.stats.acceptedPatterns++;
              artist.stats.patternsByType[config.pattern.type] = (artist.stats.patternsByType[config.pattern.type] || 0) + 1;
            } else {
              artist.stats.rejectedPatterns++;
            }
            if (config.pattern.fitness > artist.stats.bestFitness) {
              artist.stats.bestFitness = config.pattern.fitness;
            }
          }
        } catch {}
      }
      const accepted = artist.patterns.filter((p: ArtistPattern) => p.accepted);
      if (accepted.length > 0) {
        artist.stats.averageFitness = accepted.reduce((s: number, p: ArtistPattern) => s + p.fitness, 0) / accepted.length;
      }
      artist.stats.currentGeneration = Math.floor(artist.stats.totalPatterns / 10);
      updateNeuralScore();
      console.log(`[virtual-artist] Loaded ${artist.patterns.length} patterns from Supabase`);
    }

    // Load thoughts from Supabase — survives across refreshes
    const { data: thoughtData, error: thoughtError } = await supabase
      .from('websites')
      .select('*')
      .eq('business_type', 'artist_thought')
      .order('created_at', { ascending: false })
      .limit(100);

    if (!thoughtError && thoughtData && thoughtData.length > 0) {
      const loadedThoughts: ThoughtStream[] = [];
      for (const row of thoughtData) {
        try {
          const config = typeof row.config === 'string' ? JSON.parse(row.config) : row.config;
          if (config && config.thought) {
            loadedThoughts.push(config.thought as ThoughtStream);
          }
        } catch {}
      }
      // Sort oldest → newest, then merge with in-memory thoughts
      loadedThoughts.reverse();
      // Deduplicate: only add thoughts we don't already have
      const existingIds = new Set(artist.thoughts.map((t: ThoughtStream) => t.id));
      for (const t of loadedThoughts) {
        if (!existingIds.has(t.id)) {
          artist.thoughts.unshift(t);
        }
      }
      // Cap at 200
      if (artist.thoughts.length > 200) artist.thoughts = artist.thoughts.slice(-200);
      console.log(`[virtual-artist] Loaded ${loadedThoughts.length} thoughts from Supabase`);
    }
  } catch (e) {
    console.error('[virtual-artist] Load error:', e);
  }
}

// === Main cycle: THINK → ITERATE → BUILD → REVIEW → ADD/DELETE ===

export async function runArtistCycle(): Promise<ArtistPattern> {
  const artist = getArtist();
  if (artist.cycleInProgress) {
    think('idle', 'Cycle skipped — another cycle in progress');
    return artist.patterns[artist.patterns.length - 1];
  }
  artist.cycleInProgress = true;
  artist.stats.lastCycleAt = new Date().toISOString();

  try {
    // === PHASE 1: THINK ===
    think('thinking', 'Analyzing pattern library and inspiration sources...');

    const type = randomPatternType();
    const mutation = randomMutation();
    think('thinking', `Decided to create a ${type} pattern with ${mutation} mutation`, { type, mutation });

    // Pull inspiration: 4 design MD principles + 1 MotionSites prompt
    const principles = relevantPrinciples(type, 4);
    const motionPrompts = relevantPrompts(type, 1);
    const motionPrompt = motionPrompts[0];

    // Log WHAT it's reading — show actual content being studied
    think('thinking', `📖 READING ${principles.length} brand design principles:`, {
      reading: 'design-md',
      sources: principles.map(p => ({
        brand: p.brand,
        category: p.category,
        colors: Object.entries(p.colors).slice(0, 3).map(([k,v]) => `${k}=${v}`),
        principles: p.extractedPrinciples.slice(0, 3),
        excerpt: p.description.slice(0, 100),
      })),
    });

    if (motionPrompt) {
      think('thinking', `📖 READING MotionSites prompt: "${motionPrompt.title}"`, {
        reading: 'motionsites',
        title: motionPrompt.title,
        category: motionPrompt.category,
        colors: motionPrompt.colors.slice(0, 6),
        fonts: motionPrompt.fonts.slice(0, 3),
        techniques: motionPrompt.extractedPrinciples,
        excerpt: motionPrompt.promptText.slice(0, 200),
      });
    }

    think('thinking', `Inspiration sources loaded: ${principles.length} brand principles (${principles.slice(0, 2).map(p => p.brand).join(', ')})${motionPrompt ? `, MotionSites prompt: ${motionPrompt.title}` : ''}`, {
      principleCount: principles.length,
      motionPromptTitle: motionPrompt?.title,
      motionPromptId: motionPrompt?.id,
    });

    // === PHASE 2: ITERATE (generate via Programmatic Mutation Engine) ===
    think('iterating', `🔧 MUTATION ENGINE: AI choosing palette + font + mutation for ${type}...`, {
      mode: 'programmatic-mutation',
      sourcePattern: getBestPremiumPattern(type)?.id || 'none',
      motionInspiration: motionPrompt?.id || 'none',
      aiModel: 'glm-5.2',
      aiRole: 'decision-maker-only',
      codeExecution: 'programmatic',
    });

    // Import and use the mutation engine
    const { generateMutatedPattern } = await import('./mutation-engine');
    const mutated = await generateMutatedPattern(type, motionPrompt);

    think('building', `✅ Pattern mutated: palette=${mutated.paletteName}, font=${mutated.fontName}, mutation=${mutated.mutationName}`, {
      palette: mutated.paletteName,
      font: mutated.fontName,
      mutation: mutated.mutationName,
      aiReasoning: mutated.reasoning,
      sourcePattern: mutated.sourcePatternId,
      sourceFitness: mutated.sourceFitness,
      cssLength: mutated.css.length,
      hasJS: !!mutated.js,
    });

    var finalCss = mutated.css;
    var finalHtml = mutated.html;
    var finalJs = mutated.js;
    var finalInspiration = `mutated:${mutated.sourcePatternId} + ${mutated.paletteName}/${mutated.fontName}/${mutated.mutationName}${motionPrompt ? ` + motionsites:${motionPrompt.id}` : ''}`;
    var finalReasoning = mutated.reasoning;

    think('iterating', `Generated pattern: ${finalCss.length} chars CSS, ${finalHtml.length} chars HTML`);

    // === PHASE 3: BUILD (the pattern is built in phase 2) ===
    think('building', `Pattern built. Type: ${type}, palette: ${mutated.paletteName}, mutation: ${mutated.mutationName}`);

    // === PHASE 4: REVIEW ===
    think('reviewing', `Running strict 6-pass review machine...`);
    const review = await reviewPattern(finalCss, finalHtml, type, artist.patterns);

    think('reviewing', `Review complete: fitness ${review.finalScore} — ${review.summary}`, {
      score: review.finalScore,
      passes: review.passes.map(p => ({ name: p.name, score: p.score, passed: p.passed })),
    });

    const accepted = review.passed;

    // === EVOLUTION: Record this generation's result so the engine learns ===
    try {
      const { recordGenerationResult } = await import('./mutation-engine');
      if (mutated.evolutionData) {
        recordGenerationResult(
          mutated.paletteIndex,
          mutated.fontIndex,
          mutated.evolutionData.mutationIndices,
          review.finalScore,
          accepted,
          type
        );
        think('learning', `🧬 EVOLUTION: Recorded Gen ${mutated.evolutionData.generation} result (fitness ${review.finalScore}, ${accepted ? 'accepted' : 'rejected'}). Trend avg: ${mutated.evolutionData.avgFitnessTrend}`, {
          generation: mutated.evolutionData.generation,
          fitness: review.finalScore,
          accepted,
          isCompound: mutated.evolutionData.isCompound,
          isNovelty: mutated.evolutionData.isNovelty,
          isCustomMutation: mutated.evolutionData.isCustomMutation,
          avgFitnessTrend: mutated.evolutionData.avgFitnessTrend,
        });
      }
    } catch (e) {
      // Evolution recording failed — not critical
    }

    // === PHASE 5: ADD ===
    const pattern: ArtistPattern = {
      id: `va-${type}-${artist.stats.totalPatterns + 1}-${Date.now().toString(36)}`,
      type,
      name: `${type}-${mutation}-${Date.now().toString(36)}`,
      css: finalCss,
      html: finalHtml,
      js: finalJs || undefined,
      fitness: review.finalScore,
      uniqueness: review.passes.find(p => p.name === 'originality')?.score || 0,
      accessibility: review.passes.find(p => p.name === 'accessibility')?.score || 0,
      brandConsistency: review.passes.find(p => p.name === 'brand-consistency')?.score || 0,
      generation: artist.stats.currentGeneration,
      inspiration: finalInspiration,
      reasoning: finalReasoning,
      review,
      accepted,
      createdAt: new Date().toISOString(),
    };

    artist.patterns.push(pattern);
    artist.stats.totalPatterns++;
    if (accepted) {
      artist.stats.acceptedPatterns++;
      artist.stats.patternsByType[type] = (artist.stats.patternsByType[type] || 0) + 1;
      think('adding', `✓ Pattern ACCEPTED (fitness ${review.finalScore}). Adding to template engine library.`, { patternId: pattern.id });
      await persistPattern(pattern);
    } else {
      artist.stats.rejectedPatterns++;
      think('adding', `✗ Pattern REJECTED (fitness ${review.finalScore}). ${review.recommendations.slice(0, 2).join(' | ')}`, { patternId: pattern.id });
    }

    // Update averages
    const acceptedPatterns = artist.patterns.filter((p: ArtistPattern) => p.accepted);
    if (acceptedPatterns.length > 0) {
      artist.stats.averageFitness = acceptedPatterns.reduce((s: number, p: ArtistPattern) => s + p.fitness, 0) / acceptedPatterns.length;
      artist.stats.bestFitness = Math.max(...acceptedPatterns.map((p: ArtistPattern) => p.fitness));
    }

    // Every 10 patterns, advance generation
    if (artist.stats.totalPatterns % 10 === 0) {
      artist.stats.currentGeneration++;
      think('learning', `Advancing to generation ${artist.stats.currentGeneration}`);
    }

    // === PHASE 6: DELETE (prune underperforming patterns) ===
    // Every 20 patterns, prune the worst 2 if library is getting full
    if (artist.patterns.length > 50 && artist.stats.totalPatterns % 20 === 0) {
      think('deleting', 'Pruning underperforming patterns...');
      const acceptedPatterns = artist.patterns.filter((p: ArtistPattern) => p.accepted);
      // Sort by fitness ascending
      acceptedPatterns.sort((a: ArtistPattern, b: ArtistPattern) => a.fitness - b.fitness);
      const toDelete = acceptedPatterns.slice(0, 2);
      for (const p of toDelete) {
        // Remove from patterns array
        artist.patterns = artist.patterns.filter((x: ArtistPattern) => x.id !== p.id);
        artist.stats.deletedPatterns++;
        artist.stats.acceptedPatterns--;
        artist.stats.patternsByType[p.type] = Math.max(0, (artist.stats.patternsByType[p.type] || 0) - 1);
        await deletePersistedPattern(p.id);
        think('deleting', `Pruned pattern ${p.id} (fitness ${p.fitness}) — keeping library fresh`);
      }
    }

    // Update neural score
    updateNeuralScore();
    think('learning', `Neural score updated: ${artist.stats.neuralScore.current} (${artist.stats.neuralScore.trend})`, {
      components: artist.stats.neuralScore.components,
    });

    artist.lastAutoCycleAt = Date.now();
    return pattern;
  } catch (e) {
    think('idle', `Cycle error: ${e instanceof Error ? e.message : 'unknown'}`);
    throw e;
  } finally {
    artist.cycleInProgress = false;
  }
}

export async function runMultipleArtistCycles(count: number): Promise<ArtistPattern[]> {
  const results: ArtistPattern[] = [];
  for (let i = 0; i < count; i++) {
    try {
      results.push(await runArtistCycle());
      await new Promise(r => setTimeout(r, 200));
    } catch (e) {
      think('idle', `Cycle ${i + 1} failed: ${e}`);
    }
  }
  return results;
}

// === 24/7 auto-evolution ===

export async function startArtistAutoEvolve(intervalMs: number = 15000): Promise<void> {
  const artist = getArtist();
  if (artist.autoEvolve) return;
  artist.autoEvolve = true;
  artist.lastAutoCycleAt = Date.now();
  think('thinking', '24/7 auto-evolution STARTED — virtual artist is now alive');
  try { await sessionManager.setVAAutoEvolve(true); } catch {}

  if (artist.autoEvolveInterval) clearTimeout(artist.autoEvolveInterval);
  const run = async () => {
    if (!getArtist().autoEvolve) return;
    try { await runArtistCycle(); } catch {}
    if (getArtist().autoEvolve) {
      artist.autoEvolveInterval = setTimeout(run, intervalMs);
    }
  };
  run();
}

export async function stopArtistAutoEvolve(): Promise<void> {
  const artist = getArtist();
  artist.autoEvolve = false;
  if (artist.autoEvolveInterval) {
    clearTimeout(artist.autoEvolveInterval);
    artist.autoEvolveInterval = null;
  }
  think('idle', '24/7 auto-evolution STOPPED');
  try { await sessionManager.setVAAutoEvolve(false); } catch {}
}

/** Polling fallback for 24/7 mode on Vercel serverless */
export async function tickArtistAutoEvolve(): Promise<void> {
  const artist = getArtist();
  const persisted = await sessionManager.getVAAutoEvolve();
  if (!persisted) {
    if (artist.autoEvolve) artist.autoEvolve = false;
    return;
  }
  if (!artist.autoEvolve) artist.autoEvolve = true;
  if (artist.cycleInProgress) return;
  const interval = 15000;
  if (Date.now() - (artist.lastAutoCycleAt || 0) > interval) {
    try { await runArtistCycle(); } catch {}
  }
}

// === Getters ===

export function isArtistEvolving(): boolean {
  return getArtist().autoEvolve;
}

export function getArtistStats(): ArtistStats {
  const artist = getArtist();
  return {
    ...artist.stats,
    uptime: Math.floor((Date.now() - artist.startedAt) / 1000),
    neuralScore: artist.stats.neuralScore,
  };
}

export function getArtistThoughts(limit: number = 50): ThoughtStream[] {
  return getArtist().thoughts.slice(-limit).reverse();
}

export function getArtistPatterns(accepted: boolean = true, limit: number = 50): ArtistPattern[] {
  const artist = getArtist();
  return artist.patterns
    .filter((p: ArtistPattern) => p.accepted === accepted)
    .slice(-limit)
    .reverse();
}

export function getArtistCurrentPhase(): Phase {
  return getArtist().currentPhase;
}

export async function resetArtist(): Promise<void> {
  const artist = getArtist();
  await stopArtistAutoEvolve();
  try {
    await supabase.from('websites').delete().eq('business_type', 'virtual_artist_pattern');
  } catch {}
  artist.patterns = [];
  artist.thoughts = [];
  artist.stats = {
    totalThoughts: 0,
    totalPatterns: 0,
    acceptedPatterns: 0,
    rejectedPatterns: 0,
    deletedPatterns: 0,
    currentGeneration: 0,
    neuralScore: { current: 50, trend: 'stable', history: [], components: { averageFitness: 0, diversity: 0, innovation: 0, learningRate: 0 } },
    patternsByType: {},
    averageFitness: 0,
    bestFitness: 0,
    lastCycleAt: new Date().toISOString(),
    uptime: 0,
    startedAt: new Date().toISOString(),
  };
  artist.startedAt = Date.now();
  think('idle', 'Virtual artist reset complete');
}

export type { ArtistPattern, ThoughtStream, NeuralScore, ArtistStats, Phase, PatternType };
