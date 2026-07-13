import { useDashboardStats, useTopScorers } from '../../api/settings'
import { useCityFilter } from '../../components/Layout'
import { t } from '../../lib/i18n'
import { cn } from '../../lib/utils'

function StatCard({
  label,
  value,
  loading,
}: {
  label: string
  value: number | undefined
  loading: boolean
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p
        className={cn(
          'text-3xl font-bold text-gray-900 mt-1',
          loading && 'animate-pulse text-gray-300'
        )}
      >
        {loading ? '—' : (value ?? 0).toLocaleString('es-PE')}
      </p>
    </div>
  )
}

export function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { cityId } = useCityFilter()
  const { data: topScorers, isLoading: scorersLoading } = useTopScorers(cityId || undefined)

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold text-gray-900">{t.dashboard}</h2>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label={t.activeCities} value={stats?.active_cities} loading={statsLoading} />
        <StatCard
          label={t.activeCampaigns}
          value={stats?.active_campaigns}
          loading={statsLoading}
        />
        <StatCard label={t.activeMissions} value={stats?.active_missions} loading={statsLoading} />
        <StatCard label={t.totalPlayers} value={stats?.total_players} loading={statsLoading} />
        <StatCard
          label={t.recentCompletions}
          value={stats?.recent_completions}
          loading={statsLoading}
        />
      </div>

      {/* Top scorers */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-gray-900">{t.topScorers}</h3>
        </div>
        <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 mb-4 inline-block">
          ⚠ {t.topScorersNote}
        </p>

        {scorersLoading ? (
          <p className="text-sm text-gray-400">{t.loading}</p>
        ) : !topScorers?.length ? (
          <p className="text-sm text-gray-400">{t.noResults}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 text-xs border-b border-gray-100">
                <th className="pb-2 font-medium">#</th>
                <th className="pb-2 font-medium">Jugador</th>
                <th className="pb-2 font-medium">Ciudad</th>
                <th className="pb-2 font-medium text-right">Puntos</th>
              </tr>
            </thead>
            <tbody>
              {topScorers.map((scorer, i) => (
                <tr key={scorer.user_id} className="border-b border-gray-50 last:border-0">
                  <td className="py-2 text-gray-400">{i + 1}</td>
                  <td className="py-2">
                    <p className="font-medium text-gray-900">{scorer.display_name || '—'}</p>
                    <p className="text-xs text-gray-400">{scorer.email}</p>
                  </td>
                  <td className="py-2 text-gray-600">{scorer.city_name}</td>
                  <td className="py-2 text-right font-semibold text-indigo-700">
                    {scorer.points.toLocaleString('es-PE')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
