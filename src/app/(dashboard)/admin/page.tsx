'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import DashboardStats from '@/components/admin/DashboardStats';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface AdminStats {
  chambres: any;
  today: any;
  finances: any;
  revenus_7j: any;
  chambres_detail: any;
  arrivees: any;
  departs: any;
}

// ─── Loading Skeleton ──────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-72" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/stats');
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
    fetchData();
  }, [fetchData]);

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0A0A0A]">
            Tableau de bord
          </h1>
          <p className="text-sm text-gray-500">
            Bienvenue, voici le résumé de votre activité hôtelière
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

      {/* ── Dashboard Stats ──────────────────────────────────────────────────── */}
      {stats ? (
        <DashboardStats stats={stats} />
      ) : (
        <Card className="rounded-xl border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-gray-400">
              Aucune donnée disponible
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
