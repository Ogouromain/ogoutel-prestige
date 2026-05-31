// ============================================
// OGOUTEL_Prestige - Auth Helpers (Serveur)
// Fonctions utilitaires pour la vérification
// des permissions côté serveur (API routes, Server Actions)
//
// ⚠️ Toutes les fonctions retournent null si Supabase
//    n'est pas configuré (dégradé gracieux)
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

// ─── Helpers internes ────────────────────────────────────────────────────────

/**
 * Crée un client Supabase côté serveur.
 * Retourne null si Supabase n'est pas configuré.
 */
async function getSupabaseClient() {
  const { createClient } = await import("@supabase/ssr");
  const { cookies } = await import("next/headers");

  if (!env.SUPABASE_CONFIGURED) return null;
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_ANON_KEY;

  const cookieStore = await cookies();
  return createClient(url, key, {
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
          // Read-only en Server Components
        }
      },
    },
  });
}

/**
 * Crée un client Supabase admin (service role) côté serveur.
 * Contourne les RLS. Retourne null si non configuré.
 */
async function getAdminClient() {
  const { createClient } = await import("@supabase/ssr");

  if (!env.SUPABASE_ADMIN_CONFIGURED) return null;
  const url = env.SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  return createClient(url, serviceKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {
        // Pas de cookies pour admin client
      },
    },
  });
}

// ─── Vérification des rôles ─────────────────────────────────────────────────

/**
 * Vérifie si un utilisateur est super_admin.
 * @param userId - UUID de l'utilisateur (auth.users.id)
 * @returns true si super_admin, false sinon
 */
export async function checkIsSuperAdmin(userId: string): Promise<boolean> {
  const supabase = await getSupabaseClient();
  if (!supabase) return false;

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  return data?.role === "super_admin";
}

/**
 * Vérifie si un utilisateur est admin_hotel.
 */
export async function checkIsHotelAdmin(userId: string): Promise<boolean> {
  const supabase = await getSupabaseClient();
  if (!supabase) return false;

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  return data?.role === "admin_hotel";
}

/**
 * Vérifie si un utilisateur est un membre du staff (réceptionniste ou gérant).
 */
export async function checkIsStaff(userId: string): Promise<boolean> {
  const supabase = await getSupabaseClient();
  if (!supabase) return false;

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  return data?.role === "receptionniste" || data?.role === "gerant";
}

/**
 * Récupère le rôle d'un utilisateur.
 */
export async function getUserRole(
  userId: string
): Promise<RoleUtilisateur | null> {
  const supabase = await getSupabaseClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  return (data?.role as RoleUtilisateur) ?? null;
}

/**
 * Vérifie qu'un utilisateur possède l'un des rôles spécifiés.
 */
export async function checkUserRole(
  userId: string,
  rolesAutorises: RoleUtilisateur[]
): Promise<ResultatPermission> {
  const role = await getUserRole(userId);

  if (!role) {
    return {
      autorise: false,
      erreur: "Profil non trouvé. Contactez le support.",
    };
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

/**
 * Récupère le profil complet d'un utilisateur.
 */
export async function getProfile(
  userId: string
): Promise<Profile | null> {
  const supabase = await getSupabaseClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  return data as Profile | null;
}

/**
 * Récupère l'hôtel associé à un utilisateur (via hotel_id dans profiles).
 */
export async function getHotelByAdmin(userId: string): Promise<Hotel | null> {
  const supabase = await getSupabaseClient();
  if (!supabase) return null;

  // D'abord récupérer le hotel_id du profil
  const { data: profile } = await supabase
    .from("profiles")
    .select("hotel_id")
    .eq("id", userId)
    .single();

  if (!profile?.hotel_id) return null;

  // Puis récupérer l'hôtel
  const { data: hotel } = await supabase
    .from("hotels")
    .select("*")
    .eq("id", profile.hotel_id)
    .single();

  return hotel as Hotel | null;
}

/**
 * Vérifie le statut de l'hôtel d'un utilisateur.
 * Retourne les informations d'abonnement.
 */
export async function checkHotelStatus(
  userId: string
): Promise<VerificationHotel> {
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
    resultat.message = `Votre abonnement expire dans ${resultat.joursRestants} jour(s). Pensez à le renouveler.`;
  }

  return resultat;
}

// ─── Vérification des limites du plan ──────────────────────────────────────

/**
 * Vérifie les limites du plan d'abonnement d'un hôtel.
 * Retourne les limites restantes et si on peut ajouter des ressources.
 */
export async function checkHotelLimits(
  hotelId: string
): Promise<LimitesPlan> {
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

  const supabase = await getAdminClient();
  if (!supabase) {
    // Mode dégradé : on retourne des limites permissives
    resultat.details.push("Mode dégradé : vérification des limites désactivée.");
    return resultat;
  }

  // 1. Récupérer l'hôtel et son plan
  const { data: hotel } = await supabase
    .from("hotels")
    .select("plan, nombre_chambres")
    .eq("id", hotelId)
    .single();

  if (!hotel) {
    resultat.details.push("Hôtel non trouvé.");
    return resultat;
  }

  const planConfig = PLANS_ABONNEMENT[hotel.plan as PlanId];
  if (!planConfig) {
    resultat.details.push("Plan d'abonnement non reconnu.");
    return resultat;
  }

  // 2. Compter les chambres existantes
  const { count: chambresCount } = await supabase
    .from("chambres")
    .select("*", { count: "exact", head: true })
    .eq("hotel_id", hotelId);

  // 3. Compter le staff existant (actif)
  const { count: staffCount } = await supabase
    .from("personnel_hotel")
    .select("*", { count: "exact", head: true })
    .eq("hotel_id", hotelId)
    .eq("est_actif", true);

  const chambres = chambresCount ?? 0;
  const staff = staffCount ?? 0;

  const chambresMax = planConfig.limites.chambres;
  const staffMax =
    planConfig.limites.gerants + planConfig.limites.receptionnistes;

  resultat.chambresTotal = chambres;
  resultat.staffTotal = staff;
  resultat.chambresMax = chambresMax;
  resultat.staffMax = staffMax;
  resultat.chambresRestantes = Math.max(0, chambresMax - chambres);
  resultat.staffRestant = Math.max(0, staffMax - staff);
  resultat.peutAjouterChambre = chambres < chambresMax;
  resultat.peutAjouterStaff = staff < staffMax;

  // Messages de détail
  if (!resultat.peutAjouterChambre) {
    resultat.details.push(
      `Limite chambres atteinte (${chambres}/${chambresMax}). Passez à un plan supérieur.`
    );
  }
  if (!resultat.peutAjouterStaff) {
    resultat.details.push(
      `Limite personnel atteinte (${staff}/${staffMax}). Passez à un plan supérieur.`
    );
  }

  return resultat;
}

// ─── Helpers API routes ────────────────────────────────────────────────────

/**
 * Helper pour les API routes : vérifie l'authentification et le rôle.
 * Utilisable en début de chaque route handler protégée.
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
  const supabase = await getSupabaseClient();
  if (!supabase) {
    return { authorized: false, error: "Service indisponible.", status: 503 };
  }

  // Récupérer l'utilisateur depuis le token JWT
  const token = request.headers
    .get("Authorization")
    ?.replace("Bearer ", "");

  // Si pas de Bearer token, essayer les cookies (pour les requêtes du navigateur)
  const { data: userData, error: userError } = token
    ? await supabase.auth.getUser(token)
    : await supabase.auth.getUser();

  if (userError || !userData.user) {
    return {
      authorized: false,
      error: "Authentification requise.",
      status: 401,
    };
  }

  // Récupérer le profil
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userData.user.id)
    .single();

  if (profileError || !profile) {
    return {
      authorized: false,
      error: "Profil non trouvé.",
      status: 403,
    };
  }

  if (!profile.is_active) {
    return {
      authorized: false,
      error: "Compte désactivé.",
      status: 403,
    };
  }

  // Vérifier le rôle
  if (!rolesAutorises.includes(profile.role as RoleUtilisateur)) {
    return {
      authorized: false,
      error: "Permissions insuffisantes.",
      status: 403,
    };
  }

  return {
    authorized: true,
    user: { id: userData.user.id, email: userData.user.email ?? "" },
    profile: profile as Profile,
  };
}

// ─── Fonctionnalités du plan ───────────────────────────────────────────────

/**
 * Vérifie si une fonctionnalité est disponible pour un plan donné.
 */
export function planHasFeature(
  plan: PlanId,
  feature: string
): boolean {
  const planConfig = PLANS_ABONNEMENT[plan];
  if (!planConfig) return false;

  return planConfig.fonctionnalites.some((f) =>
    f.toLowerCase().includes(feature.toLowerCase())
  );
}

/**
 * Retourne les fonctionnalités d'un plan.
 */
export function getPlanFeatures(plan: PlanId): string[] {
  const planConfig = PLANS_ABONNEMENT[plan];
  return planConfig?.fonctionnalites ?? [];
}
