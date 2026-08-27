import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table'
import { cn } from '../lib/utils'
import { t } from '../lib/i18n'

interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T, unknown>[]
  loading?: boolean
  emptyMessage?: string
  className?: string
  // Server-side sorting (opt-in). A column opts in with `meta: { sortable: true }`;
  // clicking its header calls onSort with the column id. Sorting is done by the
  // backend, not TanStack — this only renders the clickable header + indicator.
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  onSort?: (columnId: string) => void
}

/**
 * Accessible data table backed by TanStack Table.
 * Pagination is handled externally — pass a page slice and wire up pagination controls.
 */
export function DataTable<T>({
  data,
  columns,
  loading = false,
  emptyMessage = t.noResults,
  className,
  sortBy,
  sortDir,
  onSort,
}: DataTableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className={cn('overflow-x-auto rounded-lg border border-gray-200', className)}>
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => {
                const meta = header.column.columnDef.meta as { sortable?: boolean } | undefined
                const sortable = !!onSort && !!meta?.sortable
                const isSorted = sortBy === header.column.id
                const label = header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())
                return (
                  <th
                    key={header.id}
                    scope="col"
                    aria-sort={
                      isSorted ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined
                    }
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => onSort(header.column.id)}
                        className="inline-flex items-center gap-1 hover:text-gray-700 uppercase tracking-wider"
                      >
                        {label}
                        <span className="text-gray-400">
                          {isSorted ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
                        </span>
                      </button>
                    ) : (
                      label
                    )}
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-400">
                {t.loading}
              </td>
            </tr>
          ) : table.getRowModel().rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 text-gray-700">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

interface PaginationProps {
  total: number
  limit: number
  offset: number
  onChange: (offset: number) => void
}

/** Windowed list of page indices (0-based) with -1 markers for ellipses. */
function pageWindow(current: number, count: number): number[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i)
  const pages = new Set<number>([0, count - 1, current, current - 1, current + 1])
  const sorted = [...pages].filter((p) => p >= 0 && p < count).sort((a, b) => a - b)
  const out: number[] = []
  let prev = -2
  for (const p of sorted) {
    if (p - prev > 1) out.push(-1) // ellipsis
    out.push(p)
    prev = p
  }
  return out
}

export function Pagination({ total, limit, offset, onChange }: PaginationProps) {
  const page = Math.floor(offset / limit)
  const pageCount = Math.ceil(total / limit)
  const from = offset + 1
  const to = Math.min(offset + limit, total)

  if (total === 0) return null

  const btn = 'px-3 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50'

  return (
    <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
      <span>{t.showing(from, to, total)}</span>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(offset - limit)} disabled={page === 0} className={btn}>
          {t.previous}
        </button>
        {pageCount > 1 &&
          pageWindow(page, pageCount).map((p, i) =>
            p === -1 ? (
              <span key={`ellipsis-${i}`} className="px-2 text-gray-400">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onChange(p * limit)}
                aria-current={p === page ? 'page' : undefined}
                className={cn(
                  'px-3 py-1 rounded border',
                  p === page
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium'
                    : 'border-gray-300 hover:bg-gray-50'
                )}
              >
                {p + 1}
              </button>
            )
          )}
        <button
          onClick={() => onChange(offset + limit)}
          disabled={page >= pageCount - 1}
          className={btn}
        >
          {t.next}
        </button>
      </div>
    </div>
  )
}
