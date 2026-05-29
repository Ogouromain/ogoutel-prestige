// ============================================
// OGOUTEL_Prestige - Supabase Middleware
// Rafraîchit la session + protection des routes
// par rôle d'utilisateur
//
// Routes publiques    : /, /login, /register,
//                       /forgot-password, /reset-password,
//                       /api/send-contact
//
// Routes protégées    :
//   /super-admin      → super_admin
//   /admin            → admin_hotel, gerant
//   /staff            → receptionniste, gerant, admin_hotel
//
// Logique :
//   Non connecté  + route protégée  → /login?redirect=...
//   Connecté      + /login|register → /dashboard selon rôle
//   Mauvais rôle  + route réservée  → dashboard de son rôle
//
// ⚠️ Si Supabase n'est pas configuré (.env.local manquant),
//    toutes les routes passent sans authentification.
// ============================================

import { NextResponse, type NextRequest } from "next/server";

// ─── Types ──────────────────────────────────────────────────────────────────

type RoleUtilisateur =
  | "super_admin"
  | "admin_hotel"
  | "gerant"
  | "receptionniste";

// ─── Configuration des routes ──────────────────────────────────────────────

/** Routes accessibles sans authentification */
const ROUTES_PUBLIQUES = ["/", "/login", "/register", "/forgot-password", "/reset-password"];

/** Routes d'API accessibles sans authentification */
const ROUTES_API_PUBLIQUES = [
  "/api/send-contact",
  "/api/send-subscription-email",
  "/api/validate-activation-code",
  "/api/register-user",
  "/api/generate-activation-code",
  "/api/webhooks",
  "/api/auth",
  "/api/pricing",
  "/api/rooms",
  "/api/bookings",
  "/api/contact",
  "/api/testimonials",
  "/api/",
];

/** Association rôle → route dashboard */
const DASHBOARD_PAR_ROLE: Record<RoleUtilisateur, string> = {
  super_admin: "/super-admin",
  admin_hotel: "/admin",
  gerant: "/staff",
  receptionniste: "/staff",
};

/** Permissions d'accès par route */
const PERMISSIONS_ROUTES: Record<string, RoleUtilisateur[]> = {
  "/super-admin": ["super_admin"],
  "/admin": ["admin_hotel", "gerant"],
  "/staff": ["receptionniste", "gerant", "admin_hotel"],
  "/super-admin/hotels": ["super_admin"],
  "/super-admin/abonnements": ["super_admin"],
  "/super-admin/utilisateurs": ["super_admin"],
  "/super-admin/demandes": ["super_admin"],
  "/super-admin/settings": ["super_admin"],
  "/admin/chambres": ["admin_hotel", "gerant"],
  "/admin/reservations": ["admin_hotel", "gerant"],
  "/admin/clients": ["admin_hotel", "gerant"],
  "/admin/factures": ["admin_hotel", "gerant"],
  "/admin/personnel": ["admin_hotel"],
  "/admin/statistiques": ["admin_hotel", "gerant"],
  "/admin/settings": ["admin_hotel"],
  "/staff/reservations": ["receptionniste", "gerant", "admin_hotel"],
  "/staff/checkin": ["receptionniste", "gerant", "admin_hotel"],
  "/staff/checkout": ["receptionniste", "gerant", "admin_hotel"],
  "/staff/chambres": ["receptionniste", "gerant", "admin_hotel"],
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function isRoutePublique(pathname: string): boolean {
  return (
    ROUTES_PUBLIQUES.includes(pathname) ||
    ROUTES_API_PUBLIQUES.some((route) => pathname.startsWith(route))
  );
}

function isRouteAuth(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password"
  );
}

function getRouteProtégée(pathname: string): string | null {
  if (PERMISSIONS_ROUTES[pathname]) return pathname;
  const prefixes = Object.keys(PERMISSIONS_ROUTES).sort(
    (a, b) => b.length - a.length
  );
  for (const prefix of prefixes) {
    if (pathname.startsWith(prefix + "/") || pathname === prefix) {
      return prefix;
    }
  }
  if (pathname.startsWith("/super-admin")) return "/super-admin";
  if (pathname.startsWith("/admin")) return "/admin";
  if (pathname.startsWith("/staff")) return "/staff";
  return null;
}

function extraireRole(user: { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> }): RoleUtilisateur | null {
  return (
    (user.app_metadata?.role as RoleUtilisateur) ??
    (user.user_metadata?.role as RoleUtilisateur) ??
    null
  );
}

// ─── Fonction principale ────────────────────────────────────────────────────

export async function updateSession(request: NextRequest) {
  // ─── 0. Si Supabase n'est pas configuré, laisser passer tout le monde ────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request });
  }

  try {
    // Dynamic import to avoid module-level errors when env vars are missing
    const { createServerClient } = await import("@supabase/ssr");

    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    // ─── Récupération utilisateur + rôle ────────────────────────────────────
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const pathname = request.nextUrl.pathname;

    // ─── 1. Routes publiques → laisser passer ────────────────────────────────
    if (isRoutePublique(pathname)) {
      return supabaseResponse;
    }

    // ─── 2. Callback OAuth → toujours laisser passer ────────────────────────
    if (pathname.startsWith("/api/auth/callback")) {
      return supabaseResponse;
    }

    // ─── 3. Routes statiques et assets → laisser passer ─────────────────────
    if (
      pathname.startsWith("/_next") ||
      pathname.startsWith("/favicon") ||
      pathname.includes(".")
    ) {
      return supabaseResponse;
    }

    // ─── 4. Non-authentifié → vérifier si la route nécessite l'auth ─────────
    if (!user) {
      if (!isRoutePublique(pathname)) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("redirect", pathname);
        return NextResponse.redirect(url);
      }
      return supabaseResponse;
    }

    // ─── 5. Utilisateur authentifié → extraire le rôle ──────────────────────
    const role = extraireRole(user);

    // ─── 6. Authentifié sur route auth (login/register) → redirect dashboard ─
    if (isRouteAuth(pathname)) {
      const dashboardCible = role ? DASHBOARD_PAR_ROLE[role] : "/login";
      const url = request.nextUrl.clone();
      url.pathname = dashboardCible;
      return NextResponse.redirect(url);
    }

    // ─── 7. Vérification des permissions par rôle ───────────────────────────
    const routeProtégée = getRouteProtégée(pathname);

    if (routeProtégée && role) {
      const rolesAutorisés = PERMISSIONS_ROUTES[routeProtégée];
      if (rolesAutorisés && !rolesAutorisés.includes(role)) {
        const dashboardCible = DASHBOARD_PAR_ROLE[role] ?? "/";
        const url = request.nextUrl.clone();
        url.pathname = dashboardCible;
        url.searchParams.set(
          "erreur",
          "Vous n'avez pas les permissions pour accéder à cette page."
        );
        return NextResponse.redirect(url);
      }
    }

    // ─── 8. Utilisateur authentifié SANS rôle → redirect /login avec erreur ─
    if (!role && !isRoutePublique(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("erreur", "Profil non configuré. Contactez le support.");
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  } catch (error) {
    // If Supabase client creation fails for any reason, let the request through
    console.error("[middleware] Supabase error, passing through:", error);
    return NextResponse.next({ request });
  }
}
