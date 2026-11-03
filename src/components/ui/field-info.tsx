"use client"

import React, { useState, useRef, useEffect } from "react"
import { HelpCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

export interface FieldInfoProps {
  content: string
  title?: string
  className?: string
  icon?: "help" | "info"
  side?: "top" | "bottom" | "right" | "left"
  align?: "start" | "center" | "end"
}

export function FieldInfo({
  content,
  title,
  className,
  icon = "help",
  side = "top",
  align = "start"
}: FieldInfoProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("keydown", handleKeyDown)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen])

  const Icon = icon === "info" ? Info : HelpCircle

  return (
    <span
      ref={containerRef}
      className={cn("relative inline-flex items-center align-middle group/fieldinfo select-none ml-1", className)}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <span
        role="button"
        tabIndex={0}
        aria-label={title || content}
        title={content}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsOpen(prev => !prev)
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            e.stopPropagation()
            setIsOpen(prev => !prev)
          }
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        className="p-0.5 rounded-full text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-help focus:outline-none focus:ring-1 focus:ring-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800 inline-flex items-center justify-center"
      >
        <Icon className="h-3 w-3 stroke-[2.2]" />
      </span>

      {isOpen && (
        <span
          role="tooltip"
          className={cn(
            "absolute z-[100] w-64 max-w-xs px-2.5 py-2 text-[11px] leading-relaxed font-normal normal-case tracking-normal rounded-lg shadow-xl",
            "bg-slate-900 text-slate-100 dark:bg-slate-800 dark:text-slate-100 border border-slate-700/80 pointer-events-none animate-in fade-in zoom-in-95 duration-100",
            side === "top" && "bottom-full mb-1.5",
            side === "bottom" && "top-full mt-1.5",
            side === "right" && "left-full ml-1.5 top-1/2 -translate-y-1/2",
            side === "left" && "right-full mr-1.5 top-1/2 -translate-y-1/2",
            (side === "top" || side === "bottom") && align === "center" && "left-1/2 -translate-x-1/2",
            (side === "top" || side === "bottom") && align === "start" && "left-0",
            (side === "top" || side === "bottom") && align === "end" && "right-0"
          )}
        >
          {title && (
            <span className="block font-semibold text-white dark:text-slate-100 mb-0.5 text-[11px]">
              {title}
            </span>
          )}
          <span className="block text-slate-300 dark:text-slate-300 font-normal whitespace-normal">
            {content}
          </span>
        </span>
      )}
    </span>
  )
}
