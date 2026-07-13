import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { useCities, useDeactivateCity } from '../../api/cities'
import type { City } from '../../api/types'
import { DataTable, Pagination } from '../../components/DataTable'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { useToast } from '../../components/Toast'
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

  const columns: ColumnDef<City, unknown>[] = [
    { accessorKey: 'name', header: t.name },
    { accessorKey: 'country', header: t.country },
    {
      accessorKey: 'is_active',
      header: t.active,
      cell: ({ row }) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            row.original.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {row.original.is_active ? t.active : t.inactive}
        </span>
      ),
    },
    {
      accessorKey: 'launch_date',
      header: t.launchDate,
      cell: ({ row }) => (row.original.launch_date ? formatDate(row.original.launch_date) : '—'),
    },
    {
      accessorKey: 'campaign_count',
      header: 'Campañas',
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => navigate(`/admin/cities/${row.original.id}/edit`)}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
          >
            {t.edit}
          </button>
          {row.original.is_active && (
            <button
              onClick={() => setConfirmCity(row.original)}
              className="text-xs text-red-600 hover:text-red-800 font-medium"
            >
              {t.deactivate}
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
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">{t.cities}</h2>
        <button
          onClick={() => navigate('/admin/cities/new')}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
        >
          + {t.create}
        </button>
      </div>

      <div>
        <input
          type="search"
          placeholder={`${t.search} ciudades…`}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setOffset(0)
          }}
          className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label={t.search}
        />
      </div>

      <DataTable
        data={data?.items ?? []}
        columns={columns}
        loading={isLoading}
        emptyMessage={t.noCities}
      />
      <Pagination total={data?.total ?? 0} limit={LIMIT} offset={offset} onChange={setOffset} />

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
