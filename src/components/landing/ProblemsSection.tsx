'use client'

import { useState, useEffect, useRef } from 'react'
import {
  BookOpen,
  AlertTriangle,
  Receipt,
  TrendingDown,
  Users,
  PhoneCall,
  Sparkles,
} from 'lucide-react'

export function ProblemsSection() {
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

  const problems = [
    {
      icon: BookOpen,
      title: 'Les cahiers et tableaux Excel',
      desc: "Perte de données, erreurs de calcul, réservations oubliées... Vos informations sont éparpillées et impossibles à consulter rapidement.",
    },
    {
      icon: AlertTriangle,
      title: 'La confusion des réservations',
      desc: 'Double réservation, chambres vides par erreur, clients mécontents... Le chaos quotidien qui coûte de l\'argent.',
    },
    {
      icon: Receipt,
      title: 'La facturation manuelle',
      desc: 'Erreurs de calcul, oubli de facturer des services, perte d\'argent... Chaque mois, vous perdez des revenus.',
    },
    {
      icon: TrendingDown,
      title: 'Le manque de visibilité',
      desc: 'Vous ne savez jamais combien vous gagnez vraiment chaque mois. Pas de rapports, pas de graphiques, pas de décisions éclairées.',
    },
    {
      icon: Users,
      title: 'Le suivi du personnel',
      desc: 'Impossible de savoir qui a fait quoi, les horaires, les responsabilités... Votre équipe travaille sans supervision efficace.',
    },
    {
      icon: PhoneCall,
      title: 'Les plaintes clients',
      desc: 'Clients qui attendent trop longtemps, infos perdues, mauvaise expérience... Votre réputation en souffre.',
    },
  ]

  return (
    <section ref={ref} className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 mb-6 rounded-full bg-red-100 text-red-600 text-sm font-semibold tracking-wide uppercase">
            Les problèmes du quotidien
          </span>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-elegant-black mb-4">
            Vous en avez assez de...
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Ces problèmes que vivent chaque jour les hôteliers ivoiriens
          </p>
        </div>

        {/* Grid 2x3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {problems.map((p, i) => (
            <div
              key={i}
              className={`group relative p-6 rounded-2xl border border-gray-100 hover:border-red-200 bg-white hover:bg-red-50/50 transition-all duration-300 hover:shadow-lg cursor-default ${
                visible
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-8'
              }`}
              style={{
                transitionDelay: `${i * 100}ms`,
                transitionProperty: 'opacity, transform, background-color, border-color, box-shadow',
              }}
            >
              {/* Decorative corner accent on hover */}
              <div className="absolute top-0 right-0 w-16 h-16 rounded-tr-2xl rounded-bl-3xl bg-red-100/0 group-hover:bg-red-100/60 transition-colors duration-300 -z-10" />

              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mb-4 group-hover:bg-red-200 group-hover:scale-110 transition-all duration-300">
                <p.icon className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-elegant-black mb-2 group-hover:text-red-700 transition-colors">
                {p.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed group-hover:text-gray-600 transition-colors">
                {p.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Transition CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-gold/10 via-gold/20 to-gold/10 rounded-full border border-gold/20">
            <Sparkles className="h-5 w-5 text-gold animate-pulse" />
            <span className="font-semibold text-ivory">
              OGOUTEL_Prestige résout TOUS ces problèmes
            </span>
            <Sparkles className="h-5 w-5 text-gold animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  )
}
