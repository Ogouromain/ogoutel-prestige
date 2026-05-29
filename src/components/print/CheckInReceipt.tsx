'use client';

import { useRef } from 'react';
import { Printer, User, BedDouble, CalendarDays, CreditCard, QrCode, MapPin, Phone } from 'lucide-react';
import { cn, formatCFA, formatDate, formatDateCourt } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CheckInReceiptData {
  reservationId: string;
  clientNom: string;
  clientPrenom: string;
  clientTelephone: string;
  clientNationalite: string;
  chambreNumero: string;
  chambreType: string;
  chambreEtage?: string;
  dateArrivee: string;
  dateDepart: string;
  nombreNuits: number;
  prixNuit: number;
  montantTotal: number;
  hotelNom: string;
  hotelAdresse: string;
  hotelTelephone: string;
}

// ─── Composant principal ─────────────────────────────────────────────────────

interface CheckInReceiptProps {
  data: CheckInReceiptData;
  className?: string;
}

export default function CheckInReceipt({ data, className }: CheckInReceiptProps) {
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
          .print-receipt-checkin,
          .print-receipt-checkin * {
            visibility: visible !important;
          }
          .print-receipt-checkin {
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
            size: 80mm auto;
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

      {/* Reçu à imprimer */}
      <div
        ref={printRef}
        className={cn(
          'print-receipt-checkin mx-auto w-full max-w-md rounded-lg border border-gray-200 bg-white shadow-lg',
          className
        )}
      >
        {/* ── En-tête ── */}
        <div className="border-b-2 border-[#D4AF37] bg-[#1B4332] px-6 py-5 text-center text-white">
          <p className="text-xs font-semibold tracking-[0.3em] text-[#D4AF37]">
            OGOUTEL_Prestige
          </p>
          <h2 className="mt-1 text-lg font-bold">{data.hotelNom}</h2>
          <div className="mt-1 flex flex-col items-center gap-0.5 text-xs text-white/70">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {data.hotelAdresse}
            </span>
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {data.hotelTelephone}
            </span>
          </div>
          <div className="mt-3 inline-block rounded-md bg-[#D4AF37] px-4 py-1">
            <p className="text-sm font-bold text-[#1B4332]">REÇU DE CHECK-IN</p>
          </div>
        </div>

        {/* ── Contenu ── */}
        <div className="px-6 py-5">
          {/* Numéro de réservation */}
          <div className="mb-4 flex items-center justify-between border-b border-dashed border-gray-300 pb-3">
            <span className="text-xs font-medium text-gray-500">Réservation</span>
            <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs font-semibold text-gray-700">
              {data.reservationId}
            </span>
          </div>

          {/* Informations client */}
          <div className="mb-5">
            <div className="mb-2 flex items-center gap-2">
              <User className="h-4 w-4 text-[#D4AF37]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">
                Client
              </h3>
            </div>
            <div className="ml-6 space-y-1.5">
              <p className="text-sm font-semibold text-gray-900">
                {data.clientPrenom} {data.clientNom}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Phone className="h-3 w-3" />
                <span>{data.clientTelephone}</span>
              </div>
              <p className="text-xs text-gray-600">
                <span className="font-medium">Nationalité :</span>{' '}
                {data.clientNationalite}
              </p>
            </div>
          </div>

          {/* Informations chambre */}
          <div className="mb-5">
            <div className="mb-2 flex items-center gap-2">
              <BedDouble className="h-4 w-4 text-[#D4AF37]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">
                Chambre
              </h3>
            </div>
            <div className="ml-6 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Numéro</span>
                <span className="text-sm font-bold text-gray-900">
                  Chambre {data.chambreNumero}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Type</span>
                <span className="text-sm font-medium text-gray-700">
                  {data.chambreType}
                </span>
              </div>
              {data.chambreEtage && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Étage</span>
                  <span className="text-sm font-medium text-gray-700">
                    {data.chambreEtage}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Dates du séjour */}
          <div className="mb-5">
            <div className="mb-2 flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-[#D4AF37]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">
                Séjour
              </h3>
            </div>
            <div className="ml-6 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Arrivée</span>
                <span className="text-sm font-medium text-gray-700">
                  {formatDate(data.dateArrivee)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Départ</span>
                <span className="text-sm font-medium text-gray-700">
                  {formatDate(data.dateDepart)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Durée</span>
                <span className="rounded-full bg-[#F77F00]/10 px-2.5 py-0.5 text-xs font-semibold text-[#F77F00]">
                  {data.nombreNuits} {data.nombreNuits > 1 ? 'nuits' : 'nuit'}
                </span>
              </div>
            </div>
          </div>

          {/* Résumé financier */}
          <div className="mb-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[#D4AF37]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">
                Résumé Financier
              </h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Prix par nuit
                </span>
                <span className="text-sm font-medium text-gray-700">
                  {formatCFA(data.prixNuit)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Nombre de nuits
                </span>
                <span className="text-sm font-medium text-gray-700">
                  × {data.nombreNuits}
                </span>
              </div>
              <div className="border-t-2 border-[#D4AF37] pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-900">
                    TOTAL
                  </span>
                  <span className="text-base font-bold text-[#1B4332]">
                    {formatCFA(data.montantTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code placeholder */}
          <div className="flex flex-col items-center pt-2">
            <div className="flex h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
              <div className="text-center">
                <QrCode className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-0.5 text-[9px] font-medium text-gray-400">
                  QR Code
                </p>
              </div>
            </div>
            <p className="mt-1 text-[10px] text-gray-400">
              Scanner pour vérifier
            </p>
          </div>
        </div>

        {/* ── Pied de page ── */}
        <div className="border-t border-gray-200 px-6 py-4 text-center">
          <p className="text-[10px] font-medium text-gray-400">
            Imprimé le {formatDateCourt(new Date().toISOString())}
          </p>
          <p className="mt-1 text-xs font-semibold text-[#1B4332]">
            Merci de votre confiance
          </p>
          <p className="mt-1 text-[10px] text-gray-400">
            {data.hotelNom} — {data.hotelAdresse}
          </p>
        </div>
      </div>
    </>
  );
}
