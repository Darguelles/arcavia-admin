import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import type { MissionCategory, MissionCategoryCreate, MissionCategoryUpdate } from './types'
import { missionKeys } from './missions'

export const categoryKeys = {
  byMission: (missionId: string) => ['categories', { missionId }] as const,
}

export function useCategories(missionId: string) {
  return useQuery({
    queryKey: categoryKeys.byMission(missionId),
    queryFn: () =>
      apiClient.get<MissionCategory[]>(`/api/v1/admin/missions/${missionId}/categories`),
    enabled: !!missionId,
  })
}

export function useCreateCategory(missionId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: MissionCategoryCreate) =>
      apiClient.post<MissionCategory>(`/api/v1/admin/missions/${missionId}/categories`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.byMission(missionId) }),
  })
}

export function useUpdateCategory(missionId: string, categoryId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: MissionCategoryUpdate) =>
      apiClient.patch<MissionCategory>(`/api/v1/admin/categories/${categoryId}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.byMission(missionId) }),
  })
}

export function useDeleteCategory(missionId: string, categoryId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => apiClient.delete<void>(`/api/v1/admin/categories/${categoryId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoryKeys.byMission(missionId) })
      qc.invalidateQueries({ queryKey: missionKeys.detail(missionId) })
    },
  })
}
