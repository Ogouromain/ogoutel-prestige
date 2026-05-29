'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Bed, CheckCircle2, XCircle, Wrench } from 'lucide-react';
import toast from 'react-hot-toast';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import RoomsGrid from '@/components/admin/RoomsGrid';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Chambre {
  id: string;
  numero: string;
  type: string;
  statut: string;
  prix: number;
}

interface HotelSettings {
  limites?: any;
}

// ─── Mini Stat Card ───────────────────────────────────────────────────────────

function MiniStatCard({
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
          className="flex size-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${color}15` }}
        >
          <span style={{ color }}>{icon}</span>
        </div>
        <div>
          <p className="text-xl font-bold text-[#0A0A0A]">{value}</p>
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
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-5 w-64" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminRoomsPage() {
  const [chambres, setChambres] = useState<Chambre[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [limitesChambres, setLimitesChambres] = useState<any>(null);

  const fetchRooms = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/rooms?limit=100');
      const json = await res.json();
      if (json.success) {
        setChambres(json.data.chambres ?? []);
      } else {
        toast.error('Erreur de chargement des chambres');
      }
    } catch {
      toast.error('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings');
      const json = await res.json();
      if (json.success && json.data?.plan_info?.limites) {
        setLimitesChambres(json.data.plan_info.limites);
      }
    } catch {
      // Silently fail — limits are optional
    }
  }, []);

  useEffect(() => {
    fetchRooms();
    fetchSettings();
  }, [fetchRooms, fetchSettings]);

  // Mini stats
  const totalChambres = chambres.length;
  const disponibles = chambres.filter((c) => c.statut === 'disponible').length;
  const occupees = chambres.filter((c) => c.statut === 'occupee').length;
  const maintenance = chambres.filter((c) => c.statut === 'maintenance').length;

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0A0A0A]">
            Mes Chambres
          </h1>
          <p className="text-sm text-gray-500">
            Gérez les chambres et leur disponibilité
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchRooms}
          className="gap-2"
        >
          <RefreshCw className="size-4" />
          Actualiser
        </Button>
      </div>

      {/* ── Mini Stats ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStatCard
          label="Total"
          value={totalChambres}
          icon={<Bed className="size-5" />}
          color="#6366F1"
        />
        <MiniStatCard
          label="Disponibles"
          value={disponibles}
          icon={<CheckCircle2 className="size-5" />}
          color="#10B981"
        />
        <MiniStatCard
          label="Occupées"
          value={occupees}
          icon={<XCircle className="size-5" />}
          color="#EF4444"
        />
        <MiniStatCard
          label="Maintenance"
          value={maintenance}
          icon={<Wrench className="size-5" />}
          color="#F59E0B"
        />
      </div>

      {/* ── Rooms Grid ───────────────────────────────────────────────────────── */}
      <RoomsGrid
        chambres={chambres}
        isLoading={isLoading}
        limitesChambres={limitesChambres}
        onRefresh={fetchRooms}
      />
    </div>
  );
}
