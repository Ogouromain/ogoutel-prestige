'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  Phone,
  Mail,
  CreditCard,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  MapPin,
  Hash,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { cn, formaterPrix } from '@/lib/utils';
import { TYPES_CHAMBRES } from '@/lib/constants';

// ─── Types ───────────────────────────────────────────────────────────────

interface Client {
  id: string;
  nom: string;
  prenom: string;
  telephone?: string;
  email?: string;
  piece_identite_type?: string;
  piece_identite_numero?: string;
  nationalite: string;
  ville_residence?: string;
  notes?: string;
  created_at: string;
  sejours?: Array<{
    id: string;
    date_arrivee: string;
    date_depart: string;
    nombre_nuits: number;
    montant_total: number;
    statut: string;
    chambre: {
      numero: string;
      type: string;
    };
  }>;
}

// ─── Statut badge helper ────────────────────────────────────────────────

function SejourBadge({ statut }: { statut: string }) {
  switch (statut) {
    case 'checkin':
      return (
        <Badge className="border-emerald-200 bg-emerald-100 text-emerald-700 text-xs">
          En cours
        </Badge>
      );
    case 'checkout':
      return (
        <Badge className="border-gray-200 bg-gray-100 text-gray-700 text-xs">
          Terminé
        </Badge>
      );
    case 'confirmee':
      return (
        <Badge className="border-blue-200 bg-blue-100 text-blue-700 text-xs">
          Confirmé
        </Badge>
      );
    case 'annulee':
      return (
        <Badge className="border-red-200 bg-red-100 text-red-700 text-xs">
          Annulé
        </Badge>
      );
    default:
      return (
        <Badge className="border-amber-200 bg-amber-100 text-amber-700 text-xs">
          {statut}
        </Badge>
      );
  }
}

// ─── Client Card ─────────────────────────────────────────────────────────

function ClientCard({ client }: { client: Client }) {
  const [expanded, setExpanded] = useState(false);
  const sejours = client.sejours || [];

  return (
    <Card className="rounded-xl border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold">
              {client.prenom
                ? client.prenom[0].toUpperCase()
                : ''}{client.nom[0].toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-800">
                {client.prenom} {client.nom}
              </p>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="size-3" />
                <span>{client.nationalite}</span>
                {client.ville_residence && (
                  <span> · {client.ville_residence}</span>
                )}
              </div>
            </div>
          </div>
          <Badge
            variant="outline"
            className="border-emerald-200 bg-emerald-50 text-emerald-700 text-xs"
          >
            {sejours.length} séjour(s)
          </Badge>
        </div>

        {/* Contact info */}
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
          {client.telephone && (
            <div className="flex items-center gap-1">
              <Phone className="size-3" />
              <span>{client.telephone}</span>
            </div>
          )}
          {client.email && (
            <div className="flex items-center gap-1">
              <Mail className="size-3" />
              <span className="truncate">{client.email}</span>
            </div>
          )}
          {client.piece_identite_numero && (
            <div className="flex items-center gap-1">
              <Hash className="size-3" />
              <span>
                {client.piece_identite_type || 'ID'}:{' '}
                {client.piece_identite_numero}
              </span>
            </div>
          )}
        </div>

        {/* Sejour history toggle */}
        {sejours.length > 0 && (
          <div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-3 flex w-full items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <span className="flex items-center gap-1">
                <CalendarDays className="size-3" />
                Historique des séjours ({sejours.length})
              </span>
              {expanded ? (
                <ChevronUp className="size-3" />
              ) : (
                <ChevronDown className="size-3" />
              )}
            </button>

            {expanded && (
              <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                {sejours.map((sejour) => (
                  <div
                    key={sejour.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">
                        Ch. {sejour.chambre.numero}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({TYPES_CHAMBRES.find((t) => t.id === sejour.chambre.type)
                          ?.label || sejour.chambre.type})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">
                        {sejour.date_arrivee} → {sejour.date_depart}
                      </span>
                      <SejourBadge statut={sejour.statut} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        {client.notes && (
          <div className="mt-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
            📝 {client.notes}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Clients Page ────────────────────────────────────────────────────

export default function StaffClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = debouncedSearch
        ? `?search=${encodeURIComponent(debouncedSearch)}&limit=50`
        : '?limit=50';
      const res = await fetch(`/api/staff/clients${params}`);
      const json = await res.json();
      if (json.success) {
        setClients(json.data.clients ?? []);
      }
    } catch {
      toast.error('Erreur de chargement des clients');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-[#0A0A0A]">
            <Users className="size-6 text-emerald-600" />
            Clients
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {clients.length} client(s) enregistré(s) dans cet hôtel
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchClients}
          className="gap-2"
        >
          <RefreshCw className="size-4" />
          Actualiser
        </Button>
      </div>

      {/* ── Search ──────────────────────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Rechercher par nom, téléphone ou n° pièce d'identité..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* ── Client List ────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : clients.length === 0 ? (
        <Card className="rounded-xl border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="mb-3 size-10 text-gray-300" />
            <p className="text-sm text-gray-400">
              {search
                ? 'Aucun client trouvé pour cette recherche'
                : 'Aucun client enregistré'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {clients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      )}
    </div>
  );
}
