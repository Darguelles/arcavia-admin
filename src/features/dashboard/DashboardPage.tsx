import { Building2, ChevronRight, Flag, Plus, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useGeoAttempts } from '../../api/geoAttempts'
import { useDashboardStats, useTopScorers } from '../../api/settings'
import { useCityFilter } from '../../components/Layout'
import { btnPrimary, btnSecondary, card, overline } from '../../components/ui'
import { t } from '../../lib/i18n'
import { cn } from '../../lib/utils'

function StatCard({
  label,
  value,
  loading,
  highlight,
}: {
  label: string
  value: number | undefined
  loading: boolean
  highlight?: boolean
}) {
  return (
    <div className={cn(card, 'p-5', highlight && 'border-l-[3px] border-l-gold')}>
      <p className={overline}>{label}</p>
      <p
        className={cn(
          'text-[30px] leading-[34px] font-semibold tnum mt-2.5',
          loading && 'animate-pulse text-faint'
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
  const { data: flaggedAttempts, isLoading: flaggedLoading } = useGeoAttempts({
    flaggedOnly: true,
  })
  const flaggedCount = flaggedAttempts?.total ?? 0

  return (
    <div className="flex flex-col gap-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard label={t.activeCities} value={stats?.active_cities} loading={statsLoading} />
        <StatCard
          label={t.activeCampaigns}
          value={stats?.active_campaigns}
          loading={statsLoading}
        />
        <StatCard
          label={t.activeMissions}
          value={stats?.active_missions}
          loading={statsLoading}
          highlight
        />
        <StatCard label={t.totalPlayers} value={stats?.total_players} loading={statsLoading} />
        <StatCard
          label={t.completions7d}
          value={stats?.recent_completions}
          loading={statsLoading}
        />
      </div>

      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-6 items-start">
        {/* Top scorers */}
        <div className={cn(card, 'overflow-hidden')}>
          <div className="flex items-baseline gap-3 px-6 pt-5 pb-4 border-b border-line">
            <h3 className="text-[17px] font-semibold">{t.topScorers}</h3>
            <p className="ml-auto text-xs text-muted">{t.allCitiesRange}</p>
          </div>
          <p className="flex items-start gap-2 bg-warn-tint text-warn-text px-6 py-3 text-[12.5px] leading-[19px]">
            <TriangleAlert size={15} strokeWidth={1.5} className="shrink-0 mt-0.5" />
            {t.topScorersNote}
          </p>

          {scorersLoading ? (
            <p className="px-6 py-5 text-sm text-faint">{t.loading}</p>
          ) : !topScorers?.length ? (
            <p className="px-6 py-5 text-sm text-faint">{t.noResults}</p>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-paper">
                  <th className={cn(overline, 'w-12 px-6 py-2.5 text-left border-b border-line')}>
                    #
                  </th>
                  <th className={cn(overline, 'px-3 py-2.5 text-left border-b border-line')}>
                    Jugador
                  </th>
                  <th className={cn(overline, 'px-3 py-2.5 text-left border-b border-line')}>
                    Ciudad
                  </th>
                  <th className={cn(overline, 'px-6 py-2.5 text-right border-b border-line')}>
                    Puntos
                  </th>
                </tr>
              </thead>
              <tbody>
                {topScorers.map((scorer, i) => (
                  <tr key={scorer.user_id} className="border-b border-line-soft last:border-0">
                    <td className="px-6 py-3.5 text-faint tnum">{i + 1}</td>
                    <td className="px-3 py-3.5">
                      <p className="font-medium">{scorer.display_name || '—'}</p>
                      <p className="mt-0.5 text-xs text-faint">{scorer.email}</p>
                    </td>
                    <td className="px-3 py-3.5 text-muted">{scorer.city_name}</td>
                    <td className="px-6 py-3.5 text-right font-semibold tnum">
                      {scorer.points.toLocaleString('es-PE')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          <div className={cn(card, 'p-6 flex flex-col gap-4')}>
            <h3 className="text-[17px] font-semibold">{t.needsAttention}</h3>
            {flaggedLoading ? (
              <p className="text-[13px] text-faint">{t.loading}</p>
            ) : flaggedCount > 0 ? (
              <Link to="/admin/review-queue" className="flex items-center gap-3 group">
                <span className="h-[30px] w-[30px] rounded-control bg-warn-tint text-warn-deep inline-flex items-center justify-center shrink-0">
                  <Flag size={16} strokeWidth={1.5} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[13.5px] font-medium">
                    <span className="tnum">{flaggedCount.toLocaleString('es-PE')}</span>{' '}
                    {t.reviewQueue.toLowerCase()}
                  </span>
                  <span className="block text-xs text-muted">{t.reviewQueueTitle}</span>
                </span>
                <ChevronRight size={18} strokeWidth={1.5} className="text-faint shrink-0" />
              </Link>
            ) : (
              <p className="text-[13px] text-faint">{t.reviewQueueEmpty}</p>
            )}
          </div>

          <div className={cn(card, 'p-6 flex flex-col gap-3.5')}>
            <h3 className="text-[17px] font-semibold">{t.shortcuts}</h3>
            <div className="flex flex-col gap-2">
              <Link to="/admin/missions/new" className={cn(btnPrimary, 'w-full justify-start')}>
                <Plus size={18} strokeWidth={1.5} />
                {t.newMission}
              </Link>
              <Link to="/admin/cities/new" className={cn(btnSecondary, 'w-full justify-start')}>
                <Building2 size={18} strokeWidth={1.5} />
                {t.newCity}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
