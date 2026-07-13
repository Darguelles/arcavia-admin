import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import type { Mission, MissionCreate, MissionUpdate, Page } from './types'

export const missionKeys = {
  all: ['missions'] as const,
  list: (params?: { campaignId?: string; cityId?: string; search?: string; offset?: number }) =>
    ['missions', 'list', params] as const,
  detail: (id: string) => ['missions', id] as const,
}

export function useMissions(params?: {
  campaignId?: string
  cityId?: string
  search?: string
  limit?: number
  offset?: number
}) {
  return useQuery({
    queryKey: missionKeys.list(params),
    queryFn: () => {
      const qs = new URLSearchParams()
      if (params?.campaignId) qs.set('campaign_id', params.campaignId)
      if (params?.cityId) qs.set('city_id', params.cityId)
      if (params?.search) qs.set('search', params.search)
      if (params?.limit) qs.set('limit', String(params.limit))
      if (params?.offset) qs.set('offset', String(params.offset))
      return apiClient.get<Page<Mission>>(`/api/v1/admin/missions?${qs}`)
    },
  })
}

export function useMission(id: string) {
  return useQuery({
    queryKey: missionKeys.detail(id),
    queryFn: () => apiClient.get<Mission>(`/api/v1/admin/missions/${id}`),
    enabled: !!id,
  })
}

export function useCreateMission() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: MissionCreate) => apiClient.post<Mission>('/api/v1/admin/missions', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: missionKeys.all }),
  })
}

export function useUpdateMission(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: MissionUpdate) =>
      apiClient.put<Mission>(`/api/v1/admin/missions/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: missionKeys.all })
      qc.invalidateQueries({ queryKey: missionKeys.detail(id) })
    },
  })
}

export function useDeactivateMission(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => apiClient.delete<void>(`/api/v1/admin/missions/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: missionKeys.all }),
  })
}

// Optimistic active toggle
export function useToggleMissionActive(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (is_active: boolean) =>
      apiClient.patch<Mission>(`/api/v1/admin/missions/${id}`, { is_active }),
    onMutate: async (is_active) => {
      await qc.cancelQueries({ queryKey: missionKeys.detail(id) })
      const prev = qc.getQueryData<Mission>(missionKeys.detail(id))
      if (prev) qc.setQueryData(missionKeys.detail(id), { ...prev, is_active })
      return { prev }
    },
    onError: (_err, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(missionKeys.detail(id), ctx.prev)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: missionKeys.all })
      qc.invalidateQueries({ queryKey: missionKeys.detail(id) })
    },
  })
}
