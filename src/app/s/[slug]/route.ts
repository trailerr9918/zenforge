import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Auto-repair truncated HTML — if a generated website was cut off
 * mid-generation (token limit), close open tags so it renders.
 */
function repairHtml(html: string): string {
  let result = html.trim();

  // If already complete with all closing tags, return as-is
  if (result.includes('</html>') && result.includes('</body>') && result.includes('</style>')) return result;

  // Fix missing </style>
  if (result.includes('<style>') && !result.includes('</style>')) {
    const lastBrace = result.lastIndexOf('}');
    const lastOpenBrace = result.lastIndexOf('{');
    if (lastOpenBrace > lastBrace) result += '}';
    result += '\n</style>';
  }

  // Fix missing </head>
  if (result.includes('<head>') && !result.includes('</head>')) {
    result += '\n</head>';
  }

  // Fix missing </body>
  if (result.includes('<body') && !result.includes('</body>')) {
    if (result.includes('</html>')) {
      result = result.replace('</html>', '</body>\n</html>');
    } else {
      result += '\n</body>';
    }
  }

  // Fix missing </html>
  if (!result.includes('</html>')) {
    result += '\n</html>';
  }

  return result;
}

/**
 * Inject ALL missing premium features into generated HTML.
 * This guarantees 16/16 features regardless of which LLM model generated the HTML.
 * The LLM's creative output (design, colors, content, layout) is preserved.
 * Only missing TECHNICAL features are injected.
 */
function injectPremiumFeatures(html: string): string {
  let result = html;

  // === 1. PRELOADER FORCE-HIDE (always inject) ===
  const preloaderFix = `<style>.preloader,#preloader,.loader,#loader,.loading,#loading,.spinner,#spinner,.preload,.page-loader,[class*="preload"],[class*="load"]{transition:opacity .5s ease,visibility .5s ease!important}.zf-force-hide{opacity:0!important;visibility:hidden!important;pointer-events:none!important}.zf-force-none{display:none!important}</style>
<script>(function(){function h(){var s=['.preloader','#preloader','.loader','#loader','.loading','#loading','.spinner','#spinner','.preload','.page-loader','[class*="preload"]','[class*="load"]'];s.forEach(function(sel){try{document.querySelectorAll(sel).forEach(function(el){el.classList.add('zf-force-hide');setTimeout(function(){el.classList.add('zf-force-none');el.style.display='none';},600);});}catch(e){}});document.body.style.overflow='';document.documentElement.style.overflow='';}setTimeout(h,2000);setTimeout(h,3000);if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',function(){setTimeout(h,500);});}else{setTimeout(h,500);}window.addEventListener('load',function(){setTimeout(h,300);});})();</script>`;

  // === 2. INTERSECTIONOBSERVER (if missing) ===
  const intersectionObserver = !result.includes('IntersectionObserver') ? `<script>(function(){var obs=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting)e.target.classList.add('visible');});},{threshold:0.1});document.querySelectorAll('.reveal').forEach(function(el){obs.observe(el);});document.querySelectorAll('section').forEach(function(el){if(!el.classList.contains('reveal')&&!el.querySelector('.reveal')){el.style.opacity='0';el.style.transition='opacity 0.8s ease,transform 0.8s ease';el.style.transform='translateY(30px)';var o2=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting){e.target.style.opacity='1';e.target.style.transform='translateY(0)';}});},{threshold:0.1});o2.observe(el);}});})();</script>` : '';

  // === 3. ANIMATED COUNTERS (if missing) ===
  const animatedCounters = (!result.includes('requestAnimationFrame') || !result.includes('data-target')) ? `<script>(function(){var nums=document.querySelectorAll('.stat-num,.counter,[class*="stat"]:not(.stat-label)');if(!nums.length)return;var hasTarget=Array.from(nums).some(function(n){return n.hasAttribute('data-target');});if(!hasTarget){nums.forEach(function(n){var txt=n.textContent.trim();var num=parseInt(txt.replace(/[^0-9]/g,''));if(num>0){n.setAttribute('data-target',num);n.textContent='0';}});}var obs=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting){var el=e.target;var target=parseInt(el.getAttribute('data-target')||'0');var start=0;var startTime=performance.now();function update(now){var p=Math.min((now-startTime)/2000,1);var eased=1-Math.pow(1-p,3);el.textContent=Math.floor(start+(target-start)*eased).toLocaleString();if(p<1)requestAnimationFrame(update);}requestAnimationFrame(update);obs.unobserve(el);}});},{threshold:0.5});document.querySelectorAll('[data-target]').forEach(function(el){obs.observe(el);});})();</script>` : '';

  // === 4. SCROLL PROGRESS BAR (if missing) ===
  const scrollProgress = (!result.includes('scroll-progress') && !result.includes('scrollProgress')) ? `<style>.zf-scroll-progress{position:fixed;top:0;left:0;height:3px;background:linear-gradient(90deg,#FF6B35,#FFD93D);z-index:9999;transition:width 0.1s;}</style><div class="zf-scroll-progress" id="zfScrollProgress" style="width:0"></div><script>window.addEventListener('scroll',function(){var sp=document.getElementById('zfScrollProgress');if(sp)sp.style.width=(window.scrollY/(document.body.scrollHeight-window.innerHeight)*100)+'%';});</script>` : '';

  // === 5. BACK-TO-TOP BUTTON (if missing) ===
  const backToTop = (!result.includes('back-to-top') && !result.includes('backToTop')) ? `<style>.zf-back-top{position:fixed;bottom:20px;right:20px;width:44px;height:44px;border-radius:50%;background:#FF6B35;color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.3s;z-index:100;}</style><button class="zf-back-top" id="zfBackTop" onclick="window.scrollTo({top:0,behavior:'smooth'})"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 15l-6-6-6 6"/></svg></button><script>window.addEventListener('scroll',function(){var bt=document.getElementById('zfBackTop');if(bt)bt.style.opacity=window.scrollY>300?'1':'0';});</script>` : '';

  // === 6. SOCIAL SVG ICONS (if footer exists but no social icons) ===
  const socialIcons = (result.includes('<footer') && !result.includes('twitter') && !result.includes('github') && !result.includes('linkedin')) ? `<style>.zf-social{display:flex;gap:12px;padding:12px 0;}.zf-social a{color:inherit;opacity:0.7;transition:opacity 0.2s;}.zf-social a:hover{opacity:1;}.zf-social svg{width:20px;height:20px;}</style><div class="zf-social"><a href="#" aria-label="Twitter"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a><a href="#" aria-label="GitHub"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg></a><a href="#" aria-label="LinkedIn"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></a><a href="#" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg></a></div>` : '';

  // === 7. CUSTOM CURSOR (if missing) ===
  const customCursor = (!result.includes('pointer:fine') && !result.includes('pointer: fine')) ? `<script>if(window.matchMedia('(pointer:fine)').matches){var c=document.createElement('div');c.style.cssText='position:fixed;width:20px;height:20px;border:2px solid rgba(255,255,255,0.4);border-radius:50%;pointer-events:none;z-index:99999;transition:width 0.2s,height 0.2s';document.body.appendChild(c);document.addEventListener('mousemove',function(e){c.style.left=e.clientX+'px';c.style.top=e.clientY+'px';});document.querySelectorAll('a,button').forEach(function(el){el.addEventListener('mouseenter',function(){c.style.width='40px';c.style.height='40px';c.style.marginLeft='-10px';c.style.marginTop='-10px';});el.addEventListener('mouseleave',function(){c.style.width='20px';c.style.height='20px';c.style.marginLeft='0';c.style.marginTop='0';});});}</script>` : '';

  // === INJECT ALL ===
  const allInjections = preloaderFix + intersectionObserver + animatedCounters + scrollProgress + backToTop + customCursor;

  // Inject into </head> for CSS and </body> for JS
  if (result.includes('</head>')) {
    result = result.replace('</head>', scrollProgress + '\n</head>');
  }
  if (result.includes('</footer>')) {
    result = result.replace('</footer>', socialIcons + '\n</footer>');
  }
  if (result.includes('</body>')) {
    result = result.replace('</body>', allInjections + '\n</body>');
  } else if (result.includes('</html>')) {
    result = result.replace('</html>', allInjections + '\n</html>');
  } else {
    result = result + allInjections;
  }

  return result;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const { getWebsiteFromSupabase } = await import('@/lib/supabase-client');
    const site = await getWebsiteFromSupabase(slug);
    if (!site) {
      return new NextResponse(
        `<!DOCTYPE html><html><head><title>Site not found</title></head><body style="font-family:system-ui;background:#0a0a0a;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0"><div style="text-align:center"><h1 style="font-size:48px;margin:0 0 16px">404</h1><p style="color:#888;margin:0 0 24px">Site "${slug}" not found</p><a href="/" style="color:#fff;border:1px solid #333;padding:12px 24px;border-radius:8px;text-decoration:none">← Back to studio</a></div></body></html>`,
        { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    // Auto-repair truncated HTML, then inject premium CSS + features
    let html = repairHtml(site.html);
    // Inject premium CSS design system (makes any site look $50K)
    try {
      const { injectPremiumCSS } = await import('@/lib/premium-css-foundation');
      html = injectPremiumCSS(html);
    } catch (e) { console.error('[slug] CSS inject error:', e); }
    // Inject missing premium features (JS: IntersectionObserver, counters, etc.)
    html = injectPremiumFeatures(html);

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch (e) {
    return new NextResponse('Server error', { status: 500 });
  }
}
