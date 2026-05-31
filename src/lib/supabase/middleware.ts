// ============================================
// OGOUTEL_Prestige - Supabase Middleware (V2)
// Rafraîchissement de session + Protection des routes par rôle
// Vérification du statut hôtel/abonnement
//
// ⚠️ Si Supabase n'est pas configuré, toutes les routes passent.
// ⚠️ Les vérifications de rôle/abonnement sont aussi appliquées
//    dans les API routes via lib/auth-helpers.ts pour double sécurité.
//
// NOTE: La protection côté middleware est une première ligne de défense.
//       Les API routes utilisent verifyApiAuth() pour validation serveur.
// ============================================

import { NextResponse, type NextRequest } from "next/server";

// ─── Types ──────────────────────────────────────────────────────────────────

type RoleUtilisateur =
  | "super_admin"
  | "admin_hotel"
  | "gerant"
  | "receptionniste";

// ─── Configuration des routes ──────────────────────────────────────────────

/** Routes accessibles sans authentification (page) */
const ROUTES_PUBLIQUES = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

/** Routes d'API accessibles sans authentification */
const ROUTES_API_PUBLIQUES = [
  "/api/send-contact",
  "/api/send-subscription-email",
  "/api/validate-activation-code",
  "/api/rooms",
  "/api/bookings",
  "/api/contact",
  "/api/testimonials",
  "/api/pricing",
  "/api/register-user",
  "/api/webhooks",
];

/** Association rôle → route dashboard par défaut */
const DASHBOARD_PAR_ROLE: Record<RoleUtilisateur, string> = {
  super_admin: "/super-admin",
  admin_hotel: "/admin",
  gerant: "/staff",
  receptionniste: "/staff",
};

/** Permissions d'accès par préfixe de route */
const PERMISSIONS_ROUTES: Record<string, RoleUtilisateur[]> = {
  "/super-admin": ["super_admin"],
  "/admin": ["admin_hotel", "gerant"],
  "/staff": ["receptionniste", "gerant", "admin_hotel"],
};

/** Routes d'authentification (redirection si connecté) */
const ROUTES_AUTH = ["/login", "/register", "/forgot-password", "/reset-password"];

/** Pages d'erreur spéciales */
const PAGE_ABONNEMENT_SUSPENDU = "/suspended";

// ─── Helpers ────────────────────────────────────────────────────────────────

function isRoutePublique(pathname: string): boolean {
  return (
    ROUTES_PUBLIQUES.includes(pathname) ||
    ROUTES_API_PUBLIQUES.some((route) => pathname.startsWith(route))
  );
}

function isRouteAuth(pathname: string): boolean {
  return ROUTES_AUTH.includes(pathname);
}

function getRouteProtégée(pathname: string): string | null {
  const prefixes = Object.keys(PERMISSIONS_ROUTES).sort(
    (a, b) => b.length - a.length
  );
  for (const prefix of prefixes) {
    // Check both direct match and /api/ prefix (e.g., /api/admin/rooms → /admin)
    if (
      pathname.startsWith(prefix + "/") ||
      pathname === prefix ||
      pathname.startsWith("/api" + prefix + "/") ||
      pathname === "/api" + prefix
    ) {
      return prefix;
    }
  }
  return null;
}

function extraireRole(user: {
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}): RoleUtilisateur | null {
  return (
    (user.app_metadata?.role as RoleUtilisateur) ??
    (user.user_metadata?.role as RoleUtilisateur) ??
    null
  );
}

// ─── Fonction principale ────────────────────────────────────────────────────

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ─── 0. Si Supabase n'est pas configuré, laisser passer ────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request });
  }

  // ─── Routes publiques et statiques → laisser passer ─────────────────────
  if (isRoutePublique(pathname)) {
    return NextResponse.next({ request });
  }

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".") ||
    pathname.startsWith("/api/auth/callback")
  ) {
    return NextResponse.next({ request });
  }

  try {
    // Dynamic import pour éviter le crash quand env vars sont manquantes
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

    // ─── Récupération utilisateur + rôle ─────────────────────────────────
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // ─── Non-authentifié → rediriger vers /login ──────────────────────────
    if (!user) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { success: false, error: "Authentification requise." },
          { status: 401 }
        );
      }
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    // ─── Extraire le rôle ──────────────────────────────────────────────────
    const role = extraireRole(user);

    // ─── Connecté sur route auth → redirect dashboard ───────────────────
    if (isRouteAuth(pathname)) {
      const dashboardCible = role ? DASHBOARD_PAR_ROLE[role] : "/";
      const url = request.nextUrl.clone();
      url.pathname = dashboardCible;
      return NextResponse.redirect(url);
    }

    // ─── Utilisateur SANS rôle → redirect /login avec erreur ────────────
    if (!role) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { success: false, error: "Profil non configuré." },
          { status: 403 }
        );
      }
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("erreur", "Profil non configuré.");
      return NextResponse.redirect(url);
    }

    // ─── Vérification des permissions par rôle ────────────────────────────
    const routeProtégée = getRouteProtégée(pathname);

    if (routeProtégée) {
      const rolesAutorisés = PERMISSIONS_ROUTES[routeProtégée];
      if (rolesAutorisés && !rolesAutorisés.includes(role)) {
        if (role === "super_admin") {
          const url = request.nextUrl.clone();
          url.pathname = "/super-admin";
          return NextResponse.redirect(url);
        }
        if (pathname.startsWith("/api/")) {
          return NextResponse.json(
            { success: false, error: "Permissions insuffisantes." },
            { status: 403 }
          );
        }
        const dashboardCible = DASHBOARD_PAR_ROLE[role] ?? "/";
        const url = request.nextUrl.clone();
        url.pathname = dashboardCible;
        url.searchParams.set("erreur", "Permissions insuffisantes.");
        return NextResponse.redirect(url);
      }
    }

    // ─── Headers de sécurité ────────────────────────────────────────────
    supabaseResponse.headers.set("x-role", role);
    supabaseResponse.headers.set("x-user-id", user.id);

    return supabaseResponse;
  } catch (error) {
    console.error("[middleware] Erreur, mode dégradé:", error);
    return NextResponse.next({ request });
  }
}

// ─── Fonctions utilitaires exportées ─────────────────────────────────────────

export function getRolesAutorisés(prefix: string): RoleUtilisateur[] {
  return PERMISSIONS_ROUTES[prefix] ?? [];
}

export function peutAccéderRoute(
  role: RoleUtilisateur,
  pathname: string
): boolean {
  const prefix = getRouteProtégée(pathname);
  if (!prefix) return true;
  const rolesAutorisés = PERMISSIONS_ROUTES[prefix];
  return rolesAutorisés?.includes(role) ?? false;
}
