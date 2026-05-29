// ============================================
// OGOUTEL_Prestige - API: Staff Dashboard Stats
// GET /api/staff/stats — Dashboard overview for staff
// ============================================

import { NextResponse } from 'next/server';

// ─── Demo data ────────────────────────────────────────────────────────────

const DEMO_CHAMBRES = [
  { id: 'ch-01', numero: '101', statut: 'disponible' },
  { id: 'ch-02', numero: '102', statut: 'occupee' },
  { id: 'ch-03', numero: '103', statut: 'occupee' },
  { id: 'ch-04', numero: '104', statut: 'disponible' },
  { id: 'ch-05', numero: '201', statut: 'reservee' },
  { id: 'ch-06', numero: '202', statut: 'occupee' },
  { id: 'ch-07', numero: '203', statut: 'disponible' },
  { id: 'ch-08', numero: '204', statut: 'maintenance' },
  { id: 'ch-09', numero: '301', statut: 'occupee' },
  { id: 'ch-10', numero: '302', statut: 'reservee' },
  { id: 'ch-11', numero: '303', statut: 'occupee' },
  { id: 'ch-12', numero: '304', statut: 'disponible' },
];

function dateDaysAgo(n: number): string {
  return new Date(Date.now() - n * 86400000).toISOString().split('T')[0];
}

function dateDaysLater(n: number): string {
  return new Date(Date.now() + n * 86400000).toISOString().split('T')[0];
}

const today = new Date().toISOString().split('T')[0];

const DEMO_RESERVATIONS = [
  {
    id: 'res-06', statut: 'confirmee', date_arrivee: today,
    client: { nom: 'Kouamé', prenom: 'Aminata' },
    chambre: { numero: '101' },
  },
  {
    id: 'res-07', statut: 'confirmee', date_arrivee: today,
    client: { nom: 'Ouattara', prenom: 'Drissa' },
    chambre: { numero: '104' },
  },
  {
    id: 'res-01', statut: 'checkin', date_depart: today,
    client: { nom: 'Koné', prenom: 'Ibrahim' },
    chambre: { numero: '102' },
  },
  {
    id: 'res-04', statut: 'checkin', date_depart: today,
    client: { nom: 'Touré', prenom: 'Fatoumata' },
    chambre: { numero: '301' },
  },
];

const DEMO_ACTIVITIES = [
  {
    id: 'act-1',
    action: 'checkin',
    description: 'Check-in de Diallo Aïcha — Chambre 103',
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'act-2',
    action: 'checkout',
    description: 'Check-out de Bamba Moussa — Chambre 204',
    created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
  {
    id: 'act-3',
    action: 'reservation',
    description: 'Nouvelle réservation — Koné Ibrahim — Chambre 101',
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: 'act-4',
    action: 'payment',
    description: 'Paiement reçu — 150 000 FCFA — Yao Serge',
    created_at: new Date(Date.now() - 26 * 3600000).toISOString(),
  },
];

// ─── GET Handler ─────────────────────────────────────────────────────────

export async function GET() {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    if (!supabase) {
      // Demo response
      const checkinsToday = DEMO_RESERVATIONS.filter(
        (r) => r.statut === 'confirmee' && r.date_arrivee === today
      );
      const checkoutsToday = DEMO_RESERVATIONS.filter(
        (r) => r.statut === 'checkin' && r.date_depart === today
      );

      return NextResponse.json({
        success: true,
        data: {
          chambres: {
            total: DEMO_CHAMBRES.length,
            disponibles: DEMO_CHAMBRES.filter((c) => c.statut === 'disponible').length,
            occupees: DEMO_CHAMBRES.filter((c) => c.statut === 'occupee').length,
            maintenance: DEMO_CHAMBRES.filter((c) => c.statut === 'maintenance').length,
            reservees: DEMO_CHAMBRES.filter((c) => c.statut === 'reservee').length,
          },
          today: {
            checkins: checkinsToday.length,
            checkouts: checkoutsToday.length,
          },
          arrivees_jour: checkinsToday,
          departs_jour: checkoutsToday,
          activites_recentes: DEMO_ACTIVITIES,
          staff_info: {
            nom: 'Marie',
            prenom: 'Dupont',
            role: 'receptionniste',
          },
          hotel_nom: 'OGOUTEL Prestige',
        },
      });
    }

    // ── Auth check ──
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié.' },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('hotel_id, full_name, role')
      .eq('id', user.id)
      .single();

    if (!profile?.hotel_id) {
      return NextResponse.json(
        { success: false, error: 'Aucun hôtel associé.' },
        { status: 403 }
      );
    }

    // ── Fetch chambres stats ──
    const { data: chambres } = await supabase
      .from('chambres')
      .select('id, statut')
      .eq('hotel_id', profile.hotel_id);

    const allChambres = chambres ?? [];
    const todayStr = new Date().toISOString().split('T')[0];

    // ── Today's check-ins (confirmed, arriving today) ──
    const { data: checkinsToday } = await supabase
      .from('reservations')
      .select('id, statut, date_arrivee, client:clients!client_id(nom, prenom), chambre:chambres!chambre_id(numero)')
      .eq('hotel_id', profile.hotel_id)
      .eq('statut', 'confirmee')
      .eq('date_arrivee', todayStr);

    // ── Today's check-outs (checked-in, departing today) ──
    const { data: checkoutsToday } = await supabase
      .from('reservations')
      .select('id, statut, date_depart, client:clients!client_id(nom, prenom), chambre:chambres!chambre_id(numero)')
      .eq('hotel_id', profile.hotel_id)
      .eq('statut', 'checkin')
      .eq('date_depart', todayStr);

    // ── Recent activities ──
    const { data: activites } = await supabase
      .from('activites_log')
      .select('id, action, details, created_at')
      .eq('hotel_id', profile.hotel_id)
      .order('created_at', { ascending: false })
      .limit(10);

    // ── Hotel name ──
    const { data: hotel } = await supabase
      .from('hotels')
      .select('nom')
      .eq('id', profile.hotel_id)
      .single();

    const nameParts = (profile.full_name || '').split(' ');
    const prenom = nameParts.length > 1 ? nameParts[0] : '';
    const nom = nameParts.length > 1 ? nameParts.slice(1).join(' ') : nameParts[0];

    return NextResponse.json({
      success: true,
      data: {
        chambres: {
          total: allChambres.length,
          disponibles: allChambres.filter((c) => c.statut === 'disponible').length,
          occupees: allChambres.filter((c) => c.statut === 'occupee').length,
          maintenance: allChambres.filter((c) => c.statut === 'maintenance').length,
          reservees: allChambres.filter((c) => c.statut === 'reservee').length,
        },
        today: {
          checkins: (checkinsToday ?? []).length,
          checkouts: (checkoutsToday ?? []).length,
        },
        arrivees_jour: checkinsToday ?? [],
        departs_jour: checkoutsToday ?? [],
        activites_recentes:
          activites?.map((a) => ({
            id: a.id,
            action: a.action,
            description:
              typeof a.details === 'object' && a.details !== null
                ? (a.details as Record<string, unknown>).description || a.action
                : a.action,
            created_at: a.created_at,
          })) ?? [],
        staff_info: {
          prenom,
          nom,
          role: profile.role,
        },
        hotel_nom: hotel?.nom || 'Mon Hôtel',
      },
    });
  } catch (error) {
    console.error('[staff/stats GET] Erreur:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}
