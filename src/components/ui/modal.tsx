"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { X, Maximize2, Minimize2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  icon?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  canExpand?: boolean
  defaultExpanded?: boolean
  isExpanded?: boolean
  onToggleExpand?: (expanded: boolean) => void
  standardWidthClassName?: string
  expandedWidthClassName?: string
  className?: string
  closeOnOutsideClick?: boolean
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  icon,
  children,
  footer,
  canExpand = true,
  defaultExpanded = false,
  isExpanded: controlledExpanded,
  onToggleExpand,
  standardWidthClassName = "max-w-xl",
  expandedWidthClassName = "max-w-4xl",
  className,
  closeOnOutsideClick = true
}) => {
  const [mounted, setMounted] = React.useState(false)
  const [internalExpanded, setInternalExpanded] = React.useState(defaultExpanded)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Handle ESC key to close
  React.useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, onOpenChange])

  if (!open || !mounted) return null

  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded

  const handleToggleExpand = () => {
    if (onToggleExpand) {
      onToggleExpand(!isExpanded)
    } else {
      setInternalExpanded(!isExpanded)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Dark Blur Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={() => {
          if (closeOnOutsideClick) onOpenChange(false)
        }}
      />

      {/* Modal Dialog Card Container */}
      <div
        className={cn(
          "relative z-[121] w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 flex flex-col overflow-hidden transition-all duration-300 ease-in-out animate-in zoom-in-95 my-auto max-h-[90vh]",
          isExpanded ? expandedWidthClassName : standardWidthClassName,
          className
        )}
      >
        {/* Header (if title/description/icon exists) or Minimal Top Bar with Close/Expand buttons */}
        {title || description || icon ? (
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between gap-3 shrink-0 select-none">
            <div className="flex items-center space-x-3 min-w-0">
              {icon && (
                <div className="h-9 w-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-900/60 shadow-2xs">
                  {icon}
                </div>
              )}
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate flex items-center gap-2">
                  {title}
                </h3>
                {description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{description}</p>
                )}
              </div>
            </div>

            {/* Action Buttons: Expand / Minimize & Close */}
            <div className="flex items-center space-x-1 shrink-0">
              {canExpand && (
                <button
                  type="button"
                  onClick={handleToggleExpand}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title={isExpanded ? "Collapse to Standard Size" : "Expand to Wide View"}
                >
                  {isExpanded ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close (Esc)"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="pt-4 px-5 pb-0 flex items-center justify-end space-x-1 shrink-0 select-none">
            {canExpand && (
              <button
                type="button"
                onClick={handleToggleExpand}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
            )}
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Body Content */}
        <div
          className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 hover:scrollbar-thumb-slate-300 dark:hover:scrollbar-thumb-slate-700"
          style={{ scrollbarGutter: "stable" }}
        >
          {children}
        </div>

        {/* Sticky Footer */}
        {footer && (
          <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 flex items-center justify-end space-x-3 shrink-0 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

export default Modal
