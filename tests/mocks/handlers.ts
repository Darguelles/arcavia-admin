import { http, HttpResponse } from 'msw'

const BASE = 'http://localhost:8000'

export const handlers = [
  // Auth
  http.post(`${BASE}/api/v1/auth/login`, async ({ request }) => {
    const body = (await request.json()) as Record<string, string>
    if (body.email === 'admin@test.com' && body.password === 'adminpass') {
      return HttpResponse.json({
        access_token: 'test-admin-token',
        token_type: 'bearer',
        role: 'admin',
        user_id: 'admin-user-1',
        force_password_reset: false,
      })
    }
    if (body.email === 'player@test.com' && body.password === 'playerpass') {
      return HttpResponse.json({
        access_token: 'test-player-token',
        token_type: 'bearer',
        role: 'player',
        user_id: 'player-user-1',
        force_password_reset: false,
      })
    }
    if (body.email === 'reset@test.com' && body.password === 'resetpass') {
      return HttpResponse.json({
        access_token: 'test-reset-token',
        token_type: 'bearer',
        role: 'admin',
        user_id: 'reset-user-1',
        force_password_reset: true,
      })
    }
    return HttpResponse.json(
      { code: 'INVALID_CREDENTIALS', message: 'Credenciales inválidas' },
      { status: 401 }
    )
  }),

  http.post(`${BASE}/api/v1/auth/logout`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  http.post(`${BASE}/api/v1/auth/refresh`, () => {
    return HttpResponse.json({ access_token: 'refreshed-token' })
  }),

  http.post(`${BASE}/api/v1/auth/change-password`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // Dashboard
  http.get(`${BASE}/api/v1/admin/dashboard`, () => {
    return HttpResponse.json({
      active_cities: 3,
      active_campaigns: 7,
      active_missions: 24,
      total_players: 512,
      recent_completions: 89,
    })
  }),

  http.get(`${BASE}/api/v1/admin/dashboard/top-scorers`, () => {
    return HttpResponse.json([
      {
        user_id: '1',
        display_name: 'Ana García',
        email: 'ana@test.com',
        points: 4200,
        city_name: 'Lima',
      },
      {
        user_id: '2',
        display_name: 'Carlos López',
        email: 'carlos@test.com',
        points: 3850,
        city_name: 'Lima',
      },
    ])
  }),

  // Cities
  // arcavia-api returns a bare array of CityAdminResponse (min/max bbox names,
  // default_locale, tile_url) — not a paginated envelope. See api/cities.ts.
  http.get(`${BASE}/api/v1/admin/cities`, () => {
    return HttpResponse.json([
      {
        id: 'city-1',
        slug: 'lima',
        name: 'Lima',
        country: 'PE',
        default_locale: 'es-PE',
        timezone: 'America/Lima',
        center_lat: -12.0464,
        center_lng: -77.0428,
        bbox_min_lat: -12.2,
        bbox_min_lng: -77.2,
        bbox_max_lat: -11.9,
        bbox_max_lng: -76.9,
        legal_regime: 'LEY_29733',
        tile_url: '',
        is_active: true,
        launch_date: null,
      },
    ])
  }),

  http.post(`${BASE}/api/v1/admin/cities`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ id: 'new-city-1', ...body }, { status: 201 })
  }),

  http.get(`${BASE}/api/v1/admin/cities/:id`, ({ params }) => {
    return HttpResponse.json({
      id: params['id'],
      slug: 'lima',
      name: 'Lima',
      country: 'PE',
      default_locale: 'es-PE',
      timezone: 'America/Lima',
      center_lat: -12.0464,
      center_lng: -77.0428,
      bbox_min_lat: -12.2,
      bbox_min_lng: -77.2,
      bbox_max_lat: -11.9,
      bbox_max_lng: -76.9,
      legal_regime: 'LEY_29733',
      tile_url: '',
      is_active: true,
      launch_date: null,
    })
  }),

  // Campaigns — arcavia-api returns a bare array (no city_name/mission_count).
  http.get(`${BASE}/api/v1/admin/campaigns`, () => {
    return HttpResponse.json([
      {
        id: 'camp-1',
        city_id: 'city-1',
        name: 'Historia de Lima',
        description: 'Descubre la historia de Lima',
        translations: {},
        is_active: true,
        starts_at: null,
        ends_at: null,
      },
    ])
  }),

  // Missions (v2: bare array; no location/challenge_count)
  http.get(`${BASE}/api/v1/admin/missions`, () => {
    return HttpResponse.json([
      {
        id: 'mission-1',
        campaign_id: 'camp-1',
        city_id: 'city-1',
        name: 'El Centro Histórico',
        description: 'Explora el centro histórico',
        translations: {},
        difficulty: 'media',
        reward_points: 100,
        estimated_time_minutes: 60,
        explorers_count: 0,
        is_active: false,
      },
      {
        id: 'mission-2',
        campaign_id: 'camp-1',
        city_id: 'city-1',
        name: 'La Catedral',
        description: 'Visita la catedral',
        translations: {},
        difficulty: 'alta',
        reward_points: 150,
        estimated_time_minutes: 90,
        explorers_count: 12,
        is_active: true,
      },
    ])
  }),

  http.get(`${BASE}/api/v1/admin/missions/:id`, ({ params }) => {
    return HttpResponse.json({
      id: params['id'],
      campaign_id: 'camp-1',
      city_id: 'city-1',
      name: 'El Centro Histórico',
      description: 'Explora el centro histórico',
      translations: {},
      difficulty: 'media',
      reward_points: 100,
      estimated_time_minutes: 60,
      explorers_count: 0,
      is_active: false,
    })
  }),

  http.post(`${BASE}/api/v1/admin/missions`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json(
      { id: 'new-mission-1', city_id: 'city-1', explorers_count: 0, ...body },
      { status: 201 }
    )
  }),

  http.patch(`${BASE}/api/v1/admin/missions/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ id: params['id'], city_id: 'city-1', explorers_count: 0, ...body })
  }),

  // Structure: categories / phases / waypoints
  http.get(`${BASE}/api/v1/admin/missions/:id/categories`, () => HttpResponse.json([])),
  http.get(`${BASE}/api/v1/admin/missions/:id/phases`, () => HttpResponse.json([])),
  http.get(`${BASE}/api/v1/admin/phases/:id/waypoints`, () => HttpResponse.json([])),

  // Challenges (per waypoint)
  http.get(`${BASE}/api/v1/admin/waypoints/:id/challenges`, () => HttpResponse.json([])),

  http.post(`${BASE}/api/v1/admin/waypoints/:id/challenges`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ id: 'ch-1', waypoint_id: params['id'], ...body }, { status: 201 })
  }),

  // QR (per waypoint) — 404 means "no QR yet"
  http.get(`${BASE}/api/v1/admin/waypoints/:id/qr`, () =>
    HttpResponse.json({ error: { code: 'QR_NOT_FOUND', message: 'No QR' } }, { status: 404 })
  ),

  http.post(`${BASE}/api/v1/admin/waypoints/:id/qr`, ({ params }) => {
    return HttpResponse.json(
      {
        id: 'qr-1',
        waypoint_id: params['id'],
        token: 'test-qr-token-uuid-1234',
        is_active: true,
        created_at: new Date().toISOString(),
      },
      { status: 201 }
    )
  }),

  // Users
  http.get(`${BASE}/api/v1/admin/users`, () => {
    return HttpResponse.json({
      items: [
        {
          id: 'user-1',
          email: 'player@example.com',
          display_name: 'Juan Pérez',
          role: 'player',
          is_active: true,
          registered_at: '2024-01-15T10:00:00Z',
          last_activity_at: '2024-06-20T14:30:00Z',
          force_password_reset: false,
        },
      ],
      total: 1,
      limit: 20,
      offset: 0,
    })
  }),

  http.get(`${BASE}/api/v1/admin/users/:id`, ({ params }) => {
    return HttpResponse.json({
      id: params['id'],
      email: 'player@example.com',
      display_name: 'Juan Pérez',
      role: 'player',
      is_active: true,
      registered_at: '2024-01-15T10:00:00Z',
      force_password_reset: false,
      completions: [],
      points_per_city: { Lima: 350 },
    })
  }),

  http.post(`${BASE}/api/v1/admin/users/:id/reset-password`, () => {
    return HttpResponse.json({ temp_password: 'TempPass123!' })
  }),

  http.patch(`${BASE}/api/v1/admin/users/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ id: params['id'], ...body })
  }),

  // Settings
  http.get(`${BASE}/api/v1/admin/settings/:key`, ({ params }) => {
    return HttpResponse.json({ key: params['key'], value: null })
  }),

  http.put(`${BASE}/api/v1/admin/settings/:key`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ key: params['key'], value: body['value'] })
  }),
]
