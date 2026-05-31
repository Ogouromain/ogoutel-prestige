import { NextRequest, NextResponse } from 'next/server'
import { escapeHtml } from '@/lib/html-escape'
import { checkRateLimit, getClientIp, RATE_LIMIT_FORM } from '@/lib/rate-limit'
import env from '@/lib/env'

export async function POST(request: NextRequest) {
  try {
    // ── Rate Limiting ──
    const clientIp = getClientIp(request)
    const rateLimit = checkRateLimit(clientIp, RATE_LIMIT_FORM)
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
      )
    }

    const body = await request.json()
    const { nom_complet, email, telephone, nom_hotel, ville, quartier, nombre_chambres, plan_choisi, message } = body

    // Validation basique
    if (!nom_complet || !email || !telephone || !nom_hotel || !ville || !plan_choisi) {
      return NextResponse.json({ success: false, error: 'Tous les champs obligatoires doivent être remplis.' }, { status: 400 })
    }

    // 1. Try Supabase insert (if configured)
    const hasSupabase = !!(
      env.SUPABASE_URL &&
      env.SUPABASE_ANON_KEY &&
      env.SUPABASE_SERVICE_ROLE_KEY
    )

    let dbInsertOk = !hasSupabase // if not configured, consider it N/A (not a failure)

    if (hasSupabase) {
      try {
        const { createAdminClient } = await import('@/lib/supabase/server')
        const supabase = await createAdminClient()
        const { error: dbError } = await supabase.from('abonnement_demandes').insert({
          nom_complet,
          email,
          telephone,
          nom_hotel,
          ville,
          quartier: quartier || null,
          nombre_chambres: nombre_chambres ? parseInt(nombre_chambres) : null,
          plan_choisi,
          message: message || null,
          statut: 'en_attente',
        })
        if (dbError) {
          console.error('Erreur Supabase:', dbError)
          dbInsertOk = false
        } else {
          dbInsertOk = true
        }
      } catch (dbErr) {
        console.error('Erreur connexion Supabase:', dbErr)
        dbInsertOk = false
      }
    } else {
      console.log('[send-contact] Supabase non configuré — skip DB insert')
    }

    // 2. Try Resend email (if configured)
    const hasResend = !!env.RESEND_API_KEY

    let emailOk = !hasResend // if not configured, consider it N/A (not a failure)

    if (hasResend) {
      try {
        const { Resend } = await import('resend')
        const resend = new Resend(env.RESEND_API_KEY)
        const planLabels: Record<string, string> = { basique: 'Basique', standard: 'Standard', premium: 'Premium' }

        // Email à l'admin
        try {
          const { error: adminEmailErr } = await resend.emails.send({
            from: 'OGOUTEL_Prestige <onboarding@resend.dev>',
            to: 'omouitsi@gmail.com',
            subject: `🏨 [OGOUTEL_Prestige] Nouvelle demande - ${planLabels[plan_choisi]} - ${nom_hotel}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #D4AF37, #1B4332); padding: 24px; border-radius: 12px 12px 0 0;">
                  <h1 style="color: white; margin: 0; font-size: 20px;">🏨 Nouvelle Demande OGOUTEL_Prestige</h1>
                </div>
                <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
                  <h2 style="color: #0A0A0A; margin-top: 0;">${escapeHtml(nom_complet)} — ${escapeHtml(nom_hotel)}</h2>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 8px 0; color: #6B7280; width: 140px;">Email</td><td style="padding: 8px 0; font-weight: 600;">${escapeHtml(email)}</td></tr>
                    <tr><td style="padding: 8px 0; color: #6B7280;">Téléphone</td><td style="padding: 8px 0; font-weight: 600;">${escapeHtml(telephone)}</td></tr>
                    <tr><td style="padding: 8px 0; color: #6B7280;">Ville</td><td style="padding: 8px 0; font-weight: 600;">${escapeHtml(ville)}${quartier ? ` — ${escapeHtml(quartier)}` : ''}</td></tr>
                    <tr><td style="padding: 8px 0; color: #6B7280;">Chambres</td><td style="padding: 8px 0; font-weight: 600;">${escapeHtml(String(nombre_chambres || 'Non précisé'))}</td></tr>
                    <tr><td style="padding: 8px 0; color: #6B7280;">Plan choisi</td><td style="padding: 8px 0; font-weight: 600; color: #D4AF37;">${planLabels[plan_choisi]}</td></tr>
                  </table>
                  ${message ? `<div style="margin-top: 16px; padding: 12px; background: #F8F9FA; border-radius: 8px;"><strong>Message :</strong><br/>${escapeHtml(message)}</div>` : ''}
                </div>
              </div>
            `,
          })
          if (adminEmailErr) {
            console.error('Erreur envoi email admin:', adminEmailErr)
          }
        } catch (emailErr) {
          console.error('Erreur envoi email admin:', emailErr)
        }

        // Email de confirmation au prospect
        try {
          const { error: prospectEmailErr } = await resend.emails.send({
            from: 'OGOUTEL_Prestige <onboarding@resend.dev>',
            to: email,
            subject: '✅ Votre demande OGOUTEL_Prestige a été reçue !',
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #D4AF37, #1B4332); padding: 24px; border-radius: 12px 12px 0 0;">
                  <h1 style="color: white; margin: 0; font-size: 20px;">OGOUTEL_Prestige</h1>
                </div>
                <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
                  <h2 style="color: #0A0A0A;">Bonjour ${escapeHtml(nom_complet.split(' ')[0])} ! 👋</h2>
                  <p>Merci pour votre intérêt envers <strong>OGOUTEL_Prestige</strong>. Nous avons bien reçu votre demande.</p>
                  <p>Notre équipe vous contactera dans les <strong>24 heures</strong>.</p>
                </div>
              </div>
            `,
          })
          if (prospectEmailErr) {
            console.error('Erreur envoi email prospect:', prospectEmailErr)
          }
        } catch (emailErr) {
          console.error('Erreur envoi email prospect:', emailErr)
        }

        emailOk = true
      } catch (resendErr) {
        console.error('Erreur Resend:', resendErr)
        emailOk = false
      }
    } else {
      console.log('[send-contact] Resend non configuré — skip emails')
    }

    // 3. Check results — if both configured services failed, return an error
    if (hasSupabase && hasResend && !dbInsertOk && !emailOk) {
      return NextResponse.json(
        { success: false, error: 'Erreur lors du traitement de votre demande. Veuillez réessayer plus tard.' },
        { status: 502 }
      )
    }
    if (hasSupabase && !dbInsertOk && !hasResend) {
      return NextResponse.json(
        { success: false, error: 'Erreur lors de l\'enregistrement de votre demande. Veuillez réessayer plus tard.' },
        { status: 502 }
      )
    }
    if (!hasSupabase && hasResend && !emailOk) {
      return NextResponse.json(
        { success: false, error: 'Erreur lors de l\'envoi de la notification. Veuillez réessayer plus tard.' },
        { status: 502 }
      )
    }

    return NextResponse.json({ success: true, message: 'Demande envoyée avec succès' })

  } catch (error) {
    console.error('Erreur API send-contact:', error)
    return NextResponse.json({ success: false, error: 'Erreur interne du serveur.' }, { status: 500 })
  }
}
