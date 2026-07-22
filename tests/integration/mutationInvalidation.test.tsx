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

  it('refetches and shows missions after the missions list is reset', async () => {
    // Start with no missions (v2: bare array)
    server.use(
      http.get('http://localhost:8000/api/v1/admin/missions', () => {
        return HttpResponse.json([])
      })
    )

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 0 } } })

    render(
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

    // Now return a new mission
    server.use(
      http.get('http://localhost:8000/api/v1/admin/missions', () => {
        return HttpResponse.json([
          {
            id: 'mission-new',
            campaign_id: 'camp-1',
            city_id: 'city-1',
            name: 'Misión Recién Creada',
            description: '',
            translations: {},
            difficulty: 'media',
            reward_points: 100,
            estimated_time_minutes: 0,
            explorers_count: 0,
            is_active: false,
          },
        ])
      })
    )

    await qc.invalidateQueries({ queryKey: ['missions'] })

    await waitFor(
      () => {
        expect(screen.getByText('Misión Recién Creada')).toBeInTheDocument()
      },
      { timeout: 5000 }
    )
  })
})
