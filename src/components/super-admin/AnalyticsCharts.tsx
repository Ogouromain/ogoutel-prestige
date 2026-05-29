'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import { BarChart3, RefreshCw, AlertTriangle, Building2, TrendingUp } from 'lucide-react';

import { cn, formatCFA } from '@/lib/utils';
import { PLANS_ABONNEMENT } from '@/lib/constants';
import type { PlanId } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface HotelParMois {
  mois: string;
  count: number;
}

interface RepartitionPlan {
  plan: string;
  count: number;
  revenue: number;
}

interface VilleCouverte {
  ville: string;
  count: number;
}

interface TopHotel {
  id: string;
  nom: string;
  ville: string;
  plan: string;
  chambres: number;
  taux_occupation: number;
  revenus_mois: number;
}

interface RevenuMensuel {
  mois: string;
  montant: number;
}

interface AnalyticsData {
  hotelsParMois: HotelParMois[];
  repartitionPlans: RepartitionPlan[];
  villesCouvertes: VilleCouverte[];
  topHotels: TopHotel[];
  revenusMensuels: RevenuMensuel[];
}

// ─── Color Constants ──────────────────────────────────────────────────────────

const COLORS = {
  gold: '#D4AF37',
  goldLight: '#F5EED6',
  greenCI: '#1B4332',
  greenCILight: '#D8F3DC',
  orange: '#F77F00',
  gray: '#9CA3AF',
} as const;

const PLAN_COLORS: Record<string, string> = {
  basique: '#9CA3AF',
  standard: '#10B981',
  premium: '#D4AF37',
};

// ─── Plan label helper ─────────────────────────────────────────────────────────

function getPlanNom(plan: string): string {
  return PLANS_ABONNEMENT[plan as PlanId]?.nom ?? plan;
}

// ─── Custom Pie Label ─────────────────────────────────────────────────────────

interface PieLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}

function renderPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: PieLabelProps) {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={13}
      fontWeight={600}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

// ─── Custom Tooltip ────────────────────────────────────────────────────────────

function RevenuTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
      <p className="mb-1 text-sm font-semibold text-gray-800">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm text-gray-600">
          <span className="font-medium" style={{ color: COLORS.gold }}>
            {formatCFA(entry.value)}
          </span>
        </p>
      ))}
    </div>
  );
}

// ─── Occupancy badge ──────────────────────────────────────────────────────────

function OccupationBadge({ taux }: { taux: number }) {
  let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'secondary';
  let colorClass = 'bg-gray-100 text-gray-700';

  if (taux >= 80) {
    variant = 'default';
    colorClass = 'bg-emerald-100 text-emerald-700 border border-emerald-200';
  } else if (taux >= 60) {
    variant = 'secondary';
    colorClass = 'bg-amber-100 text-amber-700 border border-amber-200';
  } else {
    variant = 'destructive';
    colorClass = 'bg-red-100 text-red-700 border border-red-200';
  }

  return (
    <Badge className={cn('font-semibold', colorClass)}>
      {taux}%
    </Badge>
  );
}

// ─── Plan badge ───────────────────────────────────────────────────────────────

function PlanBadge({ plan }: { plan: string }) {
  const colorMap: Record<string, string> = {
    basique: 'bg-gray-100 text-gray-700 border border-gray-200',
    standard: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    premium: 'bg-amber-50 text-amber-700 border border-amber-200',
  };

  return (
    <Badge className={cn('font-medium', colorMap[plan] ?? 'bg-gray-100 text-gray-700')}>
      {getPlanNom(plan)}
    </Badge>
  );
}

// ─── Chart Skeleton ───────────────────────────────────────────────────────────

function ChartSkeleton() {
  return (
    <Card className="rounded-xl border-0 shadow-sm">
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-1 h-4 w-56" />
      </CardHeader>
      <CardContent className="pb-6">
        <Skeleton className="h-[280px] w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

// ─── Table Skeleton ───────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <Card className="rounded-xl border-0 shadow-sm">
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-56" />
        <Skeleton className="mt-1 h-4 w-72" />
      </CardHeader>
      <CardContent className="pb-6">
        <div className="space-y-3">
          <Skeleton className="h-10 w-full rounded-lg" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Chart 1: Nouveaux hôtels par mois ─────────────────────────────────────────

function HotelsParMoisChart({ data }: { data: HotelParMois[] }) {
  return (
    <Card className="rounded-xl border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-[#0A0A0A]">
          Nouveaux hôtels par mois
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-6">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
            <XAxis
              dataKey="mois"
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={{ stroke: '#E5E7EB' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                fontSize: '13px',
              }}
              cursor={{ fill: 'rgba(212,175,55,0.08)' }}
            />
            <Bar dataKey="count" name="Hôtels" fill={COLORS.gold} radius={[6, 6, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ─── Chart 2: Répartition par plan (Donut) ─────────────────────────────────────

function RepartitionPlansChart({ data }: { data: RepartitionPlan[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <Card className="rounded-xl border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-[#0A0A0A]">
          Répartition par plan
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-6">
        <div className="flex flex-col items-center gap-4 lg:flex-row lg:gap-8">
          <ResponsiveContainer width="100%" height={220} className="max-w-[280px]">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={3}
                dataKey="count"
                nameKey="plan"
                label={renderPieLabel}
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={PLAN_COLORS[entry.plan] ?? COLORS.gray}
                    stroke="none"
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${value} hôtels (${total > 0 ? ((value / total) * 100).toFixed(0) : 0}%)`,
                  getPlanNom(name),
                ]}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  fontSize: '13px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="flex flex-col gap-3">
            {data.map((entry) => (
              <div key={entry.plan} className="flex items-center gap-3">
                <div
                  className="size-3 rounded-full shrink-0"
                  style={{ backgroundColor: PLAN_COLORS[entry.plan] ?? COLORS.gray }}
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-[#0A0A0A]">
                    {getPlanNom(entry.plan)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {entry.count} hôtels &middot; {formatCFA(entry.revenue)}/mois
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Chart 3: Villes couvertes (Horizontal Bar) ────────────────────────────────

function VillesCouvertesChart({ data }: { data: VilleCouverte[] }) {
  const sorted = [...data].sort((a, b) => b.count - a.count).slice(0, 10);

  return (
    <Card className="rounded-xl border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-[#0A0A0A]">
          Villes couvertes
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-6">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={sorted}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={{ stroke: '#E5E7EB' }}
              tickLine={false}
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="ville"
              tick={{ fontSize: 12, fill: '#374151' }}
              axisLine={false}
              tickLine={false}
              width={90}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                fontSize: '13px',
              }}
              cursor={{ fill: 'rgba(27,67,50,0.06)' }}
              formatter={(value: number) => [`${value} hôtels`, 'Hôtels']}
            />
            <Bar dataKey="count" fill={COLORS.greenCI} radius={[0, 6, 6, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ─── Chart 4: Revenus mensuels (Area Chart) ────────────────────────────────────

function RevenusMensuelsChart({ data }: { data: RevenuMensuel[] }) {
  return (
    <Card className="rounded-xl border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-[#0A0A0A]">
          Revenus mensuels
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-6">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.gold} stopOpacity={0.3} />
                <stop offset="95%" stopColor={COLORS.gold} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
            <XAxis
              dataKey="mois"
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={{ stroke: '#E5E7EB' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value: number) => {
                if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
                if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
                return String(value);
              }}
            />
            <Tooltip content={<RevenuTooltip />} />
            <Area
              type="monotone"
              dataKey="montant"
              name="Revenus"
              stroke={COLORS.gold}
              strokeWidth={2.5}
              fill="url(#goldGradient)"
              dot={{ r: 4, fill: COLORS.gold, stroke: '#fff', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: COLORS.gold, stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ─── Top Hotels Table ──────────────────────────────────────────────────────────

function TopHotelsTable({ hotels }: { hotels: TopHotel[] }) {
  const sorted = [...hotels].sort((a, b) => b.taux_occupation - a.taux_occupation);

  return (
    <Card className="rounded-xl border-0 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Building2 className="size-5 text-[#D4AF37]" />
          <CardTitle className="text-base font-semibold text-[#0A0A0A]">
            Top hôtels les plus actifs
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pb-6">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-100 hover:bg-transparent">
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Nom</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Ville</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Plan</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">Chambres</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">Taux occupation</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">Revenus/mois</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((hotel) => (
              <TableRow
                key={hotel.id}
                className="cursor-pointer border-b border-gray-50 transition-colors hover:bg-gray-50/50"
                onClick={() => {
                  // Placeholder: navigate to hotel detail
                }}
              >
                <TableCell className="font-medium text-[#0A0A0A]">{hotel.nom}</TableCell>
                <TableCell className="text-gray-600">{hotel.ville}</TableCell>
                <TableCell>
                  <PlanBadge plan={hotel.plan} />
                </TableCell>
                <TableCell className="text-center text-gray-700">{hotel.chambres}</TableCell>
                <TableCell className="text-center">
                  <OccupationBadge taux={hotel.taux_occupation} />
                </TableCell>
                <TableCell className="text-right font-medium text-[#0A0A0A]">
                  {formatCFA(hotel.revenus_mois)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-6 py-16">
      <div className="flex size-14 items-center justify-center rounded-full bg-gray-100">
        <BarChart3 className="size-7 text-gray-400" />
      </div>
      <p className="mt-4 text-base font-medium text-gray-600">
        Aucune donnée analytique disponible
      </p>
      <p className="mt-1 text-sm text-gray-400">
        Les données apparaîtront une fois les premiers hôtels enregistrés.
      </p>
    </div>
  );
}

// ─── Error State ───────────────────────────────────────────────────────────────

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-red-200 bg-red-50/30 px-6 py-16">
      <div className="flex size-14 items-center justify-center rounded-full bg-red-100">
        <AlertTriangle className="size-7 text-red-500" />
      </div>
      <p className="mt-4 text-base font-medium text-red-700">
        Erreur lors du chargement des analyses
      </p>
      <p className="mt-1 text-sm text-red-400">
        Une erreur inattendue est survenue. Veuillez réessayer.
      </p>
      <Button
        variant="outline"
        className="mt-4 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
        onClick={onRetry}
      >
        <RefreshCw className="mr-2 size-4" />
        Réessayer
      </Button>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AnalyticsCharts() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/super-admin/analytics');
      if (!res.ok) throw new Error('Erreur réseau');
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? 'Erreur inconnue');
      setData(json.data);
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, [refreshKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
        <TableSkeleton />
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return <ErrorState onRetry={handleRefresh} />;
  }

  // ── Empty state ──
  if (!data) {
    return <EmptyState />;
  }

  const hasData =
    (data.hotelsParMois?.length ?? 0) > 0 ||
    (data.repartitionPlans?.length ?? 0) > 0 ||
    (data.villesCouvertes?.length ?? 0) > 0;

  if (!hasData) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="size-5 text-[#D4AF37]" />
          <h3 className="text-lg font-semibold text-[#0A0A0A]">Analyses détaillées</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-700"
          onClick={handleRefresh}
        >
          <RefreshCw className="size-3.5" />
          Actualiser
        </Button>
      </div>

      {/* Charts grid: 2x2 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <HotelsParMoisChart data={data.hotelsParMois ?? []} />
        <RepartitionPlansChart data={data.repartitionPlans ?? []} />
        <VillesCouvertesChart data={data.villesCouvertes ?? []} />
        <RevenusMensuelsChart data={data.revenusMensuels ?? []} />
      </div>

      {/* Top hotels table */}
      {(data.topHotels?.length ?? 0) > 0 && (
        <TopHotelsTable hotels={data.topHotels} />
      )}
    </div>
  );
}
