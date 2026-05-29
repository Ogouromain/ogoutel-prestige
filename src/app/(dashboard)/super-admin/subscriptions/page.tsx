'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Clock, PhoneCall, CreditCard, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import SubscriptionRequestsTable from '@/components/super-admin/SubscriptionRequestsTable';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface SubscriptionsData {
  demandes: any[];
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
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-5 w-80" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-[500px] rounded-xl" />
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function SubscriptionsPage() {
  const [data, setData] = useState<SubscriptionsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/super-admin/subscriptions?page=1&limit=20');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        toast.error('Erreur de chargement des demandes');
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

  const demandes = data?.demandes ?? [];

  // Compter par statut
  const enAttente = demandes.filter((d: any) => d.statut === 'en_attente').length;
  const contactes = demandes.filter((d: any) => d.statut === 'contacte').length;
  const payes = demandes.filter((d: any) => d.statut === 'paye').length;
  const actifs = demandes.filter((d: any) => d.statut === 'active').length;

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0A0A0A]">
            Demandes d&apos;abonnement
          </h1>
          <p className="text-sm text-gray-500">
            Gérez les demandes de souscription
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

      {/* ── Stats row ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStatCard
          label="En attente"
          value={enAttente}
          icon={<Clock className="size-5" />}
          bgColor="bg-amber-50"
          iconColor="text-amber-600"
        />
        <MiniStatCard
          label="Contactés"
          value={contactes}
          icon={<PhoneCall className="size-5" />}
          bgColor="bg-sky-50"
          iconColor="text-sky-600"
        />
        <MiniStatCard
          label="Payés"
          value={payes}
          icon={<CreditCard className="size-5" />}
          bgColor="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <MiniStatCard
          label="Actifs"
          value={actifs}
          icon={<CheckCircle className="size-5" />}
          bgColor="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>

      {/* ── Subscriptions Table ─────────────────────────────────────────────── */}
      <SubscriptionRequestsTable
        demandes={demandes}
        isLoading={false}
        onUpdate={fetchData}
      />
    </div>
  );
}
