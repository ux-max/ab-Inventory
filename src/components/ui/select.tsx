"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { ChevronDown, Check, Search, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SelectOption {
  value: string
  label: string
  icon?: React.ReactNode
  description?: string
}

export interface SelectProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'value' | 'defaultValue'> {
  value?: string | number
  defaultValue?: string | number
  onChange?: (e: { target: { value: string } }) => void
  onValueChange?: (value: string) => void
  options?: SelectOption[]
  children?: React.ReactNode
  placeholder?: string
  className?: string
  containerClassName?: string
  disabled?: boolean
  variant?: "default" | "minimal" | "ghost" | "compact" | "outline"
  size?: "default" | "sm" | "xs"
  menuWidth?: number
  name?: string
  searchable?: boolean
  searchPlaceholder?: string
  allowCustomValue?: boolean
  onAddCustom?: (value: string) => void
  addCustomLabel?: string
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
      containerClassName,
      disabled = false,
      variant = "default",
      size = "default",
      menuWidth,
      name,
      searchable = false,
      searchPlaceholder = "Search...",
      allowCustomValue = false,
      onAddCustom,
      addCustomLabel,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const [internalValue, setInternalValue] = React.useState<string | number>(defaultValue !== undefined ? defaultValue : "")
    const [mounted, setMounted] = React.useState(false)
    const [menuStyle, setMenuStyle] = React.useState<React.CSSProperties>({})
    const [searchQuery, setSearchQuery] = React.useState("")
    const [isAddingCustom, setIsAddingCustom] = React.useState(false)
    const [customInputValue, setCustomInputValue] = React.useState("")

    const containerRef = React.useRef<HTMLDivElement>(null)
    const triggerRef = React.useRef<HTMLButtonElement>(null)
    const menuRef = React.useRef<HTMLDivElement>(null)
    const searchInputRef = React.useRef<HTMLInputElement>(null)
    const customInputRef = React.useRef<HTMLInputElement>(null)

    React.useImperativeHandle(ref, () => containerRef.current as HTMLDivElement)

    React.useEffect(() => {
      setMounted(true)
    }, [])

    // Focus search input when opened and reset query when closed
    React.useEffect(() => {
      if (isOpen && searchable) {
        const timer = setTimeout(() => {
          searchInputRef.current?.focus()
        }, 50)
        return () => clearTimeout(timer)
      } else if (!isOpen) {
        setSearchQuery("")
        setIsAddingCustom(false)
        setCustomInputValue("")
      }
    }, [isOpen, searchable])

    const currentValue = controlledValue !== undefined ? controlledValue : internalValue

    // Parse options from explicit `options` prop OR legacy `<option>` children
    const parsedOptions: SelectOption[] = React.useMemo(() => {
      if (options && options.length > 0) return options
      const opts: SelectOption[] = []
      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child)) {
          const childElement = child as React.ReactElement<{ value?: string | number; children?: React.ReactNode }>
          const val = childElement.props.value !== undefined ? String(childElement.props.value) : String(childElement.props.children)
          const label = String(childElement.props.children || val)
          opts.push({ value: val, label })
        }
      })
      return opts
    }, [options, children])

    const hasExactSearchMatch = React.useMemo(() => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.trim().toLowerCase()
      return parsedOptions.some(
        (opt) => opt.label.toLowerCase() === q || opt.value.toLowerCase() === q
      )
    }, [parsedOptions, searchQuery])

    const selectedOption = React.useMemo(() => {
      if (currentValue !== undefined && currentValue !== "") {
        const found = parsedOptions.find((opt) => String(opt.value) === String(currentValue))
        if (found) return found
        return { value: String(currentValue), label: String(currentValue) }
      }
      const emptyOpt = parsedOptions.find((opt) => opt.value === "")
      if (emptyOpt && emptyOpt.label) return emptyOpt
      return undefined
    }, [parsedOptions, currentValue])

    const filteredOptions = React.useMemo(() => {
      let result = parsedOptions
      const trimmedQuery = searchQuery.trim().toLowerCase()

      if (searchable && trimmedQuery) {
        result = parsedOptions.filter(
          (opt) =>
            opt.label.toLowerCase().includes(trimmedQuery) ||
            opt.value.toLowerCase().includes(trimmedQuery) ||
            (opt.description && opt.description.toLowerCase().includes(trimmedQuery))
        )

        if (allowCustomValue && trimmedQuery) {
          const hasExactMatch = parsedOptions.some(
            (opt) => opt.label.toLowerCase() === trimmedQuery || opt.value.toLowerCase() === trimmedQuery
          )
          if (!hasExactMatch) {
            result = [
              ...result,
              {
                value: searchQuery.trim(),
                label: `Use "${searchQuery.trim()}"`,
                description: "Custom value",
              },
            ]
          }
        }
      }

      return result
    }, [parsedOptions, searchable, searchQuery, allowCustomValue])

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
      const itemHeight = hasDescriptions ? 52 : 32
      const searchBoxHeight = searchable ? 44 : 0
      const customFooterHeight = onAddCustom ? 44 : 0
      const estimatedHeight = Math.min(340, parsedOptions.length * itemHeight + searchBoxHeight + customFooterHeight + 12)
      const shouldOpenUp = spaceBelow < estimatedHeight && spaceAbove > spaceBelow

      const minW = menuWidth || (variant === "compact" ? 80 : (variant === "minimal" || variant === "ghost") ? 140 : (hasDescriptions || searchable) ? 280 : 160)
      const width = Math.max(rect.width, minW)
      let left = rect.left
      if (left + width > window.innerWidth - 8) {
        left = Math.max(8, window.innerWidth - width - 8)
      }

      setMenuStyle({
        position: "fixed",
        top: shouldOpenUp ? `${Math.max(8, rect.top - estimatedHeight - 4)}px` : `${rect.bottom + 4}px`,
        left: `${left}px`,
        width: `${width}px`,
        maxHeight: `${Math.min(360, Math.max(160, shouldOpenUp ? spaceAbove - 16 : spaceBelow - 16))}px`,
        zIndex: 99999,
      })
    }, [parsedOptions, variant, menuWidth, searchable, onAddCustom])

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

    const handleCreateCustom = (val: string) => {
      const trimmed = val.trim()
      if (!trimmed) return
      onAddCustom?.(trimmed)
      handleSelect(trimmed)
      setIsAddingCustom(false)
      setCustomInputValue("")
      setSearchQuery("")
    }

    const toggleOpen = () => {
      if (disabled) return
      if (!isOpen) {
        updatePosition()
      }
      setIsOpen((prev) => !prev)
    }

    const isMinimalOrGhost = variant === "minimal" || variant === "ghost"
    const isCompact = variant === "compact"

    // Trigger button variant classes
    let triggerVariantClasses = ""
    if (isMinimalOrGhost) {
      triggerVariantClasses = cn(
        "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-2 py-1 font-semibold rounded-md border-0 focus:outline-none transition-colors",
        size === "xs" ? "h-6 text-xs" : size === "sm" ? "h-7 text-xs" : "h-8 text-xs",
        isOpen && "bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400"
      )
    } else if (isCompact) {
      triggerVariantClasses = cn(
        "h-7 px-2 py-0.5 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-2xs hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all",
        isOpen && "border-blue-600 dark:border-blue-500 ring-1 ring-blue-100 dark:ring-blue-950"
      )
    } else {
      triggerVariantClasses = cn(
        "flex w-full items-center justify-between rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-800 dark:text-slate-100 shadow-2xs hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all cursor-pointer",
        size === "xs" ? "h-7 text-xs px-2" : size === "sm" ? "h-8 text-xs px-2.5" : "h-9 text-xs px-3",
        isOpen && "border-blue-600 dark:border-blue-500 ring-2 ring-blue-100 dark:ring-blue-950"
      )
    }

    return (
      <div
        ref={containerRef}
        className={cn(
          "relative select-none",
          (isMinimalOrGhost || isCompact) ? "inline-block w-auto" : "w-full",
          containerClassName
        )}
      >
        {name && <input type="hidden" name={name} value={String(currentValue)} />}

        {/* Animated Custom Trigger Button */}
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          onClick={toggleOpen}
          className={cn(
            "flex items-center justify-between cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
            triggerVariantClasses,
            className
          )}
          {...props}
        >
          <div className="flex items-center space-x-1.5 truncate">
            {selectedOption?.icon}
            <span className={cn("truncate", !selectedOption && "text-slate-400 dark:text-slate-500 font-normal")}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>
          <ChevronDown
            className={cn(
              "text-slate-400 shrink-0 transition-transform duration-200 ml-1.5",
              isCompact || isMinimalOrGhost ? "h-3.5 w-3.5" : "h-4 w-4",
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
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl py-1 text-xs animate-in fade-in-0 zoom-in-95 duration-100 overflow-hidden flex flex-col z-[99999]"
            >
              {searchable && (
                <div className="p-1.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
                  <div className="relative flex items-center">
                    <Search className="absolute left-2.5 h-3.5 w-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        e.stopPropagation()
                        if (e.key === "Escape") {
                          setIsOpen(false)
                        } else if (e.key === "Enter") {
                          if (filteredOptions.length > 0) {
                            handleSelect(filteredOptions[0].value)
                          } else if (onAddCustom && searchQuery.trim()) {
                            handleCreateCustom(searchQuery.trim())
                          }
                        }
                      }}
                      placeholder={searchPlaceholder}
                      className="w-full pl-8 pr-6 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-800 dark:text-slate-100"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSearchQuery("")
                          searchInputRef.current?.focus()
                        }}
                        className="absolute right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs px-0.5 cursor-pointer"
                        title="Clear search"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="overflow-y-auto px-1 py-0.5 space-y-0.5 flex-1 max-h-64">
                {/* Quick Add Custom Button when typing in search */}
                {onAddCustom && searchQuery.trim() && !hasExactSearchMatch && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCreateCustom(searchQuery.trim())
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-left transition-colors cursor-pointer text-xs bg-blue-50/80 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 font-semibold border border-dashed border-blue-300 dark:border-blue-700 mb-1"
                  >
                    <Plus className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
                    <span className="truncate">
                      Add &quot;<span className="underline decoration-blue-400 font-bold">{searchQuery.trim()}</span>&quot; as custom {addCustomLabel ? addCustomLabel.replace(/^(\+|Add)\s*/i, "") : "option"}
                    </span>
                  </button>
                )}

                {filteredOptions.length === 0 ? (
                  !onAddCustom && (
                    <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                      No options found
                    </div>
                  )
                ) : (
                  filteredOptions.map((option) => {
                    const isSelected = String(option.value) === String(currentValue)
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleSelect(option.value)}
                        className={cn(
                          "w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-left transition-colors cursor-pointer text-xs",
                          isSelected
                            ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                        )}
                      >
                        <div className="flex flex-col flex-1 pr-2 truncate">
                          <div className="flex items-center space-x-2 truncate">
                            {option.icon}
                            <span className={cn("truncate font-medium", isSelected && "font-semibold text-blue-600 dark:text-blue-400")}>
                              {option.label}
                            </span>
                          </div>
                          {option.description && (
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal mt-0.5 leading-snug whitespace-normal">
                              {option.description}
                            </span>
                          )}
                        </div>
                        {isSelected && <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0 ml-1.5" />}
                      </button>
                    )
                  })
                )}
              </div>

              {/* Sticky Custom Value Footer */}
              {onAddCustom && (
                <div className="p-1.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 shrink-0">
                  {isAddingCustom ? (
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        ref={customInputRef}
                        type="text"
                        value={customInputValue}
                        onChange={(e) => setCustomInputValue(e.target.value)}
                        placeholder={addCustomLabel ? `Enter ${addCustomLabel.replace(/^(\+|Add)\s*/i, "").toLowerCase()}...` : "Enter custom value..."}
                        onKeyDown={(e) => {
                          e.stopPropagation()
                          if (e.key === "Enter" && customInputValue.trim()) {
                            handleCreateCustom(customInputValue.trim())
                          } else if (e.key === "Escape") {
                            setIsAddingCustom(false)
                            setCustomInputValue("")
                          }
                        }}
                        className="flex-1 min-w-0 px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-blue-500 rounded text-slate-800 dark:text-slate-100 focus:outline-none placeholder:text-slate-400"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customInputValue.trim()) handleCreateCustom(customInputValue.trim())
                        }}
                        className="px-2.5 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors shrink-0 shadow-2xs cursor-pointer"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingCustom(false)
                          setCustomInputValue("")
                        }}
                        className="px-1.5 py-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 shrink-0 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsAddingCustom(true)
                        setCustomInputValue(searchQuery ? searchQuery.trim() : "")
                        setTimeout(() => customInputRef.current?.focus(), 50)
                      }}
                      className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-md transition-colors cursor-pointer border border-transparent hover:border-blue-200 dark:hover:border-blue-900"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>{addCustomLabel || "Add custom"}</span>
                    </button>
                  )}
                </div>
              )}
            </div>,
            document.body
          )}
      </div>
    )
  }
)
Select.displayName = "Select"
