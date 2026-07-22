import { API_BASE } from '../config'
import { useAuthStore } from '../auth/store'
import type { ApiError } from './types'

export class ApiClientError extends Error {
  code: string
  status: number
  details?: Record<string, unknown>

  constructor(status: number, code: string, message: string, details?: Record<string, unknown>) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
    this.code = code
    this.details = details
  }
}

let isRefreshing = false
let refreshQueue: Array<(token: string | null) => void> = []

function onRefreshDone(token: string | null) {
  refreshQueue.forEach((cb) => cb(token))
  refreshQueue = []
}

async function refreshToken(): Promise<string | null> {
  if (isRefreshing) {
    return new Promise((resolve) => {
      refreshQueue.push(resolve)
    })
  }
  isRefreshing = true
  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
    if (!res.ok) {
      onRefreshDone(null)
      return null
    }
    const data = await res.json()
    const token: string = data.access_token
    useAuthStore.getState().setAccessToken(token)
    onRefreshDone(token)
    return token
  } catch {
    onRefreshDone(null)
    return null
  } finally {
    isRefreshing = false
  }
}

// The API wraps errors as { error: { code, message, details } }; some test
// mocks return the fields flat. Accept either shape.
function unwrapError(body: unknown): ApiError {
  const b = (body ?? {}) as Record<string, unknown>
  const err = (b.error ?? b) as ApiError
  return {
    code: err?.code ?? 'UNKNOWN',
    message: err?.message ?? 'Error desconocido',
    details: err?.details,
  }
}

async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const { accessToken, clearSession } = useAuthStore.getState()

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...((init.headers as Record<string, string>) ?? {}),
  }
  if (accessToken) {
    ;(headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  })

  // A 401 from an auth endpoint (e.g. bad login) is a real failure, not an
  // expired session — never try to refresh, or the true error gets masked.
  const isAuthEndpoint = path.startsWith('/api/v1/auth/')

  if (res.status === 401 && retry && !isAuthEndpoint) {
    const newToken = await refreshToken()
    if (!newToken) {
      clearSession()
      throw new ApiClientError(401, 'UNAUTHORIZED', 'Sesión expirada')
    }
    return request<T>(path, init, false)
  }

  if (res.status === 403) {
    const err = unwrapError(await res.json().catch(() => ({})))
    if (err.code === 'PASSWORD_RESET_REQUIRED') {
      useAuthStore.getState().setForceReset(true)
      throw new ApiClientError(403, err.code, err.message)
    }
    throw new ApiClientError(403, err.code, err.message)
  }

  if (!res.ok) {
    const err = unwrapError(await res.json().catch(() => ({})))
    throw new ApiClientError(
      res.status,
      err.code,
      err.message,
      err.details as Record<string, unknown> | undefined
    )
  }

  if (res.status === 204) return undefined as unknown as T
  return res.json() as Promise<T>
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
