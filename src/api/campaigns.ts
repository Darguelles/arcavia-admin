import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import type { Campaign, CampaignCreate, CampaignUpdate, Page } from './types'

export const campaignKeys = {
  all: ['campaigns'] as const,
  list: (params?: { cityId?: string; search?: string; offset?: number }) =>
    ['campaigns', 'list', params] as const,
  detail: (id: string) => ['campaigns', id] as const,
}

// ── Wire adapter ────────────────────────────────────────────────────────────
// Field names match, but arcavia-api expects `datetime | None` for
// starts_at/ends_at (the form's datetime-local inputs emit "" when empty → 422),
// returns a bare array (not a page), updates via PATCH (not PUT), and exposes
// neither city_name nor mission_count. Bridge all of that here.

interface CampaignApi {
  id: string
  city_id: string
  name: string
  description: string
  translations: Record<string, unknown>
  is_active: boolean
  starts_at: string | null
  ends_at: string | null
}

// ISO datetime → value for <input type="datetime-local"> ("YYYY-MM-DDTHH:mm").
function toDatetimeLocal(iso: string | null | undefined): string | undefined {
  return iso ? iso.slice(0, 16) : undefined
}

// datetime-local string → what the API wants: null for empty, else the string
// (the API accepts minute-precision ISO like "2026-07-22T14:30").
function cleanDatetime(v: string | undefined): string | null {
  return v && v.trim() !== '' ? v : null
}

function fromApi(c: CampaignApi, cityName = ''): Campaign {
  return {
    id: c.id,
    city_id: c.city_id,
    city_name: cityName,
    name: c.name,
    description: c.description ?? '',
    is_active: c.is_active,
    starts_at: toDatetimeLocal(c.starts_at),
    ends_at: toDatetimeLocal(c.ends_at),
    mission_count: 0, // not exposed by the API yet
    translations: (c.translations ?? {}) as Campaign['translations'],
  }
}

function toApiCreate(data: CampaignCreate) {
  return {
    city_id: data.city_id,
    name: data.name,
    description: data.description ?? '',
    translations: data.translations ?? {},
    is_active: data.is_active,
    starts_at: cleanDatetime(data.starts_at),
    ends_at: cleanDatetime(data.ends_at),
  }
}

// PATCH body — only the fields the API's CampaignUpdate accepts (no city_id).
function toApiUpdate(data: CampaignUpdate) {
  const out: Record<string, unknown> = {}
  const set = (key: string, value: unknown) => {
    if (value !== undefined) out[key] = value
  }
  set('name', data.name)
  set('description', data.description)
  set('translations', data.translations)
  set('is_active', data.is_active)
  if (data.starts_at !== undefined) out.starts_at = cleanDatetime(data.starts_at)
  if (data.ends_at !== undefined) out.ends_at = cleanDatetime(data.ends_at)
  return out
}

// ── Hooks ───────────────────────────────────────────────────────────────────

export function useCampaigns(params?: {
  cityId?: string
  search?: string
  limit?: number
  offset?: number
}) {
  return useQuery({
    queryKey: campaignKeys.list(params),
    queryFn: async () => {
      const qs = new URLSearchParams()
      if (params?.cityId) qs.set('city_id', params.cityId)
      if (params?.search) qs.set('search', params.search)
      if (params?.limit) qs.set('limit', String(params.limit))
      if (params?.offset) qs.set('offset', String(params.offset))
      // The API doesn't join the city name, so fetch cities to resolve it.
      const [rows, cities] = await Promise.all([
        apiClient.get<CampaignApi[]>(`/api/v1/admin/campaigns?${qs}`),
        apiClient.get<{ id: string; name: string }[]>(`/api/v1/admin/cities?limit=100`),
      ])
      const cityName = new Map(cities.map((c) => [c.id, c.name]))
      const items = rows.map((r) => fromApi(r, cityName.get(r.city_id) ?? ''))
      return {
        items,
        total: items.length,
        limit: params?.limit ?? items.length,
        offset: params?.offset ?? 0,
      } satisfies Page<Campaign>
    },
  })
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: campaignKeys.detail(id),
    queryFn: async () => fromApi(await apiClient.get<CampaignApi>(`/api/v1/admin/campaigns/${id}`)),
    enabled: !!id,
  })
}

export function useCreateCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CampaignCreate) =>
      fromApi(await apiClient.post<CampaignApi>('/api/v1/admin/campaigns', toApiCreate(data))),
    onSuccess: () => qc.invalidateQueries({ queryKey: campaignKeys.all }),
  })
}

export function useUpdateCampaign(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CampaignUpdate) =>
      fromApi(
        await apiClient.patch<CampaignApi>(`/api/v1/admin/campaigns/${id}`, toApiUpdate(data))
      ),
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
