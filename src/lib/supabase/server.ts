// ============================================
// OGOUTEL_Prestige - Supabase Client (Serveur)
// Client côté serveur pour Server Components,
// Route Handlers et Server Actions
// ============================================

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
            // Les cookies sont en lecture seule dans les Server Components
            // C'est normal — le middleware s'occupe de les mettre à jour
          }
        },
      },
    }
  );
}

// ─── Admin Client (Service Role) ──────────────────────────────────────────────
// ⚠️ À utiliser UNIQUEMENT côté serveur (API routes, Server Actions)
// Contourne les RLS (Row Level Security)

export async function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // Pas de cookies pour le client admin
        },
      },
    }
  );
}
