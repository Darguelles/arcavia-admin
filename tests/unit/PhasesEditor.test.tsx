import { describe, it, expect } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import { ToastProvider } from '../../src/components/Toast'
import { PhasesEditor } from '../../src/features/missions/PhasesEditor'
import { t } from '../../src/lib/i18n'

const BASE = 'http://localhost:8000'

function Wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <MemoryRouter initialEntries={['/admin/missions/mission-1?tab=fases']}>
      <QueryClientProvider client={qc}>
        <ToastProvider>
          <PhasesEditor missionId="mission-1" hasCategories />
        </ToastProvider>
      </QueryClientProvider>
    </MemoryRouter>
  )
}

function waypoint(overrides: Record<string, unknown>) {
  return {
    id: 'wp-x',
    phase_id: 'phase-1',
    category_id: 'cat-1',
    name: 'Punto',
    description: '',
    translations: {},
    lat: -12.0464,
    lng: -77.0428,
    tolerance_radius_m: 50,
    points: 0,
    order_index: 0,
    is_active: false,
    requires_qr: false,
    requires_keyword: false,
    required_accuracy_m: 50,
    dwell_seconds: 60,
    min_fixes: 4,
    onsite_keyword_prompt: null,
    onsite_keyword_answer: null,
    archived_at: null,
    ...overrides,
  }
}

const onePhase = http.get(`${BASE}/api/v1/admin/missions/:id/phases`, () =>
  HttpResponse.json([{ id: 'phase-1', mission_id: 'mission-1', name: 'Centro', order_index: 0 }])
)
const oneCategory = http.get(`${BASE}/api/v1/admin/missions/:id/categories`, () =>
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

// A deleted point is archived server-side (archived_at set), not removed. The
// phase card must keep it out of the live list and counts, and offer to
// restore it — otherwise a "deleted" point looks like it is still there.
describe('PhasesEditor — deleted (archived) waypoints', () => {
  it('lists archived points apart, uncounted, and restores them on demand', async () => {
    const user = userEvent.setup()
    let restored = false
    server.use(
      onePhase,
      oneCategory,
      http.get(`${BASE}/api/v1/admin/phases/:id/waypoints`, () =>
        HttpResponse.json([
          waypoint({ id: 'wp-1', name: 'Arco Colonial', points: 120, is_active: true }),
          waypoint({
            id: 'wp-2',
            name: 'Plaza Vieja',
            points: 80,
            order_index: 1,
            archived_at: restored ? null : '2026-09-10T10:00:00Z',
          }),
        ])
      ),
      http.post(`${BASE}/api/v1/admin/waypoints/wp-2/restore`, () => {
        restored = true
        return HttpResponse.json(waypoint({ id: 'wp-2', name: 'Plaza Vieja', points: 80 }))
      })
    )

    render(<Wrapper />)
    await waitFor(() => expect(screen.getByText('Arco Colonial')).toBeInTheDocument())

    // header counts only the live point
    expect(screen.getByText('1 punto · 120 pts')).toBeInTheDocument()
    // the live point offers delete; the archived one is folded away
    expect(screen.getByRole('button', { name: `${t.delete} Arco Colonial` })).toBeInTheDocument()
    expect(screen.queryByText('Plaza Vieja')).not.toBeInTheDocument()

    const toggle = screen.getByRole('button', {
      name: new RegExp(`${t.archivedWaypoints} \\(1\\)`),
    })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await user.click(toggle)

    expect(screen.getByText('Plaza Vieja')).toBeInTheDocument()
    expect(screen.getByText(t.archived)).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: `${t.delete} Plaza Vieja` })
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: `${t.restore} Plaza Vieja` }))

    // back in the live list as an inactive draft, counted again
    await waitFor(() => expect(screen.getByText('2 puntos · 200 pts')).toBeInTheDocument())
    expect(screen.queryByText(new RegExp(t.archivedWaypoints))).not.toBeInTheDocument()
    const row = screen.getByText('Plaza Vieja').closest('div')!.parentElement!
    expect(within(row).getByText(t.inactive)).toBeInTheDocument()
    expect(within(row).getByRole('button', { name: `${t.delete} Plaza Vieja` })).toBeInTheDocument()
  })

  it('deleting a live point asks to confirm with the delete wording', async () => {
    const user = userEvent.setup()
    server.use(
      onePhase,
      oneCategory,
      http.get(`${BASE}/api/v1/admin/phases/:id/waypoints`, () =>
        HttpResponse.json([waypoint({ id: 'wp-1', name: 'Arco Colonial', is_active: true })])
      )
    )
    render(<Wrapper />)
    await waitFor(() => expect(screen.getByText('Arco Colonial')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: `${t.delete} Arco Colonial` }))
    expect(screen.getByText(t.deleteWaypointConfirm('Arco Colonial'))).toBeInTheDocument()
  })
})
