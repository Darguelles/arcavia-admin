import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastProvider } from '../../src/components/Toast'
import { TeamPage } from '../../src/features/team/TeamPage'
import { useAuthStore } from '../../src/auth/store'

function Wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <MemoryRouter initialEntries={['/admin/team']}>
      <QueryClientProvider client={qc}>
        <ToastProvider>{children}</ToastProvider>
      </QueryClientProvider>
    </MemoryRouter>
  )
}

describe('TeamPage (root-only team management)', () => {
  beforeEach(() => {
    useAuthStore.getState().setSession('root-token', 'root', 'root-user-1')
  })

  it('lists panel users with role and MFA status', async () => {
    render(
      <Wrapper>
        <TeamPage />
      </Wrapper>
    )

    expect(await screen.findByText('root@example.com')).toBeInTheDocument()
    expect(screen.getByText('staff@example.com')).toBeInTheDocument()
    expect(screen.getByText('Activada')).toBeInTheDocument()
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
  })

  it('hides row actions for root and self', async () => {
    render(
      <Wrapper>
        <TeamPage />
      </Wrapper>
    )
    await screen.findByText('root@example.com')

    // one manageable row (staff) → exactly one deactivate button
    expect(screen.getAllByRole('button', { name: 'Desactivar' })).toHaveLength(1)
  })

  it('creates a user and reveals the one-time temp password', async () => {
    const user = userEvent.setup()
    render(
      <Wrapper>
        <TeamPage />
      </Wrapper>
    )
    await screen.findByText('root@example.com')

    await user.click(screen.getByRole('button', { name: 'Nuevo usuario' }))
    await user.type(screen.getByLabelText(/correo/i), 'nuevo@example.com')
    await user.type(screen.getByLabelText(/nombre/i), 'Nueva Persona')
    await user.click(screen.getByRole('button', { name: 'Crear' }))

    await waitFor(() => {
      expect(screen.getByText('TempPass-1234567')).toBeInTheDocument()
    })
  })

  it('resets MFA behind a confirmation dialog', async () => {
    const user = userEvent.setup()
    render(
      <Wrapper>
        <TeamPage />
      </Wrapper>
    )
    await screen.findByText('staff@example.com')

    await user.click(screen.getByRole('button', { name: 'Restablecer MFA' }))
    expect(await screen.findByRole('dialog')).toHaveTextContent(/staff@example\.com/)

    const dialogConfirm = screen
      .getAllByRole('button', { name: 'Restablecer MFA' })
      .at(-1) as HTMLElement
    await user.click(dialogConfirm)

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })
})
