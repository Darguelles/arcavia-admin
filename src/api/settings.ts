import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import type { Setting, DashboardStats, TopScorer } from './types'

export const settingKeys = {
  all: ['settings'] as const,
  key: (key: string) => ['settings', key] as const,
  dashboard: ['dashboard'] as const,
  topScorers: (cityId?: string) => ['topScorers', cityId] as const,
}

export function useSetting<T = unknown>(key: string) {
  return useQuery({
    queryKey: settingKeys.key(key),
    queryFn: () => apiClient.get<Setting>(`/api/v1/admin/settings/${key}`),
  })
}

export function useUpdateSetting(key: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (value: unknown) =>
      apiClient.put<Setting>(`/api/v1/admin/settings/${key}`, { value }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: settingKeys.key(key) })
      qc.invalidateQueries({ queryKey: settingKeys.all })
    },
  })
}

export function useDashboardStats() {
  return useQuery({
    queryKey: settingKeys.dashboard,
    queryFn: () => apiClient.get<DashboardStats>('/api/v1/admin/dashboard'),
  })
}

export function useTopScorers(cityId?: string) {
  return useQuery({
    queryKey: settingKeys.topScorers(cityId),
    queryFn: () => {
      const qs = cityId ? `?city_id=${cityId}` : ''
      return apiClient.get<TopScorer[]>(`/api/v1/admin/dashboard/top-scorers${qs}`)
    },
  })
}

export async function uploadAsset(file: File, key: string): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('key', key)

  const { useAuthStore } = await import('../auth/store')
  const { accessToken } = useAuthStore.getState()
  const { API_BASE } = await import('../config')

  const res = await fetch(`${API_BASE}/api/v1/admin/assets`, {
    method: 'POST',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    credentials: 'include',
    body: formData,
  })
  if (!res.ok) throw new Error('Error al subir el archivo')
  const data = await res.json()
  return data.url as string
}
