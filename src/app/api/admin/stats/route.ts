// ============================================
// OGOUTEL_Prestige - API: Hotel Admin Dashboard Stats
// Fichier : app/api/admin/stats/route.ts
//
// GET /api/admin/stats
// - Returns hotel admin dashboard statistics
// - Uses Supabase server client (respects RLS hotel_id)
// - Falls back to rich demo data if Supabase unconfigured
// ============================================

import { NextResponse } from 'next/server';

// ─── Helpers ──────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function dateDaysAgo(n: number): string {
  return new Date(Date.now() - n * 86400000).toISOString().split('T')[0];
}

// ─── Demo data ────────────────────────────────────────────────────────────

const DEMO_CHAMBRES = [
  { id: 'ch-01', numero: '101', type: 'simple', prix_nuit: 15000, statut: 'disponible', etage: 1 },
  { id: 'ch-02', numero: '102', type: 'simple', prix_nuit: 18000, statut: 'occupee', etage: 1 },
  { id: 'ch-03', numero: '103', type: 'double', prix_nuit: 30000, statut: 'occupee', etage: 1 },
  { id: 'ch-04', numero: '104', type: 'double', prix_nuit: 35000, statut: 'disponible', etage: 1 },
  { id: 'ch-05', numero: '201', type: 'suite', prix_nuit: 55000, statut: 'reservee', etage: 2 },
  { id: 'ch-06', numero: '202', type: 'suite', prix_nuit: 60000, statut: 'occupee', etage: 2 },
  { id: 'ch-07', numero: '203', type: 'vip', prix_nuit: 85000, statut: 'disponible', etage: 2 },
  { id: 'ch-08', numero: '204', type: 'familiale', prix_nuit: 45000, statut: 'maintenance', etage: 2 },
  { id: 'ch-09', numero: '301', type: 'double', prix_nuit: 32000, statut: 'occupee', etage: 3 },
  { id: 'ch-10', numero: '302', type: 'simple', prix_nuit: 20000, statut: 'reservee', etage: 3 },
  { id: 'ch-11', numero: '303', type: 'vip', prix_nuit: 95000, statut: 'occupee', etage: 3 },
  { id: 'ch-12', numero: '304', type: 'familiale', prix_nuit: 50000, statut: 'disponible', etage: 3 },
];

const DEMO_CLIENTS = [
  { id: 'cl-01', nom: 'Koné', prenom: 'Ibrahim', telephone: '+2250711223344', nationalite: 'Ivoirienne' },
  { id: 'cl-02', nom: 'Diallo', prenom: 'Aïcha', telephone: '+2250755667788', nationalite: 'Ivoirienne' },
  { id: 'cl-03', nom: 'Bamba', prenom: 'Moussa', telephone: '+2250799001122', nationalite: 'Malianne' },
  { id: 'cl-04', nom: 'Touré', prenom: 'Fatoumata', telephone: '+2250733445566', nationalite: 'Ivoirienne' },
  { id: 'cl-05', nom: 'Yao', prenom: 'Serge', telephone: '+2250777889900', nationalite: 'Ivoirienne' },
  { id: 'cl-06', nom: 'Kouamé', prenom: 'Aminata', telephone: '+2250708090909', nationalite: 'Ivoirienne' },
  { id: 'cl-07', nom: 'Ouattara', prenom: 'Drissa', telephone: '+2250712345678', nationalite: 'Burkinabè' },
  { id: 'cl-08', nom: 'Coulibaly', prenom: 'Mariam', telephone: '+2250765432109', nationalite: 'Ivoirienne' },
];

const today = todayStr();

const DEMO_ARRIVEES = [
  {
    id: 'res-arr-1', hotel_id: 'hotel-demo', chambre_id: 'ch-01', client_id: 'cl-06',
    receptionniste_id: null,
    date_arrivee: today, date_depart: dateDaysAgo(-3),
    nombre_nuits: 3, prix_nuit: 15000, montant_total: 45000, montant_paye: 45000,
    statut: 'confirmee',
    notes: 'Arrivée prévue en début d\'après-midi',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    client: DEMO_CLIENTS[5],
    chambre: DEMO_CHAMBRES[0],
  },
  {
    id: 'res-arr-2', hotel_id: 'hotel-demo', chambre_id: 'ch-04', client_id: 'cl-07',
    receptionniste_id: null,
    date_arrivee: today, date_depart: dateDaysAgo(-2),
    nombre_nuits: 2, prix_nuit: 35000, montant_total: 70000, montant_paye: 35000,
    statut: 'confirmee',
    notes: null,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    client: DEMO_CLIENTS[6],
    chambre: DEMO_CHAMBRES[3],
  },
  {
    id: 'res-arr-3', hotel_id: 'hotel-demo', chambre_id: 'ch-07', client_id: 'cl-03',
    receptionniste_id: null,
    date_arrivee: today, date_depart: dateDaysAgo(-5),
    nombre_nuits: 5, prix_nuit: 85000, montant_total: 425000, montant_paye: 200000,
    statut: 'confirmee',
    notes: 'Client VIP — préparer fruits de bienvenue',
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    client: DEMO_CLIENTS[2],
    chambre: DEMO_CHAMBRES[6],
  },
];

const DEMO_DEPARTS = [
  {
    id: 'res-dep-1', hotel_id: 'hotel-demo', chambre_id: 'ch-02', client_id: 'cl-01',
    receptionniste_id: null,
    date_arrivee: dateDaysAgo(4), date_depart: today,
    nombre_nuits: 4, prix_nuit: 18000, montant_total: 72000, montant_paye: 72000,
    statut: 'checkin',
    notes: null,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    client: DEMO_CLIENTS[0],
    chambre: DEMO_CHAMBRES[1],
  },
  {
    id: 'res-dep-2', hotel_id: 'hotel-demo', chambre_id: 'ch-09', client_id: 'cl-04',
    receptionniste_id: null,
    date_arrivee: dateDaysAgo(2), date_depart: today,
    nombre_nuits: 2, prix_nuit: 32000, montant_total: 64000, montant_paye: 32000,
    statut: 'checkin',
    notes: 'Facture à compléter au départ',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    client: DEMO_CLIENTS[3],
    chambre: DEMO_CHAMBRES[8],
  },
];

function generateRevenus7Jours(): Array<{ date: string; montant: number }> {
  const jours = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const data: Array<{ date: string; montant: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    const isWeekend = d.getDay() === 0 || d.getDay() === 5 || d.getDay() === 6;
    const base = isWeekend ? 350000 : 180000;
    const variance = Math.floor(Math.random() * 100000) - 50000;
    data.push({ date: dateStr, montant: base + variance });
  }
  return data;
}

const DEMO_HOTEL = {
  id: 'hotel-demo',
  nom: 'Hôtel Le Palmier',
  ville: 'Abidjan',
  plan: 'standard',
  logo_url: '/logo.svg',
  est_actif: true,
  date_fin_abonnement: new Date(Date.now() + 18 * 86400000).toISOString(),
  nombre_etoiles: 3,
  telephone: '+2250708090909',
  email: 'contact@lepalmier.ci',
};

function buildDemoStats() {
  const chambres = {
    total: DEMO_CHAMBRES.length,
    disponibles: DEMO_CHAMBRES.filter(c => c.statut === 'disponible').length,
    occupees: DEMO_CHAMBRES.filter(c => c.statut === 'occupee').length,
    maintenance: DEMO_CHAMBRES.filter(c => c.statut === 'maintenance').length,
    reservees: DEMO_CHAMBRES.filter(c => c.statut === 'reservee').length,
  };

  const dernieres_7_jours = generateRevenus7Jours();
  const revenus_jour = dernieres_7_jours[6].montant;
  const revenus_mois = dernieres_7_jours.reduce((s, d) => s + d.montant, 0) * 4.3;
  const revenus_annee = revenus_mois * 12;

  const taux_occupation = chambres.total > 0
    ? Math.round(((chambres.occupees + chambres.reservees) / chambres.total) * 100)
    : 0;

  return {
    hotel: DEMO_HOTEL,
    chambres,
    today: {
      checkins: DEMO_ARRIVEES.length,
      checkouts: DEMO_DEPARTS.length,
      arrivees: DEMO_ARRIVEES,
      departs: DEMO_DEPARTS,
    },
    finances: {
      revenus_jour,
      revenus_mois: Math.round(revenus_mois),
      revenus_annee: Math.round(revenus_annee),
      dernieres_7_jours,
    },
    reservations_en_cours: 7,
    taux_occupation,
  };
}

// ─── Route Handler ──────────────────────────────────────────────────────

export async function GET() {
  try {
    // Dynamic import — handles missing env vars gracefully
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json({ success: true, data: buildDemoStats() });
    }

    // ── Get current user's hotel ──
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié.' },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('hotel_id')
      .eq('id', user.id)
      .single();

    if (!profile?.hotel_id) {
      return NextResponse.json(
        { success: false, error: 'Aucun hôtel associé à votre compte.' },
        { status: 403 }
      );
    }

    const hotelId = profile.hotel_id;
    const todayISO = todayStr();

    // ── Parallel queries ──
    const [
      hotelRes,
      chambresRes,
      todayCheckinsRes,
      todayCheckoutsRes,
      todayArriveesRes,
      todayDepartsRes,
      reservationsActivesRes,
      revenusJourRes,
      revenusMoisRes,
      revenusAnneeRes,
      revenus7JoursRes,
    ] = await Promise.all([
      // Hotel info
      supabase
        .from('hotels')
        .select('id, nom, ville, plan, logo_url, est_actif, date_fin_abonnement, nombre_etoiles, telephone, email')
        .eq('id', hotelId)
        .single(),

      // Chambres counts by statut
      supabase
        .from('chambres')
        .select('id, statut')
        .eq('hotel_id', hotelId),

      // Checkins today (arrivees confirmees)
      supabase
        .from('reservations')
        .select('id', { count: 'exact', head: true })
        .eq('hotel_id', hotelId)
        .eq('date_arrivee', todayISO)
        .eq('statut', 'confirmee'),

      // Checkouts today (depart avec statut checkin)
      supabase
        .from('reservations')
        .select('id', { count: 'exact', head: true })
        .eq('hotel_id', hotelId)
        .eq('date_depart', todayISO)
        .eq('statut', 'checkin'),

      // Full arrivees today with client + chambre
      supabase
        .from('reservations')
        .select('*, client:clients(id, nom, prenom, telephone, nationalite), chambre:chambres(id, numero, type, prix_nuit, statut)')
        .eq('hotel_id', hotelId)
        .eq('date_arrivee', todayISO)
        .eq('statut', 'confirmee'),

      // Full departs today with client + chambre
      supabase
        .from('reservations')
        .select('*, client:clients(id, nom, prenom, telephone, nationalite), chambre:chambres(id, numero, type, prix_nuit, statut)')
        .eq('hotel_id', hotelId)
        .eq('date_depart', todayISO)
        .eq('statut', 'checkin'),

      // Active reservations
      supabase
        .from('reservations')
        .select('id', { count: 'exact', head: true })
        .eq('hotel_id', hotelId)
        .in('statut', ['en_attente', 'confirmee', 'checkin']),

      // Revenus du jour (factures payees aujourd'hui)
      supabase
        .from('factures')
        .select('montant_ttc')
        .eq('hotel_id', hotelId)
        .eq('statut_paiement', 'paye')
        .gte('created_at', new Date(todayISO).toISOString()),

      // Revenus du mois
      supabase
        .from('factures')
        .select('montant_ttc')
        .eq('hotel_id', hotelId)
        .eq('statut_paiement', 'paye')
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),

      // Revenus de l'annee
      supabase
        .from('factures')
        .select('montant_ttc')
        .eq('hotel_id', hotelId)
        .eq('statut_paiement', 'paye')
        .gte('created_at', new Date(new Date().getFullYear(), 0, 1).toISOString()),

      // Revenus 7 derniers jours (daily breakdown)
      supabase
        .from('factures')
        .select('montant_ttc, created_at')
        .eq('hotel_id', hotelId)
        .eq('statut_paiement', 'paye')
        .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
    ]);

    // ── Compute chambre stats ──
    const allChambres = chambresRes.data ?? [];
    const chambresStats = {
      total: allChambres.length,
      disponibles: allChambres.filter(c => c.statut === 'disponible').length,
      occupees: allChambres.filter(c => c.statut === 'occupee').length,
      maintenance: allChambres.filter(c => c.statut === 'maintenance').length,
      reservees: allChambres.filter(c => c.statut === 'reservee').length,
    };

    // ── Compute taux occupation ──
    const taux_occupation = chambresStats.total > 0
      ? Math.round(((chambresStats.occupees + chambresStats.reservees) / chambresStats.total) * 100)
      : 0;

    // ── Compute revenus ──
    const sumMontant = (items: Array<{ montant_ttc: number | null }>) =>
      items.reduce((s, f) => s + (Number(f.montant_ttc) || 0), 0);

    const revenus_jour = sumMontant(revenusJourRes.data ?? []);
    const revenus_mois = sumMontant(revenusMoisRes.data ?? []);
    const revenus_annee = sumMontant(revenusAnneeRes.data ?? []);

    // ── Compute 7-day breakdown ──
    const dernieres_7_jours: Array<{ date: string; montant: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const dayStr = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
      const dayStart = new Date(dayStr).toISOString();
      const dayEnd = new Date(Date.now() - (i - 1) * 86400000).toISOString();
      const dayFactures = (revenus7JoursRes.data ?? []).filter(f =>
        f.created_at >= dayStart && f.created_at < dayEnd
      );
      dernieres_7_jours.push({
        date: dayStr,
        montant: sumMontant(dayFactures),
      });
    }

    const data = {
      hotel: hotelRes.data ?? DEMO_HOTEL,
      chambres: chambresStats,
      today: {
        checkins: todayCheckinsRes.count ?? 0,
        checkouts: todayCheckoutsRes.count ?? 0,
        arrivees: todayArriveesRes.data ?? [],
        departs: todayDepartsRes.data ?? [],
      },
      finances: {
        revenus_jour,
        revenus_mois,
        revenus_annee,
        dernieres_7_jours,
      },
      reservations_en_cours: reservationsActivesRes.count ?? 0,
      taux_occupation,
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[admin/stats] Erreur:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}
