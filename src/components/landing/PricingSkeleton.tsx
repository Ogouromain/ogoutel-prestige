'use client'

import { Skeleton } from '@/components/ui/skeleton'

/**
 * PricingSkeleton — Placeholder qui imite la structure de la section tarifs :
 * en-tête centré (badge + titre + sous-titre) + toggle mensuel/annuel +
 * grille de 3 cartes avec badge, nom, prix, liste de features et bouton.
 */
export function PricingSkeleton() {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <Skeleton className="h-7 w-24 rounded-full mx-auto mb-6" />
          <Skeleton className="h-10 md:h-12 w-80 md:w-[28rem] mx-auto mb-4" />
          <Skeleton className="h-5 w-72 mx-auto" />
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-4 mb-14">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-7 w-12 rounded-full" />
          <Skeleton className="h-4 w-28" />
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={`
                rounded-2xl border-2 p-8 bg-white
                ${i === 1 ? 'border-gold md:scale-105 md:shadow-2xl' : 'border-gray-200'}
              `}
            >
              {/* Badge */}
              <Skeleton className="h-6 w-28 rounded-full mb-4" />

              {/* Plan name */}
              <Skeleton className="h-8 w-28 mb-2" />

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-4 w-10" />
                </div>
                <Skeleton className="h-4 w-40 mt-1" />
              </div>

              {/* Divider */}
              <Skeleton className="h-px w-full mb-6" />

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {Array.from({ length: i === 0 ? 6 : i === 1 ? 7 : 8 }).map((_, j) => (
                  <li key={j} className="flex items-start gap-3">
                    <Skeleton className="h-5 w-5 rounded-full shrink-0 mt-0.5" />
                    <Skeleton className="h-4 w-full" />
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          ))}
        </div>

        {/* Bottom accent */}
        <div className="mt-16 flex justify-center">
          <Skeleton className="h-1 w-24 rounded-full" />
        </div>
      </div>
    </section>
  )
}
