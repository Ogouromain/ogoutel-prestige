// ============================================
// OGOUTEL_Prestige - Supabase Middleware
// Rafraîchit la session auth à chaque requête
// pour les routes protégées
// ============================================

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Important : ne pas écrire de logique entre createServerClient et
  // supabase.auth.getUser(). Un simple await est nécessaire pour que
  // le client supabase rafraîchisse les tokens de session.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ─── Routes publiques (accessibles sans auth) ────────────────────────────
  const routesPubliques = [
    "/",
    "/auth/connexion",
    "/auth/inscription",
    "/auth/mot-de-passe-oublie",
    "/api/auth",
    "/contact",
    "/tarifs",
  ];

  const isRoutePublique = routesPubliques.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  // ─── Routes protégées (authentification requise) ─────────────────────────
  const routesProtegees = ["/dashboard"];

  const isRouteProtegee = routesProtegees.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  // ─── Redirections ───────────────────────────────────────────────────────

  // Non-authentifié sur route protégée → redirect vers connexion
  if (!user && isRouteProtegee) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/connexion";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Authentifié sur route auth → redirect vers dashboard
  if (user && request.nextUrl.pathname.startsWith("/auth")) {
    // Laisser passer /auth/callback (callback OAuth)
    if (!request.nextUrl.pathname.startsWith("/auth/callback")) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
