'use client';

// ============================================
// OGOUTEL_Prestige - LoadingSpinner
// Composant de chargement réutilisable
// Tailles : sm | md | lg | xl
// Variantes : default (gold) | white | dark
// ============================================

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';
type SpinnerVariant = 'default' | 'white' | 'dark';

interface LoadingSpinnerProps {
  /** Taille du spinner */
  size?: SpinnerSize;
  /** Variante de couleur */
  variant?: SpinnerVariant;
  /** Texte optionnel affiché sous le spinner */
  label?: string;
  /** Plein écran */
  fullScreen?: boolean;
  /** Classes additionnelles */
  className?: string;
}

const SIZE_MAP: Record<SpinnerSize, string> = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-10 h-10',
  xl: 'w-16 h-16',
};

const VARIANT_MAP: Record<SpinnerVariant, string> = {
  default: 'text-[#D4AF37]',
  white: 'text-white',
  dark: 'text-[#0A0A0A]',
};

export function LoadingSpinner({
  size = 'md',
  variant = 'default',
  label,
  fullScreen = false,
  className,
}: LoadingSpinnerProps) {
  const spinner = (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2
        className={cn(
          SIZE_MAP[size],
          VARIANT_MAP[variant],
          'animate-spin'
        )}
      />
      {label && (
        <p
          className={cn(
            'text-sm font-medium',
            variant === 'white' ? 'text-white/80' : 'text-gray-500'
          )}
        >
          {label}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
}

// ─── Version inline (sans flex) ──────────────────────────────────────────

interface LoadingSpinnerInlineProps {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  className?: string;
}

export function LoadingSpinnerInline({
  size = 'sm',
  variant = 'default',
  className,
}: LoadingSpinnerInlineProps) {
  return (
    <Loader2
      className={cn(SIZE_MAP[size], VARIANT_MAP[variant], 'animate-spin', className)}
    />
  );
}
