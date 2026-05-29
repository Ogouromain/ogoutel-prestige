'use client';

// ============================================
// OGOUTEL_Prestige - SectionLoading
// Composant de squelette de chargement réutilisable
// Simule la structure d'une section avec en-tête et cartes
// ============================================

import { Skeleton } from '@/components/ui/skeleton';

interface SectionLoadingProps {
  /** Nombre de lignes de squelette (défaut : 3) */
  lines?: number;
  /** Afficher un en-tête section (défaut : true) */
  hasHeader?: boolean;
  /** Nombre de cartes squelettes (optionnel) */
  hasCards?: number;
  /** Classes additionnelles */
  className?: string;
}

/**
 * SectionLoading — Squelette de chargement réutilisable qui simule
 * la structure typique d'une section du tableau de bord.
 */
export function SectionLoading({
  lines = 3,
  hasHeader = true,
  hasCards,
  className,
}: SectionLoadingProps) {
  return (
    <div className={`space-y-6 ${className ?? ''}`}>
      {/* En-tête de section */}
      {hasHeader && (
        <div className="space-y-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-72" />
        </div>
      )}

      {/* Cartes squelettes */}
      {hasCards !== undefined && hasCards > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: hasCards }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      )}

      {/* Lignes de contenu */}
      {Array.from({ length: lines }).map((_, i) => {
        // Largeurs variables pour un rendu plus naturel
        const widths = ['w-full', 'w-5/6', 'w-4/5', 'w-3/4', 'w-11/12'];
        const height = i === lines - 1 && !hasCards ? 'h-4' : 'h-4';

        return (
          <div key={i} className="space-y-3">
            <Skeleton className={`${height} ${widths[i % widths.length]}`} />
          </div>
        );
      })}
    </div>
  );
}
