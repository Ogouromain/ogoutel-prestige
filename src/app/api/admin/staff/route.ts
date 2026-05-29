// ============================================
// OGOUTEL_Prestige - API: Hotel Admin Staff
// Fichier : app/api/admin/staff/route.ts
//
// GET    /api/admin/staff  - Staff list with plan limits
// POST   /api/admin/staff  - Add staff member
// PUT    /api/admin/staff  - Update staff
// DELETE /api/admin/staff  - Deactivate staff
//
// - Uses Supabase server client (respects RLS hotel_id)
// - Falls back to rich demo data if Supabase unconfigured
// ============================================

import { NextResponse } from 'next/server';
import { PLANS_ABONNEMENT } from '@/lib/constants';

// ─── Demo data ────────────────────────────────────────────────────────────

const DEMO_PERSONNEL = [
  {
    id: 'per-01',
    hotel_id: 'hotel-demo',
    user_id: 'usr-gerant-01',
    role: 'gerant',
    nom_complet: 'Koné Alassane',
    telephone: '+2250701122334',
    email: 'alassane.kone@lepalmier.ci',
    est_actif: true,
    created_by: 'usr-admin',
    created_at: '2025-01-10T08:00:00Z',
    updated_at: '2025-01-10T08:00:00Z',
    user: {
      id: 'usr-gerant-01',
      email: 'alassane.kone@lepalmier.ci',
      avatar_url: null,
    },
  },
  {
    id: 'per-02',
    hotel_id: 'hotel-demo',
    user_id: 'usr-recep-01',
    role: 'receptionniste',
    nom_complet: 'Diallo Aminata',
    telephone: '+2250755667788',
    email: 'aminata.diallo@lepalmier.ci',
    est_actif: true,
    created_by: 'usr-admin',
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-06-05T14:00:00Z',
    user: {
      id: 'usr-recep-01',
      email: 'aminata.diallo@lepalmier.ci',
      avatar_url: null,
    },
  },
  {
    id: 'per-03',
    hotel_id: 'hotel-demo',
    user_id: 'usr-recep-02',
    role: 'receptionniste',
    nom_complet: 'Bamba Fanta',
    telephone: '+2250799001122',
    email: 'fanta.bamba@lepalmier.ci',
    est_actif: true,
    created_by: 'usr-admin',
    created_at: '2025-02-01T09:00:00Z',
    updated_at: '2025-02-01T09:00:00Z',
    user: {
      id: 'usr-recep-02',
      email: 'fanta.bamba@lepalmier.ci',
      avatar_url: null,
    },
  },
  {
    id: 'per-04',
    hotel_id: 'hotel-demo',
    user_id: null,
    role: 'receptionniste',
    nom_complet: 'Traoré Adama',
    telephone: '+2250744556677',
    email: null,
    est_actif: false,
    created_by: 'usr-admin',
    created_at: '2025-03-01T08:00:00Z',
    updated_at: '2025-05-20T16:00:00Z',
    user: null,
  },
];

const DEMO_PLAN_LIMITES = {
  gerants: { actuel: 1, max: 1 },
  receptionnistes: { actuel: 3, max: 3 },
};

// ─── GET Handler ─────────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const role = searchParams.get('role') || undefined;
    const statut = searchParams.get('statut') || undefined;

    // Dynamic import
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    if (!supabase) {
      let filtered = [...DEMO_PERSONNEL];
      if (role) filtered = filtered.filter(p => p.role === role);
      if (statut === 'actif') filtered = filtered.filter(p => p.est_actif);
      if (statut === 'inactif') filtered = filtered.filter(p => !p.est_actif);

      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const start = (page - 1) * limit;
      const paged = filtered.slice(start, start + limit);

      return NextResponse.json({
        success: true,
        data: { personnel: paged, total, page, totalPages, limites: DEMO_PLAN_LIMITES },
      });
    }

    // ── Auth check ──
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Non authentifié.' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('hotel_id')
      .eq('id', user.id)
      .single();

    if (!profile?.hotel_id) {
      return NextResponse.json({ success: false, error: 'Aucun hôtel associé.' }, { status: 403 });
    }

    // ── Build query ──
    let query = supabase
      .from('personnel_hotel')
      .select('*, user:profiles!user_id(id, email, avatar_url)', { count: 'exact' })
      .eq('hotel_id', profile.hotel_id)
      .order('created_at', { ascending: false });

    if (role) query = query.eq('role', role);
    if (statut === 'actif') query = query.eq('est_actif', true);
    if (statut === 'inactif') query = query.eq('est_actif', false);

    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);

    const { data: personnel, count } = await query;

    // ── Get plan limits ──
    const { data: hotel } = await supabase
      .from('hotels')
      .select('plan')
      .eq('id', profile.hotel_id)
      .single();

    const planInfo = hotel
      ? PLANS_ABONNEMENT[hotel.plan as keyof typeof PLANS_ABONNEMENT]
      : PLANS_ABONNEMENT.standard;

    // Count current staff by role
    const { data: allPersonnel } = await supabase
      .from('personnel_hotel')
      .select('role, est_actif')
      .eq('hotel_id', profile.hotel_id);

    const gerantsActifs = (allPersonnel ?? []).filter(p => p.role === 'gerant' && p.est_actif).length;
    const recepActifs = (allPersonnel ?? []).filter(p => p.role === 'receptionniste' && p.est_actif).length;

    const limites = {
      gerants: { actuel: gerantsActifs, max: planInfo.limites.gerants },
      receptionnistes: { actuel: recepActifs, max: planInfo.limites.receptionnistes },
    };

    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json({
      success: true,
      data: { personnel: personnel ?? [], total, page, totalPages, limites },
    });
  } catch (error) {
    console.error('[admin/staff GET] Erreur:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}

// ─── POST Handler ────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nom_complet, email, telephone, role } = body;

    if (!nom_complet || !role) {
      return NextResponse.json(
        { success: false, error: 'Champs requis : nom_complet, role.' },
        { status: 400 }
      );
    }

    if (!['gerant', 'receptionniste'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Rôle invalide. Valeurs : gerant, receptionniste.' },
        { status: 400 }
      );
    }

    // Dynamic import
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    if (!supabase) {
      const newPersonnel = {
        id: `per-new-${Date.now()}`,
        hotel_id: 'hotel-demo',
        user_id: email ? `usr-new-${Date.now()}` : null,
        role,
        nom_complet,
        telephone: telephone ?? null,
        email: email ?? null,
        est_actif: true,
        created_by: 'usr-admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user: email ? { id: `usr-new-${Date.now()}`, email, avatar_url: null } : null,
      };
      return NextResponse.json({ success: true, data: newPersonnel, message: 'Personnel ajouté (démo).' });
    }

    // ── Auth check ──
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Non authentifié.' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('hotel_id')
      .eq('id', user.id)
      .single();

    if (!profile?.hotel_id) {
      return NextResponse.json({ success: false, error: 'Aucun hôtel associé.' }, { status: 403 });
    }

    // ── Check plan limits ──
    const { data: hotel } = await supabase
      .from('hotels')
      .select('plan')
      .eq('id', profile.hotel_id)
      .single();

    const planInfo = hotel
      ? PLANS_ABONNEMENT[hotel.plan as keyof typeof PLANS_ABONNEMENT]
      : PLANS_ABONNEMENT.standard;

    const { data: currentStaff } = await supabase
      .from('personnel_hotel')
      .select('role, est_actif')
      .eq('hotel_id', profile.hotel_id);

    const activeByRole = (currentStaff ?? []).filter(p => p.est_actif).reduce(
      (acc, p) => {
        acc[p.role] = (acc[p.role] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const currentCount = activeByRole[role] || 0;
    const maxCount = role === 'gerant' ? planInfo.limites.gerants : planInfo.limites.receptionnistes;

    if (currentCount >= maxCount) {
      return NextResponse.json(
        { success: false, error: `Limite du plan ${planInfo.nom} atteinte pour le rôle ${role} (${maxCount} maximum).` },
        { status: 400 }
      );
    }

    // ── Insert ──
    const { data: personnel, error } = await supabase
      .from('personnel_hotel')
      .insert({
        hotel_id: profile.hotel_id,
        role,
        nom_complet,
        telephone: telephone ?? null,
        email: email ?? null,
        est_actif: true,
        created_by: user.id,
      })
      .select('*, user:profiles!user_id(id, email, avatar_url)')
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: `Erreur lors de l'ajout : ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: personnel, message: 'Personnel ajouté avec succès.' });
  } catch (error) {
    console.error('[admin/staff POST] Erreur:', error);
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
    const { personnelId, est_actif, role, nom_complet, telephone, email } = body;

    if (!personnelId) {
      return NextResponse.json(
        { success: false, error: 'personnelId requis.' },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};
    if (est_actif !== undefined) updates.est_actif = est_actif;
    if (role) updates.role = role;
    if (nom_complet) updates.nom_complet = nom_complet;
    if (telephone !== undefined) updates.telephone = telephone;
    if (email !== undefined) updates.email = email;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Aucun champ à mettre à jour.' },
        { status: 400 }
      );
    }

    if (role && !['gerant', 'receptionniste'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Rôle invalide. Valeurs : gerant, receptionniste.' },
        { status: 400 }
      );
    }

    // Dynamic import
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    if (!supabase) {
      const per = DEMO_PERSONNEL.find(p => p.id === personnelId);
      if (!per) {
        return NextResponse.json({ success: false, error: 'Personnel non trouvé (démo).' }, { status: 404 });
      }
      const updated = { ...per, ...updates, updated_at: new Date().toISOString() };
      return NextResponse.json({ success: true, data: updated, message: 'Personnel mis à jour (démo).' });
    }

    // ── Auth check ──
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Non authentifié.' }, { status: 401 });
    }

    // ── Update ──
    const { data: personnel, error } = await supabase
      .from('personnel_hotel')
      .update(updates)
      .eq('id', personnelId)
      .select('*, user:profiles!user_id(id, email, avatar_url)')
      .single();

    if (error || !personnel) {
      return NextResponse.json(
        { success: false, error: error?.message ?? 'Personnel non trouvé.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: personnel, message: 'Personnel mis à jour avec succès.' });
  } catch (error) {
    console.error('[admin/staff PUT] Erreur:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}

// ─── DELETE Handler (Deactivate) ─────────────────────────────────────────

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { personnelId } = body;

    if (!personnelId) {
      return NextResponse.json(
        { success: false, error: 'personnelId requis.' },
        { status: 400 }
      );
    }

    // Dynamic import
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    if (!supabase) {
      const per = DEMO_PERSONNEL.find(p => p.id === personnelId);
      if (!per) {
        return NextResponse.json({ success: false, error: 'Personnel non trouvé (démo).' }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: 'Personnel désactivé (démo).' });
    }

    // ── Auth check ──
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Non authentifié.' }, { status: 401 });
    }

    // ── Deactivate (not hard delete) ──
    const { error } = await supabase
      .from('personnel_hotel')
      .update({ est_actif: false })
      .eq('id', personnelId);

    if (error) {
      return NextResponse.json(
        { success: false, error: `Erreur lors de la désactivation : ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: 'Personnel désactivé avec succès.' });
  } catch (error) {
    console.error('[admin/staff DELETE] Erreur:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}
