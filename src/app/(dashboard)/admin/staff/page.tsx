'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

import { authFetch } from '@/lib/api-fetch';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import StaffManager from '@/components/admin/StaffManager';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface StaffResponse {
  personnel: any[];
  total: number;
  page: number;
  totalPages: number;
  limites: {
    gerants: { actuel: number; max: number };
    receptionnistes: { actuel: number; max: number };
  };
}

// ─── Loading Skeleton ──────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-5 w-64" />
      </div>
      <Skeleton className="h-28 rounded-xl" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminStaffPage() {
  const [personnel, setPersonnel] = useState<any[]>([]);
  const [limites, setLimites] = useState({
    gerants: { actuel: 0, max: 0 },
    receptionnistes: { actuel: 0, max: 0 },
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await authFetch('/api/admin/staff?limit=50');
      const json = await res.json();
      if (json.success) {
        setPersonnel(json.data.personnel ?? []);
        if (json.data.limites) {
          setLimites(json.data.limites);
        }
      } else {
        toast.error('Erreur de chargement du personnel');
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

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0A0A0A]">
            Mon Personnel
          </h1>
          <p className="text-sm text-gray-500">
            Gérez votre équipe : gérants et réceptionnistes
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

      {/* ── Staff Manager ─────────────────────────────────────────────────────── */}
      <StaffManager
        personnel={personnel}
        isLoading={isLoading}
        limites={limites}
        onRefresh={fetchData}
      />
    </div>
  );
}
