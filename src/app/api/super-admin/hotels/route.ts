// ============================================
// OGOUTEL_Prestige - API: Super Admin Hotels Management
// Fichier : app/api/super-admin/hotels/route.ts
//
// GET  /api/super-admin/hotels — Paginated hotel list with admin info
// PUT  /api/super-admin/hotels — Update hotel (toggle est_actif, change plan)
// - Uses Supabase admin client (bypasses RLS)
// - Falls back to demo data if Supabase unconfigured
// ============================================

import { NextRequest, NextResponse } from 'next/server';

// ─── Demo data ────────────────────────────────────────────────────────────────

const DEMO_HOTELS = [
  {
    id: 'demo-h1',
    nom: 'Hôtel Le Palmier',
    adresse: '01 Rue du Commerce, Cocody',
    ville: 'Abidjan',
    quartier: 'Cocody',
    telephone: '+2250708090909',
    email: 'contact@lepalmier.ci',
    logo_url: null,
    plan: 'standard',
    nombre_chambres: 15,
    est_actif: true,
    nombre_etoiles: 3,
    date_debut_abonnement: new Date(Date.now() - 86400000 * 60).toISOString(),
    date_fin_abonnement: new Date(Date.now() + 86400000 * 15).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 60).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    admin: { id: 'admin-1', full_name: 'Koné Ibrahim', email: 'ibrahim.kone@email.com', phone: '+2250711223344' },
    chambres_count: 15,
    personnel_count: 4,
  },
  {
    id: 'demo-h2',
    nom: 'Hôtel Émeraude',
    adresse: '25 Blvd de France, Plateau',
    ville: 'Abidjan',
    quartier: 'Plateau',
    telephone: '+2250712345678',
    email: 'info@emeraude-hotel.ci',
    logo_url: null,
    plan: 'premium',
    nombre_chambres: 42,
    est_actif: true,
    nombre_etoiles: 4,
    date_debut_abonnement: new Date(Date.now() - 86400000 * 45).toISOString(),
    date_fin_abonnement: new Date(Date.now() + 86400000 * 30).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 45).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    admin: { id: 'admin-2', full_name: 'Diallo Aïcha', email: 'aicha.diallo@email.com', phone: '+2250755667788' },
    chambres_count: 42,
    personnel_count: 12,
  },
  {
    id: 'demo-h3',
    nom: 'Résidence La Paix',
    adresse: '10 Av. de la Liberté',
    ville: 'Korhogo',
    quartier: 'Centre-Ville',
    telephone: '+2250765432109',
    email: 'lapaix.residence@email.com',
    logo_url: null,
    plan: 'basique',
    nombre_chambres: 8,
    est_actif: true,
    nombre_etoiles: 2,
    date_debut_abonnement: new Date(Date.now() - 86400000 * 30).toISOString(),
    date_fin_abonnement: new Date(Date.now() + 86400000 * 5).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 6).toISOString(),
    admin: { id: 'admin-3', full_name: 'Bamba Moussa', email: 'moussa.bamba@email.com', phone: '+2250799001122' },
    chambres_count: 8,
    personnel_count: 2,
  },
  {
    id: 'demo-h4',
    nom: 'Hôtel Le Phénix',
    adresse: '5 Rue des Savanes',
    ville: 'Man',
    quartier: 'Quartier France',
    telephone: '+2250798765432',
    email: 'phoenix.hotel@email.com',
    logo_url: null,
    plan: 'standard',
    nombre_chambres: 22,
    est_actif: true,
    nombre_etoiles: 3,
    date_debut_abonnement: new Date(Date.now() - 86400000 * 20).toISOString(),
    date_fin_abonnement: new Date(Date.now() + 86400000 * 20).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 8).toISOString(),
    admin: { id: 'admin-4', full_name: 'Touré Fatoumata', email: 'fatou.toure@email.com', phone: '+2250733445566' },
    chambres_count: 22,
    personnel_count: 6,
  },
  {
    id: 'demo-h5',
    nom: 'Auberge du Soleil',
    adresse: '03 Rue du Marché',
    ville: 'Gagnoa',
    quartier: 'Marché Central',
    telephone: '+2250723456789',
    email: 'soleil.auberge@email.com',
    logo_url: null,
    plan: 'basique',
    nombre_chambres: 10,
    est_actif: false,
    nombre_etoiles: 1,
    date_debut_abonnement: new Date(Date.now() - 86400000 * 90).toISOString(),
    date_fin_abonnement: new Date(Date.now() - 86400000 * 10).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 90).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    admin: { id: 'admin-5', full_name: 'Yao Serge', email: 'serge.yao@email.com', phone: '+2250777889900' },
    chambres_count: 10,
    personnel_count: 2,
  },
  {
    id: 'demo-h6',
    nom: 'Hôtel Le Baobab',
    adresse: '18 Blvd Vridi',
    ville: 'San-Pédro',
    quartier: 'Vridi',
    telephone: '+2250744556677',
    email: 'baobab.hotel@email.com',
    logo_url: null,
    plan: 'standard',
    nombre_chambres: 18,
    est_actif: true,
    nombre_etoiles: 3,
    date_debut_abonnement: new Date(Date.now() - 86400000 * 15).toISOString(),
    date_fin_abonnement: new Date(Date.now() + 86400000 * 25).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    admin: { id: 'admin-6', full_name: 'Ouattara Dramane', email: 'dramane.ouattara@email.com', phone: '+2250788990011' },
    chambres_count: 18,
    personnel_count: 5,
  },
];

// ─── GET Handler ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '10', 10)));
    const search = searchParams.get('search') ?? '';
    const statut = searchParams.get('statut') ?? '';
    const plan = searchParams.get('plan') ?? '';

    // Dynamic import — handles missing env vars gracefully
    const { createAdminClient } = await import('@/lib/supabase/server');
    const supabase = await createAdminClient();

    if (!supabase) {
      // Return demo data when Supabase is not configured
      let filtered = [...DEMO_HOTELS];

      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(
          (h) =>
            h.nom.toLowerCase().includes(s) ||
            h.ville.toLowerCase().includes(s)
        );
      }
      if (statut === 'actif') filtered = filtered.filter((h) => h.est_actif);
      if (statut === 'inactif') filtered = filtered.filter((h) => !h.est_actif);
      if (plan) filtered = filtered.filter((h) => h.plan === plan);

      const total = filtered.length;
      const totalPages = Math.ceil(total / limit);
      const start = (page - 1) * limit;
      const hotels = filtered.slice(start, start + limit);

      return NextResponse.json({
        success: true,
        data: { hotels, total, page, totalPages },
      });
    }

    // Build query
    let query = supabase
      .from('hotels')
      .select('*, profiles!hotels_admin_id_fkey(id, full_name, email, phone)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    // Apply filters
    if (search) {
      query = query.or(`nom.ilike.%${search}%,ville.ilike.%${search}%`);
    }
    if (statut === 'actif') {
      query = query.eq('est_actif', true);
    } else if (statut === 'inactif') {
      query = query.eq('est_actif', false);
    }
    if (plan && ['basique', 'standard', 'premium'].includes(plan)) {
      query = query.eq('plan', plan);
    }

    const { data, count } = await query;

    // For each hotel, count chambres and personnel
    const hotels = await Promise.all(
      (data ?? []).map(async (hotel) => {
        const [chambresRes, personnelRes] = await Promise.all([
          supabase.from('chambres').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id),
          supabase.from('personnel_hotel').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id),
        ]);

        return {
          ...hotel,
          chambres_count: chambresRes.count ?? 0,
          personnel_count: personnelRes.count ?? 0,
        };
      })
    );

    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: { hotels, total, page, totalPages },
    });
  } catch (error) {
    console.error('[super-admin/hotels GET] Erreur:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}

// ─── PUT Handler ─────────────────────────────────────────────────────────────

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { hotelId, est_actif, plan } = body;

    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId est obligatoire.' },
        { status: 400 }
      );
    }

    if (est_actif === undefined && !plan) {
      return NextResponse.json(
        { success: false, error: 'Au moins un champ à modifier est requis (est_actif ou plan).' },
        { status: 400 }
      );
    }

    if (plan && !['basique', 'standard', 'premium'].includes(plan)) {
      return NextResponse.json(
        { success: false, error: 'Plan invalide. Choisissez : basique, standard ou premium.' },
        { status: 400 }
      );
    }

    // Dynamic import — handles missing env vars gracefully
    const { createAdminClient } = await import('@/lib/supabase/server');
    const supabase = await createAdminClient();

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Supabase n\'est pas configuré.' },
        { status: 503 }
      );
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (est_actif !== undefined) updateData.est_actif = est_actif;
    if (plan) updateData.plan = plan;

    const { error } = await supabase
      .from('hotels')
      .update(updateData)
      .eq('id', hotelId);

    if (error) {
      console.error('[super-admin/hotels PUT] Erreur update:', error);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la mise à jour de l\'hôtel.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Hôtel mis à jour avec succès.',
    });
  } catch (error) {
    console.error('[super-admin/hotels PUT] Erreur:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}
