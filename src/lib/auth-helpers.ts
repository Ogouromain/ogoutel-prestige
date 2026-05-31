// ============================================
// OGOUTEL_Prestige - Auth Helpers (Serveur) V2
// Fonctions utilitaires pour la vérification
// des permissions côté serveur (API routes)
//
// V2: Uses direct REST API calls instead of SSR client
// to avoid double token-refresh issues between middleware
// and API route handlers.
// ============================================

import type { Profile, Hotel, RoleUtilisateur } from "@/types";
import { PLANS_ABONNEMENT, type PlanId } from "@/lib/constants";
import env from "@/lib/env";

// ─── Types de retour ──────────────────────────────────────────────────────────

export interface ResultatPermission {
  autorise: boolean;
  erreur?: string;
}

export interface LimitesPlan {
  peutAjouterChambre: boolean;
  peutAjouterStaff: boolean;
  chambresRestantes: number;
  staffRestant: number;
  chambresTotal: number;
  staffTotal: number;
  chambresMax: number;
  staffMax: number;
  details: string[];
}

export interface VerificationHotel {
  hotel: Hotel | null;
  estActif: boolean;
  abonnementExpire: boolean;
  joursRestants: number;
  planActuel: PlanId | null;
  message?: string;
}

// ─── Direct REST helpers (avoids SSR cookie issues) ────────────────────────

/**
 * Extract the Supabase auth token from request cookies.
 */
function extractAuthToken(request: Request): string | null {
  // Try Authorization header first
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.replace("Bearer ", "");
  }

  // Try cookies
  const cookieHeader = request.headers.get("Cookie") || "";
  const match = cookieHeader.match(/sb-[a-z0-9]+-auth-token=([^;]+)/);
  if (match?.[1]) {
    try {
      // The cookie is base64 encoded JSON
      const decoded = JSON.parse(Buffer.from(match[1], "base64").toString());
      return decoded.access_token || null;
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Validate a Supabase JWT token by calling the /auth/v1/user endpoint.
 * Returns the user object or null if invalid.
 */
async function validateToken(token: string): Promise<Record<string, unknown> | null> {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return null;

  try {
    const res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: env.SUPABASE_ANON_KEY,
      },
    });

    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Get a user's profile using direct REST API with service role key.
 * Bypasses RLS completely.
 */
async function getProfileREST(userId: string): Promise<Profile | null> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return null;

  try {
    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*`,
      {
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    return (data?.[0] as Profile) ?? null;
  } catch {
    return null;
  }
}

// ─── Vérification des rôles ─────────────────────────────────────────────────

export async function checkIsSuperAdmin(userId: string): Promise<boolean> {
  const profile = await getProfileREST(userId);
  return profile?.role === "super_admin";
}

export async function checkIsHotelAdmin(userId: string): Promise<boolean> {
  const profile = await getProfileREST(userId);
  return profile?.role === "admin_hotel";
}

export async function checkIsStaff(userId: string): Promise<boolean> {
  const profile = await getProfileREST(userId);
  return profile?.role === "receptionniste" || profile?.role === "gerant";
}

export async function getUserRole(userId: string): Promise<RoleUtilisateur | null> {
  const profile = await getProfileREST(userId);
  return (profile?.role as RoleUtilisateur) ?? null;
}

export async function checkUserRole(
  userId: string,
  rolesAutorises: RoleUtilisateur[]
): Promise<ResultatPermission> {
  const role = await getUserRole(userId);
  if (!role) {
    return { autorise: false, erreur: "Profil non trouvé." };
  }
  if (!rolesAutorises.includes(role)) {
    return {
      autorise: false,
      erreur: `Permissions insuffisantes. Rôle requis: ${rolesAutorises.join(", ")}.`,
    };
  }
  return { autorise: true };
}

// ─── Récupération du profil et de l'hôtel ──────────────────────────────────

export async function getProfile(userId: string): Promise<Profile | null> {
  return await getProfileREST(userId);
}

export async function getHotelByAdmin(userId: string): Promise<Hotel | null> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return null;

  const profile = await getProfileREST(userId);
  if (!profile?.hotel_id) return null;

  try {
    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/hotels?id=eq.${profile.hotel_id}&select=*`,
      {
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    return (data?.[0] as Hotel) ?? null;
  } catch {
    return null;
  }
}

export async function checkHotelStatus(userId: string): Promise<VerificationHotel> {
  const hotel = await getHotelByAdmin(userId);

  const resultat: VerificationHotel = {
    hotel,
    estActif: false,
    abonnementExpire: false,
    joursRestants: 0,
    planActuel: null,
  };

  if (!hotel) {
    resultat.message = "Aucun hôtel associé à votre compte.";
    return resultat;
  }

  resultat.estActif = hotel.est_actif;
  resultat.planActuel = hotel.plan as PlanId;

  const now = new Date();
  const dateFin = new Date(hotel.date_fin_abonnement);
  resultat.joursRestants = Math.ceil(
    (dateFin.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (resultat.joursRestants < 0) {
    resultat.abonnementExpire = true;
    if (resultat.joursRestants < -7) {
      resultat.message =
        "Votre abonnement est expiré depuis plus de 7 jours. Renouvelez-le pour continuer.";
    } else {
      resultat.message = `Votre abonnement a expiré il y a ${Math.abs(resultat.joursRestants)} jour(s).`;
    }
  } else if (resultat.joursRestants <= 7) {
    resultat.message = `Votre abonnement expire dans ${resultat.joursRestants} jour(s).`;
  }

  return resultat;
}

// ─── Vérification des limites du plan ──────────────────────────────────────

export async function checkHotelLimits(hotelId: string): Promise<LimitesPlan> {
  const resultat: LimitesPlan = {
    peutAjouterChambre: true,
    peutAjouterStaff: true,
    chambresRestantes: 0,
    staffRestant: 0,
    chambresTotal: 0,
    staffTotal: 0,
    chambresMax: 0,
    staffMax: 0,
    details: [],
  };

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    resultat.details.push("Mode dégradé : vérification des limites désactivée.");
    return resultat;
  }

  try {
    // Get hotel
    const hotelRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/hotels?id=eq.${hotelId}&select=plan,nombre_chambres`,
      {
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );
    const hotelData = await hotelRes.json();
    const hotel = hotelData?.[0];
    if (!hotel) {
      resultat.details.push("Hôtel non trouvé.");
      return resultat;
    }

    const planConfig = PLANS_ABONNEMENT[hotel.plan as PlanId];
    if (!planConfig) {
      resultat.details.push("Plan non reconnu.");
      return resultat;
    }

    // Count chambres
    const chambresRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/chambres?hotel_id=eq.${hotelId}&select=id`,
      {
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );
    const chambres = (await chambresRes.json())?.length ?? 0;

    // Count staff
    const staffRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/personnel_hotel?hotel_id=eq.${hotelId}&est_actif=eq.true&select=id`,
      {
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );
    const staff = (await staffRes.json())?.length ?? 0;

    const chambresMax = planConfig.limites.chambres;
    const staffMax = planConfig.limites.gerants + planConfig.limites.receptionnistes;

    resultat.chambresTotal = chambres;
    resultat.staffTotal = staff;
    resultat.chambresMax = chambresMax;
    resultat.staffMax = staffMax;
    resultat.chambresRestantes = Math.max(0, chambresMax - chambres);
    resultat.staffRestant = Math.max(0, staffMax - staff);
    resultat.peutAjouterChambre = chambres < chambresMax;
    resultat.peutAjouterStaff = staff < staffMax;

    if (!resultat.peutAjouterChambre) {
      resultat.details.push(
        `Limite chambres atteinte (${chambres}/${chambresMax}).`
      );
    }
    if (!resultat.peutAjouterStaff) {
      resultat.details.push(
        `Limite personnel atteinte (${staff}/${staffMax}).`
      );
    }
  } catch (err) {
    resultat.details.push(`Erreur: ${err instanceof Error ? err.message : String(err)}`);
  }

  return resultat;
}

// ─── Helpers API routes ────────────────────────────────────────────────────

/**
 * Vérifie l'authentification et le rôle pour les API routes.
 * V2: Uses direct REST calls to avoid SSR cookie/token refresh issues.
 *
 * @example
 * ```ts
 * const auth = await verifyApiAuth(request, ['admin_hotel', 'gerant']);
 * if (!auth.authorized) {
 *   return NextResponse.json({ error: auth.error }, { status: auth.status });
 * }
 * const { user, profile } = auth;
 * ```
 */
export async function verifyApiAuth(
  request: Request,
  rolesAutorises: RoleUtilisateur[]
): Promise<
  | { authorized: true; user: { id: string; email: string }; profile: Profile }
  | { authorized: false; error: string; status: number }
> {
  if (!env.SUPABASE_CONFIGURED) {
    return { authorized: false, error: "Service indisponible.", status: 503 };
  }

  // 1. Extract and validate token
  const token = extractAuthToken(request);
  if (!token) {
    return {
      authorized: false,
      error: "Authentification requise.",
      status: 401,
    };
  }

  const userData = await validateToken(token);
  if (!userData) {
    return {
      authorized: false,
      error: "Session invalide. Reconnectez-vous.",
      status: 401,
    };
  }

  // 2. Get profile via REST (bypasses RLS)
  const profile = await getProfileREST(userData.id as string);
  if (!profile) {
    // Fallback to user_metadata
    const meta = (userData.user_metadata || {}) as Record<string, unknown>;
    const fallbackProfile: Profile = {
      id: userData.id as string,
      email: userData.email as string,
      full_name: (meta.full_name as string) || userData.email as string,
      phone: (meta.phone as string) || null,
      role: (meta.role as RoleUtilisateur) || null,
      hotel_id: (meta.hotel_id as string) || null,
      avatar_url: null,
      is_active: meta.is_active !== false,
      created_at: userData.created_at as string,
      updated_at: userData.updated_at as string,
    };

    if (!fallbackProfile.role || !rolesAutorises.includes(fallbackProfile.role)) {
      return {
        authorized: false,
        error: "Profil non configuré.",
        status: 403,
      };
    }

    if (!fallbackProfile.is_active) {
      return {
        authorized: false,
        error: "Compte désactivé.",
        status: 403,
      };
    }

    return {
      authorized: true,
      user: { id: fallbackProfile.id, email: fallbackProfile.email },
      profile: fallbackProfile,
    };
  }

  // 3. Check if active
  if (!profile.is_active) {
    return {
      authorized: false,
      error: "Compte désactivé.",
      status: 403,
    };
  }

  // 4. Check role
  if (!rolesAutorises.includes(profile.role as RoleUtilisateur)) {
    return {
      authorized: false,
      error: "Permissions insuffisantes.",
      status: 403,
    };
  }

  return {
    authorized: true,
    user: { id: profile.id, email: profile.email ?? "" },
    profile,
  };
}

// ─── Fonctionnalités du plan ───────────────────────────────────────────────

export function planHasFeature(plan: PlanId, feature: string): boolean {
  const planConfig = PLANS_ABONNEMENT[plan];
  if (!planConfig) return false;
  return planConfig.fonctionnalites.some((f) =>
    f.toLowerCase().includes(feature.toLowerCase())
  );
}

export function getPlanFeatures(plan: PlanId): string[] {
  const planConfig = PLANS_ABONNEMENT[plan];
  return planConfig?.fonctionnalites ?? [];
}
