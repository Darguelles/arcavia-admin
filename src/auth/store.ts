import { create } from 'zustand'
import type { Role } from '../api/types'

interface AuthState {
  accessToken: string | null
  role: Role | null
  userId: string | null
  forceReset: boolean
  setSession: (token: string, role: Role, userId: string) => void
  setAccessToken: (token: string) => void
  setForceReset: (v: boolean) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  role: null,
  userId: null,
  forceReset: false,
  setSession: (token, role, userId) => set({ accessToken: token, role, userId, forceReset: false }),
  setAccessToken: (token) => set({ accessToken: token }),
  setForceReset: (v) => set({ forceReset: v }),
  clearSession: () => set({ accessToken: null, role: null, userId: null, forceReset: false }),
}))
