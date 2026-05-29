'use client';

// ============================================
// OGOUTEL_Prestige - DataTable
// Tableau réutilisable complet
// - Pagination
// - Recherche
// - Tri par colonne
// - Export CSV
// - Sélection multiple
// - Actions par ligne
// - Loading skeleton
// - Empty state
//
// Utilise @tanstack/react-table v8
// ============================================

import { useState, useMemo, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type RowSelectionState,
} from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  SlidersHorizontal,
} from 'lucide-react';
import { LoadingSpinnerInline } from '@/components/ui/LoadingSpinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

// ─── Types ──────────────────────────────────────────────────────────────────

type TableAction<TData> = {
  label: string;
  onClick: (rows: TData[]) => void;
  variant?: 'default' | 'danger';
  icon?: React.ReactNode;
  show?: boolean | ((selectedCount: number) => boolean);
};

interface DataTableProps<TData, TValue> {
  /** Colonnes définies */
  columns: ColumnDef<TData, TValue>[];
  /** Données */
  data: TData[];
  /** Clé unique de chaque ligne */
  rowKey?: string;
  /** Recherche activée */
  searchable?: boolean;
  /** Placeholder de recherche */
  searchPlaceholder?: string;
  /** Champ de recherche (clé dans les données) */
  searchKey?: string;
  /** Fonction de recherche personnalisée */
  searchFn?: (data: TData[], query: string) => TData[];
  /** Export CSV activé */
  exportable?: boolean;
  /** Nom du fichier export CSV */
  exportFilename?: string;
  /** Sélection multiple activée */
  selectable?: boolean;
  /** Actions globales pour les lignes sélectionnées */
  selectionActions?: TableAction<TData>[];
  /** Chargement */
  isLoading?: boolean;
  /** Message quand vide */
  emptyMessage?: string;
  /** Empty state personnalisé */
  emptyState?: React.ReactNode;
  /** Nombre de lignes par page par défaut */
  pageSize?: number;
  /** Options de taille de page */
  pageSizeOptions?: number[];
  /** Hauteur maximale avec scroll */
  maxHeight?: string;
  /** Classes additionnelles pour le conteneur */
  className?: string;
}

// ─── Fonctions utilitaires ──────────────────────────────────────────────────

function exportToCSV<TData extends Record<string, unknown>>(
  data: TData[],
  filename: string,
  columns: ColumnDef<TData, unknown>[]
) {
  const headers = columns
    .filter((col) => col.header && typeof col.header === 'string')
    .map((col) => String(col.header));

  const rows = data.map((row) =>
    columns
      .filter((col) => col.header && typeof col.header === 'string')
      .map((col) => {
        const accessor = col.accessorKey;
        if (!accessor) return '';
        const keys = String(accessor).split('.');
        let value: unknown = row;
        for (const key of keys) {
          if (value && typeof value === 'object' && key in value) {
            value = (value as Record<string, unknown>)[key];
          } else {
            value = '';
            break;
          }
        }
        return String(value ?? '').replace(/"/g, '""');
      })
  );

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ─── Composant principal ────────────────────────────────────────────────────

export function DataTable<TData, TValue>({
  columns,
  data,
  rowKey = 'id',
  searchable = false,
  searchPlaceholder = 'Rechercher...',
  searchKey,
  searchFn,
  exportable = false,
  exportFilename = 'export',
  selectable = false,
  selectionActions,
  isLoading = false,
  emptyMessage = 'Aucune donnée trouvée.',
  emptyState,
  pageSize: defaultPageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
  maxHeight,
  className,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState('');

  // Colonnes enrichies avec sélection
  const allColumns = useMemo(() => {
    const enriched: ColumnDef<TData, TValue>[] = [...columns];

    if (selectable) {
      enriched.unshift({
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Sélectionner tout"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={`Sélectionner la ligne ${row.index + 1}`}
          />
        ),
        size: 40,
        enableSorting: false,
        enableHiding: false,
      } as ColumnDef<TData, TValue>);
    }

    return enriched;
  }, [columns, selectable]);

  const table = useReactTable({
    data: data as Record<string, unknown>[],
    columns: allColumns as ColumnDef<Record<string, unknown>, TValue>[],
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => String((row as Record<string, unknown>)[rowKey] ?? ''),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: defaultPageSize,
      },
    },
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedCount = selectedRows.length;

  // Export CSV handler
  const handleExport = useCallback(() => {
    const allData = table.getFilteredRowModel().rows.map((r) => r.original as Record<string, unknown>);
    exportToCSV(allData, exportFilename, columns as ColumnDef<Record<string, unknown>, unknown>[]);
  }, [table, columns, exportFilename]);

  // Recherche personnalisée
  const handleSearch = useCallback(
    (query: string) => {
      setGlobalFilter(query);
    },
    []
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* ─── Toolbar ───────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Recherche */}
        {searchable && (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder={searchPlaceholder}
              value={globalFilter}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Actions sur sélection */}
          {selectable && selectionActions && selectedCount > 0 && (
            <div className="flex items-center gap-2 mr-2">
              <span className="text-sm text-gray-500">
                {selectedCount} sélectionné{selectedCount > 1 ? 's' : ''}
              </span>
              {selectionActions.map((action, idx) => {
                const show = typeof action.show === 'function'
                  ? action.show(selectedCount)
                  : action.show !== false;
                if (!show) return null;
                return (
                  <Button
                    key={idx}
                    size="sm"
                    variant={action.variant === 'danger' ? 'destructive' : 'outline'}
                    onClick={() => action.onClick(selectedRows.map((r) => r.original as unknown as TData))}
                    className="gap-1.5"
                  >
                    {action.icon}
                    {action.label}
                  </Button>
                );
              })}
            </div>
          )}

          {/* Export CSV */}
          {exportable && data.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="gap-1.5"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
          )}

          {/* Toggle colonnes */}
          <DropdownColumns table={table} />
        </div>
      </div>

      {/* ─── Table ────────────────────────────────────── */}
      <div className={cn('rounded-lg border border-gray-200 bg-white overflow-hidden')}>
        <div className={cn(maxHeight ? `max-h-[${maxHeight}] overflow-y-auto` : '')} style={maxHeight ? { maxHeight } : undefined}>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-gray-50/80 hover:bg-gray-50/80">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                      className="text-xs font-semibold uppercase text-gray-500 tracking-wider"
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={cn(
                            header.column.getCanSort() && 'flex items-center gap-1 cursor-pointer select-none hover:text-gray-700',
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && (
                            <span className="text-gray-400">
                              {header.column.getIsSorted() === 'asc' ? (
                                <ArrowUp className="h-3 w-3" />
                              ) : header.column.getIsSorted() === 'desc' ? (
                                <ArrowDown className="h-3 w-3" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3" />
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    {allColumns.map((_, j) => (
                      <TableCell key={`skeleton-cell-${j}`}>
                        <Skeleton className="h-4 w-full max-w-[120px]" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className="transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="text-sm">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                // Empty state
                <TableRow>
                  <TableCell colSpan={allColumns.length} className="h-40">
                    {emptyState ? (
                      <div className="flex flex-col items-center justify-center">
                        {emptyState}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                          <SlidersHorizontal className="h-5 w-5 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">{emptyMessage}</p>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ─── Pagination ────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>
            {table.getFilteredRowModel().rows.length} ligne{table.getFilteredRowModel().rows.length > 1 ? 's' : ''}
          </span>
          {selectable && selectedCount > 0 && (
            <span className="text-[#D4AF37]">
              ({selectedCount} sélectionné{selectedCount > 1 ? 's' : ''})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Taille de page */}
          <Select
            value={String(table.getState().pagination.pageSize)}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Boutons de page */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="px-2 text-sm text-gray-600">
              Page {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
            </span>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sous-composant : Dropdown colonnes ──────────────────────────────────────

function DropdownColumns<TData>({ table }: { table: ReturnType<typeof useReactTable<Record<string, unknown>, unknown>> }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
        className="gap-1.5"
      >
        <SlidersHorizontal className="h-4 w-4" />
        <span className="hidden sm:inline">Colonnes</span>
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
            {table
              .getAllColumns()
              .filter((col) => col.getCanHide())
              .map((column) => (
                <label
                  key={column.id}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-gray-50"
                >
                  <Checkbox
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  />
                  <span className="truncate text-gray-700">
                    {typeof column.columnDef.header === 'string'
                      ? column.columnDef.header
                      : column.id}
                  </span>
                </label>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
