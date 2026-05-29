'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { Mail, Phone, Clock, MessageCircle, Loader2, Send, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'

// Zod schema
const contactSchema = z.object({
  nom_complet: z.string().min(2, 'Nom requis'),
  email: z.string().email('Email invalide'),
  telephone: z.string().min(8, 'Téléphone requis'),
  nom_hotel: z.string().min(2, 'Nom de l\'hôtel requis'),
  ville: z.string().min(1, 'Ville requise'),
  quartier: z.string().optional(),
  nombre_chambres: z.string().optional(),
  plan_choisi: z.enum(['basique', 'standard', 'premium']),
  message: z.string().optional(),
})

type ContactForm = z.infer<typeof contactSchema>

const VILLES_CI = ['Abidjan', 'Bouaké', 'Yamoussoukro', 'Korhogo', 'San-Pédro', 'Daloa', 'Man', 'Gagnoa', 'Abengourou', 'Divo', 'Autre']

export function ContactFormSection() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: { plan_choisi: 'standard' },
  })

  const selectedPlan = watch('plan_choisi')

  const onSubmit = async (data: ContactForm) => {
    setLoading(true)
    try {
      const res = await fetch('/api/send-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (result.success) {
        setSuccess(true)
        toast.success('Demande envoyée avec succès !')
      } else {
        toast.error(result.error || 'Erreur lors de l\'envoi')
      }
    } catch {
      toast.error('Erreur de connexion. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <section id="contact" className="py-20 md:py-28 bg-white">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-8 md:p-12">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-elegant-black mb-3">✅ Votre demande a bien été envoyée !</h3>
            <p className="text-gray-600 mb-2">OGOU va vous contacter dans les 24h sur WhatsApp au</p>
            <a href="https://wa.me/2250576103277" className="text-xl font-semibold text-green-600 hover:underline">+225 0576103277</a>
            <Button onClick={() => { setSuccess(false); reset() }} className="mt-8 bg-gold text-black hover:bg-gold-dark rounded-lg">
              Envoyer une autre demande
            </Button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="contact" className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-elegant-black mb-4">
            Prêt à transformer votre hôtel ?
          </h2>
          <p className="text-lg text-gray-500">
            Remplissez ce formulaire et OGOU vous contacte sous 24h pour démarrer
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Form - 3 cols */}
          <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-3 space-y-5">
            {/* Row: nom + email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nom_complet">Nom complet *</Label>
                <Input id="nom_complet" placeholder="Konan Adjoumani" {...register('nom_complet')} className="mt-1" />
                {errors.nom_complet && <p className="text-red-500 text-xs mt-1">{errors.nom_complet.message}</p>}
              </div>
              <div>
                <Label htmlFor="email">Email professionnel *</Label>
                <Input id="email" type="email" placeholder="contact@hotel.com" {...register('email')} className="mt-1" />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>
            </div>

            {/* Row: tel + hotel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="telephone">Téléphone / WhatsApp *</Label>
                <Input id="telephone" type="tel" placeholder="Ex: 0708123456" {...register('telephone')} className="mt-1" />
                {errors.telephone && <p className="text-red-500 text-xs mt-1">{errors.telephone.message}</p>}
              </div>
              <div>
                <Label htmlFor="nom_hotel">Nom de votre hôtel *</Label>
                <Input id="nom_hotel" placeholder="Hôtel Le Palmier" {...register('nom_hotel')} className="mt-1" />
                {errors.nom_hotel && <p className="text-red-500 text-xs mt-1">{errors.nom_hotel.message}</p>}
              </div>
            </div>

            {/* Row: ville + quartier */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Ville *</Label>
                <Select onValueChange={(v) => setValue('ville', v, { shouldValidate: true })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionnez votre ville" /></SelectTrigger>
                  <SelectContent>
                    {VILLES_CI.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.ville && <p className="text-red-500 text-xs mt-1">{errors.ville.message}</p>}
              </div>
              <div>
                <Label htmlFor="quartier">Quartier / Localité</Label>
                <Input id="quartier" placeholder="Cocody" {...register('quartier')} className="mt-1" />
              </div>
            </div>

            {/* nombre_chambres */}
            <div className="sm:w-1/2">
              <Label htmlFor="nombre_chambres">Nombre approximatif de chambres</Label>
              <Input id="nombre_chambres" type="number" min={1} placeholder="Ex: 15" {...register('nombre_chambres')} className="mt-1" />
            </div>

            {/* Plan choisi - styled radio cards */}
            <div>
              <Label className="mb-3 block">Plan souhaité *</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(['basique', 'standard', 'premium'] as const).map((plan) => {
                  const isSelected = selectedPlan === plan
                  const labels: Record<string, string> = { basique: '🥉 Basique', standard: '🥈 Standard', premium: '🥇 Premium' }
                  const prices: Record<string, string> = { basique: '25 000 FCFA/mois', standard: '50 000 FCFA/mois', premium: '95 000 FCFA/mois' }
                  return (
                    <label key={plan} className={`cursor-pointer rounded-xl border-2 p-4 text-center transition-all ${isSelected ? 'border-gold bg-gold/5 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="radio" value={plan} {...register('plan_choisi')} className="sr-only" />
                      <div className="font-semibold text-sm">{labels[plan]}</div>
                      <div className={`text-xs mt-1 ${isSelected ? 'text-gold font-medium' : 'text-gray-500'}`}>{prices[plan]}</div>
                      {plan === 'standard' && <div className="text-[10px] text-gold font-bold mt-1">Recommandé</div>}
                    </label>
                  )
                })}
              </div>
              {errors.plan_choisi && <p className="text-red-500 text-xs mt-1">{errors.plan_choisi.message}</p>}
            </div>

            {/* Message */}
            <div>
              <Label htmlFor="message">Message / Questions</Label>
              <Textarea id="message" placeholder="Votre message..." rows={3} {...register('message')} className="mt-1" />
            </div>

            {/* Submit */}
            <Button type="submit" disabled={loading} className="w-full bg-gold text-black hover:bg-gold-dark rounded-xl py-6 text-lg font-semibold">
              {loading ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Envoi en cours...</> : <>Envoyer ma demande 🚀</>}
            </Button>
          </form>

          {/* Contact info - 2 cols */}
          <div className="lg:col-span-2">
            <Card className="bg-gradient-to-br from-ivory to-ivory-light text-white rounded-2xl p-8 sticky top-24">
              <CardContent className="p-0 space-y-6">
                <h3 className="text-xl font-bold">Contact direct</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gold" />
                    <span>omouitsi@gmail.com</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gold" />
                    <span>+225 0576103277</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-gold" />
                    <span>Réponse sous 24h</span>
                  </div>
                </div>
                <a href="https://wa.me/2250576103277" target="_blank" rel="noopener noreferrer">
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-5 text-base font-semibold mt-4">
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Écrire sur WhatsApp
                  </Button>
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
