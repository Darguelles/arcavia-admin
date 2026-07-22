import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import type { Waypoint, WaypointCreate, WaypointUpdate } from './types'

export const waypointKeys = {
  byPhase: (phaseId: string) => ['waypoints', { phaseId }] as const,
  detail: (id: string) => ['waypoints', id] as const,
}

export function useWaypoints(phaseId: string) {
  return useQuery({
    queryKey: waypointKeys.byPhase(phaseId),
    queryFn: () => apiClient.get<Waypoint[]>(`/api/v1/admin/phases/${phaseId}/waypoints`),
    enabled: !!phaseId,
  })
}

export function useWaypoint(id: string) {
  return useQuery({
    queryKey: waypointKeys.detail(id),
    queryFn: () => apiClient.get<Waypoint>(`/api/v1/admin/waypoints/${id}`),
    enabled: !!id,
  })
}

export function useCreateWaypoint(phaseId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: WaypointCreate) =>
      apiClient.post<Waypoint>(`/api/v1/admin/phases/${phaseId}/waypoints`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: waypointKeys.byPhase(phaseId) }),
  })
}

export function useUpdateWaypoint(id: string, phaseId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: WaypointUpdate) =>
      apiClient.patch<Waypoint>(`/api/v1/admin/waypoints/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: waypointKeys.detail(id) })
      if (phaseId) qc.invalidateQueries({ queryKey: waypointKeys.byPhase(phaseId) })
    },
  })
}

export function useDeleteWaypoint(id: string, phaseId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => apiClient.delete<void>(`/api/v1/admin/waypoints/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: waypointKeys.byPhase(phaseId) }),
  })
}
