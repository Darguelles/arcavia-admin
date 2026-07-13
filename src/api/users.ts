import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import type { User, UserDetail, PasswordResetResponse, Page } from './types'

export const userKeys = {
  all: ['users'] as const,
  list: (params?: { search?: string; offset?: number }) => ['users', 'list', params] as const,
  detail: (id: string) => ['users', id] as const,
}

export function useUsers(params?: { search?: string; limit?: number; offset?: number }) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => {
      const qs = new URLSearchParams()
      if (params?.search) qs.set('search', params.search)
      if (params?.limit) qs.set('limit', String(params.limit))
      if (params?.offset) qs.set('offset', String(params.offset))
      return apiClient.get<Page<User>>(`/api/v1/admin/users?${qs}`)
    },
  })
}

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => apiClient.get<UserDetail>(`/api/v1/admin/users/${id}`),
    enabled: !!id,
  })
}

export function useResetUserPassword(userId: string) {
  return useMutation({
    mutationFn: () =>
      apiClient.post<PasswordResetResponse>(`/api/v1/admin/users/${userId}/reset-password`),
  })
}

export function useToggleUserActive(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (is_active: boolean) =>
      apiClient.patch<User>(`/api/v1/admin/users/${userId}`, { is_active }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.all })
      qc.invalidateQueries({ queryKey: userKeys.detail(userId) })
    },
  })
}
