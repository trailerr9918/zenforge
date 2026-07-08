import { NextResponse } from 'next/server';
import { getEvolutionStats, getEvolvedPatterns } from '@/lib/seae-engine';
import { loadStoredPatterns } from '@/lib/pattern-designer';
import { PREMIUM_PATTERNS } from '@/lib/premium-patterns';

export async function GET() {
  // Base pattern counts from V5 renderer
  const baseCounts = {
    hero: 8, features: 6, about: 5, gallery: 5,
    cta: 5, footer: 5, nav: 5, button: 5,
    testimonials: 6, pricing: 5, faq: 5, stats: 5,
    partners: 4, blog: 4, team: 4, contact: 4,
  };

  // Premium library counts (hand-crafted Lithos-quality patterns)
  const premiumCounts: Record<string, number> = {};
  try {
    PREMIUM_PATTERNS.forEach(p => {
      premiumCounts[p.type] = (premiumCounts[p.type] || 0) + 1;
    });
  } catch (e) { console.error('[templates] Premium patterns error:', e); }

  // Add evolved patterns from the SEAE engine
  let evolvedCounts: Record<string, number> = {};
  let totalEvolved = 0;
  try {
    const evolvedPatterns = getEvolvedPatterns(true, 1000);
    totalEvolved = evolvedPatterns.length;
    evolvedPatterns.forEach((p) => {
      evolvedCounts[p.type] = (evolvedCounts[p.type] || 0) + 1;
    });
  } catch (e) { console.error('[templates] Evolved patterns error:', e); }

  // Add Virtual Artist patterns from Supabase
  let vaCounts: Record<string, number> = {};
  let totalVA = 0;
  try {
    const vaPatterns = await loadStoredPatterns();
    totalVA = vaPatterns.length;
    vaPatterns.forEach((p) => {
      if (p.source === 'virtual-artist' || p.source === 'evolution') {
        vaCounts[p.type] = (vaCounts[p.type] || 0) + 1;
      }
    });
  } catch (e) { console.error('[templates] VA patterns error:', e); }

  // Total per type = base + premium + evolved + VA
  const heroPatterns = baseCounts.hero + (premiumCounts.hero || 0) + (evolvedCounts.hero || 0) + (vaCounts.hero || 0);
  const featureVariants = baseCounts.features + (premiumCounts.features || 0) + (evolvedCounts.features || 0) + (vaCounts.features || 0);
  const aboutVariants = baseCounts.about + (premiumCounts.about || 0) + (evolvedCounts.about || 0) + (vaCounts.about || 0);
  const galleryVariants = baseCounts.gallery + (premiumCounts.gallery || 0) + (evolvedCounts.gallery || 0) + (vaCounts.gallery || 0);
  const ctaVariants = baseCounts.cta + (premiumCounts.cta || 0) + (evolvedCounts.cta || 0) + (vaCounts.cta || 0);
  const footerVariants = baseCounts.footer + (premiumCounts.footer || 0) + (evolvedCounts.footer || 0) + (vaCounts.footer || 0);
  const navVariants = baseCounts.nav + (premiumCounts.nav || 0) + (evolvedCounts.nav || 0) + (vaCounts.nav || 0);
  const buttonStyles = baseCounts.button + (premiumCounts.button || 0) + (evolvedCounts.button || 0) + (vaCounts.button || 0);
  const testimonialsVariants = baseCounts.testimonials + (premiumCounts.testimonials || 0) + (evolvedCounts.testimonials || 0) + (vaCounts.testimonials || 0);
  const pricingVariants = baseCounts.pricing + (premiumCounts.pricing || 0) + (evolvedCounts.pricing || 0) + (vaCounts.pricing || 0);
  const faqVariants = baseCounts.faq + (premiumCounts.faq || 0) + (evolvedCounts.faq || 0) + (vaCounts.faq || 0);
  const statsVariants = baseCounts.stats + (premiumCounts.stats || 0) + (evolvedCounts.stats || 0) + (vaCounts.stats || 0);
  const partnersVariants = baseCounts.partners + (premiumCounts.partners || 0) + (evolvedCounts.partners || 0) + (vaCounts.partners || 0);
  const blogVariants = baseCounts.blog + (premiumCounts.blog || 0) + (evolvedCounts.blog || 0) + (vaCounts.blog || 0);
  const teamVariants = baseCounts.team + (premiumCounts.team || 0) + (evolvedCounts.team || 0) + (vaCounts.team || 0);
  const contactVariants = baseCounts.contact + (premiumCounts.contact || 0) + (evolvedCounts.contact || 0) + (vaCounts.contact || 0);

  const palettes = 12, typography = 12, businessTypes = 10;
  const structural =
    heroPatterns * featureVariants * aboutVariants * galleryVariants *
    ctaVariants * footerVariants * navVariants * buttonStyles *
    testimonialsVariants * pricingVariants * faqVariants * statsVariants *
    partnersVariants * blogVariants * teamVariants * contactVariants;
  const totalCombinations = structural * palettes * typography * businessTypes;

  const totalPatternCount = heroPatterns + featureVariants + aboutVariants + galleryVariants +
    ctaVariants + footerVariants + navVariants + buttonStyles +
    testimonialsVariants + pricingVariants + faqVariants + statsVariants +
    partnersVariants + blogVariants + teamVariants + contactVariants;

  // Get evolution stats
  let evoStats: any = null;
  try { evoStats = getEvolutionStats(); } catch {}

  return NextResponse.json({
    totalCombinations,
    expandedComponents: {
      heroPatterns, featureVariants, aboutVariants, galleryVariants,
      ctaVariants, footerVariants, navVariants, buttonStyles,
      testimonials: testimonialsVariants, pricing: pricingVariants,
      faq: faqVariants, stats: statsVariants, partners: partnersVariants,
      blog: blogVariants, team: teamVariants, contact: contactVariants,
      palettes, typography, businessTypes,
      totalPatterns: totalPatternCount,
      evolvedPatterns: totalEvolved,
    },
    cerebrium: { totalBrainFiles: 159, totalBrands: 74, totalTopics: 13 },
    totalPatternCount,
    evolution: evoStats ? {
      totalCycles: evoStats.totalCycles,
      totalAccepted: evoStats.totalAccepted,
      totalEvolved: totalEvolved,
      bestFitness: evoStats.bestFitness,
      isRunning: evoStats.isRunning,
    } : null,
    version: 'v6-ultra-v2',
  });
}

