import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const maxDuration = 10;
export const dynamic = 'force-dynamic';

const MEMORY_FILE = '/home/z/my-project/download/va-memory.md';

/**
 * VA Part Memory — logs part generation/review/promotion/trash events to va-memory.md
 *
 * Body: {
 *   action: 'generate' | 'review' | 'promote' | 'trash' | 'iterate' | 'note',
 *   partType: string,
 *   style?: string,
 *   score?: number,
 *   businessContext?: string,
 *   feedback?: string,  // user chat note
 *   html?: string,      // for promote (saves to patterns/)
 * }
 *
 * GET: returns the memory file contents + summary stats
 */

interface MemoryEntry {
  timestamp: string;
  action: string;
  partType: string;
  style?: string;
  score?: number;
  businessContext?: string;
  feedback?: string;
}

function appendMemory(entry: MemoryEntry) {
  try {
    const dir = path.dirname(MEMORY_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const lines = [
      `## ${entry.timestamp} — ${entry.action.toUpperCase()}`,
      `- **Part**: ${entry.partType}`,
    ];
    if (entry.style) lines.push(`- **Style**: ${entry.style}`);
    if (entry.score !== undefined) lines.push(`- **Score**: ${entry.score}/30`);
    if (entry.businessContext) lines.push(`- **Context**: ${entry.businessContext}`);
    if (entry.feedback) lines.push(`- **Feedback**: ${entry.feedback}`);
    lines.push('');

    fs.appendFileSync(MEMORY_FILE, lines.join('\n') + '\n', 'utf8');
  } catch (e) {
    console.error('[va-memory] append failed:', e);
  }
}

function readMemory(): string {
  try {
    if (!fs.existsSync(MEMORY_FILE)) return '# VA Memory\n\nNo entries yet.\n';
    return fs.readFileSync(MEMORY_FILE, 'utf8');
  } catch {
    return '# VA Memory\n\nError reading memory.\n';
  }
}

function getSummary() {
  const content = readMemory();
  const entries = content.match(/^## .+$/gm) || [];
  const generateCount = (content.match(/— GENERATE/g) || []).length;
  const promoteCount = (content.match(/— PROMOTE/g) || []).length;
  const trashCount = (content.match(/— TRASH/g) || []).length;
  const iterateCount = (content.match(/— ITERATE/g) || []).length;
  const reviewCount = (content.match(/— REVIEW/g) || []).length;

  // Extract scores
  const scores: number[] = [];
  const scoreMatches = content.matchAll(/\*\*Score\*\*: (\d+)\/30/g);
  for (const m of scoreMatches) scores.push(parseInt(m[1], 10));
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  return {
    totalEntries: entries.length,
    generateCount,
    promoteCount,
    trashCount,
    iterateCount,
    reviewCount,
    avgScore,
    recentScores: scores.slice(-10),
  };
}

export async function GET() {
  return NextResponse.json({
    memory: readMemory(),
    summary: getSummary(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const entry: MemoryEntry = {
      timestamp: new Date().toISOString(),
      action: body.action || 'note',
      partType: body.partType || 'unknown',
      style: body.style,
      score: body.score,
      businessContext: body.businessContext,
      feedback: body.feedback,
    };

    appendMemory(entry);

    // If promoting, also save the HTML to patterns directory
    if (body.action === 'promote' && body.html) {
      try {
        const patternsDir = '/home/z/my-project/download/va-patterns';
        if (!fs.existsSync(patternsDir)) fs.mkdirSync(patternsDir, { recursive: true });
        const filename = `${body.partType}-${Date.now()}.html`;
        fs.writeFileSync(path.join(patternsDir, filename), body.html, 'utf8');
      } catch (e) {
        console.error('[va-memory] pattern save failed:', e);
      }
    }

    return NextResponse.json({ success: true, summary: getSummary() });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'unknown' },
      { status: 500 },
    );
  }
}
