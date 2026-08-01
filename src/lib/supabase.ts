import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables provided by user or system
const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env || {};

const SUPABASE_URL =
  metaEnv.VITE_SUPABASE_URL ||
  metaEnv.NEXT_PUBLIC_SUPABASE_URL ||
  'https://evyiaxemzapyozuneybm.supabase.co';

const SUPABASE_KEY =
  metaEnv.VITE_SUPABASE_PUBLISHABLE_KEY ||
  metaEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  metaEnv.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_FSFbSV2iLwB9olDhDCIwTg_4netY3aH';

let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
  }
  return supabaseClient;
}

export const supabaseConfig = {
  url: SUPABASE_URL,
  key: SUPABASE_KEY,
  isConfigured: Boolean(SUPABASE_URL && SUPABASE_KEY),
};

