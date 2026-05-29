'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bed,
  LogIn,
  LogOut,
  DollarSign,
  TrendingUp,
  Eye,
  User,
  Clock,
  ArrowRightLeft,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import toast from 'react-hot-toast';

import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  formaterPrix,
  getLibelleTypeChambre,
  getLibelleStatutChambre,
} from '@/lib/constants';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface AdminStats {
  chambres: {
    total: number;
    disponibles: number;
    occupees: number;
    maintenance: number;
    reservees: number;
  };
  today: {
    checkins: number;
    checkouts: number;
  };
  finances: {
    revenus_jour: number;
    revenus_mois: number;
  };
  taux_occupation: number;
  chambres_detail: Array<{
    id: string;
    numero: string;
    type: string;
    statut: string;
    etage: number;
    prix_nuit: number;
    photo_url?: string;
    current_reservation?: any;
  }>;
  arrivees: any[];
  departs: any[];
  revenus_7j: Array<{ date: string; montant: number }>;
}

interface DashboardStatsProps {
  stats: AdminStats | null;
  isLoading: boolean;
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────

interface StatCardData {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  description?: string;
}

function StatCard({ data, index }: { data: StatCardData; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', data.iconBg)}>
              <span className={data.iconColor}>{data.icon}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-500 truncate">{data.label}</p>
              <p className="text-xl font-bold text-gray-900">{data.value}</p>
              {data.description && (
                <p className="text-[11px] text-gray-400 mt-0.5 truncate">{data.description}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Mini Room Card ────────────────────────────────────────────────────────────

const STATUT_COLORS: Record<string, string> = {
  disponible: 'bg-emerald-500',
  occupee: 'bg-red-500',
  maintenance: 'bg-amber-500',
  reservee: 'bg-blue-500',
};

function MiniRoomCard({
  chambre,
  onClick,
}: {
  chambre: AdminStats['chambres_detail'][0];
  onClick: () => void;
}) {
  const colorClass = STATUT_COLORS[chambre.statut] || 'bg-gray-400';

  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'relative rounded-lg p-3 text-left transition-all',
        'border border-white/20 shadow-sm',
        colorClass
      )}
    >
      <p className="text-sm font-bold text-white">{chambre.numero}</p>
      <p className="text-[11px] text-white/80 mt-0.5">
        {getLibelleTypeChambre(chambre.type as any)}
      </p>
    </motion.button>
  );
}

// ─── Room Detail Dialog ────────────────────────────────────────────────────────

function RoomDetailDialog({
  chambre,
  open,
  onOpenChange,
}: {
  chambre: AdminStats['chambres_detail'][0] | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!chambre) return null;

  const statutColor = STATUT_COLORS[chambre.statut] || 'bg-gray-400';
  const reservation = chambre.current_reservation;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-2xl">🛏️</span>
            Chambre {chambre.numero}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 pr-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                {getLibelleTypeChambre(chambre.type as any)}
              </Badge>
              <Badge className={cn('border-0 text-white', statutColor)}>
                {getLibelleStatutChambre(chambre.statut as any)}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">Étage</p>
                <p className="font-semibold">{chambre.etage}</p>
              </div>
              <div>
                <p className="text-gray-500">Prix / nuit</p>
                <p className="font-semibold">{formaterPrix(chambre.prix_nuit)}</p>
              </div>
            </div>

            {reservation && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <User className="size-4" />
                    Client actuel
                  </h4>
                  <div className="rounded-lg bg-gray-50 p-3 space-y-1.5 text-sm">
                    <p>
                      <span className="text-gray-500">Nom :</span>{' '}
                      <span className="font-medium">{reservation.client_nom || '—'}</span>
                    </p>
                    {reservation.client_prenom && (
                      <p>
                        <span className="text-gray-500">Prénom :</span>{' '}
                        <span className="font-medium">{reservation.client_prenom}</span>
                      </p>
                    )}
                    {reservation.date_checkin && (
                      <p>
                        <span className="text-gray-500">Check-in :</span>{' '}
                        <span className="font-medium">
                          {format(new Date(reservation.date_checkin), 'dd/MM/yyyy', { locale: fr })}
                        </span>
                      </p>
                    )}
                    {reservation.date_checkout && (
                      <p>
                        <span className="text-gray-500">Check-out :</span>{' '}
                        <span className="font-medium">
                          {format(new Date(reservation.date_checkout), 'dd/MM/yyyy', { locale: fr })}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ─── Loading Skeletons ─────────────────────────────────────────────────────────

function StatsGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-12" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function MiniGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-16 rounded-lg" />
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DashboardStats({ stats, isLoading }: DashboardStatsProps) {
  const [selectedRoom, setSelectedRoom] = useState<AdminStats['chambres_detail'][0] | null>(null);
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <StatsGridSkeleton />
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <MiniGridSkeleton />
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        </div>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-gray-500 text-sm">Aucune donnée disponible</p>
      </div>
    );
  }

  // ─── Stat Cards Data ─────────────────────────────────────────────────────

  const statCards: StatCardData[] = [
    {
      label: 'Chambres disponibles',
      value: stats.chambres.disponibles,
      icon: <Bed className="size-5" />,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      description: `sur ${stats.chambres.total} chambres`,
    },
    {
      label: 'Chambres occupées',
      value: stats.chambres.occupees,
      icon: <Bed className="size-5" />,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      description: `${stats.taux_occupation}% d'occupation`,
    },
    {
      label: 'Check-in du jour',
      value: stats.today.checkins,
      icon: <LogIn className="size-5" />,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Check-out du jour',
      value: stats.today.checkouts,
      icon: <LogOut className="size-5" />,
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-600',
    },
    {
      label: 'Revenus du jour',
      value: formaterPrix(stats.finances.revenus_jour),
      icon: <DollarSign className="size-5" />,
      iconBg: 'bg-[#D4AF37]/15',
      iconColor: 'text-[#D4AF37]',
    },
    {
      label: 'Revenus du mois',
      value: formaterPrix(stats.finances.revenus_mois),
      icon: <TrendingUp className="size-5" />,
      iconBg: 'bg-[#D4AF37]/15',
      iconColor: 'text-[#D4AF37]',
    },
  ];

  // ─── Revenue Chart Data ──────────────────────────────────────────────────

  const chartData = stats.revenus_7j.map((item) => ({
    ...item,
    label: format(new Date(item.date), 'dd/MM', { locale: fr }),
    montantFormatted: formaterPrix(item.montant),
  }));

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleRoomClick = (chambre: AdminStats['chambres_detail'][0]) => {
    setSelectedRoom(chambre);
    setRoomDialogOpen(true);
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* ─── Stat Cards Grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card, index) => (
          <StatCard key={card.label} data={card} index={index} />
        ))}
      </div>

      {/* ─── Mini Chambre Grid ─────────────────────────────────────────── */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Bed className="size-4 text-[#1B4332]" />
              Vue d'ensemble des chambres
            </CardTitle>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-emerald-500" /> Disponible
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-red-500" /> Occupée
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-amber-500" /> Maintenance
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-blue-500" /> Réservée
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {stats.chambres_detail.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {stats.chambres_detail.map((chambre) => (
                <MiniRoomCard
                  key={chambre.id}
                  chambre={chambre}
                  onClick={() => handleRoomClick(chambre)}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-gray-400 py-8">Aucune chambre configurée</p>
          )}
        </CardContent>
      </Card>

      {/* ─── Arrivées / Départs ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Arrivées */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <LogIn className="size-4 text-blue-600" />
              Arrivées du jour
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.arrivees.length > 0 ? (
              <div className="space-y-2">
                {stats.arrivees.slice(0, 5).map((arr: any, i: number) => (
                  <div
                    key={arr.id || i}
                    className="flex items-center gap-3 rounded-lg bg-blue-50/50 p-3"
                  >
                    <div className="flex size-8 items-center justify-center rounded-full bg-blue-100">
                      <User className="size-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {arr.client_nom} {arr.client_prenom || ''}
                      </p>
                      <p className="text-xs text-gray-500">
                        Chambre {arr.chambre_numero} &middot;{' '}
                        {arr.date_checkin
                          ? format(new Date(arr.date_checkin), 'dd/MM/yyyy', { locale: fr })
                          : '—'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-6 text-center">
                <LogIn className="size-8 text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">Aucune arrivée prévue</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Départs */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <LogOut className="size-4 text-gray-600" />
              Départs du jour
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.departs.length > 0 ? (
              <div className="space-y-2">
                {stats.departs.slice(0, 5).map((dep: any, i: number) => (
                  <div
                    key={dep.id || i}
                    className="flex items-center gap-3 rounded-lg bg-gray-50 p-3"
                  >
                    <div className="flex size-8 items-center justify-center rounded-full bg-gray-100">
                      <LogOut className="size-4 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {dep.client_nom} {dep.client_prenom || ''}
                      </p>
                      <p className="text-xs text-gray-500">
                        Chambre {dep.chambre_numero} &middot;{' '}
                        {dep.date_checkout
                          ? format(new Date(dep.date_checkout), 'dd/MM/yyyy', { locale: fr })
                          : '—'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-6 text-center">
                <LogOut className="size-8 text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">Aucun départ prévu</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Revenue Chart ─────────────────────────────────────────────── */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="size-4 text-[#D4AF37]" />
            Revenus des 7 derniers jours
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                />
                <RechartsTooltip
                  formatter={(value: number) => [formaterPrix(value), 'Revenus']}
                  labelStyle={{ fontWeight: 600 }}
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  }}
                />
                <Bar
                  dataKey="montant"
                  fill="#D4AF37"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center py-10 text-center">
              <TrendingUp className="size-8 text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">Aucune donnée de revenus</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Room Detail Dialog ────────────────────────────────────────── */}
      <RoomDetailDialog
        chambre={selectedRoom}
        open={roomDialogOpen}
        onOpenChange={setRoomDialogOpen}
      />
    </motion.div>
  );
}
