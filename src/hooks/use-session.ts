/**
 * Client-side session hook — restores UI state from Supabase on mount.
 * Based on supabase-session-persistence-guide.md Layer 1 + Layer 2.
 *
 * Persists:
 *   - activeTab (which tab the user was on)
 *   - accentColor
 *   - autoEvolve state (shown in EvolutionTab)
 *
 * Uses /api/session as the persistence API (which wraps sessionManager).
 */

'use client';
import { useState, useEffect, useCallback } from 'react';

interface SessionState {
  activeTab: string;
  accentColor: string;
  autoEvolve: boolean;
  loaded: boolean;
}

const DEFAULT_STATE: SessionState = {
  activeTab: 'generate',
  accentColor: '#ffffff',
  autoEvolve: false,
  loaded: false,
};

export function useSessionState() {
  const [state, setState] = useState<SessionState>(DEFAULT_STATE);

  // Load from Supabase on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/session');
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setState({
          activeTab: data.activeTab || 'generate',
          accentColor: data.accentColor || '#ffffff',
          autoEvolve: data.autoEvolve || false,
          loaded: true,
        });
      } catch {
        setState((s) => ({ ...s, loaded: true }));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Persist activeTab (debounced)
  const setActiveTab = useCallback((tab: string) => {
    setState((s) => ({ ...s, activeTab: tab }));
    // Fire-and-forget save
    try {
      fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setActiveTab', tab }),
      }).catch(() => {});
    } catch {}
  }, []);

  // Persist accentColor
  const setAccentColor = useCallback((color: string) => {
    setState((s) => ({ ...s, accentColor: color }));
    try {
      fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setAccentColor', color }),
      }).catch(() => {});
    } catch {}
  }, []);

  // Persist autoEvolve (already handled by seae-engine, but expose for UI)
  const setAutoEvolve = useCallback((on: boolean) => {
    setState((s) => ({ ...s, autoEvolve: on }));
  }, []);

  return { ...state, setActiveTab, setAccentColor, setAutoEvolve };
}
