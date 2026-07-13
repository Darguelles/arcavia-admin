import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table'
import { cn } from '../lib/utils'
import { t } from '../lib/i18n'

interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T, unknown>[]
  loading?: boolean
  emptyMessage?: string
  className?: string
}

/**
 * Sortable, accessible data table backed by TanStack Table.
 * Pagination is handled externally — pass a page slice and wire up pagination controls.
 */
export function DataTable<T>({
  data,
  columns,
  loading = false,
  emptyMessage = t.noResults,
  className,
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
              {hg.headers.map((header) => (
                <th
                  key={header.id}
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
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

export function Pagination({ total, limit, offset, onChange }: PaginationProps) {
  const page = Math.floor(offset / limit)
  const pageCount = Math.ceil(total / limit)
  const from = offset + 1
  const to = Math.min(offset + limit, total)

  if (total === 0) return null

  return (
    <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
      <span>{t.showing(from, to, total)}</span>
      <div className="flex gap-2">
        <button
          onClick={() => onChange(offset - limit)}
          disabled={page === 0}
          className="px-3 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
        >
          {t.previous}
        </button>
        <button
          onClick={() => onChange(offset + limit)}
          disabled={page >= pageCount - 1}
          className="px-3 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
        >
          {t.next}
        </button>
      </div>
    </div>
  )
}
