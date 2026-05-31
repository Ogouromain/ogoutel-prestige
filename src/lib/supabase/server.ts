// ============================================
// OGOUTEL_Prestige - Supabase Client (Serveur)
// Client côté serveur pour Server Components,
// Route Handlers et Server Actions
// Returns null if Supabase is not configured
// ============================================

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import env from "@/lib/env";

export async function createClient() {
  if (!env.SUPABASE_CONFIGURED) return null;

  const cookieStore = await cookies();

  return createServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
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
  if (!env.SUPABASE_ADMIN_CONFIGURED) return null;

  return createServerClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
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
