import { useQueries } from '@tanstack/react-query'
import { apiClient } from '../../api/client'
import { useCategories } from '../../api/categories'
import { usePhases } from '../../api/phases'
import { waypointKeys } from '../../api/waypoints'
import { challengeKeys } from '../../api/challenges'
import type { Challenge, MissionCategory, Phase, Waypoint } from '../../api/types'

export interface MissionReadiness {
  isLoading: boolean
  hasCategories: boolean
  hasPhases: boolean
  phasesWithoutActiveWaypoint: Phase[]
  categoriesWithoutPoints: MissionCategory[]
  /** True when the structure passes the server's activation guard (§8.4). */
  ready: boolean
  /** True when no challenge on an active waypoint is a riddle — the mission
   * would activate but no player could ever complete it. Warn, never block. */
  riddleWarning: boolean
}

/**
 * Client-side mirror of the backend's assert_mission_completable: at least one
 * category and one phase, every phase with an active waypoint, every category
 * with points to earn. The server remains the authority on activation — this
 * only exists so the operator sees what's missing before pressing the button.
 *
 * Shares query keys with CategoriesEditor/PhaseCard, so the same cache feeds
 * both and waypoint mutations keep the checklist live.
 */
export function useMissionReadiness(missionId: string): MissionReadiness {
  const { data: categories, isLoading: categoriesLoading } = useCategories(missionId)
  const { data: phases, isLoading: phasesLoading } = usePhases(missionId)

  const waypointQueries = useQueries({
    queries: (phases ?? []).map((p) => ({
      queryKey: waypointKeys.byPhase(p.id),
      queryFn: () => apiClient.get<Waypoint[]>(`/api/v1/admin/phases/${p.id}/waypoints`),
    })),
  })

  const isLoading = categoriesLoading || phasesLoading || waypointQueries.some((q) => q.isLoading)

  const hasCategories = (categories?.length ?? 0) > 0
  const hasPhases = (phases?.length ?? 0) > 0
  const phasesWithoutActiveWaypoint = (phases ?? []).filter(
    (_, i) => !waypointQueries[i]?.data?.some((w) => w.is_active)
  )
  const categoriesWithoutPoints = (categories ?? []).filter((c) => c.total_points <= 0)

  const ready =
    !isLoading &&
    hasCategories &&
    hasPhases &&
    phasesWithoutActiveWaypoint.length === 0 &&
    categoriesWithoutPoints.length === 0

  // Fetch challenges only once the structure is ready (small N, shared cache
  // with ChallengesEditor) — before that the warning would be noise anyway.
  const activeWaypointIds = ready
    ? waypointQueries.flatMap((q) => (q.data ?? []).filter((w) => w.is_active).map((w) => w.id))
    : []
  const challengeQueries = useQueries({
    queries: activeWaypointIds.map((id) => ({
      queryKey: challengeKeys.byWaypoint(id),
      queryFn: () => apiClient.get<Challenge[]>(`/api/v1/admin/waypoints/${id}/challenges`),
    })),
  })
  const challengesLoaded =
    challengeQueries.length > 0 && challengeQueries.every((q) => q.data !== undefined)
  const riddleWarning =
    ready && challengesLoaded && !challengeQueries.some((q) => q.data?.some((c) => c.is_riddle))

  return {
    isLoading,
    hasCategories,
    hasPhases,
    phasesWithoutActiveWaypoint,
    categoriesWithoutPoints,
    ready,
    riddleWarning,
  }
}
