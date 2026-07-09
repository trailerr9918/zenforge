/**
 * Premium CSS Foundation
 * ======================
 * 
 * This CSS gets injected into every generated website to ensure
 * premium design quality. The LLM's content is preserved, but
 * this CSS provides the visual foundation that makes sites look $50K.
 * 
 * This is NOT a template — it's a design system (like Tailwind but
 * custom-built for premium aesthetics).
 */

export const PREMIUM_CSS = `
/* === ZENFORGE PREMIUM DESIGN SYSTEM === */
:root {
  --zf-bg: #0A0A0A;
  --zf-text: #FFFFFF;
  --zf-accent: #DCFF00;
  --zf-accent2: #64CEFB;
  --zf-muted: rgba(255,255,255,0.6);
  --zf-card: rgba(255,255,255,0.05);
  --zf-border: rgba(255,255,255,0.1);
  --zf-radius: 16px;
  --zf-radius-sm: 8px;
  --zf-radius-lg: 24px;
  --zf-transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  --zf-shadow: 0 20px 40px rgba(0,0,0,0.3);
  --zf-shadow-glow: 0 0 40px rgba(220,255,0,0.15);
  --zf-font-display: 'Instrument Serif', serif;
  --zf-font-body: 'Inter', sans-serif;
  --zf-font-mono: 'Space Grotesk', sans-serif;
  --zf-max-width: 1200px;
  --zf-section-padding: clamp(4rem, 10vw, 8rem);
}

/* === RESET & BASE === */
* { margin: 0; padding: 0; box-sizing: border-box; }
html { scroll-behavior: smooth; -webkit-font-smoothing: antialiased; }
body { font-family: var(--zf-font-body); background: var(--zf-bg); color: var(--zf-text); overflow-x: hidden; line-height: 1.6; }
img, video { max-width: 100%; height: auto; }
a { color: inherit; text-decoration: none; transition: color var(--zf-transition); }
a:hover { color: var(--zf-accent); }
button { font-family: inherit; cursor: pointer; border: none; background: none; color: inherit; }

/* === TYPOGRAPHY === */
h1, h2, h3, h4 { font-family: var(--zf-font-display); font-weight: 400; line-height: 1.1; letter-spacing: -0.02em; }
h1 { font-size: clamp(2.5rem, 7vw, 5.5rem); }
h2 { font-size: clamp(2rem, 5vw, 3.5rem); }
h3 { font-size: clamp(1.2rem, 2vw, 1.5rem); font-family: var(--zf-font-body); font-weight: 600; }
p { font-size: clamp(0.95rem, 1.2vw, 1.1rem); color: var(--zf-muted); }
em { font-style: italic; color: var(--zf-accent); }

/* === LAYOUT === */
section { padding: var(--zf-section-padding) 1.5rem; max-width: var(--zf-max-width); margin: 0 auto; }
.section-title { text-align: center; margin-bottom: 4rem; }
.section-title h2 { margin-bottom: 1rem; }
.section-title p { max-width: 600px; margin: 0 auto; }

/* === NAVIGATION === */
nav, .nav, header {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  padding: 1.5rem 2rem; display: flex; justify-content: space-between; align-items: center;
  transition: all var(--zf-transition);
}
nav.scrolled, .nav.scrolled, header.scrolled {
  background: rgba(10,10,10,0.8); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  padding: 1rem 2rem; border-bottom: 1px solid var(--zf-border);
}
nav .logo, .nav .logo, header .logo { font-family: var(--zf-font-mono); font-weight: 700; font-size: 1.2rem; }
nav ul, .nav ul { display: flex; gap: 2rem; list-style: none; }
nav a, .nav a { color: var(--zf-muted); font-size: 0.9rem; }

/* === HERO === */
.hero, [class*="hero"] {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  position: relative; overflow: hidden; text-align: center;
}
.hero video, [class*="hero"] video {
  position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0; opacity: 0.4;
}
.hero-overlay, [class*="overlay"] {
  position: absolute; inset: 0; z-index: 1;
  background: linear-gradient(to bottom, rgba(10,10,10,0.5) 0%, rgba(10,10,10,0.3) 50%, rgba(10,10,10,0.95) 100%);
}
.hero-content, [class*="hero-content"], [class*="hero-text"] {
  position: relative; z-index: 2; max-width: 900px; padding: 0 2rem;
}
.hero h1, [class*="hero"] h1 { margin-bottom: 1.5rem; }
.hero p, [class*="hero"] p { font-size: clamp(1rem, 1.5vw, 1.3rem); margin-bottom: 2rem; max-width: 600px; margin-left: auto; margin-right: auto; }

/* === BUTTONS === */
.cta-btn, .btn-primary, button[type="submit"], .cta {
  display: inline-block; padding: 1rem 2.5rem;
  background: linear-gradient(135deg, var(--zf-accent), var(--zf-accent2));
  color: var(--zf-bg); text-decoration: none; border-radius: 999px;
  font-weight: 600; font-size: 0.95rem; transition: transform var(--zf-transition), box-shadow var(--zf-transition);
}
.cta-btn:hover, .btn-primary:hover { transform: translateY(-3px); box-shadow: var(--zf-shadow-glow); }

/* === CARDS (GLASSMORPHISM) === */
.feature-card, .card, [class*="card"]:not([class*="carousel"]) {
  background: var(--zf-card); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--zf-border); border-radius: var(--zf-radius); padding: 2rem;
  transition: transform var(--zf-transition), box-shadow var(--zf-transition);
}
.feature-card:hover, .card:hover { transform: translateY(-8px); box-shadow: var(--zf-shadow); }
.feature-card svg, .card svg { width: 32px; height: 32px; color: var(--zf-accent); margin-bottom: 1rem; }

/* === GRIDS === */
.features-grid, .grid, [class*="grid"]:not([class*="grid-template"]) {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem;
}
.stats-grid, [class*="stats"] { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2rem; text-align: center; }
.testimonials-grid, [class*="testimonials"] { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }

/* === STATS === */
.stat-num, [class*="stat-num"], .counter {
  font-family: var(--zf-font-display); font-size: clamp(2.5rem, 5vw, 4rem);
  background: linear-gradient(135deg, var(--zf-accent), var(--zf-accent2));
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.stat-label, [class*="stat-label"] { font-size: 0.85rem; color: var(--zf-muted); text-transform: uppercase; letter-spacing: 0.1em; margin-top: 0.5rem; }

/* === TESTIMONIALS === */
.testimonial-card, [class*="testimonial"] {
  background: var(--zf-card); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--zf-border); border-radius: var(--zf-radius); padding: 2rem;
}
.testimonial-card img, [class*="testimonial"] img { width: 48px; height: 48px; border-radius: 50%; margin-bottom: 1rem; }
.stars, [class*="stars"] { display: flex; gap: 2px; margin-bottom: 1rem; }
.stars svg, [class*="stars"] svg { width: 16px; height: 16px; color: var(--zf-accent); }

/* === FAQ === */
.faq-item, [class*="faq-item"], .accordion-item {
  border-bottom: 1px solid var(--zf-border); padding: 1.5rem 0; cursor: pointer;
}
.faq-q, [class*="faq-q"], .faq-question { display: flex; justify-content: space-between; align-items: center; font-weight: 600; font-size: 1.05rem; }
.faq-a, [class*="faq-a"], .faq-answer { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; color: var(--zf-muted); }
.faq-item.open .faq-a, .open [class*="faq-a"] { max-height: 200px; padding-top: 1rem; }
.faq-icon, [class*="faq-icon"] { transition: transform 0.3s; font-size: 1.5rem; color: var(--zf-accent); }
.faq-item.open .faq-icon, .open [class*="faq-icon"] { transform: rotate(45deg); }

/* === FOOTER === */
footer, .footer {
  background: #050505; padding: 4rem 2rem 2rem; border-top: 1px solid var(--zf-border);
}
.footer-grid, footer .grid, footer > div {
  max-width: var(--zf-max-width); margin: 0 auto;
  display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 3rem;
}
.footer-col h4, footer h4 { font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 1rem; }
.footer-col a, footer a { display: block; color: var(--zf-muted); font-size: 0.9rem; margin-bottom: 0.5rem; }
.newsletter-form, footer form { display: flex; gap: 0.5rem; margin-top: 1rem; }
.newsletter-form input, footer input {
  flex: 1; padding: 0.75rem 1rem; background: var(--zf-card); border: 1px solid var(--zf-border);
  border-radius: var(--zf-radius-sm); color: var(--zf-text); font-size: 0.9rem; font-family: inherit;
}
.newsletter-form button, footer button[type="submit"] {
  padding: 0.75rem 1.5rem; border-radius: var(--zf-radius-sm); font-weight: 600; font-size: 0.9rem;
}
.footer-bottom, footer > div:last-child {
  max-width: var(--zf-max-width); margin: 3rem auto 0; padding-top: 2rem;
  border-top: 1px solid var(--zf-border); text-align: center; color: var(--zf-muted); font-size: 0.85rem;
}

/* === REVEAL ANIMATIONS === */
.reveal { opacity: 0; transform: translateY(40px); transition: opacity 0.8s ease, transform 0.8s ease; }
.reveal.visible { opacity: 1; transform: translateY(0); }
.delay-1 { transition-delay: 0.1s; } .delay-2 { transition-delay: 0.2s; }
.delay-3 { transition-delay: 0.3s; } .delay-4 { transition-delay: 0.4s; }

/* === RESPONSIVE === */
@media (max-width: 1024px) {
  .stats-grid, [class*="stats"] { grid-template-columns: repeat(2, 1fr); }
  .footer-grid, footer .grid { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 768px) {
  nav ul, .nav ul { display: none; }
  .features-grid, .grid, [class*="grid"] { grid-template-columns: 1fr !important; }
  .testimonials-grid, [class*="testimonials"] { grid-template-columns: 1fr; }
  .footer-grid, footer .grid { grid-template-columns: 1fr; }
  .stats-grid, [class*="stats"] { grid-template-columns: 1fr 1fr; }
  section { padding: 3rem 1rem; }
}

/* === ZF INJECTED FEATURES === */
.zf-scroll-progress { position: fixed; top: 0; left: 0; height: 3px; background: linear-gradient(90deg, var(--zf-accent), var(--zf-accent2)); z-index: 9999; transition: width 0.1s; }
.zf-back-top { position: fixed; bottom: 20px; right: 20px; width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, var(--zf-accent), var(--zf-accent2)); color: var(--zf-bg); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s; z-index: 100; }
.zf-social { display: flex; gap: 12px; padding: 12px 0; }
.zf-social a { color: inherit; opacity: 0.7; transition: opacity 0.2s; }
.zf-social a:hover { opacity: 1; }
.zf-social svg { width: 20px; height: 20px; }
`;

/**
 * Inject the premium CSS into HTML if it doesn't already have comprehensive CSS.
 * This adds a design system foundation that makes any generated website look premium.
 */
export function injectPremiumCSS(html: string): string {
  // Only inject if the HTML doesn't already have comprehensive CSS
  // (check if it has :root variables already)
  if (html.includes('--zf-bg') || html.includes('--zf-accent')) {
    return html; // Already has our design system
  }

  // Inject the CSS before </head> or at the top of the file
  const cssBlock = `<style>${PREMIUM_CSS}</style>`;
  
  if (html.includes('</head>')) {
    return html.replace('</head>', cssBlock + '\n</head>');
  } else if (html.includes('<style>')) {
    // Insert before the first <style> tag
    return html.replace('<style>', cssBlock + '\n<style>');
  } else if (html.includes('<body')) {
    // Insert before <body>
    return html.replace('<body', cssBlock + '\n<body');
  } else {
    // Just prepend
    return cssBlock + '\n' + html;
  }
}
