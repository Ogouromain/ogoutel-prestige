'use client';

// ============================================
// OGOUTEL_Prestige - SuccessMessage
// Composant d'affichage de succès réutilisable
// Avec icône, message et bouton d'action optionnel
// ============================================

import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SuccessMessageProps {
  /** Titre du succès */
  title?: string;
  /** Message détaillé */
  message: string;
  /** Bouton d'action */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Variante : default | compact */
  variant?: 'default' | 'compact';
  /** Classes additionnelles */
  className?: string;
}

export function SuccessMessage({
  title = 'Opération réussie',
  message,
  action,
  variant = 'default',
  className,
}: SuccessMessageProps) {
  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3',
          className
        )}
        role="status"
      >
        <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-500" />
        <p className="text-sm text-emerald-700">{message}</p>
        {action && (
          <button
            onClick={action.onClick}
            className="ml-auto font-medium text-emerald-600 hover:text-emerald-800 transition-colors"
          >
            {action.label}
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-emerald-200 bg-white p-8 text-center shadow-sm',
        className
      )}
      role="status"
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
        <CheckCircle2 className="h-7 w-7 text-emerald-500" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-[#0A0A0A]">{title}</h3>
      <p className="mb-6 max-w-md text-sm text-gray-500">{message}</p>
      {action && (
        <Button className="bg-[#1B4332] hover:bg-[#1B4332]/90 text-white">
          {action.label}
        </Button>
      )}
    </div>
  );
}
