import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, ApiClientError } from './client'
import type { QRCode } from './types'

export const qrKeys = {
  byWaypoint: (waypointId: string) => ['qr', { waypointId }] as const,
}

export function useWaypointQR(waypointId: string) {
  return useQuery({
    queryKey: qrKeys.byWaypoint(waypointId),
    queryFn: async (): Promise<QRCode | null> => {
      try {
        return await apiClient.get<QRCode>(`/api/v1/admin/waypoints/${waypointId}/qr`)
      } catch (e) {
        if (e instanceof ApiClientError && e.status === 404) return null
        throw e
      }
    },
    enabled: !!waypointId,
  })
}

export function useGenerateQR(waypointId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => apiClient.post<QRCode>(`/api/v1/admin/waypoints/${waypointId}/qr`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qrKeys.byWaypoint(waypointId) }),
  })
}

export function useToggleQRActive(waypointId: string, qrId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (is_active: boolean) =>
      apiClient.patch<QRCode>(`/api/v1/admin/qr/${qrId}`, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qrKeys.byWaypoint(waypointId) }),
  })
}
