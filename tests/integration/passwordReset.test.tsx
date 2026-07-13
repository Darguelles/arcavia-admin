import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastProvider } from '../../src/components/Toast'
import { UserDetail } from '../../src/features/users/UserDetail'
import { useAuthStore } from '../../src/auth/store'

function Wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
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

describe('Password reset one-time reveal (spec §6.7, §11.3)', () => {
  beforeEach(() => {
    useAuthStore.getState().setSession('test-admin-token', 'admin', 'admin-1')
  })

  it('shows reset button in user detail', async () => {
    render(<Wrapper />)
    await waitFor(
      () => {
        expect(screen.getByText('Restablecer contraseña')).toBeInTheDocument()
      },
      { timeout: 5000 }
    )
  })

  it('shows confirm dialog before resetting', async () => {
    const user = userEvent.setup()
    render(<Wrapper />)

    await waitFor(() => screen.getByText('Restablecer contraseña'), { timeout: 5000 })
    await user.click(screen.getByText('Restablecer contraseña'))

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText(/Generar contraseña temporal/)).toBeInTheDocument()
    })
  })

  it('shows temp password once in a reveal dialog after confirming', async () => {
    const user = userEvent.setup()
    render(<Wrapper />)

    await waitFor(() => screen.getByText('Restablecer contraseña'), { timeout: 5000 })
    await user.click(screen.getByText('Restablecer contraseña'))
    await waitFor(() => screen.getByRole('button', { name: /generar contraseña temporal/i }))
    await user.click(screen.getByRole('button', { name: /generar contraseña temporal/i }))

    await waitFor(() => {
      expect(screen.getByText('Contraseña temporal generada')).toBeInTheDocument()
      expect(screen.getByText('TempPass123!')).toBeInTheDocument()
    })
  })

  it('clears temp password when the reveal dialog is closed', async () => {
    const user = userEvent.setup()
    render(<Wrapper />)

    await waitFor(() => screen.getByText('Restablecer contraseña'), { timeout: 5000 })
    await user.click(screen.getByText('Restablecer contraseña'))
    await waitFor(() => screen.getByRole('button', { name: /generar contraseña temporal/i }))
    await user.click(screen.getByRole('button', { name: /generar contraseña temporal/i }))
    await waitFor(() => screen.getByText('TempPass123!'))

    await user.click(screen.getByText(/ya copié la contraseña/))

    await waitFor(() => {
      expect(screen.queryByText('TempPass123!')).toBeNull()
      expect(screen.queryByText('Contraseña temporal generada')).toBeNull()
    })
  })
})
