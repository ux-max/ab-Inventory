"use client"

import React, { useEffect, useRef } from "react"
import { X, RotateCcw, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export interface FilterPopoverProps {
  isOpen: boolean
  onClose: () => void
  onReset?: () => void
  onClearAll?: () => void
  title?: string
  activeCount?: number
  activeFilterCount?: number
  children: React.ReactNode
  className?: string
  width?: string
}

export function FilterPopover({
  isOpen,
  onClose,
  onReset,
  onClearAll,
  title = "Filters",
  activeCount = 0,
  activeFilterCount,
  children,
  className = "",
  width = "w-80 sm:w-96"
}: FilterPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null)
  const effectiveReset = onClearAll || onReset
  const effectiveCount = activeFilterCount ?? activeCount

  // Click outside and Escape key handler
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      ref={popoverRef}
      className={`absolute right-0 top-full mt-2.5 ${width} bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl z-50 p-4 text-left animate-in fade-in zoom-in-95 duration-150 font-sans text-slate-900 dark:text-slate-100 ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 tracking-tight uppercase">
            {title}
          </span>
          {effectiveCount > 0 && (
            <Badge variant="blue" className="text-[10px] px-1.5 py-0 font-bold">
              {effectiveCount} active
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {effectiveReset && (
            <button
              type="button"
              onClick={effectiveReset}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center space-x-1 cursor-pointer transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset all</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            aria-label="Close filters"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Popover Content (Scrollable if needed) */}
      <div className="max-h-[380px] overflow-y-auto space-y-4 pr-1 scrollbar-thin">
        {children}
      </div>
    </div>
  )
}

/**
 * Filter Section Container with title and optional clear
 */
export function FilterSection({
  title,
  children,
  badge
}: {
  title: string
  children: React.ReactNode
  badge?: string | number
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        {badge !== undefined && (
          <span className="text-[10px] text-slate-400 font-medium">{badge}</span>
        )}
      </div>
      {children}
    </div>
  )
}

/**
 * Filter Pill Button for multi-choice options
 */
export function FilterPill({
  label,
  active,
  onClick,
  count,
  icon
}: {
  label: string
  active: boolean
  onClick: () => void
  count?: number
  icon?: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer inline-flex items-center space-x-1.5 shrink-0 ${
        active
          ? "bg-blue-50/90 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/60 font-semibold shadow-2xs"
          : "bg-slate-50/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white font-medium"
      }`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={`text-[10px] px-1.5 py-0.2 rounded-full ${
            active ? "bg-blue-200/70 dark:bg-blue-900/70 text-blue-800 dark:text-blue-200 font-bold" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  )
}

/**
 * Filter Checkbox Row for multi-select lists
 */
export function FilterCheckbox({
  label,
  checked,
  onChange,
  count,
  icon
}: {
  label: string
  checked: boolean
  onChange: ((checked: boolean) => void) | (() => void)
  count?: number
  icon?: React.ReactNode
}) {
  return (
    <label
      onClick={() => {
        ;(onChange as (val: boolean) => void)(!checked)
      }}
      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer select-none transition-colors ${
        checked ? "bg-blue-50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-300 font-semibold" : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
      }`}
    >
      <div className="flex items-center space-x-2">
        <div
          className={`h-4 w-4 rounded flex items-center justify-center border transition-all ${
            checked
              ? "bg-blue-600 border-blue-600 text-white"
              : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
          }`}
        >
          {checked && <Check className="h-3 w-3 stroke-[3]" />}
        </div>
        {icon && <span className="shrink-0">{icon}</span>}
        <span>{label}</span>
      </div>
      {count !== undefined && (
        <span className="text-[10px] text-slate-400 font-medium">{count}</span>
      )}
    </label>
  )
}
