'use client'

import { Skeleton } from '@/components/ui/skeleton'

/**
 * TestimonialsSkeleton — Placeholder qui imite la structure de la section témoignages :
 * en-tête centré (badge + titre + sous-titre) + grille de 3 cartes avec avatar,
 * étoiles, texte et ligne de séparation.
 */
export function TestimonialsSkeleton() {
  return (
    <section className="py-20 md:py-28 bg-[#F8F9FA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <Skeleton className="h-7 w-32 rounded-full mx-auto mb-6" />
          <Skeleton className="h-10 md:h-12 w-72 md:w-96 mx-auto mb-4" />
          <Skeleton className="h-5 w-64 mx-auto" />
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl bg-white p-8 border border-gray-100"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-5">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Skeleton key={j} className="h-4 w-4 rounded-sm" />
                ))}
              </div>

              {/* Text lines */}
              <div className="space-y-2 mb-6">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/4" />
              </div>

              {/* Divider */}
              <Skeleton className="h-px w-full mb-5" />

              {/* Author row */}
              <div className="flex items-center gap-3">
                <Skeleton className="h-11 w-11 rounded-full shrink-0" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-44" />
                </div>
              </div>
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
