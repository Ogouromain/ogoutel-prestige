'use client'

import { useState, useEffect, useRef } from 'react'
import { Star, Quote } from 'lucide-react'

interface Testimonial {
  name: string
  hotel: string
  initials: string
  avatarBg: string
  rating: number
  text: string
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Konan Adjoumani',
    hotel: 'Hôtel Le Palmier, Bouaké',
    initials: 'KA',
    avatarBg: 'bg-gold',
    rating: 5,
    text: "Depuis qu'on utilise OGOUTEL_Prestige, plus aucune double réservation ! Mon réceptionniste gère tout en 5 minutes. Je recommande à tous les hôteliers de Côte d'Ivoire.",
  },
  {
    name: 'Akissi Marie-France',
    hotel: 'Résidence Étoile d\'Or, Abidjan-Cocody',
    initials: 'AM',
    avatarBg: 'bg-ivory',
    rating: 5,
    text: "Enfin une application faite pour nous ! En français, facile à utiliser, et le support répond toujours rapidement sur WhatsApp. Mes revenus ont augmenté de 30% grâce aux rapports.",
  },
  {
    name: 'Ouédraogo Seydou',
    hotel: 'Grand Hôtel du Centre, Yamoussoukro',
    initials: 'OS',
    avatarBg: 'bg-orange-ci',
    rating: 5,
    text: "J'hésitais à passer au numérique mais OGOUTEL_Prestige m'a convaincu. La formation incluse dans le premium est excellente. Mon équipe a appris en une journée !",
  },
]

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating
              ? 'fill-gold text-gold'
              : 'fill-gray-200 text-gray-200'
          }`}
        />
      ))}
    </div>
  )
}

export function TestimonialsSection() {
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

  return (
    <section
      id="temoignages"
      ref={ref}
      className="py-20 md:py-28 bg-[#F8F9FA]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 mb-6 rounded-full bg-gold/10 text-gold text-sm font-semibold tracking-wide uppercase">
            Témoignages
          </span>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-elegant-black mb-4">
            Ce que disent nos hôteliers
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Ils nous font confiance au quotidien pour gérer leur
            établissement
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={t.name}
              className={`
                relative rounded-2xl bg-white p-8 border border-gray-100
                hover:border-gold/20 hover:shadow-xl transition-all duration-300
                ${
                  visible
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-8'
                }
              `}
              style={{
                transitionDelay: `${i * 120}ms`,
                transitionProperty:
                  'opacity, transform, border-color, box-shadow',
              }}
            >
              {/* Quote icon */}
              <Quote className="absolute top-6 right-6 h-8 w-8 text-gold/15" />

              {/* Stars */}
              <StarRating rating={t.rating} />

              {/* Text */}
              <p className="mt-5 mb-6 text-gray-600 text-sm leading-relaxed italic">
                &ldquo;{t.text}&rdquo;
              </p>

              {/* Divider */}
              <div className="h-px bg-gray-100 mb-5" />

              {/* Author */}
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div
                  className={`
                    flex h-11 w-11 shrink-0 items-center justify-center rounded-full
                    text-sm font-bold text-white shadow-md
                    ${t.avatarBg}
                  `}
                >
                  {t.initials}
                </div>

                <div>
                  <p className="text-sm font-semibold text-elegant-black">
                    {t.name}
                  </p>
                  <p className="text-xs text-gray-500">{t.hotel}</p>
                </div>
              </div>
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
