'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  BedDouble,
  RefreshCw,
  User,
  LogIn,
  LogOut,
  Wrench,
  CalendarCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { authFetch } from '@/lib/api-fetch';
import { cn, formatCFA } from '@/lib/utils';
import { TYPES_CHAMBRES } from '@/lib/constants';

// ─── Types ───────────────────────────────────────────────────────────────

interface Chambre {
  id: string;
  numero: string;
  type: string;
  statut: string;
  etage: number;
  prix_nuit: number;
  current_reservation?: {
    id: string;
    date_arrivee: string;
    date_depart: string;
    statut: string;
    client: {
      nom: string;
      prenom: string;
      telephone: string;
    };
  };
}

// ─── Status Config ────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    bg: string;
    border: string;
    text: string;
    icon: React.ReactNode;
    dot: string;
  }
> = {
  disponible: {
    label: 'Disponible',
    bg: 'bg-emerald-50 hover:bg-emerald-100',
    border: 'border-emerald-200 hover:border-emerald-300',
    text: 'text-emerald-800',
    icon: <BedDouble className="size-5 text-emerald-600" />,
    dot: 'bg-emerald-500',
  },
  occupee: {
    label: 'Occupée',
    bg: 'bg-red-50 hover:bg-red-100',
    border: 'border-red-200 hover:border-red-300',
    text: 'text-red-800',
    icon: <User className="size-5 text-red-600" />,
    dot: 'bg-red-500',
  },
  maintenance: {
    label: 'Maintenance',
    bg: 'bg-amber-50 hover:bg-amber-100',
    border: 'border-amber-200 hover:border-amber-300',
    text: 'text-amber-800',
    icon: <Wrench className="size-5 text-amber-600" />,
    dot: 'bg-amber-500',
  },
  reservee: {
    label: 'Réservée',
    bg: 'bg-blue-50 hover:bg-blue-100',
    border: 'border-blue-200 hover:border-blue-300',
    text: 'text-blue-800',
    icon: <CalendarCheck className="size-5 text-blue-600" />,
    dot: 'bg-blue-500',
  },
};

// ─── Legend Component ──────────────────────────────────────────────────────

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {Object.entries(STATUS_CONFIG).map(([key, config]) => (
        <div key={key} className="flex items-center gap-1.5 text-xs">
          <div className={cn('size-2.5 rounded-full', config.dot)} />
          <span className="text-gray-600">{config.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Room Card ───────────────────────────────────────────────────────────

function RoomCard({
  chambre,
  onClick,
}: {
  chambre: Chambre;
  onClick: () => void;
}) {
  const config = STATUS_CONFIG[chambre.statut] || STATUS_CONFIG.disponible;

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center rounded-xl border-2 p-3 text-center transition-all sm:p-4',
        config.bg,
        config.border,
        'cursor-pointer'
      )}
    >
      <div className="mb-1 flex size-8 items-center justify-center rounded-lg bg-white/60 sm:mb-2 sm:size-10">
        {config.icon}
      </div>
      <span className="text-lg font-bold text-gray-800 sm:text-xl">
        {chambre.numero}
      </span>
      <span className="text-[10px] text-gray-500 sm:text-xs">
        {TYPES_CHAMBRES.find((t) => t.id === chambre.type)?.label || chambre.type}
      </span>
      <span className="text-[10px] text-gray-400 sm:text-xs">
        Étage {chambre.etage}
      </span>
      <div
        className={cn('mt-1 rounded-full px-2 py-0.5 text-[10px] font-medium sm:mt-2 sm:text-xs', config.text, config.bg)}
      >
        {config.label}
      </div>
    </button>
  );
}

// ─── Room Detail Modal ────────────────────────────────────────────────────

function RoomDetailModal({
  chambre,
  open,
  onClose,
  onGoToCheckin,
  onGoToCheckout,
}: {
  chambre: Chambre | null;
  open: boolean;
  onClose: () => void;
  onGoToCheckin: () => void;
  onGoToCheckout: () => void;
}) {
  const router = useRouter();

  if (!chambre) return null;

  const config = STATUS_CONFIG[chambre.statut] || STATUS_CONFIG.disponible;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {config.icon}
            Chambre {chambre.numero}
          </DialogTitle>
          <DialogDescription>
            {TYPES_CHAMBRES.find((t) => t.id === chambre.type)?.label || chambre.type}{' '}
            — Étage {chambre.etage}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status & Price */}
          <div className="flex items-center justify-between">
            <Badge
              className={cn(
                'border px-3 py-1 text-xs font-medium',
                config.border,
                config.bg,
                config.text
              )}
            >
              {config.label}
            </Badge>
            <span className="text-lg font-bold text-emerald-600">
              {formatCFA(chambre.prix_nuit)}/nuit
            </span>
          </div>

          {/* Client info for occupied rooms */}
          {chambre.statut === 'occupee' && chambre.current_reservation && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <h4 className="mb-2 text-sm font-semibold text-red-800">
                Client actuel
              </h4>
              <div className="space-y-1 text-sm">
                <p className="font-medium text-gray-800">
                  {chambre.current_reservation.client.prenom}{' '}
                  {chambre.current_reservation.client.nom}
                </p>
                <p className="text-gray-500">
                  📞 {chambre.current_reservation.client.telephone}
                </p>
                <p className="text-gray-500">
                  📅 Arrivée : {chambre.current_reservation.date_arrivee}
                </p>
                <p className="text-gray-500">
                  📅 Départ : {chambre.current_reservation.date_depart}
                </p>
              </div>
            </div>
          )}

          {/* Reserved room info */}
          {chambre.statut === 'reservee' && chambre.current_reservation && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <h4 className="mb-2 text-sm font-semibold text-blue-800">
                Réservation à venir
              </h4>
              <div className="space-y-1 text-sm">
                <p className="font-medium text-gray-800">
                  {chambre.current_reservation.client.prenom}{' '}
                  {chambre.current_reservation.client.nom}
                </p>
                <p className="text-gray-500">
                  📅 Arrivée prévue : {chambre.current_reservation.date_arrivee}
                </p>
              </div>
            </div>
          )}

          {/* Maintenance info */}
          {chambre.statut === 'maintenance' && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center">
              <Wrench className="mx-auto mb-2 size-6 text-amber-500" />
              <p className="text-sm text-amber-700">
                Cette chambre est en cours de maintenance
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {chambre.statut === 'disponible' && (
            <Button
              className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700"
              onClick={() => {
                onClose();
                router.push('/staff/checkin');
              }}
            >
              <LogIn className="size-4" />
              Faire un Check-in
            </Button>
          )}
          {chambre.statut === 'occupee' && (
            <Button
              className="flex-1 gap-2 bg-amber-600 hover:bg-amber-700"
              onClick={() => {
                onClose();
                router.push('/staff/checkout');
              }}
            >
              <LogOut className="size-4" />
              Faire un Check-out
            </Button>
          )}
          <Button variant="outline" onClick={onClose} className="flex-1">
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main RoomsStatusView Component ────────────────────────────────────────

export default function RoomsStatusView() {
  const [chambres, setChambres] = useState<Chambre[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<Chambre | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filterStatut, setFilterStatut] = useState<string | null>(null);

  const fetchRooms = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = filterStatut
        ? `?statut=${filterStatut}&limit=50`
        : '?limit=50';
      const res = await authFetch(`/api/admin/rooms${params}`);
      const json = await res.json();
      if (json.success) {
        setChambres(json.data.chambres ?? []);
      }
    } catch {
      toast.error('Erreur de chargement des chambres');
    } finally {
      setIsLoading(false);
    }
  }, [filterStatut]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleRoomClick = (chambre: Chambre) => {
    setSelectedRoom(chambre);
    setModalOpen(true);
  };

  // Group by floor
  const floors = chambres.reduce<Record<number, Chambre[]>>((acc, ch) => {
    const floor = ch.etage;
    if (!acc[floor]) acc[floor] = [];
    acc[floor].push(ch);
    return acc;
  }, {});

  const sortedFloors = Object.keys(floors)
    .map(Number)
    .sort((a, b) => a - b);

  // Stats
  const totalChambres = chambres.length;
  const disponibles = chambres.filter((c) => c.statut === 'disponible').length;
  const occupees = chambres.filter((c) => c.statut === 'occupee').length;
  const maintenance = chambres.filter((c) => c.statut === 'maintenance').length;
  const reservees = chambres.filter((c) => c.statut === 'reservee').length;

  return (
    <>
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Legend />
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

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filterStatut === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatut(null)}
            className={
              filterStatut === null
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : ''
            }
          >
            Tous ({totalChambres})
          </Button>
          {Object.entries(STATUS_CONFIG).map(([key, config]) => {
            const count =
              key === 'disponible'
                ? disponibles
                : key === 'occupee'
                  ? occupees
                  : key === 'maintenance'
                    ? maintenance
                    : reservees;
            return (
              <Button
                key={key}
                variant={filterStatut === key ? 'default' : 'outline'}
                size="sm"
                onClick={() =>
                  setFilterStatut(filterStatut === key ? null : key)
                }
                className={
                  filterStatut === key ? 'bg-emerald-600 hover:bg-emerald-700' : ''
                }
              >
                {config.label} ({count})
              </Button>
            );
          })}
        </div>

        {/* Room grid by floor */}
        {isLoading ? (
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="mb-3 h-6 w-24" />
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <Skeleton key={j} className="h-28 rounded-xl" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : chambres.length === 0 ? (
          <Card className="rounded-xl border-0 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <BedDouble className="mb-3 size-10 text-gray-300" />
              <p className="text-sm text-gray-400">
                Aucune chambre trouvée
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {sortedFloors.map((floor) => (
              <div key={floor}>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-600">
                  <span className="flex size-6 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                    {floor}
                  </span>
                  Étage {floor}
                </h3>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
                  {floors[floor].map((chambre) => (
                    <RoomCard
                      key={chambre.id}
                      chambre={chambre}
                      onClick={() => handleRoomClick(chambre)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Room Detail Modal */}
      <RoomDetailModal
        chambre={selectedRoom}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedRoom(null);
        }}
        onGoToCheckin={() => {}}
        onGoToCheckout={() => {}}
      />
    </>
  );
}
