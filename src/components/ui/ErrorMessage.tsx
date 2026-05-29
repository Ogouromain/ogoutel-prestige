'use client';

// ============================================
// OGOUTEL_Prestige - ErrorMessage
// Composant d'affichage d'erreur réutilisable
// Avec icône, message et bouton de réessai
// ============================================

import { cn } from '@/lib/utils';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorMessageProps {
  /** Titre de l'erreur */
  title?: string;
  /** Message détaillé */
  message: string;
  /** Fonction de réessai */
  onRetry?: () => void;
  /** Texte du bouton de réessai */
  retryLabel?: string;
  /** Variante : default | compact */
  variant?: 'default' | 'compact';
  /** Classes additionnelles */
  className?: string;
}

export function ErrorMessage({
  title = 'Une erreur est survenue',
  message,
  onRetry,
  retryLabel = 'Réessayer',
  variant = 'default',
  className,
}: ErrorMessageProps) {
  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3',
          className
        )}
        role="alert"
      >
        <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
        <p className="text-sm text-red-700">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-auto text-red-600 hover:text-red-800 transition-colors"
            aria-label={retryLabel}
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm',
        className
      )}
      role="alert"
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
        <AlertCircle className="h-7 w-7 text-red-500" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-[#0A0A0A]">{title}</h3>
      <p className="mb-6 max-w-md text-sm text-gray-500">{message}</p>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <RefreshCw className="h-4 w-4" />
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
