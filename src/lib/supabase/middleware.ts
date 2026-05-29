// ============================================
// OGOUTEL_Prestige - Supabase Middleware
// Rafraîchit la session + protection des routes
// par rôle d'utilisateur
// ============================================

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ─── Types ──────────────────────────────────────────────────────────────────

type RoleUtilisateur =
  | "super_admin"
  | "admin_hotel"
  | "gerant"
  | "receptionniste";

interface UserWithRole {
  id: string;
  email: string;
  role?: RoleUtilisateur;
}

// ─── Configuration des routes ──────────────────────────────────────────────

/** Routes accessibles sans authentification */
const ROUTES_PUBLIQUES = ["/", "/login", "/register", "/forgot-password", "/reset-password"];

/** Routes d'API accessibles sans authentification */
const ROUTES_API_PUBLIQUES = ["/api/send-contact", "/api/auth", "/api/pricing"];

/** Association rôle → route dashboard */
const DASHBOARD_PAR_ROLE: Record<RoleUtilisateur, string> = {
  super_admin: "/super-dashboard",
  admin_hotel: "/dashboard",
  gerant: "/dashboard",
  receptionniste: "/receptionniste",
};

/** Permissions d'accès par route */
const PERMISSIONS_ROUTES: Record<string, RoleUtilisateur[]> = {
  "/super-dashboard": ["super_admin"],
  "/dashboard": ["admin_hotel", "gerant"],
  "/receptionniste": ["receptionniste", "gerant", "admin_hotel"],
  // Sous-routes du super-admin
  "/super-dashboard/hotels": ["super_admin"],
  "/super-dashboard/abonnements": ["super_admin"],
  "/super-dashboard/utilisateurs": ["super_admin"],
  "/super-dashboard/demandes": ["super_admin"],
  "/super-dashboard/settings": ["super_admin"],
  // Sous-routes dashboard hotel
  "/dashboard/chambres": ["admin_hotel", "gerant"],
  "/dashboard/reservations": ["admin_hotel", "gerant"],
  "/dashboard/clients": ["admin_hotel", "gerant"],
  "/dashboard/factures": ["admin_hotel", "gerant"],
  "/dashboard/personnel": ["admin_hotel"],
  "/dashboard/statistiques": ["admin_hotel", "gerant"],
  "/dashboard/settings": ["admin_hotel"],
  // Sous-routes réceptionniste
  "/receptionniste/reservations": ["receptionniste", "gerant", "admin_hotel"],
  "/receptionniste/checkin": ["receptionniste", "gerant", "admin_hotel"],
  "/receptionniste/checkout": ["receptionniste", "gerant", "admin_hotel"],
  "/receptionniste/chambres": ["receptionniste", "gerant", "admin_hotel"],
};

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Vérifie si un chemin correspond à une route publique */
function isRoutePublique(pathname: string): boolean {
  return (
    ROUTES_PUBLIQUES.includes(pathname) ||
    ROUTES_API_PUBLIQUES.some((route) => pathname.startsWith(route))
  );
}

/** Vérifie si un chemin est une route d'authentification (login/register) */
function isRouteAuth(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password"
  );
}

/** Retourne la route protégée correspondante à un chemin */
function getRouteProtégee(pathname: string): string | null {
  // Vérifie les correspondances exactes d'abord
  if (PERMISSIONS_ROUTES[pathname]) {
    return pathname;
  }
  // Vérifie les correspondances par préfixe (ex: /dashboard/xxx)
  const prefixes = Object.keys(PERMISSIONS_ROUTES).sort(
    (a, b) => b.length - a.length
  );
  for (const prefix of prefixes) {
    if (pathname.startsWith(prefix + "/") || pathname === prefix) {
      return prefix;
    }
  }
  // Si le chemin commence par /super-dashboard, /dashboard, /receptionniste
  if (pathname.startsWith("/super-dashboard")) return "/super-dashboard";
  if (pathname.startsWith("/dashboard")) return "/dashboard";
  if (pathname.startsWith("/receptionniste")) return "/receptionniste";
  return null;
}

/** Extrait le rôle depuis les metadata utilisateur Supabase */
function extraireRole(user: { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> }): RoleUtilisateur | null {
  const role =
    (user.app_metadata?.role as RoleUtilisateur) ??
    (user.user_metadata?.role as RoleUtilisateur) ??
    null;
  return role;
}

// ─── Fonction principale ────────────────────────────────────────────────────

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
    pathname.includes(".") // images, fonts, etc.
  ) {
    return supabaseResponse;
  }

  // ─── 4. Non-authentifié → vérifier si la route nécessite l'auth ─────────
  if (!user) {
    // Toute route non publique nécessite l'auth → redirect /login
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
    const dashboardCible = role
      ? DASHBOARD_PAR_ROLE[role]
      : "/login";
    const url = request.nextUrl.clone();
    url.pathname = dashboardCible;
    return NextResponse.redirect(url);
  }

  // ─── 7. Vérification des permissions par rôle ───────────────────────────
  const routeProtégée = getRouteProtégee(pathname);

  if (routeProtégée && role) {
    const rolesAutorisés = PERMISSIONS_ROUTES[routeProtégée];

    if (rolesAutorisés && !rolesAutorisés.includes(role)) {
      // ⛔ Accès refusé → redirect vers le dashboard de son rôle
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
}
