"use client"

import * as React from "react"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string
  onChange: (value: string) => void
  onClear?: () => void
  containerClassName?: string
}

/**
 * Reusable SearchInput component.
 * Uses a flex layout so the icon and input are siblings — completely preventing
 * any text overlap bugs regardless of font, padding, or theme settings.
 * Includes interactive clear button and sleek focus-within styling.
 */
export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value,
      onChange,
      onClear,
      placeholder = "Search...",
      className,
      containerClassName,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <div
        className={cn(
          "flex items-center gap-2.5 w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 shadow-2xs transition-all focus-within:ring-1 focus-within:ring-blue-600 dark:focus-within:ring-blue-500 focus-within:border-blue-600 dark:focus-within:border-blue-500",
          disabled && "opacity-50 cursor-not-allowed",
          containerClassName
        )}
      >
        <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 select-none pointer-events-none" />
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "flex-1 w-full bg-transparent border-none p-0 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-0",
            className
          )}
          {...props}
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("")
              onClear?.()
            }}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full transition-colors cursor-pointer shrink-0"
            title="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    )
  }
)

SearchInput.displayName = "SearchInput"
