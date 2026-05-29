// ============================================
// OGOUTEL_Prestige - Middleware Supabase (V2)
// Rafraîchissement de session + Protection des routes par rôle
// Vérification du statut hôtel/abonnement
//
// Routes publiques    : /, /login, /register,
//                       /forgot-password, /reset-password
//
// Routes API publiques : /api/send-contact, /api/send-subscription-email,
//                       /api/validate-activation-code, /api/rooms,
//                       /api/bookings, /api/contact, /api/testimonials
//
// Routes protégées    :
//   /super-admin/*     → super_admin uniquement
//   /admin/*           → admin_hotel, gerant uniquement
//   /staff/*           → receptionniste, gerant, admin_hotel
//
// Logique :
//   1. Non connecté + route protégée → /login?redirect=...
//   2. Connecté + /login|register    → dashboard selon rôle
//   3. Mauvais rôle + route réservée → dashboard de son rôle
//   4. super_admin sur /admin ou /staff → /super-admin
//   5. Hôtel inactif → page abonnement suspendu
//
// ⚠️ Si Supabase n'est pas configuré, toutes les routes passent.
// ============================================

import { NextResponse, type NextRequest } from "next/server";

// ─── Types ──────────────────────────────────────────────────────────────────

type RoleUtilisateur =
  | "super_admin"
  | "admin_hotel"
  | "gerant"
  | "receptionniste";

interface ProfileMinimal {
  id: string;
  role: RoleUtilisateur;
  hotel_id: string | null;
  full_name: string | null;
  is_active: boolean;
}

interface HotelMinimal {
  id: string;
  est_actif: boolean;
  date_fin_abonnement: string;
  plan: string;
}

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
  "/api/generate-activation-code",
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
const PAGE_ABONNEMENT_SUSPENDU = "/abonnement-suspendu";

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

/**
 * Détermine si une pathname correspond à une route protégée et
 * retourne le préfixe de permission correspondant.
 */
function getRouteProtégée(pathname: string): string | null {
  const prefixes = Object.keys(PERMISSIONS_ROUTES).sort(
    (a, b) => b.length - a.length
  );
  for (const prefix of prefixes) {
    if (pathname.startsWith(prefix + "/") || pathname === prefix) {
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

/**
 * Vérifie si l'abonnement d'un hôtel est actif ou expiré.
 * Retourne true si l'hôtel nécessite une redirection (suspendu/expiré).
 */
function hotelRequiresRedirect(hotel: HotelMinimal): boolean {
  if (!hotel.est_actif) return true;
  // Abonnement expiré depuis plus de 7 jours
  const now = new Date();
  const dateFin = new Date(hotel.date_fin_abonnement);
  const joursRestants = Math.ceil(
    (dateFin.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  return joursRestants < -7; // Plus de 7 jours d'expiration
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

    // ─── 1. Routes publiques et statiques → laisser passer ──────────────────
    if (isRoutePublique(pathname)) {
      return supabaseResponse;
    }

    // Routes statiques et assets
    if (
      pathname.startsWith("/_next") ||
      pathname.startsWith("/favicon") ||
      pathname.includes(".") ||
      pathname.startsWith("/api/auth/callback")
    ) {
      return supabaseResponse;
    }

    // ─── 2. Récupération utilisateur + rôle ─────────────────────────────────
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // ─── 3. Non-authentifié → rediriger vers /login ────────────────────────
    if (!user) {
      // Routes d'API protégées → 401 JSON
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { success: false, error: "Authentification requise." },
          { status: 401 }
        );
      }
      // Pages protégées → redirect login
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    // ─── 4. Extraire le rôle ──────────────────────────────────────────────
    const role = extraireRole(user);

    // ─── 5. Utilisateur connecté sur route auth → redirect dashboard ─────
    if (isRouteAuth(pathname)) {
      const dashboardCible = role ? DASHBOARD_PAR_ROLE[role] : "/";
      const url = request.nextUrl.clone();
      url.pathname = dashboardCible;
      return NextResponse.redirect(url);
    }

    // ─── 6. Utilisateur SANS rôle → redirect /login avec erreur ──────────
    if (!role) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          {
            success: false,
            error: "Profil non configuré. Contactez le support.",
          },
          { status: 403 }
        );
      }
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set(
        "erreur",
        "Profil non configuré. Contactez le support."
      );
      return NextResponse.redirect(url);
    }

    // ─── 7. Vérification des permissions par rôle ─────────────────────────
    const routeProtégée = getRouteProtégée(pathname);

    if (routeProtégée) {
      const rolesAutorisés = PERMISSIONS_ROUTES[routeProtégée];

      if (rolesAutorisés && !rolesAutorisés.includes(role)) {
        // super_admin essaie d'accéder à /admin ou /staff → redirect /super-admin
        if (role === "super_admin") {
          const url = request.nextUrl.clone();
          url.pathname = "/super-admin";
          return NextResponse.redirect(url);
        }

        // Autre rôle non autorisé → dashboard de son rôle
        if (pathname.startsWith("/api/")) {
          return NextResponse.json(
            {
              success: false,
              error: "Vous n'avez pas les permissions pour cette action.",
            },
            { status: 403 }
          );
        }

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

    // ─── 8. Vérification hôtel actif (pour admin_hotel, gerant, receptionniste)
    if (role !== "super_admin" && routeProtégée) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("hotel_id, role, is_active")
          .eq("id", user.id)
          .single();

        // Profil inactif → kick vers login
        if (profile && !profile.is_active) {
          await supabase.auth.signOut();
          const url = request.nextUrl.clone();
          url.pathname = "/login";
          url.searchParams.set(
            "erreur",
            "Votre compte a été désactivé. Contactez votre administrateur."
          );
          return NextResponse.redirect(url);
        }

        // Vérifier le statut de l'hôtel
        if (profile?.hotel_id) {
          const { data: hotel } = await supabase
            .from("hotels")
            .select("est_actif, date_fin_abonnement, plan")
            .eq("id", profile.hotel_id)
            .single();

          if (hotel && hotelRequiresRedirect(hotel)) {
            // API → erreur JSON
            if (pathname.startsWith("/api/")) {
              return NextResponse.json(
                {
                  success: false,
                  error:
                    "Abonnement suspendu. Renouvelez votre abonnement pour continuer.",
                },
                { status: 403 }
              );
            }
            // Page → redirect vers page suspension
            // (seulement si on n'y est pas déjà)
            if (!pathname.startsWith(PAGE_ABONNEMENT_SUSPENDU)) {
              const url = request.nextUrl.clone();
              url.pathname = PAGE_ABONNEMENT_SUSPENDU;
              return NextResponse.redirect(url);
            }
          }
        }
      } catch (hotelCheckError) {
        // Si la vérification échoue, on laisse passer (dégradé gracieux)
        console.error(
          "[middleware] Erreur vérification hôtel:",
          hotelCheckError
        );
      }
    }

    // ─── 9. Headers de sécurité (ajoutés à chaque réponse) ────────────────
    supabaseResponse.headers.set("x-role", role);
    supabaseResponse.headers.set(
      "x-user-id",
      user.id
    );

    return supabaseResponse;
  } catch (error) {
    // Si Supabase échoue pour quelque raison que ce soit, laisser passer
    console.error("[middleware] Erreur Supabase, passage en mode dégradé:", error);
    return NextResponse.next({ request });
  }
}

// ─── Fonctions utilitaires exportées ─────────────────────────────────────────

/**
 * Retourne les roles autorisés pour un préfixe de route donné.
 * Utilisable dans les API routes pour vérification côté serveur.
 */
export function getRolesAutorisés(prefix: string): RoleUtilisateur[] {
  return PERMISSIONS_ROUTES[prefix] ?? [];
}

/**
 * Vérifie si un rôle a accès à une route donnée.
 */
export function peutAccéderRoute(
  role: RoleUtilisateur,
  pathname: string
): boolean {
  const prefix = getRouteProtégée(pathname);
  if (!prefix) return true; // Route non protégée
  const rolesAutorisés = PERMISSIONS_ROUTES[prefix];
  return rolesAutorisés?.includes(role) ?? false;
}
