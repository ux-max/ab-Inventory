"use client"

import React from "react"
import { Sun, Moon } from "lucide-react"
import { useTheme } from "@/context/ThemeContext"

interface ThemeToggleProps {
  className?: string
  iconClassName?: string
}

export function ThemeToggle({
  className = "p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300",
  iconClassName = "h-5 w-5"
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={(e) => toggleTheme(e)}
      className={`inline-flex items-center justify-center transition-colors cursor-pointer select-none ${className}`}
      title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle Theme"
    >
      <div className="flex items-center justify-center">
        {theme === "dark" ? (
          <Sun className={`${iconClassName} text-amber-400`} />
        ) : (
          <Moon className={`${iconClassName} text-slate-600 dark:text-slate-300`} />
        )}
      </div>
    </button>
  )
}
