import { create } from 'zustand'
import type { User, Role } from '@/types'
import { authService, type LoginPayload } from '@/services/api/authService'
import { employeeService, type RolePermissions } from '@/services/api/employeeService'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (payload: LoginPayload) => Promise<User>
  logout: () => Promise<void>
  checkSession: () => Promise<void>
  hasPermission: (permission: keyof RolePermissions) => boolean
  setUser: (user: User | null) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (payload: LoginPayload) => {
    set({ isLoading: true, error: null })
    try {
      const user = await authService.login(payload)
      set({ user, isAuthenticated: true, isLoading: false })
      return user
    } catch (err: any) {
      set({ error: err.message || 'Login failed', isLoading: false })
      throw err
    }
  },

  logout: async () => {
    try {
      await authService.logout()
    } finally {
      set({ user: null, isAuthenticated: false })
    }
  },

  checkSession: async () => {
    set({ isLoading: true })
    try {
      const user = await authService.getMe()
      set({ user, isAuthenticated: true, isLoading: false })
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },

  hasPermission: (permission: keyof RolePermissions) => {
    const { user } = get()
    if (!user) return false
    const perms = employeeService.getRolePermissions(user.role)
    return !!perms[permission]
  },

  setUser: (user: User | null) => {
    set({ user, isAuthenticated: !!user })
  },
}))
