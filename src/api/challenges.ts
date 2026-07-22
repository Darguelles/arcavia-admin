import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import type { Challenge, ChallengeCreate, ChallengeUpdate } from './types'

export const challengeKeys = {
  byWaypoint: (waypointId: string) => ['challenges', { waypointId }] as const,
}

export function useChallenges(waypointId: string) {
  return useQuery({
    queryKey: challengeKeys.byWaypoint(waypointId),
    queryFn: () => apiClient.get<Challenge[]>(`/api/v1/admin/waypoints/${waypointId}/challenges`),
    enabled: !!waypointId,
  })
}

export function useCreateChallenge(waypointId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ChallengeCreate) =>
      apiClient.post<Challenge>(`/api/v1/admin/waypoints/${waypointId}/challenges`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: challengeKeys.byWaypoint(waypointId) }),
  })
}

export function useUpdateChallenge(waypointId: string, challengeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ChallengeUpdate) =>
      apiClient.patch<Challenge>(`/api/v1/admin/challenges/${challengeId}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: challengeKeys.byWaypoint(waypointId) }),
  })
}

export function useDeleteChallenge(waypointId: string, challengeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => apiClient.delete<void>(`/api/v1/admin/challenges/${challengeId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: challengeKeys.byWaypoint(waypointId) }),
  })
}
