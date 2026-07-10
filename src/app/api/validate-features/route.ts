import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 10;
export const dynamic = 'force-dynamic';

/**
 * POST /api/validate-features
 * Validates HTML against the 16 premium feature checklist.
 * Body: { html: string }
 * Returns: { score, total, passed, features: [{name, present}], missing: [] }
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const html: string = typeof body.html === 'string' ? body.html : String(body.html || '');
    if (!html || html.length < 50) {
      return NextResponse.json({ error: 'HTML required (min 50 chars)' }, { status: 400 });
    }

    const socials = ['twitter', 'github', 'linkedin', 'instagram'];
    const hasSocials = socials.some(p => html.toLowerCase().includes(p));

    const features = [
      { name: '1. DOCTYPE + semantic HTML5', present: html.includes('<!DOCTYPE') && (html.includes('<section') || html.includes('<nav') || html.includes('<header') || html.includes('<footer')) },
      { name: '2. CSS Custom Properties', present: html.includes('--zf-bg') || html.includes(':root') || html.includes('--accent') },
      { name: '3. Fluid typography (clamp)', present: html.includes('clamp(') },
      { name: '4. Glassmorphism (backdrop-filter)', present: html.includes('backdrop-filter') },
      { name: '5. Gradient accents', present: html.toLowerCase().includes('gradient') },
      { name: '6. Hero section', present: html.toLowerCase().includes('hero') },
      { name: '7. Responsive (@media 768/1024)', present: html.includes('@media') && (html.includes('768') || html.includes('1024')) },
      { name: '8. IntersectionObserver', present: html.includes('IntersectionObserver') },
      { name: '9. Animated counters', present: html.includes('requestAnimationFrame') || html.includes('data-target') },
      { name: '10. Scroll progress bar', present: html.includes('zfScrollProgress') || html.includes('scroll-progress') },
      { name: '11. Back-to-top button', present: html.includes('zfBackTop') || html.includes('back-top') },
      { name: '12. Custom cursor', present: html.includes('pointer:fine') },
      { name: '13. FAQ accordion', present: html.toLowerCase().includes('faq') && html.includes('addEventListener') },
      { name: '14. Testimonials', present: html.toLowerCase().includes('testimonial') },
      { name: '15. Preloader (setTimeout hide)', present: html.includes('setTimeout') && html.toLowerCase().includes('hide') },
      { name: '16. SVG social icons', present: html.includes('svg') && hasSocials },
    ];

    const passed = features.filter(f => f.present).length;
    const missing = features.filter(f => !f.present).map(f => f.name);

    return NextResponse.json({
      score: passed,
      total: 16,
      passed: passed === 16,
      features,
      missing,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'unknown' }, { status: 500 });
  }
}
