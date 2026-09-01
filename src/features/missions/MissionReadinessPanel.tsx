import { useUpdateMission } from '../../api/missions'
import { useToast } from '../../components/Toast'
import { translateApiError } from '../../lib/apiErrors'
import { t } from '../../lib/i18n'
import { cn } from '../../lib/utils'
import { useMissionReadiness } from './useMissionReadiness'

type FixTab = 'categories' | 'phases'

/**
 * "Estado de publicación": a live checklist of the server's activation rules
 * (assert_mission_completable) plus the explicit "Activar misión" button.
 * Visible on every tab of the mission editor so the operator always knows how
 * far the mission is from publishable — and what exactly to fix, with a jump
 * link to the right tab. The server 409 remains the final authority; the
 * button only saves the operator from blind attempts.
 */
export function MissionReadinessPanel({
  missionId,
  isActive,
  onNavigateTab,
}: {
  missionId: string
  isActive: boolean
  onNavigateTab: (tab: FixTab) => void
}) {
  const toast = useToast()
  const readiness = useMissionReadiness(missionId)
  const updateMission = useUpdateMission(missionId)

  async function activate() {
    try {
      await updateMission.mutateAsync({ is_active: true })
      toast.success(t.missionActivated)
    } catch (err) {
      toast.error(translateApiError(err))
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-sm font-semibold text-gray-900">{t.publicationStatus}</h3>
        {isActive ? (
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            {t.missionActiveBadge}
          </span>
        ) : (
          <button
            type="button"
            onClick={activate}
            disabled={!readiness.ready || updateMission.isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updateMission.isPending ? t.loading : t.activateMission}
          </button>
        )}
      </div>

      {readiness.isLoading ? (
        <p className="text-xs text-gray-400 mt-3">{t.loading}</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-1.5">
          <ChecklistItem
            ok={readiness.hasCategories}
            label={t.checkHasCategories}
            onFix={() => onNavigateTab('categories')}
          />
          <ChecklistItem
            ok={readiness.hasPhases}
            label={t.checkHasPhases}
            onFix={() => onNavigateTab('phases')}
          />
          <ChecklistItem
            ok={readiness.hasPhases && readiness.phasesWithoutActiveWaypoint.length === 0}
            label={t.checkPhasesHaveActiveWaypoint}
            offenders={readiness.phasesWithoutActiveWaypoint.map((p) => p.name)}
            onFix={() => onNavigateTab('phases')}
          />
          <ChecklistItem
            ok={readiness.hasCategories && readiness.categoriesWithoutPoints.length === 0}
            label={t.checkCategoriesHavePoints}
            offenders={readiness.categoriesWithoutPoints.map((c) => c.name)}
            onFix={() => onNavigateTab('phases')}
          />
        </ul>
      )}

      {readiness.riddleWarning && (
        <p className="mt-3 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
          {t.riddleWarning}
        </p>
      )}
    </div>
  )
}

function ChecklistItem({
  ok,
  label,
  offenders = [],
  onFix,
}: {
  ok: boolean
  label: string
  offenders?: string[]
  onFix: () => void
}) {
  return (
    <li className="text-sm">
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className={cn(
            'inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold shrink-0',
            ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
          )}
        >
          {ok ? '✓' : '✕'}
        </span>
        <span className={ok ? 'text-gray-500' : 'text-gray-800 font-medium'}>{label}</span>
        {!ok && (
          <button
            type="button"
            onClick={onFix}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
          >
            {t.fixThis}
          </button>
        )}
      </div>
      {!ok && offenders.length > 0 && (
        <p className="pl-6 text-xs text-red-600">{offenders.join(', ')}</p>
      )}
    </li>
  )
}
