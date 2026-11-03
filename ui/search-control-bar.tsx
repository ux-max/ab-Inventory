"use client"

import React from "react"
import { Search, X, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
export { SearchInput, type SearchInputProps } from "@/components/ui/search-input"

export interface ActiveFilterItem {
  id: string
  label: string
  value?: string
  onRemove: () => void
}

export interface SearchControlBarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  placeholder?: string
  chip?: {
    label: string
    value: string
    onRemove: () => void
  } | null
  showFiltersButton?: boolean
  onFiltersClick?: () => void
  onToggleFilter?: () => void
  activeFilterCount?: number
  isFilterOpen?: boolean
  filterPopover?: React.ReactNode
  activeFilters?: ActiveFilterItem[]
  onClearAllFilters?: () => void
  children?: React.ReactNode
  className?: string
}

/**
 * Unified, reusable search control bar matching the Dashboard reference design.
 * Encloses the search icon, optional filter chip, borderless input,
 * custom child dropdowns/switchers,
 * interactive filter popover, and clearly visible active filter badges.
 */
export function SearchControlBar({
  searchQuery,
  onSearchChange,
  placeholder = "Search...",
  chip,
  showFiltersButton = false,
  onFiltersClick,
  onToggleFilter,
  activeFilterCount = 0,
  isFilterOpen = false,
  filterPopover,
  activeFilters = [],
  onClearAllFilters,
  children,
  className = ""
}: SearchControlBarProps) {
  const handleFilterToggle = onToggleFilter || onFiltersClick
  const hasActiveFilters = activeFilters.length > 0

  return (
    <div
      className={`bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2 relative transition-all ${className}`}
    >
      {/* Top Main Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 w-full">
        {/* Left Search Input Section */}
        <div className="flex flex-1 items-center space-x-2 w-full px-2">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />

          {chip && (
            <div className="inline-flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-2 py-0.5 rounded-md text-xs shrink-0 font-medium">
              <span className="text-slate-500 dark:text-slate-400">{chip.label}</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{chip.value}</span>
              <button
                type="button"
                onClick={chip.onRemove}
                className="hover:bg-slate-200 dark:hover:bg-slate-700 rounded p-0.5 ml-1 transition-colors cursor-pointer"
                title="Remove filter"
              >
                <X className="h-3 w-3 text-slate-500 dark:text-slate-400" />
              </button>
            </div>
          )}

          <input
            type="text"
            placeholder={placeholder}
            className="flex-1 text-xs bg-transparent border-none focus:outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Right Controls & Utility Buttons */}
        <div className="flex items-center space-x-2 shrink-0 w-full md:w-auto justify-end px-1">
          {children}

          {/* Filters Button & Popover Wrapper */}
          {showFiltersButton && (
            <div className="relative">
              <Button
                type="button"
                variant={activeFilterCount > 0 || isFilterOpen ? "default" : "outline"}
                size="sm"
                onClick={handleFilterToggle}
                className={`text-xs space-x-1.5 h-8 cursor-pointer transition-all ${
                  activeFilterCount > 0 || isFilterOpen
                    ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/60 font-bold hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:border-blue-300 shadow-2xs"
                    : "text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium"
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </Button>

              {/* Anchored Popover Container */}
              {filterPopover}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Clearly Understandable Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 w-full px-2 animate-in fade-in duration-150">
          <span className="text-[11px] font-semibold text-slate-400 mr-1 shrink-0">
            Active filters:
          </span>
          {activeFilters.map((af) => (
            <span
              key={af.id}
              className="inline-flex items-center space-x-1 bg-blue-50/90 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-900/60 text-blue-800 dark:text-blue-300 px-2.5 py-0.5 rounded-lg text-xs font-medium shadow-2xs"
            >
              <span className="text-blue-500 dark:text-blue-400 font-normal">{af.label}:</span>
              <span className="font-bold text-blue-900 dark:text-blue-200">{af.value}</span>
              <button
                type="button"
                onClick={af.onRemove}
                className="hover:bg-blue-200/70 dark:hover:bg-blue-900/50 rounded-full p-0.5 ml-1 transition-colors cursor-pointer text-blue-600 dark:text-blue-400"
                title={`Remove ${af.label} filter`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}

          {onClearAllFilters && (
            <button
              type="button"
              onClick={onClearAllFilters}
              className="text-xs text-slate-400 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors ml-2 font-semibold cursor-pointer underline underline-offset-2"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  )
}
