// ============================================
// OGOUTEL_Prestige - API: Contact Form
// Fichier : app/api/contact/route.ts
//
// POST /api/contact (PUBLIC)
// - Receives contact form data
// - Stores in Supabase (activites_log with action='contact')
// - Sends email notification to admin via Resend
// - Falls back gracefully if Supabase/Resend not configured
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { escapeHtml } from '@/lib/html-escape';
import { checkRateLimit, getClientIp, RATE_LIMIT_FORM } from '@/lib/rate-limit';
import env from '@/lib/env';

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

    const body = await request.json();

    // ── Validation ──
    const { name, email, phone, subject, message } = body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Le nom doit contenir au moins 2 caractères.' },
        { status: 400 }
      );
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Adresse email invalide.' },
        { status: 400 }
      );
    }

    if (!subject || typeof subject !== 'string' || subject.trim().length < 1) {
      return NextResponse.json(
        { success: false, error: 'Le sujet est requis.' },
        { status: 400 }
      );
    }

    if (!message || typeof message !== 'string' || message.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: 'Le message doit contenir au moins 10 caractères.' },
        { status: 400 }
      );
    }

    // ── 1. Supabase Insert (if configured) ──
    const hasSupabase = !!(
      env.SUPABASE_URL &&
      env.SUPABASE_ANON_KEY &&
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    if (hasSupabase) {
      try {
        const { createAdminClient } = await import('@/lib/supabase/server');
        const supabase = await createAdminClient();
        if (supabase) {
          await supabase.from('activites_log').insert({
            action: 'contact',
            details: {
              nom: name.trim(),
              email: email.trim().toLowerCase(),
              telephone: phone?.trim() || null,
              sujet: subject.trim(),
              message: message.trim(),
            },
          });
        }
      } catch (dbErr) {
        console.error('[contact] Erreur Supabase:', dbErr);
      }
    }

    // ── 2. Resend Email (if configured) ──
    const hasResend = !!env.RESEND_API_KEY;

    if (hasResend) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(env.RESEND_API_KEY);

        await resend.emails.send({
          from: 'OGOUTEL_Prestige <onboarding@resend.dev>',
          to: 'omouitsi@gmail.com',
          subject: `📩 [Contact] ${escapeHtml(subject.trim())} — ${escapeHtml(name.trim())}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #D4AF37, #1B4332); padding: 24px; border-radius: 12px 12px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 20px;">📩 Nouveau message de contact</h1>
              </div>
              <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 8px 0; color: #6B7280; width: 120px;">Nom</td><td style="padding: 8px 0; font-weight: 600;">${escapeHtml(name.trim())}</td></tr>
                  <tr><td style="padding: 8px 0; color: #6B7280;">Email</td><td style="padding: 8px 0; font-weight: 600;">${escapeHtml(email.trim())}</td></tr>
                  ${phone ? `<tr><td style="padding: 8px 0; color: #6B7280;">Téléphone</td><td style="padding: 8px 0; font-weight: 600;">${escapeHtml(phone.trim())}</td></tr>` : ''}
                  <tr><td style="padding: 8px 0; color: #6B7280;">Sujet</td><td style="padding: 8px 0; font-weight: 600;">${escapeHtml(subject.trim())}</td></tr>
                </table>
                <div style="margin-top: 16px; padding: 12px; background: #F8F9FA; border-radius: 8px;">
                  <strong>Message :</strong><br/>
                  ${escapeHtml(message.trim())}
                </div>
              </div>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error('[contact] Erreur envoi email:', emailErr);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Merci pour votre message. Nous vous répondrons dans les plus brefs délais.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[contact] Erreur:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: 'JSON invalide dans le corps de la requête.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}
