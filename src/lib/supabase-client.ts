/**
 * Supabase Client — ZenForge Elite
 * Stores generated websites persistently.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gjxwlnmfjzexdcepnovf.supabase.co';
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let _supabase: any = null;

export function getSupabase() {
  if (_supabase) return _supabase;
  _supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });
  return _supabase;
}

// Backward compat - lazy proxy
export const supabase = new Proxy({} as any, {
  get(_, prop) {
    return getSupabase()[prop];
  }
});

export interface StoredWebsite {
  id: string;
  html: string;
  business_name: string;
  business_type: string;
  config: any;
  created_at: string;
}

export async function saveWebsiteToSupabase(
  slug: string,
  html: string,
  businessName: string,
  businessType: string,
  config?: any
): Promise<boolean> {
  try {
    const { error } = await supabase.from('websites').upsert({
      id: slug,
      html,
      business_name: businessName,
      business_type: businessType,
      config: config || {},
    });
    if (error) {
      console.error('[supabase] Save error:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[supabase] Save exception:', e);
    return false;
  }
}

export async function getWebsiteFromSupabase(slug: string): Promise<StoredWebsite | null> {
  try {
    const { data, error } = await supabase
      .from('websites')
      .select('*')
      .eq('id', slug)
      .single();
    if (error || !data) return null;
    return data as StoredWebsite;
  } catch {
    return null;
  }
}

export async function listWebsitesFromSupabase(limit = 100): Promise<StoredWebsite[]> {
  try {
    const { data, error } = await supabase
      .from('websites')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data as StoredWebsite[];
  } catch {
    return [];
  }
}
