'use client';

// ============================================
// OGOUTEL_Prestige - EmptyState
// Composant d'état vide réutilisable
// Affiché quand aucune donnée n'est disponible
// ============================================

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  /** Icône à afficher (composant Lucide ou autre) */
  icon?: ReactNode;
  /** Titre principal */
  title: string;
  /** Description détaillée */
  description: string;
  /** Bouton d'action optionnel (ex: "Ajouter une réservation") */
  action?: ReactNode;
  /** Classes additionnelles */
  className?: string;
}

/**
 * EmptyState — Affiche un état vide avec icône, titre, description
 * et bouton d'action optionnel. Utilisé quand aucune donnée n'existe
 * (aucune réservation, aucune chambre, etc.)
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center',
        className
      )}
    >
      {/* Icône */}
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>
      )}

      {/* Titre */}
      <h3 className="mb-2 text-lg font-semibold text-foreground">
        {title}
      </h3>

      {/* Description */}
      <p className="mb-6 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>

      {/* Bouton d'action */}
      {action && <div>{action}</div>}
    </div>
  );
}
