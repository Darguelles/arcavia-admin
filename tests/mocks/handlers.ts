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
  http.get(`${BASE}/api/v1/admin/cities`, () => {
    return HttpResponse.json({
      items: [
        {
          id: 'city-1',
          name: 'Lima',
          slug: 'lima',
          country: 'PE',
          default_language: 'es-PE',
          timezone: 'America/Lima',
          legal_regime: 'LEY_29733',
          bbox_north: -11.9,
          bbox_south: -12.2,
          bbox_east: -76.9,
          bbox_west: -77.2,
          center_lat: -12.0464,
          center_lng: -77.0428,
          is_active: true,
          campaign_count: 3,
          translations: {},
        },
      ],
      total: 1,
      limit: 20,
      offset: 0,
    })
  }),

  http.post(`${BASE}/api/v1/admin/cities`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json(
      {
        id: 'new-city-1',
        campaign_count: 0,
        ...body,
      },
      { status: 201 }
    )
  }),

  http.get(`${BASE}/api/v1/admin/cities/:id`, ({ params }) => {
    return HttpResponse.json({
      id: params['id'],
      name: 'Lima',
      slug: 'lima',
      country: 'PE',
      default_language: 'es-PE',
      timezone: 'America/Lima',
      legal_regime: 'LEY_29733',
      bbox_north: -11.9,
      bbox_south: -12.2,
      bbox_east: -76.9,
      bbox_west: -77.2,
      center_lat: -12.0464,
      center_lng: -77.0428,
      is_active: true,
      campaign_count: 3,
      translations: {},
    })
  }),

  // Campaigns
  http.get(`${BASE}/api/v1/admin/campaigns`, () => {
    return HttpResponse.json({
      items: [
        {
          id: 'camp-1',
          city_id: 'city-1',
          city_name: 'Lima',
          name: 'Historia de Lima',
          description: 'Descubre la historia de Lima',
          is_active: true,
          mission_count: 5,
          translations: {},
        },
      ],
      total: 1,
      limit: 20,
      offset: 0,
    })
  }),

  // Missions
  http.get(`${BASE}/api/v1/admin/missions`, () => {
    return HttpResponse.json({
      items: [
        {
          id: 'mission-1',
          campaign_id: 'camp-1',
          campaign_name: 'Historia de Lima',
          city_id: 'city-1',
          name: 'El Centro Histórico',
          description: 'Explora el centro histórico',
          lat: -12.0464,
          lng: -77.0428,
          tolerance_radius_m: 50,
          points: 100,
          is_active: false,
          challenge_count: 0,
          has_qr: false,
          translations: {},
        },
        {
          id: 'mission-2',
          campaign_id: 'camp-1',
          campaign_name: 'Historia de Lima',
          city_id: 'city-1',
          name: 'La Catedral',
          description: 'Visita la catedral',
          lat: -12.0465,
          lng: -77.035,
          tolerance_radius_m: 50,
          points: 150,
          is_active: true,
          challenge_count: 3,
          has_qr: true,
          translations: {},
        },
      ],
      total: 2,
      limit: 20,
      offset: 0,
    })
  }),

  http.get(`${BASE}/api/v1/admin/missions/:id`, ({ params }) => {
    return HttpResponse.json({
      id: params['id'],
      campaign_id: 'camp-1',
      campaign_name: 'Historia de Lima',
      city_id: 'city-1',
      name: 'El Centro Histórico',
      description: 'Explora el centro histórico',
      lat: -12.0464,
      lng: -77.0428,
      tolerance_radius_m: 50,
      points: 100,
      is_active: false,
      challenge_count: 0,
      has_qr: false,
      translations: {},
    })
  }),

  http.post(`${BASE}/api/v1/admin/missions`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json(
      { id: 'new-mission-1', challenge_count: 0, has_qr: false, ...body },
      { status: 201 }
    )
  }),

  http.put(`${BASE}/api/v1/admin/missions/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ id: params['id'], ...body })
  }),

  // Challenges
  http.get(`${BASE}/api/v1/admin/missions/:id/challenges`, () => {
    return HttpResponse.json([])
  }),

  http.put(`${BASE}/api/v1/admin/missions/:id/challenges`, async ({ request }) => {
    const body = (await request.json()) as unknown[]
    return HttpResponse.json(
      (body as Record<string, unknown>[]).map((c, i) => ({
        id: `ch-${i}`,
        mission_id: 'mission-1',
        ...c,
      }))
    )
  }),

  // QR
  http.get(`${BASE}/api/v1/admin/missions/:id/qr`, () => {
    return HttpResponse.json([])
  }),

  http.post(`${BASE}/api/v1/admin/missions/:id/qr`, ({ params }) => {
    return HttpResponse.json(
      {
        id: 'qr-1',
        mission_id: params['id'],
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
