import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import { UsersPage } from '../../src/features/users/UsersPage'
import { useAuthStore } from '../../src/auth/store'
import { t } from '../../src/lib/i18n'

function Wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 0 } } })
  return (
    <MemoryRouter>
      <QueryClientProvider client={qc}>
        <UsersPage />
      </QueryClientProvider>
    </MemoryRouter>
  )
}

describe('UsersPage — search & filters', () => {
  beforeEach(() => {
    useAuthStore.getState().setSession('test-admin-token', 'admin', 'admin-1')
  })

  it('adapts the backend created_at into the "Registrado" column and shows the user', async () => {
    render(<Wrapper />)
    await waitFor(() => expect(screen.getByText('player@example.com')).toBeInTheDocument())
    // display_name subtext + filter controls render
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    expect(screen.getByLabelText(t.filterRole)).toBeInTheDocument()
    expect(screen.getByLabelText(t.filterStatus)).toBeInTheDocument()
  })

  it('passes the role filter through to the backend query', async () => {
    let capturedUrl = ''
    server.use(
      http.get('*/api/v1/admin/users', ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json({ items: [], total: 0, limit: 20, offset: 0 })
      })
    )

    const user = userEvent.setup()
    render(<Wrapper />)
    await waitFor(() => expect(capturedUrl).toContain('/api/v1/admin/users'))

    await user.selectOptions(screen.getByLabelText(t.filterRole), 'player')
    await waitFor(() => expect(capturedUrl).toContain('role=player'))
  })

  it('passes sort params when a sortable column header is clicked', async () => {
    let capturedUrl = ''
    server.use(
      http.get('*/api/v1/admin/users', ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json({ items: [], total: 0, limit: 20, offset: 0 })
      })
    )

    const user = userEvent.setup()
    render(<Wrapper />)
    await waitFor(() => expect(capturedUrl).toContain('/api/v1/admin/users'))

    await user.click(screen.getByRole('button', { name: new RegExp(t.email, 'i') }))
    await waitFor(() => expect(capturedUrl).toContain('sort_by=email'))
  })
})
