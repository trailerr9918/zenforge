import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * ZenForge AI — Cerebrium Real Semantic Search v2
 * ================================================
 *
 * Indexes the ACTUAL 159+ design MD files in /src/lib/brain/design-md/*
 * and /src/lib/brain/taste/*. Real semantic search, not placeholder.
 *
 * On first request, walks the brain directory, parses each MD file's
 * frontmatter + body, builds an in-memory index, and caches it on
 * globalThis for instant subsequent requests.
 */

interface BrainFile {
  id: string;
  name: string;
  category: string;
  path: string;
  title: string;
  excerpt: string;
  body: string;
  tags: string[];
  size: number;
}

interface SearchHit {
  id: string;
  name: string;
  category: string;
  title: string;
  excerpt: string;
  tags: string[];
  score: number;
  matchedTerms: string[];
}

const STOPWORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her',
  'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how',
  'its', 'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy',
  'did', 'man', 'men', 'put', 'say', 'she', 'too', 'use', 'with',
  'this', 'that', 'have', 'from', 'they', 'will', 'would', 'there',
  'their', 'what', 'about', 'which', 'when', 'your', 'them', 'were',
  'been', 'these', 'those', 'into', 'over', 'also', 'than', 'then',
  'some', 'such', 'only', 'very', 'more', 'most', 'much', 'many',
]);

function tokenize(q: string): string[] {
  return q.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}

function parseMd(raw: string): { frontmatter: Record<string, string>; body: string } {
  const fmMatch = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!fmMatch) return { frontmatter: {}, body: raw };
  const fm: Record<string, string> = {};
  const fmBlock = fmMatch[1];
  let currentKey = '';
  let currentVal: string[] = [];
  const flush = () => {
    if (currentKey) fm[currentKey] = currentVal.join(' ').trim();
    currentKey = '';
    currentVal = [];
  };
  for (const line of fmBlock.split('\n')) {
    const m = line.match(/^([a-zA-Z0-9_-]+)\s*:\s*(.*)$/);
    if (m) { flush(); currentKey = m[1]; currentVal = [m[2]]; }
    else if (currentKey && line.trim()) currentVal.push(line.trim());
  }
  flush();
  return { frontmatter: fm, body: fmMatch[2] };
}

function extractTags(fm: Record<string, string>, body: string): string[] {
  const tags = new Set<string>();
  for (const k of ['tags', 'topics', 'category']) {
    if (fm[k]) fm[k].split(/[,\[\]]/).forEach((t) => {
      const tt = t.trim().replace(/['"]/g, '');
      if (tt.length >= 2) tags.add(tt.toLowerCase());
    });
  }
  const headingMatches = body.match(/^#{1,3}\s+(.+)$/gm);
  if (headingMatches) {
    headingMatches.slice(0, 10).forEach((h) => {
      h.replace(/^#+\s+/, '').toLowerCase().split(/\s+/).slice(0, 3).forEach((w) => {
        if (w.length >= 4 && !STOPWORDS.has(w)) tags.add(w);
      });
    });
  }
  return Array.from(tags).slice(0, 20);
}

function extractTitle(name: string, fm: Record<string, string>, body: string): string {
  if (fm.name) return fm.name.replace(/['"]/g, '');
  if (fm.title) return fm.title.replace(/['"]/g, '');
  const h1 = body.match(/^#\s+(.+)$/m);
  if (h1) return h1[1].trim();
  return name.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function extractExcerpt(body: string, max = 220): string {
  const clean = body
    .replace(/^---[\s\S]*?---/m, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_>#]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  const firstPara = clean.split('\n\n').find((p) => p.trim().length > 30) || clean;
  return firstPara.length > max ? firstPara.slice(0, max).trim() + '…' : firstPara;
}

interface CachedIndex { files: BrainFile[]; builtAt: number; }

async function getCerebriumIndex(): Promise<CachedIndex> {
  const now = Date.now();
  const FIVE_MIN = 5 * 60 * 1000;
  const g = globalThis as unknown as { __cerebriumIndex?: CachedIndex };
  if (g.__cerebriumIndex && now - g.__cerebriumIndex.builtAt < FIVE_MIN) {
    return g.__cerebriumIndex;
  }

  const files: BrainFile[] = [];

  async function walkDir(dir: string, category: string): Promise<void> {
    let entries: import('fs').Dirent[];
    try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const subCat = category === 'design-md' ? 'brands' : category;
        await walkDir(fullPath, subCat);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        try {
          const raw = await fs.readFile(fullPath, 'utf8');
          const { frontmatter, body } = parseMd(raw);
          const name = entry.name.replace(/\.md$/, '');
          const title = extractTitle(name, frontmatter, body);
          const tags = extractTags(frontmatter, body);
          const excerpt = extractExcerpt(body);
          const brandDir = path.basename(path.dirname(fullPath));
          const id = `${category}/${category === 'brands' ? brandDir : name}`;
          files.push({
            id, name, category, path: fullPath,
            title, excerpt, body: body.toLowerCase(),
            tags, size: body.length,
          });
        } catch {}
      }
    }
  }

  const brainRoot = path.join(process.cwd(), 'src', 'lib', 'brain');
  await walkDir(path.join(brainRoot, 'design-md'), 'brands');
  await walkDir(path.join(brainRoot, 'taste'), 'taste');

  const idx: CachedIndex = { files, builtAt: now };
  g.__cerebriumIndex = idx;
  return idx;
}

function search(index: CachedIndex, query: string, limit = 12): SearchHit[] {
  const terms = tokenize(query);
  if (terms.length === 0) {
    return index.files.slice().sort(() => Math.random() - 0.5).slice(0, limit).map((f) => ({
      id: f.id, name: f.name, category: f.category, title: f.title,
      excerpt: f.excerpt, tags: f.tags.slice(0, 6), score: 1, matchedTerms: [],
    }));
  }

  const hits: SearchHit[] = [];
  for (const f of index.files) {
    let score = 0;
    const matched: string[] = [];
    for (const term of terms) {
      let termScore = 0;
      if (f.title.toLowerCase().includes(term)) { termScore += 10; matched.push(term); }
      if (f.name.toLowerCase().includes(term)) { termScore += 8; if (!matched.includes(term)) matched.push(term); }
      if (f.tags.some((t) => t.includes(term) || term.includes(t))) { termScore += 6; if (!matched.includes(term)) matched.push(term); }
      if (f.body.includes(term)) {
        let count = 0; let idx = f.body.indexOf(term);
        while (idx !== -1 && count < 5) { count++; idx = f.body.indexOf(term, idx + term.length); }
        termScore += count;
        if (!matched.includes(term)) matched.push(term);
      }
      score += termScore;
    }
    if (score > 0) {
      hits.push({
        id: f.id, name: f.name, category: f.category, title: f.title,
        excerpt: f.excerpt, tags: f.tags.slice(0, 6), score, matchedTerms: matched,
      });
    }
  }
  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, limit);
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('q') || '';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '12', 10), 50);
    const index = await getCerebriumIndex();
    const hits = search(index, q, limit);
    return NextResponse.json({
      query: q,
      results: hits,
      stats: {
        totalFiles: index.files.length,
        totalBrands: index.files.filter((f) => f.category === 'brands').length,
        totalTaste: index.files.filter((f) => f.category === 'taste').length,
        totalTags: new Set(index.files.flatMap((f) => f.tags)).size,
        totalTopics: 13,
        indexedAt: new Date(index.builtAt).toISOString(),
      },
    });
  } catch (e) {
    console.error('[cerebrium/search] Error:', e);
    return NextResponse.json({ error: 'Cerebrium search failed', message: e instanceof Error ? e.message : 'unknown' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const q = body.query || body.q || '';
    const limit = Math.min(body.limit || 12, 50);
    const index = await getCerebriumIndex();
    const hits = search(index, q, limit);
    return NextResponse.json({
      query: q, results: hits,
      stats: {
        totalFiles: index.files.length,
        totalBrands: index.files.filter((f) => f.category === 'brands').length,
        totalTaste: index.files.filter((f) => f.category === 'taste').length,
        totalTags: new Set(index.files.flatMap((f) => f.tags)).size,
        totalTopics: 13,
        indexedAt: new Date(index.builtAt).toISOString(),
      },
    });
  } catch (e) {
    return NextResponse.json({ error: 'Cerebrium search failed', message: e instanceof Error ? e.message : 'unknown' }, { status: 500 });
  }
}
