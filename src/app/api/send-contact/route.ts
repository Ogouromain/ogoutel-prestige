import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nom_complet, email, telephone, nom_hotel, ville, quartier, nombre_chambres, plan_choisi, message } = body

    // Validation basique
    if (!nom_complet || !email || !telephone || !nom_hotel || !ville || !plan_choisi) {
      return NextResponse.json({ success: false, error: 'Tous les champs obligatoires doivent être remplis.' }, { status: 400 })
    }

    // 1. Try Supabase insert (if configured)
    const hasSupabase = !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

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
        }
      } catch (dbErr) {
        console.error('Erreur connexion Supabase:', dbErr)
      }
    } else {
      console.log('[send-contact] Supabase non configuré — skip DB insert')
    }

    // 2. Try Resend email (if configured)
    const hasResend = !!process.env.RESEND_API_KEY

    if (hasResend) {
      try {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        const planLabels: Record<string, string> = { basique: 'Basique', standard: 'Standard', premium: 'Premium' }

        // Email à l'admin
        try {
          await resend.emails.send({
            from: 'OGOUTEL_Prestige <onboarding@resend.dev>',
            to: 'omouitsi@gmail.com',
            subject: `🏨 [OGOUTEL_Prestige] Nouvelle demande - ${planLabels[plan_choisi]} - ${nom_hotel}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #D4AF37, #1B4332); padding: 24px; border-radius: 12px 12px 0 0;">
                  <h1 style="color: white; margin: 0; font-size: 20px;">🏨 Nouvelle Demande OGOUTEL_Prestige</h1>
                </div>
                <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
                  <h2 style="color: #0A0A0A; margin-top: 0;">${nom_complet} — ${nom_hotel}</h2>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 8px 0; color: #6B7280; width: 140px;">Email</td><td style="padding: 8px 0; font-weight: 600;">${email}</td></tr>
                    <tr><td style="padding: 8px 0; color: #6B7280;">Téléphone</td><td style="padding: 8px 0; font-weight: 600;">${telephone}</td></tr>
                    <tr><td style="padding: 8px 0; color: #6B7280;">Ville</td><td style="padding: 8px 0; font-weight: 600;">${ville}${quartier ? ` — ${quartier}` : ''}</td></tr>
                    <tr><td style="padding: 8px 0; color: #6B7280;">Chambres</td><td style="padding: 8px 0; font-weight: 600;">${nombre_chambres || 'Non précisé'}</td></tr>
                    <tr><td style="padding: 8px 0; color: #6B7280;">Plan choisi</td><td style="padding: 8px 0; font-weight: 600; color: #D4AF37;">${planLabels[plan_choisi]}</td></tr>
                  </table>
                  ${message ? `<div style="margin-top: 16px; padding: 12px; background: #F8F9FA; border-radius: 8px;"><strong>Message :</strong><br/>${message}</div>` : ''}
                </div>
              </div>
            `,
          })
        } catch (emailErr) {
          console.error('Erreur envoi email admin:', emailErr)
        }

        // Email de confirmation au prospect
        try {
          await resend.emails.send({
            from: 'OGOUTEL_Prestige <onboarding@resend.dev>',
            to: email,
            subject: '✅ Votre demande OGOUTEL_Prestige a été reçue !',
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #D4AF37, #1B4332); padding: 24px; border-radius: 12px 12px 0 0;">
                  <h1 style="color: white; margin: 0; font-size: 20px;">OGOUTEL_Prestige</h1>
                </div>
                <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
                  <h2 style="color: #0A0A0A;">Bonjour ${nom_complet.split(' ')[0]} ! 👋</h2>
                  <p>Merci pour votre intérêt envers <strong>OGOUTEL_Prestige</strong>. Nous avons bien reçu votre demande.</p>
                  <p>Notre équipe vous contactera dans les <strong>24 heures</strong>.</p>
                </div>
              </div>
            `,
          })
        } catch (emailErr) {
          console.error('Erreur envoi email prospect:', emailErr)
        }
      } catch (resendErr) {
        console.error('Erreur Resend:', resendErr)
      }
    } else {
      console.log('[send-contact] Resend non configuré — skip emails')
    }

    // Always return success to frontend (DB/email are non-blocking)
    return NextResponse.json({ success: true, message: 'Demande envoyée avec succès' })

  } catch (error) {
    console.error('Erreur API send-contact:', error)
    return NextResponse.json({ success: false, error: 'Erreur interne du serveur.' }, { status: 500 })
  }
}
