import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import type { City, CityCreate, CityUpdate, Page } from './types'

export const cityKeys = {
  all: ['cities'] as const,
  list: (params?: { search?: string; page?: number }) => ['cities', 'list', params] as const,
  detail: (id: string) => ['cities', id] as const,
}

export function useCities(params?: { search?: string; limit?: number; offset?: number }) {
  return useQuery({
    queryKey: cityKeys.list(params),
    queryFn: () => {
      const qs = new URLSearchParams()
      if (params?.search) qs.set('search', params.search)
      if (params?.limit) qs.set('limit', String(params.limit))
      if (params?.offset) qs.set('offset', String(params.offset))
      return apiClient.get<Page<City>>(`/api/v1/admin/cities?${qs}`)
    },
  })
}

export function useCity(id: string) {
  return useQuery({
    queryKey: cityKeys.detail(id),
    queryFn: () => apiClient.get<City>(`/api/v1/admin/cities/${id}`),
    enabled: !!id,
  })
}

export function useCreateCity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CityCreate) => apiClient.post<City>('/api/v1/admin/cities', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: cityKeys.all }),
  })
}

export function useUpdateCity(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CityUpdate) => apiClient.put<City>(`/api/v1/admin/cities/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cityKeys.all })
      qc.invalidateQueries({ queryKey: cityKeys.detail(id) })
    },
  })
}

export function useDeactivateCity(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => apiClient.delete<void>(`/api/v1/admin/cities/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: cityKeys.all }),
  })
}
