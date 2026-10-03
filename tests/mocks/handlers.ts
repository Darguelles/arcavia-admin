import { http, HttpResponse } from 'msw'

const BASE = 'http://localhost:8000'

export const handlers = [
  // Auth — mirrors the real backend: admin-panel roles get an MFA challenge
  // instead of tokens at the password step (login serializes exclude_none, so
  // the MFA branch carries no access_token/role keys).
  http.post(`${BASE}/api/v1/auth/login`, async ({ request }) => {
    const body = (await request.json()) as Record<string, string>
    if (body.email === 'admin@test.com' && body.password === 'adminpass') {
      return HttpResponse.json({
        token_type: 'bearer',
        force_password_reset: false,
        mfa: 'totp',
        mfa_token: 'test-mfa-token',
      })
    }
    if (body.email === 'enroll@test.com' && body.password === 'enrollpass') {
      return HttpResponse.json({
        token_type: 'bearer',
        force_password_reset: false,
        mfa: 'enroll',
        mfa_token: 'test-enroll-token',
      })
    }
    if (body.email === 'reset@test.com' && body.password === 'resetpass') {
      return HttpResponse.json({
        token_type: 'bearer',
        force_password_reset: false,
        mfa: 'totp',
        mfa_token: 'reset-mfa-token',
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
    return HttpResponse.json(
      { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' } },
      { status: 401 }
    )
  }),

  http.post(`${BASE}/api/v1/auth/mfa/verify`, async ({ request }) => {
    const body = (await request.json()) as Record<string, string>
    const validCode = body.code === '123456' || body.recovery_code === 'AAAA-BBBB'
    if (!validCode) {
      return HttpResponse.json(
        { error: { code: 'INVALID_MFA_CODE', message: 'Invalid verification code.' } },
        { status: 401 }
      )
    }
    if (body.mfa_token === 'reset-mfa-token') {
      return HttpResponse.json({
        access_token: 'test-reset-token',
        token_type: 'bearer',
        role: 'admin',
        user_id: 'reset-user-1',
        force_password_reset: true,
      })
    }
    return HttpResponse.json({
      access_token: 'test-admin-token',
      token_type: 'bearer',
      role: 'admin',
      user_id: 'admin-user-1',
      force_password_reset: false,
    })
  }),

  http.post(`${BASE}/api/v1/auth/mfa/enroll/start`, () => {
    return HttpResponse.json({
      secret: 'JBSWY3DPEHPK3PXP',
      otpauth_uri:
        'otpauth://totp/Arcavia%20Admin:enroll%40test.com?secret=JBSWY3DPEHPK3PXP&issuer=Arcavia%20Admin',
    })
  }),

  http.post(`${BASE}/api/v1/auth/mfa/enroll/confirm`, async ({ request }) => {
    const body = (await request.json()) as Record<string, string>
    if (body.code !== '123456') {
      return HttpResponse.json(
        { error: { code: 'INVALID_MFA_CODE', message: 'Invalid verification code.' } },
        { status: 401 }
      )
    }
    return HttpResponse.json({
      access_token: 'test-enrolled-token',
      token_type: 'bearer',
      role: 'staff',
      user_id: 'staff-user-1',
      force_password_reset: false,
      recovery_codes: [
        'AAAA-BBBB',
        'CCCC-DDDD',
        'EEEE-FFFF',
        'GGGG-HHHH',
        'JJJJ-KKKK',
        'LLLL-MMMM',
        'NNNN-PPPP',
        'QQQQ-RRRR',
        'SSSS-TTTT',
        'UUUU-VVVV',
      ],
    })
  }),

  http.post(`${BASE}/api/v1/auth/logout`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  http.post(`${BASE}/api/v1/auth/refresh`, () => {
    return HttpResponse.json({ access_token: 'refreshed-token' })
  }),

  http.post(`${BASE}/api/v1/account/password`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // Team management (root-only)
  http.get(`${BASE}/api/v1/admin/team`, () => {
    return HttpResponse.json({
      items: [
        {
          id: 'root-user-1',
          email: 'root@example.com',
          display_name: 'Root',
          role: 'root',
          is_active: true,
          mfa_enrolled: true,
          force_password_reset: false,
          created_at: '2026-01-01T00:00:00Z',
        },
        {
          id: 'staff-user-1',
          email: 'staff@example.com',
          display_name: 'Staff Uno',
          role: 'staff',
          is_active: true,
          mfa_enrolled: false,
          force_password_reset: true,
          created_at: '2026-02-01T00:00:00Z',
        },
      ],
    })
  }),

  http.post(`${BASE}/api/v1/admin/team`, async ({ request }) => {
    const body = (await request.json()) as Record<string, string>
    return HttpResponse.json(
      {
        user: {
          id: 'new-team-1',
          email: body.email,
          display_name: body.display_name,
          role: body.role,
          is_active: true,
          mfa_enrolled: false,
          force_password_reset: true,
          created_at: '2026-03-01T00:00:00Z',
        },
        temp_password: 'TempPass-1234567',
      },
      { status: 201 }
    )
  }),

  http.patch(`${BASE}/api/v1/admin/team/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({
      id: params['id'],
      email: 'staff@example.com',
      display_name: 'Staff Uno',
      role: body.role ?? 'staff',
      is_active: body.is_active ?? true,
      mfa_enrolled: false,
      force_password_reset: true,
      created_at: '2026-02-01T00:00:00Z',
    })
  }),

  http.post(`${BASE}/api/v1/admin/team/:id/reset-password`, () => {
    return HttpResponse.json({ temp_password: 'TempPass-7654321' })
  }),

  http.post(`${BASE}/api/v1/admin/team/:id/reset-mfa`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // Audit log
  http.get(`${BASE}/api/v1/admin/audit-log`, ({ request }) => {
    const url = new URL(request.url)
    const action = url.searchParams.get('action')
    const items = [
      {
        id: 'audit-1',
        actor_user_id: 'root-user-1',
        actor_email: 'root@example.com',
        actor_role: 'root',
        action: 'TEAM_USER_CREATED',
        target_type: 'user',
        target_id: 'staff-user-1',
        metadata: { role: 'staff' },
        ip: '203.0.113.7',
        user_agent: 'TestAgent/1.0',
        request_id: 'req-1',
        created_at: '2026-08-30T10:00:00Z',
      },
      {
        id: 'audit-2',
        actor_user_id: 'admin-user-1',
        actor_email: 'admin@test.com',
        actor_role: 'admin',
        action: 'LOGIN_SUCCESS',
        target_type: 'user',
        target_id: 'admin-user-1',
        metadata: null,
        ip: '203.0.113.9',
        user_agent: 'TestAgent/1.0',
        request_id: 'req-2',
        created_at: '2026-08-30T09:00:00Z',
      },
    ].filter((i) => !action || i.action === action)
    return HttpResponse.json({ items, total: items.length })
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
        image_url: null,
        translations: {},
        difficulty: 'media',
        reward_points: 100,
        estimated_time_minutes: 60,
        explorers_count: 0,
        is_active: false,
        archived_at: null,
      },
      {
        id: 'mission-2',
        campaign_id: 'camp-1',
        city_id: 'city-1',
        name: 'La Catedral',
        description: 'Visita la catedral',
        image_url: null,
        translations: {},
        difficulty: 'alta',
        reward_points: 150,
        estimated_time_minutes: 90,
        explorers_count: 12,
        is_active: true,
        archived_at: null,
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
      image_url: null,
      translations: {},
      difficulty: 'media',
      reward_points: 100,
      estimated_time_minutes: 60,
      explorers_count: 0,
      is_active: false,
      archived_at: null,
    })
  }),

  http.post(`${BASE}/api/v1/admin/missions`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json(
      { id: 'new-mission-1', city_id: 'city-1', image_url: null, explorers_count: 0, ...body },
      { status: 201 }
    )
  }),

  http.patch(`${BASE}/api/v1/admin/missions/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({
      id: params['id'],
      city_id: 'city-1',
      image_url: null,
      explorers_count: 0,
      ...body,
    })
  }),

  // Removal — what goes with the mission, then archive it (204).
  http.get(`${BASE}/api/v1/admin/missions/:id/deletion-impact`, () =>
    HttpResponse.json({ phases: 2, waypoints: 5, categories: 1, players_with_progress: 3 })
  ),
  http.delete(`${BASE}/api/v1/admin/missions/:id`, () => new HttpResponse(null, { status: 204 })),
  http.get(`${BASE}/api/v1/admin/phases/:id/deletion-impact`, () =>
    HttpResponse.json({ phases: 1, waypoints: 2, categories: 0, players_with_progress: 0 })
  ),

  // Cover image — raw image bytes in, mission with image_url out.
  http.put(`${BASE}/api/v1/admin/missions/:id/image`, ({ params }) =>
    HttpResponse.json({
      id: params['id'],
      campaign_id: 'camp-1',
      city_id: 'city-1',
      name: 'El Centro Histórico',
      description: 'Explora el centro histórico',
      image_url: 'http://localhost:8000/media/missions/mission-1/abc.jpg',
      translations: {},
      difficulty: 'media',
      reward_points: 100,
      estimated_time_minutes: 60,
      explorers_count: 0,
      is_active: false,
      archived_at: null,
    })
  ),

  http.delete(`${BASE}/api/v1/admin/missions/:id/image`, ({ params }) =>
    HttpResponse.json({
      id: params['id'],
      campaign_id: 'camp-1',
      city_id: 'city-1',
      name: 'El Centro Histórico',
      description: 'Explora el centro histórico',
      image_url: null,
      translations: {},
      difficulty: 'media',
      reward_points: 100,
      estimated_time_minutes: 60,
      explorers_count: 0,
      is_active: false,
      archived_at: null,
    })
  ),

  // Structure: categories / phases / waypoints
  http.get(`${BASE}/api/v1/admin/missions/:id/categories`, () =>
    HttpResponse.json([
      {
        id: 'cat-1',
        mission_id: 'mission-1',
        name: 'Cultural',
        threshold_pct: 60,
        total_points: 0,
        order_index: 0,
      },
    ])
  ),
  http.get(`${BASE}/api/v1/admin/missions/:id/phases`, () => HttpResponse.json([])),
  http.get(`${BASE}/api/v1/admin/phases/:id/waypoints`, () => HttpResponse.json([])),

  // Waypoints — geolocation check-in is the always-on default; requires_qr/
  // requires_keyword are optional additional factors (see WaypointEditor.tsx).
  http.get(`${BASE}/api/v1/admin/waypoints/:id`, ({ params }) => {
    return HttpResponse.json({
      id: params['id'],
      phase_id: 'phase-1',
      category_id: 'cat-1',
      name: 'Arco Colonial',
      description: '',
      translations: {},
      lat: -12.0464,
      lng: -77.0428,
      tolerance_radius_m: 50,
      points: 100,
      order_index: 0,
      is_active: false,
      requires_qr: false,
      requires_keyword: false,
      required_accuracy_m: 50,
      dwell_seconds: 60,
      min_fixes: 4,
      onsite_keyword_prompt: null,
      onsite_keyword_answer: null,
    })
  }),

  http.post(`${BASE}/api/v1/admin/phases/:id/waypoints`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ id: 'new-waypoint-1', ...body }, { status: 201 })
  }),

  http.patch(`${BASE}/api/v1/admin/waypoints/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ id: params['id'], ...body })
  }),

  // Geo check-in operator review queue
  http.get(`${BASE}/api/v1/admin/geo-attempts`, () => {
    return HttpResponse.json({
      items: [
        {
          id: 'attempt-1',
          user_id: 'user-abc12345',
          waypoint_id: 'wp-1',
          waypoint_name: 'Arco Colonial',
          city_id: 'city-1',
          status: 'passed',
          accepted_fixes: 5,
          best_accuracy_m: 8,
          worst_accuracy_m: 12,
          flags: ['zero_jitter'],
          created_at: '2026-07-01T10:00:00Z',
          reviewed_at: null,
        },
      ],
      limit: 20,
      offset: 0,
    })
  }),

  http.patch(`${BASE}/api/v1/admin/geo-attempts/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({
      id: params['id'],
      user_id: 'user-abc12345',
      waypoint_id: 'wp-1',
      waypoint_name: 'Arco Colonial',
      city_id: 'city-1',
      status: body.action === 'reject' ? 'failed' : 'passed',
      accepted_fixes: 5,
      best_accuracy_m: 8,
      worst_accuracy_m: 12,
      flags: ['zero_jitter'],
      created_at: '2026-07-01T10:00:00Z',
      reviewed_at: new Date().toISOString(),
    })
  }),

  // Challenges (per waypoint)
  http.get(`${BASE}/api/v1/admin/waypoints/:id/challenges`, () => HttpResponse.json([])),

  http.post(`${BASE}/api/v1/admin/waypoints/:id/challenges`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json(
      { id: 'ch-1', waypoint_id: params['id'], image_url: null, ...body },
      { status: 201 }
    )
  }),

  // Reference image — raw image bytes in, challenge with image_url out.
  http.put(`${BASE}/api/v1/admin/challenges/:id/image`, ({ params }) =>
    HttpResponse.json({
      id: params['id'],
      waypoint_id: 'wp-1',
      prompt: 'Q',
      order_index: 0,
      is_riddle: false,
      keyword: null,
      fun_fact: null,
      image_url: 'http://localhost:8000/media/challenges/ch-1/abc.jpg',
      options: [],
      translations: {},
    })
  ),

  http.delete(`${BASE}/api/v1/admin/challenges/:id/image`, ({ params }) =>
    HttpResponse.json({
      id: params['id'],
      waypoint_id: 'wp-1',
      prompt: 'Q',
      order_index: 0,
      is_riddle: false,
      keyword: null,
      fun_fact: null,
      image_url: null,
      options: [],
      translations: {},
    })
  ),

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

  // Users — mocks mirror the REAL backend wire shape (UserAdmin uses created_at,
  // the list adds derived last_activity_at; the detail page reads /overview).
  http.get(`${BASE}/api/v1/admin/users`, () => {
    return HttpResponse.json({
      items: [
        {
          id: 'user-1',
          email: 'player@example.com',
          display_name: 'Juan Pérez',
          avatar_url: null,
          locale: 'es',
          role: 'player',
          birth_date: '1995-06-15',
          is_active: true,
          force_password_reset: false,
          consent_at: '2024-01-15T10:00:00Z',
          consent_version: '1.0',
          is_deleted: false,
          deleted_at: null,
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-06-20T14:30:00Z',
          last_activity_at: '2024-06-20T14:30:00Z',
        },
      ],
      total: 1,
      limit: 20,
      offset: 0,
    })
  }),

  http.get(`${BASE}/api/v1/admin/users/:id/overview`, ({ params }) => {
    return HttpResponse.json({
      profile: {
        id: params['id'],
        email: 'player@example.com',
        display_name: 'Juan Pérez',
        avatar_url: null,
        locale: 'es',
        role: 'player',
        birth_date: '1995-06-15',
        is_active: true,
        force_password_reset: false,
        consent_at: '2024-01-15T10:00:00Z',
        consent_version: '1.0',
        is_deleted: false,
        deleted_at: null,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-06-20T14:30:00Z',
        last_activity_at: '2024-06-20T14:30:00Z',
      },
      is_anonymized: false,
      total_points: 350,
      checkpoint_points: 250,
      bonus_points: 100,
      missions_started: 2,
      missions_completed: 1,
      challenges_completed: 8,
      points_by_city: [{ city_id: 'city-1', city_name: 'Lima', points: 350 }],
      missions: [
        {
          mission_id: 'm-1',
          mission_name: 'Centro Histórico',
          city_id: 'city-1',
          city_name: 'Lima',
          status: 'completed',
          riddle_solved: true,
          checkpoint_points: 150,
          bonus_points: 100,
          waypoints_completed: 3,
          waypoints_total: 3,
          completed_at: '2024-06-20T14:00:00Z',
          categories: [
            {
              category_id: 'c-1',
              name: 'Cultural',
              points_earned: 150,
              total_points: 150,
              threshold_pct: 60,
              earned_pct: 100,
              met: true,
            },
          ],
        },
        {
          mission_id: 'm-2',
          mission_name: 'Miraflores',
          city_id: 'city-1',
          city_name: 'Lima',
          status: 'in_progress',
          riddle_solved: false,
          checkpoint_points: 100,
          bonus_points: 0,
          waypoints_completed: 2,
          waypoints_total: 5,
          completed_at: null,
          categories: [
            {
              category_id: 'c-2',
              name: 'Patrocinador',
              points_earned: 100,
              total_points: 200,
              threshold_pct: 60,
              earned_pct: 50,
              met: false,
            },
          ],
        },
      ],
      rewards: [
        {
          reward_id: 'r-1',
          name: 'Cupón Café',
          description: '2x1 en bebidas',
          image_url: null,
          validity_starts_at: '2024-01-01T00:00:00Z',
          validity_ends_at: '2025-12-31T00:00:00Z',
          earned_at: '2024-06-20T14:00:00Z',
          currently_valid: true,
        },
      ],
      recent_sessions: [
        {
          id: 's-1',
          browser: 'Chrome',
          os: 'Android',
          device_type: 'mobile',
          ip_masked: '203.0.113.0',
          ip_country: null,
          created_at: '2024-06-20T14:00:00Z',
          last_seen_at: '2024-06-20T14:30:00Z',
        },
      ],
    })
  }),

  http.get(`${BASE}/api/v1/admin/users/:id/export`, ({ params }) => {
    return HttpResponse.json({
      exported_at: '2024-06-21T00:00:00Z',
      note: 'export',
      profile: { id: params['id'], email: 'player@example.com' },
      is_anonymized: false,
      total_points: 350,
      answers: [],
      sessions: [],
    })
  }),

  http.get(`${BASE}/api/v1/admin/users/:id`, ({ params }) => {
    return HttpResponse.json({
      id: params['id'],
      email: 'player@example.com',
      display_name: 'Juan Pérez',
      avatar_url: null,
      locale: 'es',
      role: 'player',
      birth_date: '1995-06-15',
      is_active: true,
      force_password_reset: false,
      consent_at: '2024-01-15T10:00:00Z',
      consent_version: '1.0',
      is_deleted: false,
      deleted_at: null,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-06-20T14:30:00Z',
      last_activity_at: '2024-06-20T14:30:00Z',
    })
  }),

  http.post(`${BASE}/api/v1/admin/users/:id/reset-password`, () => {
    return HttpResponse.json({
      temporary_password: 'TempPass123!',
      message: 'Temporary password generated.',
    })
  }),

  http.post(`${BASE}/api/v1/admin/users/:id/reset-progress`, () => {
    return HttpResponse.json({
      missions: 2,
      waypoints: 5,
      categories: 3,
      answers: 4,
      geo_attempts: 6,
      rewards: 1,
    })
  }),

  http.post(`${BASE}/api/v1/admin/users/:id/activate`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  http.post(`${BASE}/api/v1/admin/users/:id/deactivate`, () => {
    return new HttpResponse(null, { status: 204 })
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
