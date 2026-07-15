import { NextResponse } from 'next/server';
import { listSubprocesses } from '@/lib/subprocess-engine';
import { getTokenUsage } from '@/lib/llm-provider';
import { PREMIUM_PATTERNS } from '@/lib/premium-patterns';
import fs from 'fs';
import path from 'path';

export const maxDuration = 10;
export const dynamic = 'force-dynamic';

/**
 * GET /api/system-health
 * Returns system health dashboard data:
 *   - Active/completed subprocesses
 *   - Pattern count (premium + VA)
 *   - Mistral token usage
 *   - VA memory summary
 *   - Recent generation quality
 */

export async function GET() {
  try {
    // Subprocesses
    const subs = listSubprocesses();
    const activeSubs = subs.filter(s => s.status === 'running' || s.status === 'thinking');
    const completedSubs = subs.filter(s => s.status === 'done');
    const promotedSubs = subs.filter(s => s.promoted);

    // Patterns
    const vaPatternDir = '/home/z/my-project/download/va-patterns';
    let vaPatternCount = 0;
    try {
      vaPatternCount = fs.readdirSync(vaPatternDir).filter(f => f.endsWith('.html')).length;
    } catch {}

    // Token usage
    const tokens = getTokenUsage();

    // VA memory
    let memorySummary = { totalEntries: 0, avgScore: 0 };
    try {
      const memoryFile = '/home/z/my-project/download/va-memory.md';
      if (fs.existsSync(memoryFile)) {
        const content = fs.readFileSync(memoryFile, 'utf8');
        const entries = content.match(/^## .+$/gm) || [];
        const scores: number[] = [];
        const scoreMatches = content.matchAll(/\*\*Score\*\*: (\d+)\/30/g);
        for (const m of scoreMatches) scores.push(parseInt(m[1], 10));
        memorySummary = {
          totalEntries: entries.length,
          avgScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
        };
      }
    } catch {}

    return NextResponse.json({
      subprocesses: {
        total: subs.length,
        active: activeSubs.length,
        completed: completedSubs.length,
        promoted: promotedSubs.length,
      },
      patterns: {
        premium: PREMIUM_PATTERNS.length,
        vaApproved: vaPatternCount,
        total: PREMIUM_PATTERNS.length + vaPatternCount,
      },
      mistral: {
        totalTokens: tokens.total,
        promptTokens: tokens.prompt,
        completionTokens: tokens.completion,
        apiCalls: tokens.calls,
      },
      memory: memorySummary,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'unknown' }, { status: 500 });
  }
}
