import { useQuery } from '@tanstack/react-query'
import { apiClient } from './client'

export interface AuditLogEntry {
  id: string
  actor_user_id: string | null
  actor_email: string | null
  actor_role: string
  action: string
  target_type: string | null
  target_id: string | null
  metadata: Record<string, unknown> | null
  ip: string | null
  user_agent: string | null
  request_id: string | null
  created_at: string
}

export interface AuditLogFilters {
  actor_user_id?: string
  action?: string
  target_type?: string
  target_id?: string
  date_from?: string
  date_to?: string
  limit?: number
  offset?: number
}

export const auditKeys = {
  all: ['audit'] as const,
  list: (filters: AuditLogFilters) => ['audit', 'list', filters] as const,
}

export function useAuditLog(filters: AuditLogFilters, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: auditKeys.list(filters),
    enabled: options?.enabled ?? true,
    queryFn: () => {
      const params = new URLSearchParams()
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== '') params.set(key, String(value))
      }
      const qs = params.toString()
      return apiClient.get<{ items: AuditLogEntry[]; total: number }>(
        `/api/v1/admin/audit-log${qs ? `?${qs}` : ''}`
      )
    },
    placeholderData: (prev) => prev,
  })
}
