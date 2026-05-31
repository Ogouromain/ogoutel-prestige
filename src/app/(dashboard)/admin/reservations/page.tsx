'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Clock, CheckCircle2, LogIn, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

import { Card, CardContent } from '@/components/ui/card';
import { authFetch } from '@/lib/api-fetch';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import ReservationsList from '@/components/admin/ReservationsList';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Reservation {
  id: string;
  client_nom: string;
  chambre_numero: string;
  date_arrivee: string;
  date_depart: string;
  statut: string;
  montant_total: number;
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
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-5 w-64" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await authFetch('/api/admin/reservations?limit=50');
      const json = await res.json();
      if (json.success) {
        setReservations(json.data.reservations ?? []);
      } else {
        toast.error('Erreur de chargement des réservations');
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

  // Mini stats
  const enAttente = reservations.filter((r) => r.statut === 'en_attente').length;
  const confirmee = reservations.filter((r) => r.statut === 'confirmee').length;
  const checkin = reservations.filter((r) => r.statut === 'checkin').length;
  const checkout = reservations.filter((r) => r.statut === 'checkout').length;

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0A0A0A]">
            Réservations
          </h1>
          <p className="text-sm text-gray-500">
            Suivez et gérez toutes les réservations de votre hôtel
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          className="gap-2"
        >
          <RefreshCw className="size-4" />
          Actualiser
        </Button>
      </div>

      {/* ── Mini Stats ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStatCard
          label="En attente"
          value={enAttente}
          icon={<Clock className="size-5" />}
          color="#F59E0B"
        />
        <MiniStatCard
          label="Confirmées"
          value={confirmee}
          icon={<CheckCircle2 className="size-5" />}
          color="#10B981"
        />
        <MiniStatCard
          label="Check-in"
          value={checkin}
          icon={<LogIn className="size-5" />}
          color="#0EA5E9"
        />
        <MiniStatCard
          label="Check-out"
          value={checkout}
          icon={<LogOut className="size-5" />}
          color="#6B7280"
        />
      </div>

      {/* ── Reservations List ─────────────────────────────────────────────────── */}
      <ReservationsList
        reservations={reservations}
        isLoading={isLoading}
        onRefresh={fetchData}
      />
    </div>
  );
}
