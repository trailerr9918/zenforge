/**
 * Session Persistence Manager
 * ============================
 * Stores all ZenForge state to Supabase so it survives refreshes.
 * Based on the supabase-session-persistence-guide.md architecture.
 *
 * Stores:
 * - Auto-evolve state (on/off)
 * - AI Agent chat history per mode
 * - Active tab
 * - Accent color preference
 * - Evolution stats
 */

import { supabase } from './supabase-client';

const SESSION_ID = 'zenforge-main-session';
const TABLE = 'websites';

export interface SessionState {
  autoEvolve: boolean;
  activeTab: string;
  accentColor: string;
  chatHistory: Record<string, any[]>;
  lastActive: string;
}

async function getSession(): Promise<SessionState | null> {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', `session-${SESSION_ID}`)
      .single();
    if (error || !data) return null;
    const config = typeof data.config === 'string' ? JSON.parse(data.config) : data.config;
    return config?.state || null;
  } catch {
    return null;
  }
}

async function saveSession(state: Partial<SessionState>): Promise<void> {
  try {
    const existing = await getSession();
    const merged: SessionState = {
      autoEvolve: existing?.autoEvolve ?? false,
      activeTab: existing?.activeTab ?? 'generate',
      accentColor: existing?.accentColor ?? '#ffffff',
      chatHistory: existing?.chatHistory ?? {},
      lastActive: new Date().toISOString(),
      ...state,
    };
    await supabase.from(TABLE).upsert({
      id: `session-${SESSION_ID}`,
      html: '',
      business_name: 'ZenForge Session State',
      business_type: 'session',
      config: { state: merged },
    });
  } catch (e) {
    console.error('[session] Save error:', e);
  }
}

export const sessionManager = {
  get: getSession,
  save: saveSession,

  async getAutoEvolve(): Promise<boolean> {
    const s = await getSession();
    return s?.autoEvolve ?? false;
  },

  async setAutoEvolve(on: boolean): Promise<void> {
    await saveSession({ autoEvolve: on });
  },

  // Separate flags for VA and Evolution so they can run simultaneously
  async getVAAutoEvolve(): Promise<boolean> {
    const s = await getSession();
    return (s as any)?.vaAutoEvolve ?? s?.autoEvolve ?? false;
  },

  async setVAAutoEvolve(on: boolean): Promise<void> {
    await saveSession({ vaAutoEvolve: on } as any);
  },

  async getEvoAutoEvolve(): Promise<boolean> {
    const s = await getSession();
    return (s as any)?.evoAutoEvolve ?? s?.autoEvolve ?? false;
  },

  async setEvoAutoEvolve(on: boolean): Promise<void> {
    await saveSession({ evoAutoEvolve: on } as any);
  },

  async getActiveTab(): Promise<string> {
    const s = await getSession();
    return s?.activeTab ?? 'generate';
  },

  async setActiveTab(tab: string): Promise<void> {
    await saveSession({ activeTab: tab });
  },

  async getAccentColor(): Promise<string> {
    const s = await getSession();
    return s?.accentColor ?? '#ffffff';
  },

  async setAccentColor(color: string): Promise<void> {
    await saveSession({ accentColor: color });
  },

  async getChatHistory(mode: string): Promise<any[]> {
    const s = await getSession();
    return s?.chatHistory?.[mode] ?? [];
  },

  async saveChatMessage(mode: string, message: any): Promise<void> {
    const s = await getSession();
    const history = s?.chatHistory ?? {};
    const modeHistory = history[mode] ?? [];
    modeHistory.push(message);
    if (modeHistory.length > 50) modeHistory.shift();
    history[mode] = modeHistory;
    await saveSession({ chatHistory: history });
  },

  async clearChatHistory(mode: string): Promise<void> {
    const s = await getSession();
    const history = s?.chatHistory ?? {};
    history[mode] = [];
    await saveSession({ chatHistory: history });
  },
};
