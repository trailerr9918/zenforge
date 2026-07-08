import { NextRequest, NextResponse } from 'next/server';
// Supabase imported lazily to avoid build-time errors

/**
 * ZenForge Logs API — Comprehensive Audit Logging System
 * ========================================================
 * Based on supabase-session-persistence-guide.md Layer 6 (Audit Logging).
 *
 * Captures EVERYTHING that happens on the website:
 *   - API calls (render-site, generate/agent, cerebrium, seae, ssh, deploy)
 *   - User actions (tab switches, generate clicks, accent changes, button clicks)
 *   - System events (errors, timeouts, auto-evolve cycles, refreshes)
 *   - Evolution cycles (accepted/rejected with fitness scores + review breakdown)
 *   - AI agent messages (incoming + outgoing + tool calls)
 *   - Sandbox commands (with cwd + exit code)
 *   - Performance metrics (durations, latencies)
 *
 * Storage:
 *   - In-memory ring buffer (last 5000 entries) for fast retrieval
 *   - Supabase persistence (every entry, async non-blocking)
 *
 * Endpoints:
 *   GET  /api/logs                — fetch entries (with filters)
 *   GET  /api/logs?format=stats   — summary statistics
 *   GET  /api/logs?format=text    — plain-text log dump
 *   GET  /api/logs?format=download — JSON download
 *   POST /api/logs                — log an event from client-side
 *   DELETE /api/logs              — clear in-memory buffer
 */

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'success' | 'message' | 'audit';
  source: string;       // e.g. 'agent', 'ssh', 'evolution', 'ui.tab', 'ui.click'
  action?: string;      // e.g. 'tab.switch', 'agent.send', 'ssh.exec'
  message: string;
  duration?: number;
  details?: any;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  ip?: string;
}

const g = globalThis as any;
if (!g.__zenforgeLogs) g.__zenforgeLogs = [];

const SESSION_ID = (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
  ? `sess-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
  : `sess-${Date.now()}-${Math.random()}`;

/** Helper for other API routes to log events */
export function logEvent(
  level: LogEntry['level'],
  source: string,
  message: string,
  duration?: number,
  details?: any,
  action?: string
) {
  const entry: LogEntry = {
    id: `log_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    level,
    source,
    action,
    message,
    duration,
    details,
    sessionId: SESSION_ID,
  };

  // Push to in-memory ring buffer (cap at 5000)
  g.__zenforgeLogs.push(entry);
  if (g.__zenforgeLogs.length > 5000) {
    g.__zenforgeLogs = g.__zenforgeLogs.slice(-5000);
  }

  // Persist to Supabase (async, non-blocking)
  persistLogEntry(entry).catch(() => {});

  // Console log for errors only (avoid noise)
  if (level === 'error') {
    console.error(`[${source}] ${message}`, details || '');
  }

  return entry;
}

/** Persist a log entry to Supabase */
async function persistLogEntry(entry: LogEntry): Promise<void> {
  try {
    const { supabase } = await import("@/lib/supabase-client");
    await supabase.from('websites').upsert({
      id: entry.id,
      html: '',
      business_name: `[${entry.level}] ${entry.source}: ${entry.message}`.slice(0, 255),
      business_type: 'log',
      config: {
        log: entry,
        level: entry.level,
        source: entry.source,
        action: entry.action,
        timestamp: entry.timestamp,
      },
    });
  } catch {
    // Non-blocking — ignore errors
  }
}

/** Audit log helper — for user actions (clicks, tab switches, etc.) */
export function logAudit(action: string, resource: string, details?: any) {
  return logEvent('audit', 'ui', `${action}: ${resource}`, undefined, { action, resource, ...details }, action);
}

/** Performance log helper — for API calls with durations */
export function logPerformance(source: string, action: string, durationMs: number, details?: any) {
  return logEvent('info', source, `${action} completed in ${durationMs}ms`, durationMs, details, action);
}

/** Error log helper — for caught errors */
export function logError(source: string, action: string, error: Error | string, details?: any) {
  const msg = typeof error === 'string' ? error : error.message;
  return logEvent('error', source, `${action} failed: ${msg}`, undefined, { action, error: msg, ...details }, action);
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const format = url.searchParams.get('format');
    const level = url.searchParams.get('level') || undefined;
    const source = url.searchParams.get('source') || undefined;
    const action = url.searchParams.get('action') || undefined;
    const since = url.searchParams.get('since') || undefined;
    const limit = parseInt(url.searchParams.get('limit') || '500', 10);

    let logs: LogEntry[] = g.__zenforgeLogs || [];
    if (level) logs = logs.filter((l: LogEntry) => l.level === level);
    if (source) logs = logs.filter((l: LogEntry) => l.source === source);
    if (action) logs = logs.filter((l: LogEntry) => l.action === action);
    if (since) {
      const sinceTime = new Date(since).getTime();
      logs = logs.filter((l: LogEntry) => new Date(l.timestamp).getTime() >= sinceTime);
    }

    if (format === 'stats') {
      const byLevel: Record<string, number> = {};
      const bySource: Record<string, number> = {};
      const byAction: Record<string, number> = {};
      logs.forEach((l: LogEntry) => {
        byLevel[l.level] = (byLevel[l.level] || 0) + 1;
        bySource[l.source] = (bySource[l.source] || 0) + 1;
        if (l.action) byAction[l.action] = (byAction[l.action] || 0) + 1;
      });
      return NextResponse.json({
        total: logs.length,
        byLevel,
        bySource,
        byAction,
        oldest: logs[0]?.timestamp,
        newest: logs[logs.length - 1]?.timestamp,
        sizeBytes: JSON.stringify(logs).length,
        sessionId: SESSION_ID,
      });
    }

    if (format === 'text') {
      const text = logs.slice(-limit).map((l: LogEntry) =>
        `[${l.timestamp}] ${l.level.toUpperCase().padEnd(7)} [${l.source}${l.action ? `.${l.action}` : ''}] ${l.message}${l.duration ? ` (${l.duration}ms)` : ''}`
      ).join('\n');
      return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }

    if (format === 'download') {
      return new Response(JSON.stringify(logs, null, 2), {
        headers: { 'Content-Type': 'application/json', 'Content-Disposition': 'attachment; filename="zenforge-logs.json"' },
      });
    }

    if (format === 'sources') {
      const sources = new Set(logs.map((l: LogEntry) => l.source));
      const actions = new Set(logs.map((l: LogEntry) => l.action).filter(Boolean));
      return NextResponse.json({ sources: Array.from(sources), actions: Array.from(actions) });
    }

    const entries = logs.slice(-limit);
    return NextResponse.json({
      entries,
      count: entries.length,
      total: logs.length,
      sessionId: SESSION_ID,
    });
  } catch (e) {
    return NextResponse.json({ error: 'Failed', message: e instanceof Error ? e.message : 'unknown' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Capture client-side context
    const userAgent = req.headers.get('user-agent') || undefined;
    const url = body.url || undefined;
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || undefined;

    const entry = logEvent(
      body.level || 'info',
      body.source || 'client',
      body.message || '',
      body.duration,
      { ...body.details, userAgent, url, ip },
      body.action
    );
    return NextResponse.json({ success: true, entry });
  } catch (e) {
    return NextResponse.json({ error: 'Failed', message: e instanceof Error ? e.message : 'unknown' }, { status: 500 });
  }
}

export async function DELETE() {
  g.__zenforgeLogs = [];
  return NextResponse.json({ success: true, message: 'In-memory logs cleared (Supabase entries retained)' });
}
