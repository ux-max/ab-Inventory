"use client"

import React, { useState, useMemo, useEffect } from "react"
import { createPortal } from "react-dom"
import { Search, X, ChevronRight, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { 
  GOVERNMENT_HSN_SAC_CODES, 
  HsnSacItem 
} from "@/lib/gstConstants"

interface HsnSacDirectoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (item: HsnSacItem) => void
  initialType?: "goods" | "service"
  currentCode?: string
}

export function HsnSacDirectoryModal({
  isOpen,
  onClose,
  onSelect,
  initialType = "goods",
  currentCode = ""
}: HsnSacDirectoryModalProps) {
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    setMounted(true)
  }, [])

  // Reset search when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("")
    }
  }, [isOpen])

  // Filter items matching the query, sorted with relevant types first
  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    
    let list = GOVERNMENT_HSN_SAC_CODES

    // If no search query, prioritize the current itemType (goods or service)
    if (!q) {
      list = [
        ...GOVERNMENT_HSN_SAC_CODES.filter(item => item.type === initialType),
        ...GOVERNMENT_HSN_SAC_CODES.filter(item => item.type !== initialType)
      ]
    } else {
      list = GOVERNMENT_HSN_SAC_CODES.filter(item => {
        return (
          item.code.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
        )
      })
    }

    return list
  }, [searchQuery, initialType])

  if (!isOpen || !mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Modal Dialog Box */}
      <div 
        className="relative z-[121] w-full max-w-2xl bg-[#f4f5f7] dark:bg-slate-950 rounded-xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Header - EXACT match to provided screenshot */}
        <div className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight leading-tight">
            Select HSN/SAC Code
          </h2>

          <div className="flex items-center gap-3">
            {/* Search Name Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                autoFocus
                placeholder="Search Name"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 h-9 w-52 sm:w-64 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-800 dark:text-slate-100 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Close (X) button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer rounded-md"
              aria-label="Close"
            >
              <X className="w-6 h-6 stroke-[2.2]" />
            </button>
          </div>
        </div>

        {/* Table Header: CODE & DESCRIPTION */}
        <div className="px-7 py-2.5 bg-[#f4f5f7] dark:bg-slate-950 flex items-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="w-28 sm:w-36 shrink-0">
            CODE
          </div>
          <div className="flex-1">
            DESCRIPTION
          </div>
        </div>

        {/* Body List of White Cards */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2.5 bg-[#f4f5f7] dark:bg-slate-950 scrollbar-thin">
          {filteredItems.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <HelpCircle className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No matching HSN / SAC code found
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Try searching with another keyword or code number.
              </p>
            </div>
          ) : (
            filteredItems.map(item => {
              const isSelected = currentCode.trim() === item.code.trim()

              return (
                <div
                  key={`${item.type}-${item.code}`}
                  onClick={() => onSelect(item)}
                  className={cn(
                    "group bg-white dark:bg-slate-900 rounded-lg px-6 py-4 border transition-all cursor-pointer flex items-center justify-between gap-4",
                    isSelected
                      ? "border-blue-500 ring-1 ring-blue-500/30 shadow-xs"
                      : "border-slate-200/90 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs hover:bg-slate-50/50 dark:hover:bg-slate-850"
                  )}
                >
                  {/* CODE column */}
                  <div className="w-28 sm:w-36 shrink-0 font-medium text-sm text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {item.code}
                  </div>

                  {/* DESCRIPTION column */}
                  <div className="flex-1 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 uppercase tracking-tight leading-snug">
                    {item.description}
                  </div>

                  {/* Chevron arrow on the right */}
                  <div className="shrink-0 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all">
                    <ChevronRight className="w-4 h-4 stroke-[2]" />
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
