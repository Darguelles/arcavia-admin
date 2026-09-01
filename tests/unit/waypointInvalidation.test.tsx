import { describe, it, expect } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { server } from '../mocks/server'
import { useCategories } from '../../src/api/categories'
import { useUpdateWaypoint } from '../../src/api/waypoints'

const BASE = 'http://localhost:8000'

// A waypoint write changes the server-computed category total_points, so the
// mission's categories must be refetched — otherwise the Categorías tab and
// the readiness panel show stale totals.
describe('waypoint mutations invalidate the mission categories', () => {
  it('refetches categories after a waypoint PATCH', async () => {
    let categoryFetches = 0
    server.use(
      http.get(`${BASE}/api/v1/admin/missions/:id/categories`, () => {
        categoryFetches++
        return HttpResponse.json([
          {
            id: 'cat-1',
            mission_id: 'mission-1',
            name: 'Cultural',
            threshold_pct: 60,
            total_points: categoryFetches * 10,
            order_index: 0,
          },
        ])
      })
    )

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    )
    const { result } = renderHook(
      () => ({
        cats: useCategories('mission-1'),
        update: useUpdateWaypoint('wp-1', 'phase-1', 'mission-1'),
      }),
      { wrapper }
    )

    await waitFor(() => expect(result.current.cats.data).toBeDefined())
    expect(categoryFetches).toBe(1)

    await act(async () => {
      await result.current.update.mutateAsync({ points: 50 })
    })

    await waitFor(() => expect(categoryFetches).toBe(2))
  })
})
