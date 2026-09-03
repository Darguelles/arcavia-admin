import { Check, KeyRound, X } from 'lucide-react'
import { useUpdateMission } from '../../api/missions'
import { useToast } from '../../components/Toast'
import { Badge, btnPrimary, card, linkAction, overline } from '../../components/ui'
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

  const checks: { ok: boolean; label: string; offenders: string[]; fix: FixTab }[] = [
    {
      ok: readiness.hasCategories,
      label: t.checkHasCategories,
      offenders: [],
      fix: 'categories',
    },
    {
      ok: readiness.hasPhases,
      label: t.checkHasPhases,
      offenders: [],
      fix: 'phases',
    },
    {
      ok: readiness.hasPhases && readiness.phasesWithoutActiveWaypoint.length === 0,
      label: t.checkPhasesHaveActiveWaypoint,
      offenders: readiness.phasesWithoutActiveWaypoint.map((p) => p.name),
      fix: 'phases',
    },
    {
      ok: readiness.hasCategories && readiness.categoriesWithoutPoints.length === 0,
      label: t.checkCategoriesHavePoints,
      offenders: readiness.categoriesWithoutPoints.map((c) => c.name),
      fix: 'phases',
    },
  ]
  const met = checks.filter((c) => c.ok).length

  return (
    <>
      <div className={cn(card, 'px-6 py-[22px] flex flex-col gap-[18px]')}>
        <div>
          <p className={cn(overline, 'm-0')}>{t.publicationStatus}</p>
          <p className="m-0 mt-2 text-[15px] font-semibold text-ink tnum">
            {t.readinessProgress(met, checks.length)}
          </p>
          <div className="mt-2.5 h-[3px] rounded-full bg-line-soft overflow-hidden">
            <div className="h-full bg-gold" style={{ width: `${(met / checks.length) * 100}%` }} />
          </div>
        </div>

        {readiness.isLoading ? (
          <p className="m-0 text-[13px] text-faint">{t.loading}</p>
        ) : (
          <ul className="m-0 p-0 list-none flex flex-col gap-3">
            {checks.map((check) => (
              <ChecklistItem
                key={check.label}
                ok={check.ok}
                label={check.label}
                offenders={check.offenders}
                onFix={() => onNavigateTab(check.fix)}
              />
            ))}
          </ul>
        )}

        {isActive ? (
          <Badge variant="success" className="justify-center py-2">
            {t.missionActiveBadge}
          </Badge>
        ) : (
          <button
            type="button"
            onClick={activate}
            disabled={!readiness.ready || updateMission.isPending}
            className={cn(btnPrimary, 'h-11 w-full text-[15px]')}
          >
            {updateMission.isPending ? t.loading : t.activateMission}
          </button>
        )}
      </div>

      {readiness.riddleWarning && (
        <div className="bg-warn-tint rounded-card px-5 py-[18px] flex gap-3">
          <KeyRound size={18} strokeWidth={1.5} className="text-warn-deep shrink-0" aria-hidden />
          <div>
            <p className="m-0 text-[13.5px] font-semibold text-warn-text">{t.riddleWarningTitle}</p>
            <p className="m-0 mt-1.5 text-[12.5px] leading-[19px] text-warn-text">
              {t.riddleWarning}
            </p>
          </div>
        </div>
      )}
    </>
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
    <li className="flex items-start gap-2.5 text-[13.5px]">
      {ok ? (
        <Check size={16} strokeWidth={2} className="text-success shrink-0 mt-0.5" aria-hidden />
      ) : (
        <X size={16} strokeWidth={2} className="text-danger shrink-0 mt-0.5" aria-hidden />
      )}
      {ok ? (
        <span className="text-muted">{label}</span>
      ) : (
        <span>
          <span className="font-medium text-ink">{label}</span>
          {offenders.length > 0 && (
            <span className="block mt-[3px] text-[12.5px] text-danger-deep">
              {offenders.join(', ')}
            </span>
          )}
          <button type="button" onClick={onFix} className={cn(linkAction, 'block mt-1.5')}>
            {t.fixThis}
          </button>
        </span>
      )}
    </li>
  )
}
