'use client';

import { useRef } from 'react';
import { Printer, BarChart3, BedDouble, Users, TrendingUp, LogIn, LogOut, CircleDollarSign, MapPin, Phone } from 'lucide-react';
import { cn, formatCFA, formatDate, formatDateCourt } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ArriveeItem {
  clientNom: string;
  chambreNumero: string;
  heureArrivee?: string;
  typeChambre?: string;
}

export interface DepartItem {
  clientNom: string;
  chambreNumero: string;
  heureDepart?: string;
  typeChambre?: string;
}

export interface ReservationEnCoursItem {
  clientNom: string;
  chambreNumero: string;
  dateArrivee: string;
  dateDepart: string;
}

export interface DailyReportData {
  date: string;
  hotelNom: string;
  totalChambres: number;
  chambresDisponibles: number;
  chambresOccupees: number;
  tauxOccupation: number;
  checkinsJour: number;
  checkoutsJour: number;
  revenusJour: number;
  arrivees: ArriveeItem[];
  departs: DepartItem[];
  reservationsEnCours: ReservationEnCoursItem[];
}

// ─── Composant principal ─────────────────────────────────────────────────────

interface DailyReportProps {
  data: DailyReportData;
  className?: string;
}

export default function DailyReport({ data, className }: DailyReportProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Style d'impression */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .print-daily-report,
          .print-daily-report * {
            visibility: visible !important;
          }
          .print-daily-report {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            margin: 10mm;
            size: A4 portrait;
          }
        }
      `}</style>

      {/* Bouton d'impression — masqué à l'impression */}
      <div className="no-print mb-4 flex justify-end">
        <Button
          onClick={handlePrint}
          className="gap-2 bg-[#1B4332] text-white hover:bg-[#1B4332]/90"
        >
          <Printer className="h-4 w-4" />
          Imprimer
        </Button>
      </div>

      {/* Rapport à imprimer */}
      <div
        ref={printRef}
        className={cn(
          'print-daily-report mx-auto w-full max-w-3xl rounded-lg border border-gray-200 bg-white shadow-lg',
          className
        )}
      >
        {/* ── En-tête ── */}
        <div className="border-b-2 border-[#D4AF37] bg-[#1B4332] px-8 py-6 text-center text-white">
          <p className="text-xs font-semibold tracking-[0.3em] text-[#D4AF37]">
            OGOUTEL_Prestige
          </p>
          <h2 className="mt-1 text-xl font-bold">{data.hotelNom}</h2>
          <div className="mt-1 flex flex-col items-center gap-0.5 text-xs text-white/70">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Côte d&apos;Ivoire
            </span>
          </div>
          <div className="mt-3 inline-block rounded-md bg-[#D4AF37] px-5 py-1.5">
            <p className="text-sm font-bold text-[#1B4332]">RAPPORT JOURNALIER</p>
          </div>
          <p className="mt-2 text-sm font-medium text-white/80">
            {formatDate(data.date)}
          </p>
        </div>

        {/* ── Contenu ── */}
        <div className="px-8 py-6">
          {/* ── Statistiques résumé ── */}
          <div className="mb-6">
            <div className="mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#D4AF37]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">
                État des chambres
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {/* Total */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center">
                <BedDouble className="mx-auto h-5 w-5 text-gray-400" />
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {data.totalChambres}
                </p>
                <p className="text-[10px] font-medium uppercase text-gray-500">
                  Total
                </p>
              </div>

              {/* Disponibles */}
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-center">
                <BedDouble className="mx-auto h-5 w-5 text-emerald-500" />
                <p className="mt-1 text-2xl font-bold text-emerald-700">
                  {data.chambresDisponibles}
                </p>
                <p className="text-[10px] font-medium uppercase text-emerald-600">
                  Disponibles
                </p>
              </div>

              {/* Occupées */}
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center">
                <BedDouble className="mx-auto h-5 w-5 text-red-500" />
                <p className="mt-1 text-2xl font-bold text-red-700">
                  {data.chambresOccupees}
                </p>
                <p className="text-[10px] font-medium uppercase text-red-600">
                  Occupées
                </p>
              </div>

              {/* Taux d'occupation */}
              <div className="rounded-lg border border-[#F77F00]/30 bg-[#F77F00]/5 p-3 text-center">
                <TrendingUp className="mx-auto h-5 w-5 text-[#F77F00]" />
                <p className="mt-1 text-2xl font-bold text-[#F77F00]">
                  {data.tauxOccupation}%
                </p>
                <p className="text-[10px] font-medium uppercase text-[#F77F00]">
                  Occupation
                </p>
              </div>
            </div>
          </div>

          {/* ── Activité du jour ── */}
          <div className="mb-6">
            <div className="mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-[#D4AF37]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">
                Activité du jour
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {/* Check-ins */}
              <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-center">
                <LogIn className="mx-auto h-5 w-5 text-sky-500" />
                <p className="mt-1 text-2xl font-bold text-sky-700">
                  {data.checkinsJour}
                </p>
                <p className="text-[10px] font-medium uppercase text-sky-600">
                  Check-ins
                </p>
              </div>

              {/* Check-outs */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center">
                <LogOut className="mx-auto h-5 w-5 text-gray-500" />
                <p className="mt-1 text-2xl font-bold text-gray-700">
                  {data.checkoutsJour}
                </p>
                <p className="text-[10px] font-medium uppercase text-gray-500">
                  Check-outs
                </p>
              </div>

              {/* Revenus */}
              <div className="col-span-2 rounded-lg border border-[#1B4332]/20 bg-[#1B4332]/5 p-3 text-center sm:col-span-1">
                <CircleDollarSign className="mx-auto h-5 w-5 text-[#1B4332]" />
                <p className="mt-1 text-xl font-bold text-[#1B4332]">
                  {formatCFA(data.revenusJour)}
                </p>
                <p className="text-[10px] font-medium uppercase text-[#1B4332]">
                  Revenus
                </p>
              </div>
            </div>
          </div>

          {/* ── Tableau des arrivées ── */}
          {data.arrivees.length > 0 && (
            <div className="mb-6">
              <div className="mb-3 flex items-center gap-2">
                <LogIn className="h-4 w-4 text-sky-500" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">
                  Arrivées du jour ({data.arrivees.length})
                </h3>
              </div>
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-2 font-semibold text-gray-600">
                        N°
                      </th>
                      <th className="px-4 py-2 font-semibold text-gray-600">
                        Client
                      </th>
                      <th className="px-4 py-2 font-semibold text-gray-600">
                        Chambre
                      </th>
                      <th className="hidden px-4 py-2 font-semibold text-gray-600 sm:table-cell">
                        Type
                      </th>
                      <th className="hidden px-4 py-2 font-semibold text-gray-600 md:table-cell">
                        Heure
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.arrivees.map((arrivee, index) => (
                      <tr
                        key={index}
                        className="border-b border-gray-100 last:border-0"
                      >
                        <td className="px-4 py-2 text-gray-400">
                          {index + 1}
                        </td>
                        <td className="px-4 py-2 font-medium text-gray-900">
                          {arrivee.clientNom}
                        </td>
                        <td className="px-4 py-2 text-gray-700">
                          {arrivee.chambreNumero}
                        </td>
                        <td className="hidden px-4 py-2 text-gray-600 sm:table-cell">
                          {arrivee.typeChambre ?? '—'}
                        </td>
                        <td className="hidden px-4 py-2 text-gray-600 md:table-cell">
                          {arrivee.heureArrivee ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Tableau des départs ── */}
          {data.departs.length > 0 && (
            <div className="mb-6">
              <div className="mb-3 flex items-center gap-2">
                <LogOut className="h-4 w-4 text-gray-500" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">
                  Départs du jour ({data.departs.length})
                </h3>
              </div>
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-2 font-semibold text-gray-600">
                        N°
                      </th>
                      <th className="px-4 py-2 font-semibold text-gray-600">
                        Client
                      </th>
                      <th className="px-4 py-2 font-semibold text-gray-600">
                        Chambre
                      </th>
                      <th className="hidden px-4 py-2 font-semibold text-gray-600 sm:table-cell">
                        Type
                      </th>
                      <th className="hidden px-4 py-2 font-semibold text-gray-600 md:table-cell">
                        Heure
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.departs.map((depart, index) => (
                      <tr
                        key={index}
                        className="border-b border-gray-100 last:border-0"
                      >
                        <td className="px-4 py-2 text-gray-400">
                          {index + 1}
                        </td>
                        <td className="px-4 py-2 font-medium text-gray-900">
                          {depart.clientNom}
                        </td>
                        <td className="px-4 py-2 text-gray-700">
                          {depart.chambreNumero}
                        </td>
                        <td className="hidden px-4 py-2 text-gray-600 sm:table-cell">
                          {depart.typeChambre ?? '—'}
                        </td>
                        <td className="hidden px-4 py-2 text-gray-600 md:table-cell">
                          {depart.heureDepart ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Réservations en cours ── */}
          {data.reservationsEnCours.length > 0 && (
            <div className="mb-2">
              <div className="mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#D4AF37]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">
                  Réservations en cours ({data.reservationsEnCours.length})
                </h3>
              </div>
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-2 font-semibold text-gray-600">
                        N°
                      </th>
                      <th className="px-4 py-2 font-semibold text-gray-600">
                        Client
                      </th>
                      <th className="px-4 py-2 font-semibold text-gray-600">
                        Chambre
                      </th>
                      <th className="hidden px-4 py-2 font-semibold text-gray-600 sm:table-cell">
                        Arrivée
                      </th>
                      <th className="hidden px-4 py-2 font-semibold text-gray-600 sm:table-cell">
                        Départ
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.reservationsEnCours.map((res, index) => (
                      <tr
                        key={index}
                        className="border-b border-gray-100 last:border-0"
                      >
                        <td className="px-4 py-2 text-gray-400">
                          {index + 1}
                        </td>
                        <td className="px-4 py-2 font-medium text-gray-900">
                          {res.clientNom}
                        </td>
                        <td className="px-4 py-2 text-gray-700">
                          {res.chambreNumero}
                        </td>
                        <td className="hidden px-4 py-2 text-gray-600 sm:table-cell">
                          {formatDateCourt(res.dateArrivee)}
                        </td>
                        <td className="hidden px-4 py-2 text-gray-600 sm:table-cell">
                          {formatDateCourt(res.dateDepart)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ── Pied de page ── */}
        <div className="border-t border-gray-200 px-8 py-4 text-center">
          <p className="text-[10px] font-medium text-gray-400">
            Rapport généré automatiquement par OGOUTEL_Prestige
          </p>
          <p className="mt-0.5 text-[10px] text-gray-400">
            Imprimé le {formatDateCourt(new Date().toISOString())} à{' '}
            {new Date().toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>
    </>
  );
}
