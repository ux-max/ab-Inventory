"use client"

import React, { useState, useMemo } from "react"
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useApp } from "@/context/AppContext"
import { Item, ItemBatch } from "@/types/inventory"
import { 
  Package, 
  Search, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  X,
  Warehouse,
  Clock,
  Layers
} from "lucide-react"

interface SelectBatchModalProps {
  isOpen: boolean
  onClose: () => void
  item: Item | null
  godownId: string
  currentBatchNo?: string
  currentQty: number
  mode?: "sale" | "purchase"
  onSelectBatch: (selected: {
    batchNo: string
    manufacturingDate: string
    expiryDate: string
    allocatedQty: number
    salePrice?: number
    purchasePrice?: number
    costPrice?: number
  }) => void
}

export function SelectBatchModal({
  isOpen,
  onClose,
  item,
  godownId,
  currentBatchNo,
  currentQty,
  mode = "sale",
  onSelectBatch,
}: SelectBatchModalProps) {
  const { godowns, addBatchToItem } = useApp()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedBatchNo, setSelectedBatchNo] = useState<string>(currentBatchNo || "")
  const [allocatedQty, setAllocatedQty] = useState<number>(currentQty > 0 ? currentQty : 1)
  const [errorMsg, setErrorMsg] = useState("")

  // Quick "+ Create New Batch" mode inside modal
  const [isCreatingNewBatch, setIsCreatingNewBatch] = useState(false)
  const [newBatchNo, setNewBatchNo] = useState("")
  const [newMfgDate, setNewMfgDate] = useState(() => new Date().toISOString().split("T")[0])
  const [newExpDate, setNewExpDate] = useState(() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() + 1)
    return d.toISOString().split("T")[0]
  })
  const [newQty, setNewQty] = useState<number>(currentQty > 0 ? currentQty : 10)
  const [newPurchasePrice, setNewPurchasePrice] = useState<number | string>(item?.purchasePrice || 0)
  const [newSalePrice, setNewSalePrice] = useState<number | string>(item?.salePrice || 0)
  const [newGodownId, setNewGodownId] = useState(godownId || godowns[0]?.id || "godown-1")

  // Reset or initialize state when opening
  React.useEffect(() => {
    if (isOpen && item) {
      setErrorMsg("")
      setIsCreatingNewBatch(false)
      setNewPurchasePrice(item.purchasePrice || 0)
      setNewSalePrice(item.salePrice || 0)
      const existing = (item.batchDetails || []).find(b => b.batchNo === currentBatchNo)
      if (existing) {
        setSelectedBatchNo(existing.batchNo)
      } else if (item.batchDetails && item.batchDetails.length > 0) {
        // Default to first batch with stock > 0
        const inStockBatch = item.batchDetails.find(b => b.quantity > 0) || item.batchDetails[0]
        setSelectedBatchNo(inStockBatch.batchNo)
      } else {
        setSelectedBatchNo("")
      }
      setAllocatedQty(currentQty > 0 ? currentQty : 1)
    }
  }, [isOpen, item, currentBatchNo, currentQty])

  const batches = useMemo(() => {
    if (!item?.batchDetails) return []
    return item.batchDetails.filter(b => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase().trim()
      return b.batchNo.toLowerCase().includes(q)
    })
  }, [item?.batchDetails, searchQuery])

  if (!isOpen || !item) return null

  const selectedBatch = item.batchDetails?.find(b => b.batchNo === selectedBatchNo)
  const targetGodown = godowns.find(g => g.id === godownId)
  const godownName = targetGodown?.name || "Selected Godown"

  const getExpiryStatus = (expDateStr: string) => {
    if (!expDateStr) return { label: "No Date", color: "text-slate-500 bg-slate-100 border-slate-200" }
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const exp = new Date(expDateStr)
    exp.setHours(0, 0, 0, 0)
    const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays <= 0) {
      return { 
        label: "Expired", 
        color: "text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-950/40 dark:border-rose-900/50",
        isExpired: true,
        days: diffDays 
      }
    }
    if (diffDays <= 60) {
      return { 
        label: `Near Expiry (${diffDays}d)`, 
        color: "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/40 dark:border-amber-900/50",
        isExpired: false,
        days: diffDays 
      }
    }
    return { 
      label: "Active", 
      color: "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-900/50",
      isExpired: false,
      days: diffDays 
    }
  }

  const handleConfirm = () => {
    setErrorMsg("")
    if (!selectedBatch) {
      setErrorMsg("Please select a batch to continue.")
      return
    }

    const expStatus = getExpiryStatus(selectedBatch.expiryDate)
    if (mode !== "purchase" && expStatus.isExpired) {
      setErrorMsg(`Cannot sell from expired batch "${selectedBatch.batchNo}". Please choose a valid batch.`)
      return
    }

    if (allocatedQty <= 0) {
      setErrorMsg("Quantity must be greater than zero.")
      return
    }

    if (mode !== "purchase" && allocatedQty > selectedBatch.quantity) {
      setErrorMsg(`Allocated quantity (${allocatedQty}) exceeds batch available stock (${selectedBatch.quantity} ${item.unit}).`)
      return
    }

    onSelectBatch({
      batchNo: selectedBatch.batchNo,
      manufacturingDate: selectedBatch.manufacturingDate,
      expiryDate: selectedBatch.expiryDate,
      allocatedQty,
      salePrice: selectedBatch.salePrice,
      purchasePrice: selectedBatch.purchasePrice || selectedBatch.costPrice,
      costPrice: selectedBatch.costPrice || selectedBatch.purchasePrice
    })
    onClose()
  }

  const handleSaveAndUseNewBatch = () => {
    setErrorMsg("")
    const cleanNo = newBatchNo.trim().toUpperCase()
    if (!cleanNo) {
      setErrorMsg("Please enter a valid batch number.")
      return
    }

    if (new Date(newExpDate) <= new Date(newMfgDate)) {
      setErrorMsg("Expiry date must be after the manufacturing date.")
      return
    }

    if (newQty <= 0) {
      setErrorMsg("Starting batch quantity must be at least 1.")
      return
    }

    const parsedSale = Number(newSalePrice) > 0 ? Number(newSalePrice) : item.salePrice
    const parsedPurchase = Number(newPurchasePrice) > 0 ? Number(newPurchasePrice) : item.purchasePrice

    const newBatch: ItemBatch = {
      batchNo: cleanNo,
      manufacturingDate: newMfgDate,
      expiryDate: newExpDate,
      quantity: newQty,
      initialQuantity: newQty,
      godownId: newGodownId,
      purchasePrice: parsedPurchase,
      costPrice: parsedPurchase,
      salePrice: parsedSale,
      mrp: item.mrp
    }

    const res = addBatchToItem(item.id, newBatch)
    if (!res.success) {
      setErrorMsg(res.message)
      return
    }

    onSelectBatch({
      batchNo: cleanNo,
      manufacturingDate: newMfgDate,
      expiryDate: newExpDate,
      allocatedQty: mode === "purchase" ? newQty : Math.min(newQty, currentQty > 0 ? currentQty : 1),
      salePrice: parsedSale,
      purchasePrice: parsedPurchase,
      costPrice: parsedPurchase
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose} className="max-w-3xl p-0 overflow-hidden shadow-xl sm:rounded-xl">
      {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>{mode === "purchase" ? "Select or Create Inward Batch" : "Select Batch & Expiry"}</span>
            </DialogTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
              <strong className="text-slate-800 dark:text-slate-200 font-semibold">{item.name}</strong>
              <span>•</span>
              <span className="font-mono text-slate-500">SKU: {item.code || "N/A"}</span>
              <span>•</span>
              <span>Warehouse: <strong className="text-slate-700 dark:text-slate-300">{godownName}</strong></span>
              {mode === "purchase" && (
                <>
                  <span>•</span>
                  <span className="text-blue-600 dark:text-blue-400 font-medium">Inward Purchase</span>
                </>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-md text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Quick Create New Batch Expansion */}
          {isCreatingNewBatch ? (
            <div className="p-4 border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 rounded-lg space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5 text-blue-600" />
                  <span>Create & Allocate New Batch</span>
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCreatingNewBatch(false)}
                  className="h-6 text-xs text-slate-500 hover:text-slate-700 p-1"
                >
                  Cancel
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    Batch Number*
                  </label>
                  <Input
                    value={newBatchNo}
                    onChange={(e) => setNewBatchNo(e.target.value)}
                    placeholder="e.g. PCM-26X01"
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    Mfg Date*
                  </label>
                  <Input
                    type="date"
                    value={newMfgDate}
                    onChange={(e) => setNewMfgDate(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    Expiry Date*
                  </label>
                  <Input
                    type="date"
                    value={newExpDate}
                    onChange={(e) => setNewExpDate(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    Purchase Price (₹)*
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={newPurchasePrice}
                    onChange={(e) => setNewPurchasePrice(e.target.value)}
                    className="h-8 text-xs text-right font-medium"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    Sale Price (₹)*
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={newSalePrice}
                    onChange={(e) => setNewSalePrice(e.target.value)}
                    className="h-8 text-xs text-right font-medium"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    Starting Stock ({item.unit})*
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={newQty}
                    onChange={(e) => setNewQty(Number(e.target.value) || 0)}
                    className="h-8 text-xs text-right font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-500">
                  New batch stock will be added to warehouse and selected immediately.
                </span>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveAndUseNewBatch}
                  className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium px-3"
                >
                  Save & Apply Batch
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search batch number..."
                  className="h-8 pl-8 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setNewBatchNo(`${item.code ? item.code.trim() : "BAT"}-${String((item.batchDetails?.length || 0) + 1).padStart(2, "0")}`)
                  setIsCreatingNewBatch(true)
                }}
                className="h-8 text-xs font-medium text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100 gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create New Batch</span>
              </Button>
            </div>
          )}

          {/* Batches Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                  <TableHead className="w-10 px-3 py-2 text-center text-xs"></TableHead>
                  <TableHead className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300">BATCH NUMBER</TableHead>
                  <TableHead className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300">MFG DATE</TableHead>
                  <TableHead className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300">EXPIRY DATE</TableHead>
                  <TableHead className="px-3 py-2 text-right text-xs font-semibold text-slate-700 dark:text-slate-300">SALE PRICE</TableHead>
                  <TableHead className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300">STATUS</TableHead>
                  <TableHead className="px-3 py-2 text-right text-xs font-semibold text-slate-700 dark:text-slate-300">BATCH STOCK (REMAINING / TOTAL)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-xs text-slate-500 dark:text-slate-400">
                      <p className="font-medium text-slate-700 dark:text-slate-300 mb-1">
                        No active batches found for this product.
                      </p>
                      <p className="text-[11px] text-slate-400 mb-3">
                        Items cannot be dispatched without a valid batch lot.
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setIsCreatingNewBatch(true)}
                        className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Create Batch Now
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  batches.map((batch) => {
                    const status = getExpiryStatus(batch.expiryDate)
                    const isSelected = selectedBatchNo === batch.batchNo
                    const isOutOfStock = batch.quantity <= 0

                    return (
                      <TableRow
                        key={batch.batchNo}
                        onClick={() => {
                          if (!status.isExpired && !isOutOfStock) {
                            setSelectedBatchNo(batch.batchNo)
                          }
                        }}
                        className={`border-b border-slate-100 dark:border-slate-800/60 cursor-pointer transition-colors ${
                          isSelected 
                            ? "bg-blue-50/60 dark:bg-blue-950/40" 
                            : status.isExpired || isOutOfStock 
                            ? "opacity-55 hover:bg-slate-50/50 dark:hover:bg-slate-800/40" 
                            : "hover:bg-slate-50/80 dark:hover:bg-slate-800/60"
                        }`}
                      >
                        <TableCell className="px-3 py-2.5 text-center">
                          <input
                            type="radio"
                            name="selectedBatch"
                            checked={isSelected}
                            disabled={status.isExpired || isOutOfStock}
                            onChange={() => setSelectedBatchNo(batch.batchNo)}
                            className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-slate-300"
                          />
                        </TableCell>
                        <TableCell className="px-3 py-2.5 font-mono text-xs font-semibold text-slate-900 dark:text-white">
                          {batch.batchNo}
                        </TableCell>
                        <TableCell className="px-3 py-2.5 text-xs text-slate-600 dark:text-slate-400">
                          {batch.manufacturingDate || "—"}
                        </TableCell>
                        <TableCell className="px-3 py-2.5 text-xs font-medium text-slate-800 dark:text-slate-200">
                          {batch.expiryDate || "—"}
                        </TableCell>
                        <TableCell className="px-3 py-2.5 text-right font-mono font-medium text-xs text-slate-900 dark:text-white">
                          ₹{(batch.salePrice ?? item.salePrice ?? 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="px-3 py-2.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${status.color}`}>
                            {status.label}
                          </span>
                        </TableCell>
                        <TableCell className="px-3 py-2.5 text-right font-medium text-xs">
                          {(() => {
                            const totalQty = batch.initialQuantity !== undefined ? batch.initialQuantity : batch.quantity
                            const soldQty = Math.max(0, totalQty - batch.quantity)
                            return isOutOfStock ? (
                              <div>
                                <span className="text-rose-500 font-semibold">0 {item.unit}</span>
                                <span className="text-[10px] text-slate-400 block font-normal">
                                  Total added: {totalQty} {item.unit}
                                </span>
                              </div>
                            ) : (
                              <div>
                                <div className="font-semibold text-slate-900 dark:text-white tabular-nums">
                                  {batch.quantity} <span className="font-normal text-slate-400">/ {totalQty} {item.unit}</span>
                                </div>
                                {soldQty > 0 ? (
                                  <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium tabular-nums">
                                    {soldQty} {item.unit} sold
                                  </div>
                                ) : (
                                  <div className="text-[10px] text-slate-400 font-normal">
                                    Total added: {totalQty} {item.unit}
                                  </div>
                                )}
                              </div>
                            )
                          })()}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Allocation Quantity Control */}
          {selectedBatch && (
            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {mode === "purchase" ? "Adding Inward Stock to Batch: " : "Allocating from Batch: "}
                  <span className="font-mono text-blue-600 dark:text-blue-400">{selectedBatch.batchNo}</span>
                </span>
                <p className="text-[11px] text-slate-500">
                  Batch Rate: <strong className="text-slate-800 dark:text-slate-200 font-semibold">₹{(selectedBatch.salePrice ?? item.salePrice ?? 0).toFixed(2)}</strong> • Batch Cost: <strong className="text-slate-600 dark:text-slate-400">₹{(selectedBatch.purchasePrice ?? selectedBatch.costPrice ?? item.purchasePrice ?? 0).toFixed(2)}</strong> • Exp: <span className="font-medium text-slate-700 dark:text-slate-300">{selectedBatch.expiryDate}</span>
                </p>
                <p className="text-[11px] text-slate-500">
                  Current Available Stock: <strong className="text-slate-800 dark:text-slate-200">{selectedBatch.quantity} {item.unit}</strong> • Total Added: <strong className="text-slate-700 dark:text-slate-300 font-medium">{selectedBatch.initialQuantity ?? selectedBatch.quantity} {item.unit}</strong>
                  {mode === "purchase" && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold"> (Will increase by {allocatedQty} {item.unit})</span>
                  )}
                  {mode !== "purchase" && ((selectedBatch.initialQuantity ?? selectedBatch.quantity) - selectedBatch.quantity) > 0 && (
                    <span className="text-blue-600 dark:text-blue-400 font-semibold"> ({((selectedBatch.initialQuantity ?? selectedBatch.quantity) - selectedBatch.quantity)} {item.unit} sold)</span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {mode === "purchase" ? `Purchase Qty (${item.unit}):` : `Quantity (${item.unit}):`}
                </label>
                <Input
                  type="number"
                  min="1"
                  max={mode === "purchase" ? undefined : selectedBatch.quantity}
                  value={allocatedQty}
                  onChange={(e) => setAllocatedQty(Number(e.target.value) || 0)}
                  className="w-24 h-8 text-right text-xs font-semibold border-slate-300 dark:border-slate-700"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8 text-xs font-medium text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50"
          >
            Cancel
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleConfirm}
            disabled={!selectedBatch || (mode === "purchase" ? false : selectedBatch.quantity <= 0)}
            className="h-8 text-xs font-medium bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-xs px-4"
          >
            {mode === "purchase" ? "Confirm Inward Batch" : "Confirm Batch Allocation"}
          </Button>
        </div>
    </Dialog>
  )
}

