// ============================================
// OGOUTEL_Prestige - API: Génération code d'activation
// Fichier : app/api/generate-activation-code/route.ts
//
// POST /api/generate-activation-code (PROTÉGÉE)
// - Vérifie que l'utilisateur est super_admin
// - Reçoit: subscription_request_id, plan_id
// - Génère un code unique format: OGT-XXXX-XXXX
// - Enregistre dans table codes_acces (expiration 30 jours)
// - Envoie email au client avec son code d'activation
// - Gère gracefully l'absence de Supabase / Resend
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { escapeHtml } from '@/lib/html-escape';

// ─── Types ──────────────────────────────────────────────────────────────────

interface GenerateCodeBody {
  subscription_request_id: string;
  plan_id: string;
  client_email?: string;
  client_nom?: string;
  nom_hotel?: string;
}

// ─── Constantes ─────────────────────────────────────────────────────────────

const PLAN_LABELS: Record<string, string> = {
  basique: 'Basique',
  standard: 'Standard',
  premium: 'Premium',
};

const PLAN_PRICES: Record<string, string> = {
  basique: '25 000 FCFA/mois',
  standard: '50 000 FCFA/mois',
  premium: '95 000 FCFA/mois',
};

const PLAN_COLORS: Record<string, string> = {
  basique: '#6B7280',
  standard: '#D4AF37',
  premium: '#7C3AED',
};

const ADMIN_EMAIL = 'omouitsi@gmail.com';
const WHATSAPP_NUMBER = '2250576103277';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ogoutel-prestige.com';
const CODE_EXPIRATION_DAYS = 30;

// ─── Code Generator ──────────────────────────────────────────────────────────

/**
 * Génère un code d'activation unique au format OGT-XXXX-XXXX
 * Utilise des caractères sans ambiguïté (pas de O/0, I/1/l)
 */
function generateActivationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segment = (): string =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `OGT-${segment()}-${segment()}`;
}

/**
 * Calcule la date d'expiration (30 jours à partir de maintenant)
 */
function getExpirationDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + CODE_EXPIRATION_DAYS);
  return d.toISOString();
}

/**
 * Formate une date ISO en français lisible
 */
function formatDateFr(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// ─── HTML Email Template (Client) ───────────────────────────────────────────

function buildClientActivationEmailHtml(
  code: string,
  clientNom: string,
  nomHotel: string,
  planId: string,
  expiresAt: string
): string {
  const planLabel = PLAN_LABELS[planId] ?? planId;
  const planPrice = PLAN_PRICES[planId] ?? '—';
  const planColor = PLAN_COLORS[planId] ?? '#D4AF37';
  const registerLink = `${APP_URL}/register?code=${code}`;
  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Bonjour OGOU, j'ai reçu mon code d'activation ${code} pour l'hôtel "${nomHotel}". J'ai besoin d'aide pour l'inscription.`
  )}`;

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Votre code d'activation OGOUTEL_Prestige</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F3F4F6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">

          <!-- ── Header Celebration ── -->
          <tr>
            <td style="background: linear-gradient(135deg, #D4AF37 0%, #1B4332 60%, #0A0A0A 100%); border-radius: 16px 16px 0 0; padding: 40px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 12px;">🎉</div>
              <h1 style="margin: 0; color: #FFFFFF; font-size: 24px; font-weight: 700;">
                Félicitations ${escapeHtml(clientNom.split(' ')[0])} !
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 15px;">
                Votre code d'activation OGOUTEL_Prestige est prêt
              </p>
            </td>
          </tr>

          <!-- ── Body ── -->
          <tr>
            <td style="background: #FFFFFF; border-left: 1px solid #E5E7EB; border-right: 1px solid #E5E7EB; padding: 40px;">

              <p style="margin: 0 0 24px; color: #374151; font-size: 15px; line-height: 1.7;">
                Bienvenue dans la famille <strong style="color: #1B4332;">OGOUTEL_Prestige</strong> !
                Votre hôtel <strong style="color: #0A0A0A;">${escapeHtml(nomHotel)}</strong> a été approuvé.
                Voici votre code d'activation pour créer votre compte :
              </p>

              <!-- ── Activation Code Box ── -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                <tr>
                  <td align="center">
                    <div style="background: linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%); border-radius: 16px; padding: 28px 40px; display: inline-block; border: 2px solid #D4AF37;">
                      <p style="margin: 0 0 8px; color: #D4AF37; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px;">
                        Votre code d'activation
                      </p>
                      <p style="margin: 0; color: #FFFFFF; font-size: 36px; font-weight: 800; font-family: 'Courier New', monospace; letter-spacing: 4px;">
                        ${code}
                      </p>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- ── Plan Info ── -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 12px 0; color: #6B7280; font-size: 13px; border-bottom: 1px solid #F9FAFB; width: 140px;">
                    📋 Plan choisi
                  </td>
                  <td style="padding: 12px 0; color: ${planColor}; font-size: 15px; font-weight: 700; border-bottom: 1px solid #F9FAFB;">
                    ${planLabel}
                    <span style="color: #9CA3AF; font-weight: 400; font-size: 12px; margin-left: 8px;">${planPrice}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #6B7280; font-size: 13px; border-bottom: 1px solid #F9FAFB;">
                    ⏰ Expire le
                  </td>
                  <td style="padding: 12px 0; color: #0A0A0A; font-size: 14px; font-weight: 600; border-bottom: 1px solid #F9FAFB;">
                    ${formatDateFr(expiresAt)}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #6B7280; font-size: 13px;">
                    🏨 Hôtel
                  </td>
                  <td style="padding: 12px 0; color: #0A0A0A; font-size: 14px; font-weight: 600;">
                    ${escapeHtml(nomHotel)}
                  </td>
                </tr>
              </table>

              <!-- ── Instructions ── -->
              <div style="background: #F9FAFB; border-radius: 12px; padding: 24px; margin-bottom: 28px; border: 1px solid #F3F4F6;">
                <p style="margin: 0 0 16px; color: #0A0A0A; font-size: 14px; font-weight: 700;">
                  📝 Comment activer votre compte :
                </p>
                <ol style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px; line-height: 2;">
                  <li>Cliquez sur le bouton <strong>"Créer mon compte"</strong> ci-dessous</li>
                  <li>Remplissez le formulaire d'inscription</li>
                  <li>Entrez votre code d'activation : <strong style="font-family: monospace; color: #D4AF37;">${code}</strong></li>
                  <li>Commencez à gérer votre hôtel ! 🚀</li>
                </ol>
              </div>

              <!-- ── CTA Button ── -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${registerLink}" target="_blank" rel="noopener noreferrer"
                       style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #D4AF37, #B8972E); color: #0A0A0A; text-decoration: none; border-radius: 12px; font-size: 16px; font-weight: 700; box-shadow: 0 4px 14px rgba(212,175,55,0.3);">
                      🚀 Créer mon compte maintenant
                    </a>
                  </td>
                </tr>
              </table>

              <!-- ── Support ── -->
              <div style="text-align: center; padding-top: 16px; border-top: 1px solid #F3F4F6;">
                <p style="margin: 0 0 12px; color: #6B7280; font-size: 13px;">
                  Besoin d'aide ? Contactez notre support :
                </p>
                <a href="${whatsappLink}" target="_blank" rel="noopener noreferrer"
                   style="display: inline-block; padding: 10px 24px; background: #25D366; color: #FFFFFF; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600;">
                  💬 Écrire sur WhatsApp
                </a>
                <p style="margin: 12px 0 0; color: #9CA3AF; font-size: 12px;">
                  ou appelez : +225 0576103277
                </p>
              </div>

            </td>
          </tr>

          <!-- ── Footer ── -->
          <tr>
            <td style="background: #0A0A0A; border-radius: 0 0 16px 16px; padding: 24px 40px; text-align: center;">
              <p style="margin: 0 0 4px; color: #D4AF37; font-size: 14px; font-weight: 700;">
                OGOUTEL<span style="color: #FFFFFF;">_Prestige</span>
              </p>
              <p style="margin: 0; color: #6B7280; font-size: 12px;">
                La Gestion Hôtelière Intelligente — Côte d'Ivoire 🇨🇮
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Route Handler ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // ── 0. Vérifier Supabase est configuré ──
    const hasSupabase = !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    if (!hasSupabase) {
      return NextResponse.json(
        { success: false, error: 'Supabase n\'est pas configuré. Impossible de générer un code d\'activation.' },
        { status: 503 }
      );
    }

    // ── 1. Vérifier l'authentification super_admin ──
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Erreur de connexion à Supabase.' },
        { status: 500 }
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié. Connectez-vous en tant que super administrateur.' },
        { status: 401 }
      );
    }

    // Vérifier le rôle super_admin
    const role = (user.app_metadata?.role as string) ?? (user.user_metadata?.role as string) ?? null;
    if (role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Accès refusé. Cette action est réservée au super administrateur.' },
        { status: 403 }
      );
    }

    // ── 2. Parser le body ──
    const body: GenerateCodeBody = await request.json();
    const { subscription_request_id, plan_id, client_email, client_nom, nom_hotel } = body;

    if (!subscription_request_id || !plan_id) {
      return NextResponse.json(
        { success: false, error: 'subscription_request_id et plan_id sont obligatoires.' },
        { status: 400 }
      );
    }

    if (!['basique', 'standard', 'premium'].includes(plan_id)) {
      return NextResponse.json(
        { success: false, error: 'Plan invalide. Choisissez : basique, standard ou premium.' },
        { status: 400 }
      );
    }

    // ── 3. Récupérer les infos de la demande si client_email/nom pas fournis ──
    let finalEmail = client_email || '';
    let finalNom = client_nom || '';
    let finalHotel = nom_hotel || '';

    if (!finalEmail || !finalNom || !finalHotel) {
      try {
        const { createAdminClient } = await import('@/lib/supabase/server');
        const adminSupabase = await createAdminClient();
        if (adminSupabase) {
          const { data: demande, error } = await adminSupabase
            .from('abonnement_demandes')
            .select('nom_complet, email, nom_hotel')
            .eq('id', subscription_request_id)
            .single();

          if (!error && demande) {
            finalEmail = finalEmail || demande.email;
            finalNom = finalNom || demande.nom_complet;
            finalHotel = finalHotel || demande.nom_hotel;
          }
        }
      } catch (fetchErr) {
        console.error('[generate-activation-code] Erreur fetch demande:', fetchErr);
      }
    }

    // ── 4. Générer le code d'activation ──
    const code = generateActivationCode();
    const expiresAt = getExpirationDate();

    // ── 5. Insérer dans codes_acces ──
    const { createAdminClient } = await import('@/lib/supabase/server');
    const adminSupabase = await createAdminClient();

    if (adminSupabase) {
      const { error: insertError } = await adminSupabase.from('codes_acces').insert({
        code,
        plan_choisi: plan_id,
        utilise_par: null,
        date_expiration: expiresAt,
        actif: true,
        subscription_request_id,
      });

      if (insertError) {
        console.error('[generate-activation-code] Erreur insertion code:', insertError);
        return NextResponse.json(
          { success: false, error: 'Erreur lors de l\'enregistrement du code. Vérifiez que le code n\'existe pas déjà.' },
          { status: 500 }
        );
      }

      // Mettre à jour le statut de la demande
      await adminSupabase
        .from('abonnement_demandes')
        .update({ statut: 'paye', notes_admin: `Code d'activation généré: ${code}` })
        .eq('id', subscription_request_id);
    }

    // ── 6. Envoyer l'email au client ──
    if (finalEmail) {
      const hasResend = !!process.env.RESEND_API_KEY;

      if (hasResend) {
        try {
          const { Resend } = await import('resend');
          const resend = new Resend(process.env.RESEND_API_KEY);

          await resend.emails.send({
            from: 'OGOUTEL_Prestige <onboarding@resend.dev>',
            to: finalEmail,
            subject: `🎉 Votre code d'activation OGOUTEL_Prestige — ${finalHotel}`,
            html: buildClientActivationEmailHtml(code, finalNom, finalHotel, plan_id, expiresAt),
          });

          console.log(`[generate-activation-code] Email envoyé à ${finalEmail}`);
        } catch (emailErr) {
          console.error('[generate-activation-code] Erreur envoi email client:', emailErr);
        }
      } else {
        console.log('[generate-activation-code] Resend non configuré — skip email client');
      }
    }

    // ── 7. Retourner le résultat ──
    return NextResponse.json({
      success: true,
      message: 'Code d\'activation généré avec succès !',
      data: {
        code,
        plan_id,
        plan_label: PLAN_LABELS[plan_id] ?? plan_id,
        expires_at: expiresAt,
        client_email: finalEmail,
        client_nom: finalNom,
        nom_hotel: finalHotel,
      },
    });
  } catch (error) {
    console.error('[generate-activation-code] Erreur:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur. Veuillez réessayer.' },
      { status: 500 }
    );
  }
}
