// ============================================
// OGOUTEL_Prestige - Proxy racine Next.js 16
//
// Point d'entrée unique pour toutes les requêtes.
// Délègue toute la logique à updateSession() dans
// lib/supabase/middleware.ts
//
// PROTECTION DES ROUTES :
//
//   Routes publiques (sans connexion) :
//     /, /login, /register, /forgot-password, /reset-password
//     /api/send-contact, /api/send-subscription-email,
//     /api/validate-activation-code, /api/rooms, /api/bookings,
//     /api/contact, /api/testimonials, /api/pricing,
//     /api/register-user, /api/webhooks
//
//   Routes protégées par rôle :
//     /super-admin/*  → super_admin uniquement
//     /admin/*        → admin_hotel, gerant
//     /staff/*        → receptionniste, gerant, admin_hotel
//
//   Logique de protection :
//     1. Récupérer la session Supabase (JWT)
//     2. Pas de session → /login?redirect=... (ou 401 JSON pour API)
//     3. Session → récupérer le rôle depuis profiles
//     4. Mauvais rôle → redirect dashboard du rôle (ou 403 JSON pour API)
//     5. super_admin sur /admin/* → redirect /super-admin
//     6. Vérifier hôtel actif pour admin_hotel/staff
//     7. Hôtel inactif/expiré → page "Abonnement suspendu"
//
// ⚠️ Si Supabase n'est pas configuré (.env.local manquant),
//    toutes les routes passent sans authentification.
// ============================================

import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Intercepte TOUTES les routes SAUF :
     * - _next/static    (fichiers statiques Next.js)
     * - _next/image     (optimisation images Next.js)
     * - favicon.ico     (icône navigateur)
     * - Fichiers assets (svg, png, jpg, jpeg, gif, webp, ico)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
