"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface DrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  side?: "right" | "bottom"
  title?: string
  description?: string
  header?: React.ReactNode
  hideCloseButton?: boolean
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  footer?: React.ReactNode
  zIndex?: number
  isMaximized?: boolean
}

let activeDrawersCount = 0
let originalBodyOverflow = ""
let originalMainOverflow = ""

function lockDrawerScroll() {
  if (typeof document === "undefined") return
  if (activeDrawersCount === 0) {
    originalBodyOverflow = document.body.style.overflow
    const mainEl = document.querySelector("main")
    originalMainOverflow = mainEl ? mainEl.style.overflow : ""

    document.body.style.overflow = "hidden"
    if (mainEl) {
      mainEl.style.overflow = "hidden"
    }
  }
  activeDrawersCount++
}

function unlockDrawerScroll() {
  if (typeof document === "undefined") return
  activeDrawersCount = Math.max(0, activeDrawersCount - 1)
  if (activeDrawersCount === 0) {
    document.body.style.overflow = originalBodyOverflow
    const mainEl = document.querySelector("main")
    if (mainEl) {
      mainEl.style.overflow = originalMainOverflow
    }
  }
}

const Drawer: React.FC<DrawerProps> = ({
  open,
  onOpenChange,
  side = "right",
  title,
  description,
  header,
  hideCloseButton,
  children,
  className,
  style,
  footer,
  zIndex = 70,
  isMaximized = false,
}) => {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Lock background page scroll (<main> and <body>) when drawer is open
  React.useEffect(() => {
    if (!open) return
    lockDrawerScroll()
    return () => {
      unlockDrawerScroll()
    }
  }, [open])

  if (!open || !mounted) return null

  return createPortal(
    <div 
      className="fixed inset-0 overflow-hidden" 
      style={{ zIndex }}
    >
      {/* Backdrop (Closes drawer on outside click) */}
      <div 
        className={cn(
          "fixed inset-0 transition-opacity",
          zIndex > 50 || isMaximized ? "bg-slate-950/40 backdrop-blur-[1px]" : "bg-transparent"
        )}
        onClick={() => onOpenChange(false)}
      />

      {side === "right" ? (
        <div 
          className={cn(
            "fixed flex transition-all duration-300",
            isMaximized ? "inset-2 sm:inset-4 pl-0" : "top-4 bottom-4 right-4 pl-4"
          )} 
          style={{ zIndex: zIndex + 1 }}
        >
          <div 
            style={isMaximized ? undefined : style} 
            className={cn(
              "w-full h-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-2xl rounded-2xl flex flex-col overflow-hidden relative animate-in duration-300 text-slate-900 dark:text-slate-100",
              !isMaximized ? "w-[640px] max-w-[92vw] shrink-0 slide-in-from-right" : "max-w-none slide-in-from-top-2",
              className,
              isMaximized && "max-w-none w-full"
            )}
          >
            {/* Header: custom header, or default title/description header, or none */}
            {header ? (
              header
            ) : (title || description) ? (
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/80 rounded-t-2xl shrink-0 select-none">
                <div>
                  {title && <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>}
                  {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
                </div>
                {!hideCloseButton && (
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="rounded-md p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            ) : null}

            {/* Scrollable Body - min-h-0 is required for flex-1 scrolling */}
            <div
              className="flex-1 min-h-0 overflow-y-auto p-6"
              style={{
                overscrollBehavior: "contain",
                overscrollBehaviorY: "contain"
              }}
            >
              {children}
            </div>

            {/* Fixed / Static Footer */}
            {footer && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-b-2xl shrink-0 z-20 select-none">
                {footer}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div 
          className="fixed inset-x-0 bottom-0 max-h-[85vh] h-auto flex flex-col bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-2xl rounded-t-2xl animate-in slide-in-from-bottom duration-300 text-slate-900 dark:text-slate-100 overflow-hidden"
          style={{ zIndex: zIndex + 1 }}
        >
          {header ? (
            header
          ) : (
            <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80 rounded-t-xl shrink-0 select-none">
              <div className="flex items-center space-x-2">
                <div className="h-1.5 w-12 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto" />
                {title && <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 ml-2">{title}</h3>}
              </div>
              {!hideCloseButton && (
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="rounded-md p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          )}
          <div 
            className="flex-1 min-h-0 overflow-y-auto p-6"
            style={{
              overscrollBehavior: "contain",
              overscrollBehaviorY: "contain"
            }}
          >
            {children}
          </div>
          {footer && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-20 select-none">
              {footer}
            </div>
          )}
        </div>
      )}
    </div>,
    document.body
  )
}

export { Drawer }
