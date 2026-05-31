// ============================================
// OGOUTEL_Prestige - API: Staff Check-out
// GET  /api/staff/checkout  - List active stays (checkin status)
// POST /api/staff/checkout  - Perform checkout
// ============================================

import { NextResponse } from 'next/server';
import { verifyApiAuth } from '@/lib/auth-helpers';

// ─── Demo data ────────────────────────────────────────────────────────────

function dateDaysAgo(n: number): string {
  return new Date(Date.now() - n * 86400000).toISOString().split('T')[0];
}

function dateDaysLater(n: number): string {
  return new Date(Date.now() + n * 86400000).toISOString().split('T')[0];
}

const DEMO_ACTIVE_STAYS = [
  {
    id: 'res-01', chambre_id: 'ch-02', client_id: 'cl-01',
    date_arrivee: dateDaysAgo(4), date_depart: dateDaysAgo(0),
    nombre_nuits: 4, prix_nuit: 18000, montant_total: 72000, montant_paye: 72000,
    statut: 'checkin', notes: 'Client fidèle — préférence étage 1',
    client: { nom: 'Koné', prenom: 'Ibrahim', telephone: '+2250711223344' },
    chambre: { numero: '102', type: 'simple', prix_nuit: 18000 },
  },
  {
    id: 'res-02', chambre_id: 'ch-03', client_id: 'cl-02',
    date_arrivee: dateDaysAgo(2), date_depart: dateDaysLater(3),
    nombre_nuits: 5, prix_nuit: 30000, montant_total: 150000, montant_paye: 75000,
    statut: 'checkin', notes: null,
    client: { nom: 'Diallo', prenom: 'Aïcha', telephone: '+2250755667788' },
    chambre: { numero: '103', type: 'double', prix_nuit: 30000 },
  },
  {
    id: 'res-03', chambre_id: 'ch-06', client_id: 'cl-05',
    date_arrivee: dateDaysAgo(1), date_depart: dateDaysLater(4),
    nombre_nuits: 5, prix_nuit: 60000, montant_total: 300000, montant_paye: 150000,
    statut: 'checkin', notes: 'Suite exécutive demandée par le client',
    client: { nom: 'Yao', prenom: 'Serge', telephone: '+2250777889900' },
    chambre: { numero: '202', type: 'suite', prix_nuit: 60000 },
  },
  {
    id: 'res-04', chambre_id: 'ch-09', client_id: 'cl-04',
    date_arrivee: dateDaysAgo(2), date_depart: dateDaysAgo(0),
    nombre_nuits: 2, prix_nuit: 32000, montant_total: 64000, montant_paye: 32000,
    statut: 'checkin', notes: 'Facture à compléter au départ',
    client: { nom: 'Touré', prenom: 'Fatoumata', telephone: '+2250733445566' },
    chambre: { numero: '301', type: 'double', prix_nuit: 32000 },
  },
  {
    id: 'res-05', chambre_id: 'ch-11', client_id: 'cl-08',
    date_arrivee: dateDaysAgo(3), date_depart: dateDaysLater(2),
    nombre_nuits: 5, prix_nuit: 95000, montant_total: 475000, montant_paye: 475000,
    statut: 'checkin', notes: 'VIP — jacuzzi et concierge dédié',
    client: { nom: 'Coulibaly', prenom: 'Mariam', telephone: '+2250765432109' },
    chambre: { numero: '303', type: 'vip', prix_nuit: 95000 },
  },
];

// ─── GET Handler ─────────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase() || undefined;

    const { createClient, createAdminClient } = await import('@/lib/supabase/server');
    const client = await createClient();

    if (!client) {
      // Demo mode
      let stays = [...DEMO_ACTIVE_STAYS];
      if (search) {
        stays = stays.filter(
          (s) =>
            s.chambre.numero.includes(search) ||
            s.client.nom.toLowerCase().includes(search) ||
            s.client.prenom.toLowerCase().includes(search)
        );
      }
      return NextResponse.json({ success: true, data: { sejours: stays } });
    }

    // ── Auth check ──
    const auth = await verifyApiAuth(request, ['admin_hotel', 'gerant', 'receptionniste']);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }
    const { user, profile } = auth;
    const hotelId = profile.hotel_id;

    const supabase = await createAdminClient();

    // ── Active stays ──
    let query = supabase
      .from('reservations')
      .select('*, client:clients!client_id(nom, prenom, telephone), chambre:chambres!chambre_id(numero, type, prix_nuit)')
      .eq('hotel_id', hotelId)
      .eq('statut', 'checkin')
      .order('date_arrivee', { ascending: false });

    const { data: stays } = await query;

    let filtered = stays ?? [];
    if (search) {
      filtered = filtered.filter((s) => {
        const client = s.client as { nom: string; prenom: string } | null;
        const chambre = s.chambre as { numero: string } | null;
        if (!client || !chambre) return false;
        return (
          chambre.numero.includes(search) ||
          client.nom.toLowerCase().includes(search) ||
          client.prenom.toLowerCase().includes(search)
        );
      });
    }

    return NextResponse.json({ success: true, data: { sejours: filtered } });
  } catch (error) {
    console.error('[staff/checkout GET] Erreur:', error);
    return NextResponse.json({ success: false, error: 'Erreur interne du serveur.' }, { status: 500 });
  }
}

// ─── POST Handler — Perform Checkout ───────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reservationId, montant_paye_final, mode_paiement_final, notes } = body;

    if (!reservationId) {
      return NextResponse.json({ success: false, error: 'reservationId requis.' }, { status: 400 });
    }

    const { createClient, createAdminClient } = await import('@/lib/supabase/server');
    const client = await createClient();

    if (!client) {
      // Demo mode
      const stay = DEMO_ACTIVE_STAYS.find((s) => s.id === reservationId);
      if (!stay) return NextResponse.json({ success: false, error: 'Séjour non trouvé (démo).' }, { status: 404 });

      const updated = {
        ...stay,
        statut: 'checkout',
        montant_paye: (stay.montant_paye || 0) + (montant_paye_final || 0),
        updated_at: new Date().toISOString(),
      };

      return NextResponse.json({
        success: true,
        data: updated,
        message: 'Check-out effectué avec succès (démo).',
      });
    }

    // ── Auth check ──
    const auth = await verifyApiAuth(request, ['admin_hotel', 'gerant', 'receptionniste']);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }
    const { user, profile } = auth;
    const hotelId = profile.hotel_id;

    const supabase = await createAdminClient();

    // ── Get current reservation ──
    const { data: currentRes } = await supabase
      .from('reservations')
      .select('statut, chambre_id, client_id, montant_paye, montant_total')
      .eq('id', reservationId)
      .single();

    if (!currentRes || currentRes.statut !== 'checkin') {
      return NextResponse.json({ success: false, error: 'Séjour non trouvé ou pas en cours.' }, { status: 404 });
    }

    // ── Update reservation to checkout ──
    const newMontantPaye = (currentRes.montant_paye || 0) + (montant_paye_final ? Number(montant_paye_final) : 0);
    const { data: updated, error } = await supabase
      .from('reservations')
      .update({
        statut: 'checkout',
        montant_paye: newMontantPaye,
        notes: notes || currentRes.notes,
      })
      .eq('id', reservationId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    // ── Set room to available ──
    if (currentRes.chambre_id) {
      await supabase.from('chambres').update({ statut: 'disponible' }).eq('id', currentRes.chambre_id);
    }

    // ── Create final invoice if payment ──
    if (montant_paye_final && Number(montant_paye_final) > 0 && currentRes.montant_total) {
      const isFullyPaid = newMontantPaye >= currentRes.montant_total;
      await supabase.from('factures').insert({
        hotel_id: hotelId,
        reservation_id: reservationId,
        client_id: currentRes.client_id,
        montant_ht: Math.round(Number(montant_paye_final) / 1.18),
        taux_tva: 18,
        statut_paiement: isFullyPaid ? 'paye' : 'partiel',
        mode_paiement: mode_paiement_final || null,
      });
    }

    // ── Log activity ──
    try {
      await supabase.from('activites_log').insert({
        hotel_id: hotelId,
        user_id: user.id,
        action: 'checkout',
        details: {
          reservation_id: reservationId,
          chambre_id: currentRes.chambre_id,
          client_id: currentRes.client_id,
          description: `Check-out effectué — Réservation ${reservationId.slice(-6)}`,
        },
      });
    } catch {
      // Non-critical
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Check-out effectué avec succès.',
    });
  } catch (error) {
    console.error('[staff/checkout POST] Erreur:', error);
    return NextResponse.json({ success: false, error: 'Erreur interne du serveur.' }, { status: 500 });
  }
}
