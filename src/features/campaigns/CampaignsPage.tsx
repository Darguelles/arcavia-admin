import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { useCampaigns, useDeactivateCampaign } from '../../api/campaigns'
import type { Campaign } from '../../api/types'
import { DataTable, Pagination } from '../../components/DataTable'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { useToast } from '../../components/Toast'
import { useCityFilter } from '../../components/Layout'
import { t } from '../../lib/i18n'
import { formatDate } from '../../lib/utils'

const LIMIT = 20

export function CampaignsPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { cityId } = useCityFilter()
  const [search, setSearch] = useState('')
  const [offset, setOffset] = useState(0)
  const [confirmCampaign, setConfirmCampaign] = useState<Campaign | null>(null)

  const { data, isLoading } = useCampaigns({
    cityId: cityId || undefined,
    search,
    limit: LIMIT,
    offset,
  })
  const deactivate = useDeactivateCampaign(confirmCampaign?.id ?? '')

  const columns: ColumnDef<Campaign, unknown>[] = [
    { accessorKey: 'name', header: t.name },
    { accessorKey: 'city_name', header: 'Ciudad' },
    {
      accessorKey: 'is_active',
      header: t.active,
      cell: ({ row }) => (
        <span
          className={`px-2 py-0.5 rounded text-xs font-medium ${
            row.original.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {row.original.is_active ? t.active : t.inactive}
        </span>
      ),
    },
    {
      id: 'window',
      header: 'Período',
      cell: ({ row }) => {
        const { starts_at, ends_at } = row.original
        if (!starts_at && !ends_at) return '—'
        return `${starts_at ? formatDate(starts_at) : '…'} → ${ends_at ? formatDate(ends_at) : '…'}`
      },
    },
    { accessorKey: 'mission_count', header: 'Misiones' },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => navigate(`/admin/campaigns/${row.original.id}/edit`)}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
          >
            {t.edit}
          </button>
          {row.original.is_active && (
            <button
              onClick={() => setConfirmCampaign(row.original)}
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
    if (!confirmCampaign) return
    try {
      await deactivate.mutateAsync()
      toast.success(t.deactivated)
    } catch {
      toast.error(t.error)
    } finally {
      setConfirmCampaign(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">{t.campaigns}</h2>
        <button
          onClick={() => navigate('/admin/campaigns/new')}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
        >
          + {t.create}
        </button>
      </div>

      <input
        type="search"
        placeholder={`${t.search} campañas…`}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          setOffset(0)
        }}
        className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      <DataTable
        data={data?.items ?? []}
        columns={columns}
        loading={isLoading}
        emptyMessage={t.noCampaigns}
      />
      <Pagination total={data?.total ?? 0} limit={LIMIT} offset={offset} onChange={setOffset} />

      <ConfirmDialog
        open={!!confirmCampaign}
        title={`Desactivar campaña`}
        message={confirmCampaign ? t.deactivateCampaignConfirm(confirmCampaign.name) : ''}
        confirmLabel={t.deactivate}
        onConfirm={handleDeactivate}
        onCancel={() => setConfirmCampaign(null)}
        loading={deactivate.isPending}
      />
    </div>
  )
}
