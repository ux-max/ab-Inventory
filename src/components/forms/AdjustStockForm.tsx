"use client"

import React, { useState, useEffect } from "react"
import { Item } from "@/types/inventory"
import { useApp } from "@/context/AppContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Check, RotateCw, X, ArrowLeft, Plus, PlusCircle, Trash2, Image as ImageIcon, GripVertical, ScanLine, Layers, AlertTriangle } from "lucide-react"
import { BulkAddLineItemsModal } from "@/components/modals/BulkAddLineItemsModal"
import { BarcodeScannerModal } from "@/components/modals/BarcodeScannerModal"
import { AddBatchModal } from "@/components/modals/AddBatchModal"
import { cn } from "@/lib/utils"
import { useSmoothTableDnD } from "@/lib/useSmoothTableDnD"

interface AdjustStockFormProps {
  item?: Item | null
  isOpen?: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface ProductAdjustmentLine {
  id: string
  itemId: string
  godownId: string
  batchNo?: string
  newQuantity: string
  quantityAdjusted: string
  changedValue: string
  adjustedValue: string
}

export function AdjustStockForm({ item: propItem, isOpen, onClose, onSuccess }: AdjustStockFormProps) {
  const { items, godowns, activeGodownId, createStockAdjustment } = useApp()

  // Form State
  const [adjustmentMode, setAdjustmentMode] = useState<"quantity" | "value">("quantity")
  const [date, setDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split("T")[0]
  })
  const [account, setAccount] = useState("Cost of Goods Sold")
  const [referenceNumber, setReferenceNumber] = useState("")

  // Single-item mode state (when propItem is provided)
  const singleItem = propItem ? (items.find(i => i.id === propItem.id) || propItem) : null
  const isBatched = Boolean(singleItem?.hasBatch)

  const [singleBatchNo, setSingleBatchNo] = useState<string>(() => {
    if (singleItem?.hasBatch && singleItem.batchDetails && singleItem.batchDetails.length > 0) {
      const withStock = singleItem.batchDetails.find(b => b.quantity > 0)
      return withStock ? withStock.batchNo : singleItem.batchDetails[0].batchNo
    }
    return ""
  })
  const [isAddBatchModalOpen, setIsAddBatchModalOpen] = useState(false)

  // Keep singleBatchNo synchronized if singleItem updates or batches load
  useEffect(() => {
    if (singleItem?.hasBatch && singleItem.batchDetails && singleItem.batchDetails.length > 0) {
      if (!singleBatchNo || !singleItem.batchDetails.some(b => b.batchNo === singleBatchNo)) {
        const withStock = singleItem.batchDetails.find(b => b.quantity > 0)
        setSingleBatchNo(withStock ? withStock.batchNo : singleItem.batchDetails[0].batchNo)
      }
    }
  }, [singleItem, singleBatchNo])

  const activeSingleBatch = isBatched && singleItem?.batchDetails
    ? (singleItem.batchDetails.find(b => b.batchNo === singleBatchNo) || singleItem.batchDetails[0])
    : null

  const singleAvailableStock = activeSingleBatch
    ? activeSingleBatch.quantity
    : (singleItem ? (singleItem.stockByGodown[activeGodownId || godowns[0]?.id || "godown-1"] ?? singleItem.currentStock) : 0)

  const singleCurrentValue = activeSingleBatch
    ? (activeSingleBatch.quantity * (activeSingleBatch.purchasePrice || singleItem?.purchasePrice || 100))
    : (singleItem ? singleItem.currentStock * (singleItem.purchasePrice || 100) : 0)

  const [singleChangedValue, setSingleChangedValue] = useState("0.00")
  const [singleAdjustedValue, setSingleAdjustedValue] = useState("")
  const [singleNewQuantity, setSingleNewQuantity] = useState("")
  const [singleQuantityAdjusted, setSingleQuantityAdjusted] = useState("")

  // Product-wise mode state (when propItem is null/undefined)
  const [lines, setLines] = useState<ProductAdjustmentLine[]>(() => {
    const firstItem = items[0]
    const defaultGodown = activeGodownId || godowns[0]?.id || "godown-1"
    let initBatch = ""
    if (firstItem?.hasBatch && firstItem.batchDetails && firstItem.batchDetails.length > 0) {
      const withStock = firstItem.batchDetails.find(b => b.quantity > 0)
      initBatch = withStock ? withStock.batchNo : firstItem.batchDetails[0].batchNo
    }
    return [
      {
        id: "line-1",
        itemId: firstItem?.id || "",
        godownId: defaultGodown,
        batchNo: initBatch,
        newQuantity: "",
        quantityAdjusted: "",
        changedValue: "0.00",
        adjustedValue: ""
      }
    ]
  })
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false)

  // Smooth Drag & drop reorder
  const { tbodyRef, activeDragIndex, handlePointerDown } = useSmoothTableDnD(lines, setLines)

  // Reason & Description
  const [reason, setReason] = useState("")
  const [description, setDescription] = useState("")

  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null)

  // Handlers for Single Item Mode
  const handleSingleQuantityAdjustedChange = (val: string) => {
    if (!singleItem) return
    setSingleQuantityAdjusted(val)
    const diff = parseFloat(val)
    if (!isNaN(diff)) {
      setSingleNewQuantity(String(Math.max(0, singleAvailableStock + diff)))
    } else {
      setSingleNewQuantity("")
    }
  }

  const handleSingleNewQuantityChange = (val: string) => {
    if (!singleItem) return
    setSingleNewQuantity(val)
    const newQty = parseFloat(val)
    if (!isNaN(newQty)) {
      const diff = newQty - singleAvailableStock
      setSingleQuantityAdjusted(diff > 0 ? `+${diff}` : String(diff))
    } else {
      setSingleQuantityAdjusted("")
    }
  }

  const handleSingleAdjustedValueChange = (val: string) => {
    setSingleAdjustedValue(val)
    const diff = parseFloat(val)
    if (!isNaN(diff)) {
      setSingleChangedValue((singleCurrentValue + diff).toFixed(2))
    } else {
      setSingleChangedValue("0.00")
    }
  }

  const handleSingleBatchSelect = (bNo: string) => {
    setSingleBatchNo(bNo)
    if (!singleItem) return
    const chosen = singleItem.batchDetails?.find(b => b.batchNo === bNo)
    const bQty = chosen ? chosen.quantity : 0
    const diff = parseFloat(singleQuantityAdjusted)
    if (!isNaN(diff)) {
      setSingleNewQuantity(String(Math.max(0, bQty + diff)))
    } else {
      setSingleNewQuantity("")
    }
  }

  // Handlers for Product-Wise Mode
  const addLine = () => {
    const defaultGodown = activeGodownId || godowns[0]?.id || "godown-1"
    // Pick first item not already in lines, or fallback to items[0]
    const usedItemIds = new Set(lines.map(l => l.itemId))
    const unusedItem = items.find(i => !usedItemIds.has(i.id)) || items[0]
    let initBatch = ""
    if (unusedItem?.hasBatch && unusedItem.batchDetails && unusedItem.batchDetails.length > 0) {
      const withStock = unusedItem.batchDetails.find(b => b.quantity > 0)
      initBatch = withStock ? withStock.batchNo : unusedItem.batchDetails[0].batchNo
    }

    setLines(prev => [
      ...prev,
      {
        id: `line-${Date.now()}-${Math.random()}`,
        itemId: unusedItem?.id || "",
        godownId: defaultGodown,
        batchNo: initBatch,
        newQuantity: "",
        quantityAdjusted: "",
        changedValue: "0.00",
        adjustedValue: ""
      }
    ])
  }

  const handleBulkAddItems = (selectedList: Array<{ item: (typeof items)[0]; qty: number }>) => {
    if (selectedList.length === 0) return
    setLines(prev => {
      const cleanPrev = prev.filter(l => l.itemId !== "")
      const defaultGodown = activeGodownId || godowns[0]?.id || "godown-1"
      const newLines = selectedList.map(({ item, qty }) => {
        let initBatch = ""
        if (item.hasBatch && item.batchDetails && item.batchDetails.length > 0) {
          const withStock = item.batchDetails.find(b => b.quantity > 0)
          initBatch = withStock ? withStock.batchNo : item.batchDetails[0].batchNo
        }
        const b = item.batchDetails?.find(x => x.batchNo === initBatch)
        const curStock = b ? b.quantity : item.currentStock
        return {
          id: `line-${Date.now()}-${Math.random()}`,
          itemId: item.id,
          godownId: defaultGodown,
          batchNo: initBatch,
          newQuantity: String(Math.max(0, curStock + (qty || 1))),
          quantityAdjusted: `+${qty || 1}`,
          changedValue: "0.00",
          adjustedValue: ""
        }
      })
      return [...cleanPrev, ...newLines]
    })
    setIsBulkModalOpen(false)
  }

  const removeLine = (id: string) => {
    if (lines.length > 1) {
      setLines(prev => prev.filter(l => l.id !== id))
    }
  }

  const updateLine = (id: string, updates: Partial<ProductAdjustmentLine>) => {
    setLines(prev => prev.map(l => {
      if (l.id !== id) return l
      return { ...l, ...updates }
    }))
  }

  const handleLineItemChange = (lineId: string, newItemId: string) => {
    const itm = items.find(i => i.id === newItemId)
    let initBatch = ""
    if (itm?.hasBatch && itm.batchDetails && itm.batchDetails.length > 0) {
      const withStock = itm.batchDetails.find(b => b.quantity > 0)
      initBatch = withStock ? withStock.batchNo : itm.batchDetails[0].batchNo
    }

    updateLine(lineId, {
      itemId: newItemId,
      batchNo: initBatch,
      newQuantity: "",
      quantityAdjusted: "",
      changedValue: "0.00",
      adjustedValue: ""
    })
  }

  const handleLineBatchChange = (lineId: string, newBatchNo: string) => {
    const line = lines.find(l => l.id === lineId)
    if (!line) return
    const itm = items.find(i => i.id === line.itemId)
    const targetBatch = itm?.batchDetails?.find(b => b.batchNo === newBatchNo)
    const curStock = targetBatch ? targetBatch.quantity : (itm?.currentStock || 0)

    const diff = parseFloat(line.quantityAdjusted)
    const newQty = !isNaN(diff) ? String(Math.max(0, curStock + diff)) : ""

    updateLine(lineId, {
      batchNo: newBatchNo,
      newQuantity: newQty
    })
  }

  const handleLineGodownChange = (lineId: string, newGodownId: string) => {
    updateLine(lineId, {
      godownId: newGodownId,
      newQuantity: "",
      quantityAdjusted: "",
      changedValue: "0.00",
      adjustedValue: ""
    })
  }

  const handleLineQtyAdjustedChange = (line: ProductAdjustmentLine, val: string) => {
    const itm = items.find(i => i.id === line.itemId)
    let curStock = 0
    if (itm?.hasBatch) {
      const b = itm.batchDetails?.find(x => x.batchNo === line.batchNo)
      curStock = b ? b.quantity : 0
    } else {
      curStock = itm ? (itm.stockByGodown[line.godownId] ?? itm.currentStock) : 0
    }
    const diff = parseFloat(val)
    const newQty = !isNaN(diff) ? String(Math.max(0, curStock + diff)) : ""
    updateLine(line.id, { quantityAdjusted: val, newQuantity: newQty })
  }

  const handleLineNewQtyChange = (line: ProductAdjustmentLine, val: string) => {
    const itm = items.find(i => i.id === line.itemId)
    let curStock = 0
    if (itm?.hasBatch) {
      const b = itm.batchDetails?.find(x => x.batchNo === line.batchNo)
      curStock = b ? b.quantity : 0
    } else {
      curStock = itm ? (itm.stockByGodown[line.godownId] ?? itm.currentStock) : 0
    }
    const newQty = parseFloat(val)
    let diffStr = ""
    if (!isNaN(newQty)) {
      const diff = newQty - curStock
      diffStr = diff > 0 ? `+${diff}` : String(diff)
    }
    updateLine(line.id, { newQuantity: val, quantityAdjusted: diffStr })
  }

  const handleLineAdjustedValueChange = (line: ProductAdjustmentLine, val: string) => {
    const itm = items.find(i => i.id === line.itemId)
    const curVal = itm ? itm.currentStock * (itm.purchasePrice || 100) : 0
    const diff = parseFloat(val)
    const chgVal = !isNaN(diff) ? (curVal + diff).toFixed(2) : "0.00"
    updateLine(line.id, { adjustedValue: val, changedValue: chgVal })
  }

  const handleLineChangedValueChange = (line: ProductAdjustmentLine, val: string) => {
    const itm = items.find(i => i.id === line.itemId)
    const curVal = itm ? itm.currentStock * (itm.purchasePrice || 100) : 0
    const newChg = parseFloat(val)
    let adjStr = ""
    if (!isNaN(newChg)) {
      const diff = newChg - curVal
      adjStr = diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2)
    }
    updateLine(line.id, { changedValue: val, adjustedValue: adjStr })
  }

  // Save Adjustment
  const handleSave = (isDraft: boolean = false) => {
    setErrorMsg(null)

    if (!reason || reason === "Select a reason") {
      setErrorMsg("Please select a reason for stock adjustment.")
      return
    }

    const fullReasonNote = description.trim()
      ? `${reason}: ${description.trim()}`
      : reason

    // Single item adjustment
    if (singleItem) {
      const godownId = activeGodownId || godowns[0]?.id || "godown-1"
      let qtyDiff = 0

      if (adjustmentMode === "quantity") {
        qtyDiff = parseFloat(singleQuantityAdjusted)
        if (isNaN(qtyDiff) || qtyDiff === 0) {
          setErrorMsg("Please enter a valid Quantity Adjusted difference (e.g. +10 or -10).")
          return
        }
      } else {
        const valDiff = parseFloat(singleAdjustedValue)
        if (isNaN(valDiff) || valDiff === 0) {
          setErrorMsg("Please enter a valid Adjusted Value (e.g. +10 or -10).")
          return
        }
        const unitRate = activeSingleBatch?.purchasePrice || singleItem.purchasePrice || 100
        qtyDiff = Math.round(valDiff / unitRate) || (valDiff > 0 ? 1 : -1)
      }

      if (isBatched) {
        if (!singleBatchNo) {
          setErrorMsg("Please select which batch stock you need to adjust.")
          return
        }
        if (activeSingleBatch && qtyDiff < 0 && (activeSingleBatch.quantity + qtyDiff < 0)) {
          setErrorMsg(`Adjustment would result in negative batch stock. Available in batch "${singleBatchNo}": ${activeSingleBatch.quantity} ${singleItem.unit}`)
          return
        }
      }

      const res = createStockAdjustment(godownId, singleItem.id, qtyDiff, fullReasonNote, isBatched ? singleBatchNo : undefined)
      if (!res.success) {
        setErrorMsg(res.message)
        return
      }

      setFeedbackSuccess(
        isDraft 
          ? `Stock adjustment draft saved for ${singleItem.name}!` 
          : `Stock adjusted successfully for ${singleItem.name}!`
      )

      setTimeout(() => {
        if (onSuccess) onSuccess()
        onClose()
      }, 700)
      return
    }

    // Product-wise adjustment
    let processedCount = 0
    for (const line of lines) {
      if (!line.itemId) continue
      const itm = items.find(i => i.id === line.itemId)
      if (!itm) continue

      let qtyDiff = 0
      if (adjustmentMode === "quantity") {
        qtyDiff = parseFloat(line.quantityAdjusted)
      } else {
        const valDiff = parseFloat(line.adjustedValue)
        const b = itm.hasBatch ? itm.batchDetails?.find(x => x.batchNo === line.batchNo) : undefined
        const unitRate = b?.purchasePrice || itm.purchasePrice || 100
        qtyDiff = Math.round(valDiff / unitRate) || (valDiff > 0 ? 1 : -1)
      }

      if (isNaN(qtyDiff) || qtyDiff === 0) {
        continue
      }

      if (itm.hasBatch) {
        if (!line.batchNo) {
          setErrorMsg(`Please select a batch for product "${itm.name}".`)
          return
        }
        const targetBatch = itm.batchDetails?.find(b => b.batchNo === line.batchNo)
        if (targetBatch && qtyDiff < 0 && (targetBatch.quantity + qtyDiff < 0)) {
          setErrorMsg(`Product "${itm.name}": cannot reduce stock by ${Math.abs(qtyDiff)}. Batch "${line.batchNo}" only has ${targetBatch.quantity} ${itm.unit} available.`)
          return
        }
      }

      const res = createStockAdjustment(line.godownId, line.itemId, qtyDiff, fullReasonNote, itm.hasBatch ? line.batchNo : undefined)
      if (!res.success) {
        setErrorMsg(`${itm.name}: ${res.message}`)
        return
      }
      processedCount++
    }

    if (processedCount === 0) {
      setErrorMsg("Please enter adjustment values for at least one product (e.g. +10, -5).")
      return
    }

    setFeedbackSuccess(
      isDraft 
        ? `Stock adjustment draft saved for ${processedCount} product(s)!` 
        : `Stock adjusted successfully for ${processedCount} product(s)!`
    )

    setTimeout(() => {
      if (onSuccess) onSuccess()
      onClose()
    }, 700)
  }

  if (isOpen !== undefined && !isOpen) return null

  // ==========================================
  // RENDER: Single Item Mode (Split View Right Panel)
  // ==========================================
  if (singleItem) {
    const singleContent = (
      <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900 overflow-y-auto select-none text-slate-800 dark:text-slate-100">
        
        {/* Header matching Reference Image */}
        <div className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-8 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white">
              Adjust Stock - {singleItem.name}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleSave(true)}
              className="h-8 px-3 text-xs font-semibold gap-1.5 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-2xs"
            >
              <Check className="h-3.5 w-3.5 text-slate-500" />
              <span>Save as Draft</span>
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => handleSave(false)}
              className="h-8 px-3.5 text-xs font-semibold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-2xs rounded-md"
            >
              <RotateCw className="h-3.5 w-3.5" />
              <span>Convert to Adjusted</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-8 px-3 text-xs font-semibold gap-1.5 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <X className="h-3.5 w-3.5 text-slate-500" />
              <span>Cancel</span>
            </Button>
          </div>
        </div>

        {/* Main Form Canvas */}
        <div className="p-8 max-w-4xl space-y-6 text-xs">
          
          {errorMsg && (
            <div className="p-3 rounded-md bg-rose-50 text-rose-800 border border-rose-200 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {feedbackSuccess && (
            <div className="p-3 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
              {feedbackSuccess}
            </div>
          )}

          {/* Mode of adjustment */}
          <div>
            <span className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
              Mode of adjustment
            </span>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800 dark:text-slate-200">
                <input
                  type="radio"
                  name="adjustmentMode"
                  value="quantity"
                  checked={adjustmentMode === "quantity"}
                  onChange={() => setAdjustmentMode("quantity")}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <span>Quantity Adjustment</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800 dark:text-slate-200">
                <input
                  type="radio"
                  name="adjustmentMode"
                  value="value"
                  checked={adjustmentMode === "value"}
                  onChange={() => setAdjustmentMode("value")}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <span>Value Adjustment</span>
              </label>
            </div>
          </div>

          {/* Date* & Account* Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-medium text-red-600 dark:text-red-400 mb-1.5">
                Date*
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-9 text-xs pr-8 text-slate-800 dark:text-slate-200"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-red-600 dark:text-red-400 mb-1.5">
                Account*
              </label>
              <Select
                value={account}
                onValueChange={(val) => setAccount(val)}
                className="w-full h-9 text-xs"
                options={[
                  { value: "Cost of Goods Sold", label: "Cost of Goods Sold" },
                  { value: "Inventory Asset", label: "Inventory Asset" },
                  { value: "Stock Written Off", label: "Stock Written Off" },
                  { value: "Damaged Goods / Spoilage", label: "Damaged Goods / Spoilage" },
                ]}
              />
            </div>
          </div>

          {/* Reference Number Row */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Reference Number
            </label>
            <Input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="h-9 text-xs max-w-md"
            />
          </div>

          <div className="border-b border-dashed border-slate-200 dark:border-slate-800 my-6" />

          {/* Value or Quantity section */}
          {adjustmentMode === "value" ? (
            <div className="space-y-4">
              {/* Batch selection when batch tracking is enabled */}
              {isBatched && (
                <div className="p-3.5 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <label className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        Select Batch to Adjust*
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAddBatchModalOpen(true)}
                      className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                      New Batch
                    </button>
                  </div>

                  {(!singleItem.batchDetails || singleItem.batchDetails.length === 0) ? (
                    <div className="p-2.5 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
                      <span>No batches found for this product. Create a batch first.</span>
                      <button
                        type="button"
                        onClick={() => setIsAddBatchModalOpen(true)}
                        className="px-2 py-1 rounded bg-amber-600 text-white font-medium text-xs hover:bg-amber-700 cursor-pointer"
                      >
                        Create Batch
                      </button>
                    </div>
                  ) : (
                    <>
                      <Select
                        value={singleBatchNo}
                        onValueChange={handleSingleBatchSelect}
                        className="w-full h-9 text-xs font-medium bg-white dark:bg-slate-900"
                        options={singleItem.batchDetails.map(b => {
                          const isExp = b.expiryDate && new Date(b.expiryDate) < new Date()
                          return {
                            value: b.batchNo,
                            label: `Batch: ${b.batchNo} • Stock: ${b.quantity} ${singleItem.unit} (Total: ${b.initialQuantity ?? b.quantity}) • Exp: ${b.expiryDate || "N/A"}${isExp ? " (EXPIRED)" : ""}`
                          }
                        })}
                      />

                      {activeSingleBatch && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                          <div className="bg-white dark:bg-slate-900 p-2 rounded border border-slate-200/80 dark:border-slate-800">
                            <span className="text-slate-400 block text-[10px]">Batch Stock</span>
                            <span className="font-bold text-slate-800 dark:text-slate-100">{activeSingleBatch.quantity} {singleItem.unit}</span>
                          </div>
                          <div className="bg-white dark:bg-slate-900 p-2 rounded border border-slate-200/80 dark:border-slate-800">
                            <span className="text-slate-400 block text-[10px]">Total Added</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-100">{activeSingleBatch.initialQuantity ?? activeSingleBatch.quantity} {singleItem.unit}</span>
                          </div>
                          <div className="bg-white dark:bg-slate-900 p-2 rounded border border-slate-200/80 dark:border-slate-800">
                            <span className="text-slate-400 block text-[10px]">Expiry Date</span>
                            <span className="font-medium text-slate-700 dark:text-slate-300">{activeSingleBatch.expiryDate || "N/A"}</span>
                          </div>
                          <div className="bg-white dark:bg-slate-900 p-2 rounded border border-slate-200/80 dark:border-slate-800">
                            <span className="text-slate-400 block text-[10px]">Batch Rate</span>
                            <span className="font-medium text-slate-700 dark:text-slate-300">₹{activeSingleBatch.purchasePrice || singleItem.purchasePrice || 0}</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              <div>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {isBatched && activeSingleBatch ? `Current Value in Batch (${activeSingleBatch.batchNo}) :` : "Current Value :"}
                </span>
                <div className="font-bold text-sm text-slate-900 dark:text-white tabular-nums mt-0.5">
                  Rs.{singleCurrentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Changed Value
                  </label>
                  <Input
                    type="text"
                    value={singleChangedValue}
                    onChange={(e) => setSingleChangedValue(e.target.value)}
                    className="h-9 text-xs font-medium tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-red-600 dark:text-red-400 mb-1.5">
                    Adjusted Value*
                  </label>
                  <Input
                    type="text"
                    placeholder="Eg. +10, -10"
                    value={singleAdjustedValue}
                    onChange={(e) => handleSingleAdjustedValueChange(e.target.value)}
                    className="h-9 text-xs font-medium tabular-nums"
                    required
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Batch selection when batch tracking is enabled */}
              {isBatched && (
                <div className="p-3.5 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <label className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        Select Batch to Adjust*
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAddBatchModalOpen(true)}
                      className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                      New Batch
                    </button>
                  </div>

                  {(!singleItem.batchDetails || singleItem.batchDetails.length === 0) ? (
                    <div className="p-2.5 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
                      <span>No batches found for this product. Create a batch first.</span>
                      <button
                        type="button"
                        onClick={() => setIsAddBatchModalOpen(true)}
                        className="px-2 py-1 rounded bg-amber-600 text-white font-medium text-xs hover:bg-amber-700 cursor-pointer"
                      >
                        Create Batch
                      </button>
                    </div>
                  ) : (
                    <>
                      <Select
                        value={singleBatchNo}
                        onValueChange={handleSingleBatchSelect}
                        className="w-full h-9 text-xs font-medium bg-white dark:bg-slate-900"
                        options={singleItem.batchDetails.map(b => {
                          const isExp = b.expiryDate && new Date(b.expiryDate) < new Date()
                          return {
                            value: b.batchNo,
                            label: `Batch: ${b.batchNo} • Stock: ${b.quantity} ${singleItem.unit} (Total: ${b.initialQuantity ?? b.quantity}) • Exp: ${b.expiryDate || "N/A"}${isExp ? " (EXPIRED)" : ""}`
                          }
                        })}
                      />

                      {activeSingleBatch && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                          <div className="bg-white dark:bg-slate-900 p-2 rounded border border-slate-200/80 dark:border-slate-800">
                            <span className="text-slate-400 block text-[10px]">Batch Stock</span>
                            <span className="font-bold text-slate-800 dark:text-slate-100">{activeSingleBatch.quantity} {singleItem.unit}</span>
                          </div>
                          <div className="bg-white dark:bg-slate-900 p-2 rounded border border-slate-200/80 dark:border-slate-800">
                            <span className="text-slate-400 block text-[10px]">Total Added</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-100">{activeSingleBatch.initialQuantity ?? activeSingleBatch.quantity} {singleItem.unit}</span>
                          </div>
                          <div className="bg-white dark:bg-slate-900 p-2 rounded border border-slate-200/80 dark:border-slate-800">
                            <span className="text-slate-400 block text-[10px]">Expiry Date</span>
                            <span className="font-medium text-slate-700 dark:text-slate-300">{activeSingleBatch.expiryDate || "N/A"}</span>
                          </div>
                          <div className="bg-white dark:bg-slate-900 p-2 rounded border border-slate-200/80 dark:border-slate-800">
                            <span className="text-slate-400 block text-[10px]">Batch Cost / Sale</span>
                            <span className="font-medium text-slate-700 dark:text-slate-300">₹{activeSingleBatch.purchasePrice || singleItem.purchasePrice || 0} / ₹{activeSingleBatch.salePrice || singleItem.salePrice || 0}</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              <div>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {isBatched && activeSingleBatch ? `Quantity available in Batch (${activeSingleBatch.batchNo}) :` : "Quantity available :"}
                </span>
                <div className="flex items-baseline gap-3 mt-0.5">
                  <div className="font-bold text-base text-slate-900 dark:text-white tabular-nums">
                    {singleAvailableStock.toFixed(2)} {singleItem.unit}
                  </div>
                  {isBatched && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      (Total Item Stock across all batches: <strong className="font-semibold text-slate-700 dark:text-slate-200">{singleItem.currentStock.toFixed(2)} {singleItem.unit}</strong>)
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    New Quantity on Hand
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g. 35"
                    value={singleNewQuantity}
                    onChange={(e) => handleSingleNewQuantityChange(e.target.value)}
                    className="h-9 text-xs font-medium tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-red-600 dark:text-red-400 mb-1.5">
                    Quantity Adjusted*
                  </label>
                  <Input
                    type="text"
                    placeholder="Eg. +10, -10"
                    value={singleQuantityAdjusted}
                    onChange={(e) => handleSingleQuantityAdjustedChange(e.target.value)}
                    className="h-9 text-xs font-medium tabular-nums"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          <div className="border-b border-dashed border-slate-200 dark:border-slate-800 my-6" />

          {/* Reason* Row */}
          <div>
            <label className="block text-xs font-medium text-red-600 dark:text-red-400 mb-1.5">
              Reason*
            </label>
            <div className="max-w-md">
              <Select
                value={reason}
                onValueChange={(val) => setReason(val)}
                placeholder="Select a reason"
                className="w-full h-9 text-xs"
                options={[
                  { value: "", label: "Select a reason" },
                  { value: "Stock on hand", label: "Stock on hand" },
                  { value: "Inventory Count Variance", label: "Inventory Count Variance" },
                  { value: "Damaged goods", label: "Damaged goods" },
                  { value: "Stock Written Off", label: "Stock Written Off" },
                  { value: "Internal Consumption", label: "Internal Consumption" },
                  { value: "Theft or Lost Inventory", label: "Theft or Lost Inventory" },
                  { value: "Other", label: "Other" },
                ]}
              />
            </div>
          </div>

          {/* Description Row */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Description
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Max. 500 characters"
              maxLength={500}
              className="w-full max-w-xl p-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
            />
          </div>

        </div>

        {/* Modal for creating a new batch if needed */}
        {singleItem && (
          <AddBatchModal
            isOpen={isAddBatchModalOpen}
            onClose={() => setIsAddBatchModalOpen(false)}
            item={singleItem}
            onSuccess={() => {
              setIsAddBatchModalOpen(false)
            }}
          />
        )}

      </div>
    )

    if (isOpen !== undefined) {
      return (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex justify-end animate-in fade-in">
          <div className="w-full max-w-4xl h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col">
            {singleContent}
          </div>
        </div>
      )
    }

    return singleContent
  }

  // ==========================================
  // RENDER: Product-Wise Mode (Opened Like AddItemForm)
  // ==========================================
  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-auto">
      
      {/* 1. Standard Zoho Form Header like AddItemForm */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            title="Back to Inventory"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Adjust Stock
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Save as Draft */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleSave(true)}
            className="h-8 px-3 text-xs font-semibold gap-1.5 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-2xs"
          >
            <Check className="h-3.5 w-3.5 text-slate-500" />
            <span>Save as Draft</span>
          </Button>

          {/* Convert to Adjusted (Primary Button in Blue) */}
          <Button
            type="button"
            size="sm"
            onClick={() => handleSave(false)}
            className="h-8 px-3.5 text-xs font-semibold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-2xs rounded-md"
          >
            <RotateCw className="h-3.5 w-3.5" />
            <span>Convert to Adjusted</span>
          </Button>

          {/* Cancel */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8 px-3 text-xs font-semibold gap-1.5 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <X className="h-3.5 w-3.5 text-slate-500" />
            <span>Cancel</span>
          </Button>
        </div>
      </div>

      {/* 2. Main Form Canvas starting cleanly from left */}
      <div className="w-full max-w-5xl px-8 py-6 space-y-6 text-xs">
        
        {errorMsg && (
          <div className="p-3 rounded-md bg-rose-50 text-rose-800 border border-rose-200 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {feedbackSuccess && (
          <div className="p-3 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
            {feedbackSuccess}
          </div>
        )}

        {/* Mode of adjustment */}
        <div>
          <span className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
            Mode of adjustment
          </span>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800 dark:text-slate-200">
              <input
                type="radio"
                name="productWiseMode"
                value="quantity"
                checked={adjustmentMode === "quantity"}
                onChange={() => setAdjustmentMode("quantity")}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <span>Quantity Adjustment</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800 dark:text-slate-200">
              <input
                type="radio"
                name="productWiseMode"
                value="value"
                checked={adjustmentMode === "value"}
                onChange={() => setAdjustmentMode("value")}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <span>Value Adjustment</span>
            </label>
          </div>
        </div>

        {/* Date* & Account* Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-medium text-red-600 dark:text-red-400 mb-1.5">
              Date*
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-9 text-xs pr-8 text-slate-800 dark:text-slate-200"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-red-600 dark:text-red-400 mb-1.5">
              Account*
            </label>
            <Select
              value={account}
              onValueChange={(val) => setAccount(val)}
              className="w-full h-9 text-xs"
              options={[
                { value: "Cost of Goods Sold", label: "Cost of Goods Sold" },
                { value: "Inventory Asset", label: "Inventory Asset" },
                { value: "Stock Written Off", label: "Stock Written Off" },
                { value: "Damaged Goods / Spoilage", label: "Damaged Goods / Spoilage" },
              ]}
            />
          </div>
        </div>

        {/* Reference Number */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Reference Number
          </label>
          <Input
            type="text"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            placeholder=""
            className="h-9 text-xs max-w-md"
          />
        </div>

        <div className="border-b border-dashed border-slate-200 dark:border-slate-800 my-6" />

        {/* SECTION: Product-Wise Adjustment Items Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Item Details (Product-Wise Adjustment)
            </span>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto bg-white dark:bg-slate-900 shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8fafc] dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                <tr className="divide-x divide-slate-200 dark:divide-slate-800">
                  <th className="w-10 py-2.5 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => setIsBarcodeModalOpen(true)}
                      className="p-1 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors cursor-pointer inline-flex items-center justify-center"
                      title="Scan Barcode / Enter Item Code"
                    >
                      <ScanLine className="h-4 w-4" />
                    </button>
                  </th>
                  <th className="py-2.5 px-3 w-[36%]">Item / Product*</th>
                  {adjustmentMode === "quantity" && (
                    <th className="py-2.5 px-3 w-[22%]">Warehouse / Godown*</th>
                  )}
                  {adjustmentMode === "quantity" ? (
                    <>
                      <th className="py-2.5 px-3 w-[14%] text-right">Available Qty</th>
                      <th className="py-2.5 px-3 w-[14%]">New Qty</th>
                      <th className="py-2.5 px-3 w-[14%] text-red-600 dark:text-red-400">Qty Adjusted*</th>
                    </>
                  ) : (
                    <>
                      <th className="py-2.5 px-3 w-[22%] text-right">Current Value</th>
                      <th className="py-2.5 px-3 w-[22%]">Changed Value</th>
                      <th className="py-2.5 px-3 w-[20%] text-red-600 dark:text-red-400">Adjusted Value*</th>
                    </>
                  )}
                  <th className="py-2.5 px-2 w-[4%] text-center"></th>
                </tr>
              </thead>
              <tbody ref={tbodyRef} className="divide-y divide-slate-200 dark:divide-slate-800">
                {lines.map((line, idx) => {
                  const itm = items.find(i => i.id === line.itemId)
                  const curStock = itm ? (itm.stockByGodown[line.godownId] ?? itm.currentStock) : 0
                  const curValue = itm ? itm.currentStock * (itm.purchasePrice || 100) : 0

                  return (
                    <tr 
                      key={line.id} 
                      className={cn(
                        "border-b border-slate-200 dark:border-slate-800 divide-x divide-slate-200 dark:divide-slate-800 transition-all duration-150 ease-out",
                        activeDragIndex === idx
                          ? "bg-blue-50/90 dark:bg-blue-950/70 shadow-md ring-2 ring-blue-500/40 z-20 scale-[1.003]"
                          : "hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
                      )}
                    >
                      {/* Drag Grip Handle */}
                      <td className="w-10 p-2 text-center align-middle">
                        <div
                          onPointerDown={(e) => handlePointerDown(e, idx)}
                          className={cn(
                            "p-1.5 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 cursor-grab active:cursor-grabbing inline-flex items-center justify-center transition-all select-none touch-none",
                            activeDragIndex === idx && "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 cursor-grabbing scale-110 shadow-xs"
                          )}
                          title="Click and drag to smoothly reorder"
                        >
                          <GripVertical className="h-4 w-4" />
                        </div>
                      </td>

                      {/* Product Selector */}
                      <td className="p-2.5 align-top">
                        <div className="flex items-start gap-2.5">
                          <div className="h-8 w-8 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden text-slate-400 mt-0.5">
                            {(itm?.images?.[0] || itm?.image) ? (
                              <img
                                src={itm.images?.[0] || itm.image}
                                alt={itm.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="h-4 w-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <Select
                              searchable
                              searchPlaceholder="Search product by name, code, barcode, SKU..."
                              value={line.itemId}
                              onValueChange={(val) => handleLineItemChange(line.id, val)}
                              size="sm"
                              className="w-full h-8 text-xs font-medium"
                              options={items.map(it => ({
                                value: it.id,
                                label: it.name,
                                description: `Code: ${it.itemCode || it.barcode || it.code} • SKU: ${it.code} • Rate: ₹${it.purchasePrice || it.salePrice} • Stock: ${it.currentStock} ${it.unit}`
                              }))}
                            />
                            {line.itemId && itm && (
                              <div className="flex flex-col gap-1.5 mt-1.5">
                                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                  <span>SKU: <span className="font-mono text-slate-600 dark:text-slate-300">{itm.code || "N/A"}</span></span>
                                  <span>•</span>
                                  <span>Godown Stock: <strong className="text-slate-700 dark:text-slate-200">{itm.stockByGodown[line.godownId] ?? itm.currentStock ?? 0} {itm.unit}</strong></span>
                                </div>

                                {itm.hasBatch && (
                                  <div className="flex items-center gap-1.5 p-1 px-2 rounded bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60">
                                    <Layers className="h-3 w-3 text-blue-600 dark:text-blue-400 shrink-0" />
                                    <span className="text-[10px] font-semibold text-blue-800 dark:text-blue-300 shrink-0">Batch:</span>
                                    <select
                                      value={line.batchNo || ""}
                                      onChange={(e) => handleLineBatchChange(line.id, e.target.value)}
                                      className="w-full text-[11px] h-6 px-1.5 py-0 rounded border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-900 font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                      <option value="">-- Select Batch to Adjust --</option>
                                      {(itm.batchDetails || []).map(b => (
                                        <option key={b.batchNo} value={b.batchNo}>
                                          {b.batchNo} (Avail: {b.quantity} {itm.unit} | Exp: {b.expiryDate || "N/A"})
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Godown Selector (in Quantity Mode) */}
                      {adjustmentMode === "quantity" && (
                        <td className="p-2.5 align-top">
                          <Select
                            value={line.godownId}
                            onValueChange={(val) => handleLineGodownChange(line.id, val)}
                            size="sm"
                            className="w-full h-8 text-xs"
                            options={godowns.map(g => ({
                              value: g.id,
                              label: g.name
                            }))}
                          />
                        </td>
                      )}

                      {/* Quantity Mode Cells */}
                      {adjustmentMode === "quantity" ? (
                        <>
                          <td className="p-2.5 align-top text-right">
                            {itm?.hasBatch ? (
                              <div>
                                <span className="font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                                  {(() => {
                                    const b = itm.batchDetails?.find(x => x.batchNo === line.batchNo)
                                    return b ? `${b.quantity.toFixed(2)} ${itm.unit}` : `--`
                                  })()}
                                </span>
                                <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                                  (Batch Stock)
                                </div>
                              </div>
                            ) : (
                              <span className="font-semibold tabular-nums text-slate-800 dark:text-slate-200 leading-8">
                                {curStock.toFixed(2)} {itm?.unit || "box"}
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 align-top">
                            <Input
                              type="number"
                              placeholder="e.g. 50"
                              value={line.newQuantity}
                              onChange={(e) => handleLineNewQtyChange(line, e.target.value)}
                              className="h-8 text-xs tabular-nums font-medium"
                            />
                          </td>
                          <td className="p-2.5 align-top">
                            <Input
                              type="text"
                              placeholder="Eg. +10, -5"
                              value={line.quantityAdjusted}
                              onChange={(e) => handleLineQtyAdjustedChange(line, e.target.value)}
                              className="h-8 text-xs tabular-nums font-semibold"
                            />
                          </td>
                        </>
                      ) : (
                        /* Value Mode Cells */
                        <>
                          <td className="p-2.5 align-top text-right">
                            <span className="font-semibold tabular-nums text-slate-800 dark:text-slate-200 leading-8">
                              ₹{curValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </td>
                          <td className="p-2.5 align-top">
                            <Input
                              type="text"
                              placeholder="0.00"
                              value={line.changedValue}
                              onChange={(e) => handleLineChangedValueChange(line, e.target.value)}
                              className="h-8 text-xs tabular-nums font-medium"
                            />
                          </td>
                          <td className="p-2.5 align-top">
                            <Input
                              type="text"
                              placeholder="Eg. +500, -200"
                              value={line.adjustedValue}
                              onChange={(e) => handleLineAdjustedValueChange(line, e.target.value)}
                              className="h-8 text-xs tabular-nums font-semibold"
                            />
                          </td>
                        </>
                      )}

                      {/* Action Cell */}
                      <td className="p-2.5 align-top text-center">
                        <button
                          type="button"
                          onClick={() => removeLine(line.id)}
                          disabled={lines.length === 1}
                          className={`p-1.5 rounded transition-colors ${
                            lines.length > 1
                              ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                              : "text-slate-200 dark:text-slate-800 cursor-not-allowed"
                          }`}
                          title="Remove item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Bottom action buttons */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={addLine}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-800 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors shadow-2xs cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Add New Line Item</span>
            </button>
            <button
              type="button"
              onClick={() => setIsBarcodeModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-800 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors shadow-2xs cursor-pointer"
            >
              <ScanLine className="h-4 w-4" />
              <span>Scan Barcode</span>
            </button>
            <button
              type="button"
              onClick={() => setIsBulkModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-800 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors shadow-2xs cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Add Items in Bulk</span>
            </button>
          </div>
        </div>

        <div className="border-b border-dashed border-slate-200 dark:border-slate-800 my-6" />

        {/* Reason* */}
        <div>
          <label className="block text-xs font-medium text-red-600 dark:text-red-400 mb-1.5">
            Reason*
          </label>
          <div className="max-w-md">
            <Select
              value={reason}
              onValueChange={(val) => setReason(val)}
              placeholder="Select a reason"
              className="w-full h-9 text-xs"
              options={[
                { value: "", label: "Select a reason" },
                { value: "Stock on hand", label: "Stock on hand" },
                { value: "Inventory Count Variance", label: "Inventory Count Variance" },
                { value: "Damaged goods", label: "Damaged goods" },
                { value: "Stock Written Off", label: "Stock Written Off" },
                { value: "Internal Consumption", label: "Internal Consumption" },
                { value: "Theft or Lost Inventory", label: "Theft or Lost Inventory" },
                { value: "Other", label: "Other" },
              ]}
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Description
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Max. 500 characters"
            maxLength={500}
            className="w-full max-w-xl p-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
          />
        </div>

      </div>

      {/* Bulk Add Items Modal */}
      <BulkAddLineItemsModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onAddItems={handleBulkAddItems}
        rateType="purchase"
      />

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isBarcodeModalOpen}
        onClose={() => setIsBarcodeModalOpen(false)}
        onAddProducts={handleBulkAddItems}
        rateType="purchase"
      />
    </div>
  )
}
