"use client"

import React, { useState } from "react"
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { useApp } from "@/context/AppContext"
import { Item, ItemBatch } from "@/types/inventory"
import { Layers, AlertTriangle, Plus, X } from "lucide-react"

interface AddBatchModalProps {
  isOpen: boolean
  onClose: () => void
  item: Item | null
  onSuccess?: () => void
}

export function AddBatchModal({
  isOpen,
  onClose,
  item,
  onSuccess,
}: AddBatchModalProps) {
  const { godowns, addBatchToItem } = useApp()
  const [batchNo, setBatchNo] = useState("")
  const [manufacturingDate, setManufacturingDate] = useState(() => new Date().toISOString().split("T")[0])
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() + 1)
    return d.toISOString().split("T")[0]
  })
  const [quantity, setQuantity] = useState<number>(50)
  const [purchasePrice, setPurchasePrice] = useState<number | string>(item?.purchasePrice || 0)
  const [salePrice, setSalePrice] = useState<number | string>(item?.salePrice || 0)
  const [godownId, setGodownId] = useState(godowns[0]?.id || "godown-1")
  const [errorMsg, setErrorMsg] = useState("")

  React.useEffect(() => {
    if (isOpen && item) {
      setErrorMsg("")
      const count = (item.batchDetails?.length || 0) + 1
      const autoCode = `${item.code ? item.code.trim() : "BAT"}-${String(count).padStart(2, "0")}`
      setBatchNo(autoCode)
      setManufacturingDate(new Date().toISOString().split("T")[0])
      const nextY = new Date()
      nextY.setFullYear(nextY.getFullYear() + 1)
      setExpiryDate(nextY.toISOString().split("T")[0])
      setQuantity(50)
      setPurchasePrice(item.purchasePrice || 0)
      setSalePrice(item.salePrice || 0)
      setGodownId(godowns[0]?.id || "godown-1")
    }
  }, [isOpen, item, godowns])

  if (!isOpen || !item) return null

  const handleSave = () => {
    setErrorMsg("")
    const cleanNo = batchNo.trim().toUpperCase()
    if (!cleanNo) {
      setErrorMsg("Batch number is required.")
      return
    }

    if (new Date(expiryDate) <= new Date(manufacturingDate)) {
      setErrorMsg("Expiry date must be after manufacturing date.")
      return
    }

    if (quantity <= 0) {
      setErrorMsg("Stock quantity must be greater than zero.")
      return
    }

    const newBatch: ItemBatch = {
      batchNo: cleanNo,
      manufacturingDate,
      expiryDate,
      quantity,
      initialQuantity: quantity,
      godownId,
      purchasePrice: Number(purchasePrice) || item.purchasePrice || 0,
      costPrice: Number(purchasePrice) || item.purchasePrice || 0,
      salePrice: Number(salePrice) || item.salePrice || 0,
      mrp: item.mrp
    }

    const res = addBatchToItem(item.id, newBatch)
    if (!res.success) {
      setErrorMsg(res.message)
      return
    }

    if (onSuccess) onSuccess()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose} className="max-w-md p-0 overflow-hidden shadow-xl sm:rounded-xl">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>Add New Batch Stock</span>
            </DialogTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Restock or create a new lot for <strong className="text-slate-700 dark:text-slate-300">{item.name}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-md text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="p-6 space-y-4 text-xs">
          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Batch / Lot Number*
            </label>
            <Input
              value={batchNo}
              onChange={(e) => setBatchNo(e.target.value)}
              placeholder="e.g. PCM-26B01"
              className="h-8 text-xs font-mono font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Manufacturing Date*
              </label>
              <Input
                type="date"
                value={manufacturingDate}
                onChange={(e) => setManufacturingDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Expiry Date*
              </label>
              <Input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Purchase Price (₹)*
              </label>
              <Input
                type="number"
                min="0"
                step="any"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                className="h-8 text-xs text-right font-medium"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Sale Price (₹)*
              </label>
              <Input
                type="number"
                min="0"
                step="any"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                className="h-8 text-xs text-right font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Stock Quantity ({item.unit})*
              </label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value) || 0)}
                className="h-8 text-xs text-right font-medium"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Receiving Godown*
              </label>
              <Select
                value={godownId}
                onValueChange={(val) => setGodownId(val)}
                className="w-full h-8 text-xs"
                options={godowns.map(g => ({
                  value: g.id,
                  label: g.name
                }))}
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-400 italic">
            Adding this batch will immediately update warehouse inventory and log an inward stock movement entry.
          </p>
        </div>

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
            onClick={handleSave}
            className="h-8 text-xs font-medium bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-xs px-4"
          >
            Add Batch Stock
          </Button>
        </div>
    </Dialog>
  )
}

