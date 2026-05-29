// ============================================
// OGOUTEL_Prestige - PageHeader
// En-tête de page réutilisable
// Titre + description + actions optionnelles
// ============================================

import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  /** Titre principal */
  title: string;
  /** Description sous le titre */
  description?: string;
  /** Actions à droite (boutons, etc.) */
  actions?: ReactNode;
  /** Retour en arrière */
  backHref?: string;
  /** Icône décorative */
  icon?: ReactNode;
  /** Classes additionnelles */
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  backHref,
  icon,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#D4AF37]/10">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-[#0A0A0A]">{title}</h1>
          {description && (
            <p className="mt-0.5 text-sm text-gray-500">{description}</p>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-2 sm:flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
