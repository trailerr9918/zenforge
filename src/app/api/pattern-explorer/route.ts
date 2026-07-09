import { NextRequest, NextResponse } from 'next/server';
import { PREMIUM_PATTERNS, getPremiumPatterns } from '@/lib/premium-patterns';
import fs from 'fs';
import path from 'path';

export const maxDuration = 10;
export const dynamic = 'force-dynamic';

/**
 * GET /api/pattern-explorer
 *
 * Returns ALL available patterns from every source:
 *   - Premium library (24 hand-crafted patterns)
 *   - VA-approved patterns (from download/va-patterns/)
 *
 * Response: {
 *   patterns: [{
 *     id, type, name, fitness, source, fonts, features,
 *     colors?, styleTags?, businessSuitability?
 *   }],
 *   stats: { byType: { hero: 3, nav: 2, ... }, total, bySource: { premium: 24, va: 0 } }
 * }
 */

interface ExplorerPattern {
  id: string;
  type: string;
  name: string;
  fitness: number;
  source: 'premium-library' | 'virtual-artist';
  fonts: string[];
  features: string[];
  styleTags: string[];
  businessSuitability: string[];
  hasCSS: boolean;
  hasHTML: boolean;
  hasJS: boolean;
}

function loadVAPatterns(): ExplorerPattern[] {
  try {
    const dir = '/home/z/my-project/download/va-patterns';
    if (!fs.existsSync(dir)) return [];
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
    return files.map(f => {
      const content = fs.readFileSync(path.join(dir, f), 'utf8');
      const partType = f.split('-')[0];
      return {
        id: `va-${f.replace('.html', '')}`,
        type: partType,
        name: f.replace('.html', '').replace(/-/g, ' '),
        fitness: 80,
        source: 'virtual-artist' as const,
        fonts: [],
        features: ['va-generated', 'user-approved'],
        styleTags: ['va-evolved'],
        businessSuitability: ['all'],
        hasCSS: content.includes('<style'),
        hasHTML: content.includes('<section') || content.includes('<nav') || content.includes('<footer'),
        hasJS: content.includes('<script'),
      };
    });
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const typeFilter = url.searchParams.get('type');
    const sourceFilter = url.searchParams.get('source');

    // Load premium patterns
    const premiumPatterns: ExplorerPattern[] = PREMIUM_PATTERNS.map(p => ({
      id: p.id,
      type: p.type,
      name: p.name,
      fitness: p.fitness,
      source: 'premium-library' as const,
      fonts: p.fonts,
      features: p.features,
      styleTags: p.features, // features serve as style tags
      businessSuitability: inferBusinessSuitability(p.type, p.features),
      hasCSS: p.css.length > 0,
      hasHTML: p.html.length > 0,
      hasJS: !!p.js,
    }));

    // Load VA patterns
    const vaPatterns = loadVAPatterns();

    // Combine
    let allPatterns = [...premiumPatterns, ...vaPatterns];

    // Filter
    if (typeFilter && typeFilter !== 'all') {
      allPatterns = allPatterns.filter(p => p.type === typeFilter);
    }
    if (sourceFilter && sourceFilter !== 'all') {
      allPatterns = allPatterns.filter(p => p.source === sourceFilter);
    }

    // Sort by fitness descending
    allPatterns.sort((a, b) => b.fitness - a.fitness);

    // Build stats
    const byType: Record<string, number> = {};
    const bySource: Record<string, number> = { 'premium-library': 0, 'virtual-artist': 0 };
    for (const p of allPatterns) {
      byType[p.type] = (byType[p.type] || 0) + 1;
      bySource[p.source]++;
    }

    // Count total available (unfiltered) for stats display
    const totalPremium = PREMIUM_PATTERNS.length;
    const totalVA = vaPatterns.length;

    // Section type capacity (how many distinct types exist in the library)
    const allTypes = new Set([...PREMIUM_PATTERNS.map(p => p.type), ...vaPatterns.map(p => p.type)]);

    return NextResponse.json({
      patterns: allPatterns,
      total: allPatterns.length,
      stats: {
        byType,
        bySource,
        totalPremium,
        totalVA,
        totalTypes: allTypes.size,
        allTypes: Array.from(allTypes).sort(),
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'unknown' },
      { status: 500 },
    );
  }
}

function inferBusinessSuitability(type: string, features: string[]): string[] {
  const suitability: string[] = [];
  if (type === 'hero' || type === 'nav' || type === 'footer' || type === 'cta') {
    suitability.push('all');
  }
  if (features.includes('glassmorphic') || features.includes('backdrop-blur')) {
    suitability.push('tech', 'saas', 'agency');
  }
  if (features.includes('cinematic') || features.includes('video')) {
    suitability.push('agency', 'portfolio', 'luxury');
  }
  if (features.includes('minimal') || features.includes('clean')) {
    suitability.push('corporate', 'legal', 'dental');
  }
  if (features.includes('warm') || features.includes('organic')) {
    suitability.push('restaurant', 'cafe', 'wellness');
  }
  if (suitability.length === 0) suitability.push('all');
  return suitability;
}
