import { create } from 'zustand'
import type { User, Role } from '@/types'
import { authService, type LoginPayload } from '@/services/api/authService'
import { employeeService, type RolePermissions } from '@/services/api/employeeService'
import { localStore } from '@/services/dataStore'

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
  switchRoleUser: (role: Role) => User | null
}

function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem('som_current_user')
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

export const useAuthStore = create<AuthState>((set, get) => {
  const initialUser = getStoredUser() || localStore.users[0]

  return {
    user: initialUser,
    isAuthenticated: true,
    isLoading: false,
    error: null,

    login: async (payload: LoginPayload) => {
      set({ isLoading: true, error: null })
      try {
        const user = await authService.login(payload)
        localStorage.setItem('som_current_user', JSON.stringify(user))
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
        localStorage.removeItem('som_current_user')
        set({ user: null, isAuthenticated: false })
      }
    },

    checkSession: async () => {
      const stored = getStoredUser()
      if (stored) {
        // verify it still exists in localStore
        const found = localStore.users.find((u) => u.id === stored.id) || stored
        set({ user: found, isAuthenticated: true })
        return
      }

      set({ isLoading: true })
      try {
        const user = await authService.getMe()
        localStorage.setItem('som_current_user', JSON.stringify(user))
        set({ user, isAuthenticated: true, isLoading: false })
      } catch {
        const fallback = localStore.users[0]
        localStorage.setItem('som_current_user', JSON.stringify(fallback))
        set({ user: fallback, isAuthenticated: true, isLoading: false })
      }
    },

    hasPermission: (permission: keyof RolePermissions) => {
      const { user } = get()
      if (!user) return false
      const perms = employeeService.getRolePermissions(user.role)
      return !!perms[permission]
    },

    setUser: (user: User | null) => {
      if (user) {
        localStorage.setItem('som_current_user', JSON.stringify(user))
      } else {
        localStorage.removeItem('som_current_user')
      }
      set({ user, isAuthenticated: !!user })
    },

    switchRoleUser: (role: Role) => {
      const matched = localStore.users.find((u) => u.role === role && u.status === 'active')
      if (matched) {
        localStorage.setItem('som_current_user', JSON.stringify(matched))
        localStore.logAction(
          matched.name,
          matched.role,
          'ROLE_SWITCH',
          'Auth',
          `Shaqaalaha waxa loo beddelay: ${matched.name} (${matched.role})`
        )
        set({ user: matched, isAuthenticated: true })
        return matched
      }
      return null
    },
  }
})
