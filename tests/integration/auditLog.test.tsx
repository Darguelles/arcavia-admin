import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import { ToastProvider } from '../../src/components/Toast'
import { AuditLogPage } from '../../src/features/audit/AuditLogPage'
import { useAuthStore } from '../../src/auth/store'

function Wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <MemoryRouter initialEntries={['/admin/audit']}>
      <QueryClientProvider client={qc}>
        <ToastProvider>{children}</ToastProvider>
      </QueryClientProvider>
    </MemoryRouter>
  )
}

describe('AuditLogPage', () => {
  beforeEach(() => {
    useAuthStore.getState().setSession('root-token', 'root', 'root-user-1')
  })

  it('renders audit entries with actor, action and IP', async () => {
    render(
      <Wrapper>
        <AuditLogPage />
      </Wrapper>
    )

    expect(await screen.findByText('TEAM_USER_CREATED')).toBeInTheDocument()
    // the actor email renders in the table cell (and again in the root-only
    // actor filter dropdown, hence getAllByText)
    expect(screen.getAllByText('root@example.com').length).toBeGreaterThan(0)
    expect(screen.getByText('203.0.113.7')).toBeInTheDocument()
  })

  it('filters by action via query params', async () => {
    const user = userEvent.setup()
    const seenActions: Array<string | null> = []
    server.use(
      http.get('http://localhost:8000/api/v1/admin/audit-log', ({ request }) => {
        const url = new URL(request.url)
        seenActions.push(url.searchParams.get('action'))
        return HttpResponse.json({ items: [], total: 0 })
      })
    )

    render(
      <Wrapper>
        <AuditLogPage />
      </Wrapper>
    )
    await screen.findByText(/sin registros/i)

    await user.type(screen.getByLabelText(/acción/i), 'LOGIN_SUCCESS')
    await waitFor(() => {
      expect(seenActions).toContain('LOGIN_SUCCESS')
    })
  })

  it('shows metadata details on demand', async () => {
    const user = userEvent.setup()
    render(
      <Wrapper>
        <AuditLogPage />
      </Wrapper>
    )

    await screen.findByText('TEAM_USER_CREATED')
    await user.click(screen.getByRole('button', { name: 'Detalles' }))
    expect(await screen.findByText(/"role": "staff"/)).toBeInTheDocument()
  })

  it('admin (non-root) sees the log without the actor filter', async () => {
    useAuthStore.getState().setSession('admin-token', 'admin', 'admin-user-1')
    render(
      <Wrapper>
        <AuditLogPage />
      </Wrapper>
    )

    expect(await screen.findByText('LOGIN_SUCCESS')).toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })
})
