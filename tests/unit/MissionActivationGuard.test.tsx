import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import { ToastProvider } from '../../src/components/Toast'
import { MissionEditor } from '../../src/features/missions/MissionEditor'
import { t } from '../../src/lib/i18n'

const BASE = 'http://localhost:8000'

function Wrapper({ initialEntry = '/admin/missions/mission-1' }: { initialEntry?: string }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <MemoryRouter initialEntries={[initialEntry]}>
      <QueryClientProvider client={qc}>
        <ToastProvider>
          <Routes>
            <Route path="/admin/missions/:id" element={<MissionEditor />} />
          </Routes>
        </ToastProvider>
      </QueryClientProvider>
    </MemoryRouter>
  )
}

// Building blocks for a structurally complete mission: one category with
// points, one phase with an active waypoint — what assert_mission_completable
// accepts.
const categoriesWithPoints = http.get(`${BASE}/api/v1/admin/missions/:id/categories`, () =>
  HttpResponse.json([
    {
      id: 'cat-1',
      mission_id: 'mission-1',
      name: 'Cultural',
      threshold_pct: 60,
      total_points: 120,
      order_index: 0,
    },
  ])
)
const onePhase = http.get(`${BASE}/api/v1/admin/missions/:id/phases`, () =>
  HttpResponse.json([{ id: 'phase-1', mission_id: 'mission-1', name: 'Fase 1', order_index: 0 }])
)
const activeWaypoints = http.get(`${BASE}/api/v1/admin/phases/:id/waypoints`, () =>
  HttpResponse.json([
    {
      id: 'wp-1',
      phase_id: 'phase-1',
      category_id: 'cat-1',
      name: 'Arco Colonial',
      description: '',
      translations: {},
      lat: -12.0464,
      lng: -77.0428,
      tolerance_radius_m: 50,
      points: 120,
      order_index: 0,
      is_active: true,
      requires_qr: false,
      requires_keyword: false,
      required_accuracy_m: 50,
      dwell_seconds: 60,
      min_fixes: 4,
      onsite_keyword_prompt: null,
      onsite_keyword_answer: null,
    },
  ])
)
const readyStructure = [categoriesWithPoints, onePhase, activeWaypoints]

describe('Mission activation — readiness panel (mirrors §8.4 assert_mission_completable)', () => {
  it('disables "Activar misión" while the structure is incomplete and lists what is missing', async () => {
    // Default handlers: one category with 0 points, no phases.
    render(<Wrapper />)

    const button = await screen.findByRole('button', { name: t.activateMission })
    await waitFor(() => expect(button).toBeDisabled())

    expect(screen.getByText(t.checkHasPhases)).toBeInTheDocument()
    // The 0-point category is named as the offender.
    expect(screen.getByText(t.checkCategoriesHavePoints)).toBeInTheDocument()
    expect(screen.getByText('Cultural')).toBeInTheDocument()
  })

  it('names the phase that lacks an active waypoint', async () => {
    server.use(
      categoriesWithPoints,
      onePhase,
      http.get(`${BASE}/api/v1/admin/phases/:id/waypoints`, () => HttpResponse.json([]))
    )
    render(<Wrapper />)

    const button = await screen.findByRole('button', { name: t.activateMission })
    await waitFor(() => expect(button).toBeDisabled())
    expect(await screen.findByText('Fase 1')).toBeInTheDocument()
  })

  it('enables the button when ready and activates via PATCH {is_active: true}', async () => {
    const user = userEvent.setup()
    let patched: Record<string, unknown> | null = null
    server.use(
      ...readyStructure,
      http.patch(`${BASE}/api/v1/admin/missions/:id`, async ({ params, request }) => {
        patched = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({
          id: params['id'],
          campaign_id: 'camp-1',
          city_id: 'city-1',
          name: 'El Centro Histórico',
          description: '',
          image_url: null,
          translations: {},
          difficulty: 'media',
          reward_points: 100,
          estimated_time_minutes: 60,
          explorers_count: 0,
          is_active: true,
        })
      })
    )
    render(<Wrapper />)

    const button = await screen.findByRole('button', { name: t.activateMission })
    await waitFor(() => expect(button).not.toBeDisabled())
    await user.click(button)

    await waitFor(() => expect(patched).toEqual({ is_active: true }))
    expect(await screen.findByText(t.missionActivated)).toBeInTheDocument()
  })

  it('shows the server 409 in Spanish with the offending phase name', async () => {
    const user = userEvent.setup()
    server.use(
      ...readyStructure,
      http.patch(`${BASE}/api/v1/admin/missions/:id`, () =>
        HttpResponse.json(
          {
            error: {
              code: 'MISSION_NOT_COMPLETABLE',
              message: "Phase 'Fase 1' has no active waypoint.",
            },
          },
          { status: 409 }
        )
      )
    )
    render(<Wrapper />)

    const button = await screen.findByRole('button', { name: t.activateMission })
    await waitFor(() => expect(button).not.toBeDisabled())
    await user.click(button)

    expect(await screen.findByText(t.errPhaseNoActiveWaypoint('Fase 1'))).toBeInTheDocument()
  })

  it('shows the active badge instead of the button for an active mission', async () => {
    server.use(
      ...readyStructure,
      http.get(`${BASE}/api/v1/admin/missions/:id`, ({ params }) =>
        HttpResponse.json({
          id: params['id'],
          campaign_id: 'camp-1',
          city_id: 'city-1',
          name: 'El Centro Histórico',
          description: '',
          image_url: null,
          translations: {},
          difficulty: 'media',
          reward_points: 100,
          estimated_time_minutes: 60,
          explorers_count: 0,
          is_active: true,
        })
      )
    )
    render(<Wrapper />)

    expect(await screen.findByText(t.missionActiveBadge)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: t.activateMission })).not.toBeInTheDocument()
  })
})

describe('Mission editor — tab state in the URL', () => {
  it('?tab=fases opens the phases tab directly', async () => {
    render(<Wrapper initialEntry="/admin/missions/mission-1?tab=fases" />)
    expect(await screen.findByRole('button', { name: `+ ${t.addPhase}` })).toBeInTheDocument()
  })

  it('switching tabs works from a URL-driven state', async () => {
    const user = userEvent.setup()
    render(<Wrapper initialEntry="/admin/missions/mission-1?tab=fases" />)
    await screen.findByRole('button', { name: `+ ${t.addPhase}` })

    await user.click(screen.getByRole('button', { name: t.categoriesTab }))
    expect(await screen.findByText(t.thresholdHint)).toBeInTheDocument()
  })
})
