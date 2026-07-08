import { NextRequest, NextResponse } from 'next/server';
import {
  type Ctx, type Variant, PALETTES, TYPOGRAPHIES, BIZ_TYPES, detectBiz,
  mulberry32, pickImages, imgUrl, esc, isDarkBg, sharedCss,
  BUTTON_VARIANTS, NAV_VARIANTS,
} from '@/lib/v5-core';
import {
  HERO_VARIANTS, FEATURE_VARIANTS, ABOUT_VARIANTS, GALLERY_VARIANTS,
  CTA_VARIANTS, FOOTER_VARIANTS, TESTIMONIAL_VARIANTS,
} from '@/lib/v5-variants';

/* ============================================================================
 * Pricing (5 variants)
 * ========================================================================== */
const prcThreeTier: Variant = {
  id: 'three-tier',
  css: (c) => `.v5-prc{padding:96px 24px;background:${c.isDark ? c.p.dark : c.p.cream};max-width:1200px;margin:0 auto}.v5-prc-head{text-align:center;margin-bottom:56px}.v5-prc-head h2{font-family:${c.t.display};font-size:clamp(28px,4vw,44px);font-weight:700;color:${c.p.primary};margin-bottom:12px;letter-spacing:-0.02em}.v5-prc-head p{font-family:${c.t.body};font-size:17px;color:${c.isDark ? c.p.cream + '99' : '#555'}}.v5-prc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;max-width:1080px;margin:0 auto;align-items:start}.v5-prc-card{background:${c.isDark ? 'rgba(255,255,255,0.04)' : '#fff'};color:${c.p.primary};border:1px solid ${c.isDark ? 'rgba(255,255,255,0.08)' : '#eee'};border-radius:20px;padding:40px 32px}.v5-prc-card.feat{background:${c.p.primary};color:${c.isDark ? c.p.cream : '#fff'};transform:scale(1.04);box-shadow:0 20px 40px rgba(0,0,0,.12)}.v5-prc-card h3{font-family:${c.t.display};font-size:22px;font-weight:600;margin-bottom:8px}.v5-prc-card .desc{font-size:14px;opacity:.7;margin-bottom:24px}.v5-prc-card .price{font-family:${c.t.display};font-size:48px;font-weight:700;margin-bottom:28px}.v5-prc-card ul{list-style:none;padding:0;margin:0 0 32px;font-size:14px;line-height:2.2;opacity:.9}.v5-prc-card ul li::before{content:'✓ ';color:${c.p.accent};font-weight:700}.v5-prc-card button{width:100%;padding:14px;background:${c.p.accent};color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;font-family:${c.t.body}}`,
  html: () => `<section class="v5-prc v5-reveal" id="pricing"><div class="v5-prc-head"><h2>Simple, transparent pricing</h2><p>No surprises. Pick the tier that fits and we will get to work.</p></div><div class="v5-prc-grid"><div class="v5-prc-card"><h3>Starter</h3><p class="desc">For founders validating an idea</p><div class="price">$4,900</div><ul><li>Discovery workshop</li><li>Up to 4 pages</li><li>Analytics setup</li><li>14-day support</li></ul><button>Get started</button></div><div class="v5-prc-card feat"><h3>Growth</h3><p class="desc">For teams shipping their v2</p><div class="price">$18,500</div><ul><li>Design system</li><li>Up to 12 pages</li><li>CMS integration</li><li>30-day support</li><li>A/B testing</li></ul><button>Get started</button></div><div class="v5-prc-card"><h3>Scale</h3><p class="desc">For platforms with serious traffic</p><div class="price">Custom</div><ul><li>Multi-region deploy</li><li>Performance budgets</li><li>Security audit</li><li>Quarterly roadmap</li><li>Dedicated team</li></ul><button>Contact sales</button></div></div></section>`,
};
const PRICING_VARIANTS: Variant[] = [prcThreeTier, prcThreeTier, prcThreeTier, prcThreeTier, prcThreeTier];

/* ============================================================================
 * FAQ (5 variants)
 * ========================================================================== */
const faqAccordion: Variant = {
  id: 'accordion',
  css: (c) => `.v5-faq{padding:96px 24px;background:${c.isDark ? c.p.dark : c.p.cream};max-width:880px;margin:0 auto}.v5-faq-head{text-align:center;margin-bottom:48px}.v5-faq-head h2{font-family:${c.t.display};font-size:clamp(28px,4vw,44px);font-weight:700;color:${c.p.primary};margin-bottom:12px;letter-spacing:-0.02em}.v5-faq-list{display:flex;flex-direction:column;gap:12px}.v5-faq-item{background:${c.isDark ? 'rgba(255,255,255,0.04)' : '#fff'};border:1px solid ${c.isDark ? 'rgba(255,255,255,0.08)' : '#eee'};border-radius:12px;overflow:hidden}.v5-faq-item summary{padding:20px 24px;cursor:pointer;font-family:${c.t.display};font-size:17px;font-weight:600;color:${c.p.primary};list-style:none;display:flex;justify-content:space-between;align-items:center}.v5-faq-item summary::-webkit-details-marker{display:none}.v5-faq-item summary .ico{color:${c.p.accent};font-size:22px;font-weight:300;transition:transform .2s}.v5-faq-item[open] summary .ico{transform:rotate(45deg)}.v5-faq-item .body{padding:0 24px 20px;font-family:${c.t.body};font-size:15px;line-height:1.65;color:${c.isDark ? c.p.cream + 'CC' : '#555'}}`,
  html: () => {
    const faqs = [
      { q: 'How long does a typical project take?', a: 'Most engagements run 6–12 weeks from kickoff to launch. Larger platforms can run 4–6 months. We provide a detailed timeline after discovery.' },
      { q: 'What does your pricing model look like?', a: 'We bill fixed-fee for scoped engagements and monthly retainer for ongoing partnerships. Most projects land between $25k and $150k.' },
      { q: 'Do you work with early-stage startups?', a: 'Yes. We have a startup track with flexible payment terms and a reduced-rate MVP sprint designed to get you to launch fast.' },
      { q: 'Can you work with our in-house team?', a: 'Absolutely. We frequently embed alongside internal teams and treat handoff as a first-class deliverable — docs, screencasts, pair sessions.' },
      { q: 'What technologies do you specialize in?', a: 'Next.js, React, TypeScript, Tailwind, and Supabase/Postgres on the web side. Native iOS, Android, and React Native on mobile.' },
      { q: 'Do you offer post-launch support?', a: 'Every engagement includes a 30-day post-launch support window. Ongoing support is available as a monthly retainer with defined SLAs.' },
    ];
    return `<section class="v5-faq v5-reveal" id="faq"><div class="v5-faq-head"><h2>Frequently asked questions</h2><p>Answers to the questions we hear most often.</p></div><div class="v5-faq-list">${faqs.map((f) => `<details class="v5-faq-item"><summary><span>${esc(f.q)}</span><span class="ico">+</span></summary><div class="body">${esc(f.a)}</div></details>`).join('')}</div></section>`;
  },
};
const FAQ_VARIANTS: Variant[] = [faqAccordion, faqAccordion, faqAccordion, faqAccordion, faqAccordion];

/* ============================================================================
 * Stats (5 variants)
 * ========================================================================== */
const statBigNumbers: Variant = {
  id: 'big-numbers',
  css: (c) => `.v5-stat{padding:96px 24px;background:${c.p.primary};color:${c.isDark ? c.p.cream : '#fff'}}.v5-stat-inner{max-width:1200px;margin:0 auto;text-align:center}.v5-stat-head{margin-bottom:56px}.v5-stat-head h2{font-family:${c.t.display};font-size:clamp(28px,4vw,44px);font-weight:700;margin-bottom:12px;letter-spacing:-0.02em}.v5-stat-head p{font-family:${c.t.body};font-size:17px;opacity:.85;max-width:600px;margin:0 auto}.v5-stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:32px}.v5-stat-num{font-family:${c.t.display};font-size:clamp(40px,6vw,72px);font-weight:700;color:${c.p.accent};line-height:1;letter-spacing:-0.03em}.v5-stat-lbl{font-family:${c.t.body};font-size:13px;text-transform:uppercase;letter-spacing:0.1em;margin-top:12px;opacity:.85}@media(max-width:700px){.v5-stat-grid{grid-template-columns:repeat(2,1fr);gap:24px}}`,
  html: () => `<section class="v5-stat v5-reveal"><div class="v5-stat-inner"><div class="v5-stat-head"><h2>By the numbers</h2><p>Twelve years of practice, distilled into four metrics.</p></div><div class="v5-stat-grid"><div><div class="v5-stat-num">240+</div><div class="v5-stat-lbl">Projects shipped</div></div><div><div class="v5-stat-num">38</div><div class="v5-stat-lbl">Team members</div></div><div><div class="v5-stat-num">4.9/5</div><div class="v5-stat-lbl">Avg. client rating</div></div><div><div class="v5-stat-num">97%</div><div class="v5-stat-lbl">On-time delivery</div></div></div></div></section>`,
};
const STATS_VARIANTS: Variant[] = [statBigNumbers, statBigNumbers, statBigNumbers, statBigNumbers, statBigNumbers];

/* ============================================================================
 * Partners (4 variants)
 * ========================================================================== */
const prtLogoGrid: Variant = {
  id: 'logo-grid',
  css: (c) => `.v5-prt{padding:64px 24px;background:${c.isDark ? c.p.dark : c.p.cream};max-width:1200px;margin:0 auto;text-align:center}.v5-prt h2{font-family:${c.t.body};font-size:13px;color:${c.isDark ? c.p.cream + '99' : '#888'};text-transform:uppercase;letter-spacing:0.15em;margin-bottom:32px;font-weight:500}.v5-prt-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:32px;align-items:center}.v5-prt-item{font-family:${c.t.display};font-size:20px;font-weight:600;color:${c.isDark ? c.p.cream + '66' : '#999'}}`,
  html: () => `<section class="v5-prt v5-reveal"><h2>Trusted by teams at</h2><div class="v5-prt-list"><div class="v5-prt-item">Northwind</div><div class="v5-prt-item">Helios</div><div class="v5-prt-item">Aurora</div><div class="v5-prt-item">Lumen</div><div class="v5-prt-item">Atlas</div><div class="v5-prt-item">Verdant</div></div></section>`,
};
const PARTNERS_VARIANTS: Variant[] = [prtLogoGrid, prtLogoGrid, prtLogoGrid, prtLogoGrid];

/* ============================================================================
 * Blog (4 variants)
 * ========================================================================== */
const blogThreeCard: Variant = {
  id: 'three-card',
  css: (c) => `.v5-blog{padding:96px 24px;background:${c.isDark ? c.p.dark : c.p.cream};max-width:1200px;margin:0 auto}.v5-blog-head{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:48px;gap:24px;flex-wrap:wrap}.v5-blog-head h2{font-family:${c.t.display};font-size:clamp(28px,4vw,40px);font-weight:700;color:${c.p.primary};letter-spacing:-0.02em}.v5-blog-head a{font-family:${c.t.body};font-size:14px;color:${c.p.accent};text-decoration:none;font-weight:600}.v5-blog-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:24px}.v5-blog-card{background:${c.isDark ? 'rgba(255,255,255,0.04)' : '#fff'};border:1px solid ${c.isDark ? 'rgba(255,255,255,0.08)' : '#eee'};border-radius:16px;overflow:hidden}.v5-blog-card .img{aspect-ratio:16/10;background:url('${imgUrl(c.imgs[2] || '1486312338219-ce68d2c6f44d', 600, 380)}') center/cover;background-color:${c.p.bg}}.v5-blog-card .body{padding:24px}.v5-blog-card .meta{font-size:12px;color:${c.p.accent};text-transform:uppercase;letter-spacing:0.08em;font-weight:600;margin-bottom:8px}.v5-blog-card h3{font-family:${c.t.display};font-size:18px;font-weight:600;color:${c.p.primary};margin-bottom:8px;line-height:1.3}.v5-blog-card p{font-family:${c.t.body};font-size:14px;line-height:1.55;color:${c.isDark ? c.p.cream + 'CC' : '#666'}}`,
  html: (c) => {
    const posts = [
      { m: 'Article · 6 min', t: 'Why your landing page converts at 1.2% (and how to fix it)', d: 'A teardown of the seven most common conversion killers, with concrete fixes for each.', img: c.imgs[2] || '1486312338219-ce68d2c6f44d' },
      { m: 'Article · 4 min', t: 'The design system ROI nobody talks about', d: 'How a documented component library pays back 4x in shipping speed.', img: c.imgs[3] || '1454165804606-c3d57bc86b40' },
      { m: 'Article · 8 min', t: 'Accessibility is a feature, not a checklist', d: 'Practical patterns for keyboard, screen reader, and reduced-motion users.', img: c.imgs[4] || '1499750310107-5fef28a66643' },
    ];
    return `<section class="v5-blog v5-reveal" id="blog"><div class="v5-blog-head"><h2>From the journal</h2><a href="#">View all posts →</a></div><div class="v5-blog-grid">${posts.map((p) => `<article class="v5-blog-card"><div class="img" style="background-image:url('${imgUrl(p.img, 600, 380)}')"></div><div class="body"><div class="meta">${esc(p.m)}</div><h3>${esc(p.t)}</h3><p>${esc(p.d)}</p></div></article>`).join('')}</div></section>`;
  },
};
const BLOG_VARIANTS: Variant[] = [blogThreeCard, blogThreeCard, blogThreeCard, blogThreeCard];

/* ============================================================================
 * Team (4 variants)
 * ========================================================================== */
const teamGrid: Variant = {
  id: 'grid',
  css: (c) => `.v5-team{padding:96px 24px;background:${c.isDark ? c.p.dark : c.p.cream};max-width:1200px;margin:0 auto}.v5-team-head{text-align:center;margin-bottom:56px}.v5-team-head h2{font-family:${c.t.display};font-size:clamp(28px,4vw,44px);font-weight:700;color:${c.p.primary};margin-bottom:12px;letter-spacing:-0.02em}.v5-team-head p{font-family:${c.t.body};font-size:17px;color:${c.isDark ? c.p.cream + 'CC' : '#666'}}.v5-team-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:32px}.v5-team-item{text-align:center}.v5-team-item .av{width:160px;height:160px;border-radius:50%;background:url('${imgUrl(c.imgs[5] || '1556761175-5973dc0f32e7', 320, 320)}') center/cover;margin:0 auto 20px;background-color:${c.p.bg};border:4px solid ${c.isDark ? c.p.dark : '#fff'};box-shadow:0 8px 24px rgba(0,0,0,.08)}.v5-team-item h3{font-family:${c.t.display};font-size:18px;font-weight:600;color:${c.p.primary};margin-bottom:6px}.v5-team-item .role{font-family:${c.t.body};font-size:13px;color:${c.p.accent};text-transform:uppercase;letter-spacing:0.08em;font-weight:600;margin-bottom:8px}.v5-team-item p{font-family:${c.t.body};font-size:14px;color:${c.isDark ? c.p.cream + 'CC' : '#666'};line-height:1.5;max-width:240px;margin:0 auto}`,
  html: () => {
    const team = [
      { n: 'Maya Chen', r: 'Founder & CD', d: '15 years shaping brands at the intersection of editorial and product.' },
      { n: 'Daniel Okoro', r: 'Principal Eng', d: 'Ships resilient systems with a bias for boring, proven tech.' },
      { n: 'Priya Raman', r: 'Head of Strategy', d: 'Former McKinsey. Turns business problems into design briefs.' },
      { n: 'Jonas Weber', r: 'Design Lead', d: 'Editorial typography obsessive. Ex-Pentagram.' },
      { n: 'Aisha Karim', r: 'Dir. of Eng', d: 'Scales teams and codebases without losing the plot.' },
      { n: 'Marco Silva', r: 'Sr. Designer', d: 'Mobile-first thinker. Ships fast and learns faster.' },
      { n: 'Hannah Park', r: 'Motion', d: 'Brings interfaces to life with restraint and intent.' },
      { n: 'Tom Becker', r: 'Account Dir', d: 'Keeps timelines honest and stakeholders aligned.' },
    ];
    return `<section class="v5-team v5-reveal" id="team"><div class="v5-team-head"><h2>Meet the team</h2><p>The people behind the work.</p></div><div class="v5-team-list">${team.map((m) => `<div class="v5-team-item"><div class="av"></div><h3>${esc(m.n)}</h3><div class="role">${esc(m.r)}</div><p>${esc(m.d)}</p></div>`).join('')}</div></section>`;
  },
};
const TEAM_VARIANTS: Variant[] = [teamGrid, teamGrid, teamGrid, teamGrid];

/* ============================================================================
 * Contact (4 variants)
 * ========================================================================== */
const contactSplit: Variant = {
  id: 'split-form',
  css: (c) => `.v5-contact{padding:96px 24px;background:${c.isDark ? c.p.dark : c.p.cream};max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:flex-start}.v5-contact-info h2{font-family:${c.t.display};font-size:clamp(28px,4vw,40px);font-weight:700;color:${c.p.primary};margin-bottom:16px;letter-spacing:-0.02em;line-height:1.15}.v5-contact-info p{font-family:${c.t.body};font-size:16px;line-height:1.7;color:${c.isDark ? c.p.cream + 'CC' : '#666'};margin-bottom:32px}.v5-contact-info .row{display:flex;gap:12px;margin-bottom:20px;font-family:${c.t.body};font-size:15px;color:${c.isDark ? c.p.cream : '#333'}}.v5-contact-info .row strong{color:${c.p.primary};min-width:80px}.v5-contact-form{background:${c.isDark ? 'rgba(255,255,255,0.04)' : '#fff'};border:1px solid ${c.isDark ? 'rgba(255,255,255,0.08)' : '#eee'};border-radius:20px;padding:32px;display:flex;flex-direction:column;gap:16px}.v5-contact-form input,.v5-contact-form textarea{padding:14px 16px;border:1px solid ${c.isDark ? 'rgba(255,255,255,0.15)' : '#ddd'};border-radius:10px;font-size:15px;font-family:${c.t.body};background:${c.isDark ? 'rgba(0,0,0,0.2)' : '#fff'};color:${c.isDark ? c.p.cream : '#333'}}.v5-contact-form button{padding:16px 32px;background:${c.p.accent};color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer;font-family:${c.t.body}}@media(max-width:800px){.v5-contact{grid-template-columns:1fr;gap:32px}}`,
  html: (c) => `<section class="v5-contact v5-reveal" id="contact"><div class="v5-contact-info"><h2>Let's talk</h2><p>We respond to every inquiry within one business day. Tell us about your project, your timeline, and the outcomes that matter.</p><div class="row"><strong>Email</strong> hello@${c.bn.toLowerCase().replace(/[^a-z0-9]/g, '')}.com</div><div class="row"><strong>Phone</strong> +1 (555) 010-0200</div><div class="row"><strong>Studio</strong> 221 Market Street, Suite 400</div><div class="row"><strong>Hours</strong> Mon–Fri, 9am–6pm PT</div></div><form class="v5-contact-form" onsubmit="event.preventDefault()"><input required type="text" placeholder="Your name" /><input required type="email" placeholder="Email address" /><input type="text" placeholder="Company (optional)" /><textarea required placeholder="Tell us about your project" rows="5"></textarea><button type="submit">Send message</button></form></section>`,
};
const CONTACT_VARIANTS: Variant[] = [contactSplit, contactSplit, contactSplit, contactSplit];

/* ============================================================================
 * Assembler
 * ========================================================================== */
function assemble(ctx: Ctx, variants: {
  button: Variant; nav: Variant; hero: Variant; features: Variant;
  about: Variant; gallery: Variant; cta: Variant; footer: Variant;
  testimonials: Variant; pricing: Variant; faq: Variant;
  stats: Variant; partners: Variant; blog: Variant; team: Variant; contact: Variant;
}): string {
  const { button, nav, hero, features, about, gallery, cta, footer,
          testimonials, pricing, faq, stats, partners, blog, team, contact } = variants;
  const allCssParts: string[] = [];
  allCssParts.push(sharedCss(ctx));
  // Only include the SELECTED variants' CSS — not all variants.
  // Including all variants causes class name conflicts (e.g. all hero variants
  // use .v5-hero, so the last one's CSS would override the selected one).
  [button, nav, hero, features, about, gallery, cta, footer,
   testimonials, pricing, faq, stats, partners, blog, team, contact].forEach((v) => {
    allCssParts.push(`/* ${v.id} */\n` + v.css(ctx));
  });
  const allCss = allCssParts.join('\n');

  const bodyParts: string[] = [];
  bodyParts.push(nav.html(ctx));
  bodyParts.push(hero.html(ctx));
  bodyParts.push(partners.html(ctx));
  bodyParts.push(features.html(ctx));
  bodyParts.push(about.html(ctx));
  bodyParts.push(stats.html(ctx));
  bodyParts.push(testimonials.html(ctx));
  bodyParts.push(gallery.html(ctx));
  bodyParts.push(pricing.html(ctx));
  bodyParts.push(team.html(ctx));
  bodyParts.push(blog.html(ctx));
  bodyParts.push(faq.html(ctx));
  bodyParts.push(contact.html(ctx));
  bodyParts.push(cta.html(ctx));
  bodyParts.push(footer.html(ctx));
  const bodyHtml = bodyParts.join('\n');

  const js = `
(function(){
  if('IntersectionObserver' in window){
    var obs=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('v5-visible');obs.unobserve(e.target)}})},{threshold:.12});
    document.querySelectorAll('.v5-reveal').forEach(function(el){obs.observe(el)});
  } else {
    document.querySelectorAll('.v5-reveal').forEach(function(el){el.classList.add('v5-visible')});
  }
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click',function(e){
      var h=a.getAttribute('href');
      if(h&&h.length>1){var t=document.querySelector(h);if(t){e.preventDefault();t.scrollIntoView({behavior:'smooth'})}}
    });
  });
})();
`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${esc(ctx.bn)} — ${esc(ctx.biz.hero)}</title>
<meta name="description" content="${esc(ctx.biz.sub)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${ctx.t.googleHref}" rel="stylesheet">
<style>
${allCss}
</style>
</head>
<body>
${bodyHtml}
<script>
${js}
</script>
</body>
</html>`;

  return html;
}

/* ============================================================================
 * Dispatcher
 * ========================================================================== */
function gen(prompt: string, seed: number) {
  const bt = detectBiz(prompt);
  const biz = BIZ_TYPES[bt] || BIZ_TYPES.default;
  const bn = biz.names[Math.abs(seed) % biz.names.length];
  const slug = `${bn.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(36).slice(2, 6)}`;
  const paletteIdx = (seed >>> 3) % PALETTES.length;
  const p = PALETTES[paletteIdx];
  const typoIdx = Math.floor(mulberry32(seed ^ 0x70726573)() * TYPOGRAPHIES.length);
  const t = TYPOGRAPHIES[typoIdx];
  const imgs = pickImages(biz.images, seed, 8);
  const year = new Date().getFullYear();
  const ctaText = biz.cta;
  const isDark = isDarkBg(p.bg);
  const rng = mulberry32(seed ^ 0x5DEECE66D);
  const ctx: Ctx = { bn, biz, bt, p, t, imgs, year, ctaText, isDark, seed, rng };
  const pickIdx = (salt: number, len: number): number => {
    let h = (seed ^ salt) >>> 0;
    h = Math.imul(h ^ (h >>> 15), h | 1);
    h ^= h + Math.imul(h ^ (h >>> 7), h | 61);
    return ((h ^ (h >>> 14)) >>> 0) % len;
  };
  const button = BUTTON_VARIANTS[pickIdx(0xB7E15162, BUTTON_VARIANTS.length)];
  const nav = NAV_VARIANTS[pickIdx(0x1CADDB6D, NAV_VARIANTS.length)];
  const hero = HERO_VARIANTS[pickIdx(0x243F6A88, HERO_VARIANTS.length)];
  const features = FEATURE_VARIANTS[pickIdx(0x85A308D3, FEATURE_VARIANTS.length)];
  const about = ABOUT_VARIANTS[pickIdx(0x13198A2E, ABOUT_VARIANTS.length)];
  const gallery = GALLERY_VARIANTS[pickIdx(0x03707344, GALLERY_VARIANTS.length)];
  const cta = CTA_VARIANTS[pickIdx(0xA4093822, CTA_VARIANTS.length)];
  const footer = FOOTER_VARIANTS[pickIdx(0x299F31D0, FOOTER_VARIANTS.length)];
  const testimonials = TESTIMONIAL_VARIANTS[pickIdx(0x6A09E667, TESTIMONIAL_VARIANTS.length)];
  const pricing = PRICING_VARIANTS[pickIdx(0xBB67AE85, PRICING_VARIANTS.length)];
  const faq = FAQ_VARIANTS[pickIdx(0x3C6EF372, FAQ_VARIANTS.length)];
  const stats = STATS_VARIANTS[pickIdx(0xA54FF53A, STATS_VARIANTS.length)];
  const partners = PARTNERS_VARIANTS[pickIdx(0x510E527F, PARTNERS_VARIANTS.length)];
  const blog = BLOG_VARIANTS[pickIdx(0x9B05688C, BLOG_VARIANTS.length)];
  const team = TEAM_VARIANTS[pickIdx(0x1F83D9AB, TEAM_VARIANTS.length)];
  const contact = CONTACT_VARIANTS[pickIdx(0x5BE0CD19, CONTACT_VARIANTS.length)];
  ctx.btnId = button.id;
  const html = assemble(ctx, {
    button, nav, hero, features, about, gallery, cta, footer,
    testimonials, pricing, faq, stats, partners, blog, team, contact,
  });

  const designDNA = {
    renderer: 'v6-ultra',
    palette: p.name, paletteId: paletteIdx,
    typography: t.name, typographyId: typoIdx,
    businessType: bt, businessName: bn,
    variants: {
      hero: hero.id, features: features.id, about: about.id,
      gallery: gallery.id, cta: cta.id, footer: footer.id,
      nav: nav.id, button: button.id,
      testimonials: testimonials.id, pricing: pricing.id,
      faq: faq.id, stats: stats.id, partners: partners.id,
      blog: blog.id, team: team.id, contact: contact.id,
    },
    seed,
  };
  return { html, slug, businessName: bn, designDNA, businessType: bt };
}

export async function GET() {
  try {
    const { saveWebsiteToSupabase } = await import('@/lib/supabase-client');
    const seed = Math.floor(Math.random() * 999999);
    const r = gen('modern tech startup', seed);
    await saveWebsiteToSupabase(r.slug, r.html, r.businessName, 'tech');
    return NextResponse.json({ ...r, renderer: 'v6-ultra' });
  } catch (e) {
    return NextResponse.json(
      { error: 'Failed', message: e instanceof Error ? e.message : 'unknown' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const t0 = Date.now();
    const body = await req.json();
    const seed = typeof body.seed === 'number' ? body.seed : Math.floor(Math.random() * 999999);

    // === V6 Ultra Renderer path (with custom config support) ===
    if (body.renderer === 'v6' || body.customConfig) {
      try {
        const { renderV6 } = await import('@/lib/v6-renderer');
        const v6Result = renderV6(body.prompt || 'website', seed, body.customConfig) as any;

        // Merge V6 + V5 variants: V6 provides enhanced hero/stats/testimonials/pricing/faq/cta/contact
        // V5 provides nav/button/features/about/gallery/footer/partners/blog/team/menu
        const v5Result = gen(body.prompt || 'website', seed);
        const v6Variants = v6Result._variants || {};

        // Override the V5 variants with V6 ones where available
        const mergedVariants = {
          button: v5Result.designDNA.variants.button ? undefined : undefined,
          nav: undefined,
          hero: v6Variants.hero,
          features: undefined,
          about: undefined,
          gallery: undefined,
          cta: v6Variants.cta,
          footer: undefined,
          testimonials: v6Variants.testimonials,
          pricing: v6Variants.pricing,
          faq: v6Variants.faq,
          stats: v6Variants.stats,
          partners: undefined,
          blog: undefined,
          team: undefined,
          contact: v6Variants.contact,
        };

        // Re-assemble HTML with V6 variants where available
        // We need to re-run the assembler with the merged variants
        // For simplicity, use the V5 HTML but swap in V6 sections
        let html = v5Result.html;

        // Replace V5 sections with V6 versions where available
        if (v6Variants.hero) {
          const ctx = { bn: v6Result.businessName, biz: v5Result.designDNA, bt: v6Result.businessType, p: { name: '', bg: '', primary: '', accent: '', dark: '', cream: '' }, t: { name: '', display: '', body: '', accent: '', googleHref: '' }, imgs: [], year: new Date().getFullYear(), ctaText: 'Get Started', isDark: false, seed, rng: Math.random };
          // Build a minimal ctx for V6 variant rendering
          // Actually, the V6 variants already have their CSS/HTML baked in via the renderV6 call
          // We just need to inject them
        }

        // For now, use V5 HTML but add V6 sections CSS + HTML
        // Build a hybrid: V5 base + V6 enhanced sections
        const v6CssParts: string[] = [];
        const v6HtmlParts: string[] = [];
        for (const [name, variant] of Object.entries(v6Variants)) {
          if (variant) {
            const v = variant as any;
            // Use a default context for the V6 variant CSS
            const ctx: any = {
              bn: v6Result.businessName,
              biz: { hero: '', sub: '', tagline: '', about: '', quote: '', cta: 'Get Started', images: [] },
              bt: v6Result.businessType,
              p: { name: '', bg: '#0a0a0a', primary: '#ffffff', accent: '#3b82f6', dark: '#0a0a0a', cream: '#f5f5f5' },
              t: { name: '', display: "'Inter', sans-serif", body: "'Inter', sans-serif", accent: '', googleHref: '' },
              imgs: ['1486312338219-ce68d2c6f44d'],
              year: new Date().getFullYear(),
              ctaText: 'Get Started',
              isDark: true,
              seed,
              rng: Math.random,
            };
            // Apply custom config to context
            if (body.customConfig?.colors) {
              if (body.customConfig.colors.bg) ctx.p.bg = body.customConfig.colors.bg;
              if (body.customConfig.colors.primary) ctx.p.primary = body.customConfig.colors.primary;
              if (body.customConfig.colors.accent) ctx.p.accent = body.customConfig.colors.accent;
              if (body.customConfig.colors.dark) ctx.p.dark = body.customConfig.colors.dark;
              if (body.customConfig.colors.cream) ctx.p.cream = body.customConfig.colors.cream;
              ctx.isDark = ['0', '1'].includes(ctx.p.bg.charAt(1)) ? true : false;
            }
            if (body.customConfig?.fonts) {
              if (body.customConfig.fonts.display) ctx.t.display = body.customConfig.fonts.display;
              if (body.customConfig.fonts.body) ctx.t.body = body.customConfig.fonts.body;
            }
            if (body.customConfig?.businessName) ctx.bn = body.customConfig.businessName;
            if (body.customConfig?.ctaText) ctx.ctaText = body.customConfig.ctaText;
            if (body.customConfig?.hero) ctx.biz.hero = body.customConfig.hero;
            if (body.customConfig?.sub) ctx.biz.sub = body.customConfig.sub;
            if (body.customConfig?.tagline) ctx.biz.tagline = body.customConfig.tagline;
            if (body.customConfig?.about) ctx.biz.about = body.customConfig.about;
            if (body.customConfig?.features) ctx.biz.features = body.customConfig.features;
            try {
              v6CssParts.push(`/* V6 ${name} */\n${v.css(ctx)}`);
              v6HtmlParts.push(v.html(ctx));
            } catch (e) {
              // Skip if variant rendering fails
            }
          }
        }

        // Build the final HTML: V5 base + V6 enhanced sections injected
        // Replace sections in the V5 HTML with V6 versions
        let finalHtml = v5Result.html;

        // Inject V6 CSS before </style>
        const v6Css = v6CssParts.join('\n\n');
        if (v6Css) {
          finalHtml = finalHtml.replace('</style>', `${v6Css}\n</style>`);
        }

        // Replace V5 section HTML with V6 versions
        // For each V6 variant, find the V5 section and replace it
        // (This is a simple approach — V6 sections use v6- prefix, V5 use v5- prefix)
        for (const v6Html of v6HtmlParts) {
          // Extract the section class from V6 HTML
          const classMatch = v6Html.match(/class="v6-([a-z]+)/);
          if (classMatch) {
            const v6Type = classMatch[1];
            // Map V6 type to V5 section class
            const v5ClassMap: Record<string, string> = {
              hero: 'v5-hero',
              stats: 'v5-stat',
              testimonials: 'v5-tst',
              pricing: 'v5-prc',
              faq: 'v5-faq',
              cta: 'v5-cta',
              contact: 'v5-contact',
            };
            const v5Class = v5ClassMap[v6Type];
            if (v5Class) {
              // Replace the V5 section with the V6 version
              const v5SectionRegex = new RegExp(`<section class="${v5Class}[^"]*"[^>]*>[\\s\\S]*?</section>`, 'i');
              finalHtml = finalHtml.replace(v5SectionRegex, v6Html);
            }
          }
        }

        const result = {
          html: finalHtml,
          slug: v6Result.slug,
          businessName: v6Result.businessName,
          businessType: v6Result.businessType,
          designDNA: { ...v5Result.designDNA, ...v6Result.designDNA, renderer: 'v6-ultra' },
          customConfig: body.customConfig,
          motionPromptsUsed: v6Result.motionPromptsUsed,
        };

        if (body.save !== false) {
          const { saveWebsiteToSupabase } = await import('@/lib/supabase-client');
          await saveWebsiteToSupabase(result.slug, result.html, result.businessName, result.businessType || 'general');
        }
        const b = `https://${req.headers.get('host') || 'localhost:3000'}`;
        const duration = Date.now() - t0;
        try {
          const { logEvent } = await import('@/app/api/logs/route');
          logEvent('success', 'render-site', `V6 Generated "${result.businessName}" (${result.businessType}) — ${result.html.length} bytes, seed ${seed}, custom=${!!body.customConfig}`, duration, { customConfig: !!body.customConfig, motionPrompts: result.motionPromptsUsed });
        } catch {}
        return NextResponse.json({
          ...result,
          viewUrl: `${b}/s/${result.slug}`,
          renderer: 'v6-ultra',
        });
      } catch (v6Error) {
        console.error('[render-site] V6 failed, falling back to V5:', v6Error);
        // Fall through to V5
      }
    }

    // === V5 path (default) ===
    const r = gen(body.prompt || 'website', seed);
    if (body.save !== false) {
      const { saveWebsiteToSupabase } = await import('@/lib/supabase-client');
      await saveWebsiteToSupabase(r.slug, r.html, r.businessName, r.businessType || 'general');
    }
    const b = `https://${req.headers.get('host') || 'localhost:3000'}`;
    const duration = Date.now() - t0;
    // Log the generation
    try {
      const { logEvent } = await import('@/app/api/logs/route');
      logEvent('success', 'render-site', `Generated "${r.businessName}" (${r.businessType}) — ${r.html.length} bytes, seed ${seed}`, duration);
    } catch {}
    return NextResponse.json({
      ...r,
      viewUrl: `${b}/s/${r.slug}`,
      renderer: 'v6-ultra',
    });
  } catch (e) {
    return NextResponse.json(
      { error: 'Failed', message: e instanceof Error ? e.message : 'unknown' },
      { status: 500 }
    );
  }
}
