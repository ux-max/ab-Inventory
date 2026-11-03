"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark"

interface ThemeContextType {
  theme: Theme
  toggleTheme: (e?: React.MouseEvent) => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Force clean light theme permanently
    document.documentElement.classList.remove("dark")
    localStorage.setItem("ab_theme", "light")
    setThemeState("light")
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    // Light theme only
    setThemeState("light")
    document.documentElement.classList.remove("dark")
  }

  const setTheme = () => {
    setThemeState("light")
    document.documentElement.classList.remove("dark")
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
