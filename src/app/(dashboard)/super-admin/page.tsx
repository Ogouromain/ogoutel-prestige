'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  RefreshCw,
  MessageSquare,
  ExternalLink,
  Building2,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import toast from 'react-hot-toast';

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
import { authFetch } from '@/lib/api-fetch';
import { cn } from '@/lib/utils';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { PLANS_ABONNEMENT, STATUTS_DEMANDE } from '@/lib/constants';
import StatsCards from '@/components/super-admin/StatsCards';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface SuperAdminStats {
  totalHotels: number;
  activeHotels: number;
  pendingRequests: number;
  codesThisMonth: number;
  estimatedRevenue: number;
  recentRequests: any[];
  recentHotels: any[];
  subscriptionsByPlan: { plan: string; count: number }[];
}

// ─── Chart Colors ──────────────────────────────────────────────────────────────

const PIE_COLORS: Record<string, string> = {
  basique: '#9CA3AF',
  standard: '#10B981',
  premium: '#D4AF37',
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    return format(new Date(dateStr), 'dd/MM/yyyy', { locale: fr });
  } catch {
    return '—';
  }
}

function getPlanBadge(plan: string) {
  const label = PLANS_ABONNEMENT[plan as keyof typeof PLANS_ABONNEMENT]?.nom ?? plan;
  const colorClass: Record<string, string> = {
    basique: 'bg-gray-100 text-gray-700 border-gray-200',
    standard: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    premium: 'bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/30',
  };
  return (
    <Badge
      variant="outline"
      className={cn('text-xs', colorClass[plan] ?? 'bg-gray-100 text-gray-700')}
    >
      {label}
    </Badge>
  );
}

function getStatutBadge(statut: string) {
  const found = STATUTS_DEMANDE.find((s) => s.id === statut);
  if (!found)
    return <Badge variant="outline" className="text-xs">{statut}</Badge>;
  return (
    <Badge variant="outline" className={cn('text-xs', found.color)}>
      {found.label}
    </Badge>
  );
}

// ─── PieChart Custom Label ──────────────────────────────────────────────────────

interface PieLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}

function renderCustomLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: PieLabelProps) {
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
      className="text-xs font-semibold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

// ─── Loading Skeletons ─────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-5 w-72" />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Skeleton className="h-72 rounded-xl" />
        </div>
        <div className="lg:col-span-2">
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>

      {/* Recent hotels */}
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<SuperAdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await authFetch('/api/super-admin/stats');
      const json = await res.json();
      if (json.success) {
        setStats(json.data);
      } else {
        toast.error('Erreur de chargement des statistiques');
      }
    } catch {
      toast.error('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Données pour le PieChart
  const pieData = stats?.subscriptionsByPlan?.map((item) => ({
    name: PLANS_ABONNEMENT[item.plan as keyof typeof PLANS_ABONNEMENT]?.nom ?? item.plan,
    value: item.count,
    color: PIE_COLORS[item.plan] ?? '#9CA3AF',
  })) ?? [];

  const recentRequests = stats?.recentRequests?.slice(0, 5) ?? [];
  const recentHotels = stats?.recentHotels?.slice(0, 5) ?? [];

  if (isLoading) return <PageSkeleton />;

  return (
    <ErrorBoundary>
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0A0A0A]">
            Vue d&apos;ensemble
          </h1>
          <p className="text-sm text-gray-500">
            Tableau de bord Super Administrateur
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchStats}
          className="gap-2"
          aria-label="Actualiser les statistiques"
        >
          <RefreshCw className="size-4" />
          Actualiser
        </Button>
      </div>

      {/* ── Stats Cards ──────────────────────────────────────────────────────── */}
      <StatsCards stats={stats} isLoading={false} />

      {/* ── Demandes récentes + PieChart ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Left — Recent requests table */}
        <Card className="lg:col-span-3 rounded-xl border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-[#0A0A0A]">
              Demandes récentes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-0">
            {recentRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-gray-400">
                  Aucune demande récente
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-100 hover:bg-transparent">
                      <TableHead>Nom</TableHead>
                      <TableHead className="hidden sm:table-cell">Hôtel</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="hidden md:table-cell">Date</TableHead>
                      <TableHead className="w-[40px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentRequests.map((req) => (
                      <TableRow
                        key={req.id}
                        className="border-b border-gray-50 hover:bg-gray-50/50"
                      >
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium text-[#0A0A0A]">
                              {req.nom_complet}
                            </p>
                            <p className="text-xs text-gray-400 truncate max-w-[160px]">
                              {req.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 hidden sm:table-cell">
                          {req.nom_hotel}
                        </TableCell>
                        <TableCell>{getPlanBadge(req.plan_choisi)}</TableCell>
                        <TableCell>{getStatutBadge(req.statut)}</TableCell>
                        <TableCell className="text-sm text-gray-500 hidden md:table-cell whitespace-nowrap">
                          {formatDate(req.created_at)}
                        </TableCell>
                        <TableCell>
                          <a
                            href={`https://wa.me/${req.telephone?.replace(/\s/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex size-7 items-center justify-center rounded-full text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Contacter via WhatsApp"
                          >
                            <MessageSquare className="size-3.5" />
                          </a>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right — PieChart */}
        <Card className="lg:col-span-2 rounded-xl border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-[#0A0A0A]">
              Abonnements par plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <div className="flex items-center justify-center h-[240px]">
                <p className="text-sm text-gray-400">Aucune donnée disponible</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    label={renderCustomLabel}
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="white"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `${value} hôtel${value > 1 ? 's' : ''}`,
                      name,
                    ]}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      fontSize: '13px',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value: string) => (
                      <span className="text-sm text-gray-600">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}

            {/* Plan breakdown */}
            <div className="mt-4 space-y-2">
              {pieData.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-gray-600">{item.name}</span>
                  </div>
                  <span className="font-medium text-[#0A0A0A]">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Hôtels récemment activés ───────────────────────────────────────── */}
      <Card className="rounded-xl border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-[#0A0A0A]">
            Hôtels récemment activés
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentHotels.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-gray-400">
                Aucun hôtel récemment activé
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-100 hover:bg-transparent">
                    <TableHead>Nom</TableHead>
                    <TableHead className="hidden sm:table-cell">Ville</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentHotels.map((hotel) => (
                    <TableRow
                      key={hotel.id}
                      className="border-b border-gray-50 hover:bg-gray-50/50"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-8 items-center justify-center rounded-lg bg-[#D4AF37]/10 shrink-0">
                            <Building2 className="size-4 text-[#D4AF37]" />
                          </div>
                          <span className="text-sm font-medium text-[#0A0A0A]">
                            {hotel.nom}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 hidden sm:table-cell">
                        {hotel.ville ?? '—'}
                      </TableCell>
                      <TableCell>{getPlanBadge(hotel.plan)}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs',
                            hotel.est_actif
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                              : 'bg-red-100 text-red-700 border-red-200'
                          )}
                        >
                          {hotel.est_actif ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 hidden md:table-cell whitespace-nowrap">
                        {formatDate(hotel.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </ErrorBoundary>
  );
}
