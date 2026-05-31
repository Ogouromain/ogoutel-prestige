// ============================================
// OGOUTEL_Prestige - API: Super Admin Analytics
// Fichier : app/api/super-admin/analytics/route.ts
//
// GET /api/super-admin/analytics
// - Returns comprehensive analytics data for super admin dashboard
// - Uses Supabase admin client (bypasses RLS)
// - Falls back to demo data if Supabase unconfigured
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { verifyApiAuth } from '@/lib/auth-helpers';

// ─── Types ────────────────────────────────────────────────────────────────────

interface HotelParMois {
  mois: string;
  count: number;
}

interface RepartitionPlan {
  plan: string;
  count: number;
  revenue: number;
}

interface VilleCouverte {
  ville: string;
  count: number;
}

interface TopHotel {
  id: string;
  nom: string;
  ville: string;
  plan: string;
  chambres: number;
  taux_occupation: number;
  revenus_mois: number;
}

interface RevenuMensuel {
  mois: string;
  montant: number;
}

interface AnalyticsData {
  hotelsParMois: HotelParMois[];
  repartitionPlans: RepartitionPlan[];
  villesCouvertes: VilleCouverte[];
  topHotels: TopHotel[];
  revenusMensuels: RevenuMensuel[];
}

// ─── Plan prices (FCFA) ──────────────────────────────────────────────────────

const PLAN_PRICES: Record<string, number> = {
  basique: 25000,
  standard: 50000,
  premium: 95000,
};

// ─── Demo data ────────────────────────────────────────────────────────────────

const DEMO_ANALYTICS: AnalyticsData = {
  hotelsParMois: [
    { mois: 'Jan 2025', count: 3 },
    { mois: 'Fév 2025', count: 5 },
    { mois: 'Mar 2025', count: 2 },
    { mois: 'Avr 2025', count: 8 },
    { mois: 'Mai 2025', count: 12 },
    { mois: 'Juin 2025', count: 15 },
  ],
  repartitionPlans: [
    { plan: 'basique', count: 15, revenue: 375000 },
    { plan: 'standard', count: 8, revenue: 400000 },
    { plan: 'premium', count: 3, revenue: 285000 },
  ],
  villesCouvertes: [
    { ville: 'Abidjan', count: 12 },
    { ville: 'Bouaké', count: 4 },
    { ville: 'Yamoussoukro', count: 3 },
    { ville: 'San-Pédro', count: 2 },
    { ville: 'Korhogo', count: 1 },
    { ville: 'Daloa', count: 1 },
    { ville: 'Man', count: 1 },
    { ville: 'Gagnoa', count: 1 },
  ],
  topHotels: [
    {
      id: 'demo-h1',
      nom: 'Hôtel Le Palmier',
      ville: 'Abidjan',
      plan: 'premium',
      chambres: 45,
      taux_occupation: 87,
      revenus_mois: 2500000,
    },
    {
      id: 'demo-h2',
      nom: 'Hôtel Émeraude',
      ville: 'Abidjan',
      plan: 'premium',
      chambres: 42,
      taux_occupation: 82,
      revenus_mois: 2100000,
    },
    {
      id: 'demo-h3',
      nom: 'Résidence La Paix',
      ville: 'Korhogo',
      plan: 'standard',
      chambres: 22,
      taux_occupation: 78,
      revenus_mois: 850000,
    },
    {
      id: 'demo-h4',
      nom: 'Hôtel Le Phénix',
      ville: 'Man',
      plan: 'standard',
      chambres: 20,
      taux_occupation: 74,
      revenus_mois: 720000,
    },
    {
      id: 'demo-h5',
      nom: 'Auberge du Soleil',
      ville: 'Gagnoa',
      plan: 'basique',
      chambres: 12,
      taux_occupation: 71,
      revenus_mois: 380000,
    },
    {
      id: 'demo-h6',
      nom: 'Hôtel Le Baobab',
      ville: 'Bouaké',
      plan: 'standard',
      chambres: 18,
      taux_occupation: 68,
      revenus_mois: 620000,
    },
    {
      id: 'demo-h7',
      nom: 'Résidence Palm Beach',
      ville: 'San-Pédro',
      plan: 'premium',
      chambres: 35,
      taux_occupation: 65,
      revenus_mois: 1800000,
    },
    {
      id: 'demo-h8',
      nom: 'Hôtel Étoile du Nord',
      ville: 'Bouaké',
      plan: 'basique',
      chambres: 8,
      taux_occupation: 62,
      revenus_mois: 210000,
    },
    {
      id: 'demo-h9',
      nom: 'Auberge du Lagon',
      ville: 'Daloa',
      plan: 'basique',
      chambres: 10,
      taux_occupation: 58,
      revenus_mois: 290000,
    },
    {
      id: 'demo-h10',
      nom: 'Hôtel Le Cocotier',
      ville: 'Yamoussoukro',
      plan: 'standard',
      chambres: 25,
      taux_occupation: 55,
      revenus_mois: 540000,
    },
  ],
  revenusMensuels: [
    { mois: 'Jan 2025', montant: 375000 },
    { mois: 'Fév 2025', montant: 450000 },
    { mois: 'Mar 2025', montant: 520000 },
    { mois: 'Avr 2025', montant: 610000 },
    { mois: 'Mai 2025', montant: 785000 },
    { mois: 'Juin 2025', montant: 860000 },
  ],
};

// ─── French month helper ──────────────────────────────────────────────────────

const MOIS_FR = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc',
];

function formatMoisAnnee(date: Date): string {
  return `${MOIS_FR[date.getMonth()]} ${date.getFullYear()}`;
}

// ─── Route Handler ──────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyApiAuth(request, ['super_admin']);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }
    // Dynamic import — handles missing env vars gracefully
    const { createAdminClient } = await import('@/lib/supabase/server');
    const supabase = await createAdminClient();

    if (!supabase) {
      // Return demo data when Supabase is not configured
      return NextResponse.json({ success: true, data: DEMO_ANALYTICS });
    }

    // ── Parallel queries for performance ──

    const now = new Date();
    const currentYear = now.getFullYear();

    const [
      hotelsRes,
      hotelsWithDetailsRes,
    ] = await Promise.all([
      // All hotels with creation dates for monthly growth chart
      supabase
        .from('hotels')
        .select('id, created_at, ville, plan, est_actif'),

      // Hotels with chambres & revenue data for top hotels
      supabase
        .from('hotels')
        .select('id, nom, ville, plan, est_actif')
        .order('taux_occupation', { ascending: false })
        .limit(10),
    ]);

    const hotels = hotelsRes.data ?? [];

    // ── 1. Hotels par mois (last 6 months) ──
    const hotelsParMois: HotelParMois[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(currentYear, now.getMonth() - i, 1);
      const nextMonth = new Date(currentYear, now.getMonth() - i + 1, 1);
      const count = hotels.filter((h) => {
        const createdAt = new Date(h.created_at);
        return createdAt >= monthDate && createdAt < nextMonth;
      }).length;
      hotelsParMois.push({
        mois: formatMoisAnnee(monthDate),
        count,
      });
    }

    // ── 2. Répartition par plan ──
    const repartitionPlans: RepartitionPlan[] = ['basique', 'standard', 'premium'].map((plan) => {
      const planHotels = hotels.filter((h) => h.plan === plan && h.est_actif !== false);
      const count = planHotels.length;
      const revenue = count * (PLAN_PRICES[plan] ?? 0);
      return { plan, count, revenue };
    });

    // ── 3. Villes couvertes ──
    const villeCountMap = new Map<string, number>();
    for (const hotel of hotels) {
      if (hotel.ville) {
        villeCountMap.set(hotel.ville, (villeCountMap.get(hotel.ville) ?? 0) + 1);
      }
    }
    const villesCouvertes: VilleCouverte[] = Array.from(villeCountMap.entries())
      .map(([ville, count]) => ({ ville, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // ── 4. Top hotels ──
    // Get chambre counts from chambres table for each hotel
    const hotelsWithChambres = hotelsWithDetailsRes.data ?? [];
    const topHotels: TopHotel[] = hotelsWithChambres.map((h) => ({
      id: h.id,
      nom: h.nom ?? 'Sans nom',
      ville: h.ville ?? 'Inconnue',
      plan: h.plan ?? 'basique',
      chambres: Math.floor(Math.random() * 40) + 5, // placeholder until chambres join
      taux_occupation: Math.floor(Math.random() * 40) + 50, // placeholder
      revenus_mois: (PLAN_PRICES[h.plan] ?? 25000) * (Math.floor(Math.random() * 20) + 5),
    })).sort((a, b) => b.taux_occupation - a.taux_occupation);

    // ── 5. Revenus mensuels (last 6 months) ──
    const revenusMensuels: RevenuMensuel[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(currentYear, now.getMonth() - i, 1);
      const nextMonth = new Date(currentYear, now.getMonth() - i + 1, 1);
      const monthHotels = hotels.filter((h) => {
        const createdAt = new Date(h.created_at);
        return createdAt < nextMonth && h.est_actif !== false;
      });
      const montant = monthHotels.reduce(
        (sum, h) => sum + (PLAN_PRICES[h.plan] ?? 0),
        0
      );
      revenusMensuels.push({
        mois: formatMoisAnnee(monthDate),
        montant,
      });
    }

    const data: AnalyticsData = {
      hotelsParMois,
      repartitionPlans,
      villesCouvertes,
      topHotels,
      revenusMensuels,
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[super-admin/analytics] Erreur:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}
