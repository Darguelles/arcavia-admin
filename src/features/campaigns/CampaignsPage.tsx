import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { Pencil, Plus, Power, Search } from 'lucide-react'
import { useCampaigns, useDeactivateCampaign } from '../../api/campaigns'
import type { Campaign } from '../../api/types'
import { DataTable } from '../../components/DataTable'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { useToast } from '../../components/Toast'
import { useCityFilter } from '../../components/Layout'
import { Badge, btnIconSm, btnIconSmDanger, btnPrimary } from '../../components/ui'
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

  const total = data?.total ?? 0
  const activeCount = (data?.items ?? []).filter((c) => c.is_active).length

  const columns: ColumnDef<Campaign, unknown>[] = [
    {
      accessorKey: 'name',
      header: t.name,
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: 'city_name',
      header: 'Ciudad',
      cell: ({ row }) => <span className="text-muted">{row.original.city_name}</span>,
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
      id: 'window',
      header: 'Período',
      cell: ({ row }) => {
        const { starts_at, ends_at } = row.original
        if (!starts_at && !ends_at) return <span className="text-faint">—</span>
        return (
          <span className="text-muted tnum">
            {`${starts_at ? formatDate(starts_at) : '…'} → ${ends_at ? formatDate(ends_at) : '…'}`}
          </span>
        )
      },
    },
    {
      accessorKey: 'mission_count',
      header: 'Misiones',
      meta: { align: 'right' },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-1.5 justify-end">
          <button
            onClick={() => navigate(`/admin/campaigns/${row.original.id}/edit`)}
            className={btnIconSm}
            aria-label={t.edit}
            title={t.edit}
          >
            <Pencil size={15} strokeWidth={1.5} />
          </button>
          {row.original.is_active && (
            <button
              onClick={() => setConfirmCampaign(row.original)}
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
            placeholder={t.searchCampaignsPlaceholder}
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
            {total} {total === 1 ? 'campaña' : 'campañas'} · {activeCount}{' '}
            {activeCount === 1 ? 'activa' : 'activas'}
          </span>
        )}
        <button
          onClick={() => navigate('/admin/campaigns/new')}
          className={`${btnPrimary} ml-auto`}
        >
          <Plus size={18} strokeWidth={1.5} />
          {t.createCampaign}
        </button>
      </div>

      <DataTable
        data={data?.items ?? []}
        columns={columns}
        loading={isLoading}
        emptyMessage={t.noCampaigns}
        pagination={{ total, limit: LIMIT, offset, onChange: setOffset }}
      />

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
