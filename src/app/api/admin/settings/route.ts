// ============================================
// OGOUTEL_Prestige - API: Hotel Admin Settings
// Fichier : app/api/admin/settings/route.ts
//
// GET  /api/admin/settings  - Hotel settings + plan info
// PUT  /api/admin/settings  - Update hotel info
// PUT  /api/admin/settings  - Update password (body.currentPassword + body.newPassword)
//
// - Uses Supabase server client (respects RLS hotel_id)
// - Falls back to rich demo data if Supabase unconfigured
// ============================================

import { NextResponse } from 'next/server';
import { PLANS_ABONNEMENT } from '@/lib/constants';
import { verifyApiAuth } from '@/lib/auth-helpers';

// ─── Demo data ────────────────────────────────────────────────────────────

const DEMO_HOTEL = {
  id: 'hotel-demo',
  nom: 'Hôtel Le Palmier',
  adresse: 'Boulevard de France',
  ville: 'Abidjan',
  quartier: 'Cocody',
  telephone: '+2250708090909',
  email: 'contact@lepalmier.ci',
  logo_url: '/logo.svg',
  plan: 'standard',
  code_acces_id: null,
  admin_id: 'usr-admin',
  nombre_chambres: 12,
  est_actif: true,
  date_debut_abonnement: '2025-01-10T08:00:00Z',
  date_fin_abonnement: new Date(Date.now() + 18 * 86400000).toISOString(),
  description: 'Hôtel 3 étoiles situé dans le quartier résidentiel de Cocody, Abidjan. Offrant des chambres modernes, une piscine extérieure, un restaurant gastronomique et un service de concierge 24h/24. Idéal pour les voyages d\'affaires et les séjours touristiques.',
  nombre_etoiles: 3,
  created_at: '2025-01-10T08:00:00Z',
  updated_at: '2025-06-10T14:00:00Z',
};

function buildDemoSettings() {
  const plan = DEMO_HOTEL.plan as keyof typeof PLANS_ABONNEMENT;
  const planInfo = PLANS_ABONNEMENT[plan];
  const now = new Date();
  const fin = new Date(DEMO_HOTEL.date_fin_abonnement);
  const joursRestants = Math.max(0, Math.ceil((fin.getTime() - now.getTime()) / 86400000));

  return {
    hotel: DEMO_HOTEL,
    plan_info: planInfo,
    abonnement: {
      date_debut: DEMO_HOTEL.date_debut_abonnement,
      date_fin: DEMO_HOTEL.date_fin_abonnement,
      jours_restants: joursRestants,
      est_expirant: joursRestants <= 7,
    },
  };
}

// ─── GET Handler ─────────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    // Dynamic import
    const { createClient, createAdminClient } = await import('@/lib/supabase/server');
    const client = await createClient();

    if (!client) {
      return NextResponse.json({ success: true, data: buildDemoSettings() });
    }

    // ── Auth check ──
    const auth = await verifyApiAuth(request, ['admin_hotel', 'gerant']);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }
    const { user, profile } = auth;
    const hotelId = profile.hotel_id;

    const supabase = await createAdminClient();

    // ── Fetch hotel ──
    const { data: hotel, error } = await supabase
      .from('hotels')
      .select('*')
      .eq('id', hotelId)
      .single();

    if (error || !hotel) {
      return NextResponse.json(
        { success: false, error: 'Hôtel non trouvé.' },
        { status: 404 }
      );
    }

    // ── Compute plan info ──
    const plan = hotel.plan as keyof typeof PLANS_ABONNEMENT;
    const planInfo = PLANS_ABONNEMENT[plan];

    const now = new Date();
    const fin = new Date(hotel.date_fin_abonnement);
    const joursRestants = Math.max(0, Math.ceil((fin.getTime() - now.getTime()) / 86400000));

    const data = {
      hotel,
      plan_info: planInfo,
      abonnement: {
        date_debut: hotel.date_debut_abonnement,
        date_fin: hotel.date_fin_abonnement,
        jours_restants: joursRestants,
        est_expirant: joursRestants <= 7,
      },
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[admin/settings GET] Erreur:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}

// ─── PUT Handler ─────────────────────────────────────────────────────────

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { currentPassword, newPassword, ...hotelFields } = body;

    // Dynamic import
    const { createClient, createAdminClient } = await import('@/lib/supabase/server');
    const clientCheck = await createClient();

    if (!clientCheck) {
      // Demo mode — just return updated hotel mock
      if (currentPassword && newPassword) {
        return NextResponse.json({ success: true, message: 'Mot de passe mis à jour (démo).' });
      }
      const updatedHotel = { ...DEMO_HOTEL, ...hotelFields, updated_at: new Date().toISOString() };
      return NextResponse.json({ success: true, data: updatedHotel, message: 'Paramètres mis à jour (démo).' });
    }

    // ── Auth check ──
    const auth = await verifyApiAuth(request, ['admin_hotel', 'gerant']);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }
    const { user, profile } = auth;
    const hotelId = profile.hotel_id;

    // ── Password update ──
    if (currentPassword && newPassword) {
      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json(
          { success: false, error: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' },
          { status: 400 }
        );
      }

      // Need anon client for auth operations (password verify/update)
      const anonClient = await createClient();
      if (!anonClient) {
        return NextResponse.json({ success: false, error: 'Erreur de connexion.' }, { status: 500 });
      }

      // Verify current password by attempting sign in
      const { error: signInError } = await anonClient.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        return NextResponse.json(
          { success: false, error: 'Mot de passe actuel incorrect.' },
          { status: 401 }
        );
      }

      // Update password
      const { error: updateError } = await anonClient.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        return NextResponse.json(
          { success: false, error: `Erreur lors de la mise à jour : ${updateError.message}` },
          { status: 400 }
        );
      }

      return NextResponse.json({ success: true, message: 'Mot de passe mis à jour avec succès.' });
    }

    // ── Hotel info update ──
    const supabase = await createAdminClient();

    const updates: Record<string, unknown> = {};
    const allowedFields = ['nom', 'adresse', 'ville', 'quartier', 'telephone', 'email', 'description', 'nombre_etoiles'];

    for (const field of allowedFields) {
      if (hotelFields[field] !== undefined) {
        updates[field] = hotelFields[field];
      }
    }

    if (updates.nombre_etoiles !== undefined) {
      const stars = Number(updates.nombre_etoiles);
      if (isNaN(stars) || stars < 0 || stars > 5) {
        return NextResponse.json(
          { success: false, error: 'Le nombre d\'étoiles doit être entre 0 et 5.' },
          { status: 400 }
        );
      }
      updates.nombre_etoiles = stars;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Aucun champ à mettre à jour.' },
        { status: 400 }
      );
    }

    const { data: hotel, error } = await supabase
      .from('hotels')
      .update(updates)
      .eq('id', hotelId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: `Erreur lors de la mise à jour : ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: hotel, message: 'Paramètres mis à jour avec succès.' });
  } catch (error) {
    console.error('[admin/settings PUT] Erreur:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}
