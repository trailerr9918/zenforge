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
 * Inject a force-hide script for preloaders.
 * Many LLM-generated websites have preloaders that wait for window.load
 * or some custom event that never fires (especially with slow video backgrounds).
 * This script forces the preloader to hide after 2 seconds regardless,
 * using BOTH CSS injection (instant) and JS (with animation).
 */
function fixPreloader(html: string): string {
  const forceHideScript = `
<!-- ZENFORGE PRELOADER FIX — force hide after 2s -->
<style>
/* Immediately make preloader elements hideable */
.preloader, #preloader, .loader, #loader, .loading, #loading,
.spinner, #spinner, .preload, #preload, .page-loader, #page-loader,
.app-loader, #app-loader, .init-loader, #init-loader,
[class*="preloader"], [class*="loader"], [id*="preloader"], [id*="loader"] {
  transition: opacity 0.5s ease, visibility 0.5s ease !important;
}
/* Force hide class — applied by JS after 2s */
.zf-force-hide {
  opacity: 0 !important;
  visibility: hidden !important;
  pointer-events: none !important;
}
.zf-force-none {
  display: none !important;
}
</style>
<script>
(function() {
  function hidePreloader() {
    var selectors = [
      '.preloader', '#preloader', '.loader', '#loader',
      '.loading', '#loading', '.spinner', '#spinner',
      '.preload', '#preload', '.page-loader', '#page-loader',
      '.app-loader', '#app-loader', '.init-loader', '#init-loader',
      '[class*="preloader"]', '[class*="loader"]', '[id*="preloader"]', '[id*="loader"]'
    ];
    selectors.forEach(function(sel) {
      try {
        var els = document.querySelectorAll(sel);
        els.forEach(function(el) {
          el.classList.add('zf-force-hide');
          setTimeout(function() { el.classList.add('zf-force-none'); el.style.display = 'none'; }, 600);
        });
      } catch(e) {}
    });
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }
  // Hide after 2 seconds (aggressive)
  setTimeout(hidePreloader, 2000);
  // Also try at 1s and 3s as backup
  setTimeout(hidePreloader, 1000);
  setTimeout(hidePreloader, 3000);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(hidePreloader, 500); });
  } else {
    setTimeout(hidePreloader, 500);
  }
  window.addEventListener('load', function() { setTimeout(hidePreloader, 300); });
})();
</script>`;

  // Inject before </head> (for CSS) and before </body> (for JS)
  if (html.includes('</head>')) {
    html = html.replace('</head>', forceHideScript + '\n</head>');
  } else if (html.includes('</body>')) {
    html = html.replace('</body>', forceHideScript + '\n</body>');
  } else if (html.includes('</html>')) {
    html = html.replace('</html>', forceHideScript + '\n</html>');
  } else {
    html = html + forceHideScript;
  }
  return html;
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

    // Auto-repair truncated HTML, then fix preloaders
    let html = repairHtml(site.html);
    html = fixPreloader(html);

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
