'use client'

import { useState, useEffect, useRef } from 'react'
import {
  BedDouble,
  CalendarDays,
  Users,
  FileText,
  BarChart3,
  UserCog,
  ShieldCheck,
  Smartphone,
} from 'lucide-react'

export function FeaturesSection() {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setVisible(true)
      },
      { threshold: 0.1 }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  const features = [
    {
      icon: BedDouble,
      title: 'Gestion des chambres',
      desc: 'Visualisez en temps réel le statut de chaque chambre. Disponible, occupée, en maintenance... tout en un coup d\'œil.',
    },
    {
      icon: CalendarDays,
      title: 'Réservations simplifiées',
      desc: 'Créez une réservation en moins de 2 minutes. Calendrier intuitif, gestion des arrivées et départs automatisée.',
    },
    {
      icon: Users,
      title: 'Fiches clients complètes',
      desc: 'Historique de chaque client, pièces d\'identité, préférences. Offrez un service personnalisé à chaque visite.',
    },
    {
      icon: FileText,
      title: 'Facturation automatique',
      desc: 'Factures professionnelles générées automatiquement. TVA, remises, modes de paiement multiples.',
    },
    {
      icon: BarChart3,
      title: 'Rapports et statistiques',
      desc: 'Taux d\'occupation, revenus, chambre la plus rentable... Prenez des décisions éclairées chaque jour.',
    },
    {
      icon: UserCog,
      title: 'Gestion du personnel',
      desc: 'Créez des comptes pour vos réceptionnistes et gérants avec des accès adaptés à leur rôle.',
    },
    {
      icon: ShieldCheck,
      title: 'Sécurité multicouche',
      desc: 'Chaque hôtel a ses propres données isolées. Vos informations ne sont visibles que par votre équipe.',
    },
    {
      icon: Smartphone,
      title: 'Accessible partout',
      desc: 'Tablette, ordinateur, téléphone. Gérez votre hôtel depuis n\'importe quel appareil avec connexion internet.',
    },
  ]

  return (
    <section id="fonctionnalites" ref={ref} className="py-20 md:py-28 bg-[#F8F9FA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 mb-6 rounded-full bg-gold/10 text-gold text-sm font-semibold tracking-wide uppercase">
            Fonctionnalités
          </span>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-elegant-black mb-4">
            Tout ce dont votre hôtel a besoin
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Une suite complète d&apos;outils pensés pour la réalité ivoirienne
          </p>
        </div>

        {/* Grid 2x4 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className={`group relative p-6 rounded-2xl bg-white border border-gray-100 hover:border-gold/30 hover:shadow-xl transition-all duration-300 cursor-default ${
                visible
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-8'
              }`}
              style={{
                transitionDelay: `${i * 80}ms`,
                transitionProperty: 'opacity, transform, border-color, box-shadow',
              }}
            >
              {/* Subtle gold glow on hover */}
              <div className="absolute inset-0 rounded-2xl bg-gold/0 group-hover:bg-gold/[0.02] transition-colors duration-300 -z-10" />

              <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mb-4 group-hover:bg-gold/20 group-hover:scale-110 transition-all duration-300">
                <f.icon className="h-6 w-6 text-gold" />
              </div>
              <h3 className="text-lg font-semibold text-elegant-black mb-2 group-hover:text-ivory transition-colors">
                {f.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed group-hover:text-gray-600 transition-colors">
                {f.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom accent line */}
        <div className="mt-16 flex justify-center">
          <div className="h-1 w-24 rounded-full bg-gradient-to-r from-transparent via-gold to-transparent" />
        </div>
      </div>
    </section>
  )
}
