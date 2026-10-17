import { useCallback, useEffect, useState } from 'react'

export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'predixlab-theme'

const prefersDark = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-color-scheme: dark)').matches

const readStoredTheme = (): Theme => {
  if (typeof document !== 'undefined') {
    const attr = document.documentElement.getAttribute('data-theme')
    if (attr === 'light' || attr === 'dark') return attr
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    /* ignore read failures (private mode) */
  }
  return prefersDark() ? 'dark' : 'light'
}

const applyTheme = (theme: Theme): void => {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme)
    const color = getComputedStyle(document.documentElement).getPropertyValue('--pl-app').trim()
    document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach(meta => {
      meta.content = color
    })
  }
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    /* ignore persistence failures (private mode) */
  }
}

/**
 * Reads and controls the app-wide colour theme. Light is the default; the
 * initial value is resolved by an inline script in index.html so the first
 * paint is already correct.
 */
export function useTheme(): { theme: Theme; setTheme: (t: Theme) => void; toggleTheme: () => void } {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const setTheme = useCallback((next: Theme) => setThemeState(next), [])
  const toggleTheme = useCallback(
    () => setThemeState(prev => (prev === 'dark' ? 'light' : 'dark')),
    [],
  )

  return { theme, setTheme, toggleTheme }
}
