import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { Pencil, Plus, Power, Search } from 'lucide-react'
import { useCities, useDeactivateCity } from '../../api/cities'
import type { City } from '../../api/types'
import { DataTable } from '../../components/DataTable'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { useToast } from '../../components/Toast'
import { Badge, btnIconSm, btnIconSmDanger, btnPrimary } from '../../components/ui'
import { t } from '../../lib/i18n'
import { formatDate } from '../../lib/utils'

const LIMIT = 20

export function CitiesPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [offset, setOffset] = useState(0)
  const [confirmCity, setConfirmCity] = useState<City | null>(null)

  const { data, isLoading } = useCities({ search, limit: LIMIT, offset })
  const deactivate = useDeactivateCity(confirmCity?.id ?? '')

  const total = data?.total ?? 0
  const activeCount = (data?.items ?? []).filter((c) => c.is_active).length

  const columns: ColumnDef<City, unknown>[] = [
    {
      accessorKey: 'name',
      header: t.name,
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: 'country',
      header: t.country,
      cell: ({ row }) => <span className="text-muted">{row.original.country}</span>,
    },
    {
      accessorKey: 'is_active',
      header: t.filterStatus,
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? 'success' : 'neutral'}>
          {row.original.is_active ? t.active : t.inactive}
        </Badge>
      ),
    },
    {
      accessorKey: 'launch_date',
      header: t.launchDate,
      cell: ({ row }) =>
        row.original.launch_date ? (
          <span className="text-muted tnum">{formatDate(row.original.launch_date)}</span>
        ) : (
          <span className="text-faint">—</span>
        ),
    },
    {
      accessorKey: 'campaign_count',
      header: 'Campañas',
      meta: { align: 'right' },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-1.5 justify-end">
          <button
            onClick={() => navigate(`/admin/cities/${row.original.id}/edit`)}
            className={btnIconSm}
            aria-label={t.edit}
            title={t.edit}
          >
            <Pencil size={15} strokeWidth={1.5} />
          </button>
          {row.original.is_active && (
            <button
              onClick={() => setConfirmCity(row.original)}
              className={btnIconSmDanger}
              aria-label={t.deactivate}
              title={t.deactivate}
            >
              <Power size={15} strokeWidth={1.5} />
            </button>
          )}
        </div>
      ),
    },
  ]

  async function handleDeactivate() {
    if (!confirmCity) return
    try {
      await deactivate.mutateAsync()
      toast.success(t.deactivated)
    } catch {
      toast.error(t.error)
    } finally {
      setConfirmCity(null)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className="relative flex items-center">
          <Search
            size={16}
            strokeWidth={1.5}
            className="absolute left-3 text-faint pointer-events-none"
          />
          <input
            type="search"
            placeholder={t.searchCitiesPlaceholder}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setOffset(0)
            }}
            className="h-10 w-[300px] rounded-control border border-line-strong bg-surface pl-9 pr-3 text-sm"
            aria-label={t.search}
          />
        </div>
        {!isLoading && (
          <span className="text-[13px] text-muted tnum">
            {total} {total === 1 ? 'ciudad' : 'ciudades'} · {activeCount}{' '}
            {activeCount === 1 ? 'activa' : 'activas'}
          </span>
        )}
        <button onClick={() => navigate('/admin/cities/new')} className={`${btnPrimary} ml-auto`}>
          <Plus size={18} strokeWidth={1.5} />
          {t.createCity}
        </button>
      </div>

      <DataTable
        data={data?.items ?? []}
        columns={columns}
        loading={isLoading}
        emptyMessage={t.noCities}
        pagination={{ total, limit: LIMIT, offset, onChange: setOffset }}
      />

      <ConfirmDialog
        open={!!confirmCity}
        title={`Desactivar ${confirmCity?.name}`}
        message={confirmCity ? t.deactivateCityConfirm(confirmCity.name) : ''}
        confirmLabel={t.deactivate}
        onConfirm={handleDeactivate}
        onCancel={() => setConfirmCity(null)}
        loading={deactivate.isPending}
      />
    </div>
  )
}
