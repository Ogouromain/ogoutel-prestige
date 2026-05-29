'use client';

import { useRef } from 'react';
import { Printer, Receipt, User, BedDouble, CalendarDays, Wallet, CheckCircle2, MapPin, Phone } from 'lucide-react';
import { cn, formatCFA, formatDate, formatDateCourt } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PaymentReceiptData {
  factureNumero: string;
  clientNom: string;
  chambreNumero: string;
  datePaiement: string;
  modePaiement: string;
  montantHT: number;
  tauxTVA: number;
  montantTVA: number;
  montantTTC: number;
  hotelNom: string;
  hotelAdresse: string;
  hotelTelephone: string;
}

// ─── Composant principal ─────────────────────────────────────────────────────

interface PaymentReceiptProps {
  data: PaymentReceiptData;
  className?: string;
}

export default function PaymentReceipt({ data, className }: PaymentReceiptProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  /** Retourne le libellé lisible d'un mode de paiement */
  const getLibelleModePaiement = (mode: string): string => {
    const labels: Record<string, string> = {
      especes: 'Espèces',
      mobile_money: 'Mobile Money',
      virement: 'Virement bancaire',
      cheque: 'Chèque',
      carte: 'Carte bancaire',
    };
    return labels[mode] ?? mode;
  };

  return (
    <>
      {/* Style d'impression */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .print-receipt-payment,
          .print-receipt-payment * {
            visibility: visible !important;
          }
          .print-receipt-payment {
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
          'print-receipt-payment mx-auto w-full max-w-md rounded-lg border border-gray-200 bg-white shadow-lg',
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
            <p className="text-sm font-bold text-[#1B4332]">REÇU DE PAIEMENT</p>
          </div>
        </div>

        {/* ── Contenu ── */}
        <div className="px-6 py-5">
          {/* Numéro de facture + Date */}
          <div className="mb-4 flex items-center justify-between border-b border-dashed border-gray-300 pb-3">
            <div>
              <span className="block text-[10px] font-medium uppercase text-gray-400">
                Facture N°
              </span>
              <span className="font-mono text-xs font-bold text-gray-700">
                {data.factureNumero}
              </span>
            </div>
            <div className="text-right">
              <span className="block text-[10px] font-medium uppercase text-gray-400">
                Date
              </span>
              <span className="text-xs font-medium text-gray-700">
                {formatDate(data.datePaiement)}
              </span>
            </div>
          </div>

          {/* Informations client & chambre */}
          <div className="mb-5">
            <div className="mb-2 flex items-center gap-2">
              <User className="h-4 w-4 text-[#D4AF37]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">
                Client
              </h3>
            </div>
            <div className="ml-6 space-y-1">
              <p className="text-sm font-semibold text-gray-900">
                {data.clientNom}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <BedDouble className="h-3 w-3" />
                <span>Chambre {data.chambreNumero}</span>
              </div>
            </div>
          </div>

          {/* Détail financier */}
          <div className="mb-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Receipt className="h-4 w-4 text-[#D4AF37]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">
                Détail du paiement
              </h3>
            </div>
            <div className="space-y-2.5">
              {/* Montant HT */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Montant HT</span>
                <span className="text-sm font-medium text-gray-700">
                  {formatCFA(data.montantHT)}
                </span>
              </div>

              {/* TVA */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  TVA ({data.tauxTVA}%)
                </span>
                <span className="text-sm font-medium text-gray-700">
                  {formatCFA(data.montantTVA)}
                </span>
              </div>

              {/* Total TTC */}
              <div className="border-t-2 border-[#D4AF37] pt-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-900">
                    Total TTC
                  </span>
                  <span className="text-lg font-bold text-[#1B4332]">
                    {formatCFA(data.montantTTC)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Mode de paiement */}
          <div className="mb-4 rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/5 p-4">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-[#D4AF37]" />
              <span className="text-xs font-medium uppercase text-gray-500">
                Mode de paiement
              </span>
            </div>
            <p className="mt-1 ml-6 text-sm font-semibold text-gray-900">
              {getLibelleModePaiement(data.modePaiement)}
            </p>
          </div>

          {/* Statut paiement */}
          <div className="flex items-center justify-center gap-2 rounded-full bg-emerald-50 px-4 py-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-700">
              Paiement confirmé
            </span>
          </div>
        </div>

        {/* ── Pied de page ── */}
        <div className="border-t border-gray-200 px-6 py-4 text-center">
          <p className="text-xs font-semibold text-[#1B4332]">
            Merci pour votre confiance
          </p>
          <p className="mt-1 text-[10px] text-gray-400">
            Imprimé le {formatDateCourt(new Date().toISOString())}
          </p>
          <p className="mt-1 text-[10px] text-gray-400">
            {data.hotelNom} — {data.hotelAdresse} — {data.hotelTelephone}
          </p>
        </div>
      </div>
    </>
  );
}
