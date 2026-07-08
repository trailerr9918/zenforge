/**
 * Premium Website Generation System
 * =================================
 *
 * The "recipe" for consistently producing demo-quality websites.
 * Based on the manual merge demo that achieved $50K-agency-grade output.
 *
 * KEY INSIGHT: LLMs produce poor results when asked to "generate a website".
 * They produce EXCELLENT results when given:
 *   1. A specific section-by-section blueprint
 *   2. A defined design system (colors, fonts, spacing)
 *   3. Explicit instructions for each technique (glassmorphism, scroll reveals, etc.)
 *   4. Reference to the quality bar (the demo)
 *
 * This file contains:
 *   - PREMIUM_GENERATION_PROMPT: The master prompt that guides the LLM
 *   - DESIGN_SYSTEMS: Curated design systems the LLM can choose from
 *   - SECTION_BLUEPRINTS: Templates for each section type
 *   - TECHNIQUE_LIBRARY: CSS/JS techniques the LLM should use
 */

export interface DesignSystem {
  id: string;
  name: string;
  bg: string;
  text: string;
  accent: string;
  accentGradient: string;
  displayFont: string;
  bodyFont: string;
  navFont: string;
  description: string;
  mood: string;
}

export const DESIGN_SYSTEMS: DesignSystem[] = [
  {
    id: 'cinematic-dark',
    name: 'Cinematic Dark',
    bg: '#0A0A0A',
    text: '#FFFFFF',
    accent: '#DCFF00',
    accentGradient: 'linear-gradient(135deg, #DCFF00, #64CEFB)',
    displayFont: 'Instrument Serif',
    bodyFont: 'Inter',
    navFont: 'Space Grotesk',
    description: 'Dark, bold, cinematic. Video backgrounds, italic serif headlines, vibrant accent.',
    mood: 'premium, cinematic, bold',
  },
  {
    id: 'liquid-glass',
    name: 'Liquid Glass',
    bg: '#010828',
    text: '#EFF4FF',
    accent: '#6FFF00',
    accentGradient: 'linear-gradient(135deg, #b724ff, #7c3aed)',
    displayFont: 'Anton',
    bodyFont: 'System monospace',
    navFont: 'Anton',
    description: 'Space theme, liquid glass UI, cursive accent font, neon highlights.',
    mood: 'futuristic, glassmorphic, neon',
  },
  {
    id: 'editorial-light',
    name: 'Editorial Light',
    bg: '#FAFAF7',
    text: '#1A1A1A',
    accent: '#E63946',
    accentGradient: 'linear-gradient(135deg, #E63946, #F4A261)',
    displayFont: 'Playfair Display',
    bodyFont: 'Source Sans 3',
    navFont: 'Space Grotesk',
    description: 'Clean editorial, serif headlines, generous whitespace, warm accent.',
    mood: 'editorial, refined, warm',
  },
  {
    id: 'tech-minimal',
    name: 'Tech Minimal',
    bg: '#FFFFFF',
    text: '#0F172A',
    accent: '#3B82F6',
    accentGradient: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
    displayFont: 'Space Grotesk',
    bodyFont: 'Inter',
    navFont: 'Space Grotesk',
    description: 'Tech startup, clean white, blue gradient, sans-serif throughout.',
    mood: 'modern, clean, trustworthy',
  },
  {
    id: 'warm-organic',
    name: 'Warm Organic',
    bg: '#FFF8F0',
    text: '#2D1810',
    accent: '#D97706',
    accentGradient: 'linear-gradient(135deg, #D97706, #DC2626)',
    displayFont: 'Fraunces',
    bodyFont: 'Inter',
    navFont: 'Space Grotesk',
    description: 'Warm, organic, earthy. Rounded fonts, warm tones, soft shadows.',
    mood: 'organic, warm, approachable',
  },
  {
    id: 'brutalist-bold',
    name: 'Brutalist Bold',
    bg: '#FFFF00',
    text: '#000000',
    accent: '#000000',
    accentGradient: 'linear-gradient(135deg, #000000, #FF00FF)',
    displayFont: 'Archivo Black',
    bodyFont: 'Space Mono',
    navFont: 'Archivo Black',
    description: 'Brutalist, high contrast, bold typography, raw aesthetic.',
    mood: 'bold, raw, high-contrast',
  },
  {
    id: 'aurora-gradient',
    name: 'Aurora Gradient',
    bg: '#0F0E17',
    text: '#FFFFFE',
    accent: '#A78BFA',
    accentGradient: 'linear-gradient(135deg, #A78BFA, #EC4899, #F59E0B)',
    displayFont: 'Bricolage Grotesque',
    bodyFont: 'Inter',
    navFont: 'Bricolage Grotesque',
    description: 'Aurora gradients, dark base, multi-color accents, modern sans.',
    mood: 'modern, gradient-rich, vibrant',
  },
  {
    id: 'ocean-calm',
    name: 'Ocean Calm',
    bg: '#F0F9FF',
    text: '#0C4A6E',
    accent: '#0EA5E9',
    accentGradient: 'linear-gradient(135deg, #0EA5E9, #2DD4BF)',
    displayFont: 'DM Serif Display',
    bodyFont: 'Inter',
    navFont: 'Inter',
    description: 'Calm ocean blues, light bg, serif display, refreshing feel.',
    mood: 'calm, refreshing, trustworthy',
  },
];

export interface SectionBlueprint {
  type: string;
  name: string;
  required: boolean;
  description: string;
  techniques: string[];
  cssHints: string;
}

export const SECTION_BLUEPRINTS: SectionBlueprint[] = [
  {
    type: 'hero-cinematic',
    name: 'Cinematic Hero',
    required: true,
    description: 'Full-viewport hero with video/image background, bold headline, CTA. Overlay gradient for readability.',
    techniques: ['video-bg', 'gradient-overlay', 'italic-emphasis', 'reveal-animation'],
    cssHints: 'min-height:100vh; display:flex; align-items:center; position:relative; overflow:hidden',
  },
  {
    type: 'features-glass',
    name: 'Glassmorphism Features Grid',
    required: true,
    description: '3-4 feature cards with glassmorphism (backdrop-filter blur), gradient borders on hover, icon + title + description.',
    techniques: ['glassmorphism', 'gradient-border', 'hover-glow', 'staggered-reveal'],
    cssHints: 'display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:2rem',
  },
  {
    type: 'stats-animated',
    name: 'Animated Stats',
    required: false,
    description: '4 large numbers with labels. Animate count-up on scroll using IntersectionObserver.',
    techniques: ['count-up-animation', 'scroll-trigger', 'large-typography'],
    cssHints: 'display:grid; grid-template-columns:repeat(4,1fr); gap:2rem; text-align:center',
  },
  {
    type: 'about-split',
    name: 'Split About Section',
    required: false,
    description: 'Two-column layout: video/image on one side, text + checklist on the other. Cursive accent overlay optional.',
    techniques: ['split-layout', 'video-bg', 'checklist', 'cursive-accent'],
    cssHints: 'display:grid; grid-template-columns:1fr 1fr; gap:4rem; align-items:center',
  },
  {
    type: 'testimonials-cards',
    name: 'Testimonial Cards',
    required: false,
    description: '3 glassmorphism cards with quote, avatar, name, role, 5-star rating. Hover lift effect.',
    techniques: ['glassmorphism', 'hover-lift', 'star-rating', 'avatar'],
    cssHints: 'display:grid; grid-template-columns:repeat(auto-fit,minmax(300px,1fr)); gap:2rem',
  },
  {
    type: 'pricing-tiered',
    name: 'Tiered Pricing',
    required: false,
    description: '3 pricing cards. Middle card featured (scaled up, gradient border). Price, features list, CTA button.',
    techniques: ['featured-card', 'gradient-border', 'scale-transform', 'badge'],
    cssHints: 'display:grid; grid-template-columns:repeat(3,1fr); gap:2rem; align-items:start',
  },
  {
    type: 'faq-accordion',
    name: 'FAQ Accordion',
    required: false,
    description: '5 expandable FAQ items. Smooth max-height transition, animated +/× icon.',
    techniques: ['accordion', 'smooth-transition', 'icon-rotate'],
    cssHints: 'max-width:800px; margin:0 auto',
  },
  {
    type: 'cta-video',
    name: 'Video CTA Band',
    required: true,
    description: 'Full-width video background with overlay, bold headline, gradient CTA button. High impact.',
    techniques: ['video-bg', 'gradient-overlay', 'bold-headline', 'gradient-button'],
    cssHints: 'position:relative; min-height:60vh; display:flex; align-items:center; justify-content:center',
  },
  {
    type: 'footer-comprehensive',
    name: 'Comprehensive Footer',
    required: true,
    description: '4-5 column link grid, newsletter signup, social icons (SVG), copyright bar. Dark background.',
    techniques: ['link-grid', 'newsletter-form', 'social-icons-svg', 'dark-bg'],
    cssHints: 'background:#111; color:#fff; padding:4rem 2rem 2rem',
  },
];

export const TECHNIQUE_LIBRARY = `
/* === PREMIUM ANIMATION LIBRARIES (include these CDN scripts in <head>) === */
<!-- GSAP for professional animations -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
<!-- Lenis for smooth scrolling -->
<script src="https://unpkg.com/@studio-freight/lenis@1.0.42/dist/lenis.min.js"></script>

/* === PREMIUM CSS TECHNIQUES === */

/* Glassmorphism */
.glass {
  background: rgba(255,255,255,0.05);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
}

/* Gradient border (mask-composite trick) */
.gradient-border {
  position: relative;
  background: rgba(255,255,255,0.05);
  border-radius: 16px;
}
.gradient-border::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, var(--accent1), var(--accent2));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

/* Scroll reveal (use with BOTH IntersectionObserver AND GSAP) */
.reveal { opacity: 0; transform: translateY(40px); transition: opacity 0.8s ease, transform 0.8s ease; }
.reveal.visible { opacity: 1; transform: translateY(0); }
.delay-1 { transition-delay: 0.1s; }
.delay-2 { transition-delay: 0.2s; }
.delay-3 { transition-delay: 0.3s; }
.delay-4 { transition-delay: 0.4s; }

/* Fluid typography */
h1 { font-size: clamp(2.5rem, 6vw, 5rem); line-height: 1.05; }
h2 { font-size: clamp(2rem, 4vw, 3.5rem); line-height: 1.1; }
h3 { font-size: clamp(1.5rem, 3vw, 2rem); }
p { font-size: clamp(0.95rem, 1.2vw, 1.1rem); line-height: 1.7; }

/* CSS Gradient mesh background (aurora effect) */
.aurora-bg {
  background:
    radial-gradient(circle at 20% 50%, rgba(167,139,250,0.15), transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(236,72,153,0.15), transparent 50%),
    radial-gradient(circle at 50% 20%, rgba(245,158,11,0.1), transparent 50%);
  animation: aurora-shift 20s ease infinite;
}
@keyframes aurora-shift {
  0%, 100% { background-position: 0% 0%, 100% 100%, 50% 0%; }
  50% { background-position: 100% 50%, 0% 50%, 50% 100%; }
}

/* 3D card hover effect */
.card-3d {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  transform-style: preserve-3d;
}
.card-3d:hover {
  transform: perspective(1000px) rotateY(5deg) rotateX(5deg) translateY(-8px);
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

/* Scroll progress bar */
.scroll-progress {
  position: fixed; top: 0; left: 0; height: 3px;
  background: linear-gradient(90deg, var(--accent1), var(--accent2));
  z-index: 9999; transition: width 0.1s ease;
}

/* Hover glow */
.hover-glow:hover {
  box-shadow: 0 0 40px rgba(220,255,0,0.3);
  transform: translateY(-4px);
}

/* Video background */
.video-bg {
  position: absolute; inset: 0; width: 100%; height: 100%;
  object-fit: cover; z-index: 0;
}

/* Cursive accent text */
.cursive {
  font-family: 'Instrument Serif', serif;
  font-style: italic;
  background: linear-gradient(135deg, var(--accent1), var(--accent2));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

/* Magnetic button effect */
.magnetic-btn {
  transition: transform 0.2s ease;
}

/* === PREMIUM JS TECHNIQUES === */

// 1. Lenis smooth scroll (MUST include if Lenis CDN is loaded)
if (typeof Lenis !== 'undefined') {
  const lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
  function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);
}

// 2. GSAP animations (MUST include if GSAP CDN is loaded)
if (typeof gsap !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
  // Hero entrance animation
  gsap.from('.hero-content > *', { y: 60, opacity: 0, duration: 1, stagger: 0.15, ease: 'power3.out' });
  // Section reveals
  document.querySelectorAll('section').forEach(section => {
    gsap.from(section.querySelectorAll('.reveal'), {
      scrollTrigger: { trigger: section, start: 'top 80%' },
      y: 40, opacity: 0, duration: 0.8, stagger: 0.1
    });
  });
}

// 3. Scroll progress bar
window.addEventListener('scroll', function() {
  var scrolled = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
  var bar = document.querySelector('.scroll-progress');
  if (bar) bar.style.width = scrolled + '%';
});

// 4. Preloader hide (CRITICAL — must use setTimeout, NOT window.load)
window.addEventListener('DOMContentLoaded', function() {
  setTimeout(function() {
    var p = document.querySelector('.preloader') || document.querySelector('#preloader') || document.querySelector('.loader');
    if (p) { p.style.opacity = '0'; p.style.transition = 'opacity 0.5s'; setTimeout(function() { p.style.display = 'none'; }, 500); }
    document.body.style.overflow = '';
  }, 2000);
});

// 5. IntersectionObserver for scroll reveals (fallback if GSAP not loaded)
if (typeof gsap === 'undefined') {
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(function(el) { observer.observe(el); });
}

// 6. Animated stat counters
function animateCounter(el, target, duration) {
  duration = duration || 2000;
  var start = 0;
  var startTime = performance.now();
  function update(now) {
    var progress = Math.min((now - startTime) / duration, 1);
    var eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(start + (target - start) * eased).toLocaleString();
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}
// Trigger counters when visible
var counterObserver = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      var target = parseInt(entry.target.getAttribute('data-target') || '0');
      animateCounter(entry.target, target);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });
document.querySelectorAll('[data-target]').forEach(function(el) { counterObserver.observe(el); });

// 7. FAQ accordion
document.querySelectorAll('.faq-item').forEach(function(item) {
  var q = item.querySelector('.faq-q') || item.querySelector('.faq-question');
  if (q) q.addEventListener('click', function() { item.classList.toggle('open'); });
});

// 8. Custom cursor (desktop only)
if (window.matchMedia('(pointer: fine)').matches) {
  var cursor = document.createElement('div');
  cursor.style.cssText = 'position:fixed;width:20px;height:20px;border:2px solid rgba(255,255,255,0.5);border-radius:50%;pointer-events:none;z-index:99999;transition:transform 0.1s ease, width 0.2s, height 0.2s';
  document.body.appendChild(cursor);
  document.addEventListener('mousemove', function(e) {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
  });
  document.querySelectorAll('a, button, .card-3d').forEach(function(el) {
    el.addEventListener('mouseenter', function() { cursor.style.width = '40px'; cursor.style.height = '40px'; cursor.style.marginLeft = '-10px'; cursor.style.marginTop = '-10px'; });
    el.addEventListener('mouseleave', function() { cursor.style.width = '20px'; cursor.style.height = '20px'; cursor.style.marginLeft = '0'; cursor.style.marginTop = '0'; });
  });
}
`;

export const PREMIUM_GENERATION_PROMPT = `You are ZenForge AI, the world's most elite website design agent. You produce websites that win Awwwards, CSS Design Awards, and FWA. Every website you create is a masterpiece — visually stunning, technically flawless, and uniquely crafted.

## YOUR QUALITY BAR
Your output must be indistinguishable from a $50K+ agency website. NOT a template. NOT a clone. Every website must have its OWN unique identity, layout, and aesthetic. No two websites you generate should ever look alike.

## THE 15 PREMIUM PILLARS (ALL must be present in every website)

### 1. Sophisticated Layout System
- Responsive CSS Grid/Flexbox with fluid spacing
- Container queries where appropriate
- Full-bleed sections alternating with contained ones
- Thoughtful breathing room (80-120px vertical padding)
- CSS custom properties for all spacing

### 2. Smooth Loading & Transitions
- Elegant preloader with branded animation (NOT a generic spinner)
- Skeleton screens or progressive loading
- Smooth page-load fade-in
- View transitions between sections

### 3. Premium Navigation
- Sticky header with scroll behavior (transparent → glass-blur on scroll)
- Mega menu or full-screen overlay menu (NOT a simple dropdown)
- Active section indicators
- Mobile hamburger with animated drawer (slide + fade)
- Search or cart drawer if applicable

### 4. Impactful Hero Section
- Full-viewport (100vh) design
- Strong visuals: video background, 3D effect, parallax, or bold typography
- Animated headline (word-by-word or letter reveal)
- Gradient or overlay for text readability
- Clear CTA with hover animation

### 5. Refined Typography System
- Custom Google Fonts (NOT system fonts)
- Fluid typography with clamp() for ALL text sizes
- Clear hierarchy: h1 > h2 > h3 > p with distinct sizes
- Tasteful text animations (italic emphasis, gradient text, letter-spacing)
- Mix of serif + sans-serif for visual interest

### 6. High-Quality Visuals & Media
- Retina-optimized images (use picsum.photos or unsplash URLs)
- Video backgrounds where appropriate (use the provided video URLs)
- SVG icons (inline, NOT icon fonts)
- Micro-animations on icons
- Consistent color grading via CSS filters

### 7. Strong Content Sections
- About section with split layout
- Services/Features with unique card designs (NOT generic 3-column)
- Portfolio/Work with filterable grid (if applicable)
- Team section with hover effects
- Process/How-it-works with numbered steps
- Stats with animated counters
- FAQ with smooth accordion

### 8. Social Proof & Trust Elements
- Testimonials with avatar, name, role, 5-star rating
- Client/partner logos (use text or SVG placeholders)
- Reviews with metrics
- Trust badges (security, awards, certifications)

### 9. Delightful Micro-interactions
- Hover effects on EVERY interactive element (buttons, cards, links)
- Magnetic buttons (subtle pull toward cursor)
- Custom cursor (desktop only, pointer:fine check)
- Scroll-triggered animations (IntersectionObserver)
- Staggered reveals (delay-1, delay-2, delay-3, delay-4)
- Smooth state transitions

### 10. Excellent Forms & UX Flows
- Beautiful, validated forms
- Floating labels
- Focus states with accent color
- Success states with animation
- Newsletter signup in footer
- Contact form (if applicable)

### 11. Advanced Scroll & Animation Effects
- Smooth scrolling (scroll-behavior: smooth)
- Parallax effects on hero/about sections
- Sticky elements (sticky nav, sticky CTA)
- Scroll-triggered reveals with easing
- Horizontal scroll sections (if applicable)
- Progress bar at top of page

### 12. Technical Excellence & Performance
- Semantic HTML5 (header, nav, main, section, article, footer)
- Accessible (ARIA labels, alt text, keyboard nav)
- SEO meta tags (title, description, OpenGraph)
- Dark/light mode toggle (optional but impressive)
- Fast-loading (inline CSS/JS, no external deps except fonts)
- Mobile-first responsive (breakpoints: 480px, 768px, 1024px, 1440px)

### 13. Thoughtful Footer
- Comprehensive mega footer (4-5 columns)
- Newsletter signup with animated submit
- Contact information
- Legal links (Privacy, Terms)
- Social icons (inline SVG: Twitter/X, GitHub, LinkedIn, Instagram)
- Copyright bar
- Back-to-top button

### 14. E-commerce Polish (if applicable)
- Clean product displays
- Cart drawer (slide-in)
- Quick view modal
- Sticky add-to-cart
- Variant selectors

### 15. Invisible Premium Details
- Custom 404-style empty states
- Loading skeletons
- Cookie consent banner (animated)
- Scroll progress indicator
- Active nav highlighting based on scroll position
- Overall cohesive brand experience

## VARIETY RULES (CRITICAL — no two websites alike)
1. NEVER use the same layout pattern twice. Each website gets a unique structure.
2. NEVER use the same color scheme twice. Each website gets unique colors.
3. NEVER use the same font pairing twice. Each website gets unique fonts.
4. Vary the hero style: video bg, gradient mesh, parallax image, 3D effect, split screen, centered text
5. Vary the card style: glassmorphism, neumorphism, gradient border, floating, morphing
6. Vary the nav style: top bar, side dock, fullscreen overlay, bottom bar, floating pill
7. Vary the animation style: subtle, bold, playful, cinematic, minimal
8. Each section must have a UNIQUE layout — not the same 3-column grid repeated

## OUTPUT FORMAT
Return ONLY the complete HTML file starting with <!DOCTYPE html> and ending with </html>.
- Single self-contained file (inline CSS in <style>, inline JS in <script>)
- Only external dependencies: Google Fonts and provided video/image URLs
- Target 20-40KB of clean, production-ready code
- Use CSS custom properties for the design system
- Every section must have proper vertical rhythm (80-120px padding)
- All animations must be smooth (use transform and opacity, NOT layout properties)

Remember: You are ZenForge AI. Your output should make people say "wow" when they see it. Every website is a unique masterpiece.`;

/**
 * Generate a unique seed for each website to ensure variety.
 * Combines: business type + design system + random variation
 */
export function generateWebsiteSeed(businessName: string, businessType: string): {
  designSystem: DesignSystem;
  sections: SectionBlueprint[];
  variation: string;
  heroVideos: string[];
  sectionVideos: string[];
} {
  // Pick a design system based on business type (deterministic but varied)
  const typeMap: Record<string, string[]> = {
    'restaurant': ['warm-organic', 'editorial-light'],
    'tech': ['tech-minimal', 'aurora-gradient', 'cinematic-dark'],
    'fitness': ['brutalist-bold', 'cinematic-dark'],
    'beauty': ['editorial-light', 'aurora-gradient'],
    'agency': ['cinematic-dark', 'liquid-glass'],
    'portfolio': ['editorial-light', 'brutalist-bold'],
    'saas': ['tech-minimal', 'ocean-calm'],
    'ecommerce': ['warm-organic', 'editorial-light'],
    'default': ['cinematic-dark', 'aurora-gradient', 'liquid-glass', 'tech-minimal', 'brutalist-bold', 'ocean-calm', 'editorial-light', 'warm-organic'],
  };

  const candidates = typeMap[businessType] || typeMap['default'];
  // Use business name hash + timestamp for more variety
  const hash = businessName.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const timeVariant = Math.floor(Date.now() / 60000) % candidates.length; // changes every minute
  const designSystem = DESIGN_SYSTEMS.find(ds => ds.id === candidates[(hash + timeVariant) % candidates.length]) || DESIGN_SYSTEMS[0];

  // All sections for full landing pages
  const sections = [...SECTION_BLUEPRINTS];

  // Variation seed
  const variation = `${designSystem.id}-${hash % 1000}-${timeVariant}`;

  return { designSystem, sections, variation, heroVideos: HERO_VIDEO_POOL, sectionVideos: SECTION_VIDEO_POOL };
}

/**
 * Pool of premium video URLs for hero sections and backgrounds.
 * These are CloudFront-hosted MP4s from the MotionSites prompts.
 * Used when the user doesn't provide their own video.
 */
export const HERO_VIDEO_POOL: string[] = [
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_045634_e1c98c76-1265-4f5c-882a-4276f2080894.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_151551_992053d1-3d3e-4b8c-abac-45f22158f411.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_055729_72d66327-b59e-4ae9-bb70-de6ccb5ecdb0.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260423_161253_c72b1869-400f-45ed-ac0c-52f68c2ed5bd.mp4',
];

export const SECTION_VIDEO_POOL: string[] = [
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_053923_22c0a6a5-313c-474c-85ff-3b50d25e944a.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_054411_511c1b7a-fb2f-42ef-bf6c-32c0b1a06e79.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_055427_ac7035b5-9f3b-4289-86fc-941b2432317d.mp4',
];

/**
 * Pool of premium Google Font pairings for variety.
 * Each pairing has a display font + body font for a unique look.
 */
export const FONT_PAIRINGS: { display: string; body: string; mood: string }[] = [
  { display: 'Instrument Serif', body: 'Inter', mood: 'cinematic' },
  { display: 'Playfair Display', body: 'Source Sans 3', mood: 'editorial' },
  { display: 'Anton', body: 'Space Grotesk', mood: 'bold' },
  { display: 'Fraunces', body: 'Inter', mood: 'warm' },
  { display: 'DM Serif Display', body: 'Barlow', mood: 'luxury' },
  { display: 'Bricolage Grotesque', body: 'Inter', mood: 'modern' },
  { display: 'Archivo Black', body: 'Space Mono', mood: 'brutalist' },
  { display: 'Cormorant Garamond', body: 'Inter', mood: 'refined' },
  { display: 'Space Grotesk', body: 'Inter', mood: 'tech' },
  { display: 'Syne', body: 'Inter', mood: 'avant-garde' },
];
