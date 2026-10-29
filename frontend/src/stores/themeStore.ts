import { create } from 'zustand'

export type Theme = 'light' | 'dark' | 'system'

interface ThemeState {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyThemeToDOM(resolved: 'light' | 'dark') {
  const root = document.documentElement
  if (resolved === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

const STORAGE_KEY = 'supermarket_theme_preference'

export const useThemeStore = create<ThemeState>((set, get) => {
  const savedTheme = (typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null) as Theme | null
  const initialTheme: Theme = savedTheme || 'light'
  const initialResolved = initialTheme === 'system' ? getSystemTheme() : initialTheme

  // Initial apply
  if (typeof window !== 'undefined') {
    applyThemeToDOM(initialResolved)
  }

  return {
    theme: initialTheme,
    resolvedTheme: initialResolved,

    setTheme: (theme: Theme) => {
      const resolved = theme === 'system' ? getSystemTheme() : theme
      localStorage.setItem(STORAGE_KEY, theme)
      applyThemeToDOM(resolved)
      set({ theme, resolvedTheme: resolved })
    },

    toggleTheme: () => {
      const currentResolved = get().resolvedTheme
      const nextTheme = currentResolved === 'dark' ? 'light' : 'dark'
      localStorage.setItem(STORAGE_KEY, nextTheme)
      applyThemeToDOM(nextTheme)
      set({ theme: nextTheme, resolvedTheme: nextTheme })
    },
  }
})
