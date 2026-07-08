/**
 * Client-side audit logger — captures user interactions and POSTs them to /api/logs.
 * Based on supabase-session-persistence-guide.md Layer 6 (Audit Logging).
 *
 * Captures:
 *   - Tab switches
 *   - Button clicks (with action labels via data-audit attribute)
 *   - Page load / unload
 *   - Visibility changes (tab background/foreground)
 *   - Errors (window.onerror + unhandledrejection)
 *
 * Usage:
 *   import { logClientAction } from '@/hooks/use-audit-logger';
 *   logClientAction('button.click', { label: 'Generate website' });
 *
 *   Or add data-audit attribute to any clickable element:
 *   <button data-audit="generate.click">Generate</button>
 *   (the global listener will capture it automatically)
 */

'use client';

const LOG_ENDPOINT = '/api/logs';

/** Log a client-side action to the server */
export function logClientAction(
  action: string,
  details?: Record<string, any>,
  level: 'info' | 'warn' | 'error' | 'audit' = 'audit'
) {
  if (typeof window === 'undefined') return;
  try {
    const message = details?.label ? `${action}: ${details.label}` : action;
    fetch(LOG_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level,
        source: 'client',
        action,
        message,
        details: {
          ...details,
          url: window.location.href,
          viewport: { width: window.innerWidth, height: window.innerHeight },
          timestamp: new Date().toISOString(),
        },
      }),
    }).catch(() => {});
  } catch {}
}

/** Log an error from client-side */
export function logClientError(source: string, error: Error | string, details?: Record<string, any>) {
  const msg = typeof error === 'string' ? error : error.message;
  logClientAction('error', { source, error: msg, ...details }, 'error');
}

// === Auto-install global listeners (runs once on module import in browser) ===
let installed = false;
export function installAuditLogger() {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  // Capture clicks on elements with data-audit attribute
  document.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement)?.closest('[data-audit]');
    if (target) {
      const action = target.getAttribute('data-audit') || 'click';
      const label = target.getAttribute('data-audit-label') || target.textContent?.slice(0, 60);
      logClientAction(action, { label, tag: target.tagName.toLowerCase() });
    }
  }, true);

  // Capture unhandled errors
  window.addEventListener('error', (e) => {
    logClientError('window', e.error || e.message, {
      filename: e.filename,
      lineno: e.lineno,
      colno: e.colno,
    });
  });

  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', (e) => {
    logClientError('promise', e.reason instanceof Error ? e.reason : String(e.reason));
  });

  // Log page load
  logClientAction('page.load', { url: window.location.href });

  // Log page unload (best-effort, may not always fire)
  window.addEventListener('beforeunload', () => {
    logClientAction('page.unload', { url: window.location.href });
  });

  // Log visibility changes (tab background/foreground)
  document.addEventListener('visibilitychange', () => {
    logClientAction('tab.visibility', { state: document.visibilityState });
  });

  // Capture console.error (first 3 args only)
  const origError = console.error;
  console.error = function (...args: any[]) {
    origError.apply(console, args as any);
    try {
      const msg = args.slice(0, 3).map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ').slice(0, 300);
      logClientError('console', msg);
    } catch {}
  };
}
