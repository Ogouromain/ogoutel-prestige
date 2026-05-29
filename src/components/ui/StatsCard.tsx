'use client';

// ============================================
// OGOUTEL_Prestige - StatsCard
// Carte statistique réutilisable
// Avec icône, valeur, tendance, animation
// ============================================

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  /** Icône du composant */
  icon: LucideIcon;
  /** Titre de la statistique */
  title: string;
  /** Valeur principale */
  value: string | number;
  /** Tendance (pourcentage, positif = hausse) */
  trend?: {
    value: number;
    label?: string;
  };
  /** Couleur de fond de l'icône */
  iconBgColor?: string;
  /** Couleur de l'icône */
  iconColor?: string;
  /** Texte secondaire (sous-titre) */
  subtitle?: string;
  /** Chargement */
  isLoading?: boolean;
  /** Clic sur la carte */
  onClick?: () => void;
  /** Classes additionnelles */
  className?: string;
}

export function StatsCard({
  icon: Icon,
  title,
  value,
  trend,
  iconBgColor = 'bg-[#D4AF37]/10',
  iconColor = 'text-[#D4AF37]',
  subtitle,
  isLoading = false,
  onClick,
  className,
}: StatsCardProps) {
  if (isLoading) {
    return (
      <div className={cn(
        'rounded-xl border border-gray-100 bg-white p-5 shadow-sm',
        className
      )}>
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 animate-pulse rounded-xl bg-gray-100" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
            <div className="h-6 w-16 animate-pulse rounded bg-gray-100" />
          </div>
        </div>
      </div>
    );
  }

  const trendColor =
    trend && trend.value > 0
      ? 'text-emerald-600'
      : trend && trend.value < 0
        ? 'text-red-500'
        : 'text-gray-400';

  const TrendIcon =
    trend && trend.value > 0
      ? TrendingUp
      : trend && trend.value < 0
        ? TrendingDown
        : Minus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onClick={onClick}
      className={cn(
        'rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md',
        onClick && 'cursor-pointer',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-[#0A0A0A]">
            {typeof value === 'number'
              ? new Intl.NumberFormat('fr-FR').format(value)
              : value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
          )}
        </div>
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-xl',
            iconBgColor
          )}
        >
          <Icon className={cn('h-6 w-6', iconColor)} />
        </div>
      </div>

      {/* Tendance */}
      {trend && (
        <div className="mt-3 flex items-center gap-1.5 border-t border-gray-50 pt-3">
          <div className={cn('flex items-center gap-0.5', trendColor)}>
            <TrendIcon className="h-3.5 w-3.5" />
            <span className="text-xs font-semibold">
              {trend.value > 0 ? '+' : ''}
              {trend.value}%
            </span>
          </div>
          {trend.label && (
            <span className="text-xs text-gray-400">{trend.label}</span>
          )}
        </div>
      )}
    </motion.div>
  );
}
