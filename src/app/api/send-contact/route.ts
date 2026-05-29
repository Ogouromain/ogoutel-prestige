import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nom_complet, email, telephone, nom_hotel, ville, quartier, nombre_chambres, plan_choisi, message } = body

    // Validation basique
    if (!nom_complet || !email || !telephone || !nom_hotel || !ville || !plan_choisi) {
      return NextResponse.json({ success: false, error: 'Tous les champs obligatoires doivent être remplis.' }, { status: 400 })
    }

    // 1. Insérer dans Supabase
    const supabase = createAdminClient()
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
      return NextResponse.json({ success: false, error: 'Erreur lors de l\'enregistrement. Veuillez réessayer.' }, { status: 500 })
    }

    // 2. Email à l'admin (omouitsi@gmail.com)
    const planLabels: Record<string, string> = { basique: 'Basique', standard: 'Standard', premium: 'Premium' }
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
              <div style="margin-top: 20px; display: flex; gap: 12px;">
                <a href="mailto:${email}" style="display: inline-block; padding: 10px 20px; background: #D4AF37; color: black; text-decoration: none; border-radius: 8px; font-weight: 600;">Répondre</a>
                <a href="https://wa.me/${telephone.replace(/\s/g, '')}" style="display: inline-block; padding: 10px 20px; background: #25D366; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">WhatsApp</a>
              </div>
            </div>
          </div>
        `,
      })
    } catch (emailErr) {
      console.error('Erreur envoi email admin:', emailErr)
      // Ne pas bloquer si l'email échoue
    }

    // 3. Email de confirmation au prospect
    try {
      await resend.emails.send({
        from: 'OGOUTEL_Prestige <onboarding@resend.dev>',
        to: email,
        subject: '✅ Votre demande OGOUTEL_Prestige a été reçue !',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #D4AF37, #1B4332); padding: 24px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 20px;">OGOUTEL_Prestige</h1>
              <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0;">La gestion hôtelière intelligente</p>
            </div>
            <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <h2 style="color: #0A0A0A;">Bonjour ${nom_complet.split(' ')[0]} ! 👋</h2>
              <p>Merci pour votre intérêt envers <strong>OGOUTEL_Prestige</strong>. Nous avons bien reçu votre demande pour l'hôtel <strong>${nom_hotel}</strong>.</p>
              <p>Voici un récapitulatif :</p>
              <ul style="padding-left: 20px;">
                <li>Plan choisi : <strong>${planLabels[plan_choisi]}</strong></li>
                <li>Ville : ${ville}${quartier ? ` (${quartier})` : ''}</li>
                <li>Nombre de chambres : ${nombre_chambres || 'Non précisé'}</li>
              </ul>
              <div style="background: #F8F9FA; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <p style="margin: 0;">Notre équipe vous contactera dans les <strong>24 heures</strong> pour démarrer votre configuration.</p>
              </div>
              <p>En attendant, vous pouvez nous écrire sur WhatsApp :</p>
              <a href="https://wa.me/2250576103277" style="display: inline-block; padding: 10px 20px; background: #25D366; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Écrire sur WhatsApp</a>
              <p style="margin-top: 20px; color: #6B7280; font-size: 14px;">À très bientôt !<br/>L'équipe OGOUTEL_Prestige 🇨🇮</p>
            </div>
          </div>
        `,
      })
    } catch (emailErr) {
      console.error('Erreur envoi email prospect:', emailErr)
    }

    return NextResponse.json({ success: true, message: 'Demande envoyée avec succès' })

  } catch (error) {
    console.error('Erreur API send-contact:', error)
    return NextResponse.json({ success: false, error: 'Erreur interne du serveur.' }, { status: 500 })
  }
}
