import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import type { City, CityCreate, CityUpdate, Page } from './types'

export const cityKeys = {
  all: ['cities'] as const,
  list: (params?: { search?: string; page?: number }) => ['cities', 'list', params] as const,
  detail: (id: string) => ['cities', id] as const,
}

// ── Wire adapter ────────────────────────────────────────────────────────────
// The admin model uses compass bbox names, `default_language` and
// `map_tile_url`; the arcavia-api City resource uses min/max bbox,
// `default_locale` and `tile_url`, returns a bare array (not a page), updates
// via PATCH (not PUT), and exposes neither campaign_count nor translations.
// These functions bridge the two so the rest of the admin keeps its own model.

interface CityApi {
  id: string
  slug: string
  name: string
  country: string
  default_locale: string
  timezone: string
  center_lat: number
  center_lng: number
  bbox_min_lat: number
  bbox_min_lng: number
  bbox_max_lat: number
  bbox_max_lng: number
  legal_regime: string
  tile_url: string
  is_active: boolean
  launch_date: string | null
}

function fromApi(c: CityApi): City {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    country: c.country,
    default_language: c.default_locale,
    timezone: c.timezone,
    legal_regime: c.legal_regime as City['legal_regime'],
    bbox_north: c.bbox_max_lat,
    bbox_south: c.bbox_min_lat,
    bbox_east: c.bbox_max_lng,
    bbox_west: c.bbox_min_lng,
    center_lat: c.center_lat,
    center_lng: c.center_lng,
    map_tile_url: c.tile_url || undefined,
    is_active: c.is_active,
    launch_date: c.launch_date ?? undefined,
    campaign_count: 0, // not exposed by the API yet
    translations: {}, // no translations column in the API yet
  }
}

function toApiCreate(data: CityCreate) {
  return {
    slug: data.slug,
    name: data.name,
    country: data.country,
    default_locale: data.default_language,
    timezone: data.timezone,
    center_lat: data.center_lat,
    center_lng: data.center_lng,
    bbox_min_lat: data.bbox_south,
    bbox_min_lng: data.bbox_west,
    bbox_max_lat: data.bbox_north,
    bbox_max_lng: data.bbox_east,
    legal_regime: data.legal_regime,
    tile_url: data.map_tile_url ?? '',
    is_active: data.is_active,
    launch_date: data.launch_date || null,
  }
}

// PATCH body — only the fields the API's CityUpdate accepts (no slug/country).
function toApiUpdate(data: CityUpdate) {
  const out: Record<string, unknown> = {}
  const set = (key: string, value: unknown) => {
    if (value !== undefined) out[key] = value
  }
  set('name', data.name)
  set('default_locale', data.default_language)
  set('timezone', data.timezone)
  set('center_lat', data.center_lat)
  set('center_lng', data.center_lng)
  set('bbox_max_lat', data.bbox_north)
  set('bbox_min_lat', data.bbox_south)
  set('bbox_max_lng', data.bbox_east)
  set('bbox_min_lng', data.bbox_west)
  set('legal_regime', data.legal_regime)
  set('is_active', data.is_active)
  if (data.map_tile_url !== undefined) out.tile_url = data.map_tile_url
  if (data.launch_date !== undefined) out.launch_date = data.launch_date || null
  return out
}

// ── Hooks ───────────────────────────────────────────────────────────────────

export function useCities(params?: { search?: string; limit?: number; offset?: number }) {
  return useQuery({
    queryKey: cityKeys.list(params),
    queryFn: async () => {
      const qs = new URLSearchParams()
      if (params?.search) qs.set('search', params.search)
      if (params?.limit) qs.set('limit', String(params.limit))
      if (params?.offset) qs.set('offset', String(params.offset))
      const rows = await apiClient.get<CityApi[]>(`/api/v1/admin/cities?${qs}`)
      const items = rows.map(fromApi)
      // The API returns a bare array; synthesize the Page the UI expects.
      return {
        items,
        total: items.length,
        limit: params?.limit ?? items.length,
        offset: params?.offset ?? 0,
      } satisfies Page<City>
    },
  })
}

export function useCity(id: string) {
  return useQuery({
    queryKey: cityKeys.detail(id),
    queryFn: async () => fromApi(await apiClient.get<CityApi>(`/api/v1/admin/cities/${id}`)),
    enabled: !!id,
  })
}

export function useCreateCity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CityCreate) =>
      fromApi(await apiClient.post<CityApi>('/api/v1/admin/cities', toApiCreate(data))),
    onSuccess: () => qc.invalidateQueries({ queryKey: cityKeys.all }),
  })
}

export function useUpdateCity(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CityUpdate) =>
      fromApi(await apiClient.patch<CityApi>(`/api/v1/admin/cities/${id}`, toApiUpdate(data))),
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
