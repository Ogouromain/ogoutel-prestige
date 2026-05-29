// ============================================
// OGOUTEL_Prestige - Middleware Next.js
// Protection des routes par rôle + session
//
// Routes publiques    : /, /login, /register,
//                       /forgot-password, /reset-password,
//                       /api/send-contact
//
// Routes protégées    :
//   /super-dashboard  → super_admin
//   /dashboard        → admin_hotel, gerant
//   /receptionniste   → receptionniste, gerant, admin_hotel
//
// Logique :
//   Non connecté  + route protégée  → /login?redirect=...
//   Connecté      + /login|register → /dashboard selon rôle
//   Mauvais rôle  + route réservée  → dashboard de son rôle
// ============================================

import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Intercepte TOUTES les routes SAUF :
     * - _next/static    (fichiers statiques)
     * - _next/image     (optimisation images Next.js)
     * - favicon.ico     (icône navigateur)
     * - Fichiers assets (svg, png, jpg, jpeg, gif, webp, ico)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
