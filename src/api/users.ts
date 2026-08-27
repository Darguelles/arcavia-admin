import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import type {
  User,
  Role,
  PasswordResetResponse,
  ResetProgressSummary,
  Page,
  UserOverview,
} from './types'

// The backend admin user (UserAdmin) wire shape differs from the admin's `User`
// type (the "big gotcha" — see CLAUDE.md): `created_at` not `registered_at`,
// `display_name` never null, and no page wrapper renames. This adapter bridges it.
interface UserApi {
  id: string
  email: string
  display_name: string
  role: Role
  is_active: boolean
  force_password_reset: boolean
  created_at: string
  last_activity_at: string | null
}

function fromApi(u: UserApi): User {
  return {
    id: u.id,
    email: u.email,
    display_name: u.display_name || undefined,
    role: u.role,
    is_active: u.is_active,
    registered_at: u.created_at,
    last_activity_at: u.last_activity_at ?? undefined,
    force_password_reset: u.force_password_reset,
  }
}

export interface UsersListParams {
  search?: string
  role?: Role
  is_active?: boolean
  registered_from?: string
  registered_to?: string
  sort_by?: string
  sort_dir?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export const userKeys = {
  all: ['users'] as const,
  list: (params?: UsersListParams) => ['users', 'list', params] as const,
  overview: (id: string) => ['users', id, 'overview'] as const,
}

export function useUsers(params?: UsersListParams) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: async () => {
      const qs = new URLSearchParams()
      if (params?.search) qs.set('search', params.search)
      if (params?.role) qs.set('role', params.role)
      if (params?.is_active !== undefined) qs.set('is_active', String(params.is_active))
      if (params?.registered_from) qs.set('registered_from', params.registered_from)
      if (params?.registered_to) qs.set('registered_to', params.registered_to)
      if (params?.sort_by) qs.set('sort_by', params.sort_by)
      if (params?.sort_dir) qs.set('sort_dir', params.sort_dir)
      if (params?.limit) qs.set('limit', String(params.limit))
      if (params?.offset) qs.set('offset', String(params.offset))
      const page = await apiClient.get<Page<UserApi>>(`/api/v1/admin/users?${qs}`)
      return { ...page, items: page.items.map(fromApi) }
    },
  })
}

/** Full lifecycle overview: missions + progress, points, rewards, sessions. */
export function useUserOverview(id: string) {
  return useQuery({
    queryKey: userKeys.overview(id),
    queryFn: () => apiClient.get<UserOverview>(`/api/v1/admin/users/${id}/overview`),
    enabled: !!id,
  })
}

export function useResetUserPassword(userId: string) {
  return useMutation({
    mutationFn: async (): Promise<PasswordResetResponse> => {
      // Backend returns { temporary_password, message }; map to the UI shape.
      const res = await apiClient.post<{ temporary_password: string }>(
        `/api/v1/admin/users/${userId}/reset-password`
      )
      return { temp_password: res.temporary_password }
    },
  })
}

/** Wipe ALL of a user's gameplay progress (testing tool). Invalidates the
 *  overview so completions/points refresh to empty. */
export function useResetUserProgress(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      apiClient.post<ResetProgressSummary>(`/api/v1/admin/users/${userId}/reset-progress`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.overview(userId) })
      qc.invalidateQueries({ queryKey: userKeys.all })
    },
  })
}

/** Activate/deactivate a user. The backend has no PATCH — it exposes dedicated
 *  POST /activate and POST /deactivate endpoints (both 204). */
export function useToggleUserActive(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (is_active: boolean) =>
      apiClient.post<void>(
        `/api/v1/admin/users/${userId}/${is_active ? 'activate' : 'deactivate'}`
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.all })
      qc.invalidateQueries({ queryKey: userKeys.overview(userId) })
    },
  })
}

/** GDPR Art. 15 / Art. 20 export — fetch the full JSON and trigger a download. */
export async function downloadUserExport(userId: string): Promise<void> {
  const data = await apiClient.get<unknown>(`/api/v1/admin/users/${userId}/export`)
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `arcavia-user-${userId}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
