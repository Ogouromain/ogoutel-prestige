// ============================================
// OGOUTEL_Prestige - API: Inscription utilisateur
// Fichier : app/api/register-user/route.ts
//
// POST /api/register-user (PUBLIC)
// 1. Valide le code d'activation côté serveur
// 2. Crée l'utilisateur Supabase Auth
// 3. Crée l'hôtel dans table 'hotels'
// 4. Met à jour le profil (role='admin_hotel', hotel_id)
// 5. Marque le code comme utilisé
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp, RATE_LIMIT_REGISTER } from '@/lib/rate-limit';
import env from '@/lib/env';

// ─── Types ──────────────────────────────────────────────────────────────────

interface RegisterBody {
  code: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  password: string;
  nom_hotel: string;
}

interface RegisterResponse {
  success: boolean;
  message?: string;
  user_id?: string;
  hotel_id?: string;
  error?: string;
}

// ─── Constantes ─────────────────────────────────────────────────────────────

const PLAN_LABELS: Record<string, string> = {
  basique: 'Basique',
  standard: 'Standard',
  premium: 'Premium',
};

// ─── Route Handler ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // ── Rate Limiting ──
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(clientIp, RATE_LIMIT_REGISTER);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Trop de requêtes. Veuillez réessayer dans quelques minutes.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000)),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    // ── 0. Vérifier Supabase ──
    const hasSupabase = !!(
      env.SUPABASE_URL &&
      env.SUPABASE_ANON_KEY
    );

    if (!hasSupabase) {
      return NextResponse.json<RegisterResponse>({
        success: false,
        error: 'Service d\'inscription temporairement indisponible. Veuillez réessayer plus tard.',
      }, { status: 503 });
    }

    // ── 1. Parser et valider le body ──
    const body: RegisterBody = await request.json();
    const { code, prenom, nom, email, telephone, password, nom_hotel } = body;

    // Validations de base
    const errors: string[] = [];

    if (!code || typeof code !== 'string') errors.push('Le code d\'activation est requis.');
    if (!prenom || prenom.trim().length < 2) errors.push('Le prénom doit contenir au moins 2 caractères.');
    if (!nom || nom.trim().length < 2) errors.push('Le nom doit contenir au moins 2 caractères.');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Adresse email invalide.');
    if (!telephone || telephone.trim().length < 8) errors.push('Le numéro de téléphone est invalide.');
    if (!password || password.length < 8) {
      errors.push('Le mot de passe doit contenir au moins 8 caractères.');
    } else {
      // Validation renforcée du mot de passe
      if (!/[A-Z]/.test(password)) errors.push('Le mot de passe doit contenir au moins une majuscule.');
      if (!/[a-z]/.test(password)) errors.push('Le mot de passe doit contenir au moins une minuscule.');
      if (!/[0-9]/.test(password)) errors.push('Le mot de passe doit contenir au moins un chiffre.');
      if (!/[^A-Za-z0-9]/.test(password)) errors.push('Le mot de passe doit contenir au moins un caractère spécial.');
    }
    if (!nom_hotel || nom_hotel.trim().length < 2) errors.push('Le nom de l\'hôtel est requis.');

    if (errors.length > 0) {
      return NextResponse.json<RegisterResponse>({
        success: false,
        error: errors.join(' '),
      }, { status: 400 });
    }

    // Normaliser le code
    const normalizedCode = code.trim().toUpperCase();

    // ── 2. Import Supabase clients ──
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json<RegisterResponse>({
        success: false,
        error: 'Erreur de connexion au service. Veuillez réessayer.',
      }, { status: 500 });
    }

    // ── 3. Valider le code d'activation (côté serveur) ──
    const { data: codeData, error: codeError } = await supabase
      .from('codes_acces')
      .select('id, code, plan, date_expiration, est_utilise, utilise_par, demande_id')
      .eq('code', normalizedCode)
      .maybeSingle();

    if (codeError || !codeData) {
      return NextResponse.json<RegisterResponse>({
        success: false,
        error: 'Code d\'activation introuvable. Vérifiez votre code et réessayez.',
      }, { status: 404 });
    }

    if (codeData.est_utilise) {
      return NextResponse.json<RegisterResponse>({
        success: false,
        error: 'Ce code d\'activation a déjà été utilisé. Chaque code ne peut être utilisé qu\'une seule fois.',
      }, { status: 400 });
    }

    if (codeData.date_expiration && new Date(codeData.date_expiration) < new Date()) {
      return NextResponse.json<RegisterResponse>({
        success: false,
        error: 'Ce code d\'activation a expiré. Contactez le support pour obtenir un nouveau code.',
      }, { status: 400 });
    }

    // ── 4. Créer l'utilisateur Supabase Auth ──
    // Utilise le admin client pour contourner les RLS
    const { createAdminClient } = await import('@/lib/supabase/server');
    const adminClient = await createAdminClient();

    if (!adminClient) {
      // Fallback: essayer avec le client normal (signUp côté client)
      return NextResponse.json<RegisterResponse>({
        success: false,
        error: 'Service d\'authentification non configuré correctement. Contactez le support.',
      }, { status: 500 });
    }

    const fullName = `${prenom.trim()} ${nom.trim()}`.trim();

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        phone: telephone.trim(),
        role: 'admin_hotel',
        activation_code: normalizedCode,
      },
    });

    if (authError) {
      console.error('[register-user] Erreur création auth user:', authError);

      // Gérer les erreurs spécifiques
      if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
        return NextResponse.json<RegisterResponse>({
          success: false,
          error: 'Un compte avec cette adresse email existe déjà. Si c\'est votre compte, connectez-vous.',
        }, { status: 409 });
      }

      return NextResponse.json<RegisterResponse>({
        success: false,
        error: 'Erreur lors de la création du compte. Veuillez réessayer.',
      }, { status: 500 });
    }

    const userId = authData.user.id;

    // ── 5. Créer l'hôtel ──
    const { data: hotelData, error: hotelError } = await adminClient
      .from('hotels')
      .insert({
        nom: nom_hotel.trim(),
        email: email.trim().toLowerCase(),
        telephone: telephone.trim(),
        plan: codeData.plan,
        code_acces_id: codeData.id,
        admin_id: userId,
        est_actif: true,
        date_debut_abonnement: new Date().toISOString(),
        date_fin_abonnement: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select('id')
      .single();

    if (hotelError) {
      console.error('[register-user] Erreur création hôtel:', hotelError);
      // Nettoyer: supprimer l'utilisateur auth créé
      await adminClient.auth.admin.deleteUser(userId);
      return NextResponse.json<RegisterResponse>({
        success: false,
        error: 'Erreur lors de la création de l\'hôtel. Veuillez réessayer.',
      }, { status: 500 });
    }

    const hotelId = hotelData.id;

    // ── 6. Créer ou mettre à jour le profil ──
    // Note: admin.createUser ne déclenche pas toujours le trigger de création du profil.
    // On utilise un pattern upsert (update → insert si 0 lignes affectées).
    const { count: profileCount, error: profileCountError } = await adminClient
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('id', userId);

    if (profileCountError) {
      console.error('[register-user] Erreur vérification profil:', profileCountError);
    }

    if (!profileCountError && (profileCount ?? 0) > 0) {
      // Profil existe → mettre à jour
      const { error: profileUpdateError } = await adminClient
        .from('profiles')
        .update({
          full_name: fullName,
          phone: telephone.trim(),
          role: 'admin_hotel',
          hotel_id: hotelId,
          is_active: true,
        })
        .eq('id', userId);

      if (profileUpdateError) {
        console.error('[register-user] Erreur mise à jour profil:', profileUpdateError);
      }
    } else {
      // Profil n'existe pas → créer
      const { error: profileInsertError } = await adminClient
        .from('profiles')
        .insert({
          id: userId,
          full_name: fullName,
          phone: telephone.trim(),
          email: email.trim().toLowerCase(),
          role: 'admin_hotel',
          hotel_id: hotelId,
          is_active: true,
        });

      if (profileInsertError) {
        console.error('[register-user] Erreur création profil:', profileInsertError);
      }
    }

    // ── 7. Marquer le code comme utilisé ──
    const { error: codeUpdateError } = await adminClient
      .from('codes_acces')
      .update({
        est_utilise: true,
        utilise_par: userId,
        used_at: new Date().toISOString(),
      })
      .eq('id', codeData.id);

    if (codeUpdateError) {
      console.error('[register-user] Erreur marquage code:', codeUpdateError);
      // Non critique, on continue
    }

    // ── 8. Mettre à jour la demande d'abonnement (si liée) ──
    if (codeData.demande_id) {
      await adminClient
        .from('abonnement_demandes')
        .update({ statut: 'active' })
        .eq('id', codeData.demande_id);
    }

    const planName = PLAN_LABELS[codeData.plan] ?? codeData.plan;

    return NextResponse.json<RegisterResponse>({
      success: true,
      message: `Bienvenue ${fullName} ! Votre compte et l'hôtel "${nom_hotel}" ont été créés avec succès.`,
      user_id: userId,
      hotel_id: hotelId,
    });
  } catch (error) {
    console.error('[register-user] Erreur:', error);
    return NextResponse.json<RegisterResponse>({
      success: false,
      error: 'Erreur interne du serveur. Veuillez réessayer.',
    }, { status: 500 });
  }
}
