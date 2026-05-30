// ============================================
// OGOUTEL_Prestige - API: Envoi email d'abonnement
// Fichier : app/api/send-subscription-email/route.ts
//
// POST /api/send-subscription-email
// - Reçoit les données du formulaire d'abonnement
// - Enregistre dans Supabase (table abonnement_demandes)
// - Envoie un email à l'admin (omouitsi@gmail.com)
// - Génère un lien WhatsApp direct
// - Gère gracefully l'absence de Supabase / Resend
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { escapeHtml } from '@/lib/html-escape';
import { checkRateLimit, getClientIp, RATE_LIMIT_FORM } from '@/lib/rate-limit';

// ─── Types ──────────────────────────────────────────────────────────────────

interface SubscriptionBody {
  nom_complet: string;
  email: string;
  telephone: string;
  nom_hotel: string;
  ville: string;
  quartier?: string;
  nombre_chambres?: string;
  plan_choisi: 'basique' | 'standard' | 'premium';
  message?: string;
}

// ─── Constantes ──────────────────────────────────────────────────────────────

const ADMIN_EMAIL = 'omouitsi@gmail.com';
const WHATSAPP_NUMBER = '2250576103277';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ogoutel-prestige.com';

const PLAN_LABELS: Record<string, string> = {
  basique: 'Basique',
  standard: 'Standard',
  premium: 'Premium',
};

const PLAN_PRICES: Record<string, string> = {
  basique: '25 000',
  standard: '50 000',
  premium: '95 000',
};

const PLAN_COLORS: Record<string, string> = {
  basique: '#6B7280',
  standard: '#D4AF37',
  premium: '#7C3AED',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateWhatsAppLink(nom: string, hotel: string, plan: string): string {
  const text = encodeURIComponent(
    `Bonjour OGOU ! Je suis ${nom} de l'hôtel "${hotel}". Je souhaite souscrire au plan ${plan} OGOUTEL_Prestige. Merci de me recontacter.`
  );
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}

function buildAdminEmailHtml(data: SubscriptionBody): string {
  const plan = data.plan_choisi;
  const planColor = PLAN_COLORS[plan] ?? '#D4AF37';
  const planLabel = PLAN_LABELS[plan] ?? plan;
  const planPrice = PLAN_PRICES[plan] ?? '—';
  const whatsappLink = generateWhatsAppLink(data.nom_complet, data.nom_hotel, planLabel);
  const dashboardLink = `${APP_URL}/super-dashboard/demandes`;

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Nouvelle demande d'abonnement OGOUTEL_Prestige</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F3F4F6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">

          <!-- ── Header Gradient ── -->
          <tr>
            <td style="background: linear-gradient(135deg, #D4AF37 0%, #1B4332 100%); border-radius: 16px 16px 0 0; padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #FFFFFF; font-size: 22px; font-weight: 700;">
                🏨 Nouvelle Demande d'Abonnement
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">
                OGOUTEL_Prestige — La Gestion Hôtelière Intelligente
              </p>
            </td>
          </tr>

          <!-- ── Body ── -->
          <tr>
            <td style="background: #FFFFFF; border-left: 1px solid #E5E7EB; border-right: 1px solid #E5E7EB; padding: 32px 40px;">

              <!-- Prospect Name -->
              <h2 style="margin: 0 0 6px; color: #0A0A0A; font-size: 20px; font-weight: 700;">
                ${escapeHtml(data.nom_complet)}
              </h2>
              <p style="margin: 0 0 24px; color: #6B7280; font-size: 14px;">
                Hôtel <strong style="color: #1B4332;">${escapeHtml(data.nom_hotel)}</strong>
                ${data.ville ? ` — ${escapeHtml(data.ville)}${data.quartier ? `, ${escapeHtml(data.quartier)}` : ''}` : ''}
              </p>

              <!-- Divider -->
              <hr style="border: none; border-top: 1px solid #F3F4F6; margin: 0 0 20px;" />

              <!-- Details Table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; color: #6B7280; font-size: 13px; width: 160px; border-bottom: 1px solid #F9FAFB;">
                    📧 Email
                  </td>
                  <td style="padding: 10px 0; color: #0A0A0A; font-size: 14px; font-weight: 600; border-bottom: 1px solid #F9FAFB;">
                    <a href="mailto:${escapeHtml(data.email)}" style="color: #D4AF37; text-decoration: none;">${escapeHtml(data.email)}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6B7280; font-size: 13px; border-bottom: 1px solid #F9FAFB;">
                    📱 Téléphone
                  </td>
                  <td style="padding: 10px 0; color: #0A0A0A; font-size: 14px; font-weight: 600; border-bottom: 1px solid #F9FAFB;">
                    ${escapeHtml(data.telephone)}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6B7280; font-size: 13px; border-bottom: 1px solid #F9FAFB;">
                    🏨 Hôtel
                  </td>
                  <td style="padding: 10px 0; color: #0A0A0A; font-size: 14px; font-weight: 600; border-bottom: 1px solid #F9FAFB;">
                    ${escapeHtml(data.nom_hotel)}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6B7280; font-size: 13px; border-bottom: 1px solid #F9FAFB;">
                    📍 Ville
                  </td>
                  <td style="padding: 10px 0; color: #0A0A0A; font-size: 14px; font-weight: 600; border-bottom: 1px solid #F9FAFB;">
                    ${escapeHtml(data.ville)}${data.quartier ? ` — ${escapeHtml(data.quartier)}` : ''}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6B7280; font-size: 13px; border-bottom: 1px solid #F9FAFB;">
                    🛏️ Chambres
                  </td>
                  <td style="padding: 10px 0; color: #0A0A0A; font-size: 14px; font-weight: 600; border-bottom: 1px solid #F9FAFB;">
                    ${escapeHtml(String(data.nombre_chambres || 'Non précisé'))}
                  </td>
                </tr>
                <!-- Plan Row (highlighted) -->
                <tr>
                  <td style="padding: 14px 0; color: #6B7280; font-size: 13px;">
                    ⭐ Plan choisi
                  </td>
                  <td style="padding: 14px 0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background-color: ${planColor}15; border: 1px solid ${planColor}40; border-radius: 8px; padding: 8px 16px;">
                          <span style="color: ${planColor}; font-size: 16px; font-weight: 700;">${planLabel}</span>
                          <span style="color: #6B7280; font-size: 12px; margin-left: 8px;">${planPrice} FCFA/mois</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Message (if any) -->
              ${
                data.message
                  ? `
              <div style="margin-top: 20px; background: #F9FAFB; border-radius: 10px; padding: 16px; border-left: 4px solid #D4AF37;">
                <p style="margin: 0 0 4px; color: #6B7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                  Message du prospect
                </p>
                <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6;">
                  ${escapeHtml(data.message)}
                </p>
              </div>`
                  : ''
              }

              <!-- Action Buttons -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 28px;">
                <tr>
                  <td align="left" style="padding-right: 8px;">
                    <a href="${whatsappLink}" target="_blank" rel="noopener noreferrer"
                       style="display: inline-block; padding: 12px 24px; background: #25D366; color: #FFFFFF; text-decoration: none; border-radius: 10px; font-size: 14px; font-weight: 600;">
                      💬 Contacter sur WhatsApp
                    </a>
                  </td>
                  <td align="right" style="padding-left: 8px;">
                    <a href="${dashboardLink}" target="_blank" rel="noopener noreferrer"
                       style="display: inline-block; padding: 12px 24px; background: #D4AF37; color: #0A0A0A; text-decoration: none; border-radius: 10px; font-size: 14px; font-weight: 600;">
                      📊 Voir dans le Dashboard
                    </a>
                  </td>
                </tr>
              </table>

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
    // ── Rate Limiting ──
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(clientIp, RATE_LIMIT_FORM);
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

    const body: SubscriptionBody = await request.json();

    // ── Validation ──
    const { nom_complet, email, telephone, nom_hotel, ville, plan_choisi } = body;
    if (!nom_complet || !email || !telephone || !nom_hotel || !ville || !plan_choisi) {
      return NextResponse.json(
        { success: false, error: 'Tous les champs obligatoires doivent être remplis (nom, email, téléphone, hôtel, ville, plan).' },
        { status: 400 }
      );
    }

    if (!['basique', 'standard', 'premium'].includes(plan_choisi)) {
      return NextResponse.json(
        { success: false, error: 'Plan invalide. Choisissez : basique, standard ou premium.' },
        { status: 400 }
      );
    }

    // ── 1. Supabase Insert ──
    const hasSupabase = !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    if (hasSupabase) {
      try {
        const { createAdminClient } = await import('@/lib/supabase/server');
        const supabase = await createAdminClient();
        if (supabase) {
          const { error } = await supabase.from('abonnement_demandes').insert({
            nom_complet,
            email,
            telephone,
            nom_hotel,
            ville,
            quartier: body.quartier || null,
            nombre_chambres: body.nombre_chambres ? parseInt(body.nombre_chambres) : null,
            plan_choisi,
            message: body.message || null,
            statut: 'en_attente',
          });
          if (error) {
            console.error('[send-subscription-email] Erreur Supabase:', error);
            // Continue — don't block the response
          }
        }
      } catch (dbErr) {
        console.error('[send-subscription-email] Erreur connexion Supabase:', dbErr);
      }
    } else {
      console.log('[send-subscription-email] Supabase non configuré — skip DB insert');
    }

    // ── 2. Resend Email ──
    const hasResend = !!process.env.RESEND_API_KEY;

    if (hasResend) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        const planLabel = PLAN_LABELS[plan_choisi] ?? plan_choisi;

        await resend.emails.send({
          from: 'OGOUTEL_Prestige <onboarding@resend.dev>',
          to: ADMIN_EMAIL,
          subject: `🏨 Nouvelle demande d'abonnement OGOUTEL_Prestige — ${planLabel} — ${nom_hotel}`,
          html: buildAdminEmailHtml(body),
        });
      } catch (emailErr) {
        console.error('[send-subscription-email] Erreur envoi email:', emailErr);
      }
    } else {
      console.log('[send-subscription-email] Resend non configuré — skip email');
    }

    // ── 3. WhatsApp Link (always returned) ──
    const whatsappLink = generateWhatsAppLink(nom_complet, nom_hotel, PLAN_LABELS[plan_choisi] ?? plan_choisi);

    return NextResponse.json({
      success: true,
      message: 'Demande d\'abonnement envoyée avec succès !',
      data: {
        whatsapp_link: whatsappLink,
        plan_choisi,
        plan_label: PLAN_LABELS[plan_choisi],
      },
    });
  } catch (error) {
    console.error('[send-subscription-email] Erreur:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur. Veuillez réessayer.' },
      { status: 500 }
    );
  }
}
