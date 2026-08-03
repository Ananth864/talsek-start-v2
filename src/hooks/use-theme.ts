import { useCallback, useEffect, useState } from 'react'

export type ThemeMode = 'light' | 'dark'

const THEME_STORAGE_KEY = 'theme'

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'light' || value === 'dark'
}

function readStoredMode(): ThemeMode | 'auto' | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (isThemeMode(stored) || stored === 'auto') return stored
  } catch {
    // ignore storage access errors (private mode, etc.)
  }
  return null
}

function resolveTheme(mode: ThemeMode | 'auto' | null): ThemeMode {
  if (mode === 'light' || mode === 'dark') return mode
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement
  root.classList.remove('light', 'dark')
  root.classList.add(mode)
  root.style.colorScheme = mode
}

/**
 * Light/dark theme for the Member shell. Persists to `localStorage.theme`
 * (same key as the flash-prevention init script in `__root`). Toggle writes an
 * explicit light/dark value so the choice survives reloads.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>('light')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const resolved = resolveTheme(readStoredMode())
    setThemeState(resolved)
    applyTheme(resolved)
    setReady(true)
  }, [])

  const setTheme = useCallback((next: ThemeMode) => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // ignore
    }
    applyTheme(next)
    setThemeState(next)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }, [setTheme, theme])

  return { theme, setTheme, toggleTheme, ready }
}
