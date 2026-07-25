import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import { ToastProvider } from '../../src/components/Toast'
import { ReviewQueuePage } from '../../src/features/reviewQueue/ReviewQueuePage'
import { useAuthStore } from '../../src/auth/store'
import { t } from '../../src/lib/i18n'

function Wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 0 } } })
  return (
    <MemoryRouter>
      <QueryClientProvider client={qc}>
        <ToastProvider>
          <ReviewQueuePage />
        </ToastProvider>
      </QueryClientProvider>
    </MemoryRouter>
  )
}

describe('ReviewQueuePage', () => {
  beforeEach(() => {
    useAuthStore.getState().setSession('test-admin-token', 'admin', 'admin-1')
  })

  it('lists flagged attempts with their flags and waypoint name', async () => {
    render(<Wrapper />)
    await waitFor(() => {
      expect(screen.getByText('Arco Colonial')).toBeInTheDocument()
      expect(screen.getByText('zero_jitter')).toBeInTheDocument()
    })
  })

  it('shows the empty state when nothing is flagged', async () => {
    server.use(
      http.get('http://localhost:8000/api/v1/admin/geo-attempts', () =>
        HttpResponse.json({ items: [], limit: 20, offset: 0 })
      )
    )
    render(<Wrapper />)
    await waitFor(() => {
      expect(screen.getByText(t.reviewQueueEmpty)).toBeInTheDocument()
    })
  })

  it('approve confirms, calls the API, and shows a success toast', async () => {
    const user = userEvent.setup()
    render(<Wrapper />)
    await waitFor(() => screen.getByText('Arco Colonial'))

    await user.click(screen.getByRole('button', { name: t.approve }))
    await waitFor(() => screen.getByText(t.approveConfirm))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: t.approve }))

    await waitFor(() => {
      expect(screen.getByText(t.saved)).toBeInTheDocument()
    })
  })

  it('reject shows the flag-only warning before confirming', async () => {
    const user = userEvent.setup()
    render(<Wrapper />)
    await waitFor(() => screen.getByText('Arco Colonial'))

    await user.click(screen.getByRole('button', { name: t.reject }))
    await waitFor(() => {
      expect(screen.getByText(t.rejectConfirm)).toBeInTheDocument()
    })
  })

  it('shows a pending badge and action buttons for an unreviewed attempt', async () => {
    render(<Wrapper />)
    await waitFor(() => screen.getByText('Arco Colonial'))
    expect(screen.getByText(t.reviewPending)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: t.approve })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: t.reject })).toBeInTheDocument()
  })

  it('shows the outcome and hides the actions once an attempt is reviewed', async () => {
    server.use(
      http.get('http://localhost:8000/api/v1/admin/geo-attempts', () =>
        HttpResponse.json({
          items: [
            {
              id: 'attempt-2',
              user_id: 'user-xyz98765',
              waypoint_id: 'wp-1',
              waypoint_name: 'Puente Viejo',
              city_id: 'city-1',
              status: 'failed',
              accepted_fixes: 5,
              best_accuracy_m: 8,
              worst_accuracy_m: 12,
              flags: ['zero_jitter'],
              created_at: '2026-07-01T10:00:00Z',
              reviewed_at: '2026-07-02T10:00:00Z',
            },
          ],
          limit: 20,
          offset: 0,
        })
      )
    )
    render(<Wrapper />)
    await waitFor(() => screen.getByText('Puente Viejo'))
    expect(screen.getByText(t.reviewRejected)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: t.approve })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: t.reject })).not.toBeInTheDocument()
  })
})
