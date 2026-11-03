"use client"

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react"
import { Trash2, X, Check, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// -------------------------------------------------------------
// 1. Reusable Hook: useTableSelection
// -------------------------------------------------------------
export interface UseTableSelectionReturn {
  selectedIds: string[]
  isSelected: (id: string) => boolean
  toggleSelect: (id: string) => void
  selectAll: () => void
  deselectAll: () => void
  clearSelection: () => void
  toggleSelectAll: () => void
  isAllSelected: boolean
  isPartiallySelected: boolean
  selectedCount: number
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>
}

export function useTableSelection(itemIds: string[]): UseTableSelectionReturn {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const itemIdsKey = itemIds.join(",")

  // Deselect any ID that is no longer in itemIds (e.g. after search filter or deletion)
  useEffect(() => {
    setSelectedIds((prev) => {
      if (prev.length === 0) return prev
      const validSet = new Set(itemIds)
      const next = prev.filter((id) => validSet.has(id))
      if (next.length === prev.length && next.every((id, idx) => id === prev[idx])) {
        return prev
      }
      return next
    })
  }, [itemIdsKey])

  const isSelected = useCallback(
    (id: string) => selectedIds.includes(id),
    [selectedIds]
  )

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }, [])

  const selectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.length === itemIds.length && prev.every((id, idx) => id === itemIds[idx])) {
        return prev
      }
      return [...itemIds]
    })
  }, [itemIdsKey])

  const deselectAll = useCallback(() => {
    setSelectedIds((prev) => (prev.length === 0 ? prev : []))
  }, [])

  const isAllSelected = useMemo(
    () => itemIds.length > 0 && itemIds.every((id) => selectedIds.includes(id)),
    [itemIdsKey, selectedIds]
  )

  const isPartiallySelected = useMemo(
    () =>
      itemIds.some((id) => selectedIds.includes(id)) &&
      !itemIds.every((id) => selectedIds.includes(id)),
    [itemIdsKey, selectedIds]
  )

  const toggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      deselectAll()
    } else {
      selectAll()
    }
  }, [isAllSelected, deselectAll, selectAll])

  return {
    selectedIds,
    isSelected,
    toggleSelect,
    selectAll,
    deselectAll,
    clearSelection: deselectAll,
    toggleSelectAll,
    isAllSelected,
    isPartiallySelected,
    selectedCount: selectedIds.length,
    setSelectedIds
  }
}

// -------------------------------------------------------------
// 2. Reusable Component: TableCheckbox
// -------------------------------------------------------------
export interface TableCheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  indeterminate?: boolean
}

export const TableCheckbox = React.forwardRef<HTMLInputElement, TableCheckboxProps>(
  ({ checked = false, indeterminate = false, className, onChange = () => {}, onClick, ...props }, forwardedRef) => {
    const localRef = useRef<HTMLInputElement>(null)
    const ref = (forwardedRef as React.RefObject<HTMLInputElement>) || localRef

    useEffect(() => {
      if (ref.current) {
        ref.current.indeterminate = indeterminate
      }
    }, [indeterminate, ref])

    return (
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        onClick={(e) => {
          e.stopPropagation()
          onClick?.(e)
        }}
        className={cn(
          "h-4 w-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-blue-600 focus:ring-blue-500 focus:ring-2 cursor-pointer transition-colors accent-blue-600",
          className
        )}
        {...props}
      />
    )
  }
)
TableCheckbox.displayName = "TableCheckbox"

// -------------------------------------------------------------
// 3. Reusable Component: TableBulkActions
// -------------------------------------------------------------
export interface TableBulkActionsProps {
  selectedCount: number
  totalCount: number
  itemLabel?: string // e.g. "workflow", "connection", "log", "template"
  onClearSelection: () => void
  onDelete: () => void
  deleteLabel?: string
  children?: React.ReactNode // Extra actions (e.g. Move, Re-run, etc.)
  className?: string
}

export function TableBulkActions({
  selectedCount,
  totalCount,
  itemLabel = "item",
  onClearSelection,
  onDelete,
  deleteLabel,
  children,
  className
}: TableBulkActionsProps) {
  if (selectedCount <= 0) return null

  const label = selectedCount === 1 ? itemLabel : `${itemLabel}s`

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 bg-blue-50/90 dark:bg-blue-950/60 border border-blue-200/90 dark:border-blue-900/60 rounded-xl shadow-2xs text-xs animate-in fade-in slide-in-from-top-2 duration-200",
        className
      )}
    >
      {/* Left info badge & deselect */}
      <div className="flex items-center space-x-3">
        <Badge
          variant="blue"
          className="font-bold text-xs px-2.5 py-0.5 bg-blue-600 text-white border-transparent"
        >
          {selectedCount} selected
        </Badge>
        <span className="text-slate-700 dark:text-slate-200 font-medium">
          {selectedCount} of {totalCount} {label} selected
        </span>
        <button
          type="button"
          onClick={onClearSelection}
          className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 underline font-medium cursor-pointer transition-colors"
        >
          Deselect
        </button>
      </div>

      {/* Right Action buttons */}
      <div className="flex items-center space-x-2">
        {children}

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onDelete}
          className="h-8 px-3 border-red-200 dark:border-red-900/60 bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-300 dark:hover:border-red-800 font-bold text-xs space-x-1.5 shadow-none cursor-pointer transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
          <span>{deleteLabel || `Delete (${selectedCount})`}</span>
        </Button>
      </div>
    </div>
  )
}
