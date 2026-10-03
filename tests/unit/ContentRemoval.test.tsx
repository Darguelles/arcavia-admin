import { describe, it, expect } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import { ToastProvider } from '../../src/components/Toast'
import { MissionEditor } from '../../src/features/missions/MissionEditor'
import { PhasesEditor } from '../../src/features/missions/PhasesEditor'
import { t } from '../../src/lib/i18n'

const BASE = 'http://localhost:8000'

function mission(overrides: Record<string, unknown> = {}) {
  return {
    id: 'mission-1',
    campaign_id: 'camp-1',
    city_id: 'city-1',
    name: 'El Centro Histórico',
    description: '',
    image_url: null,
    translations: {},
    difficulty: 'media',
    reward_points: 100,
    estimated_time_minutes: 60,
    explorers_count: 3,
    is_active: true,
    archived_at: null,
    ...overrides,
  }
}

function EditorWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <MemoryRouter initialEntries={['/admin/missions/mission-1']}>
      <QueryClientProvider client={qc}>
        <ToastProvider>
          <Routes>
            <Route path="/admin/missions/:id" element={<MissionEditor />} />
            <Route path="/admin/missions" element={<p>lista de misiones</p>} />
          </Routes>
        </ToastProvider>
      </QueryClientProvider>
    </MemoryRouter>
  )
}

// Removing a mission used to be impossible (PHASE_IN_USE) or a silent
// deactivation. It now states exactly what goes with it — and that players
// keep their history — before archiving everything in one call.
describe('MissionEditor — remove mission', () => {
  it('shows the cascade impact, then deletes and goes back to the list', async () => {
    const user = userEvent.setup()
    let deleted = false
    server.use(
      http.get(`${BASE}/api/v1/admin/missions/:id`, () => HttpResponse.json(mission())),
      http.delete(`${BASE}/api/v1/admin/missions/mission-1`, () => {
        deleted = true
        return new HttpResponse(null, { status: 204 })
      })
    )

    render(<EditorWrapper />)
    await user.click(await screen.findByRole('button', { name: t.deleteMission }))

    const dialog = await screen.findByRole('dialog')
    await waitFor(() =>
      expect(
        within(dialog).getByText(
          t.deleteMissionConfirm('El Centro Histórico', {
            phases: 2,
            waypoints: 5,
            categories: 1,
            players_with_progress: 3,
          })
        )
      ).toBeInTheDocument()
    )
    expect(within(dialog).getByText(/3 jugadores conservarán su historial/)).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: t.delete }))
    await waitFor(() => expect(deleted).toBe(true))
    expect(await screen.findByText('lista de misiones')).toBeInTheDocument()
  })

  it('unpublishing is a PATCH, not a removal', async () => {
    const user = userEvent.setup()
    let patched: unknown = null
    let deleted = false
    server.use(
      http.get(`${BASE}/api/v1/admin/missions/:id`, () => HttpResponse.json(mission())),
      http.patch(`${BASE}/api/v1/admin/missions/mission-1`, async ({ request }) => {
        patched = await request.json()
        return HttpResponse.json(mission({ is_active: false }))
      }),
      http.delete(`${BASE}/api/v1/admin/missions/mission-1`, () => {
        deleted = true
        return new HttpResponse(null, { status: 204 })
      })
    )

    render(<EditorWrapper />)
    await user.click(await screen.findByRole('button', { name: t.deactivate }))
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: t.deactivate })
    )

    await waitFor(() => expect(patched).toEqual({ is_active: false }))
    expect(deleted).toBe(false)
  })

  it('a removed mission is review-only, with a banner and restore', async () => {
    const user = userEvent.setup()
    let restored = false
    server.use(
      http.get(`${BASE}/api/v1/admin/missions/:id`, () =>
        HttpResponse.json(
          restored
            ? mission({ is_active: false })
            : mission({ is_active: false, archived_at: '2026-10-01T10:00:00Z' })
        )
      ),
      http.get(`${BASE}/api/v1/admin/audit-log`, () =>
        HttpResponse.json({
          items: [{ actor_email: 'ops@arcavia.com', action: 'ADMIN_MISSION_ARCHIVED' }],
          total: 1,
        })
      ),
      http.post(`${BASE}/api/v1/admin/missions/mission-1/restore`, () => {
        restored = true
        return HttpResponse.json(mission({ is_active: false }))
      })
    )

    render(<EditorWrapper />)
    const banner = await screen.findByRole('status')
    await waitFor(() => expect(banner).toHaveTextContent('por ops@arcavia.com'))
    expect(screen.getByText(t.missionArchivedBadge)).toBeInTheDocument()
    // no remove/unpublish on something already removed; the form is locked
    expect(screen.queryByRole('button', { name: t.deleteMission })).not.toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: new RegExp(t.name) })).toBeDisabled()

    await user.click(within(banner).getByRole('button', { name: t.restore }))
    await waitFor(() => expect(restored).toBe(true))
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument())
    expect(screen.getByRole('button', { name: t.deleteMission })).toBeInTheDocument()
  })
})

function PhasesWrapper({ readOnly = false }: { readOnly?: boolean }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <MemoryRouter>
      <QueryClientProvider client={qc}>
        <ToastProvider>
          <PhasesEditor missionId="mission-1" hasCategories readOnly={readOnly} />
        </ToastProvider>
      </QueryClientProvider>
    </MemoryRouter>
  )
}

const onePhase = http.get(`${BASE}/api/v1/admin/missions/:id/phases`, () =>
  HttpResponse.json([
    { id: 'phase-1', mission_id: 'mission-1', name: 'Centro', order_index: 0, archived_at: null },
  ])
)

describe('PhasesEditor — remove phase', () => {
  it('no longer asks to remove the points first: it says they go with the phase', async () => {
    const user = userEvent.setup()
    let deleted = false
    server.use(
      onePhase,
      http.delete(`${BASE}/api/v1/admin/phases/phase-1`, () => {
        deleted = true
        return new HttpResponse(null, { status: 204 })
      })
    )

    render(<PhasesWrapper />)
    await user.click(await screen.findByRole('button', { name: `${t.delete} Centro` }))
    const dialog = await screen.findByRole('dialog')
    await waitFor(() =>
      expect(within(dialog).getByText(t.deletePhaseConfirm('Centro', 2, 0))).toBeInTheDocument()
    )
    expect(within(dialog).getByText(/sus 2 puntos/)).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: t.delete }))
    await waitFor(() => expect(deleted).toBe(true))
  })

  it('read-only mode hides every edit action', async () => {
    server.use(onePhase)
    render(<PhasesWrapper readOnly />)
    expect(await screen.findByText(/Centro/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: `${t.delete} Centro` })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: t.addPhase })).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: new RegExp(t.addWaypoint) })
    ).not.toBeInTheDocument()
  })
})
