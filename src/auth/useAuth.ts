import { useAuthStore } from './store'
import { apiClient } from '../api/client'

export function useAuth() {
  const { accessToken, role, userId, forceReset, setSession, clearSession } = useAuthStore()

  async function login(email: string, password: string) {
    const data = await apiClient.post<{
      access_token: string
      role: string
      user_id: string
      force_password_reset?: boolean
    }>('/api/v1/auth/login', { email, password })
    if (data.role !== 'admin') {
      await apiClient.post('/api/v1/auth/logout').catch(() => undefined)
      throw new Error('Solo los administradores pueden acceder a este panel.')
    }
    setSession(data.access_token, 'admin', data.user_id)
    if (data.force_password_reset) {
      useAuthStore.getState().setForceReset(true)
    }
    return data
  }

  async function logout() {
    await apiClient.post('/api/v1/auth/logout').catch(() => undefined)
    clearSession()
  }

  async function changePassword(currentPassword: string, newPassword: string) {
    await apiClient.post('/api/v1/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    })
    useAuthStore.getState().setForceReset(false)
  }

  return {
    isAuthenticated: !!accessToken,
    isAdmin: role === 'admin',
    userId,
    forceReset,
    login,
    logout,
    changePassword,
  }
}
