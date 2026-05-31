'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, LogIn, LogOut, BedDouble, Clock, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import { authFetch } from '@/lib/api-fetch';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface StaffStats {
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
  arrivees_jour: Array<{
    id: string;
    client: { nom: string; prenom: string };
    chambre: { numero: string };
  }>;
  departs_jour: Array<{
    id: string;
    client: { nom: string; prenom: string };
    chambre: { numero: string };
  }>;
  activites_recentes: Array<{
    id: string;
    action: string;
    description: string;
    created_at: string;
  }>;
  staff_info: {
    prenom: string;
    nom: string;
    role: string;
  };
  hotel_nom: string;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Card className="rounded-xl border-0 shadow-sm">
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className="flex size-12 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${color}15` }}
        >
          <span style={{ color }}>{icon}</span>
        </div>
        <div>
          <p className="text-2xl font-bold text-[#0A0A0A]">{value}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Loading Skeleton ──────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-5 w-48" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  );
}

// ─── Activity Icon ─────────────────────────────────────────────────────────────

function ActivityIcon({ action }: { action: string }) {
  switch (action) {
    case 'checkin':
      return <LogIn className="size-4 text-emerald-600" />;
    case 'checkout':
      return <LogOut className="size-4 text-gray-600" />;
    case 'payment':
      return <span className="text-sm">💰</span>;
    default:
      return <Activity className="size-4 text-gray-500" />;
  }
}

// ─── Format relative time ─────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  return `Il y a ${diffDays}j`;
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function StaffDashboardPage() {
  const [data, setData] = useState<StaffStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await authFetch('/api/staff/stats');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        toast.error('Erreur de chargement');
      }
    } catch {
      toast.error('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  if (isLoading) return <PageSkeleton />;

  const greeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const staffFirstName = data?.staff_info?.prenom || 'Réceptionniste';

  return (
    <ErrorBoundary>
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#0A0A0A]">
            {greeting()}, {staffFirstName} !
          </h1>
          <p className="text-sm text-gray-500">
            {format(currentTime, "EEEE d MMMM yyyy — HH:mm", { locale: fr })} · Bonne journée
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          className="gap-2"
          aria-label="Actualiser le tableau de bord"
        >
          <RefreshCw className="size-4" />
          Actualiser
        </Button>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          label="Chambres disponibles"
          value={data?.chambres.disponibles || 0}
          icon={<BedDouble className="size-6" />}
          color="#10B981"
        />
        <StatCard
          label="Check-in aujourd'hui"
          value={data?.today.checkins || 0}
          icon={<LogIn className="size-6" />}
          color="#0EA5E9"
        />
        <StatCard
          label="Check-out aujourd'hui"
          value={data?.today.checkouts || 0}
          icon={<LogOut className="size-6" />}
          color="#F59E0B"
        />
        <StatCard
          label="Chambres occupées"
          value={data?.chambres.occupees || 0}
          icon={<BedDouble className="size-6" />}
          color="#EF4444"
        />
      </div>

      {/* ── Quick Actions + Activity ───────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Arrivées & Départs du jour */}
        <Card className="rounded-xl border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Clock className="size-5 text-emerald-600" />
              Aujourd&apos;hui
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Check-ins du jour */}
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Check-in prévus ({data?.arrivees_jour.length || 0})
              </h3>
              {data && data.arrivees_jour.length > 0 ? (
                <div className="space-y-2">
                  {data.arrivees_jour.map((arr) => (
                    <div
                      key={arr.id}
                      className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <LogIn className="size-4 text-emerald-600" />
                        <span className="text-sm font-medium text-gray-800">
                          {arr.client.prenom} {arr.client.nom}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className="border-emerald-200 bg-white text-emerald-700 text-xs"
                      >
                        Ch. {arr.chambre.numero}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">
                  Aucun check-in prévu aujourd&apos;hui
                </p>
              )}
            </div>

            {/* Check-outs du jour */}
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Check-out prévus ({data?.departs_jour.length || 0})
              </h3>
              {data && data.departs_jour.length > 0 ? (
                <div className="space-y-2">
                  {data.departs_jour.map((dep) => (
                    <div
                      key={dep.id}
                      className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <LogOut className="size-4 text-amber-600" />
                        <span className="text-sm font-medium text-gray-800">
                          {dep.client.prenom} {dep.client.nom}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className="border-amber-200 bg-white text-amber-700 text-xs"
                      >
                        Ch. {dep.chambre.numero}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">
                  Aucun check-out prévu aujourd&apos;hui
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dernière activité */}
        <Card className="rounded-xl border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Activity className="size-5 text-emerald-600" />
              Ma dernière activité
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data && data.activites_recentes.length > 0 ? (
              <div className="space-y-3">
                {data.activites_recentes.map((act) => (
                  <div key={act.id} className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-gray-100">
                      <ActivityIcon action={act.action} />
                    </div>
                    <div className="flex flex-col">
                      <p className="text-sm text-gray-800">
                        {act.description}
                      </p>
                      <p className="text-xs text-gray-400">
                        {timeAgo(act.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Activity className="mb-2 size-8 text-gray-300" />
                <p className="text-sm text-gray-400">
                  Aucune activité récente
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </ErrorBoundary>
  );
}
