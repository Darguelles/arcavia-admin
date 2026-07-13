import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import type { QRCode } from './types'
import { missionKeys } from './missions'

export const qrKeys = {
  byMission: (missionId: string) => ['qr', { missionId }] as const,
}

export function useQRCodes(missionId: string) {
  return useQuery({
    queryKey: qrKeys.byMission(missionId),
    queryFn: () => apiClient.get<QRCode[]>(`/api/v1/admin/missions/${missionId}/qr`),
    enabled: !!missionId,
  })
}

export function useGenerateQR(missionId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => apiClient.post<QRCode>(`/api/v1/admin/missions/${missionId}/qr`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qrKeys.byMission(missionId) })
      qc.invalidateQueries({ queryKey: missionKeys.detail(missionId) })
    },
  })
}

export function useToggleQRActive(missionId: string, qrId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (is_active: boolean) =>
      apiClient.patch<QRCode>(`/api/v1/admin/missions/${missionId}/qr/${qrId}`, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qrKeys.byMission(missionId) }),
  })
}
