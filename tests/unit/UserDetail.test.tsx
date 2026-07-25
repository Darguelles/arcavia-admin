import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
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

describe('UserDetail — reset progress', () => {
  beforeEach(() => {
    useAuthStore.getState().setSession('test-admin-token', 'admin', 'admin-1')
  })

  it('warns before wiping and shows a success toast after confirming', async () => {
    const user = userEvent.setup()
    render(<Wrapper />)
    await waitFor(() => screen.getByRole('heading', { name: 'player@example.com' }))

    await user.click(screen.getByRole('button', { name: t.resetProgress }))
    await waitFor(() =>
      expect(screen.getByText(/Se borrará TODO el progreso/i)).toBeInTheDocument()
    )

    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: t.resetProgress })
    )
    await waitFor(() => expect(screen.getByText(t.resetProgressDone)).toBeInTheDocument())
  })
})
