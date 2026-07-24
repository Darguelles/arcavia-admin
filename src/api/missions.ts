import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import type { Difficulty, Mission, MissionCreate, MissionUpdate, Page } from './types'

export const missionKeys = {
  all: ['missions'] as const,
  list: (params?: { campaignId?: string; cityId?: string; search?: string; offset?: number }) =>
    ['missions', 'list', params] as const,
  detail: (id: string) => ['missions', id] as const,
}

interface MissionApi {
  id: string
  campaign_id: string
  city_id: string
  name: string
  description: string
  image_url: string | null
  translations: Record<string, unknown>
  difficulty: Difficulty
  reward_points: number
  estimated_time_minutes: number
  explorers_count: number
  is_active: boolean
}

function fromApi(m: MissionApi, campaignName = ''): Mission {
  return {
    id: m.id,
    campaign_id: m.campaign_id,
    campaign_name: campaignName,
    city_id: m.city_id,
    name: m.name,
    description: m.description ?? '',
    image_url: m.image_url ?? null,
    translations: (m.translations ?? {}) as Mission['translations'],
    difficulty: m.difficulty,
    reward_points: m.reward_points,
    estimated_time_minutes: m.estimated_time_minutes,
    explorers_count: m.explorers_count,
    is_active: m.is_active,
  }
}

function toApiCreate(data: MissionCreate) {
  return {
    campaign_id: data.campaign_id,
    name: data.name,
    description: data.description ?? '',
    translations: data.translations ?? {},
    difficulty: data.difficulty,
    reward_points: data.reward_points,
    estimated_time_minutes: data.estimated_time_minutes,
    is_active: data.is_active ?? false,
  }
}

function toApiUpdate(data: MissionUpdate) {
  const out: Record<string, unknown> = {}
  const set = (key: string, value: unknown) => {
    if (value !== undefined) out[key] = value
  }
  set('name', data.name)
  set('description', data.description)
  set('translations', data.translations)
  set('difficulty', data.difficulty)
  set('reward_points', data.reward_points)
  set('estimated_time_minutes', data.estimated_time_minutes)
  set('is_active', data.is_active)
  return out
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
    queryFn: async () => {
      const qs = new URLSearchParams()
      if (params?.campaignId) qs.set('campaign_id', params.campaignId)
      if (params?.cityId) qs.set('city_id', params.cityId)
      if (params?.limit) qs.set('limit', String(params.limit))
      if (params?.offset) qs.set('offset', String(params.offset))
      // The API doesn't join the campaign name (or support search), so fetch
      // campaigns to resolve names and filter client-side.
      const [rows, campaigns] = await Promise.all([
        apiClient.get<MissionApi[]>(`/api/v1/admin/missions?${qs}`),
        apiClient.get<{ id: string; name: string }[]>(`/api/v1/admin/campaigns?limit=100`),
      ])
      const campaignName = new Map(campaigns.map((c) => [c.id, c.name]))
      let items = rows.map((r) => fromApi(r, campaignName.get(r.campaign_id) ?? ''))
      if (params?.search) {
        const q = params.search.toLowerCase()
        items = items.filter((m) => m.name.toLowerCase().includes(q))
      }
      return {
        items,
        total: items.length,
        limit: params?.limit ?? items.length,
        offset: params?.offset ?? 0,
      } satisfies Page<Mission>
    },
  })
}

export function useMission(id: string) {
  return useQuery({
    queryKey: missionKeys.detail(id),
    queryFn: async () => fromApi(await apiClient.get<MissionApi>(`/api/v1/admin/missions/${id}`)),
    enabled: !!id,
  })
}

export function useCreateMission() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: MissionCreate) =>
      fromApi(await apiClient.post<MissionApi>('/api/v1/admin/missions', toApiCreate(data))),
    onSuccess: () => qc.invalidateQueries({ queryKey: missionKeys.all }),
  })
}

export function useUpdateMission(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: MissionUpdate) =>
      fromApi(await apiClient.patch<MissionApi>(`/api/v1/admin/missions/${id}`, toApiUpdate(data))),
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

// Cover image — the bytes go straight to the API (raw body); it stores them via
// the configured backend (local disk in dev, S3 in prod) and returns the mission
// with its new image_url.
export function useUploadMissionImage(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) =>
      fromApi(await apiClient.upload<MissionApi>(`/api/v1/admin/missions/${id}/image`, file)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: missionKeys.all })
      qc.invalidateQueries({ queryKey: missionKeys.detail(id) })
    },
  })
}

export function useDeleteMissionImage(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () =>
      fromApi(await apiClient.delete<MissionApi>(`/api/v1/admin/missions/${id}/image`)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: missionKeys.all })
      qc.invalidateQueries({ queryKey: missionKeys.detail(id) })
    },
  })
}
