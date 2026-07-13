import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import type { Challenge, ChallengeCreate } from './types'
import { missionKeys } from './missions'

export const challengeKeys = {
  byMission: (missionId: string) => ['challenges', { missionId }] as const,
  detail: (id: string) => ['challenges', id] as const,
}

export function useChallenges(missionId: string) {
  return useQuery({
    queryKey: challengeKeys.byMission(missionId),
    queryFn: () => apiClient.get<Challenge[]>(`/api/v1/admin/missions/${missionId}/challenges`),
    enabled: !!missionId,
  })
}

export function useSaveChallenges(missionId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (challenges: ChallengeCreate[]) =>
      apiClient.put<Challenge[]>(`/api/v1/admin/missions/${missionId}/challenges`, challenges),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: challengeKeys.byMission(missionId) })
      // Invalidate mission so challenge_count updates and activation gate re-evaluates
      qc.invalidateQueries({ queryKey: missionKeys.detail(missionId) })
      qc.invalidateQueries({ queryKey: missionKeys.all })
    },
  })
}
