/**
 * Pattern Designer Manager — V2 (Premium Default)
 * ================================================
 *
 * Assembles complete, premium-quality websites from:
 *   1. Premium Pattern Library (hand-crafted Lithos-quality templates) — DEFAULT
 *   2. Stored Virtual Artist / Evolution patterns (if higher fitness)
 *   3. V5 fallbacks (last resort)
 *
 * The premium library is ALWAYS available and serves as the quality baseline.
 * Stored patterns from VA/Evolution can override if they have higher fitness.
 *
 * Assembly is INSTANT — no AI call needed.
 */

import { supabase } from './supabase-client';
import { PREMIUM_PATTERNS, getPremiumPatterns, getBestPremiumPattern, buildFontsHref, type PremiumPattern } from './premium-patterns';

export interface StoredPattern {
  id: string;
  type: string;
  name: string;
  css: string;
  html: string;
  js?: string;
  fitness: number;
  uniqueness: number;
  accessibility: number;
  inspiration?: string;
  reasoning?: string;
  accepted: boolean;
  source: 'virtual-artist' | 'evolution' | 'premium-library' | 'v5-fallback';
}

export interface CustomConfig {
  businessName?: string;
  tagline?: string;
  hero?: string;
  sub?: string;
  about?: string;
  ctaText?: string;
  colors?: { bg?: string; primary?: string; accent?: string; dark?: string; cream?: string };
  fonts?: { display?: string; body?: string };
  style?: string;
}

let patternCache: { patterns: StoredPattern[]; loadedAt: number } | null = null;
const CACHE_TTL = 60000;

export async function loadStoredPatterns(): Promise<StoredPattern[]> {
  if (patternCache && Date.now() - patternCache.loadedAt < CACHE_TTL) {
    return patternCache.patterns;
  }
  const patterns: StoredPattern[] = [];
  try {
    const { data: vaData } = await supabase.from('websites').select('id, config').eq('business_type', 'virtual_artist_pattern').order('created_at', { ascending: false }).limit(200);
    if (vaData) for (const row of vaData) {
      try {
        const config = typeof row.config === 'string' ? JSON.parse(row.config) : row.config;
        if (config?.pattern) {
          const p = config.pattern;
          if (p.accepted !== false && p.css && p.html) {
            patterns.push({ id: p.id, type: p.type, name: p.name, css: p.css, html: p.html, js: p.js, fitness: p.fitness || 0, uniqueness: p.uniqueness || 0, accessibility: p.accessibility || 0, inspiration: p.inspiration, reasoning: p.reasoning, accepted: true, source: 'virtual-artist' });
          }
        }
      } catch {}
    }
    const { data: evoData } = await supabase.from('websites').select('id, config').like('id', 'seae-%').order('created_at', { ascending: false }).limit(200);
    if (evoData) for (const row of evoData) {
      try {
        const config = typeof row.config === 'string' ? JSON.parse(row.config) : row.config;
        if (config?.pattern) {
          const p = config.pattern;
          if (p.accepted !== false && p.css && p.html) {
            patterns.push({ id: p.id, type: p.type, name: p.name, css: p.css, html: p.html, js: p.js, fitness: p.fitness || 0, uniqueness: p.uniqueness || 0, accessibility: p.accessibility || 0, inspiration: p.inspiration, reasoning: p.reasoning, accepted: true, source: 'evolution' });
          }
        }
      } catch {}
    }
    patternCache = { patterns, loadedAt: Date.now() };
  } catch (e) { console.error('[pattern-designer] Load error:', e); }
  return patterns;
}

function getBestStoredPattern(patterns: StoredPattern[], type: string): StoredPattern | null {
  return patterns.filter(p => p.type === type && p.accepted).sort((a, b) => b.fitness - a.fitness)[0] || null;
}

function applyTemplate(html: string, config: CustomConfig, businessName: string, slug: string): string {
  let result = html;
  const year = new Date().getFullYear();
  const heroText = config.hero || `${businessName} — Premium Experience`;
  const heroParts = heroText.split(/[,—–-]/).map(s => s.trim()).filter(Boolean);
  const line1 = heroParts[0] || businessName;
  const line2 = heroParts.slice(1).join(' ') || 'Premium Experience';
  const subText = config.sub || 'Discover excellence in every detail. Crafted with intention, built to last.';
  const ctaText = config.ctaText || 'Get Started';

  result = result.replace(/\{\{BUSINESS_NAME\}\}/g, businessName);
  result = result.replace(/\{\{SLUG\}\}/g, slug);
  result = result.replace(/\{\{HERO_LINE1\}\}/g, line1);
  result = result.replace(/\{\{HERO_LINE2\}\}/g, line2);
  result = result.replace(/\{\{SUB_TEXT\}\}/g, subText);
  result = result.replace(/\{\{CTA_TEXT\}\}/g, ctaText);
  result = result.replace(/\{\{YEAR\}\}/g, String(year));
  return result;
}

function buildCssVariables(config: CustomConfig): string {
  const colors = config.colors || {};
  const fonts = config.fonts || {};
  const displayFont = fonts.display || 'Playfair Display';
  const bodyFont = fonts.body || 'Inter';

  const bg = colors.bg || '#0a0a0a';
  const primary = colors.primary || '#ffffff';
  const accent = colors.accent || '#3b82f6';
  const dark = colors.dark || '#050505';
  const cream = colors.cream || '#f5f5f5';

  // Determine if dark or light theme
  const isDark = parseInt(bg.slice(1, 3), 16) < 128;
  const text = isDark ? '#ffffff' : '#0a0a0a';
  const textMuted = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)';

  return `
:root {
  --p-bg: ${bg};
  --p-bg-dark: ${dark};
  --p-text: ${text};
  --p-text-muted: ${textMuted};
  --p-accent: ${accent};
  --p-on-accent: ${isDark ? '#ffffff' : '#ffffff'};
  --p-accent-shadow: ${accent}44;
  --p-accent-gradient: linear-gradient(135deg, ${accent} 0%, ${primary} 100%);
  --p-glass-bg: ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)'};
  --p-glass-border: ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)'};
  --p-glass-hover: ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.04)'};
  --p-card-bg: ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)'};
  --p-card-border: ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'};
  --p-card-shadow: ${isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.08)'};
  --p-input-bg: ${isDark ? 'rgba(0,0,0,0.2)' : '#fff'};
  --p-input-border: ${isDark ? 'rgba(255,255,255,0.12)' : '#ddd'};
  --p-display: '${displayFont}', serif;
  --p-body: '${bodyFont}', sans-serif;
}
`;
}

export async function assembleWebsite(
  prompt: string,
  config: CustomConfig = {}
): Promise<{ html: string; slug: string; businessName: string; patterns: string[]; duration: number; patternSources: Record<string, string> }> {
  const t0 = Date.now();

  // Extract business name
  let businessName = config.businessName || '';
  if (!businessName) {
    const called = prompt.match(/called\s+([A-Z][a-zA-Z0-9\s]{2,30}?)(?:[.,]|\s+(?:with|using|that|which|and|\.|$))/);
    if (called) businessName = called[1].trim();
    else {
      const named = prompt.match(/named\s+([A-Z][a-zA-Z0-9\s]{2,30}?)(?:[.,]|\s+(?:with|using|that|which|and|\.|$))/);
      if (named) businessName = named[1].trim();
      else {
        const forMatch = prompt.match(/for\s+(?:a\s+)?([A-Z][a-zA-Z0-9\s]{2,30}?)(?:[.,]|\s+(?:with|using|that|which|and|\.|$))/);
        if (forMatch) businessName = forMatch[1].trim();
      }
    }
  }
  if (!businessName) {
    const names = ['Apex', 'Lumina', 'Veridian', 'Ember', 'Forge'];
    businessName = names[Math.floor(Math.random() * names.length)];
  }

  const slug = `${businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(36).slice(2, 6)}`;

  // Load stored patterns (VA + Evolution)
  const storedPatterns = await loadStoredPatterns();

  // Section order
  const sectionOrder = [
    'nav', 'hero', 'partners', 'features', 'about', 'stats',
    'testimonials', 'gallery', 'pricing', 'team', 'blog', 'faq',
    'contact', 'cta', 'footer',
  ];

  const usedPatterns: string[] = [];
  const patternSources: Record<string, string> = {};
  const cssParts: string[] = [];
  const htmlParts: string[] = [];
  const jsParts: string[] = [];
  const allFonts = new Set<string>(['Inter', 'Playfair Display']);

  // Style-based pattern selection — pick DIFFERENT layout variants per style
  const styleVariantMap: Record<string, Record<string, string>> = {
    cinematic: { hero: 'premium-hero-cinematic', nav: 'premium-nav-glassmorphic', features: 'premium-features-glassmorphic', about: 'premium-about-split' },
    editorial: { hero: 'premium-hero-editorial-split', nav: 'premium-nav-minimal', features: 'premium-features-minimal-list', about: 'premium-about-centered' },
    bold: { hero: 'premium-hero-bold-display', nav: 'premium-nav-minimal', features: 'premium-features-minimal-list', about: 'premium-about-centered' },
    playful: { hero: 'premium-hero-playful-centered', nav: 'premium-nav-glassmorphic', features: 'premium-features-glassmorphic', about: 'premium-about-split' },
    minimal: { hero: 'premium-hero-editorial-split', nav: 'premium-nav-minimal', features: 'premium-features-minimal-list', about: 'premium-about-centered' },
    warm: { hero: 'premium-hero-playful-centered', nav: 'premium-nav-glassmorphic', features: 'premium-features-glassmorphic', about: 'premium-about-split' },
  };
  const styleVariants = styleVariantMap[config.style || 'cinematic'] || styleVariantMap.cinematic;

  for (const sectionType of sectionOrder) {
    // 1. Check stored patterns (VA + Evolution) — use if fitness > premium
    const storedPattern = getBestStoredPattern(storedPatterns, sectionType);
    // Pick style-specific premium pattern, fall back to best
    const preferredId = styleVariants[sectionType];
    const allPremiumForType = getPremiumPatterns(sectionType);
    let premiumPattern = allPremiumForType.find(p => p.id === preferredId) || getBestPremiumPattern(sectionType);

    let chosenCss = '';
    let chosenHtml = '';
    let chosenJs = '';
    let chosenSource = '';
    let chosenId = '';
    let chosenFitness = 0;

    if (storedPattern && premiumPattern) {
      // Compare fitness — use the higher one
      if (storedPattern.fitness > premiumPattern.fitness) {
        // Use stored pattern
        chosenCss = storedPattern.css.replace(/^```css?\s*/i, '').replace(/\s*```$/i, '').trim();
        chosenHtml = storedPattern.html.replace(/^```html?\s*/i, '').replace(/\s*```$/i, '').trim();
        chosenJs = storedPattern.js || '';
        chosenSource = storedPattern.source;
        chosenId = storedPattern.id;
        chosenFitness = storedPattern.fitness;
      } else {
        // Use premium pattern
        chosenCss = premiumPattern.css;
        chosenHtml = premiumPattern.html;
        chosenJs = premiumPattern.js || '';
        chosenSource = 'premium-library';
        chosenId = premiumPattern.id;
        chosenFitness = premiumPattern.fitness;
        premiumPattern.fonts.forEach(f => allFonts.add(f));
      }
    } else if (premiumPattern) {
      chosenCss = premiumPattern.css;
      chosenHtml = premiumPattern.html;
      chosenJs = premiumPattern.js || '';
      chosenSource = 'premium-library';
      chosenId = premiumPattern.id;
      chosenFitness = premiumPattern.fitness;
      premiumPattern.fonts.forEach(f => allFonts.add(f));
    } else if (storedPattern) {
      chosenCss = storedPattern.css.replace(/^```css?\s*/i, '').replace(/\s*```$/i, '').trim();
      chosenHtml = storedPattern.html.replace(/^```html?\s*/i, '').replace(/\s*```$/i, '').trim();
      chosenJs = storedPattern.js || '';
      chosenSource = storedPattern.source;
      chosenId = storedPattern.id;
      chosenFitness = storedPattern.fitness;
    }

    if (chosenCss && chosenHtml) {
      // Apply template variables
      const appliedHtml = applyTemplate(chosenHtml, config, businessName, slug);
      cssParts.push(`/* ${sectionType} (${chosenSource}, fitness: ${chosenFitness}) */\n${chosenCss}`);
      htmlParts.push(appliedHtml);
      if (chosenJs) jsParts.push(`/* ${sectionType} JS */\n${chosenJs}`);
      usedPatterns.push(`${sectionType}:${chosenId} (${chosenFitness})`);
      patternSources[sectionType] = chosenSource;
    }
  }

  // Build CSS variables from custom config
  const cssVars = buildCssVariables(config);

  // Shared CSS
  const sharedCss = `
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{font-family:var(--p-body);background:var(--p-bg);color:var(--p-text);line-height:1.6;overflow-x:hidden;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
img{max-width:100%;height:auto;display:block}
a{color:inherit;text-decoration:none}
button{font-family:var(--p-body)}
section{scroll-margin-top:80px}
.premium-reveal{opacity:0;transform:translateY(30px);transition:opacity 0.8s cubic-bezier(0.16,1,0.3,1),transform 0.8s cubic-bezier(0.16,1,0.3,1)}
.premium-reveal.premium-visible{opacity:1;transform:translateY(0)}
.premium-reveal-stagger>*{opacity:0;transform:translateY(20px);transition:opacity 0.6s cubic-bezier(0.16,1,0.3,1),transform 0.6s cubic-bezier(0.16,1,0.3,1)}
.premium-reveal-stagger.premium-visible>*{opacity:1;transform:translateY(0)}
.premium-reveal-stagger.premium-visible>*:nth-child(1){transition-delay:0s}
.premium-reveal-stagger.premium-visible>*:nth-child(2){transition-delay:0.1s}
.premium-reveal-stagger.premium-visible>*:nth-child(3){transition-delay:0.2s}
.premium-reveal-stagger.premium-visible>*:nth-child(4){transition-delay:0.3s}
.premium-reveal-stagger.premium-visible>*:nth-child(5){transition-delay:0.4s}
.premium-reveal-stagger.premium-visible>*:nth-child(6){transition-delay:0.5s}
.premium-card-hover{transition:transform 0.3s cubic-bezier(0.16,1,0.3,1),box-shadow 0.3s}
.premium-card-hover:hover{transform:translateY(-8px)}
.premium-text-reveal{background:linear-gradient(90deg,var(--p-text) 0%,var(--p-text) 35%,var(--p-text-muted) 50%,var(--p-text) 65%,var(--p-text) 100%);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;background-position:100% 0;transition:background-position 1.2s cubic-bezier(0.16,1,0.3,1)}
.premium-text-reveal.premium-visible{background-position:0 0}
@media(prefers-reduced-motion:reduce){.premium-reveal,.premium-reveal-stagger>*{opacity:1!important;transform:none!important;transition:none!important}*{animation:none!important}}
`;

  // Intersection Observer — applies scroll animations to ALL sections + staggered children
  const observerScript = `
<script>
(function(){
  if('IntersectionObserver' in window){
    var obs=new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(e.isIntersecting){
          e.target.classList.add('premium-visible');
          obs.unobserve(e);
        }
      });
    },{threshold:0.08,rootMargin:'0px 0px -40px 0px'});
    // Apply reveal to all sections (skip hero which has its own animations)
    document.querySelectorAll('section:not(.premium-hero)').forEach(function(el){
      el.classList.add('premium-reveal');
      obs.observe(el);
    });
    // Apply staggered reveal to grids and card containers
    document.querySelectorAll('.premium-features-grid,.premium-tst-grid,.premium-gallery-grid,.premium-prc-grid,.premium-team-grid,.premium-blog-grid,.premium-faq-list').forEach(function(el){
      el.classList.add('premium-reveal-stagger');
      obs.observe(el);
    });
    // Apply text reveal to headings
    document.querySelectorAll('.premium-features-head h2,.premium-tst-head h2,.premium-gallery-head h2,.premium-prc-head h2,.premium-faq-head h2,.premium-team-head h2,.premium-blog-head h2').forEach(function(el){
      el.classList.add('premium-text-reveal');
      obs.observe(el);
    });
  }
})();
</script>`;

  // Build fonts href
  const fontsHref = buildFontsHref(Array.from(allFonts));

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${businessName}</title>
<meta name="description" content="${config.sub || 'Premium experience crafted with intention.'}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${fontsHref}" rel="stylesheet">
<style>
${cssVars}
${sharedCss}
${cssParts.join('\n\n')}
</style>
</head>
<body>
${htmlParts.join('\n')}
<script>
${jsParts.join('\n\n')}
</script>
${observerScript}
</body>
</html>`;

  const duration = Date.now() - t0;
  return { html, slug, businessName, patterns: usedPatterns, duration, patternSources };
}
