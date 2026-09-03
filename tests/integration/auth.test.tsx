import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import { ToastProvider } from '../../src/components/Toast'
import { LoginPage } from '../../src/features/auth/LoginPage'
import { useAuthStore } from '../../src/auth/store'

function Wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <MemoryRouter initialEntries={['/admin/login']}>
      <QueryClientProvider client={qc}>
        <ToastProvider>{children}</ToastProvider>
      </QueryClientProvider>
    </MemoryRouter>
  )
}

async function submitPassword(email: string, password: string) {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText(/correo/i), email)
  await user.type(screen.getByLabelText(/contraseña/i), password)
  await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))
  return user
}

describe('Login + MFA (spec §4.2, §11.3)', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession()
  })

  it('admin login shows the TOTP step, then a valid code sets the session', async () => {
    const user = userEvent.setup()
    render(
      <Wrapper>
        <LoginPage />
      </Wrapper>
    )

    await submitPassword('admin@test.com', 'adminpass')

    // no session yet — MFA pending
    await screen.findByText(/verificación en dos pasos/i)
    expect(useAuthStore.getState().accessToken).toBeNull()

    await user.type(screen.getByLabelText(/código de verificación/i), '123456')
    await user.click(screen.getByRole('button', { name: /verificar/i }))

    await waitFor(() => {
      const { accessToken, role } = useAuthStore.getState()
      expect(accessToken).toBe('test-admin-token')
      expect(role).toBe('admin')
    })
  })

  it('rejects a wrong TOTP code with a clear error and no session', async () => {
    const user = userEvent.setup()
    render(
      <Wrapper>
        <LoginPage />
      </Wrapper>
    )

    await submitPassword('admin@test.com', 'adminpass')
    await screen.findByText(/verificación en dos pasos/i)

    await user.type(screen.getByLabelText(/código de verificación/i), '000000')
    await user.click(screen.getByRole('button', { name: /verificar/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/código de verificación incorrecto/i)
    })
    expect(useAuthStore.getState().accessToken).toBeNull()
  })

  it('accepts a recovery code via the recovery toggle', async () => {
    const user = userEvent.setup()
    render(
      <Wrapper>
        <LoginPage />
      </Wrapper>
    )

    await submitPassword('admin@test.com', 'adminpass')
    await screen.findByText(/verificación en dos pasos/i)

    await user.click(screen.getByRole('button', { name: /usar un código de recuperación/i }))
    await user.type(screen.getByLabelText(/código de recuperación/i), 'AAAA-BBBB')
    await user.click(screen.getByRole('button', { name: /verificar/i }))

    await waitFor(() => {
      expect(useAuthStore.getState().accessToken).toBe('test-admin-token')
    })
  })

  it('first login walks through enrollment: QR, code, recovery codes, session', async () => {
    const user = userEvent.setup()
    render(
      <Wrapper>
        <LoginPage />
      </Wrapper>
    )

    await submitPassword('enroll@test.com', 'enrollpass')

    // enrollment step shows the manual secret and asks for a code
    await screen.findByText(/configura la verificación en dos pasos/i)
    expect(screen.getByText('JBSWY3DPEHPK3PXP')).toBeInTheDocument()

    await user.type(screen.getByLabelText(/código de verificación/i), '123456')
    await user.click(screen.getByRole('button', { name: /activar y continuar/i }))

    // recovery codes shown once; session already established
    await screen.findByText(/códigos de recuperación/i)
    expect(screen.getByText('CCCC-DDDD')).toBeInTheDocument()
    expect(useAuthStore.getState().accessToken).toBe('test-enrolled-token')
    expect(useAuthStore.getState().role).toBe('staff')
  })

  it('rejects player-role accounts with a clear error message', async () => {
    render(
      <Wrapper>
        <LoginPage />
      </Wrapper>
    )

    await submitPassword('player@test.com', 'playerpass')

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/solo los administradores/i)
    })
    expect(useAuthStore.getState().accessToken).toBeNull()
  })

  it('shows error on invalid credentials', async () => {
    render(
      <Wrapper>
        <LoginPage />
      </Wrapper>
    )

    await submitPassword('wrong@test.com', 'wrongpass')

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })
})

describe('401 → refresh → retry (spec §11.3)', () => {
  it('retries request with new token after 401', async () => {
    let attempt = 0
    server.use(
      http.get('http://localhost:8000/api/v1/admin/dashboard', () => {
        attempt++
        if (attempt === 1) {
          return HttpResponse.json(
            { code: 'UNAUTHORIZED', message: 'Token expirado' },
            { status: 401 }
          )
        }
        return HttpResponse.json({
          active_cities: 1,
          active_campaigns: 0,
          active_missions: 0,
          total_players: 0,
          recent_completions: 0,
        })
      })
    )

    useAuthStore.getState().setSession('expiring-token', 'admin', 'user-1')

    const { apiClient } = await import('../../src/api/client')
    const result = await apiClient.get('/api/v1/admin/dashboard')

    expect(attempt).toBe(2)
    expect(result).toMatchObject({ active_cities: 1 })
  })
})

describe('Forced-reset routing (spec §4.4, §11.3)', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession()
  })

  it('sets forceReset after the MFA step when the flag is true', async () => {
    const user = userEvent.setup()
    render(
      <Wrapper>
        <LoginPage />
      </Wrapper>
    )

    await submitPassword('reset@test.com', 'resetpass')
    await screen.findByText(/verificación en dos pasos/i)

    await user.type(screen.getByLabelText(/código de verificación/i), '123456')
    await user.click(screen.getByRole('button', { name: /verificar/i }))

    await waitFor(() => {
      expect(useAuthStore.getState().forceReset).toBe(true)
    })
  })
})

describe('MFA enrollment enforcement (client reaction)', () => {
  it('clears the session on 403 MFA_ENROLLMENT_REQUIRED', async () => {
    server.use(
      http.get('http://localhost:8000/api/v1/admin/cities', () =>
        HttpResponse.json(
          {
            error: {
              code: 'MFA_ENROLLMENT_REQUIRED',
              message: 'You must enroll in MFA before accessing this resource.',
            },
          },
          { status: 403 }
        )
      )
    )

    useAuthStore.getState().setSession('stale-token', 'admin', 'user-1')
    const { apiClient } = await import('../../src/api/client')

    await expect(apiClient.get('/api/v1/admin/cities')).rejects.toMatchObject({
      code: 'MFA_ENROLLMENT_REQUIRED',
    })
    expect(useAuthStore.getState().accessToken).toBeNull()
  })
})
