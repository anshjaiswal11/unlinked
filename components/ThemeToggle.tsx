'use client'

import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getStoredTheme, setStoredTheme, type ThemeName } from './ThemeProvider'

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<ThemeName>('dark')

  useEffect(() => {
    const active = getStoredTheme() ?? (document.documentElement.dataset.theme as ThemeName) ?? 'dark'
    setTheme(active === 'light' ? 'light' : 'dark')
  }, [])

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    setStoredTheme(next)
  }

  const Icon = theme === 'dark' ? Sun : Moon

  return (
    <button
      type="button"
      className="icon-btn"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
    >
      <Icon size={compact ? 17 : 18} strokeWidth={2.2} />
    </button>
  )
}
