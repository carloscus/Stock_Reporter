import { useState, useEffect, useCallback } from 'react'

export function useTheme() {
  const [theme, setTheme] = useState('light')
  const [mounted, setMounted] = useState(false)

  // Initialize theme on mount
  useEffect(() => {
    setMounted(true)
    
    // Check localStorage first
    const stored = localStorage.getItem('stockflow-theme')
    if (stored) {
      setTheme(stored)
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setTheme(prefersDark ? 'dark' : 'light')
    }
  }, [])

  // Apply theme to document and localStorage
  useEffect(() => {
    if (!mounted) return
    
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
    localStorage.setItem('stockflow-theme', theme)
  }, [theme, mounted])

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }, [])

  const setLightTheme = useCallback(() => setTheme('light'), [])
  const setDarkTheme = useCallback(() => setTheme('dark'), [])

  return {
    theme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    mounted,
    toggleTheme,
    setLightTheme,
    setDarkTheme
  }
}
