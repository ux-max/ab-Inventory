"use client"

import React, { useState } from "react"
import { useApp } from "@/context/AppContext"
import { StockMovement } from "@/types/inventory"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { 
  SlidersHorizontal, 
  Printer, 
  Download, 
  X, 
  Warehouse, 
  Clock, 
  CheckCircle2, 
  FileText,
  History as HistoryIcon,
  Plus,
  TrendingUp,
  TrendingDown,
  ArrowRight
} from "lucide-react"
import { formatINR } from "@/lib/utils"

interface AdjustmentDetailViewProps {
  adjustment: StockMovement
  onClose: () => void
  onNewAdjustment?: () => void
}

export function AdjustmentDetailView({ 
  adjustment, 
  onClose,
  onNewAdjustment 
}: AdjustmentDetailViewProps) {
  const { business, items, godowns, stockMovements } = useApp()
  const [activeTab, setActiveTab] = useState<"preview" | "impact" | "history">("preview")

  const item = items.find(i => i.id === adjustment.itemId || i.name === adjustment.itemName)
  const godown = godowns.find(g => g.id === adjustment.godownId || g.name === adjustment.godownName)

  // Estimated inventory valuation
  const rate = item?.purchasePrice || item?.salePrice || 0
  const isPositive = adjustment.qtyChange >= 0
  const totalImpact = Math.abs(adjustment.qtyChange) * rate

  // Related movement logs
  const relatedMovements = stockMovements.filter(m => m.refDocNo === adjustment.refDocNo || m.id === adjustment.id)

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="relative flex flex-col h-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 overflow-hidden select-none">
      
      {/* 1. Header Action Bar - Unified with InvoiceDetailView / TransferOrderDetailView */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 h-14 print:hidden no-print">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg border ${
            isPositive 
              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50"
              : "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border-amber-100 dark:border-amber-900/50"
          }`}>
            <SlidersHorizontal className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                Adjustment {adjustment.refDocNo}
              </h1>
              <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
                Adjusted
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Facility: <span className="font-semibold text-slate-700 dark:text-slate-300">{adjustment.godownName}</span> • Date: {adjustment.timestamp} • By: {adjustment.actor}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onNewAdjustment && (
            <Button
              size="sm"
              onClick={onNewAdjustment}
              className="h-8 px-3 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-2xs rounded-md cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Adjustment</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="h-8 px-3 text-xs gap-1.5 border-slate-200 dark:border-slate-700 cursor-pointer"
            title="Print Adjustment Slip"
          >
            <Printer className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden sm:inline">Print Slip</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="h-8 px-3 text-xs gap-1.5 border-slate-200 dark:border-slate-700 cursor-pointer"
            title="Download PDF"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden sm:inline">PDF</span>
          </Button>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer ml-1"
            title="Close Detail View"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-6 shrink-0 print:hidden no-print">
        <button
          onClick={() => setActiveTab("preview")}
          className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === "preview"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Adjustment Slip Preview</span>
        </button>

        <button
          onClick={() => setActiveTab("impact")}
          className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === "impact"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          <span>Stock Impact & Ledger</span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === "history"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          <HistoryIcon className="h-3.5 w-3.5" />
          <span>Audit Log</span>
        </button>
      </div>

      {/* 3. Main Body Canvas */}
      <div className={`flex-1 overflow-y-auto ${
        activeTab === "preview" 
          ? "p-4 sm:p-8 bg-slate-200/60 dark:bg-slate-950/80 flex justify-center items-start" 
          : "p-6 sm:p-8 bg-slate-50/60 dark:bg-slate-950/60"
      }`}>
        
        {/* TAB 1: AUTHENTIC ADJUSTMENT SLIP PREVIEW */}
        {activeTab === "preview" && (
          <div className="printable-document-sheet w-full max-w-[210mm] min-h-[297mm] mx-auto bg-white dark:bg-slate-900 border border-slate-300/80 dark:border-slate-800 shadow-2xl rounded-xs p-[12mm] sm:p-[16mm] text-slate-800 dark:text-slate-100 flex flex-col justify-between print:shadow-none print:border-none print:p-0 print:max-w-none print:min-h-0 print:m-0 print:w-full">
            <div className="space-y-6">
            
              {/* Document Header */}
              <div className="flex justify-between items-start pb-6 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-7 w-7 rounded-md bg-blue-600 text-white font-black text-sm flex items-center justify-center">
                      AB
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {business.tradeName || business.name}
                    </h2>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5 mt-2">
                    <p>{business.address}</p>
                    <p>State: {business.state} ({business.stateCode})</p>
                    <p>GSTIN: <span className="font-semibold text-slate-700 dark:text-slate-300">{business.gstin}</span></p>
                    <p>Phone: {business.phone} • Email: {business.email}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-black text-blue-600 tracking-tight block">
                    STOCK ADJUSTMENT SLIP
                  </span>
                  
                  <div className="mt-3 text-xs space-y-1 text-slate-600 dark:text-slate-400">
                    <p>
                      <span className="text-slate-400">Adjustment #: </span>
                      <span className="font-bold text-slate-900 dark:text-white">{adjustment.refDocNo}</span>
                    </p>
                    <p>
                      <span className="text-slate-400">Date: </span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{adjustment.timestamp}</span>
                    </p>
                    <p>
                      <span className="text-slate-400">Adjusted By: </span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{adjustment.actor}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Godown & Adjustment Classification Grid */}
              <div className="grid grid-cols-2 gap-8 py-5 border-b border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Godown / Warehouse
                  </span>
                  <div className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                    {adjustment.godownName}
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 space-y-0.5">
                    <p>{godown?.address || "Main Logistics Center"}</p>
                    {godown?.contactPerson && (
                      <p><span className="text-slate-400">Manager: </span>{godown.contactPerson}</p>
                    )}
                    {godown?.phone && (
                      <p><span className="text-slate-400">Phone: </span>{godown.phone}</p>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Adjustment Details
                  </span>
                  <div className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                    {isPositive ? "Quantity Addition (Surplus)" : "Quantity Reduction (Deficit)"}
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 space-y-0.5">
                    <p><span className="text-slate-400">Reason: </span><span className="font-medium text-slate-800 dark:text-slate-200">{adjustment.reason || "Physical stock count reconciliation"}</span></p>
                    <p><span className="text-slate-400">Movement Type: </span><span className="uppercase font-medium text-slate-800 dark:text-slate-200">{adjustment.movementType}</span></p>
                  </div>
                </div>
              </div>

              {/* Items Table using atom Table */}
              <div className="py-2">
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                        <TableHead className="w-10 px-3 py-2.5 text-center text-xs">#</TableHead>
                        <TableHead className="px-3 py-2.5 text-xs">ITEM & DESCRIPTION</TableHead>
                        <TableHead className="px-3 py-2.5 text-xs">CATEGORY</TableHead>
                        <TableHead className="px-3 py-2.5 text-right text-xs">PREVIOUS STOCK</TableHead>
                        <TableHead className="px-3 py-2.5 text-right text-xs">QTY ADJUSTED</TableHead>
                        <TableHead className="px-3 py-2.5 text-right text-xs">NEW STOCK</TableHead>
                        <TableHead className="px-3 py-2.5 text-right text-xs">EST. VALUATION</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="border-b border-slate-100 dark:border-slate-800/60">
                        <TableCell className="px-3 py-3 text-center text-xs text-slate-400">1</TableCell>
                        <TableCell className="px-3 py-3 text-xs">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {adjustment.itemName}
                          </div>
                          {item?.code && (
                            <div className="text-[11px] text-slate-500">
                              SKU: {item.code}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="px-3 py-3 text-xs text-slate-600 dark:text-slate-400">
                          {item?.category || "General Inventory"}
                        </TableCell>
                        <TableCell className="px-3 py-3 text-right text-xs tabular-nums text-slate-600 dark:text-slate-400">
                          {adjustment.previousStock} {item?.unit || "Units"}
                        </TableCell>
                        <TableCell className="px-3 py-3 text-right text-xs font-bold tabular-nums">
                          <span className={isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                            {adjustment.qtyChange > 0 ? `+${adjustment.qtyChange}` : adjustment.qtyChange} {item?.unit || "Units"}
                          </span>
                        </TableCell>
                        <TableCell className="px-3 py-3 text-right text-xs font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                          {adjustment.newStock} {item?.unit || "Units"}
                        </TableCell>
                        <TableCell className="px-3 py-3 text-right text-xs font-semibold tabular-nums text-slate-900 dark:text-white">
                          {formatINR(totalImpact)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Limited & Informative Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2 pb-6 border-b border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Reason & Remarks
                  </span>
                  <p className="font-medium text-slate-700 dark:text-slate-300">
                    {adjustment.reason || "Physical count reconciliation and floor stock balancing."}
                  </p>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Net Quantity Impact</span>
                    <span className={`font-semibold tabular-nums ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
                      {adjustment.qtyChange > 0 ? `+${adjustment.qtyChange}` : adjustment.qtyChange} {item?.unit || "Units"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 text-base font-bold border-b-2 border-slate-900 dark:border-slate-100">
                    <span className="text-slate-900 dark:text-white">Estimated Valuation Impact</span>
                    <span className="text-blue-600 dark:text-blue-400 tabular-nums">
                      {formatINR(totalImpact)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Footer: Clean Signature Block without unnecessary text */}
            <div className="mt-auto pt-8 flex justify-between items-end text-xs text-slate-500">
              <div>
                <p className="text-[11px] text-slate-400">Internal stock reconciliation voucher</p>
              </div>

              <div className="text-center">
                <div className="font-semibold text-slate-800 dark:text-slate-200 mb-12">
                  For {business.tradeName || business.name}
                </div>
                <div className="border-t border-slate-300 dark:border-slate-700 pt-1 text-[11px] text-slate-500 min-w-[140px]">
                  Authorized Signatory
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STOCK IMPACT & LEDGER */}
        {activeTab === "impact" && (
          <div className="w-full max-w-4xl space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Previous Stock
                </span>
                <div className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-1 tabular-nums">
                  {adjustment.previousStock} <span className="text-sm font-medium text-slate-500">{item?.unit || "Units"}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Adjustment Difference
                </span>
                <div className={`text-2xl font-black mt-1 tabular-nums flex items-center gap-1.5 ${
                  isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                }`}>
                  {isPositive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                  <span>{adjustment.qtyChange > 0 ? `+${adjustment.qtyChange}` : adjustment.qtyChange}</span>
                  <span className="text-sm font-medium text-slate-500">{item?.unit || "Units"}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20 shadow-2xs">
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                  Reconciled New Stock
                </span>
                <div className="text-2xl font-black text-blue-700 dark:text-blue-300 mt-1 tabular-nums">
                  {adjustment.newStock} <span className="text-sm font-medium text-blue-600/70">{item?.unit || "Units"}</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Warehouse className="h-4 w-4 text-blue-600" />
                <span>Godown Stock Impact</span>
              </h3>
              
              <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div className="flex-1">
                  <div className="text-xs text-slate-500">Warehouse Location</div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">{adjustment.godownName}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{godown?.address}</div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <div className="text-[11px] text-slate-400">Before</div>
                    <div className="font-bold text-sm text-slate-700 dark:text-slate-300">{adjustment.previousStock}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                  <div className="text-center">
                    <div className="text-[11px] text-slate-400">After</div>
                    <div className="font-bold text-sm text-blue-600 dark:text-blue-400">{adjustment.newStock}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: AUDIT LOG */}
        {activeTab === "history" && (
          <div className="w-full max-w-4xl space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <HistoryIcon className="h-4 w-4 text-blue-600" />
                <span>Stock Ledger Audit Trail</span>
              </h3>

              <div className="relative pl-6 border-l-2 border-blue-500/30 space-y-6 my-2">
                <div className="relative">
                  <div className="absolute -left-[31px] top-0 h-4 w-4 rounded-full bg-blue-600 border-2 border-white dark:border-slate-900" />
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Inventory Adjustment Executed & Balanced
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {adjustment.timestamp} • By {adjustment.actor}
                  </div>
                  <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs text-slate-600 dark:text-slate-300 space-y-1">
                    <p><span className="font-medium text-slate-700 dark:text-slate-200">Doc Reference:</span> {adjustment.refDocNo}</p>
                    <p><span className="font-medium text-slate-700 dark:text-slate-200">Item:</span> {adjustment.itemName}</p>
                    <p><span className="font-medium text-slate-700 dark:text-slate-200">Quantity Delta:</span> {adjustment.qtyChange > 0 ? `+${adjustment.qtyChange}` : adjustment.qtyChange} {item?.unit || "Units"}</p>
                    <p><span className="font-medium text-slate-700 dark:text-slate-200">Reason:</span> {adjustment.reason || "Physical count reconciliation"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  )
}
