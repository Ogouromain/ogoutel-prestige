'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Bed, CalendarDays, SearchX, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { formatCFA } from '@/lib/utils';

// ─── Types ──────────────────────────────────────────────────────────────

interface ClientResult {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  type: string;
}

interface ChambreResult {
  id: string;
  numero: string;
  type: string;
  statut: string;
  prix_nuit: number;
  type_result: string;
}

interface ReservationResult {
  id: string;
  client_nom: string;
  chambre_numero: string;
  date_arrivee: string;
  statut: string;
  type_result: string;
}

interface SearchData {
  clients: ClientResult[];
  chambres: ChambreResult[];
  reservations: ReservationResult[];
  total: number;
}

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────

const STATUT_LABELS: Record<string, string> = {
  disponible: 'Disponible',
  occupee: 'Occupée',
  maintenance: 'En maintenance',
  reservee: 'Réservée',
  confirmee: 'Confirmée',
  en_attente: 'En attente',
  checkin: 'Séjournant',
  checkout: 'Parti',
  annulee: 'Annulée',
};

const STATUT_COLORS: Record<string, string> = {
  disponible: 'bg-emerald-100 text-emerald-700',
  occupee: 'bg-red-100 text-red-700',
  maintenance: 'bg-amber-100 text-amber-700',
  reservee: 'bg-sky-100 text-sky-700',
  confirmee: 'bg-emerald-100 text-emerald-700',
  en_attente: 'bg-amber-100 text-amber-700',
  checkin: 'bg-sky-100 text-sky-700',
  checkout: 'bg-gray-100 text-gray-600',
  annulee: 'bg-red-100 text-red-700',
};

function getStatutBadge(statut: string) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize',
        STATUT_COLORS[statut] || 'bg-gray-100 text-gray-600'
      )}
    >
      {STATUT_LABELS[statut] || statut}
    </span>
  );
}

// ─── Composant ──────────────────────────────────────────────────────────

export default function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Recherche avec debounce
  const performSearch = useCallback(async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setResults(null);
      setHasSearched(false);
      setIsLoading(false);
      return;
    }

    // Annuler la requête précédente
    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setHasSearched(false);

    try {
      const params = new URLSearchParams({ q: searchTerm });
      const res = await fetch(`/api/search?${params.toString()}`, {
        signal: controller.signal,
      });
      const json = await res.json();

      if (controller.signal.aborted) return;

      if (json.success) {
        setResults(json.data);
      }
      setHasSearched(true);
    } catch {
      if (!controller.signal.aborted) {
        setHasSearched(true);
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  // Debounce la saisie
  const handleValueChange = useCallback(
    (value: string) => {
      setQuery(value);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      if (value.length < 2) {
        setResults(null);
        setHasSearched(false);
        return;
      }

      debounceRef.current = setTimeout(() => {
        performSearch(value);
      }, 300);
    },
    [performSearch]
  );

  // Navigation vers la page appropriée
  const navigateTo = useCallback(
    (type: string, id: string) => {
      let path = '/';
      switch (type) {
        case 'client':
          path = `/staff/clients?client_id=${id}`;
          break;
        case 'chambre':
          path = `/staff/rooms?chambre_id=${id}`;
          break;
        case 'reservation':
          path = `/admin/reservations?reservation_id=${id}`;
          break;
      }

      onOpenChange(false);
      setQuery('');
      setResults(null);
      setHasSearched(false);
      router.push(path);
    },
    [router, onOpenChange]
  );

  // Nettoyage à la fermeture
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        setQuery('');
        setResults(null);
        setHasSearched(false);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (abortRef.current) abortRef.current.abort();
      }
      onOpenChange(newOpen);
    },
    [onOpenChange]
  );

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  // Compteur de résultats
  const clientCount = results?.clients.length ?? 0;
  const chambreCount = results?.chambres.length ?? 0;
  const reservationCount = results?.reservations.length ?? 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogHeader className="sr-only">
        <DialogTitle>Recherche globale</DialogTitle>
        <DialogDescription>
          Rechercher des clients, chambres et réservations
        </DialogDescription>
      </DialogHeader>
      <DialogContent className="overflow-hidden p-0 sm:max-w-[580px]">
        <Command shouldFilter={false} className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-3 [&_[cmdk-item]]:py-2.5">
          {/* ── Input ──────────────────────────────────────────────── */}
          <div className="flex items-center border-b px-3" data-slot="command-input-wrapper">
            <SearchIcon className="mr-2 size-4 shrink-0 opacity-50" />
            <input
              type="text"
              value={query}
              onChange={(e) => handleValueChange(e.target.value)}
              placeholder="Rechercher un client, chambre, réservation..."
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              autoFocus
            />
            <kbd className="pointer-events-none ml-2 inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              ESC
            </kbd>
          </div>

          {/* ── Liste des résultats ────────────────────────────────── */}
          <CommandList className="max-h-[420px]">
            {isLoading && (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                <span>Recherche en cours...</span>
              </div>
            )}

            {!isLoading && hasSearched && results && results.total === 0 && (
              <CommandEmpty>
                <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                  <SearchX className="size-8 opacity-40" />
                  <p className="text-sm font-medium">Aucun résultat trouvé</p>
                  <p className="text-xs">
                    Essayez avec un autre terme de recherche
                  </p>
                </div>
              </CommandEmpty>
            )}

            {/* ── Groupe : Clients ─────────────────────────────────── */}
            {!isLoading && results && clientCount > 0 && (
              <CommandGroup heading={`Clients (${clientCount})`}>
                {results.clients.map((client) => (
                  <CommandItem
                    key={`client-${client.id}`}
                    value={`client-${client.id}`}
                    onSelect={() => navigateTo('client', client.id)}
                    className="flex items-center gap-3"
                  >
                    <Users className="size-4 shrink-0 text-muted-foreground" />
                    <div className="flex flex-1 items-center gap-2 overflow-hidden">
                      <div className="flex flex-col overflow-hidden">
                        <span className="truncate text-sm font-medium">
                          {client.nom} {client.prenom}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {client.telephone}
                        </span>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                      Client
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* ── Groupe : Chambres ────────────────────────────────── */}
            {!isLoading && results && chambreCount > 0 && (
              <CommandGroup heading={`Chambres (${chambreCount})`}>
                {results.chambres.map((chambre) => (
                  <CommandItem
                    key={`chambre-${chambre.id}`}
                    value={`chambre-${chambre.id}`}
                    onSelect={() => navigateTo('chambre', chambre.id)}
                    className="flex items-center gap-3"
                  >
                    <Bed className="size-4 shrink-0 text-muted-foreground" />
                    <div className="flex flex-1 items-center gap-2 overflow-hidden">
                      <div className="flex flex-col overflow-hidden">
                        <span className="truncate text-sm font-medium">
                          Chambre {chambre.numero}
                          <span className="ml-1.5 text-xs font-normal capitalize text-muted-foreground">
                            {chambre.type}
                          </span>
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {formatCFA(chambre.prix_nuit)}/nuit
                        </span>
                      </div>
                    </div>
                    {getStatutBadge(chambre.statut)}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* ── Groupe : Réservations ────────────────────────────── */}
            {!isLoading && results && reservationCount > 0 && (
              <CommandGroup heading={`Réservations (${reservationCount})`}>
                {results.reservations.map((reservation) => (
                  <CommandItem
                    key={`reservation-${reservation.id}`}
                    value={`reservation-${reservation.id}`}
                    onSelect={() => navigateTo('reservation', reservation.id)}
                    className="flex items-center gap-3"
                  >
                    <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
                    <div className="flex flex-1 items-center gap-2 overflow-hidden">
                      <div className="flex flex-col overflow-hidden">
                        <span className="truncate text-sm font-medium">
                          {reservation.client_nom}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          Ch. {reservation.chambre_numero} ·{' '}
                          {reservation.date_arrivee}
                        </span>
                      </div>
                    </div>
                    {getStatutBadge(reservation.statut)}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* ── État initial (aucune recherche) ──────────────────── */}
            {!isLoading && !hasSearched && !results && query.length >= 2 && (
              <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                <span className="text-sm">Recherche en cours...</span>
              </div>
            )}

            {!isLoading && !hasSearched && query.length < 2 && (
              <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
                <SearchIcon className="size-10 opacity-20" />
                <div className="text-center">
                  <p className="text-sm font-medium">
                    Recherche globale
                  </p>
                  <p className="mt-1 max-w-xs text-xs leading-relaxed">
                    Tapez au moins 2 caractères pour rechercher parmi les
                    clients, chambres et réservations
                  </p>
                </div>
                <div className="flex gap-4 pt-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="size-3" />
                    <span>Clients</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Bed className="size-3" />
                    <span>Chambres</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarDays className="size-3" />
                    <span>Réservations</span>
                  </div>
                </div>
              </div>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

// ─── Icône Search (pour l'input) ────────────────────────────────────────

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
