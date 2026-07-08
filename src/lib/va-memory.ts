/**
 * VA Memory System
 * ================
 *
 * Tracks VA's autonomous work, learnings, and progress.
 * Stores memory in a markdown file that can be viewed in Settings.
 */

import fs from 'fs';
import path from 'path';

const MEMORY_FILE = path.join(process.cwd(), 'download/va-memory.md');

export interface VAMemoryEntry {
  timestamp: string;
  type: 'generate' | 'review' | 'mutate' | 'learn' | 'note';
  content: string;
  score?: number;
  url?: string;
}

/**
 * Append an entry to VA's memory file.
 */
export function appendMemory(entry: VAMemoryEntry): void {
  try {
    const dir = path.dirname(MEMORY_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    const line = `## [${entry.timestamp}] ${entry.type.toUpperCase()}\n${entry.content}${entry.score ? `\nScore: ${entry.score}/30` : ''}${entry.url ? `\nURL: ${entry.url}` : ''}\n\n`;
    
    if (fs.existsSync(MEMORY_FILE)) {
      fs.appendFileSync(MEMORY_FILE, line);
    } else {
      fs.writeFileSync(MEMORY_FILE, `# ZenForge VA Memory\n\nThis file tracks the Virtual Artist's autonomous work, learnings, and progress.\n\n${line}`);
    }
  } catch (e) {
    console.error('[va-memory] Failed to append:', e);
  }
}

/**
 * Read VA's memory file.
 */
export function readMemory(): string {
  try {
    if (fs.existsSync(MEMORY_FILE)) {
      return fs.readFileSync(MEMORY_FILE, 'utf-8');
    }
  } catch (e) {
    console.error('[va-memory] Failed to read:', e);
  }
  return '# ZenForge VA Memory\n\nNo memory entries yet.';
}

/**
 * Get a summary of VA's recent activity.
 */
export function getMemorySummary(): { totalEntries: number; lastActivity: string; recentScores: number[] } {
  try {
    const content = readMemory();
    const entries = content.split('## [').filter(s => s.length > 10);
    const scores: number[] = [];
    let lastActivity = 'Never';
    
    for (const entry of entries) {
      const scoreMatch = entry.match(/Score: (\d+)\/30/);
      if (scoreMatch) scores.push(parseInt(scoreMatch[1]));
      const timeMatch = entry.match(/^([^\]]+)/);
      if (timeMatch) lastActivity = timeMatch[1];
    }
    
    return {
      totalEntries: entries.length,
      lastActivity,
      recentScores: scores.slice(-10),
    };
  } catch {
    return { totalEntries: 0, lastActivity: 'Never', recentScores: [] };
  }
}
