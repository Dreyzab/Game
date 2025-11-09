import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'qrboost.theme'

export function useTheme(initial?: Theme) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = typeof window !== 'undefined' ? (localStorage.getItem(STORAGE_KEY) as Theme | null) : null
    return saved ?? initial ?? 'dark'
  })

  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    root.setAttribute('data-color-scheme', theme)
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch (err) {
      console.warn('[useTheme] Failed to persist theme', err)
    }
  }, [theme])

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return { theme, setTheme, toggle }
}
