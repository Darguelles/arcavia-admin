import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastProvider } from '../../src/components/Toast'
import { UserDetail } from '../../src/features/users/UserDetail'
import { useAuthStore } from '../../src/auth/store'
import { t } from '../../src/lib/i18n'

function Wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 0 } } })
  return (
    <MemoryRouter initialEntries={['/admin/users/user-1']}>
      <QueryClientProvider client={qc}>
        <ToastProvider>
          <Routes>
            <Route path="/admin/users/:id" element={<UserDetail />} />
          </Routes>
        </ToastProvider>
      </QueryClientProvider>
    </MemoryRouter>
  )
}

describe('UserDetail — lifecycle overview', () => {
  beforeEach(() => {
    useAuthStore.getState().setSession('test-admin-token', 'admin', 'admin-1')
  })

  it('renders missions, points, rewards and sessions from the overview endpoint', async () => {
    render(<Wrapper />)
    await waitFor(() => screen.getByRole('heading', { name: 'player@example.com' }))

    // missions (in-progress + completed) with per-category progress
    expect(screen.getByText('Centro Histórico')).toBeInTheDocument()
    expect(screen.getByText('Miraflores')).toBeInTheDocument()
    expect(screen.getByText('Cultural')).toBeInTheDocument()
    // accumulated points (appears as the total and in the per-city breakdown)
    expect(screen.getByText(t.accumulatedPoints)).toBeInTheDocument()
    expect(screen.getAllByText('350').length).toBeGreaterThan(0)
    // reward earned
    expect(screen.getByText('Cupón Café')).toBeInTheDocument()
    // session/device
    expect(screen.getByText('Chrome · Android')).toBeInTheDocument()
    expect(screen.getByText(t.deviceMobile)).toBeInTheDocument()
  })

  it('exports user data as a downloadable JSON and toasts success', async () => {
    const createUrl = vi.fn(() => 'blob:mock')
    const revokeUrl = vi.fn()
    // jsdom doesn't implement object URLs — stub them for the download path.
    globalThis.URL.createObjectURL = createUrl
    globalThis.URL.revokeObjectURL = revokeUrl
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined)

    const user = userEvent.setup()
    render(<Wrapper />)
    await waitFor(() => screen.getByRole('heading', { name: 'player@example.com' }))

    await user.click(screen.getByRole('button', { name: t.exportData }))
    await waitFor(() => expect(screen.getByText(t.exportDataDone)).toBeInTheDocument())
    expect(createUrl).toHaveBeenCalled()
    expect(clickSpy).toHaveBeenCalled()

    clickSpy.mockRestore()
  })
})
