"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SelectOption {
  value: string
  label: string
  icon?: React.ReactNode
  description?: string
}

export interface SelectProps {
  value?: string
  defaultValue?: string
  onChange?: (e: { target: { value: string } }) => void
  onValueChange?: (value: string) => void
  options?: SelectOption[]
  children?: React.ReactNode
  placeholder?: string
  className?: string
  disabled?: boolean
}

export const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      value: controlledValue,
      defaultValue,
      onChange,
      onValueChange,
      options,
      children,
      placeholder = "Select an option...",
      className,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const [internalValue, setInternalValue] = React.useState(defaultValue || "")
    const [mounted, setMounted] = React.useState(false)
    const [menuStyle, setMenuStyle] = React.useState<React.CSSProperties>({})

    const containerRef = React.useRef<HTMLDivElement>(null)
    const triggerRef = React.useRef<HTMLButtonElement>(null)
    const menuRef = React.useRef<HTMLDivElement>(null)

    React.useImperativeHandle(ref, () => containerRef.current as HTMLDivElement)

    React.useEffect(() => {
      setMounted(true)
    }, [])

    const currentValue = controlledValue !== undefined ? controlledValue : internalValue

    // Parse options from explicit `options` prop OR legacy `<option>` children
    const parsedOptions: SelectOption[] = React.useMemo(() => {
      if (options && options.length > 0) return options
      const opts: SelectOption[] = []
      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child)) {
          const childElement = child as React.ReactElement<{ value?: string; children?: React.ReactNode }>
          const val = childElement.props.value !== undefined ? String(childElement.props.value) : String(childElement.props.children)
          const label = String(childElement.props.children || val)
          opts.push({ value: val, label })
        }
      })
      return opts
    }, [options, children])

    const selectedOption = parsedOptions.find((opt) => opt.value === currentValue) || parsedOptions[0]

    // Calculate fixed positioning for portal menu
    const updatePosition = React.useCallback(() => {
      if (!triggerRef.current) return
      const rect = triggerRef.current.getBoundingClientRect()

      // If trigger is completely scrolled out of the visible screen, close it
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        setIsOpen(false)
        return
      }

      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      const hasDescriptions = parsedOptions.some((o) => Boolean(o.description))
      const itemHeight = hasDescriptions ? 56 : 36
      const estimatedHeight = Math.min(320, parsedOptions.length * itemHeight + 12)
      const shouldOpenUp = spaceBelow < estimatedHeight && spaceAbove > spaceBelow

      const width = Math.max(rect.width, 160)
      let left = rect.left
      if (left + width > window.innerWidth - 8) {
        left = Math.max(8, window.innerWidth - width - 8)
      }

      setMenuStyle({
        position: "fixed",
        top: shouldOpenUp ? `${Math.max(8, rect.top - estimatedHeight - 4)}px` : `${rect.bottom + 4}px`,
        left: `${left}px`,
        width: `${width}px`,
        maxHeight: `${Math.max(120, shouldOpenUp ? spaceAbove - 16 : spaceBelow - 16)}px`,
        zIndex: 99999,
      })
    }, [parsedOptions.length])

    // Update coordinates when opening, scrolling, or resizing
    React.useEffect(() => {
      if (!isOpen) return
      updatePosition()

      const onScrollOrResize = () => {
        updatePosition()
      }

      window.addEventListener("scroll", onScrollOrResize, true)
      window.addEventListener("resize", onScrollOrResize)

      return () => {
        window.removeEventListener("scroll", onScrollOrResize, true)
        window.removeEventListener("resize", onScrollOrResize)
      }
    }, [isOpen, updatePosition])

    // Handle click outside and Escape key to close
    React.useEffect(() => {
      if (!isOpen) return

      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node
        const isClickInsideTrigger = triggerRef.current && triggerRef.current.contains(target)
        const isClickInsideMenu = menuRef.current && menuRef.current.contains(target)

        if (!isClickInsideTrigger && !isClickInsideMenu) {
          setIsOpen(false)
        }
      }

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          setIsOpen(false)
        }
      }

      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("keydown", handleKeyDown)

      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
        document.removeEventListener("keydown", handleKeyDown)
      }
    }, [isOpen])

    const handleSelect = (val: string) => {
      if (disabled) return
      if (controlledValue === undefined) {
        setInternalValue(val)
      }
      onValueChange?.(val)
      onChange?.({ target: { value: val } })
      setIsOpen(false)
    }

    const toggleOpen = () => {
      if (disabled) return
      if (!isOpen) {
        updatePosition()
      }
      setIsOpen((prev) => !prev)
    }

    return (
      <div ref={containerRef} className="relative w-full text-xs select-none">
        {/* Animated Custom Trigger Button */}
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          onClick={toggleOpen}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-800 dark:text-slate-100 shadow-2xs hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all cursor-pointer",
            isOpen && "border-blue-600 dark:border-blue-500 ring-2 ring-blue-100 dark:ring-blue-950",
            className
          )}
          {...props}
        >
          <div className="flex items-center space-x-2 truncate">
            {selectedOption?.icon}
            <span className="truncate">{selectedOption?.label || placeholder}</span>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200 ml-1",
              isOpen && "rotate-180 text-blue-600 dark:text-blue-400"
            )}
          />
        </button>

        {/* Portal-Rendered Dropdown Menu (Immune to parent overflow-hidden & z-index clipping) */}
        {mounted &&
          isOpen &&
          createPortal(
            <div
              ref={menuRef}
              style={menuStyle}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xl py-1 text-xs animate-in fade-in-0 zoom-in-95 duration-100 overflow-hidden flex flex-col"
            >
              <div className="overflow-y-auto px-1 space-y-0.5 flex-1">
                {parsedOptions.map((option) => {
                  const isSelected = option.value === currentValue
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelect(option.value)}
                      className={cn(
                        "w-full flex items-start justify-between px-3 py-2 rounded-md text-left transition-colors cursor-pointer text-xs",
                        isSelected
                          ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                      )}
                    >
                      <div className="flex flex-col flex-1 pr-2">
                        <div className="flex items-center space-x-2">
                          {option.icon}
                          <span className={cn("truncate font-medium", isSelected && "font-bold text-blue-600 dark:text-blue-400")}>
                            {option.label}
                          </span>
                        </div>
                        {option.description && (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal mt-0.5 leading-snug whitespace-normal">
                            {option.description}
                          </span>
                        )}
                      </div>
                      {isSelected && <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />}
                    </button>
                  )
                })}
              </div>
            </div>,
            document.body
          )}
      </div>
    )
  }
)
Select.displayName = "Select"
