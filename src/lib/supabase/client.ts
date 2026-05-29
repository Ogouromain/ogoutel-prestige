// ============================================
// OGOUTEL_Prestige - Supabase Client (Navigateur)
// Client côté client pour composants 'use client'
// Returns null if Supabase is not configured
// ============================================

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  return createBrowserClient(url, key);
}
