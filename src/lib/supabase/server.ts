// ============================================
// OGOUTEL_Prestige - Supabase Client (Serveur)
// Client côté serveur pour Server Components,
// Route Handlers et Server Actions
// Returns null if Supabase is not configured
// ============================================

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Cookies are read-only in Server Components
        }
      },
    },
  });
}

// ─── Admin Client (Service Role) ──────────────────────────────────────────────
// ⚠️ À utiliser UNIQUEMENT côté serveur (API routes, Server Actions)
// Contourne les RLS (Row Level Security)

export async function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) return null;

  return createServerClient(url, serviceKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {
        // Pas de cookies pour le client admin
      },
    },
  });
}
