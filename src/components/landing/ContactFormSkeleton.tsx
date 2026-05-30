'use client'

import { Skeleton } from '@/components/ui/skeleton'

/**
 * ContactFormSkeleton — Placeholder qui imite la structure de la section contact :
 * en-tête centré (titre + sous-titre) + grille 3/2 avec formulaire à gauche
 * (champs, sélecteur de plan, bouton) et carte de contact à droite.
 */
export function ContactFormSkeleton() {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Skeleton className="h-10 md:h-12 w-80 md:w-[26rem] mx-auto mb-4" />
          <Skeleton className="h-5 w-80 mx-auto" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Form skeleton — 3 cols */}
          <div className="lg:col-span-3 space-y-5">
            {/* Row 1: name + email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            </div>

            {/* Row 2: tel + hotel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            </div>

            {/* Row 3: ville + quartier */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            </div>

            {/* Chambres */}
            <div className="sm:w-1/2 space-y-2">
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>

            {/* Plan radio cards */}
            <div className="space-y-3">
              <Skeleton className="h-4 w-28" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-xl border-2 border-gray-200 p-4 text-center">
                    <Skeleton className="h-5 w-20 mx-auto" />
                    <Skeleton className="h-4 w-28 mx-auto mt-2" />
                    {i === 1 && <Skeleton className="h-3 w-24 mx-auto mt-2" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-20 w-full rounded-md" />
            </div>

            {/* Submit button */}
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>

          {/* Contact card skeleton — 2 cols */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl p-8 sticky top-24 bg-gradient-to-br from-ivory to-ivory-light">
              <div className="space-y-6">
                <Skeleton className="h-7 w-32 rounded-md" />
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-5 w-5 rounded-sm" />
                      <Skeleton className={`h-4 ${i === 0 ? 'w-40' : i === 1 ? 'w-36' : 'w-32'}`} />
                    </div>
                  ))}
                </div>
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
