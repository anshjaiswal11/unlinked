'use client'

import { useEffect } from 'react'

const STORAGE_KEY = 'unlinked-theme'

export type ThemeName = 'light' | 'dark'

export function getStoredTheme(): ThemeName | null {
  if (typeof window === 'undefined') return null
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === 'light' || stored === 'dark' ? stored : null
}

export function setStoredTheme(theme: ThemeName) {
  window.localStorage.setItem(STORAGE_KEY, theme)
  document.documentElement.dataset.theme = theme
}

export default function ThemeProvider() {
  useEffect(() => {
    const stored = getStoredTheme()
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.dataset.theme = stored ?? (prefersDark ? 'dark' : 'light')
  }, [])

  return null
}
