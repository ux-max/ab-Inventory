"use client"

import React, { useState, useMemo } from "react"
import { useApp } from "@/context/AppContext"
import { Item } from "@/types/inventory"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchInput } from "@/components/ui/search-input"
import { Badge } from "@/components/ui/badge"
import { Check, Package, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface BulkAddLineItemsModalProps {
  isOpen: boolean
  onClose: () => void
  onAddItems: (selectedItems: Array<{ item: Item; qty: number }>) => void
  rateType?: "purchase" | "sale"
}

export function BulkAddLineItemsModal({
  isOpen,
  onClose,
  onAddItems,
  rateType = "purchase"
}: BulkAddLineItemsModalProps) {
  const { items } = useApp()
  const [searchQuery, setSearchQuery] = useState("")
  // Map of itemId -> { item, qty }
  const [selectedMap, setSelectedMap] = useState<Map<string, { item: Item; qty: number }>>(new Map())

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      item =>
        item.name.toLowerCase().includes(q) ||
        (item.code && item.code.toLowerCase().includes(q)) ||
        (item.itemCode && item.itemCode.toLowerCase().includes(q)) ||
        (item.barcode && item.barcode.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q))
    )
  }, [items, searchQuery])

  // Toggle item selection
  const handleToggleItem = (item: Item) => {
    setSelectedMap(prev => {
      const next = new Map(prev)
      if (next.has(item.id)) {
        next.delete(item.id)
      } else {
        next.set(item.id, { item, qty: 1 })
      }
      return next
    })
  }

  // Update quantity for a selected item
  const handleUpdateQty = (itemId: string, qtyStr: string) => {
    const numeric = parseFloat(qtyStr)
    const validQty = isNaN(numeric) || numeric < 0 ? 0 : numeric
    setSelectedMap(prev => {
      const next = new Map(prev)
      const current = next.get(itemId)
      if (current) {
        next.set(itemId, { ...current, qty: validQty })
      }
      return next
    })
  }

  // Confirm addition
  const handleConfirm = () => {
    const list = Array.from(selectedMap.values()).filter(entry => entry.qty > 0)
    if (list.length > 0) {
      onAddItems(list)
    }
    // Reset state and close
    setSelectedMap(new Map())
    setSearchQuery("")
    onClose()
  }

  const handleClose = () => {
    setSelectedMap(new Map())
    setSearchQuery("")
    onClose()
  }

  if (!isOpen) return null

  const selectedList = Array.from(selectedMap.values())

  return (
    <div 
      className="fixed inset-0 z-[120] bg-slate-900/50 backdrop-blur-xs flex justify-center items-start pt-6 sm:pt-10 px-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
    >
      <div 
        className="relative z-[121] w-full max-w-4xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200/90 dark:border-slate-800 flex flex-col max-h-[85vh] animate-in slide-in-from-top-6 duration-200 overflow-hidden text-slate-900 dark:text-slate-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Add Items in Bulk
            </h2>
            <Badge variant="blue" className="text-[11px] font-semibold">
              {rateType === "purchase" ? "Purchase Rates" : "Sales Rates"}
            </Badge>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: 2 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800 flex-1 overflow-hidden">
          
          {/* Left Column: Catalog Search & Item List */}
          <div className="flex flex-col h-full overflow-hidden bg-slate-50/30 dark:bg-slate-900/20">
            {/* Search Box using reusable SearchInput */}
            <div className="h-[58px] p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center shrink-0">
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                onClear={() => setSearchQuery("")}
                placeholder="Search items by name, SKU, or category..."
                className="text-xs"
                containerClassName="h-9 w-full"
              />
            </div>

            {/* Catalog Items List */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredItems.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-400 dark:text-slate-500">
                  No items found matching &quot;{searchQuery}&quot;
                </div>
              ) : (
                filteredItems.map(item => {
                  const isSelected = selectedMap.has(item.id)
                  const rate = rateType === "purchase" ? item.purchasePrice : item.salePrice
                  const isStockPositive = (item.currentStock || 0) > 0

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleToggleItem(item)}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all select-none",
                        isSelected 
                          ? "bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 shadow-2xs" 
                          : "hover:bg-slate-100/70 dark:hover:bg-slate-800/50 border border-transparent"
                      )}
                    >
                      {/* Left side: Name, SKU, Rate */}
                      <div className="min-w-0 pr-3 flex-1">
                        <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                          SKU : <span className="font-medium text-slate-700 dark:text-slate-300">{item.code || "—"}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                          {rateType === "purchase" ? "Purchase Rate" : "Sale Rate"} : <span className="font-semibold text-slate-800 dark:text-slate-200">Rs.{(rate || 0).toFixed(2)}</span>
                          {rateType === "sale" && item.enableWholesale && item.wholesalePrice ? (
                            <span className="ml-1.5 text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                              • Wholesale: Rs.{item.wholesalePrice.toFixed(2)} (MOQ {item.wholesaleMinQty || 1})
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {/* Right side: Stock on Hand & Checkbox circle */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 tracking-wider">
                            Stock on Hand
                          </div>
                          <div className={cn(
                            "text-xs font-bold tabular-nums mt-0.5",
                            isStockPositive 
                              ? "text-emerald-600 dark:text-emerald-400" 
                              : "text-red-500 dark:text-red-400"
                          )}>
                            {(item.currentStock || 0).toFixed(2)} <span className="font-normal text-[11px]">{item.unit || "box"}</span>
                          </div>
                        </div>

                        {/* Circular Check Indicator matching App Theme */}
                        <div className="pl-1 shrink-0">
                          {isSelected ? (
                            <div className="w-5 h-5 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white shadow-2xs">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-400 transition-colors" />
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Right Column: Selected Items & Quantity Inputs */}
          <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-slate-900">
            {/* Header: Selected Items (count) - identical height as search box for perfect alignment */}
            <div className="h-[58px] px-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Selected Items
                </h3>
                <Badge variant={selectedList.length > 0 ? "blue" : "secondary"} className="h-5 px-1.5 text-[10px]">
                  {selectedList.length}
                </Badge>
              </div>

              {selectedList.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMap(new Map())}
                  className="h-7 px-2 text-xs text-slate-500 hover:text-red-600 dark:hover:text-red-400 font-medium cursor-pointer"
                >
                  Clear all
                </Button>
              )}
            </div>

            {/* Selected Items List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {selectedList.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-slate-500">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-2.5">
                    <Package className="w-5 h-5 stroke-[1.5]" />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">No items selected yet</span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-[220px]">
                    Click items from the catalog on the left to add them here and specify quantities.
                  </span>
                </div>
              ) : (
                selectedList.map(({ item, qty }) => {
                  const rate = rateType === "purchase" ? item.purchasePrice : item.salePrice
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-200/70 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                    >
                      {/* Item Details */}
                      <div className="min-w-0 pr-3 flex-1">
                        <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                          SKU : <span className="font-medium text-slate-700 dark:text-slate-300">{item.code || "—"}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                          {rateType === "purchase" ? "Purchase Rate" : "Sale Rate"} : <span className="font-semibold text-slate-800 dark:text-slate-200">Rs.{(rate || 0).toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Quantity Input using reusable Input component */}
                      <div className="shrink-0 flex items-center gap-2">
                        <div className="text-right">
                          <label className="text-[10px] text-slate-400 dark:text-slate-500 block font-medium mb-0.5">
                            Qty
                          </label>
                          <Input
                            type="number"
                            min="1"
                            step="any"
                            value={qty === 0 ? "" : qty}
                            onChange={(e) => handleUpdateQty(item.id, e.target.value)}
                            className="w-20 h-8 text-center text-xs font-bold tabular-nums"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleItem(item)}
                          className="mt-3.5 p-1 text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer using reusable Button components */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 flex items-center gap-3 shrink-0">
          <Button
            type="button"
            variant="default"
            disabled={selectedList.length === 0}
            onClick={handleConfirm}
            className="h-9 px-6 text-xs font-semibold"
          >
            Add Items {selectedList.length > 0 && `(${selectedList.length})`}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="h-9 px-6 text-xs font-medium"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
