'use client';

import { useCallback } from 'react';
import { FileText, Table, FileDown, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exporterCSV, telechargerFichier, cn } from '@/lib/utils';

// ─── Types ──────────────────────────────────────────────────────────────

interface ColumnDef {
  key: string;
  label: string;
}

type ExportFormat = 'csv' | 'excel' | 'pdf';

interface ExportButtonsProps {
  /** Données à exporter (tableau d'objets) */
  data: Record<string, unknown>[];
  /** Nom de base du fichier (ex: "reservations") */
  filename: string;
  /** Définition des colonnes optionnelle */
  columns?: ColumnDef[];
  /** Formats disponibles, par défaut ["csv", "excel", "pdf"] */
  formats?: ExportFormat[];
  /** Classe CSS supplémentaire */
  className?: string;
}

// ─── Composant ──────────────────────────────────────────────────────────

export function ExportButtons({
  data,
  filename,
  columns,
  formats = ['csv', 'excel', 'pdf'],
  className,
}: ExportButtonsProps) {
  const isEmpty = !data || data.length === 0;

  /** Détermine les colonnes à utiliser pour l'export */
  const getColumns = useCallback((): ColumnDef[] => {
    if (columns && columns.length > 0) return columns;
    if (data.length > 0) {
      return Object.keys(data[0]).map((key) => ({ key, label: key }));
    }
    return [];
  }, [columns, data]);

  /** Génère le contenu CSV à partir des données */
  const generateCSV = useCallback((): string => {
    const cols = getColumns();
    const keys = cols.map((c) => c.key);
    const headers = cols.map((c) => c.label);
    const rows = data.map((row) =>
      keys.map((key) => {
        const valeur = String(row[key] ?? '');
        return valeur.includes(',') || valeur.includes('"')
          ? `"${valeur.replace(/"/g, '""')}"`
          : valeur;
      }).join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  }, [data, getColumns]);

  /** Génère le contenu CSV avec BOM pour Excel */
  const generateCSVWithBOM = useCallback((): string => {
    return '\uFEFF' + generateCSV();
  }, [generateCSV]);

  /** Génère le HTML pour l'export PDF (impression) */
  const generatePrintHTML = useCallback((): string => {
    const cols = getColumns();
    const today = new Date().toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const tableRows = data.map((row, i) => {
      const cells = cols
        .map(
          (c) =>
            `<td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;">${
              row[c.key] ?? ''
            }</td>`
        )
        .join('');
      return `<tr style="${i % 2 === 0 ? 'background:#fafafa;' : ''}">${cells}</tr>`;
    });

    const headerCells = cols
      .map(
        (c) =>
          `<th style="padding:10px 12px;background:#1a1a2e;color:white;font-size:13px;font-weight:600;text-align:left;">${c.label}</th>`
      )
      .join('');

    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${filename} — OGOUTEL Prestige</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 32px; color: #1a1a2e; }
    .header { text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #e5e7eb; }
    .header h1 { font-size: 20px; color: #1a1a2e; margin-bottom: 4px; }
    .header p { font-size: 13px; color: #6b7280; }
    .meta { display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 12px; color: #6b7280; }
    table { width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
    .footer { text-align: center; margin-top: 24px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; }
    @media print { body { padding: 16px; } .header h1 { font-size: 16px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>${filename.charAt(0).toUpperCase() + filename.slice(1)} — OGOUTEL Prestige</h1>
    <p>Export généré le ${today}</p>
  </div>
  <div class="meta">
    <span>${data.length} enregistrement${data.length > 1 ? 's' : ''}</span>
    <span>${cols.length} colonnes</span>
  </div>
  <table>
    <thead><tr>${headerCells}</tr></thead>
    <tbody>${tableRows.join('\n')}</tbody>
  </table>
  <div class="footer">OGOUTEL Prestige — Gestion Hôtelière en Côte d'Ivoire</div>
</body>
</html>`;
  }, [data, filename, getColumns]);

  // ─── Handlers d'export ──────────────────────────────────────────────────

  const handleExportCSV = useCallback(() => {
    const csv = generateCSV();
    telechargerFichier(csv, `${filename}.csv`, 'text/csv;charset=utf-8');
    toast.success('Export CSV réussi');
  }, [generateCSV, filename]);

  const handleExportExcel = useCallback(() => {
    const csvBom = generateCSVWithBOM();
    telechargerFichier(csvBom, `${filename}.csv`, 'text/csv;charset=utf-8');
    toast.success('Export Excel réussi');
  }, [generateCSVWithBOM, filename]);

  const handleExportPDF = useCallback(() => {
    const html = generatePrintHTML();
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Impossible d\'ouvrir la fenêtre d\'impression. Vérifiez votre bloqueur de pop-ups.');
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
    // Attendre le chargement complet avant de déclencher l'impression
    printWindow.onload = () => {
      printWindow.print();
    };
    toast.success('Export PDF réussi');
  }, [generatePrintHTML]);

  // ─── Définition des options d'export ────────────────────────────────────

  const exportOptions: {
    format: ExportFormat;
    label: string;
    icon: React.ReactNode;
    handler: () => void;
    description: string;
  }[] = [
    {
      format: 'csv',
      label: 'Exporter en CSV',
      icon: <FileText className="size-4" />,
      handler: handleExportCSV,
      description: 'Fichier CSV standard',
    },
    {
      format: 'excel',
      label: 'Exporter en Excel',
      icon: <Table className="size-4" />,
      handler: handleExportExcel,
      description: 'CSV compatible Excel (UTF-8)',
    },
    {
      format: 'pdf',
      label: 'Exporter en PDF',
      icon: <FileDown className="size-4" />,
      handler: handleExportPDF,
      description: 'Impression / Sauvegarde PDF',
    },
  ].filter((opt) => formats.includes(opt.format));

  // ─── Rendu ────────────────────────────────────────────────────────────

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('min-h-[44px] min-w-[44px] gap-2', className)}
          disabled={isEmpty}
          aria-label="Options d'export"
        >
          <Download className="size-4" />
          <span className="hidden sm:inline">Exporter</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {isEmpty
            ? 'Aucune donnée à exporter'
            : `${data.length} enregistrement${data.length > 1 ? 's' : ''}`}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {exportOptions.map((option) => (
          <DropdownMenuItem
            key={option.format}
            onClick={option.handler}
            disabled={isEmpty}
            className="min-h-[44px] cursor-pointer gap-3"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
              {option.icon}
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{option.label}</span>
              <span className="text-xs text-muted-foreground">
                {option.description}
              </span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
