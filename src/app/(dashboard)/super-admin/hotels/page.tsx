'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Building2, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { authFetch } from '@/lib/api-fetch';
import { cn } from '@/lib/utils';
import HotelsTable from '@/components/super-admin/HotelsTable';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface HotelData {
  hotels: any[];
  total: number;
  page: number;
  totalPages: number;
}

// ─── Mini Stat Card ────────────────────────────────────────────────────────────

function MiniStatCard({
  label,
  value,
  icon,
  bgColor,
  iconColor,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  bgColor: string;
  iconColor: string;
}) {
  return (
    <Card className="rounded-xl border-0 shadow-sm">
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className={cn('flex size-10 items-center justify-center rounded-lg', bgColor)}
        >
          <span className={iconColor}>{icon}</span>
        </div>
        <div>
          <p className="text-xl font-bold text-[#0A0A0A]">
            {value.toLocaleString('fr-FR')}
          </p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-64" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-[500px] rounded-xl" />
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function HotelsPage() {
  const [hotelsData, setHotelsData] = useState<HotelData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHotels = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await authFetch('/api/super-admin/hotels?page=1&limit=20');
      const json = await res.json();
      if (json.success) {
        setHotelsData(json.data);
      } else {
        toast.error('Erreur de chargement des hôtels');
      }
    } catch {
      toast.error('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  const hotels = hotelsData?.hotels ?? [];
  const totalHotels = hotelsData?.total ?? 0;
  const activeHotels = hotels.filter((h: any) => h.est_actif).length;
  const inactiveHotels = hotels.filter((h: any) => !h.est_actif).length;

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0A0A0A]">
            Tous les Hôtels
          </h1>
          <p className="text-sm text-gray-500">
            Gérez les établissements inscrits
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchHotels}
          className="gap-2"
        >
          <RefreshCw className="size-4" />
          Actualiser
        </Button>
      </div>

      {/* ── Stats row ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MiniStatCard
          label="Total Hôtels"
          value={totalHotels}
          icon={<Building2 className="size-5" />}
          bgColor="bg-gray-100"
          iconColor="text-gray-600"
        />
        <MiniStatCard
          label="Actifs"
          value={activeHotels}
          icon={<CheckCircle className="size-5" />}
          bgColor="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <MiniStatCard
          label="Inactifs"
          value={inactiveHotels}
          icon={<XCircle className="size-5" />}
          bgColor="bg-red-50"
          iconColor="text-red-500"
        />
      </div>

      {/* ── Hotels Table ────────────────────────────────────────────────────── */}
      <HotelsTable
        hotels={hotels}
        isLoading={false}
      />
    </div>
  );
}
