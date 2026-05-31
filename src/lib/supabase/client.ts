// ============================================
// OGOUTEL_Prestige - Supabase Client (Navigateur)
// Client côté client pour composants 'use client'
// Returns null if Supabase is not configured
// ============================================

import { createBrowserClient } from "@supabase/ssr";
import env from "@/lib/env";

export function createClient() {
  if (!env.SUPABASE_CONFIGURED) return null;

  return createBrowserClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
}
