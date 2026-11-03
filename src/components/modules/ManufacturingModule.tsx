"use client"

import React, { useState } from "react"
import { useApp } from "@/context/AppContext"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { TableCheckbox } from "@/components/ui/table-bulk-actions"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ItemDetailView } from "./ItemDetailView"
import { JobWorkDetailView } from "./JobWorkDetailView"
import { AdjustStockForm } from "@/components/forms/AdjustStockForm"
import { NewJobWorkForm } from "@/components/forms/NewJobWorkForm"
import { AddItemForm } from "@/components/forms/AddItemForm"
import { Dialog, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { 
  Plus, 
  RotateCw, 
  Filter, 
  MoreHorizontal, 
  Search, 
  Factory, 
  Layers, 
  CheckCircle2, 
  AlertTriangle,
  Boxes,
  User,
  FileText as FileTextIcon,
  Hash
} from "lucide-react"
import { Item } from "@/types/inventory"
import { Select } from "@/components/ui/select"
import { Pagination } from "@/components/ui/pagination"

interface ManufacturingModuleProps {
  initialOpenManufacture?: boolean
  onCloseManufactureTrigger?: () => void
  subModule?: string
}

export function ManufacturingModule({ initialOpenManufacture = false, onCloseManufactureTrigger, subModule = "composite" }: ManufacturingModuleProps) {
  const { items, godowns, activeGodownId, parties, jobWorks, recordManufacture, createJobWork, canViewCostAndProfit, updateItem } = useApp()
  const [activeTab, setActiveTab] = useState<"composite" | "jobwork">(subModule === "jobwork" ? "jobwork" : "composite")
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [selectedJobWorkId, setSelectedJobWorkId] = useState<string | null>(null)
  const [jobWorkSearch, setJobWorkSearch] = useState("")
  const [isAdjustMode, setIsAdjustMode] = useState(false)
  const [isManufactureModalOpen, setIsManufactureModalOpen] = useState(initialOpenManufacture)
  const [isCreateJobWorkMode, setIsCreateJobWorkMode] = useState(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  React.useEffect(() => {
    if (subModule === "jobwork") {
      setActiveTab("jobwork")
      setSelectedItemId(null)
      setIsCreateJobWorkMode(false)
    } else if (subModule === "composite") {
      setActiveTab("composite")
      setSelectedJobWorkId(null)
      setIsCreateJobWorkMode(false)
    }
    setCurrentPage(1)
  }, [subModule])

  const [inlineSearch, setInlineSearch] = useState("")

  // Manufacture Form State (PRD 6.1A, F4, MFG-02)
  const manufacturedItems = items.filter(i => {
    if (!i.isManufactured || !i.bom) return false
    if (inlineSearch.trim()) {
      const q = inlineSearch.toLowerCase()
      return i.name.toLowerCase().includes(q) || (i.code && i.code.toLowerCase().includes(q))
    }
    return true
  })

  const paginatedManufacturedItems = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return manufacturedItems.slice(startIndex, startIndex + pageSize)
  }, [manufacturedItems, currentPage, pageSize])

  const paginatedJobWorks = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return jobWorks.slice(startIndex, startIndex + pageSize)
  }, [jobWorks, currentPage, pageSize])

  const selectedJobWork = jobWorks.find(j => j.id === selectedJobWorkId)
  const filteredJobWorks = jobWorks.filter(j => {
    if (!jobWorkSearch.trim()) return true
    const q = jobWorkSearch.toLowerCase()
    return j.jobNo.toLowerCase().includes(q) || j.workerName.toLowerCase().includes(q) || j.finishedItemName.toLowerCase().includes(q)
  })
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([])
  const [selectedFinishedId, setSelectedFinishedId] = useState(manufacturedItems[0]?.id || items[0]?.id || "")
  const [mfgQty, setMfgQty] = useState(20)
  const [mfgGodownId, setMfgGodownId] = useState(activeGodownId)
  const [mfgActor, setMfgActor] = useState("")
  const [mfgRefDoc, setMfgRefDoc] = useState("")
  const [mfgReason, setMfgReason] = useState("Standard BOM Production Batch")

  const toggleSelectAll = () => {
    if (selectedRowIds.length === manufacturedItems.length) {
      setSelectedRowIds([])
    } else {
      setSelectedRowIds(manufacturedItems.map(m => m.id))
    }
  }

  const toggleSelectRow = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setSelectedRowIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const selectedFinishedItem = items.find(i => i.id === selectedFinishedId) || manufacturedItems[0]

  // Check shortage live with reorder level and remaining stock tracking
  const shortageAnalysis = selectedFinishedItem?.bom?.map(bomLine => {
    const rawItm = items.find(i => i.id === bomLine.rawItemId)
    const requiredTotal = bomLine.qty * mfgQty
    const inGodown = rawItm?.stockByGodown[mfgGodownId] || 0
    const hasShortage = inGodown < requiredTotal
    const remainingAfterBuild = Math.max(0, inGodown - requiredTotal)
    const reorderLevel = rawItm?.minStock ?? 0
    const willBreachReorder = remainingAfterBuild <= reorderLevel && !hasShortage
    return {
      ...bomLine,
      requiredTotal,
      inGodown,
      hasShortage,
      remainingAfterBuild,
      reorderLevel,
      willBreachReorder,
      rawItemName: bomLine.rawItemName,
      unit: rawItm?.unit || bomLine.unit
    }
  }) || []

  const hasAnyShortage = shortageAnalysis.some(s => s.hasShortage)

  const handlePostManufacture = (e: React.FormEvent) => {
    e.preventDefault()
    setFeedback(null)

    const res = recordManufacture(selectedFinishedId, mfgQty, mfgGodownId, {
      actor: mfgActor.trim() || undefined,
      refDocNo: mfgRefDoc.trim() || undefined,
      reason: mfgReason.trim() || undefined
    })
    if (!res.success) {
      setFeedback({ type: "error", text: res.message })
      return
    }

    setFeedback({ type: "success", text: res.message })
    setIsManufactureModalOpen(false)
    // Reset metadata fields
    setMfgActor("")
    setMfgRefDoc("")
    setMfgReason("Standard BOM Production Batch")
    if (onCloseManufactureTrigger) onCloseManufactureTrigger()
  }

  const selectedItem = items.find(i => i.id === selectedItemId) || null

  const renderAssembleModal = () => (
    <Dialog open={isManufactureModalOpen} onOpenChange={setIsManufactureModalOpen} className="max-w-xl p-0 overflow-hidden">
      <form onSubmit={handlePostManufacture} className="flex flex-col">
        {/* Header Bar matching Application Modal Standards */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between pr-12">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Factory className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Assemble Manufacturing Item
                </h3>
                <Badge variant="blue" className="text-[10px] font-semibold py-0 px-1.5 h-4.5">
                  BOM Production
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Atomically consumes raw materials and adds finished output stock.
              </p>
            </div>
          </div>
        </div>

        {/* Validation Shortage Banner if applicable */}
        {hasAnyShortage && (
          <div className="mx-6 mt-4 p-2.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>Stock shortage detected in the selected assembly godown for one or more raw materials.</span>
          </div>
        )}

        {/* Form Body - Matching Add Item Form typography, borders, and input styling */}
        <div className="px-6 py-5 space-y-4 text-xs">
          {/* Field 1: Item to Assemble* */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Item to Assemble <span className="text-rose-500">*</span>
            </label>
            <Select
              searchable
              searchPlaceholder="Search finished goods..."
              value={selectedFinishedId}
              onValueChange={(val) => setSelectedFinishedId(val)}
              options={manufacturedItems.map(m => ({
                value: m.id,
                label: m.name,
                description: `SKU: ${m.code} • Stock: ${m.currentStock} ${m.unit}`
              }))}
              className="w-full h-9 text-xs border-slate-300 dark:border-slate-700 rounded-md"
            />
          </div>

          {/* Field 2 & 3: Assembly Godown* & Quantity to Build* */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Assembly Godown <span className="text-rose-500">*</span>
              </label>
              <Select
                value={mfgGodownId}
                onValueChange={(val) => setMfgGodownId(val)}
                options={godowns.map(g => ({ value: g.id, label: g.name }))}
                className="w-full h-9 text-xs border-slate-300 dark:border-slate-700 rounded-md"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Quantity to Build <span className="text-rose-500">*</span>
              </label>
              <Input
                type="number"
                min="1"
                value={mfgQty}
                onChange={(e) => setMfgQty(Number(e.target.value) || 1)}
                className="h-9 text-xs font-semibold tabular-nums border-slate-300 dark:border-slate-700 rounded-md focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white dark:bg-slate-900"
              />
            </div>
          </div>

          {/* Field 4: Operator / Assembled By */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              <span className="flex items-center gap-1"><User className="h-3 w-3 text-slate-400" /> Operator / Assembled By</span>
            </label>
            <Input
              type="text"
              placeholder="e.g. Suresh Patel (Line 1 Operator)"
              value={mfgActor}
              onChange={(e) => setMfgActor(e.target.value)}
              className="h-9 text-xs border-slate-300 dark:border-slate-700 rounded-md focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white dark:bg-slate-900"
            />
            <p className="text-[10px] text-slate-400 mt-0.5">Leave empty to default to logged-in user</p>
          </div>

          {/* Field 5 & 6: Batch No & Reason */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                <span className="flex items-center gap-1"><Hash className="h-3 w-3 text-slate-400" /> Batch / Work Order No</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. LOT-JAM-2026-10-A"
                value={mfgRefDoc}
                onChange={(e) => setMfgRefDoc(e.target.value)}
                className="h-9 text-xs border-slate-300 dark:border-slate-700 rounded-md focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white dark:bg-slate-900"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Auto-generated if empty</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                <span className="flex items-center gap-1"><FileTextIcon className="h-3 w-3 text-slate-400" /> Production Reason</span>
              </label>
              <Select
                value={mfgReason}
                onValueChange={(val) => setMfgReason(val)}
                options={[
                  { value: "Standard BOM Production Batch", label: "Standard BOM Production Batch" },
                  { value: "Customer Order Fulfillment", label: "Customer Order Fulfillment" },
                  { value: "Buffer Safety Stock Replenishment", label: "Buffer Safety Stock Replenishment" },
                  { value: "Trial / Quality Sample Batch", label: "Trial / Quality Sample Batch" },
                ]}
                className="w-full h-9 text-xs border-slate-300 dark:border-slate-700 rounded-md"
              />
            </div>
          </div>

          {/* Component Availability Box */}
          <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 space-y-2">
            <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between text-xs pb-1.5 border-b border-slate-200/60 dark:border-slate-800">
              <span>Component Availability & Stock Impact</span>
              {hasAnyShortage ? (
                <span className="text-rose-600 font-bold flex items-center gap-1 text-[11px]">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Shortage Detected
                </span>
              ) : (
                <span className="text-emerald-600 font-bold flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  All Available
                </span>
              )}
            </div>
            <div className="space-y-1.5">
              {shortageAnalysis.map((s, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className={s.hasShortage ? "text-rose-600 font-semibold" : "text-slate-600 dark:text-slate-400"}>
                      {s.rawItemName}
                    </span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 tabular-nums text-[11px]">
                      Need: <span className="font-bold">{s.requiredTotal} {s.unit}</span> • Stock: <span className={s.hasShortage ? "text-rose-600 font-bold" : "text-slate-700 dark:text-slate-300"}>{s.inGodown} {s.unit}</span>
                      {!s.hasShortage && (
                        <> • Remaining: <span className={s.willBreachReorder ? "text-amber-600 font-bold" : "text-emerald-600 font-bold"}>{s.remainingAfterBuild} {s.unit}</span></>
                      )}
                    </span>
                  </div>
                  {s.willBreachReorder && (
                    <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-semibold pl-1">
                      <AlertTriangle className="h-3 w-3" />
                      <span>Will drop below reorder level (Min: {s.reorderLevel} {s.unit})</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions matching Application Standards */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsManufactureModalOpen(false)}
            className="h-8.5 px-4 text-xs font-semibold bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={hasAnyShortage}
            className="h-8.5 px-5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <Factory className="h-3.5 w-3.5" />
            <span>Assemble</span>
          </Button>
        </div>
      </form>
    </Dialog>
  )

  if (isCreateJobWorkMode) {
    return (
      <NewJobWorkForm
        onCancel={() => setIsCreateJobWorkMode(false)}
        onSuccess={(jobNo) => {
          setIsCreateJobWorkMode(false)
          setFeedback({ type: "success", text: `Job Work Challan ${jobNo} created and dispatched successfully!` })
        }}
      />
    )
  }

  // Master-Detail View for External Job Work Challans
  if (selectedJobWorkId && selectedJobWork) {
    return (
      <div className="flex h-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden select-none">
        {/* Left: Master Job Work Challans List */}
        <div className="master-list-panel w-80 lg:w-96 shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden print:hidden no-print">
          {/* Master List Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-11 shrink-0">
            <span className="font-bold text-sm text-slate-900 dark:text-white">
              Job Work Challans
            </span>
            <Button
              size="sm"
              onClick={() => setIsCreateJobWorkMode(true)}
              className="h-7 w-7 p-0 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-2xs cursor-pointer"
              title="New Job Work Challan"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Quick Search */}
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-2 shrink-0">
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search challans..."
              value={jobWorkSearch}
              onChange={(e) => setJobWorkSearch(e.target.value)}
              className="w-full text-xs bg-transparent border-0 focus:outline-none placeholder:text-slate-400 text-slate-800 dark:text-slate-200"
            />
            {jobWorkSearch && (
              <button onClick={() => setJobWorkSearch("")} className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer">
                ✕
              </button>
            )}
          </div>

          {/* Master Items List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredJobWorks.map(jw => {
              const isSelected = jw.id === selectedJobWorkId
              return (
                <div
                  key={jw.id}
                  onClick={() => setSelectedJobWorkId(jw.id)}
                  className={`flex items-start justify-between p-3 cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-blue-50/80 dark:bg-blue-950/40 border-l-[3px] border-l-blue-600"
                      : "hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-blue-600 dark:text-blue-400 font-mono">
                        {jw.jobNo}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase ${
                        jw.status === "received"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                      }`}>
                        {jw.status}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-1">
                      {jw.workerName}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {jw.finishedItemName} ({jw.expectedQty} units)
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <div className="text-xs font-semibold tabular-nums text-slate-900 dark:text-white">
                      ₹{jw.jobWorkCharges.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {jw.date}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Detail View */}
        <JobWorkDetailView
          jobWork={selectedJobWork}
          onClose={() => setSelectedJobWorkId(null)}
          onReceiveSuccess={(msg) => setFeedback({ type: "success", text: msg })}
        />
      </div>
    )
  }

  if (editingItem) {
    return (
      <AddItemForm
        itemToEdit={editingItem}
        onSave={(itemData) => {
          updateItem(editingItem.id, itemData)
          setSelectedItemId(editingItem.id)
          setEditingItem(null)
        }}
        onCancel={() => {
          setEditingItem(null)
        }}
      />
    )
  }

  if (selectedItemId && selectedItem) {
    return (
      <div className="flex h-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden select-none">
        {/* Left: Master Manufacturing Items List (matching ItemsModule) */}
        <div className="master-list-panel w-80 lg:w-96 shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden print:hidden no-print">
          
          {/* Master List Header */}
          <div className="flex items-center px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-11 shrink-0">
            <span className="font-bold text-sm text-slate-900 dark:text-white">
              Manufacturing Items
            </span>
          </div>

          {/* Quick Search */}
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-2 shrink-0">
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search manufacturing items..."
              value={inlineSearch}
              onChange={(e) => {
                setInlineSearch(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full text-xs bg-transparent border-0 focus:outline-none placeholder:text-slate-400 text-slate-800 dark:text-slate-200"
            />
            {inlineSearch && (
              <button onClick={() => setInlineSearch("")} className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer">
                ✕
              </button>
            )}
          </div>

          {/* Master Item List matching ItemsModule */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {paginatedManufacturedItems.map(item => {
              const isSelected = item.id === selectedItemId

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedItemId(item.id)
                    setIsAdjustMode(false)
                  }}
                  className={`flex items-start justify-between p-3 cursor-pointer transition-colors ${
                    isSelected 
                      ? "bg-blue-50/80 dark:bg-blue-950/40 border-l-[3px] border-l-blue-600" 
                      : "hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0 pr-2">
                    <input
                      type="checkbox"
                      checked={selectedRowIds.includes(item.id)}
                      onChange={(e) => toggleSelectRow(item.id, e as any)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {item.code} • {item.bom?.length || 0} Components
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-semibold tabular-nums text-slate-900 dark:text-white">
                      ₹{item.salePrice.toFixed(2)}
                    </div>
                    <div className="text-[10px] font-semibold mt-0.5 text-emerald-600 dark:text-emerald-400">
                      {item.currentStock.toFixed(0)} {item.unit}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Master List Bottom Pagination */}
          <Pagination
            variant="master-list"
            totalCount={manufacturedItems.length}
            pageSize={pageSize}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>

        {/* Right: Adjust Stock Form OR Item Detail View (same as ItemsModule Item Detail Page) */}
        {isAdjustMode ? (
          <AdjustStockForm
            item={selectedItem}
            onClose={() => setIsAdjustMode(false)}
            onSuccess={() => setIsAdjustMode(false)}
          />
        ) : (
          <ItemDetailView
            item={selectedItem}
            onClose={() => {
              setSelectedItemId(null)
              setIsAdjustMode(false)
            }}
            onEdit={() => setEditingItem(selectedItem)}
            onAdjustStock={() => setIsAdjustMode(true)}
            onAssemble={() => {
              setSelectedFinishedId(selectedItem.id)
              setIsManufactureModalOpen(true)
            }}
            onDelete={() => {
              setSelectedItemId(null)
              setIsAdjustMode(false)
            }}
          />
        )}

        {renderAssembleModal()}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      
      {/* 1. Standard Header Action Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-11">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-slate-900 dark:text-white">
            {activeTab === "jobwork" ? "External Job Work Challans" : "Manufacturing / BOM"}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {activeTab === "composite" ? (
            <Button
              size="sm"
              onClick={() => setIsManufactureModalOpen(true)}
              className="h-7 px-3 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-2xs gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Assemble</span>
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => setIsCreateJobWorkMode(true)}
              className="h-7 px-3 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-2xs gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Job Work Challan</span>
            </Button>
          )}
        </div>
      </div>

      {feedback && (
        <div className={`mx-4 mt-3 p-2.5 rounded-md text-xs font-semibold flex items-center justify-between ${
          feedback.type === "success" 
            ? "bg-emerald-50 text-emerald-800 border border-emerald-200" 
            : "bg-rose-50 text-rose-800 border border-rose-200"
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 text-rose-600" />}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs font-bold underline">Dismiss</button>
        </div>
      )}

      {/* 2. Standard Card Data Table using ui/table.tsx */}
      <div className="p-4 md:p-6 flex-1 overflow-auto space-y-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          {activeTab === "composite" ? (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
                  <TableHead className="w-12 px-4 py-3 text-center">
                    <TableCheckbox
                      checked={selectedRowIds.length > 0 && selectedRowIds.length === manufacturedItems.length}
                      indeterminate={selectedRowIds.length > 0 && selectedRowIds.length < manufacturedItems.length}
                      onChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="px-4 py-3">NAME & SKU</TableHead>
                  <TableHead className="px-4 py-3">BOM RECIPE COMPONENTS</TableHead>
                  <TableHead className="px-4 py-3 text-right">RATE</TableHead>
                  <TableHead className="px-4 py-3 text-right">STOCK ON HAND</TableHead>
                  <TableHead className="px-4 py-3 text-center">USAGE UNIT</TableHead>
                  <TableHead className="px-4 py-3 text-right">ACTION</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedManufacturedItems.map(item => {
                  const isSelected = selectedRowIds.includes(item.id)
                  return (
                    <TableRow
                      key={item.id}
                      onClick={() => setSelectedItemId(item.id)}
                      className={`border-b border-slate-100 dark:border-slate-800/80 transition-colors cursor-pointer group ${
                        isSelected ? "bg-blue-50/50 dark:bg-blue-950/30" : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                      }`}
                    >
                      <TableCell className="px-4 py-3.5 text-center" onClick={(e) => toggleSelectRow(item.id, e)}>
                        <TableCheckbox
                          checked={isSelected}
                          onChange={() => {}}
                        />
                      </TableCell>

                      <TableCell className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <Factory className="h-4 w-4 text-purple-600 shrink-0" />
                          <div>
                            <div className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                              {item.name}
                            </div>
                            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{item.code}</div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="px-4 py-3.5 text-sm font-normal text-slate-600 dark:text-slate-300">
                        {item.bom?.map(b => `${b.rawItemName} (${b.qty} ${b.unit})`).join(", ")}
                      </TableCell>

                      <TableCell className="px-4 py-3.5 text-right text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                        ₹{item.salePrice.toFixed(2)}
                      </TableCell>

                      <TableCell className="px-4 py-3.5 text-right text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                        {item.currentStock.toFixed(2)}
                      </TableCell>

                      <TableCell className="px-4 py-3.5 text-center text-sm font-normal text-slate-500 lowercase">
                        {item.unit}
                      </TableCell>

                      <TableCell className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedFinishedId(item.id)
                            setIsManufactureModalOpen(true)
                          }}
                          className="h-7 px-3 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold"
                        >
                          Assemble
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
                  <TableHead className="px-4 py-3">CHALLAN#</TableHead>
                  <TableHead className="px-4 py-3">DATE</TableHead>
                  <TableHead className="px-4 py-3">JOB WORKER</TableHead>
                  <TableHead className="px-4 py-3">FINISHED ITEM</TableHead>
                  <TableHead className="px-4 py-3 text-center">EXPECTED / RECEIVED</TableHead>
                  <TableHead className="px-4 py-3 text-right">CHARGES</TableHead>
                  <TableHead className="px-4 py-3 text-center">STATUS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedJobWorks.map(jw => (
                  <TableRow 
                    key={jw.id} 
                    onClick={() => setSelectedJobWorkId(jw.id)}
                    className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer group transition-colors"
                  >
                    <TableCell className="px-4 py-3.5 text-sm font-semibold tabular-nums text-blue-600 dark:text-blue-400 group-hover:underline">{jw.jobNo}</TableCell>
                    <TableCell className="px-4 py-3.5 text-slate-500 text-xs font-normal tabular-nums">{jw.date}</TableCell>
                    <TableCell className="px-4 py-3.5 text-sm font-semibold text-slate-900 dark:text-white">{jw.workerName}</TableCell>
                    <TableCell className="px-4 py-3.5 text-sm font-normal text-slate-700 dark:text-slate-300">{jw.finishedItemName}</TableCell>
                    <TableCell className="px-4 py-3.5 text-center text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                      {jw.receivedQty} / {jw.expectedQty}
                    </TableCell>
                    <TableCell className="px-4 py-3.5 text-right text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                      ₹{jw.jobWorkCharges.toFixed(2)}
                    </TableCell>
                    <TableCell className="px-4 py-3.5 text-center">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold uppercase bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                        {jw.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Standard Table Footer inside Card */}
          <Pagination
            totalCount={activeTab === "composite" ? manufacturedItems.length : jobWorks.length}
            pageSize={pageSize}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemLabel="Total Count"
          />
        </div>
      </div>

      {/* Assemble Production Modal */}
      {renderAssembleModal()}
    </div>
  )
}
