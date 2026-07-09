/**
 * Subprocess Engine
 * =================
 *
 * Multi-agent system for ZenForge. Each subprocess is a specialized AI agent
 * with its own memory, task, status, and chat. Runs in parallel with proper
 * resource management.
 *
 * Agent Types:
 *   - Planner: Analyzes a task and creates a structured plan (JSON)
 *   - Designer: Generates HTML/CSS/JS for a specific part or section
 *   - Reviewer: Runs strict 30-point review + 16-feature check on output
 *   - Mutator: Takes existing output and applies mutations (color, layout, etc.)
 *   - Researcher: Searches the Cerebrium brain + MotionSites for inspiration
 *   - Custom: User-defined task with free-form prompt
 *
 * All agents use Mistral Large for reasoning. The engine manages lifecycle:
 *   create → run → chat → review → complete/kill
 *
 * Storage: In-memory (globalThis) + optional Supabase persistence.
 * Chat: Real-time via NDJSON streaming on /api/subprocess/chat.
 */

import { callLLM } from './llm-provider';
import fs from 'fs';
import path from 'path';

/* ============================================================================
 * Types
 * ========================================================================== */

export type SubprocessType = 'planner' | 'designer' | 'reviewer' | 'mutator' | 'researcher' | 'custom';

export type SubprocessStatus = 'idle' | 'thinking' | 'running' | 'reviewing' | 'done' | 'error' | 'killed';

export interface SubprocessChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface Subprocess {
  id: string;
  name: string;
  type: SubprocessType;
  status: SubprocessStatus;
  task: string;
  model: string;
  memory: string[];
  chat: SubprocessChatMessage[];
  output: string;
  outputType: string;
  reviewScore: number | null;
  reviewNotes: string[];
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  error: string | null;
  progress: number;
  positiveReviews: number;
  promoted: boolean;
}

export interface SubprocessCreateOptions {
  name?: string;
  type: SubprocessType;
  task: string;
  model?: string;
  parentId?: string;
}

/* ============================================================================
 * Store — In-memory cache + Supabase persistence
 *
 * Strategy:
 *   - In-memory cache for instant reads (survives within server instance)
 *   - Supabase for persistence (survives restarts + Vercel cold starts)
 *   - Every write goes to both cache + Supabase (fire-and-forget for Supabase)
 *   - On cold start, cache is empty — listSubprocesses loads from Supabase
 * ========================================================================== */

const MAX_CONCURRENT = 5;
let activeCount = 0;

const g = globalThis as any;

function getCache(): Record<string, Subprocess> {
  if (!g.__subprocesses) g.__subprocesses = {};
  return g.__subprocesses;
}

/** Persist a subprocess to Supabase (fire-and-forget, never blocks) */
async function persistToSupabase(sp: Subprocess): Promise<void> {
  try {
    const { supabase } = await import('./supabase-client');
    await supabase.from('websites').upsert({
      id: sp.id,
      html: sp.output || '',
      business_name: sp.name,
      business_type: `subprocess-${sp.type}`,
      config: {
        kind: 'subprocess',
        ...sp,
      },
    });
  } catch (e) {
    // Non-blocking — cache is the source of truth for active sessions
    console.warn('[subprocess] Supabase persist failed (non-fatal):', e);
  }
}

/** Load subprocesses from Supabase into cache (cold start recovery) */
async function loadFromSupabase(): Promise<void> {
  try {
    const { supabase } = await import('./supabase-client');
    const { data, error } = await supabase
      .from('websites')
      .select('*')
      .like('business_type', 'subprocess-%')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error || !data) return;
    const cache = getCache();
    for (const row of data) {
      const config = typeof row.config === 'string' ? JSON.parse(row.config) : row.config;
      if (config?.kind === 'subprocess' && config.id) {
        // Only load if not already in cache (cache wins for active sessions)
        if (!cache[config.id]) {
          cache[config.id] = config as Subprocess;
        }
      }
    }
  } catch (e) {
    console.warn('[subprocess] Supabase load failed (non-fatal):', e);
  }
}

/** Log to va-memory.md */
function logToMemory(action: string, sp: Subprocess): void {
  try {
    const dir = '/home/z/my-project/download';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const entry = `\n## ${new Date().toISOString()} — SUBPROCESS ${action.toUpperCase()}\n- **Agent**: ${sp.name} (${sp.type})\n- **Status**: ${sp.status}\n- **Task**: ${sp.task.slice(0, 100)}\n${sp.reviewScore !== null ? `- **Review Score**: ${sp.reviewScore}/30\n` : ''}${sp.error ? `- **Error**: ${sp.error}\n` : ''}\n`;
    fs.appendFileSync(`${dir}/va-memory.md`, entry, 'utf8');
  } catch {}
}

/** Promote a subprocess output to Pattern Explorer */
function promoteToPatternExplorer(sp: Subprocess): boolean {
  try {
    if (!sp.output || sp.output.length < 50) return false;
    const dir = '/home/z/my-project/download/va-patterns';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filename = `${sp.type}-${Date.now()}.html`;
    fs.writeFileSync(path.join(dir, filename), sp.output, 'utf8');
    return true;
  } catch (e) {
    console.error('[subprocess] promoteToPatternExplorer failed:', e);
    return false;
  }
}

/* ============================================================================
 * CRUD Operations
 * ========================================================================== */

export function createSubprocess(opts: SubprocessCreateOptions): Subprocess {
  const id = `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();
  const sp: Subprocess = {
    id,
    name: opts.name || `${opts.type}-${id.slice(-4)}`,
    type: opts.type,
    status: 'idle',
    task: opts.task,
    model: opts.model || 'mistral-large-latest',
    memory: [],
    chat: [],
    output: '',
    outputType: 'text',
    reviewScore: null,
    reviewNotes: [],
    parentId: opts.parentId || null,
    createdAt: now,
    updatedAt: now,
    error: null,
    progress: 0,
    positiveReviews: 0,
    promoted: false,
  };
  getCache()[id] = sp;
  persistToSupabase(sp); // fire-and-forget
  logToMemory('create', sp);
  return sp;
}

export function getSubprocess(id: string): Subprocess | null {
  return getCache()[id] || null;
}

export async function listSubprocessesAsync(): Promise<Subprocess[]> {
  const cache = getCache();
  let cached = Object.values(cache).sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  // If cache is empty, try loading from Supabase
  if (cached.length === 0) {
    await loadFromSupabase();
    cached = Object.values(getCache()).sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }
  return cached;
}

export function listSubprocesses(): Subprocess[] {
  return Object.values(getCache()).sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function killSubprocess(id: string): boolean {
  const sp = getCache()[id];
  if (!sp) return false;
  sp.status = 'killed';
  sp.updatedAt = new Date().toISOString();
  persistToSupabase(sp);
  logToMemory('kill', sp);
  return true;
}

export function deleteSubprocess(id: string): boolean {
  if (!getCache()[id]) return false;
  delete getCache()[id];
  return true;
}

function updateSubprocess(id: string, updates: Partial<Subprocess>): Subprocess | null {
  const sp = getCache()[id];
  if (!sp) return null;
  Object.assign(sp, updates, { updatedAt: new Date().toISOString() });
  persistToSupabase(sp); // fire-and-forget
  return sp;
}

export function addChatMessage(id: string, role: 'user' | 'assistant' | 'system', content: string): void {
  const sp = getCache()[id];
  if (!sp) return;
  sp.chat.push({ role, content, timestamp: new Date().toISOString() });
  sp.updatedAt = new Date().toISOString();
  persistToSupabase(sp);
}

/** Rate a subprocess with emoji — tracks positive reviews for promotion */
export function rateSubprocess(id: string, rating: 1 | 2 | 3 | 4 | 5, feedback?: string): Subprocess | null {
  const sp = getCache()[id];
  if (!sp) return null;

  if (rating >= 4) {
    sp.positiveReviews = (sp.positiveReviews || 0) + 1;
    // Auto-promote after 2 positive reviews
    if (sp.positiveReviews >= 2 && !sp.promoted) {
      const promoted = promoteToPatternExplorer(sp);
      if (promoted) {
        sp.promoted = true;
        logToMemory('promote', sp);
      }
    }
  } else if (rating <= 2) {
    // Save feedback for learning
    if (feedback) {
      sp.reviewNotes = [...(sp.reviewNotes || []), `User feedback: ${feedback}`];
    }
    logToMemory('trash', sp);
  } else {
    // Neutral — save feedback
    if (feedback) {
      sp.reviewNotes = [...(sp.reviewNotes || []), `User feedback: ${feedback}`];
    }
    logToMemory('iterate', sp);
  }

  sp.updatedAt = new Date().toISOString();
  persistToSupabase(sp);
  return sp;
}

/* ============================================================================
 * System Prompts per Agent Type
 * ========================================================================== */

const SYSTEM_PROMPTS: Record<SubprocessType, string> = {
  planner: `You are ZenForge's Planner agent. Given a task description, you create a structured plan for building a premium website part.

Output ONLY valid JSON:
{
  "sections": ["nav", "hero", "features", "cta", "footer"],
  "style": "cinematic|editorial|glassmorphic|minimal|warm",
  "palette": { "bg": "#hex", "text": "#hex", "accent": "#hex" },
  "fonts": { "display": "FontName", "body": "FontName" },
  "reasoning": "Why this plan works for the business"
}`,

  designer: `You are ZenForge's Designer agent. You generate premium HTML/CSS/JS for a specific website section.

REQUIREMENTS:
- Single self-contained HTML snippet (no <!DOCTYPE>, no <html>, no <head>)
- Start with <style> then the HTML then <script> if needed
- Use CSS custom properties, clamp() typography, glassmorphism where applicable
- Include scroll-reveal animations (.reveal class)
- Responsive @media (max-width: 768px)
- Real persuasive copy (no lorem ipsum)
- Under 8KB total

Output ONLY the HTML/CSS/JS. No explanations.`,

  reviewer: `You are ZenForge's Reviewer agent — a ruthless perfectionist. Review the provided HTML and score it 0-30.

Score each category 0-5:
1. hierarchy — visual hierarchy, spacing, whitespace
2. typography — clamp(), hierarchy, custom fonts
3. color — palette, contrast, glassmorphism
4. responsive — @media, mobile-first, accessibility
5. animation — scroll reveals, hover effects, transitions
6. premium — overall cohesion, originality, $50K feel

Return ONLY JSON:
{"score": N, "verdict": "PASS"|"REJECT", "issues": ["..."], "strengths": ["..."], "categoryScores": {}}`,

  mutator: `You are ZenForge's Mutator agent. Take the provided HTML and apply the specified mutation.

Mutations can be: invert-colors, shift-spacing, change-radius, tighten-tracking, soften-shadows, add-depth, increase-contrast, add-gradient-overlay.

Keep ALL existing features. Only change the specified aspect. Return ONLY the mutated HTML/CSS/JS.`,

  researcher: `You are ZenForge's Researcher agent. Search the design knowledge base and return relevant design principles.

Given a query, return structured findings:
- Brand references (Stripe, Apple, Linear, etc.)
- Color palette suggestions
- Typography pairings
- Layout patterns
- Animation techniques

Return as a structured summary (not JSON, just well-formatted text).`,

  custom: `You are ZenForge's Custom agent. Follow the user's instructions precisely. Use Mistral reasoning for high-quality output.`,
};

/* ============================================================================
 * Run Subprocess
 * ========================================================================== */

export async function runSubprocess(
  id: string,
  opts: { input?: string; onProgress?: (msg: string) => void } = {},
): Promise<Subprocess> {
  const sp = getSubprocess(id);
  if (!sp) throw new Error(`Subprocess ${id} not found`);
  if (sp.status === 'killed') throw new Error(`Subprocess ${id} was killed`);

  // Concurrency limit — max 5 simultaneous subprocesses
  if (activeCount >= MAX_CONCURRENT) {
    throw new Error(`Concurrency limit reached (${MAX_CONCURRENT}). Wait for running agents to finish.`);
  }
  activeCount++;

  updateSubprocess(id, { status: 'thinking', progress: 10, error: null });
  opts.onProgress?.('Starting...');
  logToMemory('run-start', sp);

  try {
    const input = opts.input || sp.task;
    const systemPrompt = SYSTEM_PROMPTS[sp.type];

    // Build messages from chat history + task
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...sp.chat.map(m => ({ role: m.role as any, content: m.content })),
      { role: 'user' as const, content: input },
    ];

    updateSubprocess(id, { status: 'running', progress: 30 });
    opts.onProgress?.(`Running ${sp.type} with ${sp.model}...`);

    // Call Mistral via llm-provider with 45s timeout
    const response = await callLLM(messages, {
      model: sp.model,
      temperature: sp.type === 'reviewer' ? 0.0 : sp.type === 'planner' ? 0.3 : 0.7,
      maxTokens: sp.type === 'planner' ? 1000 : sp.type === 'reviewer' ? 800 : 4000,
      provider: 'mistral',
      timeoutMs: 45000,
    });

    if (!response) {
      throw new Error('LLM call failed — no response from Mistral (check MISTRAL_API_KEY)');
    }

    const content = response?.choices?.[0]?.message?.content ?? '';
    if (!content || content.length < 10) {
      throw new Error('LLM returned empty or too-short response');
    }

    // Determine output type
    let outputType = 'text';
    if (sp.type === 'planner') outputType = 'json';
    else if (sp.type === 'designer' || sp.type === 'mutator') outputType = 'html';
    else if (sp.type === 'reviewer') outputType = 'json';

    // Clean up markdown fences
    let cleanOutput = content.trim();
    if (cleanOutput.startsWith('```')) {
      cleanOutput = cleanOutput.replace(/^```(?:html|json|text)?\s*/i, '').replace(/\s*```\s*$/i, '');
    }

    updateSubprocess(id, {
      status: 'done',
      output: cleanOutput,
      outputType,
      progress: 100,
      memory: [...sp.memory, `Task: ${input.slice(0, 100)}`, `Output: ${cleanOutput.slice(0, 100)}`],
    });

    addChatMessage(id, 'assistant', cleanOutput.slice(0, 500) + (cleanOutput.length > 500 ? '...' : ''));
    opts.onProgress?.('Done!');
    logToMemory('run-done', getSubprocess(id)!);

    return getSubprocess(id)!;

  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : 'unknown error';
    updateSubprocess(id, { status: 'error', error: errorMsg, progress: 0 });
    addChatMessage(id, 'system', `Error: ${errorMsg}`);
    opts.onProgress?.(`Error: ${errorMsg}`);
    logToMemory('run-error', getSubprocess(id)!);
    return getSubprocess(id)!;
  } finally {
    activeCount = Math.max(0, activeCount - 1);
  }
}

/* ============================================================================
 * Review Subprocess
 *
 * Runs a Reviewer agent on the output of another subprocess.
 * ========================================================================== */

export async function reviewSubprocess(
  targetId: string,
  opts: { model?: string } = {},
): Promise<{ score: number; verdict: string; issues: string[]; strengths: string[] }> {
  const target = getSubprocess(targetId);
  if (!target) throw new Error(`Subprocess ${targetId} not found`);
  if (!target.output) throw new Error('Target has no output to review');

  const reviewer = createSubprocess({
    name: `reviewer-for-${target.name}`,
    type: 'reviewer',
    task: `Review this ${target.outputType} output from ${target.name}:\n\n${target.output.slice(0, 12000)}`,
    model: opts.model || 'mistral-small-latest',
    parentId: targetId,
  });

  const result = await runSubprocess(reviewer.id);

  // Parse the review JSON
  try {
    let text = result.output.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
    const first = text.indexOf('{');
    const last = text.lastIndexOf('}');
    if (first >= 0 && last > first) {
      const review = JSON.parse(text.slice(first, last + 1));
      updateSubprocess(targetId, {
        reviewScore: review.score || 0,
        reviewNotes: review.issues || [],
      });
      return review;
    }
  } catch {}

  return { score: 0, verdict: 'REJECT', issues: ['Review parse failed'], strengths: [] };
}

/* ============================================================================
 * Chat with Subprocess
 * ========================================================================== */

export async function chatWithSubprocess(
  id: string,
  message: string,
): Promise<string> {
  const sp = getSubprocess(id);
  if (!sp) throw new Error(`Subprocess ${id} not found`);

  addChatMessage(id, 'user', message);

  const systemPrompt = SYSTEM_PROMPTS[sp.type];
  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...sp.chat.map(m => ({ role: m.role as any, content: m.content })),
  ];

  const response = await callLLM(messages, {
    model: sp.model,
    temperature: 0.7,
    maxTokens: 2000,
    provider: 'mistral',
    timeoutMs: 30000,
  });

  const reply = response?.choices?.[0]?.message?.content || 'I could not process that request.';
  addChatMessage(id, 'assistant', reply);
  return reply;
}

/* ============================================================================
 * Auto-Spawn for VA 24/7 Mode
 *
 * Spawns Designer → Reviewer → (Mutator if rejected) chain.
 * ========================================================================== */

export async function autoSpawnVAChain(
  partType: string,
  businessContext: string,
  opts: { model?: string } = {},
): Promise<Subprocess[]> {
  const model = opts.model || 'mistral-large-latest';
  const spawned: Subprocess[] = [];

  // 1. Designer
  const designer = createSubprocess({
    name: `designer-${partType}`,
    type: 'designer',
    task: `Generate a premium ${partType} section for ${businessContext}. Include glassmorphism, clamp() typography, scroll-reveal animations, and responsive breakpoints. Return ONLY the HTML/CSS/JS snippet.`,
    model,
  });
  spawned.push(designer);
  await runSubprocess(designer.id);

  if (designer.status === 'done' && designer.output) {
    // 2. Reviewer
    const review = await reviewSubprocess(designer.id, { model: 'mistral-small-latest' });
    spawned.push(getSubprocess(designer.id)!);

    // 3. Mutator if score < 22
    if (review.score < 22 && review.score > 0) {
      const mutator = createSubprocess({
        name: `mutator-${partType}`,
        type: 'mutator',
        task: `Apply these improvements to the ${partType}: ${review.issues.join('; ')}. Original output:\n\n${designer.output.slice(0, 8000)}`,
        model,
        parentId: designer.id,
      });
      spawned.push(mutator);
      await runSubprocess(mutator.id);
    }
  }

  return spawned;
}
