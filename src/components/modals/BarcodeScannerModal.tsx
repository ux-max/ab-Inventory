"use client"

import React, { useState, useRef, useEffect, useMemo } from "react"
import { useApp } from "@/context/AppContext"
import { Item } from "@/types/inventory"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScanLine, Barcode, Plus, Minus, Trash2, X, CheckCircle2, AlertCircle, ShoppingBag } from "lucide-react"
import { cn } from "@/lib/utils"

interface ScannedProductEntry {
  item: Item
  qty: number
}

interface BarcodeScannerModalProps {
  isOpen: boolean
  onClose: () => void
  onAddProducts: (products: Array<{ item: Item; qty: number }>) => void
  rateType?: "purchase" | "sale"
  godownId?: string
}

export function BarcodeScannerModal({
  isOpen,
  onClose,
  onAddProducts,
  rateType = "purchase",
  godownId
}: BarcodeScannerModalProps) {
  const { items } = useApp()
  const [barcodeInput, setBarcodeInput] = useState("")
  const [stagedProducts, setStagedProducts] = useState<ScannedProductEntry[]>([])
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input automatically whenever modal opens or after a scan
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 80)
    } else {
      setBarcodeInput("")
      setStagedProducts([])
      setFeedback(null)
    }
  }, [isOpen])

  // Handle barcode / item code submission
  const handleProcessCode = (codeToProcess?: string) => {
    const raw = (codeToProcess !== undefined ? codeToProcess : barcodeInput).trim()
    if (!raw) return

    const normalized = raw.toLowerCase()

    // Priority 1: Exact match on barcode
    let matched = items.find(it => it.barcode && it.barcode.trim().toLowerCase() === normalized)

    // Priority 2: Exact match on itemCode
    if (!matched) {
      matched = items.find(it => it.itemCode && it.itemCode.trim().toLowerCase() === normalized)
    }

    // Priority 3: Exact match on code / SKU
    if (!matched) {
      matched = items.find(it => it.code && it.code.trim().toLowerCase() === normalized)
    }

    // Priority 4: Exact match on item name
    if (!matched) {
      matched = items.find(it => it.name && it.name.trim().toLowerCase() === normalized)
    }

    // Priority 5: Partial match on barcode / code / itemCode
    if (!matched) {
      matched = items.find(it => 
        (it.barcode && it.barcode.toLowerCase().includes(normalized)) ||
        (it.itemCode && it.itemCode.toLowerCase().includes(normalized)) ||
        (it.code && it.code.toLowerCase().includes(normalized))
      )
    }

    if (!matched) {
      setFeedback({
        message: `No product found for code/barcode "${raw}"`,
        type: "error"
      })
      setBarcodeInput("")
      setTimeout(() => setFeedback(null), 3000)
      return
    }

    // Add or increment item in staged list
    const foundItem = matched
    setStagedProducts(prev => {
      const idx = prev.findIndex(p => p.item.id === foundItem.id)
      if (idx >= 0) {
        // Increment quantity
        const updated = [...prev]
        updated[idx] = {
          ...updated[idx],
          qty: updated[idx].qty + 1
        }
        return updated
      } else {
        // Add new to top of staged list
        return [{ item: foundItem, qty: 1 }, ...prev]
      }
    })

    setFeedback({
      message: `Added "${foundItem.name}" (${foundItem.itemCode || foundItem.barcode || foundItem.code || "SKU"})`,
      type: "success"
    })
    setBarcodeInput("")
    setTimeout(() => setFeedback(null), 3000)

    // Keep focus in input for continuous scanning
    inputRef.current?.focus()
  }

  // Quantity updates
  const handleUpdateQty = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(itemId)
      return
    }
    setStagedProducts(prev => 
      prev.map(p => p.item.id === itemId ? { ...p, qty: newQty } : p)
    )
  }

  const handleRemoveItem = (itemId: string) => {
    setStagedProducts(prev => prev.filter(p => p.item.id !== itemId))
  }

  const handleConfirmAdd = () => {
    if (stagedProducts.length === 0) return
    onAddProducts(stagedProducts)
    onClose()
  }

  const totalItemsCount = stagedProducts.length
  const totalUnitsCount = stagedProducts.reduce((acc, p) => acc + p.qty, 0)
  const totalEstimatedAmount = stagedProducts.reduce((acc, p) => {
    const rate = rateType === "purchase" ? (p.item.purchasePrice || 0) : (p.item.salePrice || 0)
    return acc + rate * p.qty
  }, 0)

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-[130] bg-slate-900/50 backdrop-blur-xs flex justify-center items-start pt-6 sm:pt-12 px-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div 
        className="relative z-[131] w-full max-w-3xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200/90 dark:border-slate-800 flex flex-col max-h-[85vh] animate-in slide-in-from-top-6 duration-200 overflow-hidden text-slate-900 dark:text-slate-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800/80">
              <ScanLine className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Barcode Scanner & Item Code Entry
                </h2>
                <Badge variant="blue" className="text-[10px] font-semibold py-0 h-4">
                  {rateType === "purchase" ? "Purchase Rates" : "Sales Rates"}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Scan with handheld scanner gun or enter item code / barcode manually
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scan Bar / Input Area */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30 shrink-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1 flex items-center">
              <div className="absolute left-3 text-slate-400 pointer-events-none">
                <Barcode className="h-4 w-4" />
              </div>
              <input
                ref={inputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleProcessCode()
                  }
                }}
                placeholder="Scan barcode with scanner gun, or type item code / SKU and press Enter..."
                className="w-full h-10 pl-9 pr-3 text-xs bg-white dark:bg-slate-900 border border-blue-400 dark:border-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 font-mono shadow-2xs"
              />
            </div>
            <Button
              type="button"
              onClick={() => handleProcessCode()}
              className="h-10 px-4 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add to List</span>
            </Button>
          </div>

          {/* Feedback notification banner */}
          {feedback && (
            <div className={cn(
              "mt-3 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 animate-in fade-in duration-150",
              feedback.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
                : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60"
            )}>
              {feedback.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}
        </div>

        {/* Staged Items Table / List */}
        <div className="flex-1 overflow-y-auto min-h-[240px] max-h-[420px] bg-white dark:bg-slate-900">
          {stagedProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center px-4">
              <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3 border border-slate-200 dark:border-slate-700">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                No Products Scanned Yet
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-sm mt-1">
                Scan product barcodes with a handheld scanner or enter item codes/SKU above to stage products in this list.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              <div className="grid grid-cols-12 px-4 py-2 bg-slate-50/80 dark:bg-slate-900/60 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 backdrop-blur-xs">
                <div className="col-span-5">Product Details</div>
                <div className="col-span-2 text-right">Rate (₹)</div>
                <div className="col-span-3 text-center">Quantity</div>
                <div className="col-span-2 text-right">Total (₹)</div>
              </div>

              {stagedProducts.map(({ item, qty }) => {
                const rate = rateType === "purchase" ? (item.purchasePrice || 0) : (item.salePrice || 0)
                const lineTotal = rate * qty
                const godownStock = godownId && item.stockByGodown ? (item.stockByGodown[godownId] ?? item.currentStock ?? 0) : (item.currentStock ?? 0)

                return (
                  <div 
                    key={item.id} 
                    className="grid grid-cols-12 px-4 py-3 items-center hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors text-xs"
                  >
                    {/* Product Info */}
                    <div className="col-span-5 pr-2">
                      <div className="font-semibold text-slate-900 dark:text-white truncate">
                        {item.name}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400 flex-wrap font-mono">
                        <span>Code: <span className="text-slate-600 dark:text-slate-300">{item.itemCode || item.code}</span></span>
                        {item.barcode && (
                          <>
                            <span>•</span>
                            <span>Bar: {item.barcode}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>Stock: {godownStock} {item.unit || "PCS"}</span>
                      </div>
                    </div>

                    {/* Rate */}
                    <div className="col-span-2 text-right font-medium tabular-nums text-slate-700 dark:text-slate-300">
                      ₹{rate.toFixed(2)}
                    </div>

                    {/* Quantity Selector */}
                    <div className="col-span-3 flex items-center justify-center gap-1.5">
                      <div className="flex items-center rounded-md border border-slate-300 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.id, qty - 1)}
                          className="h-7 w-7 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={qty}
                          onChange={(e) => handleUpdateQty(item.id, Math.max(1, Number(e.target.value) || 1))}
                          className="h-7 w-12 text-center text-xs font-bold tabular-nums bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.id, qty + 1)}
                          className="h-7 w-7 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        {item.unit || "UNIT"}
                      </span>
                    </div>

                    {/* Total & Remove */}
                    <div className="col-span-2 flex items-center justify-end gap-2.5">
                      <span className="font-bold tabular-nums text-slate-900 dark:text-white">
                        ₹{lineTotal.toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Remove product"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {stagedProducts.length > 0 ? (
              <span>
                <strong className="text-slate-800 dark:text-slate-200">{totalItemsCount}</strong> item{totalItemsCount !== 1 ? "s" : ""} ({totalUnitsCount} units) • Estimated Total: <strong className="text-blue-600 dark:text-blue-400 font-bold tabular-nums">₹{totalEstimatedAmount.toFixed(2)}</strong>
              </span>
            ) : (
              <span>Scan or enter items to populate this list</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {stagedProducts.length > 0 && (
              <button
                type="button"
                onClick={() => setStagedProducts([])}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
              >
                Clear All
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <Button
              type="button"
              disabled={stagedProducts.length === 0}
              onClick={handleConfirmAdd}
              className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Product{stagedProducts.length > 1 ? "s" : ""} {stagedProducts.length > 0 ? `(${stagedProducts.length})` : ""}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
