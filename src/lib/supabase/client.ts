// ============================================
// OGOUTEL_Prestige - Supabase Client (Navigateur)
// Client côté client pour composants 'use client'
// ============================================

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
