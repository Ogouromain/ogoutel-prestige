'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, FileText, Key, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formaterPrix } from '@/lib/constants';
import type { AbonnementDemande } from '@/types';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface SuperAdminStats {
  totalHotels: number;
  activeHotels: number;
  pendingRequests: number;
  codesThisMonth: number;
  estimatedRevenue: number;
  recentRequests: AbonnementDemande[];
  recentHotels: any[];
  subscriptionsByPlan: { plan: string; count: number }[];
}

interface StatsCardsProps {
  stats: SuperAdminStats | null;
  isLoading?: boolean;
}

// ─── Animated Counter ──────────────────────────────────────────────────────────

function AnimatedCounter({
  value,
  duration = 1500,
  prefix = '',
  suffix = '',
}: {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef<number | null>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    startRef.current = null;

    const animate = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [value, duration]);

  return (
    <span>
      {prefix}
      {display.toLocaleString('fr-FR')}
      {suffix}
    </span>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────

interface StatCardData {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  change?: number;
  changeLabel?: string;
}

function StatCard({ data, isLoading }: { data: StatCardData; isLoading: boolean }) {
  if (isLoading) {
    return (
      <Card className="rounded-xl border-0 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <Skeleton className="size-10 rounded-lg" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="mt-3 h-8 w-24" />
          <Skeleton className="mt-1 h-4 w-32" />
        </CardContent>
      </Card>
    );
  }

  const isPositive = (data.change ?? 0) >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="rounded-xl border-0 shadow-sm transition-shadow hover:shadow-md">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div
              className={cn(
                'flex size-10 items-center justify-center rounded-lg',
                data.iconBg
              )}
            >
              <span className={data.iconColor}>{data.icon}</span>
            </div>
            {data.change !== undefined && (
              <div
                className={cn(
                  'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                  isPositive
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-red-50 text-red-600'
                )}
              >
                {isPositive ? (
                  <TrendingUp className="size-3" />
                ) : (
                  <TrendingDown className="size-3" />
                )}
                <span>{Math.abs(data.change)}%</span>
              </div>
            )}
          </div>

          <div className="mt-3">
            <p className="text-2xl font-bold tracking-tight text-[#0A0A0A]">
              {data.value === 0 ? (
                <span className="text-gray-400">0</span>
              ) : (
                <AnimatedCounter
                  value={data.value}
                  prefix={data.prefix}
                  suffix={data.suffix}
                />
              )}
            </p>
            <p className="mt-0.5 text-sm text-gray-500">{data.label}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function StatsCards({ stats, isLoading }: StatsCardsProps) {
  const cards: StatCardData[] = [
    {
      label: 'Hôtels Actifs',
      value: stats?.activeHotels ?? 0,
      icon: <Building2 className="size-5" />,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      change: stats?.totalHotels && stats?.activeHotels
        ? Math.round((stats.activeHotels / stats.totalHotels) * 100)
        : undefined,
      changeLabel: 'total',
    },
    {
      label: 'Demandes en Attente',
      value: stats?.pendingRequests ?? 0,
      icon: <FileText className="size-5" />,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
    {
      label: 'Codes Générés ce Mois',
      value: stats?.codesThisMonth ?? 0,
      icon: <Key className="size-5" />,
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
    {
      label: 'Revenus Estimés',
      value: stats?.estimatedRevenue ?? 0,
      prefix: '',
      suffix: '',
      icon: <DollarSign className="size-5" />,
      iconBg: 'bg-[#D4AF37]/10',
      iconColor: 'text-[#D4AF37]',
    },
  ];

  // For revenue card, format the display value
  const formatRevenueDisplay = (val: number) => {
    if (val === 0) return 0;
    // Abbreviate for card display
    if (val >= 1_000_000) {
      return Math.round(val / 1_000_000);
    }
    if (val >= 1_000) {
      return Math.round(val / 1_000);
    }
    return val;
  };

  const revenueSuffix = stats?.estimatedRevenue
    ? stats.estimatedRevenue >= 1_000_000
      ? 'M FCFA'
      : stats.estimatedRevenue >= 1_000
        ? 'K FCFA'
        : ' FCFA'
    : ' FCFA';

  // Override the revenue card display
  const displayCards = cards.map((card, idx) => {
    if (idx === 3) {
      return {
        ...card,
        value: formatRevenueDisplay(stats?.estimatedRevenue ?? 0),
        suffix: revenueSuffix,
      };
    }
    return card;
  });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {displayCards.map((card) => (
        <StatCard
          key={card.label}
          data={card}
          isLoading={isLoading ?? false}
        />
      ))}
    </div>
  );
}

export type { SuperAdminStats };
