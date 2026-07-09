import { NextRequest, NextResponse } from 'next/server';
import { PREMIUM_PATTERNS, type PremiumPattern } from '@/lib/premium-patterns';
import fs from 'fs';

export const maxDuration = 10;
export const dynamic = 'force-dynamic';

/**
 * GET /api/randomize-16
 *
 * Intelligently picks 16 high-quality elements across ALL categories using
 * diversity scoring. Ensures:
 *   - At least 1 pattern per available type (if possible)
 *   - No duplicate types (unless a type has multiple high-fitness patterns)
 *   - Mix of premium + VA patterns
 *   - High fitness preference (weighted random)
 *
 * Response: {
 *   picks: [{ id, type, name, fitness, source }],
 *   diversityScore: number,
 *   styleSummary: string,
 * }
 */

function loadVAPatterns(): PremiumPattern[] {
  try {
    const dir = '/home/z/my-project/download/va-patterns';
    if (!fs.existsSync(dir)) return [];
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
    return files.map(f => {
      const content = fs.readFileSync(`${dir}/${f}`, 'utf8');
      const partType = f.split('-')[0];
      return {
        id: `va-${f.replace('.html', '')}`,
        type: partType,
        name: f.replace('.html', '').replace(/-/g, ' '),
        css: '',
        html: content,
        js: undefined,
        fitness: 80,
        source: 'virtual-artist' as const,
        fonts: [],
        features: ['va-generated'],
      };
    });
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    const vaPatterns = loadVAPatterns();
    const allPatterns = [...PREMIUM_PATTERNS, ...vaPatterns];

    // Group by type
    const byType: Record<string, PremiumPattern[]> = {};
    for (const p of allPatterns) {
      if (!byType[p.type]) byType[p.type] = [];
      byType[p.type].push(p);
    }

    // Sort each type by fitness
    for (const type of Object.keys(byType)) {
      byType[type].sort((a, b) => b.fitness - a.fitness);
    }

    // Pick 16 patterns with diversity scoring
    // Strategy: pick 1 from each type first (ensures coverage), then fill remaining
    const types = Object.keys(byType).sort(() => Math.random() - 0.5); // shuffle types
    const picks: PremiumPattern[] = [];
    const usedIds = new Set<string>();

    // Round 1: 1 per type (up to 16 types)
    for (const type of types) {
      if (picks.length >= 16) break;
      const candidates = byType[type].filter(p => !usedIds.has(p.id));
      if (candidates.length === 0) continue;

      // Weighted random — higher fitness = higher chance
      const weighted = candidates.map((p, i) => ({
        pattern: p,
        weight: Math.max(1, p.fitness - i * 5), // diminishing returns for lower-fitness
      }));
      const totalWeight = weighted.reduce((s, w) => s + w.weight, 0);
      let r = Math.random() * totalWeight;
      let picked = weighted[0].pattern;
      for (const w of weighted) {
        r -= w.weight;
        if (r <= 0) { picked = w.pattern; break; }
      }

      picks.push(picked);
      usedIds.add(picked.id);
    }

    // Round 2: Fill remaining slots from highest-fitness unused patterns
    if (picks.length < 16) {
      const remaining = allPatterns
        .filter(p => !usedIds.has(p.id))
        .sort((a, b) => b.fitness - a.fitness);
      for (const p of remaining) {
        if (picks.length >= 16) break;
        picks.push(p);
        usedIds.add(p.id);
      }
    }

    // Calculate diversity score (unique types / total picks)
    const uniqueTypes = new Set(picks.map(p => p.type));
    const diversityScore = Math.round((uniqueTypes.size / picks.length) * 100);

    // Build style summary
    const sources = picks.reduce((acc, p) => {
      acc[p.source] = (acc[p.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const styleSummary = `${sources['premium-library'] || 0} premium + ${sources['virtual-artist'] || 0} VA · ${uniqueTypes.size} types`;

    // Format response
    const formattedPicks = picks.map(p => ({
      id: p.id,
      type: p.type,
      name: p.name,
      fitness: p.fitness,
      source: p.source,
      fonts: p.fonts,
      features: p.features,
    }));

    return NextResponse.json({
      picks: formattedPicks,
      diversityScore,
      styleSummary,
      totalAvailable: allPatterns.length,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'unknown' },
      { status: 500 },
    );
  }
}
