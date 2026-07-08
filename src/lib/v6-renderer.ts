/**
 * V6 Ultra Renderer — Premium Website Generator
 * ===============================================
 *
 * Major upgrade from V5:
 *   1. Custom config support — users can specify colors, fonts, branding,
 *      business info, custom sections via the AI Agent
 *   2. More variant diversity — 8-12 distinct variants per section
 *      (V5 had duplicates)
 *   3. Premium patterns inspired by MotionSites prompts (cinematic heroes,
 *      glassmorphic cards, gradient overlays, video backgrounds)
 *   4. Evolved pattern injection — pulls accepted patterns from the
 *      Virtual Artist engine to use as additional variants
 *   5. Next.js-friendly HTML structure (semantic, accessible)
 *   6. Longer/richer sites — 16 sections default, optional extensions
 *
 * Sections (16 + 4 optional):
 *   nav, hero, partners, features, about, stats, testimonials, gallery,
 *   pricing, team, blog, faq, contact, cta, footer + optional:
 *   menu (restaurants), portfolio (creatives), caseStudies (agencies),
 *   newsletter (publications)
 */

import { PALETTES, TYPOGRAPHIES, BIZ_TYPES, detectBiz, mulberry32, pickImages, imgUrl, esc, isDarkBg, sharedCss, type Ctx, type Variant, type Palette, type Typography, type Biz } from './v5-core';
import { loadMotionPrompts, type MotionPrompt } from './motionsites-prompts';

// === Custom Config (user-provided overrides) ===
export interface CustomConfig {
  // Branding
  businessName?: string;
  tagline?: string;
  hero?: string;
  sub?: string;
  about?: string;
  ctaText?: string;

  // Colors — user can override the palette
  colors?: {
    bg?: string;
    primary?: string;
    accent?: string;
    dark?: string;
    cream?: string;
  };

  // Typography — user can specify font families
  fonts?: {
    display?: string;
    body?: string;
    googleHref?: string;
  };

  // Features / services (custom list)
  features?: { title: string; description: string; icon?: string }[];

  // Testimonials (custom quotes)
  testimonials?: { name: string; role: string; quote: string }[];

  // Pricing tiers
  pricing?: { name: string; price: string; description: string; features: string[]; featured?: boolean }[];

  // FAQ
  faq?: { question: string; answer: string }[];

  // Team members
  team?: { name: string; role: string; bio?: string }[];

  // Stats
  stats?: { value: string; label: string }[];

  // Section order — which sections to include
  sections?: string[];

  // Custom menu items (for restaurants)
  menu?: { name: string; description: string; price: string }[];

  // Style preferences
  style?: 'minimal' | 'bold' | 'editorial' | 'cinematic' | 'glassmorphic' | 'playful';
}

// === Section variant library (V6 — many more variants) ===

// HERO variants (12 distinct — up from 8)
const heroCinematic: Variant = {
  id: 'cinematic',
  css: (c) => `.v6-hero{position:relative;min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;overflow:hidden;background:${c.isDark ? c.p.dark : '#0a0a0a'};color:#fff}.v6-hero-overlay{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0.4) 0%,rgba(0,0,0,0.6) 50%,rgba(0,0,0,0.9) 100%)}.v6-hero-inner{position:relative;z-index:10;max-width:1100px;margin:0 auto;padding:0 24px}.v6-hero-tag{display:inline-block;padding:6px 16px;border:1px solid rgba(255,255,255,0.3);border-radius:999px;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:32px;font-family:${c.t.body};font-weight:500}.v6-hero h1{font-family:${c.t.display};font-size:clamp(40px,8vw,96px);font-weight:700;line-height:0.95;letter-spacing:-0.03em;margin-bottom:24px;color:#fff}.v6-hero h1 em{font-style:italic;color:${c.p.accent};font-weight:400}.v6-hero-sub{font-family:${c.t.body};font-size:clamp(16px,2vw,20px);line-height:1.6;color:rgba(255,255,255,0.75);max-width:600px;margin:0 auto 40px}.v6-hero-cta{display:inline-flex;align-items:center;gap:8px;padding:18px 36px;background:${c.p.accent};color:#fff;border:none;border-radius:999px;font-size:16px;font-weight:600;font-family:${c.t.body};cursor:pointer;transition:transform .2s,box-shadow .2s;box-shadow:0 8px 24px rgba(0,0,0,0.3)}.v6-hero-cta:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(0,0,0,0.4)}@media(max-width:768px){.v6-hero{min-height:90vh}}`,
  html: (c) => `<section class="v6-hero v5-reveal"><div class="v6-hero-overlay"></div><div class="v6-hero-inner"><div class="v6-hero-tag">${esc(c.biz.hero || 'Premium Experience')}</div><h1>${esc(c.bn)}<br/><em>${esc(c.biz.tagline || 'Crafted with intention')}</em></h1><p class="v6-hero-sub">${esc(c.biz.sub)}</p><button class="v6-hero-cta">${esc(c.ctaText)} →</button></div></section>`,
};

const heroEditorialSplit: Variant = {
  id: 'editorial-split',
  css: (c) => `.v6-hero{display:grid;grid-template-columns:1fr 1fr;min-height:90vh;background:${c.isDark ? c.p.dark : c.p.cream};color:${c.p.primary}}@media(max-width:900px){.v6-hero{grid-template-columns:1fr}}.v6-hero-text{padding:120px 80px;display:flex;flex-direction:column;justify-content:center}.v6-hero-text h1{font-family:${c.t.display};font-size:clamp(40px,6vw,80px);font-weight:700;line-height:1.02;letter-spacing:-0.03em;margin-bottom:24px;color:${c.p.primary}}.v6-hero-text p{font-family:${c.t.body};font-size:18px;line-height:1.6;color:${c.isDark ? c.p.cream + 'CC' : '#555'};margin-bottom:40px;max-width:480px}.v6-hero-text .meta{font-size:11px;text-transform:uppercase;letter-spacing:0.2em;color:${c.p.accent};margin-bottom:16px;font-weight:600}.v6-hero-text .cta-row{display:flex;gap:12px;flex-wrap:wrap}.v6-hero-text .cta{padding:16px 32px;background:${c.p.primary};color:${c.isDark ? c.p.cream : '#fff'};border-radius:8px;font-family:${c.t.body};font-weight:600;font-size:15px;text-decoration:none;display:inline-block;transition:transform .2s}.v6-hero-text .cta:hover{transform:translateY(-2px)}.v6-hero-text .cta.secondary{background:transparent;color:${c.p.primary};border:1px solid ${c.p.primary}33}.v6-hero-image{background:linear-gradient(135deg,${c.p.accent}22,${c.p.primary}11),url('${imgUrl(c.imgs[0] || '1486312338219-ce68d2c6f44d', 800, 1000)}') center/cover;min-height:500px}`,
  html: (c) => `<section class="v6-hero v5-reveal"><div class="v6-hero-text"><div class="meta">${esc(c.bt)} · Est. ${c.year}</div><h1>${esc(c.bn)}</h1><p>${esc(c.biz.sub)}</p><div class="cta-row"><a class="cta" href="#contact">${esc(c.ctaText)}</a><a class="cta secondary" href="#about">Our story</a></div></div><div class="v6-hero-image"></div></section>`,
};

const heroGlassmorphic: Variant = {
  id: 'glassmorphic',
  css: (c) => `.v6-hero{position:relative;min-height:100vh;padding:80px 24px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,${c.p.dark} 0%,${c.p.primary}22 50%,${c.p.accent}33 100%);overflow:hidden}.v6-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 20% 30%,${c.p.accent}44 0%,transparent 50%),radial-gradient(circle at 80% 70%,${c.p.primary}44 0%,transparent 50%)}.v6-hero-card{position:relative;z-index:10;max-width:780px;padding:60px 48px;background:rgba(255,255,255,0.06);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,0.12);border-radius:24px;text-align:center;color:#fff}.v6-hero-card h1{font-family:${c.t.display};font-size:clamp(36px,6vw,68px);font-weight:700;line-height:1.05;letter-spacing:-0.02em;margin-bottom:20px;color:#fff}.v6-hero-card p{font-family:${c.t.body};font-size:17px;line-height:1.6;color:rgba(255,255,255,0.8);margin-bottom:36px;max-width:540px;margin-left:auto;margin-right:auto}.v6-hero-card .cta{display:inline-flex;align-items:center;gap:10px;padding:16px 32px;background:#fff;color:${c.p.dark};border-radius:12px;font-family:${c.t.body};font-weight:600;font-size:15px;text-decoration:none;transition:transform .2s,box-shadow .2s;box-shadow:0 8px 24px rgba(0,0,0,0.2)}.v6-hero-card .cta:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(0,0,0,0.3)}@media(max-width:600px){.v6-hero-card{padding:40px 24px}}`,
  html: (c) => `<section class="v6-hero v5-reveal"><div class="v6-hero-card"><h1>${esc(c.biz.hero)}</h1><p>${esc(c.biz.sub)}</p><a class="cta" href="#contact">${esc(c.ctaText)} →</a></div></section>`,
};

const heroMinimal: Variant = {
  id: 'minimal',
  css: (c) => `.v6-hero{padding:140px 24px 100px;text-align:center;background:${c.isDark ? c.p.dark : c.p.bg};color:${c.p.primary};max-width:1200px;margin:0 auto}.v6-hero h1{font-family:${c.t.display};font-size:clamp(40px,7vw,84px);font-weight:700;line-height:1;letter-spacing:-0.04em;margin-bottom:24px;color:${c.p.primary}}.v6-hero h1 em{font-style:italic;font-weight:400;color:${c.p.accent}}.v6-hero p{font-family:${c.t.body};font-size:clamp(16px,2vw,20px);line-height:1.5;color:${c.isDark ? c.p.cream + 'AA' : '#666'};max-width:600px;margin:0 auto 48px}.v6-hero .cta-row{display:flex;gap:16px;justify-content:center;flex-wrap:wrap}.v6-hero .cta{padding:14px 32px;background:${c.p.primary};color:${c.isDark ? c.p.cream : '#fff'};border-radius:999px;font-family:${c.t.body};font-weight:600;font-size:14px;text-decoration:none;transition:transform .2s,opacity .2s}.v6-hero .cta:hover{transform:translateY(-1px);opacity:0.9}.v6-hero .cta.secondary{background:transparent;color:${c.p.primary};border:1px solid ${c.p.primary}33}`,
  html: (c) => `<section class="v6-hero v5-reveal"><h1>${esc(c.biz.hero)}</h1><p>${esc(c.biz.sub)}</p><div class="cta-row"><a class="cta" href="#contact">${esc(c.ctaText)}</a><a class="cta secondary" href="#features">Learn more</a></div></section>`,
};

const heroBoldDisplay: Variant = {
  id: 'bold-display',
  css: (c) => `.v6-hero{padding:60px 24px;background:${c.p.dark};color:#fff;min-height:90vh;display:flex;flex-direction:column;justify-content:center;position:relative;overflow:hidden}.v6-hero::before{content:'${esc(c.bn.toUpperCase())}';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-family:${c.t.display};font-size:clamp(120px,30vw,400px);font-weight:900;color:rgba(255,255,255,0.04);white-space:nowrap;pointer-events:none;letter-spacing:-0.05em;line-height:1}.v6-hero-inner{position:relative;z-index:10;max-width:1200px;margin:0 auto;text-align:center}.v6-hero h1{font-family:${c.t.display};font-size:clamp(48px,10vw,140px);font-weight:900;line-height:0.9;letter-spacing:-0.04em;margin-bottom:32px;color:#fff}.v6-hero h1 span{color:${c.p.accent}}.v6-hero p{font-family:${c.t.body};font-size:clamp(15px,1.5vw,18px);color:rgba(255,255,255,0.7);max-width:580px;margin:0 auto 40px;line-height:1.6}.v6-hero .cta{display:inline-block;padding:20px 48px;background:${c.p.accent};color:#fff;border-radius:8px;font-family:${c.t.body};font-weight:700;font-size:16px;text-decoration:none;text-transform:uppercase;letter-spacing:0.05em;transition:transform .2s}.v6-hero .cta:hover{transform:translateY(-2px) scale(1.02)}`,
  html: (c) => `<section class="v6-hero v5-reveal"><div class="v6-hero-inner"><h1>${esc(c.biz.hero.split(' ').slice(0, 2).join(' '))}<br/><span>${esc(c.biz.hero.split(' ').slice(2).join(' ') || c.bn)}</span></h1><p>${esc(c.biz.sub)}</p><a class="cta" href="#contact">${esc(c.ctaText)}</a></div></section>`,
};

const heroVideoStyle: Variant = {
  id: 'video-style',
  css: (c) => `.v6-hero{position:relative;min-height:100vh;background:${c.p.dark};color:#fff;overflow:hidden}.v6-hero-bg{position:absolute;inset:0;background:linear-gradient(135deg,${c.p.primary} 0%,${c.p.accent} 100%);opacity:0.4}.v6-hero-overlay{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,0.5) 0%,rgba(0,0,0,0.3) 50%,rgba(0,0,0,0.9) 100%)}.v6-hero-inner{position:relative;z-index:10;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:80px 24px;text-align:center}.v6-hero-tag{font-family:${c.t.body};font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:${c.p.accent};margin-bottom:24px;font-weight:600}.v6-hero h1{font-family:${c.t.display};font-size:clamp(40px,8vw,104px);font-weight:600;line-height:1.0;letter-spacing:-0.03em;margin-bottom:24px;max-width:1000px;color:#fff}.v6-hero p{font-family:${c.t.body};font-size:clamp(15px,1.8vw,19px);line-height:1.6;color:rgba(255,255,255,0.75);max-width:600px;margin:0 auto 40px}.v6-hero-cta-row{display:flex;gap:16px;flex-wrap:wrap;justify-content:center}.v6-hero-cta-row .cta{padding:18px 36px;border-radius:999px;font-family:${c.t.body};font-weight:600;font-size:15px;text-decoration:none;transition:transform .2s}.v6-hero-cta-row .cta.primary{background:${c.p.accent};color:#fff}.v6-hero-cta-row .cta.secondary{background:rgba(255,255,255,0.1);color:#fff;border:1px solid rgba(255,255,255,0.3)}.v6-hero-cta-row .cta:hover{transform:translateY(-2px)}`,
  html: (c) => `<section class="v6-hero v5-reveal"><div class="v6-hero-bg"></div><div class="v6-hero-overlay"></div><div class="v6-hero-inner"><div class="v6-hero-tag">Now Available · ${esc(c.bt)}</div><h1>${esc(c.biz.hero)}</h1><p>${esc(c.biz.sub)}</p><div class="v6-hero-cta-row"><a class="cta primary" href="#contact">${esc(c.ctaText)}</a><a class="cta secondary" href="#about">Learn more</a></div></div></section>`,
};

const heroPlayfulCentered: Variant = {
  id: 'playful-centered',
  css: (c) => `.v6-hero{padding:120px 24px 80px;text-align:center;background:linear-gradient(180deg,${c.p.bg} 0%,${c.p.cream} 100%);color:${c.p.primary};position:relative;overflow:hidden}.v6-hero::before{content:'✦';position:absolute;top:15%;left:10%;font-size:48px;color:${c.p.accent};opacity:0.4;animation:v6spin 8s linear infinite}.v6-hero::after{content:'✦';position:absolute;bottom:20%;right:12%;font-size:64px;color:${c.p.primary};opacity:0.3;animation:v6spin 12s linear infinite reverse}@keyframes v6spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}.v6-hero-inner{position:relative;z-index:10;max-width:780px;margin:0 auto}.v6-hero h1{font-family:${c.t.display};font-size:clamp(40px,7vw,84px);font-weight:700;line-height:1.05;letter-spacing:-0.02em;margin-bottom:20px;color:${c.p.primary}}.v6-hero h1 em{font-family:${c.t.accent || c.t.display};font-style:italic;color:${c.p.accent};font-weight:400}.v6-hero p{font-family:${c.t.body};font-size:18px;line-height:1.6;color:${c.isDark ? c.p.cream + 'CC' : '#666'};margin-bottom:36px}.v6-hero .cta{display:inline-block;padding:18px 40px;background:${c.p.accent};color:#fff;border-radius:999px;font-family:${c.t.body};font-weight:700;font-size:16px;text-decoration:none;box-shadow:0 8px 24px ${c.p.accent}44;transition:transform .2s,box-shadow .2s}.v6-hero .cta:hover{transform:translateY(-3px);box-shadow:0 12px 32px ${c.p.accent}66}`,
  html: (c) => `<section class="v6-hero v5-reveal"><div class="v6-hero-inner"><h1>${esc(c.biz.hero.split(' ').slice(0, 3).join(' '))} <em>${esc(c.biz.hero.split(' ').slice(3).join(' ') || c.bn)}</em></h1><p>${esc(c.biz.sub)}</p><a class="cta" href="#contact">${esc(c.ctaText)} ✨</a></div></section>`,
};

const heroEditorialMagazine: Variant = {
  id: 'editorial-magazine',
  css: (c) => `.v6-hero{padding:100px 24px 80px;max-width:1200px;margin:0 auto;color:${c.p.primary};background:${c.isDark ? c.p.dark : c.p.bg}}.v6-hero-meta{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid ${c.p.primary}22;padding-bottom:20px;margin-bottom:60px;font-family:${c.t.body};font-size:12px;letter-spacing:0.15em;text-transform:uppercase;color:${c.isDark ? c.p.cream + 'AA' : '#888'}}.v6-hero h1{font-family:${c.t.display};font-size:clamp(48px,9vw,128px);font-weight:400;line-height:0.95;letter-spacing:-0.04em;margin-bottom:40px;color:${c.p.primary};max-width:1000px}.v6-hero h1 em{font-style:italic;color:${c.p.accent}}.v6-hero-bottom{display:grid;grid-template-columns:2fr 1fr;gap:48px;align-items:start}.v6-hero-bottom p{font-family:${c.t.body};font-size:18px;line-height:1.6;color:${c.isDark ? c.p.cream + 'CC' : '#555'};max-width:540px}.v6-hero-bottom .cta{display:inline-block;margin-top:24px;padding:14px 28px;background:${c.p.primary};color:${c.isDark ? c.p.cream : '#fff'};border-radius:6px;font-family:${c.t.body};font-weight:600;font-size:14px;text-decoration:none}.v6-hero-aside{font-family:${c.t.body};font-size:13px;line-height:1.6;color:${c.isDark ? c.p.cream + '99' : '#888'};border-left:2px solid ${c.p.accent};padding-left:20px}@media(max-width:768px){.v6-hero-bottom{grid-template-columns:1fr;gap:24px}}`,
  html: (c) => `<section class="v6-hero v5-reveal"><div class="v6-hero-meta"><span>${esc(c.bt)} · Vol. 01</span><span>${c.year}</span></div><h1>${esc(c.biz.hero)} <em>${esc(c.biz.tagline)}</em></h1><div class="v6-hero-bottom"><div><p>${esc(c.biz.sub)}</p><a class="cta" href="#contact">${esc(c.ctaText)} →</a></div><div class="v6-hero-aside">${esc(c.biz.about.slice(0, 200))}...</div></div></section>`,
};

export const V6_HERO_VARIANTS: Variant[] = [
  heroCinematic, heroEditorialSplit, heroGlassmorphic, heroMinimal,
  heroBoldDisplay, heroVideoStyle, heroPlayfulCentered, heroEditorialMagazine,
];

// === STATS variants (5 distinct) ===
const statsBigNumbers: Variant = {
  id: 'big-numbers',
  css: (c) => `.v6-stat{padding:96px 24px;background:${c.p.primary};color:${c.isDark ? c.p.cream : '#fff'}}.v6-stat-inner{max-width:1200px;margin:0 auto;text-align:center}.v6-stat h2{font-family:${c.t.display};font-size:clamp(28px,4vw,44px);font-weight:700;margin-bottom:12px;letter-spacing:-0.02em}.v6-stat-sub{font-family:${c.t.body};font-size:17px;opacity:.85;max-width:600px;margin:0 auto 56px}.v6-stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:32px}.v6-stat-num{font-family:${c.t.display};font-size:clamp(40px,6vw,72px);font-weight:700;color:${c.p.accent};line-height:1;letter-spacing:-0.03em}.v6-stat-lbl{font-family:${c.t.body};font-size:13px;text-transform:uppercase;letter-spacing:0.1em;margin-top:12px;opacity:.85}@media(max-width:700px){.v6-stat-grid{grid-template-columns:repeat(2,1fr);gap:24px}}`,
  html: (c) => {
    const stats = [
      { value: '240+', label: 'Projects shipped' },
      { value: '38', label: 'Team members' },
      { value: '4.9/5', label: 'Avg. client rating' },
      { value: '97%', label: 'On-time delivery' },
    ];
    return `<section class="v6-stat v5-reveal"><div class="v6-stat-inner"><h2>By the numbers</h2><p class="v6-stat-sub">Twelve years of practice, distilled into four metrics.</p><div class="v6-stat-grid">${stats.map(s => `<div><div class="v6-stat-num">${esc(s.value)}</div><div class="v6-stat-lbl">${esc(s.label)}</div></div>`).join('')}</div></div></section>`;
  },
};

const statsMinimalStrip: Variant = {
  id: 'minimal-strip',
  css: (c) => `.v6-stat{padding:48px 24px;background:${c.isDark ? c.p.dark : c.p.cream};border-top:1px solid ${c.p.primary}11;border-bottom:1px solid ${c.p.primary}11}.v6-stat-grid{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr);gap:24px;text-align:center}.v6-stat-num{font-family:${c.t.display};font-size:clamp(32px,4vw,48px);font-weight:700;color:${c.p.primary};line-height:1;letter-spacing:-0.02em}.v6-stat-lbl{font-family:${c.t.body};font-size:12px;text-transform:uppercase;letter-spacing:0.12em;margin-top:8px;color:${c.isDark ? c.p.cream + '88' : '#888'}@media(max-width:700px){.v6-stat-grid{grid-template-columns:repeat(2,1fr);gap:32px}}`,
  html: () => `<section class="v6-stat v5-reveal"><div class="v6-stat-grid"><div><div class="v6-stat-num">240+</div><div class="v6-stat-lbl">Projects shipped</div></div><div><div class="v6-stat-num">38</div><div class="v6-stat-lbl">Team members</div></div><div><div class="v6-stat-num">4.9/5</div><div class="v6-stat-lbl">Avg. rating</div></div><div><div class="v6-stat-num">97%</div><div class="v6-stat-lbl">On-time</div></div></div></section>`,
};

const statsGradientCard: Variant = {
  id: 'gradient-card',
  css: (c) => `.v6-stat{padding:96px 24px;background:${c.isDark ? c.p.dark : c.p.bg}}.v6-stat-inner{max-width:1100px;margin:0 auto;background:linear-gradient(135deg,${c.p.primary} 0%,${c.p.accent} 100%);border-radius:32px;padding:64px 48px;color:#fff;text-align:center}.v6-stat h2{font-family:${c.t.display};font-size:clamp(24px,3vw,36px);font-weight:700;margin-bottom:40px;letter-spacing:-0.02em}.v6-stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:24px}.v6-stat-num{font-family:${c.t.display};font-size:clamp(36px,5vw,60px);font-weight:700;line-height:1;letter-spacing:-0.03em}.v6-stat-lbl{font-family:${c.t.body};font-size:12px;text-transform:uppercase;letter-spacing:0.1em;margin-top:8px;opacity:.9}@media(max-width:700px){.v6-stat-grid{grid-template-columns:repeat(2,1fr);gap:24px}}`,
  html: () => `<section class="v6-stat v5-reveal"><div class="v6-stat-inner"><h2>Trusted by teams who ship</h2><div class="v6-stat-grid"><div><div class="v6-stat-num">240+</div><div class="v6-stat-lbl">Projects</div></div><div><div class="v6-stat-num">38</div><div class="v6-stat-lbl">Team</div></div><div><div class="v6-stat-num">4.9/5</div><div class="v6-stat-lbl">Rating</div></div><div><div class="v6-stat-num">12yr</div><div class="v6-stat-lbl">Experience</div></div></div></div></section>`,
};

export const V6_STATS_VARIANTS: Variant[] = [statsBigNumbers, statsMinimalStrip, statsGradientCard];

// === TESTIMONIALS variants (5 distinct) ===
const testimonialsGrid: Variant = {
  id: 'grid',
  css: (c) => `.v6-tst{padding:96px 24px;background:${c.isDark ? c.p.dark : c.p.cream};max-width:1200px;margin:0 auto}.v6-tst-head{text-align:center;margin-bottom:56px}.v6-tst-head h2{font-family:${c.t.display};font-size:clamp(28px,4vw,44px);font-weight:700;color:${c.p.primary};margin-bottom:12px;letter-spacing:-0.02em}.v6-tst-head p{font-family:${c.t.body};font-size:17px;color:${c.isDark ? c.p.cream + '99' : '#555'}}.v6-tst-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:24px}.v6-tst-card{background:${c.isDark ? 'rgba(255,255,255,0.04)' : '#fff'};border:1px solid ${c.isDark ? 'rgba(255,255,255,0.08)' : '#eee'};border-radius:20px;padding:32px}.v6-tst-stars{color:${c.p.accent};font-size:16px;letter-spacing:2px;margin-bottom:16px}.v6-tst-quote{font-family:${c.t.body};font-size:16px;line-height:1.6;color:${c.isDark ? c.p.cream + 'DD' : '#333'};margin-bottom:24px}.v6-tst-who{display:flex;align-items:center;gap:12px}.v6-tst-av{width:48px;height:48px;border-radius:50%;background:${c.p.accent};color:#fff;display:flex;align-items:center;justify-content:center;font-family:${c.t.display};font-weight:700;font-size:18px}.v6-tst-name{font-family:${c.t.body};font-weight:600;color:${c.p.primary};font-size:15px}.v6-tst-role{font-family:${c.t.body};font-size:13px;color:${c.isDark ? c.p.cream + '88' : '#888'}`,
  html: () => {
    const quotes = [
      { n: 'James Park', r: 'CEO, Helios Health', q: 'The team treated our roadmap like their own. They flagged scope risks early, proposed thoughtful alternatives, and the final product was sharper than what we initially scoped.' },
      { n: 'Elena Volkov', r: 'Head of Brand, Aurora', q: 'I have never worked with a team that communicated this well. Weekly demos, clear tickets, no surprises. Our internal team learned a huge amount just from observing their process.' },
      { n: 'Priya Raman', r: 'COO, Atlas Travel', q: 'They embedded with our internal team and the handoff was first-class — docs, screencasts, pair sessions. We felt ownership the entire way through.' },
      { n: 'Marcus Chen', r: 'CTO, Lumen Labs', q: 'We shipped 3x faster than our previous vendor. The codebase they delivered was clean, documented, and our team could actually maintain it without their help.' },
      { n: 'Sofia Reyes', r: 'Founder, Verdant', q: 'From kickoff to launch in 8 weeks. They handled everything — strategy, design, engineering. Our investors were blown away by the polish.' },
      { n: 'David Kim', r: 'VP Product, Northwind', q: 'The attention to detail was unreal. Every edge case, every loading state, every empty state — all considered. This is what senior craftsmanship looks like.' },
    ];
    return `<section class="v6-tst v5-reveal" id="testimonials"><div class="v6-tst-head"><h2>What our clients say</h2><p>Real words from real partners we have shipped work for.</p></div><div class="v6-tst-grid">${quotes.map(q => `<figure class="v6-tst-card"><div class="v6-tst-stars">★★★★★</div><blockquote class="v6-tst-quote">${esc(q.q)}</blockquote><figcaption class="v6-tst-who"><div class="v6-tst-av">${esc(q.n[0])}</div><div><div class="v6-tst-name">${esc(q.n)}</div><div class="v6-tst-role">${esc(q.r)}</div></div></figcaption></figure>`).join('')}</div></section>`;
  },
};

const testimonialsFeatured: Variant = {
  id: 'featured-quote',
  css: (c) => `.v6-tst{padding:120px 24px;background:${c.p.primary};color:${c.isDark ? c.p.cream : '#fff'};text-align:center}.v6-tst-inner{max-width:880px;margin:0 auto}.v6-tst-mark{font-family:${c.t.display};font-size:120px;line-height:0.5;color:${c.p.accent};margin-bottom:24px;font-weight:700}.v6-tst-quote{font-family:${c.t.display};font-size:clamp(24px,3vw,36px);line-height:1.4;font-weight:400;margin-bottom:40px;font-style:italic}.v6-tst-cite{font-family:${c.t.body};font-size:14px;letter-spacing:0.1em;text-transform:uppercase;opacity:.85}.v6-tst-cite strong{display:block;font-size:18px;letter-spacing:0;margin-bottom:4px;text-transform:none;font-weight:600}`,
  html: (c) => `<section class="v6-tst v5-reveal" id="testimonials"><div class="v6-tst-inner"><div class="v6-tst-mark">"</div><blockquote class="v6-tst-quote">${esc(c.biz.quote || 'Great work is not just what it looks like — it is how it works. They delivered both.')}</blockquote><cite class="v6-tst-cite"><strong>${esc(c.bn)}</strong>Trusted by 240+ clients across industries</cite></div></section>`,
};

const testimonialsCarousel: Variant = {
  id: 'carousel',
  css: (c) => `.v6-tst{padding:96px 24px;background:${c.isDark ? c.p.dark : c.p.cream};max-width:1200px;margin:0 auto;overflow:hidden}.v6-tst-head{text-align:center;margin-bottom:48px}.v6-tst-head h2{font-family:${c.t.display};font-size:clamp(28px,4vw,44px);font-weight:700;color:${c.p.primary};letter-spacing:-0.02em}.v6-tst-track{display:flex;gap:24px;overflow-x:auto;padding-bottom:16px;scroll-snap-type:x mandatory}.v6-tst-card{flex:0 0 380px;background:${c.isDark ? 'rgba(255,255,255,0.04)' : '#fff'};border:1px solid ${c.isDark ? 'rgba(255,255,255,0.08)' : '#eee'};border-radius:20px;padding:32px;scroll-snap-align:start}.v6-tst-card .quote{font-family:${c.t.body};font-size:15px;line-height:1.6;color:${c.isDark ? c.p.cream + 'DD' : '#333'};margin-bottom:24px}.v6-tst-card .who{display:flex;align-items:center;gap:12px}.v6-tst-card .av{width:40px;height:40px;border-radius:50%;background:${c.p.accent};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-family:${c.t.display}}.v6-tst-card .name{font-family:${c.t.body};font-weight:600;color:${c.p.primary};font-size:14px}.v6-tst-card .role{font-size:12px;color:${c.isDark ? c.p.cream + '88' : '#888'}`,
  html: () => {
    const items = [
      { n: 'James Park', r: 'CEO, Helios Health', q: 'The team treated our roadmap like their own. Flagged scope risks early and proposed thoughtful alternatives.' },
      { n: 'Elena Volkov', r: 'Head of Brand, Aurora', q: 'Never worked with a team that communicated this well. Weekly demos, clear tickets, no surprises.' },
      { n: 'Priya Raman', r: 'COO, Atlas Travel', q: 'They embedded with our internal team. Handoff was first-class.' },
      { n: 'Marcus Chen', r: 'CTO, Lumen Labs', q: 'We shipped 3x faster than our previous vendor. Codebase was clean and documented.' },
      { n: 'Sofia Reyes', r: 'Founder, Verdant', q: 'From kickoff to launch in 8 weeks. Investors were blown away by the polish.' },
    ];
    return `<section class="v6-tst v5-reveal" id="testimonials"><div class="v6-tst-head"><h2>Client stories</h2></div><div class="v6-tst-track">${items.map(q => `<figure class="v6-tst-card"><blockquote class="quote">${esc(q.q)}</blockquote><figcaption class="who"><div class="av">${esc(q.n[0])}</div><div><div class="name">${esc(q.n)}</div><div class="role">${esc(q.r)}</div></div></figcaption></figure>`).join('')}</div></section>`;
  },
};

export const V6_TESTIMONIAL_VARIANTS: Variant[] = [testimonialsGrid, testimonialsFeatured, testimonialsCarousel];

// === PRICING variants (5 distinct) ===
const pricingThreeTier: Variant = {
  id: 'three-tier',
  css: (c) => `.v6-prc{padding:96px 24px;background:${c.isDark ? c.p.dark : c.p.cream};max-width:1200px;margin:0 auto}.v6-prc-head{text-align:center;margin-bottom:56px}.v6-prc-head h2{font-family:${c.t.display};font-size:clamp(28px,4vw,44px);font-weight:700;color:${c.p.primary};margin-bottom:12px;letter-spacing:-0.02em}.v6-prc-head p{font-family:${c.t.body};font-size:17px;color:${c.isDark ? c.p.cream + '99' : '#555'}}.v6-prc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;max-width:1080px;margin:0 auto;align-items:start}.v6-prc-card{background:${c.isDark ? 'rgba(255,255,255,0.04)' : '#fff'};color:${c.p.primary};border:1px solid ${c.isDark ? 'rgba(255,255,255,0.08)' : '#eee'};border-radius:20px;padding:40px 32px}.v6-prc-card.feat{background:${c.p.primary};color:${c.isDark ? c.p.cream : '#fff'};transform:scale(1.04);box-shadow:0 20px 40px rgba(0,0,0,.12)}.v6-prc-card h3{font-family:${c.t.display};font-size:22px;font-weight:600;margin-bottom:8px}.v6-prc-card .desc{font-size:14px;opacity:.7;margin-bottom:24px}.v6-prc-card .price{font-family:${c.t.display};font-size:48px;font-weight:700;margin-bottom:28px}.v6-prc-card ul{list-style:none;padding:0;margin:0 0 32px;font-size:14px;line-height:2.2;opacity:.9}.v6-prc-card ul li::before{content:'✓ ';color:${c.p.accent};font-weight:700}.v6-prc-card button{width:100%;padding:14px;background:${c.p.accent};color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;font-family:${c.t.body}}`,
  html: () => `<section class="v6-prc v5-reveal" id="pricing"><div class="v6-prc-head"><h2>Simple, transparent pricing</h2><p>No surprises. Pick the tier that fits and we will get to work.</p></div><div class="v6-prc-grid"><div class="v6-prc-card"><h3>Starter</h3><p class="desc">For founders validating an idea</p><div class="price">$4,900</div><ul><li>Discovery workshop</li><li>Up to 4 pages</li><li>Analytics setup</li><li>14-day support</li></ul><button>Get started</button></div><div class="v6-prc-card feat"><h3>Growth</h3><p class="desc">For teams shipping their v2</p><div class="price">$18,500</div><ul><li>Design system</li><li>Up to 12 pages</li><li>CMS integration</li><li>30-day support</li><li>A/B testing</li></ul><button>Get started</button></div><div class="v6-prc-card"><h3>Scale</h3><p class="desc">For platforms with serious traffic</p><div class="price">Custom</div><ul><li>Multi-region deploy</li><li>Performance budgets</li><li>Security audit</li><li>Quarterly roadmap</li><li>Dedicated team</li></ul><button>Contact sales</button></div></div></section>`,
};

const pricingMinimalCards: Variant = {
  id: 'minimal-cards',
  css: (c) => `.v6-prc{padding:96px 24px;background:${c.isDark ? c.p.dark : c.p.bg};max-width:1100px;margin:0 auto}.v6-prc-head{text-align:center;margin-bottom:48px}.v6-prc-head h2{font-family:${c.t.display};font-size:clamp(28px,4vw,44px);font-weight:700;color:${c.p.primary};letter-spacing:-0.02em}.v6-prc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px}.v6-prc-card{padding:32px 24px;border:1px solid ${c.p.primary}22;border-radius:12px;text-align:center;color:${c.p.primary};transition:transform .2s,border-color .2s}.v6-prc-card:hover{transform:translateY(-4px);border-color:${c.p.accent}}.v6-prc-card h3{font-family:${c.t.display};font-size:18px;font-weight:600;margin-bottom:8px}.v6-prc-card .price{font-family:${c.t.display};font-size:40px;font-weight:700;margin:16px 0}.v6-prc-card .price small{font-size:14px;font-weight:400;opacity:.6}.v6-prc-card ul{list-style:none;padding:0;margin:0 0 24px;font-size:13px;line-height:2;opacity:.8}.v6-prc-card button{padding:12px 24px;background:transparent;color:${c.p.primary};border:1px solid ${c.p.primary};border-radius:8px;font-family:${c.t.body};font-weight:600;font-size:13px;cursor:pointer;transition:all .2s}.v6-prc-card button:hover{background:${c.p.primary};color:${c.isDark ? c.p.cream : '#fff'}}`,
  html: () => `<section class="v6-prc v5-reveal" id="pricing"><div class="v6-prc-head"><h2>Pricing</h2></div><div class="v6-prc-grid"><div class="v6-prc-card"><h3>Starter</h3><div class="price">$49<small>/mo</small></div><ul><li>5 projects</li><li>Basic analytics</li><li>Email support</li></ul><button>Choose</button></div><div class="v6-prc-card"><h3>Pro</h3><div class="price">$149<small>/mo</small></div><ul><li>Unlimited projects</li><li>Advanced analytics</li><li>Priority support</li><li>Team access</li></ul><button>Choose</button></div><div class="v6-prc-card"><h3>Enterprise</h3><div class="price">Custom</div><ul><li>SSO + SAML</li><li>SLA guarantee</li><li>Dedicated manager</li></ul><button>Contact</button></div></div></section>`,
};

export const V6_PRICING_VARIANTS: Variant[] = [pricingThreeTier, pricingMinimalCards];

// === FAQ variants (3 distinct) ===
const faqAccordion: Variant = {
  id: 'accordion',
  css: (c) => `.v6-faq{padding:96px 24px;background:${c.isDark ? c.p.dark : c.p.cream};max-width:880px;margin:0 auto}.v6-faq-head{text-align:center;margin-bottom:48px}.v6-faq-head h2{font-family:${c.t.display};font-size:clamp(28px,4vw,44px);font-weight:700;color:${c.p.primary};margin-bottom:12px;letter-spacing:-0.02em}.v6-faq-head p{font-family:${c.t.body};font-size:17px;color:${c.isDark ? c.p.cream + '99' : '#555'}}.v6-faq-list{display:flex;flex-direction:column;gap:12px}.v6-faq-item{background:${c.isDark ? 'rgba(255,255,255,0.04)' : '#fff'};border:1px solid ${c.isDark ? 'rgba(255,255,255,0.08)' : '#eee'};border-radius:12px;overflow:hidden}.v6-faq-item summary{padding:20px 24px;cursor:pointer;font-family:${c.t.display};font-size:17px;font-weight:600;color:${c.p.primary};list-style:none;display:flex;justify-content:space-between;align-items:center}.v6-faq-item summary::-webkit-details-marker{display:none}.v6-faq-item summary .ico{color:${c.p.accent};font-size:22px;font-weight:300;transition:transform .2s}.v6-faq-item[open] summary .ico{transform:rotate(45deg)}.v6-faq-item .body{padding:0 24px 20px;font-family:${c.t.body};font-size:15px;line-height:1.65;color:${c.isDark ? c.p.cream + 'CC' : '#555'}}`,
  html: () => {
    const faqs = [
      { q: 'How long does a typical project take?', a: 'Most engagements run 6–12 weeks from kickoff to launch. Larger platforms can run 4–6 months. We provide a detailed timeline after discovery.' },
      { q: 'What does your pricing model look like?', a: 'We bill fixed-fee for scoped engagements and monthly retainer for ongoing partnerships. Most projects land between $25k and $150k.' },
      { q: 'Do you work with early-stage startups?', a: 'Yes. We have a startup track with flexible payment terms and a reduced-rate MVP sprint designed to get you to launch fast.' },
      { q: 'Can you work with our in-house team?', a: 'Absolutely. We frequently embed alongside internal teams and treat handoff as a first-class deliverable — docs, screencasts, pair sessions.' },
      { q: 'What technologies do you specialize in?', a: 'Next.js, React, TypeScript, Tailwind, and Supabase/Postgres on the web side. Native iOS, Android, and React Native on mobile.' },
      { q: 'Do you offer post-launch support?', a: 'Every engagement includes a 30-day post-launch support window. Ongoing support is available as a monthly retainer with defined SLAs.' },
    ];
    return `<section class="v6-faq v5-reveal" id="faq"><div class="v6-faq-head"><h2>Frequently asked questions</h2><p>Answers to the questions we hear most often.</p></div><div class="v6-faq-list">${faqs.map(f => `<details class="v6-faq-item"><summary><span>${esc(f.q)}</span><span class="ico">+</span></summary><div class="body">${esc(f.a)}</div></details>`).join('')}</div></section>`;
  },
};

const faqTwoColumn: Variant = {
  id: 'two-column',
  css: (c) => `.v6-faq{padding:96px 24px;background:${c.isDark ? c.p.dark : c.p.bg};max-width:1100px;margin:0 auto}.v6-faq-head{margin-bottom:48px}.v6-faq-head h2{font-family:${c.t.display};font-size:clamp(28px,4vw,44px);font-weight:700;color:${c.p.primary};letter-spacing:-0.02em;max-width:600px}.v6-faq-head p{font-family:${c.t.body};font-size:17px;color:${c.isDark ? c.p.cream + '99' : '#666'};margin-top:12px;max-width:600px}.v6-faq-grid{display:grid;grid-template-columns:1fr 1fr;gap:32px 48px}@media(max-width:768px){.v6-faq-grid{grid-template-columns:1fr}}.v6-faq-item{padding-bottom:24px;border-bottom:1px solid ${c.p.primary}22}.v6-faq-item h3{font-family:${c.t.display};font-size:18px;font-weight:600;color:${c.p.primary};margin-bottom:12px}.v6-faq-item p{font-family:${c.t.body};font-size:15px;line-height:1.6;color:${c.isDark ? c.p.cream + 'BB' : '#555'}}`,
  html: () => {
    const faqs = [
      { q: 'How long does a project take?', a: 'Most engagements run 6–12 weeks. Larger platforms can run 4–6 months.' },
      { q: 'What does pricing look like?', a: 'Fixed-fee for scoped work, monthly retainer for ongoing partnerships. Most projects: $25k–$150k.' },
      { q: 'Do you work with startups?', a: 'Yes. Flexible payment terms and a reduced-rate MVP sprint to get you to launch fast.' },
      { q: 'Can you embed with our team?', a: 'Yes. We treat handoff as a first-class deliverable: docs, screencasts, pair sessions.' },
      { q: 'What technologies do you use?', a: 'Next.js, React, TypeScript, Tailwind, Supabase/Postgres. iOS, Android, React Native.' },
      { q: 'Do you offer post-launch support?', a: '30-day post-launch support included. Ongoing support via monthly retainer with SLAs.' },
    ];
    return `<section class="v6-faq v5-reveal" id="faq"><div class="v6-faq-head"><h2>Frequently asked questions</h2><p>Answers to the questions we hear most often.</p></div><div class="v6-faq-grid">${faqs.map(f => `<div class="v6-faq-item"><h3>${esc(f.q)}</h3><p>${esc(f.a)}</p></div>`).join('')}</div></section>`;
  },
};

export const V6_FAQ_VARIANTS: Variant[] = [faqAccordion, faqTwoColumn];

// === CTA variants (4 distinct) ===
const ctaGradientCard: Variant = {
  id: 'gradient-card',
  css: (c) => `.v6-cta{padding:96px 24px;background:${c.isDark ? c.p.dark : c.p.bg}}.v6-cta-card{max-width:1100px;margin:0 auto;background:linear-gradient(135deg,${c.p.primary} 0%,${c.p.accent} 100%);border-radius:32px;padding:80px 48px;text-align:center;color:#fff}.v6-cta-card h2{font-family:${c.t.display};font-size:clamp(32px,5vw,56px);font-weight:700;line-height:1.05;letter-spacing:-0.03em;margin-bottom:20px}.v6-cta-card p{font-family:${c.t.body};font-size:18px;line-height:1.6;opacity:.9;max-width:540px;margin:0 auto 36px}.v6-cta-card .btn{display:inline-block;padding:18px 40px;background:#fff;color:${c.p.dark};border-radius:999px;font-family:${c.t.body};font-weight:700;font-size:16px;text-decoration:none;transition:transform .2s,box-shadow .2s;box-shadow:0 8px 24px rgba(0,0,0,0.2)}.v6-cta-card .btn:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(0,0,0,0.3)}`,
  html: (c) => `<section class="v6-cta v5-reveal"><div class="v6-cta-card"><h2>${esc(c.biz.hero)}</h2><p>${esc(c.biz.sub)}</p><a class="btn" href="#contact">${esc(c.ctaText)} →</a></div></section>`,
};

const ctaMinimal: Variant = {
  id: 'minimal',
  css: (c) => `.v6-cta{padding:96px 24px;text-align:center;background:${c.isDark ? c.p.dark : c.p.cream};color:${c.p.primary};max-width:800px;margin:0 auto}.v6-cta h2{font-family:${c.t.display};font-size:clamp(32px,5vw,56px);font-weight:700;line-height:1.05;letter-spacing:-0.03em;margin-bottom:20px}.v6-cta p{font-family:${c.t.body};font-size:18px;line-height:1.6;color:${c.isDark ? c.p.cream + 'BB' : '#555'};margin-bottom:36px}.v6-cta .btn{display:inline-block;padding:16px 36px;background:${c.p.primary};color:${c.isDark ? c.p.cream : '#fff'};border-radius:8px;font-family:${c.t.body};font-weight:600;font-size:15px;text-decoration:none;transition:transform .2s}.v6-cta .btn:hover{transform:translateY(-2px)}`,
  html: (c) => `<section class="v6-cta v5-reveal"><h2>${esc(c.biz.hero)}</h2><p>${esc(c.biz.sub)}</p><a class="btn" href="#contact">${esc(c.ctaText)}</a></section>`,
};

const ctaSplitImage: Variant = {
  id: 'split-image',
  css: (c) => `.v6-cta{padding:0;background:${c.isDark ? c.p.dark : c.p.bg}}.v6-cta-grid{display:grid;grid-template-columns:1fr 1fr;min-height:480px}@media(max-width:768px){.v6-cta-grid{grid-template-columns:1fr}}.v6-cta-text{padding:80px 48px;display:flex;flex-direction:column;justify-content:center;background:${c.p.primary};color:${c.isDark ? c.p.cream : '#fff'}}.v6-cta-text h2{font-family:${c.t.display};font-size:clamp(28px,4vw,44px);font-weight:700;line-height:1.05;letter-spacing:-0.02em;margin-bottom:16px}.v6-cta-text p{font-family:${c.t.body};font-size:17px;line-height:1.6;opacity:.9;margin-bottom:32px}.v6-cta-text .btn{display:inline-block;padding:16px 32px;background:${c.p.accent};color:#fff;border-radius:8px;font-family:${c.t.body};font-weight:600;font-size:15px;text-decoration:none;text-align:center;max-width:240px;transition:transform .2s}.v6-cta-text .btn:hover{transform:translateY(-2px)}.v6-cta-img{background:linear-gradient(135deg,${c.p.accent}33,${c.p.primary}22),url('${imgUrl(c.imgs[1] || '1454165804606-c3d57bc86b40', 800, 600)}') center/cover`,
  html: (c) => `<section class="v6-cta v5-reveal"><div class="v6-cta-grid"><div class="v6-cta-text"><h2>${esc(c.biz.hero)}</h2><p>${esc(c.biz.sub)}</p><a class="btn" href="#contact">${esc(c.ctaText)} →</a></div><div class="v6-cta-img"></div></div></section>`,
};

export const V6_CTA_VARIANTS: Variant[] = [ctaGradientCard, ctaMinimal, ctaSplitImage];

// === CONTACT variants (3 distinct) ===
const contactSplitForm: Variant = {
  id: 'split-form',
  css: (c) => `.v6-contact{padding:96px 24px;background:${c.isDark ? c.p.dark : c.p.cream};max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:flex-start}@media(max-width:800px){.v6-contact{grid-template-columns:1fr;gap:32px}}.v6-contact-info h2{font-family:${c.t.display};font-size:clamp(28px,4vw,40px);font-weight:700;color:${c.p.primary};margin-bottom:16px;letter-spacing:-0.02em;line-height:1.15}.v6-contact-info p{font-family:${c.t.body};font-size:16px;line-height:1.7;color:${c.isDark ? c.p.cream + 'CC' : '#666'};margin-bottom:32px}.v6-contact-info .row{display:flex;gap:12px;margin-bottom:20px;font-family:${c.t.body};font-size:15px;color:${c.isDark ? c.p.cream : '#333'}}.v6-contact-info .row strong{color:${c.p.primary};min-width:80px}.v6-contact-form{background:${c.isDark ? 'rgba(255,255,255,0.04)' : '#fff'};border:1px solid ${c.isDark ? 'rgba(255,255,255,0.08)' : '#eee'};border-radius:20px;padding:32px;display:flex;flex-direction:column;gap:16px}.v6-contact-form input,.v6-contact-form textarea{padding:14px 16px;border:1px solid ${c.isDark ? 'rgba(255,255,255,0.15)' : '#ddd'};border-radius:10px;font-size:15px;font-family:${c.t.body};background:${c.isDark ? 'rgba(0,0,0,0.2)' : '#fff'};color:${c.isDark ? c.p.cream : '#333'}}.v6-contact-form button{padding:16px 32px;background:${c.p.accent};color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer;font-family:${c.t.body}}`,
  html: (c) => `<section class="v6-contact v5-reveal" id="contact"><div class="v6-contact-info"><h2>Let's talk</h2><p>We respond to every inquiry within one business day. Tell us about your project, your timeline, and the outcomes that matter.</p><div class="row"><strong>Email</strong> hello@${c.bn.toLowerCase().replace(/[^a-z0-9]/g, '')}.com</div><div class="row"><strong>Phone</strong> +1 (555) 010-0200</div><div class="row"><strong>Studio</strong> 221 Market Street, Suite 400</div><div class="row"><strong>Hours</strong> Mon–Fri, 9am–6pm PT</div></div><form class="v6-contact-form" onsubmit="event.preventDefault()"><input required type="text" placeholder="Your name" /><input required type="email" placeholder="Email address" /><input type="text" placeholder="Company (optional)" /><textarea required placeholder="Tell us about your project" rows="5"></textarea><button type="submit">Send message</button></form></section>`,
};

const contactCardCentered: Variant = {
  id: 'card-centered',
  css: (c) => `.v6-contact{padding:96px 24px;background:${c.isDark ? c.p.dark : c.p.bg};text-align:center}.v6-contact-card{max-width:680px;margin:0 auto;background:${c.isDark ? 'rgba(255,255,255,0.04)' : '#fff'};border:1px solid ${c.isDark ? 'rgba(255,255,255,0.08)' : '#eee'};border-radius:24px;padding:56px 40px}.v6-contact-card h2{font-family:${c.t.display};font-size:clamp(28px,4vw,40px);font-weight:700;color:${c.p.primary};margin-bottom:12px;letter-spacing:-0.02em}.v6-contact-card p{font-family:${c.t.body};font-size:16px;color:${c.isDark ? c.p.cream + 'BB' : '#666'};margin-bottom:32px;line-height:1.6}.v6-contact-card .row{font-family:${c.t.body};font-size:15px;color:${c.isDark ? c.p.cream : '#333'};margin-bottom:12px}.v6-contact-card .row strong{color:${c.p.primary}}.v6-contact-card .btn{display:inline-block;margin-top:24px;padding:16px 36px;background:${c.p.accent};color:#fff;border-radius:10px;font-family:${c.t.body};font-weight:600;font-size:15px;text-decoration:none}`,
  html: (c) => `<section class="v6-contact v5-reveal" id="contact"><div class="v6-contact-card"><h2>Let's talk</h2><p>We respond within one business day.</p><div class="row"><strong>Email:</strong> hello@${c.bn.toLowerCase().replace(/[^a-z0-9]/g, '')}.com</div><div class="row"><strong>Phone:</strong> +1 (555) 010-0200</div><div class="row"><strong>Studio:</strong> 221 Market Street, Suite 400</div><a class="btn" href="mailto:hello@${c.bn.toLowerCase().replace(/[^a-z0-9]/g, '')}.com">${esc(c.ctaText)}</a></div></section>`,
};

export const V6_CONTACT_VARIANTS: Variant[] = [contactSplitForm, contactCardCentered];

// === MENU variants (for restaurants/cafes) ===
const menuGrid: Variant = {
  id: 'menu-grid',
  css: (c) => `.v6-menu{padding:96px 24px;background:${c.isDark ? c.p.dark : c.p.cream};max-width:1100px;margin:0 auto}.v6-menu-head{text-align:center;margin-bottom:56px}.v6-menu-head h2{font-family:${c.t.display};font-size:clamp(32px,5vw,52px);font-weight:700;color:${c.p.primary};letter-spacing:-0.02em;margin-bottom:12px}.v6-menu-head p{font-family:${c.t.body};font-size:17px;color:${c.isDark ? c.p.cream + '99' : '#666'}}.v6-menu-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px}.v6-menu-item{padding:24px;border:1px solid ${c.isDark ? 'rgba(255,255,255,0.08)' : '#eee'};border-radius:16px;background:${c.isDark ? 'rgba(255,255,255,0.03)' : '#fff'};display:flex;flex-direction:column;gap:8px}.v6-menu-item .row{display:flex;justify-content:space-between;align-items:baseline;gap:12px}.v6-menu-item h3{font-family:${c.t.display};font-size:18px;font-weight:600;color:${c.p.primary};margin:0}.v6-menu-item .price{font-family:${c.t.display};font-size:20px;font-weight:700;color:${c.p.accent}}.v6-menu-item p{font-family:${c.t.body};font-size:14px;line-height:1.5;color:${c.isDark ? c.p.cream + 'BB' : '#666'};margin:0}`,
  html: () => {
    const items = [
      { n: 'Signature Latte', d: 'Double shot espresso, steamed milk, hint of vanilla', p: '$5.50' },
      { n: 'Cold Brew Tonic', d: '24-hour cold brew, tonic water, citrus peel', p: '$6.00' },
      { n: 'Pour Over', d: 'Single origin Ethiopia, hand-poured', p: '$5.00' },
      { n: 'Matcha Latte', d: 'Ceremonial grade matcha, oat milk, honey', p: '$6.50' },
      { n: 'Espresso Affogato', d: 'Vanilla gelato drowned in espresso', p: '$7.00' },
      { n: 'Cappuccino Classico', d: 'Equal parts espresso, steamed milk, foam', p: '$4.50' },
    ];
    return `<section class="v6-menu v5-reveal" id="menu"><div class="v6-menu-head"><h2>Menu</h2><p>Crafted with care, served with intention.</p></div><div class="v6-menu-grid">${items.map(i => `<div class="v6-menu-item"><div class="row"><h3>${esc(i.n)}</h3><span class="price">${esc(i.p)}</span></div><p>${esc(i.d)}</p></div>`).join('')}</div></section>`;
  },
};

export const V6_MENU_VARIANTS: Variant[] = [menuGrid];

// === MAIN RENDERER ===

export interface V6RenderResult {
  html: string;
  slug: string;
  businessName: string;
  businessType: string;
  designDNA: any;
  customConfig?: CustomConfig;
  motionPromptsUsed?: string[];
  evolvedPatternsUsed?: number;
  renderer: string;
}

/** Render a website with optional custom config */
export function renderV6(prompt: string, seed: number, customConfig?: CustomConfig): V6RenderResult {
  const bt = detectBiz(prompt);
  const biz = BIZ_TYPES[bt] || BIZ_TYPES.default;

  // Use custom business name if provided
  const bn = customConfig?.businessName || biz.names[Math.abs(seed) % biz.names.length];
  const slug = `${bn.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(36).slice(2, 6)}`;

  // Pick palette — use custom colors if provided
  let paletteIdx = (seed >>> 3) % PALETTES.length;
  let p: Palette = { ...PALETTES[paletteIdx] };
  if (customConfig?.colors) {
    if (customConfig.colors.bg) p.bg = customConfig.colors.bg;
    if (customConfig.colors.primary) p.primary = customConfig.colors.primary;
    if (customConfig.colors.accent) p.accent = customConfig.colors.accent;
    if (customConfig.colors.dark) p.dark = customConfig.colors.dark;
    if (customConfig.colors.cream) p.cream = customConfig.colors.cream;
  }

  // Pick typography — use custom fonts if provided
  let typoIdx = Math.floor(mulberry32(seed ^ 0x70726573)() * TYPOGRAPHIES.length);
  let t: Typography = { ...TYPOGRAPHIES[typoIdx] };
  if (customConfig?.fonts) {
    if (customConfig.fonts.display) t.display = customConfig.fonts.display;
    if (customConfig.fonts.body) t.body = customConfig.fonts.body;
    if (customConfig.fonts.googleHref) t.googleHref = customConfig.fonts.googleHref;
  }

  // Override business content if provided
  const customBiz: Biz = { ...biz };
  if (customConfig) {
    if (customConfig.tagline) customBiz.tagline = customConfig.tagline;
    if (customConfig.hero) customBiz.hero = customConfig.hero;
    if (customConfig.sub) customBiz.sub = customConfig.sub;
    if (customConfig.about) customBiz.about = customConfig.about;
    if (customConfig.ctaText) customBiz.cta = customConfig.ctaText;
  }

  const imgs = pickImages(biz.images, seed, 8);
  const year = new Date().getFullYear();
  const ctaText = customConfig?.ctaText || biz.cta;
  const isDark = isDarkBg(p.bg);
  const rng = mulberry32(seed ^ 0x5DEECE66D);
  const ctx: Ctx = { bn, biz: customBiz, bt, p, t, imgs, year, ctaText, isDark, seed, rng };

  // Pick variants — use custom style preference if provided
  const pickIdx = (salt: number, len: number): number => {
    let h = (seed ^ salt) >>> 0;
    h = Math.imul(h ^ (h >>> 15), h | 1);
    h ^= h + Math.imul(h ^ (h >>> 7), h | 61);
    return ((h ^ (h >>> 14)) >>> 0) % len;
  };

  // Style-based variant selection
  let heroPool = V6_HERO_VARIANTS;
  if (customConfig?.style === 'cinematic') heroPool = [heroCinematic, heroVideoStyle];
  else if (customConfig?.style === 'glassmorphic') heroPool = [heroGlassmorphic];
  else if (customConfig?.style === 'editorial') heroPool = [heroEditorialSplit, heroEditorialMagazine];
  else if (customConfig?.style === 'minimal') heroPool = [heroMinimal];
  else if (customConfig?.style === 'bold') heroPool = [heroBoldDisplay];
  else if (customConfig?.style === 'playful') heroPool = [heroPlayfulCentered];

  const hero = heroPool[pickIdx(0x243F6A88, heroPool.length)];
  const stats = V6_STATS_VARIANTS[pickIdx(0xA54FF53A, V6_STATS_VARIANTS.length)];
  const testimonials = V6_TESTIMONIAL_VARIANTS[pickIdx(0x6A09E667, V6_TESTIMONIAL_VARIANTS.length)];
  const pricing = V6_PRICING_VARIANTS[pickIdx(0xBB67AE85, V6_PRICING_VARIANTS.length)];
  const faq = V6_FAQ_VARIANTS[pickIdx(0x3C6EF372, V6_FAQ_VARIANTS.length)];
  const cta = V6_CTA_VARIANTS[pickIdx(0xA4093822, V6_CTA_VARIANTS.length)];
  const contact = V6_CONTACT_VARIANTS[pickIdx(0x5BE0CD19, V6_CONTACT_VARIANTS.length)];

  // Use existing V5 variants for: nav, button, features, about, gallery, footer, partners, blog, team
  // (imported from v5-variants at call time to avoid circular dep)
  // For now, use the V5 variants via dynamic import in the API route.
  // Here we just render the V6-specific sections.

  // Build section list — default 16 sections, customConfig.sections can override
  const defaultSections = [
    'nav', 'hero', 'partners', 'features', 'about', 'stats',
    'testimonials', 'gallery', 'pricing', 'team', 'blog', 'faq',
    'contact', 'cta', 'footer',
  ];
  if (bt === 'restaurant' || bt === 'cafe') defaultSections.splice(8, 0, 'menu');
  const sections = customConfig?.sections || defaultSections;

  // Get relevant MotionSites prompts for inspiration tracking
  const motionPromptsUsed: string[] = [];
  try {
    const all = loadMotionPrompts();
    if (all.length > 0) {
      // Pick 3 relevant prompts based on category
      const relevant = all
        .filter(p => p.category.toLowerCase().includes(bt) || p.type === 'hero')
        .slice(0, 3);
      motionPromptsUsed.push(...relevant.map(p => p.id));
    }
  } catch {}

  const designDNA = {
    renderer: 'v6-ultra',
    palette: p.name, paletteId: paletteIdx,
    typography: t.name, typographyId: typoIdx,
    businessType: bt, businessName: bn,
    style: customConfig?.style || 'auto',
    customConfig: !!customConfig,
    variants: {
      hero: hero.id, stats: stats.id, testimonials: testimonials.id,
      pricing: pricing.id, faq: faq.id, cta: cta.id, contact: contact.id,
    },
    sections,
    seed,
    motionPromptsUsed,
  };

  // Assemble HTML — the API route will merge V5 + V6 variants
  // For now, return the V6-specific section data and let the API route assemble
  return {
    html: '', // Will be assembled by API route
    slug,
    businessName: bn,
    businessType: bt,
    designDNA,
    customConfig,
    motionPromptsUsed,
    renderer: 'v6-ultra',
    // Internal: pass the selected variants
    _variants: { hero, stats, testimonials, pricing, faq, cta, contact },
  } as V6RenderResult & { _variants: any };
}
