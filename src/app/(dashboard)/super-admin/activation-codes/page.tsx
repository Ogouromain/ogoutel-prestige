'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Key, Gift, CheckCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { authFetch } from '@/lib/api-fetch';
import { cn } from '@/lib/utils';
import ActivationCodeGenerator from '@/components/super-admin/ActivationCodeGenerator';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface CodesData {
  codes: any[];
  total: number;
  page: number;
  totalPages: number;
}

interface PendingRequestsData {
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
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-5 w-72" />
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

export default function ActivationCodesPage() {
  const [codesData, setCodesData] = useState<CodesData | null>(null);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCodes = useCallback(async () => {
    try {
      const res = await authFetch('/api/super-admin/codes?page=1&limit=20');
      const json = await res.json();
      if (json.success) {
        setCodesData(json.data);
      }
    } catch {
      // Erreur silencieuse pour les codes, on continue
    }
  }, []);

  const fetchPendingRequests = useCallback(async () => {
    try {
      const res = await authFetch('/api/super-admin/subscriptions?statut=paye&limit=50');
      const json = await res.json();
      if (json.success) {
        setPendingRequests(json.data.demandes ?? []);
      }
    } catch {
      // Erreur silencieuse
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchCodes(), fetchPendingRequests()]);
    } catch {
      toast.error('Erreur de chargement des données');
    } finally {
      setIsLoading(false);
    }
  }, [fetchCodes, fetchPendingRequests]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const codes = codesData?.codes ?? [];

  // Compter par statut
  const now = new Date();
  const nonUtilises = codes.filter(
    (c: any) => !c.est_utilise && new Date(c.date_expiration) >= now
  ).length;
  const utilises = codes.filter((c: any) => c.est_utilise).length;
  const expires = codes.filter(
    (c: any) => !c.est_utilise && new Date(c.date_expiration) < now
  ).length;

  const handleRefresh = useCallback(async () => {
    await fetchAll();
    toast.success('Données actualisées');
  }, [fetchAll]);

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0A0A0A]">
            Codes d&apos;activation
          </h1>
          <p className="text-sm text-gray-500">
            Générez et gérez les codes d&apos;accès
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="gap-2"
        >
          <RefreshCw className="size-4" />
          Actualiser
        </Button>
      </div>

      {/* ── Stats row ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStatCard
          label="Total codes"
          value={codes.length}
          icon={<Key className="size-5" />}
          bgColor="bg-gray-100"
          iconColor="text-gray-600"
        />
        <MiniStatCard
          label="Non utilisés"
          value={nonUtilises}
          icon={<Gift className="size-5" />}
          bgColor="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <MiniStatCard
          label="Utilisés"
          value={utilises}
          icon={<CheckCircle className="size-5" />}
          bgColor="bg-sky-50"
          iconColor="text-sky-600"
        />
        <MiniStatCard
          label="Expirés"
          value={expires}
          icon={<AlertTriangle className="size-5" />}
          bgColor="bg-red-50"
          iconColor="text-red-500"
        />
      </div>

      {/* ── Activation Code Generator ─────────────────────────────────────── */}
      <ActivationCodeGenerator
        codes={codes}
        pendingRequests={pendingRequests}
        isLoading={false}
        onUpdate={fetchAll}
      />
    </div>
  );
}
