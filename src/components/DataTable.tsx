import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table'
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'
import { cn } from '../lib/utils'
import { t } from '../lib/i18n'
import { card } from './ui'

interface ColumnMeta {
  sortable?: boolean
  align?: 'left' | 'right'
}

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
  // Optional pagination footer rendered inside the table card (design: the
  // "Mostrando X–Y de Z" bar is part of the table, not a separate control).
  pagination?: PaginationProps
}

const thClass =
  'px-4 py-[11px] first:pl-6 last:pr-6 text-[11px] font-semibold tracking-[0.1em] uppercase text-faint border-b border-line'

/**
 * Accessible data table backed by TanStack Table.
 * Pagination is handled externally — pass a page slice plus `pagination` props
 * (or wire up a standalone <Pagination /> below the table).
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
  pagination,
}: DataTableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className={cn(card, 'overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-paper">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => {
                  const meta = header.column.columnDef.meta as ColumnMeta | undefined
                  const sortable = !!onSort && !!meta?.sortable
                  const isSorted = sortBy === header.column.id
                  const alignRight = meta?.align === 'right'
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
                      className={cn(thClass, alignRight ? 'text-right' : 'text-left')}
                    >
                      {sortable ? (
                        <button
                          type="button"
                          onClick={() => onSort(header.column.id)}
                          className="inline-flex items-center gap-1 uppercase tracking-[0.1em] font-semibold hover:text-muted cursor-pointer"
                        >
                          {label}
                          <span aria-hidden className="text-line-strong">
                            {isSorted ? (
                              sortDir === 'asc' ? (
                                <ChevronUp size={12} className="text-faint" />
                              ) : (
                                <ChevronDown size={12} className="text-faint" />
                              )
                            ) : (
                              <ChevronsUpDown size={12} />
                            )}
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
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-faint">
                  {t.loading}
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-faint">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-line-soft last:border-b-0 hover:bg-paper transition-colors"
                >
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta as ColumnMeta | undefined
                    return (
                      <td
                        key={cell.id}
                        className={cn(
                          'px-4 py-[15px] first:pl-6 last:pr-6 text-ink',
                          meta?.align === 'right' && 'text-right'
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pagination && pagination.total > 0 && <PaginationBar {...pagination} />}
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

const pageBtn =
  'h-8 px-3 rounded-control border border-line bg-surface text-[13px] cursor-pointer disabled:cursor-not-allowed disabled:text-faint hover:border-gold disabled:hover:border-line'

function PaginationBar({ total, limit, offset, onChange }: PaginationProps) {
  const page = Math.floor(offset / limit)
  const pageCount = Math.ceil(total / limit)
  const from = offset + 1
  const to = Math.min(offset + limit, total)

  return (
    <div className="flex items-center justify-between px-6 py-3.5 border-t border-line bg-paper text-[13px] text-muted">
      <span className="tnum">{t.showing(from, to, total)}</span>
      <div className="flex items-center gap-1.5">
        <button onClick={() => onChange(offset - limit)} disabled={page === 0} className={pageBtn}>
          {t.previous}
        </button>
        {pageCount > 1 &&
          pageWindow(page, pageCount).map((p, i) =>
            p === -1 ? (
              <span key={`ellipsis-${i}`} className="px-1 text-faint">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onChange(p * limit)}
                aria-current={p === page ? 'page' : undefined}
                className={cn(
                  'h-8 min-w-8 px-2 rounded-control border bg-surface text-[13px] tnum cursor-pointer',
                  p === page
                    ? 'border-gold text-ink font-semibold'
                    : 'border-line text-muted hover:border-gold'
                )}
              >
                {p + 1}
              </button>
            )
          )}
        <button
          onClick={() => onChange(offset + limit)}
          disabled={page >= pageCount - 1}
          className={pageBtn}
        >
          {t.next}
        </button>
      </div>
    </div>
  )
}

/** Standalone pagination for lists that are not a single table card. */
export function Pagination(props: PaginationProps) {
  if (props.total === 0) return null
  return (
    <div className="mt-3 rounded-control border border-line overflow-hidden">
      <PaginationBar {...props} />
    </div>
  )
}
