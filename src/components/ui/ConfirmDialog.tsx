'use client';

// ============================================
// OGOUTEL_Prestige - ConfirmDialog
// Modal de confirmation avant actions destructives
// Variantes : danger (rouge), warning (orange), info (bleu)
// Utilise shadcn/ui AlertDialog
// ============================================

import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, AlertTriangle, Trash2, Info } from 'lucide-react';

type DialogVariant = 'danger' | 'warning' | 'info';

interface ConfirmDialogProps {
  /** Le dialog est ouvert */
  open: boolean;
  /** Callback changement d'état */
  onOpenChange: (open: boolean) => void;
  /** Titre */
  title: string;
  /** Message de description */
  description: string;
  /** Callback confirmation */
  onConfirm: () => void | Promise<void>;
  /** Texte du bouton confirmer */
  confirmLabel?: string;
  /** Texte du bouton annuler */
  cancelLabel?: string;
  /** Variante de couleur */
  variant?: DialogVariant;
  /** Chargement pendant la confirmation */
  isLoading?: boolean;
  /** Afficher l'icône dans le contenu */
  showIcon?: boolean;
  /** Contenu personnalisé supplémentaire */
  children?: React.ReactNode;
}

const VARIANT_CONFIG: Record<DialogVariant, {
  confirmClass: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  defaultConfirmLabel: string;
}> = {
  danger: {
    confirmClass: 'bg-red-600 hover:bg-red-700 text-white border-red-600',
    icon: Trash2,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    defaultConfirmLabel: 'Supprimer',
  },
  warning: {
    confirmClass: 'bg-[#F77F00] hover:bg-[#E07000] text-white border-[#F77F00]',
    icon: AlertTriangle,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    defaultConfirmLabel: 'Confirmer',
  },
  info: {
    confirmClass: 'bg-[#1B4332] hover:bg-[#15362A] text-white border-[#1B4332]',
    icon: Info,
    iconBg: 'bg-sky-100',
    iconColor: 'text-sky-600',
    defaultConfirmLabel: 'Continuer',
  },
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmLabel,
  cancelLabel = 'Annuler',
  variant = 'danger',
  isLoading = false,
  showIcon = true,
  children,
}: ConfirmDialogProps) {
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex flex-col items-center text-center sm:text-left sm:flex-row sm:items-start sm:text-left">
            {showIcon && (
              <div className={cn('mb-4 flex h-12 w-12 items-center justify-center rounded-full sm:mb-0 sm:mr-4 sm:flex-shrink-0', config.iconBg)}>
                <Icon className={cn('h-6 w-6', config.iconColor)} />
              </div>
            )}
            <div className="flex-1">
              <AlertDialogTitle className="text-lg">{title}</AlertDialogTitle>
              <AlertDialogDescription className="mt-2 text-sm leading-relaxed">
                {description}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        {children && <div className="mt-2">{children}</div>}

        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel disabled={isLoading}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isLoading}
            className={cn('gap-2', config.confirmClass)}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement...
              </>
            ) : (
              <>
                {confirmLabel ?? config.defaultConfirmLabel}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
