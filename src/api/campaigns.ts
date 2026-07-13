import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import type { Campaign, CampaignCreate, CampaignUpdate, Page } from './types'

export const campaignKeys = {
  all: ['campaigns'] as const,
  list: (params?: { cityId?: string; search?: string; offset?: number }) =>
    ['campaigns', 'list', params] as const,
  detail: (id: string) => ['campaigns', id] as const,
}

export function useCampaigns(params?: {
  cityId?: string
  search?: string
  limit?: number
  offset?: number
}) {
  return useQuery({
    queryKey: campaignKeys.list(params),
    queryFn: () => {
      const qs = new URLSearchParams()
      if (params?.cityId) qs.set('city_id', params.cityId)
      if (params?.search) qs.set('search', params.search)
      if (params?.limit) qs.set('limit', String(params.limit))
      if (params?.offset) qs.set('offset', String(params.offset))
      return apiClient.get<Page<Campaign>>(`/api/v1/admin/campaigns?${qs}`)
    },
  })
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: campaignKeys.detail(id),
    queryFn: () => apiClient.get<Campaign>(`/api/v1/admin/campaigns/${id}`),
    enabled: !!id,
  })
}

export function useCreateCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CampaignCreate) => apiClient.post<Campaign>('/api/v1/admin/campaigns', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: campaignKeys.all }),
  })
}

export function useUpdateCampaign(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CampaignUpdate) =>
      apiClient.put<Campaign>(`/api/v1/admin/campaigns/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: campaignKeys.all })
      qc.invalidateQueries({ queryKey: campaignKeys.detail(id) })
    },
  })
}

export function useDeactivateCampaign(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => apiClient.delete<void>(`/api/v1/admin/campaigns/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: campaignKeys.all }),
  })
}
