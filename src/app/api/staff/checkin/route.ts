// ============================================
// OGOUTEL_Prestige - API: Staff Check-in
// POST /api/staff/checkin — Perform check-in (create reservation + mark checkin)
// ============================================

import { NextResponse } from 'next/server';
import { verifyApiAuth } from '@/lib/auth-helpers';

// ─── POST Handler ────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      client_id, chambre_id, date_arrivee, date_depart,
      nombre_nuits, nombre_personnes, montant_total, montant_paye,
      reste_a_payer, mode_paiement, requetes_speciales, notes,
    } = body;

    if (!client_id || !chambre_id || !date_arrivee || !date_depart) {
      return NextResponse.json(
        { success: false, error: 'Champs requis : client_id, chambre_id, date_arrivee, date_depart.' },
        { status: 400 }
      );
    }

    if (new Date(date_depart) <= new Date(date_arrivee)) {
      return NextResponse.json(
        { success: false, error: 'La date de départ doit être postérieure à la date d\'arrivée.' },
        { status: 400 }
      );
    }

    const { createClient, createAdminClient } = await import('@/lib/supabase/server');
    const client = await createClient();

    if (!client) {
      // Demo mode — return success
      const newReservation = {
        id: `res-new-${Date.now()}`,
        hotel_id: 'hotel-demo',
        chambre_id,
        client_id,
        receptionniste_id: null,
        date_arrivee,
        date_depart,
        nombre_nuits: nombre_nuits || 1,
        nombre_personnes: nombre_personnes || 1,
        prix_nuit: montant_total / (nombre_nuits || 1),
        montant_total: montant_total || 0,
        montant_paye: montant_paye || 0,
        statut: 'checkin',
        requetes_speciales: requetes_speciales || null,
        notes: notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return NextResponse.json({
        success: true,
        data: newReservation,
        message: 'Check-in effectué avec succès (démo).',
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

    // ── Get room price ──
    const { data: chambre } = await supabase
      .from('chambres')
      .select('prix_nuit')
      .eq('id', chambre_id)
      .single();

    const prixNuit = chambre ? Number(chambre.prix_nuit) : 0;

    // ── Create reservation with checkin status ──
    const { data: reservation, error } = await supabase
      .from('reservations')
      .insert({
        hotel_id: hotelId,
        chambre_id,
        client_id,
        receptionniste_id: user.id,
        date_arrivee,
        date_depart,
        prix_nuit: prixNuit,
        montant_paye: montant_paye ? Number(montant_paye) : 0,
        statut: 'checkin',
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: `Erreur : ${error.message}` }, { status: 400 });
    }

    // ── Update room status to occupied ──
    await supabase.from('chambres').update({ statut: 'occupee' }).eq('id', chambre_id);

    // ── Create invoice if payment > 0 ──
    if (montant_paye && Number(montant_paye) > 0) {
      const total = montant_total || (nombre_nuits || 1) * prixNuit;
      await supabase.from('factures').insert({
        hotel_id: hotelId,
        reservation_id: reservation.id,
        client_id,
        montant_ht: Math.round(total / 1.18),
        taux_tva: 18,
        statut_paiement: total <= Number(montant_paye) ? 'paye' : 'partiel',
        mode_paiement: mode_paiement || null,
      });
    }

    // ── Log activity ──
    try {
      await supabase.from('activites_log').insert({
        hotel_id: hotelId,
        user_id: user.id,
        action: 'checkin',
        details: {
          reservation_id: reservation.id,
          chambre_id,
          client_id,
          description: `Check-in effectué — Réservation ${reservation.id.slice(-6)}`,
        },
      });
    } catch {
      // Activity log is non-critical
    }

    return NextResponse.json({
      success: true,
      data: reservation,
      message: 'Check-in effectué avec succès.',
    });
  } catch (error) {
    console.error('[staff/checkin POST] Erreur:', error);
    return NextResponse.json({ success: false, error: 'Erreur interne du serveur.' }, { status: 500 });
  }
}
