import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'

export const teamKeys = {
  all: ['team'] as const,
  list: () => ['team', 'list'] as const,
}

export interface TeamMember {
  id: string
  email: string
  display_name: string
  role: 'root' | 'admin' | 'staff'
  is_active: boolean
  mfa_enrolled: boolean
  force_password_reset: boolean
  created_at: string
}

export interface TeamCreate {
  email: string
  display_name: string
  role: 'admin' | 'staff'
}

export interface TeamUpdate {
  role?: 'admin' | 'staff'
  is_active?: boolean
}

export function useTeam(enabled = true) {
  return useQuery({
    queryKey: teamKeys.list(),
    queryFn: async () => {
      const data = await apiClient.get<{ items: TeamMember[] }>('/api/v1/admin/team')
      return data.items
    },
    // the endpoint is root-only — non-root callers (e.g. the audit viewer's
    // actor filter) pass enabled=false instead of eating a 403
    enabled,
  })
}

export function useCreateTeamMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: TeamCreate) =>
      apiClient.post<{ user: TeamMember; temp_password: string }>('/api/v1/admin/team', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: teamKeys.all }),
  })
}

export function useUpdateTeamMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: TeamUpdate & { id: string }) =>
      apiClient.patch<TeamMember>(`/api/v1/admin/team/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: teamKeys.all }),
  })
}

export function useResetTeamPassword() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<{ temp_password: string }>(`/api/v1/admin/team/${id}/reset-password`),
    onSuccess: () => qc.invalidateQueries({ queryKey: teamKeys.all }),
  })
}

export function useResetTeamMfa() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.post<void>(`/api/v1/admin/team/${id}/reset-mfa`),
    onSuccess: () => qc.invalidateQueries({ queryKey: teamKeys.all }),
  })
}
