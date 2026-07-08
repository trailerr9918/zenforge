/**
 * V5 Pro Premium Section Variants
 * All hero, features, about, gallery, cta, footer, plus new sections
 * (testimonials, pricing, faq, stats, partners, blog, team, contact)
 */
import {
  type Ctx, type Variant, type Palette, type Typography, type Biz,
  PALETTES, TYPOGRAPHIES, BIZ_TYPES, detectBiz, mulberry32, pickImages, imgUrl, esc, isDarkBg, sharedCss, BUTTON_VARIANTS, NAV_VARIANTS,
} from './v5-core';

// ============================================================================
// HERO VARIANTS (8)
// ============================================================================
function heroBase(ctx: Ctx): string {
  return `.v5-hero{padding:120px 24px 80px;max-width:1200px;margin:0 auto;text-align:center}.v5-hero-tag{display:inline-block;padding:6px 14px;background:${ctx.isDark ? 'rgba(255,255,255,0.06)' : ctx.p.primary + '11'};border:1px solid ${ctx.p.accent}33;border-radius:99px;font-family:${ctx.t.body};font-size:12px;color:${ctx.p.accent};font-weight:600;letter-spacing:0.05em;text-transform:uppercase;margin-bottom:24px}.v5-hero-title{font-family:${ctx.t.display};font-size:clamp(36px,6vw,68px);font-weight:700;color:${ctx.p.primary};line-height:1.1;letter-spacing:-0.02em;margin-bottom:20px}.v5-hero-sub{font-family:${ctx.t.body};font-size:clamp(16px,2vw,20px);color:${ctx.isDark ? ctx.p.cream + 'CC' : ctx.p.primary + '99'};max-width:640px;margin:0 auto 32px;line-height:1.6}`;
}

const heroFullBleed: Variant = {
  id: 'full-bleed',
  css: heroBase,
  html: (c) => `<section class="v5-hero v5-reveal" id="home"><span class="v5-hero-tag">${esc(c.biz.tagline)}</span><h1 class="v5-hero-title">${esc(c.biz.hero)}</h1><p class="v5-hero-sub">${esc(c.biz.sub)}</p><button class="v5-btn">${esc(c.ctaText)}</button></section>`,
};

const heroSplitLeft: Variant = {
  id: 'split-left',
  css: (c) => heroBase(c) + `.v5-hero{display:grid;grid-template-columns:1.2fr 1fr;gap:48px;align-items:center;text-align:left;padding:100px 24px}.v5-hero-sub{margin-left:0}.v5-hero-img{aspect-ratio:4/5;background:url('${imgUrl(c.imgs[0] || '1499750310107-5fef28a66643', 600, 750)}') center/cover;border-radius:24px;box-shadow:0 24px 48px rgba(0,0,0,0.15)}@media(max-width:900px){.v5-hero{grid-template-columns:1fr;text-align:center;padding:60px 24px}.v5-hero-sub{margin:0 auto 32px}}`,
  html: (c) => `<section class="v5-hero v5-reveal" id="home"><div><span class="v5-hero-tag">${esc(c.biz.tagline)}</span><h1 class="v5-hero-title">${esc(c.biz.hero)}</h1><p class="v5-hero-sub">${esc(c.biz.sub)}</p><button class="v5-btn">${esc(c.ctaText)}</button></div><div class="v5-hero-img"></div></section>`,
};

const heroSplitRight: Variant = {
  id: 'split-right',
  css: (c) => heroSplitLeft.css(c) + `.v5-hero{grid-template-columns:1fr 1.2fr}`,
  html: (c) => `<section class="v5-hero v5-reveal" id="home"><div class="v5-hero-img"></div><div><span class="v5-hero-tag">${esc(c.biz.tagline)}</span><h1 class="v5-hero-title">${esc(c.biz.hero)}</h1><p class="v5-hero-sub">${esc(c.biz.sub)}</p><button class="v5-btn">${esc(c.ctaText)}</button></div></section>`,
};

const heroCenteredMinimal: Variant = {
  id: 'centered-minimal',
  css: (c) => heroBase(c) + `.v5-hero{padding:160px 24px 100px;max-width:900px}.v5-hero-title{font-size:clamp(40px,7vw,80px)}`,
  html: (c) => `<section class="v5-hero v5-reveal" id="home"><h1 class="v5-hero-title">${esc(c.biz.hero)}</h1><p class="v5-hero-sub">${esc(c.biz.sub)}</p><button class="v5-btn">${esc(c.ctaText)}</button></section>`,
};

const heroOffsetCard: Variant = {
  id: 'offset-card',
  css: (c) => heroBase(c) + `.v5-hero{padding:80px 24px;max-width:1100px;text-align:left}.v5-hero-card{background:${c.isDark ? c.p.dark : '#fff'};border:1px solid ${c.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'};border-radius:24px;padding:48px;margin-left:8%;box-shadow:0 24px 48px rgba(0,0,0,0.1)}@media(max-width:900px){.v5-hero-card{margin-left:0;padding:32px}}`,
  html: (c) => `<section class="v5-hero v5-reveal" id="home"><div class="v5-hero-card"><span class="v5-hero-tag">${esc(c.biz.tagline)}</span><h1 class="v5-hero-title">${esc(c.biz.hero)}</h1><p class="v5-hero-sub" style="margin-left:0">${esc(c.biz.sub)}</p><button class="v5-btn">${esc(c.ctaText)}</button></div></section>`,
};

const heroDiagonal: Variant = {
  id: 'diagonal',
  css: (c) => heroBase(c) + `.v5-hero{padding:140px 24px 120px;clip-path:polygon(0 0,100% 0,100% 85%,0 100%);background:linear-gradient(135deg,${c.p.bg} 0%,${c.p.accent}11 100%);max-width:none}.v5-hero>div{max-width:900px;margin:0 auto}`,
  html: (c) => `<section class="v5-hero v5-reveal" id="home"><div><span class="v5-hero-tag">${esc(c.biz.tagline)}</span><h1 class="v5-hero-title">${esc(c.biz.hero)}</h1><p class="v5-hero-sub">${esc(c.biz.sub)}</p><button class="v5-btn">${esc(c.ctaText)}</button></div></section>`,
};

const heroMagazine: Variant = {
  id: 'magazine',
  css: (c) => heroBase(c) + `.v5-hero{padding:100px 24px 80px;text-align:left;max-width:1200px}.v5-hero-title{font-size:clamp(48px,9vw,120px);line-height:0.95;letter-spacing:-0.04em}.v5-hero-tag{margin-bottom:32px}`,
  html: (c) => `<section class="v5-hero v5-reveal" id="home"><span class="v5-hero-tag">${esc(c.biz.tagline)}</span><h1 class="v5-hero-title">${esc(c.biz.hero)}</h1><p class="v5-hero-sub" style="margin-left:0">${esc(c.biz.sub)}</p><button class="v5-btn">${esc(c.ctaText)}</button></section>`,
};

const heroVideoBg: Variant = {
  id: 'video-bg',
  css: (c) => heroBase(c) + `.v5-hero{padding:160px 24px;position:relative;max-width:none;background:linear-gradient(rgba(0,0,0,0.4),rgba(0,0,0,0.4)),url('${imgUrl(c.imgs[0] || '1499750310107-5fef28a66643', 1920, 1080)}') center/cover;color:#fff}.v5-hero-title,.v5-hero-sub,.v5-hero-tag{color:#fff}.v5-hero>div{max-width:900px;margin:0 auto;text-align:center}.v5-hero-tag{background:rgba(255,255,255,0.15);border-color:rgba(255,255,255,0.3)}.v5-hero-sub{color:rgba(255,255,255,0.85)}`,
  html: (c) => `<section class="v5-hero v5-reveal" id="home"><div><span class="v5-hero-tag">${esc(c.biz.tagline)}</span><h1 class="v5-hero-title">${esc(c.biz.hero)}</h1><p class="v5-hero-sub">${esc(c.biz.sub)}</p><button class="v5-btn">${esc(c.ctaText)}</button></div></section>`,
};

const HERO_VARIANTS: Variant[] = [heroFullBleed, heroSplitLeft, heroSplitRight, heroCenteredMinimal, heroOffsetCard, heroDiagonal, heroMagazine, heroVideoBg];

// ============================================================================
// FEATURE VARIANTS (6)
// ============================================================================
function featureBase(c: Ctx): string {
  return `.v5-feat{padding:96px 24px;max-width:1200px;margin:0 auto}.v5-feat-head{text-align:center;margin-bottom:56px}.v5-feat-head h2{font-family:${c.t.display};font-size:clamp(28px,4vw,44px);font-weight:700;color:${c.p.primary};margin-bottom:12px;letter-spacing:-0.02em}.v5-feat-head p{font-family:${c.t.body};font-size:17px;color:${c.isDark ? c.p.cream + '99' : '#666'}}`;
}

const featCardGrid: Variant = {
  id: 'card-grid',
  css: (c) => featureBase(c) + `.v5-feat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px}.v5-feat-card{background:${c.isDark ? 'rgba(255,255,255,0.04)' : '#fff'};border:1px solid ${c.isDark ? 'rgba(255,255,255,0.08)' : '#eee'};border-radius:16px;padding:32px;transition:transform .3s,box-shadow .3s}.v5-feat-card:hover{transform:translateY(-4px);box-shadow:0 12px 32px rgba(0,0,0,.08)}.v5-feat-card h3{font-family:${c.t.display};font-size:20px;font-weight:600;color:${c.p.primary};margin-bottom:12px}.v5-feat-card p{font-family:${c.t.body};font-size:15px;color:${c.isDark ? c.p.cream + 'CC' : '#666'};line-height:1.6}.v5-feat-ico{width:48px;height:48px;border-radius:12px;background:${c.p.accent}22;color:${c.p.accent};display:flex;align-items:center;justify-content:center;font-size:24px;margin-bottom:20px}`,
  html: (c) => `<section class="v5-feat v5-reveal" id="features"><div class="v5-feat-head"><h2>What we offer</h2><p>Everything you need, nothing you don't.</p></div><div class="v5-feat-grid">${c.biz.features.map((f) => `<div class="v5-feat-card"><div class="v5-feat-ico">${featIcon(f[0])}</div><h3>${esc(f[1])}</h3><p>${esc(f[2])}</p></div>`).join('')}</div></section>`,
};

const featNumberedStack: Variant = {
  id: 'numbered-stack',
  css: (c) => featureBase(c) + `.v5-feat-stack{display:flex;flex-direction:column;gap:0}.v5-feat-row{display:grid;grid-template-columns:80px 1fr;gap:24px;padding:32px 0;border-bottom:1px solid ${c.isDark ? 'rgba(255,255,255,0.08)' : '#eee'}.v5-feat-row:last-child{border-bottom:none}.v5-feat-num{font-family:${c.t.display};font-size:48px;font-weight:700;color:${c.p.accent};line-height:1}.v5-feat-row h3{font-family:${c.t.display};font-size:22px;font-weight:600;color:${c.p.primary};margin-bottom:8px}.v5-feat-row p{font-family:${c.t.body};font-size:15px;color:${c.isDark ? c.p.cream + 'CC' : '#666'};line-height:1.6}`,
  html: (c) => `<section class="v5-feat v5-reveal" id="features"><div class="v5-feat-head"><h2>How we work</h2><p>A clear path from start to finish.</p></div><div class="v5-feat-stack">${c.biz.features.map((f, i) => `<div class="v5-feat-row"><div class="v5-feat-num">0${i + 1}</div><div><h3>${esc(f[1])}</h3><p>${esc(f[2])}</p></div></div>`).join('')}</div></section>`,
};

const featBentoGrid: Variant = {
  id: 'bento-grid',
  css: (c) => featureBase(c) + `.v5-feat-bento{display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(2,200px);gap:16px}.v5-feat-bento-item{background:${c.isDark ? 'rgba(255,255,255,0.04)' : '#fff'};border:1px solid ${c.isDark ? 'rgba(255,255,255,0.08)' : '#eee'};border-radius:16px;padding:24px;display:flex;flex-direction:column;justify-content:space-between}.v5-feat-bento-item:first-child{grid-column:span 2;grid-row:span 2;background:${c.p.primary};color:#fff}.v5-feat-bento-item:first-child h3{color:#fff}.v5-feat-bento-item:first-child p{color:rgba(255,255,255,0.85)}.v5-feat-bento-item h3{font-family:${c.t.display};font-size:18px;font-weight:600;color:${c.p.primary};margin-bottom:8px}.v5-feat-bento-item p{font-family:${c.t.body};font-size:13px;color:${c.isDark ? c.p.cream + 'CC' : '#666'};line-height:1.5}.v5-feat-bento-item .ico{font-size:24px}@media(max-width:768px){.v5-feat-bento{grid-template-columns:1fr;grid-template-rows:auto}}`,
  html: (c) => `<section class="v5-feat v5-reveal" id="features"><div class="v5-feat-head"><h2>What we do</h2></div><div class="v5-feat-bento">${c.biz.features.map((f, i) => `<div class="v5-feat-bento-item"><div class="ico">${featIcon(f[0])}</div><div><h3>${esc(f[1])}</h3><p>${esc(f[2])}</p></div></div>`).join('')}</div></section>`,
};

const featIconRow: Variant = {
  id: 'icon-row',
  css: (c) => featureBase(c) + `.v5-feat-row-list{display:flex;justify-content:center;gap:48px;flex-wrap:wrap}.v5-feat-icon-item{text-align:center;max-width:200px}.v5-feat-icon-item .ico{width:64px;height:64px;border-radius:50%;background:${c.p.accent}22;color:${c.p.accent};display:flex;align-items:center;justify-content:center;font-size:28px;margin:0 auto 16px}.v5-feat-icon-item h3{font-family:${c.t.display};font-size:16px;font-weight:600;color:${c.p.primary};margin-bottom:6px}.v5-feat-icon-item p{font-family:${c.t.body};font-size:13px;color:${c.isDark ? c.p.cream + 'CC' : '#666'};line-height:1.5}`,
  html: (c) => `<section class="v5-feat v5-reveal" id="features"><div class="v5-feat-head"><h2>Our services</h2></div><div class="v5-feat-row-list">${c.biz.features.map((f) => `<div class="v5-feat-icon-item"><div class="ico">${featIcon(f[0])}</div><h3>${esc(f[1])}</h3><p>${esc(f[2])}</p></div>`).join('')}</div></section>`,
};

const featAlternating: Variant = {
  id: 'alternating',
  css: (c) => featureBase(c) + `.v5-feat-alt{display:flex;flex-direction:column;gap:64px}.v5-feat-alt-item{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center}.v5-feat-alt-item:nth-child(even){direction:rtl}.v5-feat-alt-item:nth-child(even) > *{direction:ltr}.v5-feat-alt-text h3{font-family:${c.t.display};font-size:24px;font-weight:600;color:${c.p.primary};margin-bottom:12px}.v5-feat-alt-text p{font-family:${c.t.body};font-size:16px;color:${c.isDark ? c.p.cream + 'CC' : '#666'};line-height:1.6}.v5-feat-alt-img{aspect-ratio:4/3;background:url('${imgUrl(c.imgs[1] || '1454165804606-c3d57bc86b40', 600, 450)}') center/cover;border-radius:16px}@media(max-width:768px){.v5-feat-alt-item{grid-template-columns:1fr;direction:ltr}}`,
  html: (c) => `<section class="v5-feat v5-reveal" id="features"><div class="v5-feat-head"><h2>Built different</h2></div><div class="v5-feat-alt">${c.biz.features.map((f, i) => `<div class="v5-feat-alt-item"><div class="v5-feat-alt-text"><h3>${esc(f[1])}</h3><p>${esc(f[2])}</p></div><div class="v5-feat-alt-img" style="background-image:url('${imgUrl(c.imgs[i % c.imgs.length] || '1454165804606-c3d57bc86b40', 600, 450)}')"></div></div>`).join('')}</div></section>`,
};

const featMinimalList: Variant = {
  id: 'minimal-list',
  css: (c) => featureBase(c) + `.v5-feat-list{max-width:760px;margin:0 auto}.v5-feat-list-item{display:flex;gap:24px;padding:24px 0;border-bottom:1px solid ${c.isDark ? 'rgba(255,255,255,0.08)' : '#eee'};align-items:flex-start}.v5-feat-list-item:last-child{border-bottom:none}.v5-feat-list-item .ico{color:${c.p.accent};font-size:20px;flex-shrink:0;margin-top:2px}.v5-feat-list-item h3{font-family:${c.t.display};font-size:18px;font-weight:600;color:${c.p.primary};margin-bottom:6px}.v5-feat-list-item p{font-family:${c.t.body};font-size:14px;color:${c.isDark ? c.p.cream + 'CC' : '#666'};line-height:1.6}`,
  html: (c) => `<section class="v5-feat v5-reveal" id="features"><div class="v5-feat-head"><h2>What sets us apart</h2></div><div class="v5-feat-list">${c.biz.features.map((f) => `<div class="v5-feat-list-item"><div class="ico">${featIcon(f[0])}</div><div><h3>${esc(f[1])}</h3><p>${esc(f[2])}</p></div></div>`).join('')}</div></section>`,
};

function featIcon(name: string): string {
  const icons: Record<string, string> = {
    coffee: '☕', pastry: '🥐', toast: '🥂', utensils: '🍴', wine: '🍷', chef: '👨‍🍳',
    code: '⌨️', palette: '🎨', zap: '⚡', dumbbell: '💪', users: '👥', heart: '❤️',
    scale: '⚖️', gavel: '🔨', shield: '🛡️', smile: '😊', plus: '➕', bolt: '⚡',
    building: '🏢', phone: '📞', scissors: '✂️', sparkles: '✨', wrench: '🔧',
    droplet: '💧', pipe: '🚿',
  };
  return icons[name] || '✦';
}

const FEATURE_VARIANTS: Variant[] = [featCardGrid, featNumberedStack, featBentoGrid, featIconRow, featAlternating, featMinimalList];

// ============================================================================
// ABOUT VARIANTS (5)
// ============================================================================
function aboutBase(c: Ctx): string {
  return `.v5-about{padding:96px 24px;max-width:1200px;margin:0 auto}.v5-about h2{font-family:${c.t.display};font-size:clamp(28px,4vw,44px);font-weight:700;color:${c.p.primary};letter-spacing:-0.02em;line-height:1.15}.v5-about p{font-family:${c.t.body};font-size:17px;line-height:1.75;color:${c.isDark ? c.p.cream + 'CC' : '#444'}}`;
}

const aboutSplitLeft: Variant = {
  id: 'split-image-left',
  css: (c) => aboutBase(c) + `.v5-about-inner{display:grid;grid-template-columns:1fr 1.2fr;gap:48px;align-items:center}.v5-about-img{aspect-ratio:4/5;background:url('${imgUrl(c.imgs[0] || '1499750310107-5fef28a66643', 600, 750)}') center/cover;border-radius:24px}@media(max-width:900px){.v5-about-inner{grid-template-columns:1fr;gap:32px}}`,
  html: (c) => `<section class="v5-about v5-reveal" id="about"><div class="v5-about-inner"><div class="v5-about-img"></div><div><h2>Our story</h2><p style="margin-top:20px">${esc(c.biz.about)}</p><p style="margin-top:16px">We invite you to experience the difference that genuine care and attention can make. Every detail has been considered so you can focus on what matters most.</p></div></div></section>`,
};

const aboutSplitRight: Variant = {
  id: 'split-image-right',
  css: (c) => aboutSplitLeft.css(c).replace('grid-template-columns:1fr 1.2fr', 'grid-template-columns:1.2fr 1fr'),
  html: (c) => `<section class="v5-about v5-reveal" id="about"><div class="v5-about-inner"><div><h2>Our story</h2><p style="margin-top:20px">${esc(c.biz.about)}</p></div><div class="v5-about-img"></div></div></section>`,
};

const aboutFullBleedOverlay: Variant = {
  id: 'full-bleed-overlay',
  css: (c) => aboutBase(c) + `.v5-about{padding:0;max-width:none;position:relative}.v5-about-bg{position:absolute;inset:0;background:url('${imgUrl(c.imgs[1] || '1454165804606-c3d57bc86b40', 1920, 1080)}') center/cover}.v5-about-overlay{position:relative;background:linear-gradient(135deg,${c.p.primary}F0 0%,${c.p.primary}99 100%);padding:120px 24px;color:${c.isDark ? c.p.cream : '#fff'}}.v5-about-overlay h2{color:${c.isDark ? c.p.cream : '#fff'}}.v5-about-overlay p{color:rgba(255,255,255,0.9)}.v5-about-content{max-width:760px;margin:0 auto}`,
  html: (c) => `<section class="v5-about v5-reveal" id="about"><div class="v5-about-bg"></div><div class="v5-about-overlay"><div class="v5-about-content"><h2>Our story</h2><p style="margin-top:20px">${esc(c.biz.about)}</p></div></div></section>`,
};

const aboutCentered: Variant = {
  id: 'centered',
  css: (c) => aboutBase(c) + `.v5-about{text-align:center;max-width:840px}.v5-about p{margin-top:20px}.v5-about p + p{margin-top:16px}`,
  html: (c) => `<section class="v5-about v5-reveal" id="about"><h2>Our story</h2><p>${esc(c.biz.about)}</p><p>We invite you to experience the difference that genuine care and attention can make.</p></section>`,
};

const aboutTimeline: Variant = {
  id: 'timeline',
  css: (c) => aboutBase(c) + `.v5-about-timeline{position:relative;padding-left:32px}.v5-about-timeline::before{content:'';position:absolute;left:8px;top:8px;bottom:8px;width:2px;background:${c.p.accent}33}.v5-about-timeline-item{position:relative;padding-bottom:32px}.v5-about-timeline-item:last-child{padding-bottom:0}.v5-about-timeline-item::before{content:'';position:absolute;left:-32px;top:8px;width:18px;height:18px;border-radius:50%;background:${c.p.accent};border:3px solid ${c.p.bg}}.v5-about-timeline-item h3{font-family:${c.t.display};font-size:18px;font-weight:600;color:${c.p.primary};margin-bottom:6px}.v5-about-timeline-item p{font-family:${c.t.body};font-size:14px;color:${c.isDark ? c.p.cream + 'CC' : '#666'};line-height:1.6}`,
  html: (c) => `<section class="v5-about v5-reveal" id="about"><h2 style="margin-bottom:32px">Our journey</h2><div class="v5-about-timeline"><div class="v5-about-timeline-item"><h3>The beginning</h3><p>${esc(c.biz.about)}</p></div><div class="v5-about-timeline-item"><h3>Growing trust</h3><p>Over the years, we have built lasting relationships with our community.</p></div><div class="v5-about-timeline-item"><h3>Today</h3><p>We continue to innovate and elevate the experience for everyone who walks through our doors.</p></div></div></section>`,
};

const ABOUT_VARIANTS: Variant[] = [aboutSplitLeft, aboutSplitRight, aboutFullBleedOverlay, aboutCentered, aboutTimeline];

// ============================================================================
// GALLERY VARIANTS (5)
// ============================================================================
function galleryBase(c: Ctx): string {
  return `.v5-gal{padding:96px 24px;max-width:1200px;margin:0 auto}.v5-gal-head{text-align:center;margin-bottom:48px}.v5-gal-head h2{font-family:${c.t.display};font-size:clamp(28px,4vw,44px);font-weight:700;color:${c.p.primary};letter-spacing:-0.02em}`;
}

const galleryGrid3col: Variant = {
  id: 'grid-3col',
  css: (c) => galleryBase(c) + `.v5-gal-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.v5-gal-item{aspect-ratio:1;background-size:cover;background-position:center;border-radius:12px;transition:transform .3s}.v5-gal-item:hover{transform:scale(1.02)}@media(max-width:768px){.v5-gal-grid{grid-template-columns:repeat(2,1fr)}}`,
  html: (c) => `<section class="v5-gal v5-reveal" id="gallery"><div class="v5-gal-head"><h2>Gallery</h2></div><div class="v5-gal-grid">${c.imgs.slice(0, 6).map((id) => `<div class="v5-gal-item" style="background-image:url('${imgUrl(id, 400, 400)}')"></div>`).join('')}</div></section>`,
};

const galleryMasonry: Variant = {
  id: 'masonry',
  css: (c) => galleryBase(c) + `.v5-gal-masonry{column-count:3;column-gap:16px}.v5-gal-masonry-item{break-inside:avoid;margin-bottom:16px;border-radius:12px;overflow:hidden}.v5-gal-masonry-item img{width:100%;display:block}@media(max-width:768px){.v5-gal-masonry{column-count:2}}@media(max-width:480px){.v5-gal-masonry{column-count:1}}`,
  html: (c) => `<section class="v5-gal v5-reveal" id="gallery"><div class="v5-gal-head"><h2>Gallery</h2></div><div class="v5-gal-masonry">${c.imgs.slice(0, 6).map((id, i) => `<div class="v5-gal-masonry-item"><img src="${imgUrl(id, 400, i % 2 === 0 ? 500 : 300)}" alt="" /></div>`).join('')}</div></section>`,
};

const galleryBento: Variant = {
  id: 'bento',
  css: (c) => galleryBase(c) + `.v5-gal-bento{display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(2,200px);gap:12px}.v5-gal-bento-item{background-size:cover;background-position:center;border-radius:12px}.v5-gal-bento-item:nth-child(1){grid-column:span 2;grid-row:span 2}.v5-gal-bento-item:nth-child(2){grid-column:span 2}@media(max-width:768px){.v5-gal-bento{grid-template-columns:repeat(2,1fr);grid-template-rows:repeat(3,150px)}.v5-gal-bento-item:nth-child(1){grid-column:span 2;grid-row:span 1}}`,
  html: (c) => `<section class="v5-gal v5-reveal" id="gallery"><div class="v5-gal-head"><h2>Gallery</h2></div><div class="v5-gal-bento">${c.imgs.slice(0, 5).map((id) => `<div class="v5-gal-bento-item" style="background-image:url('${imgUrl(id, 600, 400)}')"></div>`).join('')}</div></section>`,
};

const galleryHorizontalScroll: Variant = {
  id: 'horizontal-scroll',
  css: (c) => galleryBase(c) + `.v5-gal-scroll{display:flex;gap:16px;overflow-x:auto;padding-bottom:16px;scroll-snap-type:x mandatory}.v5-gal-scroll-item{flex:0 0 320px;height:240px;background-size:cover;background-position:center;border-radius:12px;scroll-snap-align:start}.v5-gal-scroll::-webkit-scrollbar{height:6px}.v5-gal-scroll::-webkit-scrollbar-thumb{background:${c.p.accent};border-radius:3px}`,
  html: (c) => `<section class="v5-gal v5-reveal" id="gallery"><div class="v5-gal-head"><h2>Gallery</h2></div><div class="v5-gal-scroll">${c.imgs.map((id) => `<div class="v5-gal-scroll-item" style="background-image:url('${imgUrl(id, 400, 300)}')"></div>`).join('')}</div></section>`,
};

const galleryCarousel: Variant = {
  id: 'carousel',
  css: (c) => galleryBase(c) + `.v5-gal-carousel{position:relative;max-width:800px;margin:0 auto;border-radius:16px;overflow:hidden;aspect-ratio:16/9;background-size:cover;background-position:center;box-shadow:0 16px 32px rgba(0,0,0,0.15)}.v5-gal-carousel::after{content:'⟵ ⟶';position:absolute;bottom:16px;left:50%;transform:translateX(-50%);color:#fff;background:rgba(0,0,0,0.5);padding:6px 14px;border-radius:99px;font-size:14px}`,
  html: (c) => `<section class="v5-gal v5-reveal" id="gallery"><div class="v5-gal-head"><h2>Gallery</h2></div><div class="v5-gal-carousel" style="background-image:url('${imgUrl(c.imgs[0], 800, 450)}')"></div></section>`,
};

const GALLERY_VARIANTS: Variant[] = [galleryGrid3col, galleryMasonry, galleryBento, galleryHorizontalScroll, galleryCarousel];

// ============================================================================
// CTA VARIANTS (5)
// ============================================================================
const ctaFullBanner: Variant = {
  id: 'full-banner',
  css: (c) => `.v5-cta{padding:96px 24px;background:${c.p.primary};color:${c.isDark ? c.p.cream : '#fff'};text-align:center}.v5-cta-inner{max-width:760px;margin:0 auto}.v5-cta h2{font-family:${c.t.display};font-size:clamp(28px,4vw,44px);font-weight:700;margin-bottom:16px;letter-spacing:-0.02em}.v5-cta p{font-family:${c.t.body};font-size:17px;opacity:.85;margin-bottom:32px;line-height:1.6}`,
  html: (c) => `<section class="v5-cta v5-reveal" id="cta"><div class="v5-cta-inner"><h2>${esc(c.biz.hero)}</h2><p>${esc(c.biz.sub)}</p><button class="v5-btn">${esc(c.ctaText)}</button></div></section>`,
};

const ctaSplit: Variant = {
  id: 'split',
  css: (c) => `.v5-cta{padding:0;display:grid;grid-template-columns:1fr 1fr;min-height:400px}.v5-cta-text{padding:80px 48px;background:${c.p.primary};color:${c.isDark ? c.p.cream : '#fff'};display:flex;flex-direction:column;justify-content:center}.v5-cta-text h2{font-family:${c.t.display};font-size:clamp(28px,4vw,40px);font-weight:700;margin-bottom:16px;letter-spacing:-0.02em}.v5-cta-text p{font-family:${c.t.body};font-size:16px;opacity:.85;margin-bottom:24px}.v5-cta-img{background:url('${imgUrl(c.imgs[0] || '1499750310107-5fef28a66643', 800, 800)}') center/cover}@media(max-width:768px){.v5-cta{grid-template-columns:1fr}.v5-cta-img{height:240px}}`,
  html: (c) => `<section class="v5-cta v5-reveal" id="cta"><div class="v5-cta-text"><h2>${esc(c.biz.hero)}</h2><p>${esc(c.biz.sub)}</p><button class="v5-btn">${esc(c.ctaText)}</button></div><div class="v5-cta-img"></div></section>`,
};

const ctaCenteredCard: Variant = {
  id: 'centered-card',
  css: (c) => `.v5-cta{padding:96px 24px;background:${c.isDark ? c.p.dark : c.p.cream}}.v5-cta-card{max-width:640px;margin:0 auto;background:${c.isDark ? 'rgba(255,255,255,0.04)' : '#fff'};border:1px solid ${c.isDark ? 'rgba(255,255,255,0.08)' : '#eee'};border-radius:24px;padding:56px 32px;text-align:center;box-shadow:0 24px 48px rgba(0,0,0,0.08)}.v5-cta-card h2{font-family:${c.t.display};font-size:clamp(28px,4vw,40px);font-weight:700;color:${c.p.primary};margin-bottom:16px;letter-spacing:-0.02em}.v5-cta-card p{font-family:${c.t.body};font-size:17px;color:${c.isDark ? c.p.cream + 'CC' : '#666'};margin-bottom:32px;line-height:1.6}`,
  html: (c) => `<section class="v5-cta v5-reveal" id="cta"><div class="v5-cta-card"><h2>${esc(c.biz.hero)}</h2><p>${esc(c.biz.sub)}</p><button class="v5-btn">${esc(c.ctaText)}</button></div></section>`,
};

const ctaGradientForm: Variant = {
  id: 'gradient-form',
  css: (c) => `.v5-cta{padding:96px 24px;background:linear-gradient(135deg,${c.p.primary} 0%,${c.p.accent} 100%);color:#fff;text-align:center}.v5-cta-inner{max-width:680px;margin:0 auto}.v5-cta h2{font-family:${c.t.display};font-size:clamp(28px,4vw,40px);font-weight:700;margin-bottom:16px;letter-spacing:-0.02em}.v5-cta p{font-family:${c.t.body};font-size:17px;opacity:.9;margin-bottom:32px}.v5-cta-form{display:flex;gap:8px;max-width:480px;margin:0 auto}.v5-cta-form input{flex:1;padding:14px 16px;border:none;border-radius:99px;font-size:15px;font-family:${c.t.body}}.v5-cta-form button{padding:14px 24px;background:#fff;color:${c.p.primary};border:none;border-radius:99px;font-weight:600;font-family:${c.t.body};cursor:pointer}@media(max-width:480px){.v5-cta-form{flex-direction:column}}`,
  html: (c) => `<section class="v5-cta v5-reveal" id="cta"><div class="v5-cta-inner"><h2>Get in touch</h2><p>${esc(c.biz.sub)}</p><form class="v5-cta-form" onsubmit="event.preventDefault()"><input type="email" placeholder="Your email" /><button type="submit">${esc(c.ctaText)}</button></form></div></section>`,
};

const ctaFloatingBar: Variant = {
  id: 'floating-bar',
  css: (c) => `.v5-cta{padding:48px 24px}.v5-cta-bar{max-width:900px;margin:0 auto;background:${c.p.primary};color:${c.isDark ? c.p.cream : '#fff'};border-radius:99px;padding:16px 16px 16px 32px;display:flex;align-items:center;justify-content:space-between;gap:24px;box-shadow:0 16px 32px rgba(0,0,0,0.15)}.v5-cta-bar-text{font-family:${c.t.display};font-size:18px;font-weight:600}@media(max-width:600px){.v5-cta-bar{flex-direction:column;border-radius:24px;padding:24px;text-align:center}}`,
  html: (c) => `<section class="v5-cta v5-reveal" id="cta"><div class="v5-cta-bar"><div class="v5-cta-bar-text">${esc(c.biz.hero)}</div><button class="v5-btn">${esc(c.ctaText)}</button></div></section>`,
};

const CTA_VARIANTS: Variant[] = [ctaFullBanner, ctaSplit, ctaCenteredCard, ctaGradientForm, ctaFloatingBar];

// ============================================================================
// FOOTER VARIANTS (5)
// ============================================================================
const footerFourColumn: Variant = {
  id: 'four-column',
  css: (c) => `.v5-foot{background:${c.isDark ? '#000' : c.p.dark};color:${c.isDark ? c.p.cream + 'CC' : '#fff'};padding:64px 24px 32px}.v5-foot-inner{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:48px}.v5-foot-brand h3{font-family:${c.t.display};font-size:22px;font-weight:700;color:#fff;margin-bottom:12px}.v5-foot-brand p{font-family:${c.t.body};font-size:14px;opacity:.6;line-height:1.6}.v5-foot-col h4{font-family:${c.t.body};font-size:13px;font-weight:600;color:#fff;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:16px}.v5-foot-col a{display:block;font-family:${c.t.body};font-size:14px;opacity:.6;margin-bottom:8px;transition:opacity .2s}.v5-foot-col a:hover{opacity:1}.v5-foot-bottom{max-width:1200px;margin:48px auto 0;padding-top:24px;border-top:1px solid rgba(255,255,255,0.1);text-align:center;font-family:${c.t.body};font-size:13px;opacity:.5}@media(max-width:768px){.v5-foot-inner{grid-template-columns:1fr 1fr;gap:32px}}`,
  html: (c) => `<footer class="v5-foot"><div class="v5-foot-inner"><div class="v5-foot-brand"><h3>${esc(c.bn)}</h3><p>${esc(c.biz.tagline)}</p></div><div class="v5-foot-col"><h4>Company</h4><a href="#about">About</a><a href="#features">Services</a><a href="#gallery">Work</a><a href="#contact">Contact</a></div><div class="v5-foot-col"><h4>Resources</h4><a href="#">Blog</a><a href="#">FAQ</a><a href="#">Help</a><a href="#">Privacy</a></div><div class="v5-foot-col"><h4>Connect</h4><a href="#">Twitter</a><a href="#">Instagram</a><a href="#">LinkedIn</a><a href="#">Email</a></div></div><div class="v5-foot-bottom">© ${c.year} ${esc(c.bn)}. All rights reserved.</div></footer>`,
};

const footerMinimalCenter: Variant = {
  id: 'minimal-center',
  css: (c) => `.v5-foot{background:${c.isDark ? '#000' : c.p.dark};color:${c.isDark ? c.p.cream + 'CC' : '#fff'};padding:48px 24px;text-align:center}.v5-foot h3{font-family:${c.t.display};font-size:24px;font-weight:700;color:#fff;margin-bottom:8px}.v5-foot p{font-family:${c.t.body};font-size:14px;opacity:.6}.v5-foot-links{display:flex;justify-content:center;gap:24px;margin:24px 0}.v5-foot-links a{font-family:${c.t.body};font-size:13px;opacity:.7;transition:opacity .2s}.v5-foot-links a:hover{opacity:1}`,
  html: (c) => `<footer class="v5-foot"><h3>${esc(c.bn)}</h3><p>${esc(c.biz.tagline)}</p><div class="v5-foot-links"><a href="#about">About</a><a href="#features">Services</a><a href="#gallery">Work</a><a href="#contact">Contact</a></div><p>© ${c.year} ${esc(c.bn)}. All rights reserved.</p></footer>`,
};

const footerSplitBrand: Variant = {
  id: 'split-brand',
  css: (c) => `.v5-foot{background:${c.isDark ? '#000' : c.p.dark};color:${c.isDark ? c.p.cream + 'CC' : '#fff'};padding:0}.v5-foot-inner{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;min-height:200px}.v5-foot-brand{padding:48px;background:${c.p.primary};display:flex;flex-direction:column;justify-content:center}.v5-foot-brand h3{font-family:${c.t.display};font-size:28px;font-weight:700;color:${c.isDark ? c.p.cream : '#fff'};margin-bottom:8px}.v5-foot-brand p{font-family:${c.t.body};font-size:14px;opacity:.8}.v5-foot-links{padding:48px;display:flex;flex-direction:column;justify-content:center;gap:12px}.v5-foot-links a{font-family:${c.t.body};font-size:14px;opacity:.7;transition:opacity .2s}.v5-foot-links a:hover{opacity:1}@media(max-width:768px){.v5-foot-inner{grid-template-columns:1fr}}`,
  html: (c) => `<footer class="v5-foot"><div class="v5-foot-inner"><div class="v5-foot-brand"><h3>${esc(c.bn)}</h3><p>${esc(c.biz.tagline)} · © ${c.year}</p></div><div class="v5-foot-links"><a href="#about">About</a><a href="#features">Services</a><a href="#gallery">Work</a><a href="#contact">Contact</a></div></div></footer>`,
};

const footerDarkNewsletter: Variant = {
  id: 'dark-newsletter',
  css: (c) => `.v5-foot{background:${c.isDark ? '#000' : c.p.dark};color:${c.isDark ? c.p.cream + 'CC' : '#fff'};padding:64px 24px 32px}.v5-foot-inner{max-width:900px;margin:0 auto;text-align:center}.v5-foot h3{font-family:${c.t.display};font-size:24px;font-weight:700;color:#fff;margin-bottom:8px}.v5-foot-news{display:flex;gap:8px;max-width:480px;margin:24px auto}.v5-foot-news input{flex:1;padding:14px 16px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:8px;color:#fff;font-family:${c.t.body};font-size:14px}.v5-foot-news button{padding:14px 24px;background:${c.p.accent};color:#fff;border:none;border-radius:8px;font-weight:600;font-family:${c.t.body};cursor:pointer}.v5-foot-links{display:flex;justify-content:center;gap:24px;margin:32px 0 16px}.v5-foot-links a{font-family:${c.t.body};font-size:13px;opacity:.7}.v5-foot-copy{font-family:${c.t.body};font-size:13px;opacity:.5}`,
  html: (c) => `<footer class="v5-foot"><div class="v5-foot-inner"><h3>${esc(c.bn)}</h3><p style="opacity:.6;font-size:14px;font-family:${c.t.body}">Get the latest updates.</p><form class="v5-foot-news" onsubmit="event.preventDefault()"><input type="email" placeholder="Your email" /><button type="submit">Subscribe</button></form><div class="v5-foot-links"><a href="#about">About</a><a href="#features">Services</a><a href="#gallery">Work</a><a href="#contact">Contact</a></div><div class="v5-foot-copy">© ${c.year} ${esc(c.bn)}. All rights reserved.</div></div></footer>`,
};

const footerMultiTier: Variant = {
  id: 'multi-tier',
  css: (c) => `.v5-foot{background:${c.isDark ? '#000' : c.p.dark};color:${c.isDark ? c.p.cream + 'CC' : '#fff'}}.v5-foot-top{padding:64px 24px;border-bottom:1px solid rgba(255,255,255,0.08)}.v5-foot-top-inner{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr;gap:48px}.v5-foot-brand h3{font-family:${c.t.display};font-size:24px;font-weight:700;color:#fff;margin-bottom:12px}.v5-foot-brand p{font-family:${c.t.body};font-size:14px;opacity:.6;line-height:1.6}.v5-foot-col h4{font-family:${c.t.body};font-size:12px;font-weight:600;color:#fff;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:16px}.v5-foot-col a{display:block;font-family:${c.t.body};font-size:14px;opacity:.6;margin-bottom:8px}.v5-foot-col a:hover{opacity:1}.v5-foot-bottom{padding:24px;text-align:center;font-family:${c.t.body};font-size:12px;opacity:.5}@media(max-width:768px){.v5-foot-top-inner{grid-template-columns:1fr 1fr}}`,
  html: (c) => `<footer class="v5-foot"><div class="v5-foot-top"><div class="v5-foot-top-inner"><div class="v5-foot-brand"><h3>${esc(c.bn)}</h3><p>${esc(c.biz.tagline)}</p></div><div class="v5-foot-col"><h4>Company</h4><a href="#about">About</a><a href="#features">Services</a></div><div class="v5-foot-col"><h4>Resources</h4><a href="#">Blog</a><a href="#">FAQ</a></div><div class="v5-foot-col"><h4>Legal</h4><a href="#">Privacy</a><a href="#">Terms</a></div></div></div><div class="v5-foot-bottom">© ${c.year} ${esc(c.bn)}. All rights reserved.</div></footer>`,
};

const FOOTER_VARIANTS: Variant[] = [footerFourColumn, footerMinimalCenter, footerSplitBrand, footerDarkNewsletter, footerMultiTier];

// ============================================================================
// TESTIMONIALS (6)
// ============================================================================
const tstCardGrid: Variant = {
  id: 'card-grid',
  css: (c) => `.v5-tst{padding:96px 24px;background:${c.isDark ? c.p.dark : c.p.cream};max-width:1200px;margin:0 auto}.v5-tst-head{text-align:center;margin-bottom:56px}.v5-tst-head h2{font-family:${c.t.display};font-size:clamp(28px,4vw,44px);font-weight:700;color:${c.p.primary};margin-bottom:12px;letter-spacing:-0.02em}.v5-tst-head p{font-family:${c.t.body};font-size:17px;color:${c.isDark ? c.p.cream + '99' : '#555'}}.v5-tst-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:24px}.v5-tst-item{background:${c.isDark ? 'rgba(255,255,255,0.04)' : '#fff'};border:1px solid ${c.isDark ? 'rgba(255,255,255,0.08)' : '#eee'};border-radius:16px;padding:32px}.v5-tst-stars{color:${c.p.accent};font-size:14px;letter-spacing:2px;margin-bottom:16px}.v5-tst-quote{font-family:${c.t.body};font-size:16px;line-height:1.7;color:${c.isDark ? c.p.cream : '#333'};margin-bottom:20px}.v5-tst-who{display:flex;align-items:center;gap:12px}.v5-tst-av{width:44px;height:44px;border-radius:50%;background:${c.p.accent};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:600}.v5-tst-name{font-weight:600;color:${c.p.primary};font-size:15px;font-family:${c.t.body}}.v5-tst-role{font-size:13px;color:${c.isDark ? c.p.cream + '99' : '#888'}}`,
  html: (c) => {
    const quotes = [
      { n: 'Sarah Liu', r: 'VP Product, Northwind', q: `Working with ${c.bn} was the smoothest vendor engagement I have had in fifteen years. They showed up with a point of view, shipped on time, and the work converted.` },
      { n: 'James Park', r: 'CEO, Helios Health', q: `The team treated our roadmap like their own. They flagged scope risks early, proposed thoughtful alternatives, and the final product was sharper than what we initially scoped.` },
      { n: 'Elena Volkov', r: 'Head of Brand, Aurora', q: `I have never worked with a team that communicated this well. Weekly demos, clear tickets, no surprises. Our internal team learned a huge amount just from observing their process.` },
    ];
    return `<section class="v5-tst v5-reveal" id="testimonials"><div class="v5-tst-head"><h2>What our clients say</h2><p>Real words from real partners we have shipped work for.</p></div><div class="v5-tst-list">${quotes.map((q) => `<figure class="v5-tst-item"><div class="v5-tst-stars">★★★★★</div><blockquote class="v5-tst-quote">${esc(q.q)}</blockquote><figcaption class="v5-tst-who"><div class="v5-tst-av">${esc(q.n[0])}</div><div><div class="v5-tst-name">${esc(q.n)}</div><div class="v5-tst-role">${esc(q.r)}</div></div></figcaption></figure>`).join('')}</div></section>`;
  },
};

const tstSingleQuote: Variant = {
  id: 'single-quote',
  css: (c) => `.v5-tst{padding:120px 24px;background:${c.p.primary};color:${c.isDark ? c.p.cream : '#fff'};text-align:center}.v5-tst-inner{max-width:880px;margin:0 auto}.v5-tst-mark{font-family:${c.t.accent || c.t.display};font-size:96px;color:${c.p.accent};line-height:1;margin-bottom:-32px}.v5-tst-quote{font-family:${c.t.display};font-size:clamp(24px,3vw,36px);font-weight:400;line-height:1.4;margin-bottom:32px;letter-spacing:-0.01em}.v5-tst-cite{font-family:${c.t.body};font-size:15px;opacity:.85}.v5-tst-cite strong{display:block;font-size:18px;font-weight:600;margin-bottom:4px;opacity:1}`,
  html: (c) => `<section class="v5-tst v5-reveal" id="testimonials"><div class="v5-tst-inner"><div class="v5-tst-mark">&ldquo;</div><blockquote class="v5-tst-quote">${esc(c.biz.quote || 'Great work is not just what it looks like — it is how it works.')}</blockquote><cite class="v5-tst-cite"><strong>${esc(c.bn)}</strong>Trusted by 240+ clients across industries</cite></div></section>`,
};

const tstCarousel: Variant = {
  id: 'carousel',
  css: (c) => `.v5-tst{padding:96px 24px;background:${c.isDark ? c.p.dark : c.p.cream};max-width:1200px;margin:0 auto}.v5-tst-head{text-align:center;margin-bottom:48px}.v5-tst-head h2{font-family:${c.t.display};font-size:clamp(28px,4vw,44px);font-weight:700;color:${c.p.primary}}.v5-tst-track{display:flex;gap:24px;overflow-x:auto;padding-bottom:16px;scroll-snap-type:x mandatory}.v5-tst-card{flex:0 0 380px;scroll-snap-align:start;background:${c.isDark ? 'rgba(255,255,255,0.04)' : '#fff'};border:1px solid ${c.isDark ? 'rgba(255,255,255,0.08)' : '#eee'};border-radius:16px;padding:32px}.v5-tst-card .quote{font-family:${c.t.body};font-size:15px;line-height:1.7;color:${c.isDark ? c.p.cream : '#333'};margin-bottom:20px}.v5-tst-card .who{display:flex;align-items:center;gap:12px}.v5-tst-card .av{width:40px;height:40px;border-radius:50%;background:${c.p.accent};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:600}.v5-tst-card .name{font-weight:600;color:${c.p.primary};font-size:14px}.v5-tst-card .role{font-size:12px;color:${c.isDark ? c.p.cream + '99' : '#888'}}`,
  html: (c) => {
    const items = [
      { n: 'Sarah Liu', r: 'VP Product, Northwind', q: 'They showed up with a point of view, shipped on time, and the work converted. We renewed within sixty days.' },
      { n: 'James Park', r: 'CEO, Helios Health', q: 'The team treated our roadmap like their own. They flagged scope risks early and proposed thoughtful alternatives.' },
      { n: 'Elena Volkov', r: 'Head of Brand, Aurora', q: 'I have never worked with a team that communicated this well. Weekly demos, clear tickets, no surprises.' },
      { n: 'Marcus Hayes', r: 'CTO, Lumen', q: 'The redesign lifted sign-up conversion 31% in the first quarter. ROI was unambiguous.' },
      { n: 'Priya Raman', r: 'COO, Atlas Travel', q: 'They embedded with our internal team and the handoff was first-class — docs, screencasts, pair sessions.' },
    ];
    return `<section class="v5-tst v5-reveal" id="testimonials"><div class="v5-tst-head"><h2>Client stories</h2></div><div class="v5-tst-track">${items.map((q) => `<figure class="v5-tst-card"><blockquote class="quote">${esc(q.q)}</blockquote><figcaption class="who"><div class="av">${esc(q.n[0])}</div><div><div class="name">${esc(q.n)}</div><div class="role">${esc(q.r)}</div></div></figcaption></figure>`).join('')}</div></section>`;
  },
};

const tstWall: Variant = {
  id: 'wall',
  css: (c) => `.v5-tst{padding:96px 24px;background:${c.isDark ? c.p.dark : c.p.cream};max-width:1200px;margin:0 auto}.v5-tst-head{text-align:center;margin-bottom:56px}.v5-tst-head h2{font-family:${c.t.display};font-size:clamp(28px,4vw,44px);font-weight:700;color:${c.p.primary}}.v5-tst-grid{column-count:3;column-gap:24px}.v5-tst-grid-item{break-inside:avoid;margin-bottom:24px;background:${c.isDark ? 'rgba(255,255,255,0.04)' : '#fff'};border:1px solid ${c.isDark ? 'rgba(255,255,255,0.08)' : '#eee'};border-radius:16px;padding:28px}.v5-tst-grid-item .quote{font-family:${c.t.body};font-size:15px;line-height:1.65;color:${c.isDark ? c.p.cream : '#333'};margin-bottom:16px}.v5-tst-grid-item .who{display:flex;align-items:center;gap:10px}.v5-tst-grid-item .av{width:36px;height:36px;border-radius:50%;background:${c.p.accent};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:13px}.v5-tst-grid-item .name{font-weight:600;color:${c.p.primary};font-size:14px}.v5-tst-grid-item .role{font-size:12px;color:${c.isDark ? c.p.cream + '99' : '#888'}}@media(max-width:900px){.v5-tst-grid{column-count:2}}@media(max-width:600px){.v5-tst-grid{column-count:1}}`,
  html: (c) => {
    const items = [
      { n: 'Sarah Liu', r: 'VP Product, Northwind', q: 'Smoothest vendor engagement I have had in fifteen years. Shipped on time, work converted.' },
      { n: 'James Park', r: 'CEO, Helios Health', q: 'The team treated our roadmap like their own. Flagged scope risks early.' },
      { n: 'Elena Volkov', r: 'Head of Brand, Aurora', q: 'Never worked with a team that communicated this well. Weekly demos, clear tickets, no surprises.' },
      { n: 'Marcus Hayes', r: 'CTO, Lumen', q: 'Redesign lifted sign-up conversion 31% in Q1. ROI was unambiguous.' },
      { n: 'Priya Raman', r: 'COO, Atlas Travel', q: 'They embedded with our internal team. Handoff was first-class.' },
      { n: 'David Chen', r: 'Founder, Verdant', q: 'They translated vague requirements into a sharp product. Genuinely a partner.' },
      { n: 'Aisha Karim', r: 'Director, Beacon', q: 'Pricing was transparent. No surprises. We renewed for a second year.' },
      { n: 'Tom Becker', r: 'PM, Northwind', q: 'Their process is the most rigorous I have seen for a studio of their size.' },
      { n: 'Hannah Park', r: 'CMO, Lumen', q: 'The brand work alone was worth the engagement. The product work was a bonus.' },
    ];
    return `<section class="v5-tst v5-reveal" id="testimonials"><div class="v5-tst-head"><h2>Wall of love</h2></div><div class="v5-tst-grid">${items.map((q) => `<figure class="v5-tst-grid-item"><blockquote class="quote">${esc(q.q)}</blockquote><figcaption class="who"><div class="av">${esc(q.n[0])}</div><div><div class="name">${esc(q.n)}</div><div class="role">${esc(q.r)}</div></div></figcaption></figure>`).join('')}</div></section>`;
  },
};

const tstVideoQuote: Variant = {
  id: 'video-quote',
  css: (c) => `.v5-tst{padding:96px 24px;background:${c.isDark ? c.p.dark : c.p.cream};max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center}.v5-tst-media{aspect-ratio:4/3;background:url('${imgUrl(c.imgs[0] || '1499750310107-5fef28a66643', 800, 600)}') center/cover;border-radius:20px;position:relative}.v5-tst-media::before{content:'▶';position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-size:32px;background:rgba(0,0,0,0.3);width:64px;height:64px;margin:auto;border-radius:50%;border:2px solid #fff}.v5-tst-text h2{font-family:${c.t.display};font-size:clamp(24px,3vw,36px);font-weight:700;color:${c.p.primary};margin-bottom:16px;letter-spacing:-0.02em}.v5-tst-text blockquote{font-family:${c.t.body};font-size:18px;line-height:1.7;color:${c.isDark ? c.p.cream : '#333'};margin-bottom:24px}.v5-tst-text cite{display:flex;align-items:center;gap:12px;font-style:normal}.v5-tst-text cite .av{width:44px;height:44px;border-radius:50%;background:${c.p.accent};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:600}.v5-tst-text cite .name{font-weight:600;color:${c.p.primary};font-size:15px}.v5-tst-text cite .role{font-size:13px;color:${c.isDark ? c.p.cream + '99' : '#888'}}@media(max-width:800px){.v5-tst{grid-template-columns:1fr;gap:32px}}`,
  html: (c) => `<section class="v5-tst v5-reveal" id="testimonials"><div class="v5-tst-media"></div><div class="v5-tst-text"><h2>Hear it from our clients</h2><blockquote>${esc(c.biz.quote || 'They translated vague requirements into a sharp product. Genuinely a partner, not a vendor.')}</blockquote><cite><div class="av">S</div><div><div class="name">Sarah Liu</div><div class="role">VP Product, Northwind Commerce</div></div></cite></div></section>`,
};

const tstStats: Variant = {
  id: 'stats-strip',
  css: (c) => `.v5-tst{padding:64px 24px;background:${c.p.primary};color:${c.isDark ? c.p.cream : '#fff'}}.v5-tst-inner{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr);gap:32px;text-align:center}.v5-tst-num{font-family:${c.t.display};font-size:clamp(36px,5vw,56px);font-weight:700;color:${c.p.accent};line-height:1;letter-spacing:-0.02em}.v5-tst-lbl{font-family:${c.t.body};font-size:13px;text-transform:uppercase;letter-spacing:0.1em;margin-top:12px;opacity:.85}@media(max-width:700px){.v5-tst-inner{grid-template-columns:repeat(2,1fr);gap:24px}}`,
  html: () => `<section class="v5-tst v5-reveal"><div class="v5-tst-inner"><div><div class="v5-tst-num">240+</div><div class="v5-tst-lbl">Projects shipped</div></div><div><div class="v5-tst-num">38</div><div class="v5-tst-lbl">Team members</div></div><div><div class="v5-tst-num">4.9/5</div><div class="v5-tst-lbl">Avg. client rating</div></div><div><div class="v5-tst-num">12+</div><div class="v5-tst-lbl">Years of practice</div></div></div></section>`,
};

const TESTIMONIAL_VARIANTS: Variant[] = [tstCardGrid, tstSingleQuote, tstCarousel, tstWall, tstVideoQuote, tstStats];

export {
  HERO_VARIANTS, FEATURE_VARIANTS, ABOUT_VARIANTS, GALLERY_VARIANTS,
  CTA_VARIANTS, FOOTER_VARIANTS, TESTIMONIAL_VARIANTS,
};
