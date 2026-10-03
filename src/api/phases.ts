import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import type { DeletionImpact, Phase, PhaseCreate, PhaseUpdate } from './types'

export const phaseKeys = {
  byMission: (missionId: string) => ['phases', { missionId }] as const,
}

export function usePhases(missionId: string) {
  return useQuery({
    queryKey: phaseKeys.byMission(missionId),
    queryFn: () => apiClient.get<Phase[]>(`/api/v1/admin/missions/${missionId}/phases`),
    enabled: !!missionId,
  })
}

export function useCreatePhase(missionId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: PhaseCreate) =>
      apiClient.post<Phase>(`/api/v1/admin/missions/${missionId}/phases`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: phaseKeys.byMission(missionId) }),
  })
}

export function useUpdatePhase(missionId: string, phaseId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: PhaseUpdate) =>
      apiClient.patch<Phase>(`/api/v1/admin/phases/${phaseId}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: phaseKeys.byMission(missionId) }),
  })
}

export function usePhaseDeletionImpact(phaseId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['phases', phaseId, 'deletion-impact'] as const,
    queryFn: () => apiClient.get<DeletionImpact>(`/api/v1/admin/phases/${phaseId}/deletion-impact`),
    enabled: !!phaseId && enabled,
    staleTime: 0,
  })
}

// Removes the phase with its points (archived server-side when anything
// references them, so player history is kept).
export function useDeletePhase(missionId: string, phaseId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => apiClient.delete<void>(`/api/v1/admin/phases/${phaseId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: phaseKeys.byMission(missionId) })
      qc.invalidateQueries({ queryKey: ['waypoints'] })
      qc.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}
