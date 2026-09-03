import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, Search } from 'lucide-react'
import { useMissions } from '../../api/missions'
import type { Difficulty, Mission } from '../../api/types'
import { DataTable } from '../../components/DataTable'
import { useCityFilter } from '../../components/Layout'
import { Badge, btnPrimary, btnRowAction } from '../../components/ui'
import { t } from '../../lib/i18n'
import { cn } from '../../lib/utils'

const LIMIT = 20

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  baja: t.difficultyBaja,
  media: t.difficultyMedia,
  alta: t.difficultyAlta,
}

type StatusFilter = 'all' | 'active' | 'draft'

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: t.filterTabAll },
  { key: 'active', label: t.filterTabActive },
  { key: 'draft', label: t.filterTabDraft },
]

export function MissionsPage() {
  const navigate = useNavigate()
  const { cityId } = useCityFilter()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [offset, setOffset] = useState(0)

  const { data, isLoading } = useMissions({
    cityId: cityId || undefined,
    search,
    limit: LIMIT,
    offset,
  })

  const items = (data?.items ?? []).filter((m) =>
    status === 'all' ? true : status === 'active' ? m.is_active : !m.is_active
  )
  const total = status === 'all' ? (data?.total ?? 0) : items.length

  const columns: ColumnDef<Mission, unknown>[] = [
    {
      accessorKey: 'name',
      header: t.name,
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: 'campaign_name',
      header: t.campaign,
      cell: ({ row }) => <span className="text-muted">{row.original.campaign_name || '—'}</span>,
    },
    {
      accessorKey: 'difficulty',
      header: t.difficulty,
      cell: ({ row }) => (
        <span className="text-muted">{DIFFICULTY_LABEL[row.original.difficulty]}</span>
      ),
    },
    {
      accessorKey: 'reward_points',
      header: t.rewardPoints,
      meta: { align: 'right' },
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
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex justify-end">
          <button
            onClick={() => navigate(`/admin/missions/${row.original.id}`)}
            className={btnRowAction}
          >
            {t.edit}
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-5 max-w-[1120px]">
      <div className="flex items-center gap-3">
        <div className="relative flex items-center">
          <Search
            size={16}
            strokeWidth={1.5}
            className="absolute left-3 text-faint pointer-events-none"
          />
          <input
            type="search"
            placeholder={t.searchMissionsPlaceholder}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setOffset(0)
            }}
            className="h-10 w-[300px] rounded-control border border-line-strong bg-surface pl-9 pr-3 text-sm"
            aria-label={t.search}
          />
        </div>

        <div className="flex h-10 border border-line-strong rounded-control overflow-hidden">
          {STATUS_FILTERS.map((f, i) => (
            <button
              key={f.key}
              type="button"
              onClick={() => {
                setStatus(f.key)
                setOffset(0)
              }}
              aria-pressed={status === f.key}
              className={cn(
                'px-3.5 text-[13px] cursor-pointer transition-colors',
                i > 0 && 'border-l border-line',
                status === f.key
                  ? 'bg-ink text-cream font-semibold'
                  : 'bg-surface text-muted hover:bg-paper-hover'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <button onClick={() => navigate('/admin/missions/new')} className={`${btnPrimary} ml-auto`}>
          <Plus size={18} strokeWidth={1.5} />
          {t.createMission}
        </button>
      </div>

      <DataTable
        data={items}
        columns={columns}
        loading={isLoading}
        emptyMessage={t.noMissions}
        pagination={{ total, limit: LIMIT, offset, onChange: setOffset }}
      />
    </div>
  )
}
