import { useAuthStore } from './store'
import { apiClient } from '../api/client'
import {
  ADMIN_ROLES,
  type LoginResponse,
  type MfaEnrollStartResponse,
  type Role,
} from '../api/types'
import { t } from '../lib/i18n'

/** The password step succeeded but MFA is pending. */
export interface MfaChallenge {
  mfa: 'enroll' | 'totp'
  mfaToken: string
}

export type LoginResult = { kind: 'mfa'; challenge: MfaChallenge } | { kind: 'session' }

function establishSession(data: LoginResponse) {
  const role = data.role as Role | undefined
  if (!role || !ADMIN_ROLES.includes(role)) {
    throw new Error(t.roleError)
  }
  useAuthStore.getState().setSession(data.access_token!, role, data.user_id!)
  if (data.force_password_reset) {
    useAuthStore.getState().setForceReset(true)
  }
}

export function useAuth() {
  const { accessToken, role, userId, forceReset, clearSession } = useAuthStore()

  async function login(email: string, password: string): Promise<LoginResult> {
    const data = await apiClient.post<LoginResponse>('/api/v1/auth/login', {
      email,
      password,
    })
    if (data.mfa && data.mfa_token) {
      return { kind: 'mfa', challenge: { mfa: data.mfa, mfaToken: data.mfa_token } }
    }
    // No MFA branch means the account is not an admin-panel role (players get
    // tokens directly) — reject it from the panel.
    if (data.role && !ADMIN_ROLES.includes(data.role)) {
      await apiClient.post('/api/v1/auth/logout').catch(() => undefined)
      throw new Error(t.roleError)
    }
    establishSession(data)
    return { kind: 'session' }
  }

  /** Verify a TOTP code (or a recovery code) and establish the session. */
  async function mfaVerify(mfaToken: string, opts: { code?: string; recoveryCode?: string }) {
    const data = await apiClient.post<LoginResponse>('/api/v1/auth/mfa/verify', {
      mfa_token: mfaToken,
      code: opts.code,
      recovery_code: opts.recoveryCode,
    })
    establishSession(data)
    return data
  }

  async function mfaEnrollStart(mfaToken: string) {
    return apiClient.post<MfaEnrollStartResponse>('/api/v1/auth/mfa/enroll/start', {
      mfa_token: mfaToken,
    })
  }

  /** Confirm the first TOTP code; returns recovery codes and starts the session. */
  async function mfaEnrollConfirm(mfaToken: string, code: string) {
    const data = await apiClient.post<LoginResponse & { recovery_codes: string[] }>(
      '/api/v1/auth/mfa/enroll/confirm',
      { mfa_token: mfaToken, code }
    )
    establishSession(data)
    return data
  }

  async function logout() {
    await apiClient.post('/api/v1/auth/logout').catch(() => undefined)
    clearSession()
  }

  async function changePassword(currentPassword: string, newPassword: string) {
    await apiClient.post('/api/v1/account/password', {
      current_password: currentPassword || undefined,
      new_password: newPassword,
    })
    useAuthStore.getState().setForceReset(false)
  }

  return {
    isAuthenticated: !!accessToken,
    isAdmin: role !== null && ADMIN_ROLES.includes(role),
    role,
    userId,
    forceReset,
    login,
    mfaVerify,
    mfaEnrollStart,
    mfaEnrollConfirm,
    logout,
    changePassword,
  }
}
