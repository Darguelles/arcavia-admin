import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { useMissions } from '../../api/missions'
import type { Mission } from '../../api/types'
import { DataTable, Pagination } from '../../components/DataTable'
import { useToast } from '../../components/Toast'
import { useCityFilter } from '../../components/Layout'
import { t } from '../../lib/i18n'

const LIMIT = 20

export function MissionsPage() {
  const navigate = useNavigate()
  const { cityId } = useCityFilter()
  const [search, setSearch] = useState('')
  const [offset, setOffset] = useState(0)

  const { data, isLoading } = useMissions({
    cityId: cityId || undefined,
    search,
    limit: LIMIT,
    offset,
  })

  const columns: ColumnDef<Mission, unknown>[] = [
    { accessorKey: 'name', header: t.name },
    { accessorKey: 'campaign_name', header: 'Campaña' },
    {
      accessorKey: 'is_active',
      header: t.active,
      cell: ({ row }) => {
        const mission = row.original
        const canActivate = mission.challenge_count > 0
        // Activation guard: disabled with tooltip if no challenges (spec §5.1)
        return (
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium ${
                mission.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {mission.is_active ? t.active : t.inactive}
            </span>
            {!canActivate && !mission.is_active && (
              <span
                className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded"
                title={t.missionNoQuestionsHint}
              >
                Sin preguntas
              </span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'challenge_count',
      header: t.questions,
    },
    {
      accessorKey: 'has_qr',
      header: 'QR',
      cell: ({ row }) => (row.original.has_qr ? '✓' : '—'),
    },
    {
      accessorKey: 'tolerance_radius_m',
      header: t.requiredCloseness,
      cell: ({ row }) => `${row.original.tolerance_radius_m} m`,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <button
          onClick={() => navigate(`/admin/missions/${row.original.id}`)}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
        >
          {t.edit}
        </button>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">{t.missions}</h2>
        <button
          onClick={() => navigate('/admin/missions/new')}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
        >
          + {t.create}
        </button>
      </div>

      <input
        type="search"
        placeholder={`${t.search} misiones…`}
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
        emptyMessage={t.noMissions}
      />
      <Pagination total={data?.total ?? 0} limit={LIMIT} offset={offset} onChange={setOffset} />
    </div>
  )
}
