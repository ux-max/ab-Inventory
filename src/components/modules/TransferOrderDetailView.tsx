"use client"

import React, { useState } from "react"
import { useApp } from "@/context/AppContext"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { 
  ArrowLeftRight, 
  Printer, 
  Download, 
  Share2, 
  X, 
  Warehouse, 
  Clock, 
  CheckCircle2, 
  Building2, 
  MapPin, 
  FileText,
  History as HistoryIcon,
  Plus
} from "lucide-react"
import { formatINR } from "@/lib/utils"

export interface TransferOrderData {
  id: string
  refDocNo: string
  timestamp: string
  itemId: string
  itemName: string
  itemUnit: string
  itemCode: string
  qty: number
  fromGodownId: string
  fromGodownName: string
  toGodownId: string
  toGodownName: string
  actor: string
  reason: string
  status: string
}

interface TransferOrderDetailViewProps {
  transfer: TransferOrderData
  onClose: () => void
  onNewTransfer?: () => void
}

export function TransferOrderDetailView({ 
  transfer, 
  onClose,
  onNewTransfer 
}: TransferOrderDetailViewProps) {
  const { business, items, godowns, stockMovements } = useApp()
  const [activeTab, setActiveTab] = useState<"preview" | "movement" | "history">("preview")

  const item = items.find(i => i.id === transfer.itemId || i.name === transfer.itemName)
  const fromGodown = godowns.find(g => g.id === transfer.fromGodownId || g.name === transfer.fromGodownName)
  const toGodown = godowns.find(g => g.id === transfer.toGodownId || g.name === transfer.toGodownName)

  // Estimated inventory valuation
  const rate = item?.purchasePrice || item?.salePrice || 100
  const totalValue = rate * transfer.qty

  // Related movement logs
  const relatedMovements = stockMovements.filter(m => m.refDocNo === transfer.refDocNo)

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="relative flex flex-col h-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 overflow-hidden select-none">
      
      {/* 1. Header Action Bar - Unified with InvoiceDetailView / ChallanDetailView */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 h-14 print:hidden no-print">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
            <ArrowLeftRight className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                Transfer Order {transfer.refDocNo}
              </h1>
              <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
                {transfer.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Route: <span className="font-semibold text-slate-700 dark:text-slate-300">{transfer.fromGodownName}</span> → <span className="font-semibold text-slate-700 dark:text-slate-300">{transfer.toGodownName}</span> • Date: {transfer.timestamp}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onNewTransfer && (
            <Button
              size="sm"
              onClick={onNewTransfer}
              className="h-8 px-3 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-2xs rounded-md cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Transfer</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="h-8 px-3 text-xs gap-1.5 border-slate-200 dark:border-slate-700 cursor-pointer"
            title="Print Transfer Order Slip"
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
          <span>Transfer Slip Preview</span>
        </button>

        <button
          onClick={() => setActiveTab("movement")}
          className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === "movement"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          <ArrowLeftRight className="h-3.5 w-3.5" />
          <span>Route & Godowns</span>
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
        
        {/* TAB 1: AUTHENTIC TRANSFER SLIP PREVIEW */}
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
                    STOCK TRANSFER ORDER
                  </span>
                  
                  <div className="mt-3 text-xs space-y-1 text-slate-600 dark:text-slate-400">
                    <p>
                      <span className="text-slate-400">Transfer #: </span>
                      <span className="font-bold text-slate-900 dark:text-white">{transfer.refDocNo}</span>
                    </p>
                    <p>
                      <span className="text-slate-400">Date: </span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{transfer.timestamp}</span>
                    </p>
                    <p>
                      <span className="text-slate-400">Authorized By: </span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{transfer.actor}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Source & Destination Route (Clean 2-Column Grid matching Invoices/Bills) */}
              <div className="grid grid-cols-2 gap-8 py-5 border-b border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Dispatched From (Source Godown)
                  </span>
                  <div className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                    {transfer.fromGodownName}
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 space-y-0.5">
                    <p>{fromGodown?.address || "Main Logistics Center"}</p>
                    {fromGodown?.contactPerson && (
                      <p><span className="text-slate-400">Contact / Manager: </span>{fromGodown.contactPerson}</p>
                    )}
                    {fromGodown?.phone && (
                      <p><span className="text-slate-400">Phone: </span>{fromGodown.phone}</p>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Dispatched To (Destination Godown)
                  </span>
                  <div className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                    {transfer.toGodownName}
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 space-y-0.5">
                    <p>{toGodown?.address || "Branch Store / Warehouse"}</p>
                    {toGodown?.contactPerson && (
                      <p><span className="text-slate-400">Contact / Manager: </span>{toGodown.contactPerson}</p>
                    )}
                    {toGodown?.phone && (
                      <p><span className="text-slate-400">Phone: </span>{toGodown.phone}</p>
                    )}
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
                        <TableHead className="px-3 py-2.5 text-right text-xs">TRANSFER QTY</TableHead>
                        <TableHead className="px-3 py-2.5 text-right text-xs">EST. RATE</TableHead>
                        <TableHead className="px-3 py-2.5 text-right text-xs">EST. VALUE</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="border-b border-slate-100 dark:border-slate-800/60">
                        <TableCell className="px-3 py-3 text-center text-xs text-slate-400">1</TableCell>
                        <TableCell className="px-3 py-3 text-xs">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {transfer.itemName}
                          </div>
                          {transfer.itemCode && (
                            <div className="text-[11px] text-slate-500">
                              SKU: {transfer.itemCode}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="px-3 py-3 text-xs text-slate-600 dark:text-slate-400">
                          {item?.category || "General Inventory"}
                        </TableCell>
                        <TableCell className="px-3 py-3 text-right text-xs font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                          {transfer.qty} {transfer.itemUnit}
                        </TableCell>
                        <TableCell className="px-3 py-3 text-right text-xs tabular-nums text-slate-700 dark:text-slate-300">
                          {formatINR(rate)}
                        </TableCell>
                        <TableCell className="px-3 py-3 text-right text-xs font-semibold tabular-nums text-slate-900 dark:text-white">
                          {formatINR(totalValue)}
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
                    Transfer Reason / Note
                  </span>
                  <p className="font-medium text-slate-700 dark:text-slate-300">
                    {transfer.reason || "Branch inventory replenishment."}
                  </p>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Total Quantity Transferred</span>
                    <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                      {transfer.qty} {transfer.itemUnit}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 text-base font-bold border-b-2 border-slate-900 dark:border-slate-100">
                    <span className="text-slate-900 dark:text-white">Total Valuation</span>
                    <span className="text-blue-600 dark:text-blue-400 tabular-nums">
                      {formatINR(totalValue)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Footer: Clean Signature Block without unnecessary text */}
            <div className="mt-auto pt-8 flex justify-between items-end text-xs text-slate-500">
              <div>
                <p className="text-[11px] text-slate-400">Inter-godown stock transfer slip</p>
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

        {/* TAB 2: ROUTE & GODOWNS */}
        {activeTab === "movement" && (
          <div className="w-full max-w-4xl space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Warehouse className="h-4 w-4 text-blue-600" />
                <span>Inter-Warehouse Transit Route</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                {/* Source details */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md">
                      Deducted: -{transfer.qty} {transfer.itemUnit}
                    </span>
                    <Badge variant="outline" className="text-[10px]">Source</Badge>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">{transfer.fromGodownName}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{fromGodown?.address || "Primary Hub"}</p>
                  <div className="text-xs text-slate-500 pt-2 border-t border-slate-200 dark:border-slate-700">
                    Manager: <span className="font-medium text-slate-700 dark:text-slate-300">{fromGodown?.contactPerson || transfer.actor}</span>
                  </div>
                </div>

                {/* Destination details */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-blue-50/30 dark:bg-blue-950/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                      Added: +{transfer.qty} {transfer.itemUnit}
                    </span>
                    <Badge variant="outline" className="text-[10px]">Destination</Badge>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">{transfer.toGodownName}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{toGodown?.address || "Branch Store"}</p>
                  <div className="text-xs text-slate-500 pt-2 border-t border-slate-200 dark:border-slate-700">
                    Manager: <span className="font-medium text-slate-700 dark:text-slate-300">{toGodown?.contactPerson || "Receiving Clerk"}</span>
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
                <span>Immutable Stock Movements</span>
              </h3>

              {relatedMovements.length === 0 ? (
                <div className="text-xs text-slate-500 py-6 text-center">
                  Standard posting generated at {transfer.timestamp}.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-lg overflow-hidden">
                  {relatedMovements.map(m => (
                    <div key={m.id} className="p-3.5 flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 dark:text-white">{m.movementType.replace("_", " ").toUpperCase()}</span>
                          <span className="text-slate-400">•</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">{m.godownName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">{m.reason}</div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold tabular-nums text-sm ${m.qtyChange < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                          {m.qtyChange > 0 ? `+${m.qtyChange}` : m.qtyChange} {item?.unit || "Units"}
                        </div>
                        <div className="text-[11px] text-slate-400">{m.timestamp}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
