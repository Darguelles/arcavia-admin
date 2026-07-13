import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
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

describe('Login + role gate (spec §4.2, §11.3)', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession()
  })

  it('sets admin session on successful login', async () => {
    const user = userEvent.setup()
    render(
      <Wrapper>
        <LoginPage />
      </Wrapper>
    )

    await user.type(screen.getByLabelText(/correo/i), 'admin@test.com')
    await user.type(screen.getByLabelText(/contraseña/i), 'adminpass')
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    await waitFor(() => {
      const { accessToken, role } = useAuthStore.getState()
      expect(accessToken).toBe('test-admin-token')
      expect(role).toBe('admin')
    })
  })

  it('rejects player-role token with a clear error message', async () => {
    const user = userEvent.setup()
    render(
      <Wrapper>
        <LoginPage />
      </Wrapper>
    )

    await user.type(screen.getByLabelText(/correo/i), 'player@test.com')
    await user.type(screen.getByLabelText(/contraseña/i), 'playerpass')
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/solo los administradores/i)
    })

    // Session must not be persisted
    expect(useAuthStore.getState().accessToken).toBeNull()
  })

  it('shows error on invalid credentials', async () => {
    const user = userEvent.setup()
    render(
      <Wrapper>
        <LoginPage />
      </Wrapper>
    )

    await user.type(screen.getByLabelText(/correo/i), 'wrong@test.com')
    await user.type(screen.getByLabelText(/contraseña/i), 'wrongpass')
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })
})

describe('401 → refresh → retry (spec §11.3)', () => {
  it('retries request with new token after 401', async () => {
    // Arrange: override login to return an expiring token
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

    // The 401 triggered refresh, then the second attempt succeeded
    expect(attempt).toBe(2)
    expect(result).toMatchObject({ active_cities: 1 })
  })
})

describe('Forced-reset routing (spec §4.4, §11.3)', () => {
  it('sets forceReset on login when flag is true', async () => {
    const user = userEvent.setup()
    render(
      <Wrapper>
        <LoginPage />
      </Wrapper>
    )

    await user.type(screen.getByLabelText(/correo/i), 'reset@test.com')
    await user.type(screen.getByLabelText(/contraseña/i), 'resetpass')
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    await waitFor(() => {
      expect(useAuthStore.getState().forceReset).toBe(true)
    })
  })
})
