'use client'

import { useState, useEffect } from 'react'
import { ArrowRight, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'

/* ──────────── animated counter hook ──────────── */
function useCountUp(target: number, duration = 2000) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const step = target / (duration / 16)
    let current = 0
    const timer = setInterval(() => {
      current += step
      if (current >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration])

  return count
}

/* ──────────── stat counter component ──────────── */
function StatCounter({
  value,
  suffix,
  label,
}: {
  value: number
  suffix: string
  label: string
}) {
  const count = useCountUp(value)
  return (
    <div className="text-center">
      <p className="text-3xl md:text-4xl font-bold text-white animate-count-up">
        {count}
        {suffix}
      </p>
      <p className="mt-1 text-sm text-gray-300">{label}</p>
    </div>
  )
}

/* ──────────── mini dashboard card ──────────── */
function DashboardCard() {
  const occupancy = 60
  const bars = [45, 65, 40, 80, 55]
  const days = ['Lu', 'Ma', 'Me', 'Je', 'Ve']

  return (
    <div className="animate-float rounded-2xl border border-white/10 bg-white/[0.07] backdrop-blur-xl p-6 shadow-2xl w-full max-w-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/20 text-xl">
            🏨
          </span>
          <div>
            <p className="text-white font-semibold text-sm">Hotel Le Palmier</p>
            <p className="text-gray-400 text-xs">Abidjan, Cocody</p>
          </div>
        </div>
        <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
          En ligne
        </span>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/10 mb-5" />

      {/* Occupancy */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-300">Chambres occupées</p>
          <p className="text-sm font-semibold text-white">12 / 20</p>
        </div>
        <div className="h-2.5 w-full rounded-full bg-white/10">
          <div
            className="h-2.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#F77F00] transition-all duration-1000"
            style={{ width: `${occupancy}%` }}
          />
        </div>
        <p className="mt-1 text-right text-xs text-gray-400">{occupancy}%</p>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/10 mb-5" />

      {/* Revenue */}
      <div className="mb-5">
        <p className="text-sm text-gray-300 mb-1">Revenus du jour</p>
        <p className="text-2xl font-bold text-gold">
          1 250 000 <span className="text-sm font-normal text-gray-400">FCFA</span>
        </p>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/10 mb-5" />

      {/* Mini bar chart */}
      <div>
        <p className="text-sm text-gray-300 mb-3">Réservations de la semaine</p>
        <div className="flex items-end justify-between gap-2 h-20">
          {bars.map((height, i) => (
            <div key={i} className="flex flex-col items-center gap-1 flex-1">
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-[#D4AF37]/60 to-[#D4AF37] transition-all duration-700"
                style={{ height: `${(height / 100) * 64}px` }}
              />
              <span className="text-[10px] text-gray-500">{days[i]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ──────────── hero section ──────────── */
export function HeroSection() {
  const scrollTo = (href: string) => {
    const el = document.querySelector(href)
    el?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section
      id="hero"
      className="relative min-h-screen pt-16 overflow-hidden"
      style={{
        background:
          'linear-gradient(135deg, #0A0A0A 0%, #0A0A0A 40%, #1B4332 100%)',
      }}
    >
      {/* Subtle radial glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 left-1/3 h-[600px] w-[600px] rounded-full bg-[#D4AF37]/[0.04] blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-[#1B4332]/20 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col items-center px-4 sm:px-6 lg:px-8">
        <div className="grid w-full flex-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* ── Left: Content ── */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left animate-fade-in-up">
            {/* Badge */}
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-1.5 text-sm font-medium text-[#D4AF37]">
              🇨🇮 Conçu pour les hôteliers ivoiriens
            </span>

            {/* Heading */}
            <h1 className="font-heading leading-tight">
              <span className="block text-4xl font-bold text-white md:text-5xl lg:text-7xl">
                La Gestion Hôtelière
              </span>
              <span className="block mt-2 text-4xl font-bold md:text-5xl lg:text-7xl text-gold">
                Intelligente
              </span>
              <span className="block mt-2 text-4xl font-bold text-white md:text-5xl lg:text-7xl">
                pour la Côte d&apos;Ivoire
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-gray-300">
              Simplifiez la gestion de votre hôtel avec une plateforme tout-en-un
              pensée pour le marché ivoirien. Réservations, facturation,
              comptabilité — tout en un seul endroit.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button
                size="lg"
                onClick={() => scrollTo('#contact')}
                className="gap-2 rounded-lg bg-gold px-6 text-base font-semibold text-black hover:bg-[#c49e2e] transition-colors"
              >
                Démarrer maintenant
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => scrollTo('#fonctionnalites')}
                className="gap-2 rounded-lg border-white/30 bg-transparent px-6 text-base text-white hover:bg-white/10 transition-colors"
              >
                <Play className="h-4 w-4" />
                Voir comment ça marche
              </Button>
            </div>

            {/* Stat counters */}
            <div className="mt-12 flex gap-10 sm:gap-14">
              <StatCounter value={50} suffix="+" label="Hôtels partenaires" />
              <StatCounter value={500} suffix="+" label="Réservations / jour" />
              <StatCounter value={98} suffix="%" label="Satisfaction client" />
            </div>
          </div>

          {/* ── Right: Dashboard card ── */}
          <div className="hidden lg:flex justify-center items-center">
            <DashboardCard />
          </div>
        </div>
      </div>

      {/* Bottom gradient fade into next section */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#F8F9FA] to-transparent" />
    </section>
  )
}
