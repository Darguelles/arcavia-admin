import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import type { GeoAttempt, GeoAttemptDetail, Page } from './types'

export const geoAttemptKeys = {
  all: ['geoAttempts'] as const,
  list: (params?: { flaggedOnly?: boolean; status?: string; offset?: number }) =>
    ['geoAttempts', 'list', params] as const,
  detail: (id: string) => ['geoAttempts', id] as const,
}

/**
 * Operator review queue for flagged geo check-in attempts. Backend returns
 * {items,limit,offset} without a total — synthesize Page<T> client-side, same
 * pattern as every other admin list adapter (see CLAUDE.md's "big gotcha").
 */
export function useGeoAttempts(params?: {
  flaggedOnly?: boolean
  status?: string
  limit?: number
  offset?: number
}) {
  return useQuery({
    queryKey: geoAttemptKeys.list(params),
    queryFn: async () => {
      const qs = new URLSearchParams()
      qs.set('flagged_only', String(params?.flaggedOnly ?? true))
      if (params?.status) qs.set('status', params.status)
      if (params?.limit) qs.set('limit', String(params.limit))
      if (params?.offset) qs.set('offset', String(params.offset))
      const res = await apiClient.get<{ items: GeoAttempt[]; limit: number; offset: number }>(
        `/api/v1/admin/geo-attempts?${qs}`
      )
      return {
        items: res.items,
        total: res.items.length,
        limit: res.limit,
        offset: res.offset,
      } satisfies Page<GeoAttempt>
    },
  })
}

export function useGeoAttempt(id: string) {
  return useQuery({
    queryKey: geoAttemptKeys.detail(id),
    queryFn: () => apiClient.get<GeoAttemptDetail>(`/api/v1/admin/geo-attempts/${id}`),
    enabled: !!id,
  })
}

export function useReviewGeoAttempt(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { action: 'approve' | 'reject'; note?: string }) =>
      apiClient.patch<GeoAttempt>(`/api/v1/admin/geo-attempts/${id}`, vars),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: geoAttemptKeys.all })
      qc.invalidateQueries({ queryKey: geoAttemptKeys.detail(id) })
    },
  })
}
