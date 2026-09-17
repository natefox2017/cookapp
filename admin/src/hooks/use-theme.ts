import { useCallback, useEffect, useState } from 'react'
import { applyTheme, getStoredTheme, toggleTheme, type Theme } from '@/lib/theme'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme())

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const toggle = useCallback(() => {
    setTheme((current) => toggleTheme(current))
  }, [])

  return {
    theme,
    isDark: theme === 'dark',
    toggle,
    setTheme: (next: Theme) => {
      applyTheme(next)
      setTheme(next)
    },
  }
}
