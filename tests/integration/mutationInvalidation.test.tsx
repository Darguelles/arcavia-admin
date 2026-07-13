import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import { ToastProvider } from '../../src/components/Toast'
import { MissionsPage } from '../../src/features/missions/MissionsPage'
import { useCityFilter } from '../../src/components/Layout'
import { useAuthStore } from '../../src/auth/store'
import { t } from '../../src/lib/i18n'

function Wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 0 } } })
  return (
    <MemoryRouter>
      <QueryClientProvider client={qc}>
        <ToastProvider>
          <MissionsPage />
        </ToastProvider>
      </QueryClientProvider>
    </MemoryRouter>
  )
}

describe('Mutation invalidation (spec §11.3)', () => {
  beforeEach(() => {
    useAuthStore.getState().setSession('test-admin-token', 'admin', 'admin-1')
    useCityFilter.setState({ cityId: '' })
  })

  it('shows missions from the API on initial load', async () => {
    render(<Wrapper />)
    await waitFor(
      () => {
        expect(screen.getByText('El Centro Histórico')).toBeInTheDocument()
        expect(screen.getByText('La Catedral')).toBeInTheDocument()
      },
      { timeout: 5000 }
    )
  })

  it('shows activation guard badge for missions with 0 challenges', async () => {
    render(<Wrapper />)
    await waitFor(
      () => {
        expect(screen.getByText('Sin preguntas')).toBeInTheDocument()
      },
      { timeout: 5000 }
    )
  })

  it('refetches and shows missions after missions list is reset', async () => {
    // Start with no missions
    server.use(
      http.get('http://localhost:8000/api/v1/admin/missions', () => {
        return HttpResponse.json({ items: [], total: 0, limit: 20, offset: 0 })
      })
    )

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 0 } } })

    const { rerender } = render(
      <MemoryRouter>
        <QueryClientProvider client={qc}>
          <ToastProvider>
            <MissionsPage />
          </ToastProvider>
        </QueryClientProvider>
      </MemoryRouter>
    )

    await waitFor(
      () => {
        expect(screen.getByText(t.noMissions)).toBeInTheDocument()
      },
      { timeout: 5000 }
    )

    // Now override handler to return a new mission
    server.use(
      http.get('http://localhost:8000/api/v1/admin/missions', () => {
        return HttpResponse.json({
          items: [
            {
              id: 'mission-new',
              campaign_id: 'camp-1',
              campaign_name: 'Historia de Lima',
              city_id: 'city-1',
              name: 'Misión Recién Creada',
              description: '',
              tolerance_radius_m: 50,
              points: 100,
              is_active: false,
              challenge_count: 0,
              has_qr: false,
              translations: {},
            },
          ],
          total: 1,
          limit: 20,
          offset: 0,
        })
      })
    )

    // Invalidate the query (simulating what a mutation would do)
    await qc.invalidateQueries({ queryKey: ['missions'] })

    await waitFor(
      () => {
        expect(screen.getByText('Misión Recién Creada')).toBeInTheDocument()
      },
      { timeout: 5000 }
    )
  })
})
