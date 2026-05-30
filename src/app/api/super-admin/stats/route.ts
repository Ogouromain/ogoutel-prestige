// ============================================
// OGOUTEL_Prestige - API: Super Admin Dashboard Stats
// Fichier : app/api/super-admin/stats/route.ts
//
// GET /api/super-admin/stats
// - Returns super admin dashboard statistics
// - Uses Supabase admin client (bypasses RLS)
// - Falls back to demo data if Supabase unconfigured
// ============================================

import { NextResponse } from 'next/server';
import { verifyApiAuth } from '@/lib/auth-helpers';

// ─── Plan prices (FCFA) ──────────────────────────────────────────────────────

const PLAN_PRICES: Record<string, number> = {
  basique: 25000,
  standard: 50000,
  premium: 95000,
};

// ─── Demo data ────────────────────────────────────────────────────────────────

const DEMO_STATS = {
  totalHotels: 24,
  activeHotels: 18,
  pendingRequests: 7,
  codesThisMonth: 5,
  estimatedRevenue: 835000,
  recentRequests: [
    {
      id: 'demo-1',
      nom_complet: 'Koné Ibrahim',
      email: 'ibrahim.kone@email.com',
      telephone: '+2250711223344',
      nom_hotel: 'Hôtel Le Baobab',
      ville: 'Abidjan',
      plan_choisi: 'standard',
      statut: 'en_attente',
      notes_admin: null,
      created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
    {
      id: 'demo-2',
      nom_complet: 'Diallo Aïcha',
      email: 'aicha.diallo@email.com',
      telephone: '+2250755667788',
      nom_hotel: 'Résidence Palm Beach',
      ville: 'San-Pédro',
      plan_choisi: 'premium',
      statut: 'en_attente',
      notes_admin: null,
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'demo-3',
      nom_complet: 'Bamba Moussa',
      email: 'moussa.bamba@email.com',
      telephone: '+2250799001122',
      nom_hotel: 'Hôtel Étoile du Nord',
      ville: 'Bouaké',
      plan_choisi: 'basique',
      statut: 'contacte',
      notes_admin: 'Appelé le 15/01, intéressé par le plan Standard',
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'demo-4',
      nom_complet: 'Touré Fatoumata',
      email: 'fatou.toure@email.com',
      telephone: '+2250733445566',
      nom_hotel: 'Auberge du Lagon',
      ville: 'Daloa',
      plan_choisi: 'standard',
      statut: 'en_attente',
      notes_admin: null,
      created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    },
    {
      id: 'demo-5',
      nom_complet: 'Yao Serge',
      email: 'serge.yao@email.com',
      telephone: '+2250777889900',
      nom_hotel: 'Hôtel Le Cocotier',
      ville: 'Yamoussoukro',
      plan_choisi: 'premium',
      statut: 'en_attente',
      notes_admin: null,
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
  ],
  recentHotels: [
    {
      id: 'demo-h1',
      nom: 'Hôtel Le Palmier',
      ville: 'Abidjan',
      plan: 'standard',
      est_actif: true,
      nombre_chambres: 15,
      nombre_etoiles: 3,
      email: 'contact@lepalmier.ci',
      telephone: '+2250708090909',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'demo-h2',
      nom: 'Hôtel Émeraude',
      ville: 'Abidjan',
      plan: 'premium',
      est_actif: true,
      nombre_chambres: 42,
      nombre_etoiles: 4,
      email: 'info@emeraude-hotel.ci',
      telephone: '+2250712345678',
      created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    },
    {
      id: 'demo-h3',
      nom: 'Résidence La Paix',
      ville: 'Korhogo',
      plan: 'basique',
      est_actif: true,
      nombre_chambres: 8,
      nombre_etoiles: 2,
      email: 'lapaix.residence@email.com',
      telephone: '+2250765432109',
      created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
    },
    {
      id: 'demo-h4',
      nom: 'Hôtel Le Phénix',
      ville: 'Man',
      plan: 'standard',
      est_actif: true,
      nombre_chambres: 22,
      nombre_etoiles: 3,
      email: 'phoenix.hotel@email.com',
      telephone: '+2250798765432',
      created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
    },
    {
      id: 'demo-h5',
      nom: 'Auberge du Soleil',
      ville: 'Gagnoa',
      plan: 'basique',
      est_actif: false,
      nombre_chambres: 10,
      nombre_etoiles: 1,
      email: 'soleil.auberge@email.com',
      telephone: '+2250723456789',
      created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    },
  ],
  subscriptionsByPlan: [
    { plan: 'basique', count: 10 },
    { plan: 'standard', count: 9 },
    { plan: 'premium', count: 5 },
  ],
};

// ─── Route Handler ──────────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    // ── Auth verification (defense-in-depth) ──
    const auth = await verifyApiAuth(request, ['super_admin']);
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    // Dynamic import — handles missing env vars gracefully
    const { createAdminClient } = await import('@/lib/supabase/server');
    const supabase = await createAdminClient();

    if (!supabase) {
      // Return demo data when Supabase is not configured
      return NextResponse.json({ success: true, data: DEMO_STATS });
    }

    // ── Parallel queries for performance ──

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [
      totalHotelsRes,
      activeHotelsRes,
      pendingSubsRes,
      codesMonthRes,
      recentSubsRes,
      recentHotelsRes,
      planCountsRes,
    ] = await Promise.all([
      // Total hotels
      supabase.from('hotels').select('id', { count: 'exact', head: true }),

      // Active hotels
      supabase.from('hotels').select('id', { count: 'exact', head: true }).eq('est_actif', true),

      // Pending subscription requests
      supabase.from('abonnement_demandes').select('id', { count: 'exact', head: true }).eq('statut', 'en_attente'),

      // Activation codes this month
      supabase.from('codes_acces').select('id', { count: 'exact', head: true }).gte('created_at', startOfMonth),

      // Recent subscription requests (last 5)
      supabase.from('abonnement_demandes').select('*').order('created_at', { ascending: false }).limit(5),

      // Recently activated hotels (last 5)
      supabase.from('hotels').select('*').order('created_at', { ascending: false }).limit(5),

      // Subscription counts by plan (all non-rejected demandes)
      supabase.from('hotels').select('plan'),
    ]);

    // ── Calculate estimated monthly revenue from active hotels ──
    const activeHotels = planCountsRes.data ?? [];
    const estimatedRevenue = activeHotels
      .filter((h) => h.est_actif !== false)
      .reduce((sum, h) => sum + (PLAN_PRICES[h.plan] ?? 0), 0);

    // ── Calculate subscription counts by plan ──
    const subscriptionsByPlan: Record<string, number> = {
      basique: 0,
      standard: 0,
      premium: 0,
    };
    for (const h of activeHotels) {
      if (h.plan in subscriptionsByPlan) {
        subscriptionsByPlan[h.plan]++;
      }
    }

    // ── Build response (camelCase for frontend compatibility) ──
    const data = {
      totalHotels: totalHotelsRes.count ?? 0,
      activeHotels: activeHotelsRes.count ?? 0,
      pendingRequests: pendingSubsRes.count ?? 0,
      codesThisMonth: codesMonthRes.count ?? 0,
      estimatedRevenue: estimatedRevenue,
      recentRequests: recentSubsRes.data ?? [],
      recentHotels: recentHotelsRes.data ?? [],
      subscriptionsByPlan: Object.entries(subscriptionsByPlan).map(([plan, count]) => ({
        plan,
        count,
      })),
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[super-admin/stats] Erreur:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}
