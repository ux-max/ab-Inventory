"use client"

import React, { useState, useRef } from "react"
import { Item, Godown } from "@/types/inventory"
import { useApp } from "@/context/AppContext"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { AdjustStockForm } from "@/components/forms/AdjustStockForm"
import { DetailActionsMenu } from "@/components/ui/detail-actions-menu"
import { cn } from "@/lib/utils"
import { 
  Package, 
  Edit3, 
  SlidersHorizontal, 
  MoreHorizontal, 
  X, 
  Download, 
  Trash2, 
  Plus, 
  Warehouse, 
  Info, 
  FileText, 
  History as HistoryIcon,
  CheckCircle2,
  Paperclip,
  Share2,
  Factory,
  AlertTriangle,
  TrendingDown,
  Barcode,
  Layers
} from "lucide-react"
import { BarcodeModal } from "@/components/modals/BarcodeModal"
import { AddBatchModal } from "@/components/modals/AddBatchModal"

interface ItemDetailViewProps {
  item: Item
  onClose: () => void
  onEdit?: () => void
  onDelete?: () => void
  onAdjustStock?: () => void
  onAssemble?: () => void
}

export function ItemDetailView({ item, onClose, onEdit, onDelete, onAdjustStock, onAssemble }: ItemDetailViewProps) {
  const { items, godowns, canViewCostAndProfit, salesDocs, purchaseDocs, stockMovements, deleteItem, updateItem } = useApp()
  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "history">("overview")
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false)
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false)
  const [isAddBatchModalOpen, setIsAddBatchModalOpen] = useState(false)

  // Images state & upload handlers
  const detailFileInputRef = useRef<HTMLInputElement>(null)
  const [selectedImgIndex, setSelectedImgIndex] = useState(item.primaryImageIndex ?? 0)
  const [isDetailDragging, setIsDetailDragging] = useState(false)
  const [detailImgError, setDetailImgError] = useState("")

  const itemImages: string[] = item.images || (item.image ? [item.image] : [])

  const handleDetailUpload = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    setDetailImgError("")

    const remainingSlots = 15 - itemImages.length
    if (remainingSlots <= 0) {
      setDetailImgError("Maximum limit of 15 images reached.")
      return
    }

    const filesToProcess = Array.from(fileList).slice(0, remainingSlots)
    const validFiles: File[] = []

    for (const file of filesToProcess) {
      if (!file.type.startsWith("image/")) {
        setDetailImgError("Only image files (PNG, JPG, WebP, GIF, SVG) are allowed.")
        continue
      }
      if (file.size > 5 * 1024 * 1024) {
        setDetailImgError(`"${file.name}" exceeds 5MB limit. Please upload images under 5MB.`)
        continue
      }
      validFiles.push(file)
    }

    if (validFiles.length === 0) return

    const readPromises = validFiles.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.readAsDataURL(file)
      })
    })

    Promise.all(readPromises).then(newBase64Images => {
      const updated = [...itemImages, ...newBase64Images.filter(Boolean)]
      updateItem(item.id, {
        images: updated,
        image: updated[0] || "",
        primaryImageIndex: 0
      })
      setSelectedImgIndex(updated.length - 1)
    })
  }

  const handleDeleteDetailImage = (indexToRemove: number) => {
    const updated = itemImages.filter((_, i) => i !== indexToRemove)
    const newIdx = Math.max(0, Math.min(selectedImgIndex, updated.length - 1))
    setSelectedImgIndex(newIdx)
    updateItem(item.id, {
      images: updated,
      image: updated[0] || "",
      primaryImageIndex: 0
    })
  }

  const handleDownloadImage = () => {
    const currentImg = itemImages[selectedImgIndex] || itemImages[0]
    if (!currentImg) return
    const link = document.createElement("a")
    link.href = currentImg
    link.download = `${item.code || item.name}-image.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Transactions relating to this item
  const itemInvoices = salesDocs.filter(s => s.items?.some(i => i.itemId === item.id || i.name === item.name))
  const itemBills = purchaseDocs.filter(p => p.items?.some(i => i.itemId === item.id || i.name === item.name))
  const itemMovements = stockMovements.filter(m => m.itemId === item.id || m.itemName === item.name)

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden select-none">
      
      {/* 1. Header Bar matching reference image */}
      <div className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className={`h-8 w-8 rounded-lg ${
            item.isManufactured 
              ? "bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400"
              : "bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400"
          } flex items-center justify-center`}>
            {item.isManufactured ? <Factory className="h-4 w-4" /> : <Package className="h-4 w-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                {item.name}
              </h1>
              {item.isManufactured && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  Manufacturing / BOM
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{item.code}</span>
              {(item.code || item.itemCode || item.barcode) && (
                <button
                  type="button"
                  onClick={() => setIsBarcodeModalOpen(true)}
                  className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                  title="Generate & print barcode / QR labels"
                >
                  <Barcode className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {item.isManufactured && onAssemble && (
            <Button
              size="sm"
              onClick={onAssemble}
              className="h-8 px-3 text-xs font-semibold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-2xs cursor-pointer"
            >
              <Factory className="h-3.5 w-3.5" />
              <span>Assemble</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (onAdjustStock) onAdjustStock()
              else setIsAdjustModalOpen(true)
            }}
            className="h-8 px-3 text-xs font-semibold gap-1.5 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900 bg-blue-50/50 hover:bg-blue-100/60 dark:bg-blue-950/30"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Adjust Stock</span>
          </Button>

          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="h-8 px-3 text-xs font-semibold gap-1.5 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-900 shadow-2xs cursor-pointer"
            >
              <Edit3 className="h-3.5 w-3.5 text-slate-500" />
              <span>Edit</span>
            </Button>
          )}

          <DetailActionsMenu
            onEdit={onEdit}
            onDelete={() => {
              if (onDelete) {
                onDelete()
              } else {
                deleteItem(item.id)
                onClose()
              }
            }}
            title="Delete Item"
            description={`Are you sure you want to delete "${item.name}"? This item and its records will be permanently removed.`}
            itemName={`${item.name} (${item.code})`}
          />

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-1"
            title="Close & Return to Full Table"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 2. Subtabs Navigation Bar matching reference image */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 flex items-center gap-6 text-xs font-semibold shrink-0">
        <button
          onClick={() => setActiveTab("overview")}
          className={`py-3 border-b-2 transition-colors ${
            activeTab === "overview"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          Overview
        </button>

        <button
          onClick={() => setActiveTab("transactions")}
          className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === "transactions"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <span>Transactions</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {itemInvoices.length + itemBills.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === "history"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <span>History</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {itemMovements.length}
          </span>
        </button>
      </div>

      {/* 3. Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-8 max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Sub-Column: Information Sections (matching reference image) */}
            <div className="lg:col-span-7 space-y-7">
              
              {/* Item Core Information */}
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-12 py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="col-span-5 text-slate-500 dark:text-slate-400 font-medium">Item Group Name</span>
                  <span className="col-span-7 font-semibold text-slate-900 dark:text-white">{item.category}</span>
                </div>

                <div className="grid grid-cols-12 py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="col-span-5 text-slate-500 dark:text-slate-400 font-medium">Item Type</span>
                  <span className="col-span-7 font-semibold text-slate-900 dark:text-white capitalize">
                    {item.type === "product" ? "Inventory Items" : "Service"}
                  </span>
                </div>

                <div className="grid grid-cols-12 py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="col-span-5 text-slate-500 dark:text-slate-400 font-medium">SKU</span>
                  <span className="col-span-7 font-semibold text-slate-900 dark:text-white tabular-nums flex items-center gap-1.5">
                    {item.code}
                    <button
                      type="button"
                      onClick={() => setIsBarcodeModalOpen(true)}
                      className="p-0.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors cursor-pointer"
                      title="Generate & print barcode / QR labels"
                    >
                      <Barcode className="w-3.5 h-3.5" />
                    </button>
                  </span>
                </div>

                {(item.itemCode || item.barcode) && (
                  <div className="grid grid-cols-12 py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                    <span className="col-span-5 text-slate-500 dark:text-slate-400 font-medium">Item Code / Barcode</span>
                    <span className="col-span-7 font-mono font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
                      {item.itemCode || item.barcode}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-12 py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="col-span-5 text-slate-500 dark:text-slate-400 font-medium">Unit</span>
                  <span className="col-span-7 font-semibold text-slate-900 dark:text-white lowercase">{item.unit}</span>
                </div>

                <div className="grid grid-cols-12 py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="col-span-5 text-slate-500 dark:text-slate-400 font-medium">Inventory Account</span>
                  <span className="col-span-7 font-semibold text-slate-900 dark:text-white">Finished Goods</span>
                </div>

                <div className="grid grid-cols-12 py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="col-span-5 text-slate-500 dark:text-slate-400 font-medium">Inventory Valuation Method</span>
                  <span className="col-span-7 font-semibold text-slate-900 dark:text-white">
                    {item.valuationMethod === "Weighted Average" ? "Weighted Average Cost" : (item.valuationMethod || "FIFO (First In First Out)")}
                  </span>
                </div>
              </div>

              {/* Purchase Information */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Purchase Information
                </h3>
                
                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-12 py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                    <span className="col-span-5 text-slate-500 dark:text-slate-400 font-medium">Purchase Rate</span>
                    <span className="col-span-7 font-semibold text-slate-900 dark:text-white tabular-nums">
                      {canViewCostAndProfit ? `₹${item.purchasePrice.toFixed(2)}` : <span className="text-amber-500 font-medium">*** [Protected]</span>}
                    </span>
                  </div>

                  <div className="grid grid-cols-12 py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                    <span className="col-span-5 text-slate-500 dark:text-slate-400 font-medium">Purchase Account</span>
                    <span className="col-span-7 font-semibold text-slate-900 dark:text-white">Cost of Goods Sold</span>
                  </div>

                  <div className="grid grid-cols-12 py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                    <span className="col-span-5 text-slate-500 dark:text-slate-400 font-medium">Description</span>
                    <span className="col-span-7 text-slate-700 dark:text-slate-300">
                      {item.brand ? `Brand: ${item.brand} • Authorized MSME Supply` : "Commercial sale item"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sales Information */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Sales Information
                </h3>
                
                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-12 py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                    <span className="col-span-5 text-slate-500 dark:text-slate-400 font-medium">Selling Price</span>
                    <span className="col-span-7 font-semibold text-slate-900 dark:text-white tabular-nums">
                      ₹{item.salePrice.toFixed(2)}
                    </span>
                  </div>

                  {item.enableMrp && item.mrp && (
                    <>
                      <div className="grid grid-cols-12 py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                        <span className="col-span-5 text-slate-500 dark:text-slate-400 font-medium">MRP</span>
                        <span className="col-span-7 font-semibold text-slate-900 dark:text-white tabular-nums">
                          ₹{item.mrp.toFixed(2)}
                        </span>
                      </div>
                      {item.discountOnMrp !== undefined && item.discountOnMrp > 0 && (
                        <div className="grid grid-cols-12 py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                          <span className="col-span-5 text-slate-500 dark:text-slate-400 font-medium">Disc on MRP (Sale)</span>
                          <span className="col-span-7 font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                            {item.discountOnMrpType === "amount" ? `₹${item.discountOnMrp.toFixed(2)} Off` : `${item.discountOnMrp}% Off`}
                          </span>
                        </div>
                      )}
                      {item.discountOnMrpForWholesale !== undefined && item.discountOnMrpForWholesale > 0 && (
                        <div className="grid grid-cols-12 py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                          <span className="col-span-5 text-slate-500 dark:text-slate-400 font-medium">Disc on MRP (Wholesale)</span>
                          <span className="col-span-7 font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
                            {item.discountOnMrpForWholesaleType === "amount" ? `₹${item.discountOnMrpForWholesale.toFixed(2)} Off` : `${item.discountOnMrpForWholesale}% Off`}
                          </span>
                        </div>
                      )}
                      <div className="grid grid-cols-12 py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                        <span className="col-span-5 text-slate-500 dark:text-slate-400 font-medium">Tax Assessment</span>
                        <span className="col-span-7 font-semibold text-slate-900 dark:text-white">
                          {item.calculateTaxOnMrp ? "Assessed on MRP (Sec 4A)" : "Standard (Transaction Value)"}
                        </span>
                      </div>
                    </>
                  )}

                  {item.enableWholesale && item.wholesalePrice && (
                    <>
                      <div className="grid grid-cols-12 py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                        <span className="col-span-5 text-slate-500 dark:text-slate-400 font-medium">Wholesale Rate</span>
                        <span className="col-span-7 font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
                          ₹{item.wholesalePrice.toFixed(2)} (MOQ: {item.wholesaleMinQty || 1} {item.unit})
                        </span>
                      </div>
                      {item.wholesaleDiscount !== undefined && item.wholesaleDiscount > 0 && (
                        <div className="grid grid-cols-12 py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                          <span className="col-span-5 text-slate-500 dark:text-slate-400 font-medium">Wholesale Discount</span>
                          <span className="col-span-7 font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                            {item.wholesaleDiscountType === "amount" ? `₹${item.wholesaleDiscount.toFixed(2)} Off` : `${item.wholesaleDiscount}% Off`}
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  {item.salesDiscount !== undefined && item.salesDiscount > 0 && (
                    <div className="grid grid-cols-12 py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                      <span className="col-span-5 text-slate-500 dark:text-slate-400 font-medium">Sales Discount</span>
                      <span className="col-span-7 font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {item.salesDiscountType === "amount" ? `₹${item.salesDiscount.toFixed(2)} Off` : `${item.salesDiscount}% Off`}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-12 py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                    <span className="col-span-5 text-slate-500 dark:text-slate-400 font-medium">Sales Account</span>
                    <span className="col-span-7 font-semibold text-slate-900 dark:text-white">Sales Revenue</span>
                  </div>

                  <div className="grid grid-cols-12 py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                    <span className="col-span-5 text-slate-500 dark:text-slate-400 font-medium">Description</span>
                    <span className="col-span-7 text-slate-700 dark:text-slate-300">
                      {item.name} (SKU: {item.code})
                    </span>
                  </div>
                </div>
              </div>

              {/* Multi-Godown Physical Stock Breakdown */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Warehouse className="h-3.5 w-3.5 text-blue-600" />
                  <span>Godown Distribution</span>
                </h3>

                <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 dark:bg-slate-800/60">
                        <TableHead className="px-3 py-2 text-left h-auto">Godown</TableHead>
                        <TableHead className="px-3 py-2 text-right h-auto">Available Units</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {godowns.map(g => (
                        <TableRow key={g.id}>
                          <TableCell className="px-3 py-2 font-medium text-slate-700 dark:text-slate-300">{g.name}</TableCell>
                          <TableCell className="px-3 py-2 text-right font-semibold tabular-nums text-slate-900 dark:text-white">
                            {item.stockByGodown[g.id] || 0} {item.unit}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Product Batches & Expiry (if batch tracking enabled or has batches) */}
              {(item.hasBatch || (item.batchDetails && item.batchDetails.length > 0)) && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-blue-600" />
                      <span>Batches & Shelf Life ({item.batchDetails?.length || 0})</span>
                    </h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddBatchModalOpen(true)}
                      className="h-6 text-xs text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-100 gap-1 px-2"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add Batch</span>
                    </Button>
                  </div>

                  <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-slate-800/60">
                          <TableHead className="px-3 py-2 text-left h-auto">Batch No</TableHead>
                          <TableHead className="px-3 py-2 text-left h-auto">Expiry</TableHead>
                          <TableHead className="px-3 py-2 text-right h-auto">Cost (₹)</TableHead>
                          <TableHead className="px-3 py-2 text-right h-auto">Sale (₹)</TableHead>
                          <TableHead className="px-3 py-2 text-center h-auto">Status</TableHead>
                          <TableHead className="px-3 py-2 text-right h-auto">Remaining / Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {!item.batchDetails || item.batchDetails.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-4 text-slate-500">
                              No batches configured. Click &quot;Add Batch&quot; to add stock lot.
                            </TableCell>
                          </TableRow>
                        ) : (
                          item.batchDetails.map((b) => {
                            const today = new Date()
                            today.setHours(0,0,0,0)
                            const exp = new Date(b.expiryDate)
                            exp.setHours(0,0,0,0)
                            const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                            const isExpired = diffDays <= 0
                            const isNear = diffDays <= 60 && diffDays > 0
                            const totalQty = b.initialQuantity !== undefined ? b.initialQuantity : b.quantity
                            const soldQty = Math.max(0, totalQty - b.quantity)

                            return (
                              <TableRow key={b.batchNo} className="border-b border-slate-100 dark:border-slate-800/60">
                                <TableCell className="px-3 py-2 font-mono font-medium text-slate-900 dark:text-white">
                                  {b.batchNo}
                                </TableCell>
                                <TableCell className="px-3 py-2 text-slate-600 dark:text-slate-400">
                                  {b.expiryDate || "—"}
                                </TableCell>
                                <TableCell className="px-3 py-2 text-right font-mono text-xs text-slate-600 dark:text-slate-400">
                                  ₹{(b.purchasePrice ?? b.costPrice ?? item.purchasePrice ?? 0).toFixed(2)}
                                </TableCell>
                                <TableCell className="px-3 py-2 text-right font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                                  ₹{(b.salePrice ?? item.salePrice ?? 0).toFixed(2)}
                                </TableCell>
                                <TableCell className="px-3 py-2 text-center">
                                  {b.quantity <= 0 ? (
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                      Out of Stock
                                    </span>
                                  ) : isExpired ? (
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60">
                                      Expired
                                    </span>
                                  ) : isNear ? (
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60">
                                      {diffDays}d left
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60">
                                      Active
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="px-3 py-2 text-right font-medium text-xs">
                                  <div className="font-semibold text-slate-900 dark:text-white tabular-nums">
                                    {b.quantity} <span className="font-normal text-slate-400">/ {totalQty} {item.unit}</span>
                                  </div>
                                  {soldQty > 0 ? (
                                    <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium tabular-nums">
                                      {soldQty} sold
                                    </div>
                                  ) : (
                                    <div className="text-[10px] text-slate-400 font-normal">
                                      0 sold
                                    </div>
                                  )}
                                </TableCell>
                              </TableRow>
                            )
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>

            {/* Right Sub-Column: Image card & Stock Statistics (matching reference image) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Product Image Card matching reference */}
              <div 
                onDragOver={(e) => { e.preventDefault(); setIsDetailDragging(true) }}
                onDragLeave={() => setIsDetailDragging(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setIsDetailDragging(false)
                  handleDetailUpload(e.dataTransfer.files)
                }}
                className={cn(
                  "rounded-xl border-2 border-dashed p-4 text-center relative transition-all",
                  isDetailDragging 
                    ? "border-blue-500 bg-blue-50/80 dark:bg-blue-950/50 ring-4 ring-blue-500/20 scale-[1.01]"
                    : "border-blue-200 dark:border-blue-900/60 bg-blue-50/20 dark:bg-blue-950/10"
                )}
              >
                <input 
                  type="file" 
                  ref={detailFileInputRef} 
                  accept="image/*" 
                  multiple 
                  className="hidden" 
                  onChange={(e) => {
                    handleDetailUpload(e.target.files)
                    if (e.target) e.target.value = ""
                  }} 
                />

                {itemImages.length > 0 ? (
                  <div className="relative group">
                    <div className="w-full h-44 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center p-2 shadow-2xs border border-slate-100 dark:border-slate-800 overflow-hidden">
                      <img
                        src={itemImages[selectedImgIndex] || itemImages[0]}
                        alt={item.name}
                        className="w-full h-full object-contain rounded"
                      />
                    </div>
                    {/* Delete Current Image Overlay Button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteDetailImage(selectedImgIndex)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/70 hover:bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-all shadow-xs cursor-pointer"
                      title="Delete this image"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => detailFileInputRef.current?.click()}
                    className="w-full h-44 rounded-lg bg-white dark:bg-slate-800 flex flex-col items-center justify-center p-4 shadow-2xs border border-slate-100 dark:border-slate-700/60 hover:border-blue-300 dark:hover:border-blue-700 transition-colors cursor-pointer group select-none"
                  >
                    <Package className="h-12 w-12 text-blue-500 mb-2 opacity-80 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">{item.name}</span>
                    <span className="text-[11px] text-slate-400 mt-0.5">{item.code}</span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium mt-2 flex items-center gap-1 group-hover:underline">
                      <Plus className="h-3 w-3" /> Click or drop image to upload
                    </span>
                  </div>
                )}

                {/* Multi-image thumbnails strip */}
                {itemImages.length > 1 && (
                  <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-1">
                    {itemImages.map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedImgIndex(idx)}
                        className={cn(
                          "relative h-10 w-10 rounded-md overflow-hidden shrink-0 border cursor-pointer transition-all",
                          selectedImgIndex === idx
                            ? "border-blue-600 ring-2 ring-blue-500/40"
                            : "border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100"
                        )}
                      >
                        <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                {detailImgError && (
                  <p className="text-[10px] text-rose-500 font-semibold mt-1 text-center">{detailImgError}</p>
                )}

                <div className="flex items-center justify-between mt-3 text-xs">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    PRIMARY ⓘ
                  </span>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      type="button"
                      onClick={() => detailFileInputRef.current?.click()}
                      className="text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add more</span>
                    </button>
                    <button 
                      type="button"
                      disabled={itemImages.length === 0}
                      onClick={handleDownloadImage}
                      className="text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      title={itemImages.length > 0 ? "Download image" : "No image to download"}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Accounting & Physical Stock Summary matching reference image */}
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 font-medium">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    Opening Stock <Info className="h-3 w-3 text-slate-400" />
                  </span>
                  <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                    {item.currentStock.toFixed(2)}
                  </span>
                </div>

                {/* Accounting Stock */}
                <div className="space-y-1.5 pt-1">
                  <div className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    ACCOUNTING STOCK <Info className="h-3 w-3 text-slate-400" />
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Stock on Hand :</span>
                    <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{item.currentStock.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Committed Stock :</span>
                    <span className="font-semibold tabular-nums text-slate-900 dark:text-white">0.00</span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Available for Sale :</span>
                    <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{item.currentStock.toFixed(2)}</span>
                  </div>
                </div>

                {/* Physical Stock */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    PHYSICAL STOCK <Info className="h-3 w-3 text-slate-400" />
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Stock on Hand :</span>
                    <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{item.currentStock.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Committed Stock :</span>
                    <span className="font-semibold tabular-nums text-slate-900 dark:text-white">0.00</span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Available for Sale :</span>
                    <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{item.currentStock.toFixed(2)}</span>
                  </div>
                </div>

                {/* Stock Metric Cards */}
                <div className="grid grid-cols-2 gap-3 pt-3">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <div className="text-base font-bold text-slate-900 dark:text-white tabular-nums">{item.minStock} {item.unit}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Reorder Point</div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{item.currentStock} {item.unit}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Physical Units</div>
                  </div>
                </div>

              </div>

            </div>
          </div>

            {/* Full-Width Bill of Materials (BOM Recipe) Section */}
            {item.bom && item.bom.length > 0 && (() => {
              // Pre-calculate BOM analysis for production readiness
              const bomAnalysis = item.bom.map(b => {
                const raw = items.find(i => i.id === b.rawItemId)
                const currentStock = raw?.currentStock ?? 0
                const reorderLevel = raw?.minStock ?? 0
                const qtyRequired = Number(b.qty) || 0
                const remainingAfterBuild = currentStock - qtyRequired
                const maxProducible = qtyRequired > 0 ? Math.floor(currentStock / qtyRequired) : Infinity
                const unitRate = raw?.purchasePrice !== undefined ? raw.purchasePrice : (b.unitCost ?? 0)
                const totalCost = qtyRequired * unitRate
                let stockStatus: 'healthy' | 'low' | 'out' = 'healthy'
                if (currentStock <= 0) stockStatus = 'out'
                else if (currentStock <= reorderLevel) stockStatus = 'low'
                return { ...b, raw, currentStock, reorderLevel, qtyRequired, remainingAfterBuild, maxProducible, unitRate, totalCost, stockStatus }
              })
              const maxProducibleCapacity = Math.min(...bomAnalysis.map(a => a.maxProducible))
              const bottleneck = bomAnalysis.find(a => a.maxProducible === maxProducibleCapacity)
              const hasShortage = bomAnalysis.some(a => a.remainingAfterBuild < 0)
              const hasReorderWarning = bomAnalysis.some(a => a.remainingAfterBuild >= 0 && a.remainingAfterBuild <= a.reorderLevel && a.reorderLevel > 0)
              const totalBOMCost = bomAnalysis.reduce((sum, b) => sum + b.totalCost, 0)

              return (
                <div className="space-y-3.5 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                        <Factory className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                          <span>Bill of Materials (BOM Recipe)</span>
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          List of raw materials & components required to produce 1 {item.unit} of this item.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Batch Yield:</span>
                      <Badge variant="blue" className="text-xs font-bold px-2 py-0.5">
                        Output: 1 {item.unit}
                      </Badge>
                    </div>
                  </div>

                  {/* Max Producible Capacity Readiness Banner */}
                  <div className={`rounded-xl border px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs ${
                    maxProducibleCapacity <= 0
                      ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300'
                      : hasReorderWarning
                        ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300'
                        : 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                        maxProducibleCapacity <= 0 
                          ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300' 
                          : hasReorderWarning 
                            ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300' 
                            : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                      }`}>
                        {maxProducibleCapacity <= 0 ? (
                          <AlertTriangle className="h-4 w-4" />
                        ) : hasReorderWarning ? (
                          <TrendingDown className="h-4 w-4" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                          <span>Max Producible Capacity:</span>
                          <span className="font-bold text-sm tabular-nums text-slate-900 dark:text-white">
                            {maxProducibleCapacity === Infinity ? '∞' : maxProducibleCapacity} {item.unit}
                          </span>
                        </div>
                        <p className="text-[11px] opacity-80 mt-0.5">
                          {maxProducibleCapacity <= 0 
                            ? "Insufficient stock of key raw materials to assemble any unit."
                            : hasReorderWarning
                              ? "Production is possible, but remaining inventory will fall below safety reorder level."
                              : "All raw material inventory levels are healthy for immediate production."}
                        </p>
                      </div>
                    </div>
                    {bottleneck && maxProducibleCapacity !== Infinity && (
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-xs shadow-2xs font-medium">
                        <span className="text-slate-500">Limiting Bottleneck:</span>
                        <strong className="font-semibold text-slate-900 dark:text-white">{bottleneck.rawItemName}</strong>
                      </div>
                    )}
                  </div>

                  {/* Clean Enterprise BOM Table */}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-slate-200 dark:border-slate-800 bg-[#f8fafc] dark:bg-slate-850">
                          <TableHead className="px-4 py-3 text-left text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider whitespace-nowrap min-w-[220px]">
                            Raw Material / Component
                          </TableHead>
                          <TableHead className="px-4 py-3 text-center text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider whitespace-nowrap">
                            Qty Required
                          </TableHead>
                          <TableHead className="px-4 py-3 text-center text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider whitespace-nowrap">
                            Current Stock
                          </TableHead>
                          <TableHead className="px-4 py-3 text-center text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider whitespace-nowrap">
                            Reorder Level
                          </TableHead>
                          <TableHead className="px-4 py-3 text-center text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider whitespace-nowrap">
                            Stock Health
                          </TableHead>
                          <TableHead className="px-4 py-3 text-center text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider whitespace-nowrap">
                            Remaining After Build
                          </TableHead>
                          <TableHead className="px-4 py-3 text-right text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider whitespace-nowrap">
                            Unit Rate (₹)
                          </TableHead>
                          <TableHead className="px-4 py-3 text-right text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider whitespace-nowrap">
                            Total Cost (₹)
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {bomAnalysis.map((b, idx) => (
                          <TableRow 
                            key={idx} 
                            className={`transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40 ${
                              b.remainingAfterBuild < 0 
                                ? 'bg-rose-50/40 dark:bg-rose-950/20' 
                                : ''
                            }`}
                          >
                            {/* Component Name & SKU */}
                            <TableCell className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                              <div className="font-semibold text-xs text-slate-900 dark:text-white">
                                {b.rawItemName}
                              </div>
                              {b.raw?.code && (
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                  SKU: {b.raw.code}
                                </div>
                              )}
                            </TableCell>

                            {/* Qty Required */}
                            <TableCell className="px-4 py-3 text-center font-semibold text-xs tabular-nums text-slate-800 dark:text-slate-200 whitespace-nowrap">
                              {b.qty} {b.unit}
                            </TableCell>

                            {/* Current Stock */}
                            <TableCell className={`px-4 py-3 text-center font-semibold text-xs tabular-nums whitespace-nowrap ${
                              b.stockStatus === 'out' 
                                ? 'text-rose-600 dark:text-rose-400' 
                                : b.stockStatus === 'low' 
                                  ? 'text-amber-600 dark:text-amber-400' 
                                  : 'text-slate-700 dark:text-slate-300'
                            }`}>
                              {b.currentStock} {b.unit}
                            </TableCell>

                            {/* Reorder Level */}
                            <TableCell className="px-4 py-3 text-center tabular-nums text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                              {b.reorderLevel} {b.unit}
                            </TableCell>

                            {/* Status */}
                            <TableCell className="px-4 py-3 text-center whitespace-nowrap">
                              {b.stockStatus === 'out' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300">
                                  <AlertTriangle className="h-3 w-3" /> Out of Stock
                                </span>
                              ) : b.stockStatus === 'low' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
                                  <TrendingDown className="h-3 w-3" /> Low Stock
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                                  <CheckCircle2 className="h-3 w-3" /> Healthy
                                </span>
                              )}
                            </TableCell>

                            {/* Remaining After Build */}
                            <TableCell className={`px-4 py-3 text-center font-bold text-xs tabular-nums whitespace-nowrap ${
                              b.remainingAfterBuild < 0 
                                ? 'text-rose-600 dark:text-rose-400' 
                                : b.remainingAfterBuild <= b.reorderLevel && b.reorderLevel > 0 
                                  ? 'text-amber-600 dark:text-amber-400' 
                                  : 'text-emerald-600 dark:text-emerald-400'
                            }`}>
                              <div>{b.remainingAfterBuild} {b.unit}</div>
                              {b.remainingAfterBuild < 0 && (
                                <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-semibold bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300 mt-0.5">
                                  Shortage
                                </span>
                              )}
                              {b.remainingAfterBuild >= 0 && b.remainingAfterBuild <= b.reorderLevel && b.reorderLevel > 0 && (
                                <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300 mt-0.5">
                                  Below Reorder
                                </span>
                              )}
                            </TableCell>

                            {/* Unit Rate */}
                            <TableCell className="px-4 py-3 text-right font-medium text-xs tabular-nums text-slate-600 dark:text-slate-400 whitespace-nowrap">
                              ₹{b.unitRate.toFixed(2)}
                            </TableCell>

                            {/* Total Cost */}
                            <TableCell className="px-4 py-3 text-right font-bold text-xs tabular-nums text-slate-900 dark:text-white whitespace-nowrap">
                              ₹{b.totalCost.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Table Footer with Summary & Total Cost */}
                    <div className="bg-slate-50/80 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between text-xs">
                      <div className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
                        <span>Total Components:</span>
                        <strong className="text-slate-800 dark:text-slate-200 font-bold">{bomAnalysis.length} items</strong>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Total Recipe Material Cost:</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                          ₹{totalBOMCost.toFixed(2)}
                        </span>
                        <span className="text-[11px] text-slate-400 font-normal">/ 1 {item.unit}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {/* TRANSACTIONS TAB */}
        {activeTab === "transactions" && (
          <div className="space-y-5 max-w-5xl">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Recent Invoices & Bills for {item.name}</div>
                  <p className="text-slate-500 mt-0.5">Sales invoices and purchase bills referencing this SKU.</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {itemInvoices.length + itemBills.length} Transactions
                </Badge>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>DATE</TableHead>
                    <TableHead>TYPE</TableHead>
                    <TableHead>DOC#</TableHead>
                    <TableHead>PARTY NAME</TableHead>
                    <TableHead className="text-center">STATUS</TableHead>
                    <TableHead className="text-right">TOTAL AMOUNT</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itemInvoices.length === 0 && itemBills.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-400 text-xs">
                        No transactions found for this item yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {itemInvoices.map(inv => (
                        <TableRow key={inv.id}>
                          <TableCell className="text-xs font-normal tabular-nums text-slate-500">{inv.date}</TableCell>
                          <TableCell>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                              Sales Invoice
                            </span>
                          </TableCell>
                          <TableCell className="font-semibold text-sm text-blue-600 dark:text-blue-400">{inv.docNo}</TableCell>
                          <TableCell className="font-medium text-sm text-slate-800 dark:text-slate-200">{inv.partyName}</TableCell>
                          <TableCell className="text-center">
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold uppercase bg-emerald-50 text-emerald-700">
                              {inv.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-sm tabular-nums text-slate-900 dark:text-white">
                            ₹{inv.grandTotal.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}

                      {itemBills.map(bill => (
                        <TableRow key={bill.id}>
                          <TableCell className="text-xs font-normal tabular-nums text-slate-500">{bill.date}</TableCell>
                          <TableCell>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                              Purchase Bill
                            </span>
                          </TableCell>
                          <TableCell className="font-semibold text-sm text-slate-900 dark:text-white">{bill.docNo}</TableCell>
                          <TableCell className="font-medium text-sm text-slate-800 dark:text-slate-200">{bill.partyName}</TableCell>
                          <TableCell className="text-center">
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold uppercase bg-slate-100 text-slate-700">
                              {bill.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-sm tabular-nums text-slate-900 dark:text-white">
                            ₹{bill.grandTotal.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === "history" && (
          <div className="space-y-5 max-w-5xl">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Audit Trail Movement History</div>
                  <p className="text-slate-500 mt-0.5">Immutable inventory ledger entries for this SKU.</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {itemMovements.length} Records
                </Badge>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>TIMESTAMP</TableHead>
                    <TableHead>TYPE</TableHead>
                    <TableHead>GODOWN</TableHead>
                    <TableHead>REF DOC</TableHead>
                    <TableHead>ACTOR</TableHead>
                    <TableHead className="text-right">QTY CHANGE</TableHead>
                    <TableHead>REASON</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itemMovements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-400 text-xs">
                        No movement history logged yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    itemMovements.map(m => (
                      <TableRow key={m.id}>
                        <TableCell className="text-xs font-normal tabular-nums text-slate-500">{m.timestamp}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs capitalize">
                            {m.movementType.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-medium text-slate-700 dark:text-slate-300">{m.godownName}</TableCell>
                        <TableCell className="text-xs font-semibold tabular-nums text-blue-600 dark:text-blue-400">{m.refDocNo}</TableCell>
                        <TableCell className="text-xs text-slate-500">{m.actor}</TableCell>
                        <TableCell className="text-right font-semibold text-sm tabular-nums">
                          <span className={m.qtyChange < 0 ? "text-rose-600" : "text-emerald-600"}>
                            {m.qtyChange > 0 ? `+${m.qtyChange}` : m.qtyChange}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 max-w-[160px] truncate">{m.reason}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

      </div>

      {/* Right Slide-Over Stock Adjustment Form (fallback if used standalone) */}
      <AdjustStockForm
        isOpen={isAdjustModalOpen}
        item={item}
        onClose={() => setIsAdjustModalOpen(false)}
      />

      {/* Barcode & QR Label Generator Modal */}
      <BarcodeModal
        isOpen={isBarcodeModalOpen}
        onClose={() => setIsBarcodeModalOpen(false)}
        item={item}
      />

      {/* Quick Add Batch Modal */}
      <AddBatchModal
        isOpen={isAddBatchModalOpen}
        onClose={() => setIsAddBatchModalOpen(false)}
        item={item}
      />

    </div>
  )
}
