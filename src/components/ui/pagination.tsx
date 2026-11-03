"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Select } from "@/components/ui/select"

export interface PaginationProps {
  totalCount: number
  currentPage?: number
  pageSize?: number
  pageSizeOptions?: number[]
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  className?: string
  itemLabel?: string
  showPageSize?: boolean
  showFirstLast?: boolean
  variant?: "table" | "master-list"
}

export function Pagination({
  totalCount,
  currentPage = 1,
  pageSize = 25,
  pageSizeOptions = [10, 25, 50, 100],
  onPageChange,
  onPageSizeChange,
  className,
  itemLabel = "Total Count",
  showPageSize = true,
  showFirstLast = false,
  variant = "table",
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const safePage = Math.min(Math.max(1, currentPage), totalPages)
  const startItem = totalCount === 0 ? 0 : (safePage - 1) * pageSize + 1
  const endItem = Math.min(totalCount, safePage * pageSize)

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === safePage) return
    onPageChange?.(newPage)
  }

  const handlePageSizeChange = (val: string) => {
    const size = parseInt(val, 10)
    if (!isNaN(size) && size > 0) {
      onPageSizeChange?.(size)
      // Reset to page 1 on page size change
      onPageChange?.(1)
    }
  }

  const pageSizeSelectOptions = React.useMemo(() => {
    return pageSizeOptions.map((opt) => ({
      value: String(opt),
      label: String(opt),
    }))
  }, [pageSizeOptions])

  if (variant === "master-list") {
    return (
      <div
        className={cn(
          "px-3 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between text-[11px] text-slate-500 shrink-0 select-none",
          className
        )}
      >
        <div className="flex items-center gap-1.5">
          <span>Rows:</span>
          {showPageSize ? (
            <Select
              variant="compact"
              value={String(pageSize)}
              onChange={(e) => handlePageSizeChange(e.target.value)}
              options={pageSizeSelectOptions}
              className="h-6 px-1.5 text-[11px] min-w-[50px]"
            />
          ) : (
            <span className="font-medium text-slate-700 dark:text-slate-300">{pageSize}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-600 dark:text-slate-400 font-medium">
            {startItem}-{endItem} <span className="text-slate-400">/</span> {totalCount}
          </span>
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => handlePageChange(safePage - 1)}
              disabled={safePage <= 1}
              className="h-6 w-6 inline-flex items-center justify-center rounded text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handlePageChange(safePage + 1)}
              disabled={safePage >= totalPages}
              className="h-6 w-6 inline-flex items-center justify-center rounded text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Next Page"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 text-xs text-slate-500 select-none gap-3",
        className
      )}
    >
      {/* Left: Total Item Count */}
      <div className="flex items-center gap-1.5">
        <span>{itemLabel}:</span>
        <span className="font-semibold text-slate-800 dark:text-slate-200">{totalCount}</span>
      </div>

      {/* Right: Rows Per Page & Page Navigation */}
      <div className="flex items-center gap-3 sm:gap-4 ml-auto">
        {showPageSize && (
          <div className="flex items-center gap-2">
            <span className="text-slate-500 hidden sm:inline">Rows Per Page:</span>
            <span className="text-slate-500 sm:hidden">Rows:</span>
            <Select
              variant="compact"
              value={String(pageSize)}
              onChange={(e) => handlePageSizeChange(e.target.value)}
              options={pageSizeSelectOptions}
              className="h-7 px-2 text-xs min-w-[58px]"
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-slate-600 dark:text-slate-400 font-medium tabular-nums">
            {startItem} - {endItem} <span className="text-slate-400">of</span> {totalCount}
          </span>

          <div className="flex items-center gap-0.5 ml-1">
            {showFirstLast && (
              <button
                type="button"
                onClick={() => handlePageChange(1)}
                disabled={safePage <= 1}
                className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-transparent hover:border-slate-200 dark:hover:border-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors shadow-2xs"
                title="First Page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => handlePageChange(safePage - 1)}
              disabled={safePage <= 1}
              className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-transparent hover:border-slate-200 dark:hover:border-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors shadow-2xs"
              title="Previous Page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => handlePageChange(safePage + 1)}
              disabled={safePage >= totalPages}
              className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-transparent hover:border-slate-200 dark:hover:border-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors shadow-2xs"
              title="Next Page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {showFirstLast && (
              <button
                type="button"
                onClick={() => handlePageChange(totalPages)}
                disabled={safePage >= totalPages}
                className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-transparent hover:border-slate-200 dark:hover:border-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors shadow-2xs"
                title="Last Page"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
