'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'

const PLANS = [
  {
    name: 'Basique',
    badge: 'Pour démarrer',
    badgeColor: 'bg-gray-100 text-gray-600',
    priceMonthly: 25000,
    priceAnnual: 20000,
    borderColor: 'border-gray-200',
    popular: false,
    features: [
      '1 Administrateur',
      '1 Réceptionniste',
      "Jusqu'à 20 chambres",
      'Gestion des réservations',
      'Facturation de base',
      'Support WhatsApp',
    ],
  },
  {
    name: 'Standard',
    badge: '⭐ Le plus populaire',
    badgeColor: 'bg-gold/10 text-gold-dark',
    priceMonthly: 50000,
    priceAnnual: 40000,
    borderColor: 'border-gold',
    popular: true,
    features: [
      '1 Administrateur',
      '2 Gérants + 3 Réceptionnistes',
      "Jusqu'à 50 chambres",
      'Tout du plan Basique',
      'Rapports avancés',
      'Export des données',
      'Support prioritaire',
    ],
  },
  {
    name: 'Premium',
    badge: '🏆 Pour les grands hôtels',
    badgeColor: 'bg-purple-100 text-purple-600',
    priceMonthly: 95000,
    priceAnnual: 76000,
    borderColor: 'border-purple-300',
    popular: false,
    features: [
      '1 Administrateur',
      '5 Gérants + 10 Réceptionnistes',
      'Chambres illimitées',
      'Tout du plan Standard',
      'Analytiques avancées',
      'Rapports personnalisés',
      'Support dédié 24/7',
      'Formation incluse (2h)',
    ],
  },
]

function formatPrice(price: number) {
  return new Intl.NumberFormat('fr-FR').format(price)
}

export function PricingSection() {
  const [annual, setAnnual] = useState(false)

  const scrollToContact = () => {
    document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section id="tarifs" className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 mb-6 rounded-full bg-gold/10 text-gold text-sm font-semibold tracking-wide uppercase">
            Tarifs
          </span>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-elegant-black mb-4">
            Des tarifs adaptés à votre hôtel
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Choisissez le plan qui correspond à la taille de votre
            établissement
          </p>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-4 mb-14">
          <span
            className={`text-sm font-semibold transition-colors ${
              !annual ? 'text-elegant-black' : 'text-gray-400'
            }`}
          >
            Mensuel
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={annual}
            onClick={() => setAnnual((v) => !v)}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 ${
              annual ? 'bg-gold' : 'bg-gray-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ${
                annual ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
          <span
            className={`text-sm font-semibold transition-colors ${
              annual ? 'text-elegant-black' : 'text-gray-400'
            }`}
          >
            Annuel{' '}
            <span className="ml-1 inline-flex items-center rounded-full bg-ivory/10 px-2 py-0.5 text-xs font-bold text-ivory">
              -20%
            </span>
          </span>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {PLANS.map((plan) => {
            const price = annual ? plan.priceAnnual : plan.priceMonthly
            const periodLabel = annual ? '/mois (facturé annuellement)' : '/mois'

            return (
              <div
                key={plan.name}
                className={`
                  relative rounded-2xl border-2 p-8 bg-white transition-all duration-300
                  hover:shadow-xl
                  ${plan.borderColor}
                  ${plan.popular ? 'md:scale-105 md:shadow-2xl' : 'hover:-translate-y-1'}
                `}
              >
                {/* Popular subtle background glow */}
                {plan.popular && (
                  <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-gold/5 to-transparent" />
                )}

                <div className="relative z-10">
                  {/* Badge */}
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-semibold mb-4 ${plan.badgeColor}`}
                  >
                    {plan.badge}
                  </span>

                  {/* Plan name */}
                  <h3 className="font-heading text-2xl font-bold text-elegant-black mb-2">
                    {plan.name}
                  </h3>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-elegant-black">
                        {formatPrice(price)}
                      </span>
                      <span className="text-sm text-gray-500">FCFA</span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{periodLabel}</p>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-gray-200 mb-6" />

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/10">
                          <Check className="h-3 w-3 text-gold-dark" strokeWidth={3} />
                        </span>
                        <span className="text-sm text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <button
                    onClick={scrollToContact}
                    className={`
                      w-full rounded-xl py-3 px-6 text-sm font-semibold transition-all duration-200 cursor-pointer
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gold
                      ${
                        plan.popular
                          ? 'bg-gold text-elegant-black hover:bg-gold-dark shadow-lg shadow-gold/20 hover:shadow-xl hover:shadow-gold/30'
                          : plan.name === 'Premium'
                            ? 'bg-ivory text-white hover:bg-ivory-light shadow-lg shadow-ivory/20'
                            : 'border-2 border-gray-200 text-elegant-black hover:border-gold hover:text-gold-dark bg-transparent'
                      }
                    `}
                  >
                    Choisir {plan.name}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom accent line */}
        <div className="mt-16 flex justify-center">
          <div className="h-1 w-24 rounded-full bg-gradient-to-r from-transparent via-gold to-transparent" />
        </div>
      </div>
    </section>
  )
}
