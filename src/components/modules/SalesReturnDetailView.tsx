"use client"

import React, { useState } from "react"
import { SalesReturn } from "@/types/inventory"
import { useApp } from "@/context/AppContext"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { 
  RotateCcw, 
  Printer, 
  Download, 
  Share2, 
  Receipt, 
  X, 
  Package, 
  CheckCircle2, 
  Clock, 
  Calendar,
  Building2,
  Warehouse,
  AlertTriangle,
  Trash2,
  ArrowRight,
  ChevronDown,
  Check
} from "lucide-react"
import { formatINR } from "@/lib/utils"

interface SalesReturnDetailViewProps {
  salesReturn: SalesReturn
  onClose: () => void
  onGenerateCreditNote?: (salesReturnId: string) => void
  onDelete?: () => void
}

export function SalesReturnDetailView({ 
  salesReturn, 
  onClose, 
  onGenerateCreditNote,
  onDelete 
}: SalesReturnDetailViewProps) {
  const { business, parties, godowns, updateSalesReturnStatus, gstSettings, formCustomColumns } = useApp()
  const customColumns = (formCustomColumns?.sales_return || []).filter(c => c.isEnabled !== false)
  const [activeTab, setActiveTab] = useState<"preview" | "items" | "history">("preview")
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false)

  const party = parties.find(p => p.id === salesReturn.customerId || (p.name && salesReturn.customerName && p.name.trim().toLowerCase() === salesReturn.customerName.trim().toLowerCase()))
  const currSym = salesReturn.currencySymbol || party?.currencySymbol || (salesReturn.currency === "USD" ? "$" : "₹")
  const godown = godowns.find(g => g.id === salesReturn.receivingGodownId)

  const totalQuantity = salesReturn.items.reduce((sum, item) => sum + item.qty, 0)

  const formatAmountWords = (num: number) => {
    return `${salesReturn.currency || "INR"} ${Math.round(num).toLocaleString("en-US")} Only`
  }

  const getStatusBadge = (status: SalesReturn["status"]) => {
    switch (status) {
      case "received":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
      case "closed":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800"
      case "cancelled":
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800"
      default:
        return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
    }
  }

  const getConditionBadge = (cond?: string) => {
    switch (cond) {
      case "resalable":
        return "bg-emerald-50 text-emerald-700 border-emerald-200"
      case "damaged":
        return "bg-rose-50 text-rose-700 border-rose-200"
      case "expired":
        return "bg-amber-50 text-amber-700 border-amber-200"
      default:
        return "bg-slate-50 text-slate-700 border-slate-200"
    }
  }

  const getReasonLabel = (r: string) => {
    switch (r) {
      case "damaged_goods": return "Damaged Goods in Transit"
      case "expired_stock": return "Expired Stock"
      case "wrong_item_delivered": return "Wrong Item Delivered"
      case "quality_issue": return "Quality Rejection"
      case "customer_cancellation": return "Customer Cancellation"
      default: return "Other Reason"
    }
  }

  return (
    <div className="relative flex flex-col h-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 overflow-hidden">
      
      {/* 1. Header Action Bar */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 print:hidden no-print">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
            <RotateCcw className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                Sales Return {salesReturn.returnNo}
              </h1>
              {/* Interactive Status Selector Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border flex items-center gap-1 transition-all hover:ring-2 hover:ring-offset-1 hover:ring-blue-300 dark:hover:ring-blue-700 cursor-pointer ${getStatusBadge(salesReturn.status)}`}
                  title="Click to change status"
                >
                  <span>{salesReturn.status.toUpperCase()}</span>
                  <ChevronDown className="h-3 w-3 opacity-70" />
                </button>

                {isStatusDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsStatusDropdownOpen(false)} />
                    <div className="absolute left-0 mt-1.5 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-1 z-50 text-xs">
                      <div className="px-3 py-1 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-100 dark:border-slate-700/60 mb-1">
                        Change Status
                      </div>
                      {(["draft", "pending", "received", "closed", "cancelled"] as SalesReturn["status"][]).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => {
                            updateSalesReturnStatus(salesReturn.id, st)
                            setIsStatusDropdownOpen(false)
                          }}
                          className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/60 cursor-pointer ${
                            salesReturn.status === st 
                              ? "font-bold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30" 
                              : "text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <span className="capitalize">{st}</span>
                          {salesReturn.status === st && <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              {salesReturn.creditNoteNo && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1">
                  <Receipt className="h-3 w-3" />
                  <span>CN: {salesReturn.creditNoteNo}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Customer: <span className="font-semibold text-slate-700 dark:text-slate-300">{salesReturn.customerName}</span> • Date: {salesReturn.date} • Ref Inv: <span className="font-medium text-slate-700 dark:text-slate-300">{salesReturn.originalInvoiceNo}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {!salesReturn.creditNoteId && onGenerateCreditNote && (
            <Button
              type="button"
              onClick={() => onGenerateCreditNote(salesReturn.id)}
              className="h-8 px-3 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-2xs rounded-md"
            >
              <Receipt className="h-3.5 w-3.5" />
              <span>Generate Credit Note</span>
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={() => window.print()}
            className="h-8 px-2.5 text-xs font-medium bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300 gap-1.5 shadow-2xs"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print</span>
          </Button>

          {onDelete && (
            <Button
              type="button"
              variant="outline"
              onClick={onDelete}
              className="h-8 px-2.5 text-xs font-medium text-rose-600 hover:text-rose-700 border-rose-200 hover:bg-rose-50 dark:border-rose-900/50 dark:hover:bg-rose-950/40 gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete</span>
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 2. Sub-tab navigation */}
      <div className="flex items-center gap-8 px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 print:hidden no-print">
        <button
          onClick={() => setActiveTab("preview")}
          className={`py-3 text-xs font-semibold tracking-wide border-b-2 transition-colors ${
            activeTab === "preview"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          Return Slip (A4 Preview)
        </button>
        <button
          onClick={() => setActiveTab("items")}
          className={`py-3 text-xs font-semibold tracking-wide border-b-2 transition-colors ${
            activeTab === "items"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          Line Items ({salesReturn.items.length})
        </button>
      </div>

      {/* 3. Main Body */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-slate-950/60">
        {activeTab === "preview" ? (
          
          /* A4 Sheet Container */
          <div className="printable-document-sheet max-w-4xl mx-auto bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-xl rounded-sm p-8 text-slate-800 dark:text-slate-100 space-y-6 print:border-none print:shadow-none print:p-0 print:w-full">
            
            {/* Header: Company & Slip Title */}
            <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-5">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  {business.name}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {business.address}
                </p>
                <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  <span>GSTIN: </span><span className="font-semibold">{business.gstin}</span> • <span>State: Maharashtra (27)</span>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs rounded-sm uppercase tracking-wider mb-2">
                  MATERIAL RETURN SLIP
                </span>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {salesReturn.returnNo}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Date: <span className="font-semibold text-slate-700 dark:text-slate-300">{salesReturn.date}</span>
                </p>
              </div>
            </div>

            {/* Parties & Reference Grid */}
            <div className="grid grid-cols-2 gap-6 p-4 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-xs">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  RETURNED BY (CUSTOMER):
                </span>
                <p className="font-bold text-sm text-slate-900 dark:text-white">
                  {salesReturn.customerName}
                </p>
                {salesReturn.customerGstin && (
                  <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                    GSTIN: {salesReturn.customerGstin}
                  </p>
                )}
                {party?.address && (
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    {party.address}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  RECEIPT & WAREHOUSE DETAILS:
                </span>
                <p className="text-slate-600 dark:text-slate-300">
                  <span className="text-slate-400">Original Invoice Ref: </span>
                  <span className="font-semibold text-slate-900 dark:text-white">{salesReturn.originalInvoiceNo}</span>
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  <span className="text-slate-400">Receiving Godown: </span>
                  <span className="font-semibold text-slate-900 dark:text-white">{godown?.name || "Main Godown"}</span>
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  <span className="text-slate-400">Primary Reason: </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{getReasonLabel(salesReturn.reason)}</span>
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  <span className="text-slate-400">Status: </span>
                  <span className="font-semibold text-slate-900 dark:text-white uppercase">{salesReturn.status}</span>
                </p>
              </div>
            </div>

            {/* Table of Returned Items */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800/80">
                    <TableHead className="w-10 px-3 py-2.5 text-center text-xs font-semibold text-slate-700 dark:text-slate-300">#</TableHead>
                    <TableHead className="px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300">ITEM DESCRIPTION</TableHead>
                    <TableHead className="w-20 px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300">HSN</TableHead>
                    <TableHead className="w-24 px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300">CONDITION</TableHead>
                    <TableHead className="w-20 px-3 py-2.5 text-right text-xs font-semibold text-slate-700 dark:text-slate-300">QTY</TableHead>
                    <TableHead className="w-24 px-3 py-2.5 text-right text-xs font-semibold text-slate-700 dark:text-slate-300">RATE ({currSym})</TableHead>
                    <TableHead className="w-16 px-3 py-2.5 text-right text-xs font-semibold text-slate-700 dark:text-slate-300">GST %</TableHead>
                    {customColumns.map(col => (
                      <TableHead 
                        key={col.id} 
                        className={`px-3 py-2.5 text-center text-xs uppercase font-medium text-slate-700 dark:text-slate-300 ${col.printOnPaper === false ? "print:hidden" : ""}`}
                      >
                        {col.name}
                      </TableHead>
                    ))}
                    <TableHead className="w-28 px-3 py-2.5 text-right text-xs font-semibold text-slate-700 dark:text-slate-300">AMOUNT ({currSym})</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesReturn.items.map((line, idx) => (
                    <TableRow key={idx} className="border-b border-slate-100 dark:border-slate-800/60">
                      <TableCell className="px-3 py-3 text-center text-xs text-slate-400 tabular-nums">{idx + 1}</TableCell>
                      <TableCell className="px-3 py-3 text-xs">
                        <div className="font-semibold text-slate-900 dark:text-white">{line.name}</div>
                        {line.code && (
                          <div className="text-[11px] text-slate-500">SKU: {line.code}</div>
                        )}
                      </TableCell>
                      <TableCell className="px-3 py-3 text-xs tabular-nums text-slate-500">{line.hsn || "-"}</TableCell>
                      <TableCell className="px-3 py-3 text-xs">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getConditionBadge(line.condition)}`}>
                          {(line.condition || "damaged").toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell className="px-3 py-3 text-right text-xs font-semibold tabular-nums text-slate-900 dark:text-white">
                        {line.qty}
                      </TableCell>
                      <TableCell className="px-3 py-3 text-right text-xs tabular-nums text-slate-700 dark:text-slate-300">
                        {currSym}{line.rate.toFixed(2)}
                      </TableCell>
                      <TableCell className="px-3 py-3 text-right text-xs tabular-nums text-slate-500">
                        {line.gstRate}%
                      </TableCell>
                      {customColumns.map(col => (
                        <TableCell 
                          key={col.id} 
                          className={`px-3 py-3 text-center text-xs text-slate-700 dark:text-slate-300 ${col.printOnPaper === false ? "print:hidden" : ""}`}
                        >
                          {(line as any).customColumns?.[col.id] || "—"}
                        </TableCell>
                      ))}
                      <TableCell className="px-3 py-3 text-right text-xs font-semibold tabular-nums text-slate-900 dark:text-white">
                        {currSym}{line.total.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Summary & Totals */}
            <div className="grid grid-cols-2 gap-8 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
              <div className="space-y-3">
                {salesReturn.notes && (
                  <div className="p-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                    <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Remarks / Inspection Notes:</span>
                    <p className="text-slate-600 dark:text-slate-400 italic">{salesReturn.notes}</p>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 block mb-0.5">Total Value in Words:</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 italic">
                    {formatAmountWords(salesReturn.grandTotal)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Taxable Value:</span>
                  <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{currSym}{salesReturn.subtotal.toFixed(2)}</span>
                </div>
                {salesReturn.cgstTotal > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">CGST:</span>
                    <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{currSym}{salesReturn.cgstTotal.toFixed(2)}</span>
                  </div>
                )}
                {salesReturn.sgstTotal > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">SGST:</span>
                    <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{currSym}{salesReturn.sgstTotal.toFixed(2)}</span>
                  </div>
                )}
                {salesReturn.igstTotal > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">IGST:</span>
                    <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{currSym}{salesReturn.igstTotal.toFixed(2)}</span>
                  </div>
                )}
                {salesReturn.additionalCharges && salesReturn.additionalCharges.length > 0 ? (
                  salesReturn.additionalCharges.map((ch, idx) => (
                    <div key={idx} className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">{ch.name || "Additional Charge"}</span>
                      <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                        {ch.amount > 0 ? `+${currSym}${ch.amount.toFixed(2)}` : `-${currSym}${Math.abs(ch.amount).toFixed(2)}`}
                      </span>
                    </div>
                  ))
                ) : (
                  salesReturn.adjustment !== undefined && salesReturn.adjustment !== 0 && (
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">{salesReturn.adjustmentLabel || "Additional Charge"}</span>
                      <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                        {salesReturn.adjustment > 0 ? `+${currSym}${salesReturn.adjustment.toFixed(2)}` : `-${currSym}${Math.abs(salesReturn.adjustment).toFixed(2)}`}
                      </span>
                    </div>
                  )
                )}
                {salesReturn.withholdingAmount !== undefined && salesReturn.withholdingAmount > 0 && (
                  ((salesReturn.withholdingType === "TDS" && gstSettings?.enableTds) ||
                   (salesReturn.withholdingType === "TCS" && gstSettings?.enableTcs)) && (
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">
                        {salesReturn.withholdingType} {salesReturn.withholdingRate ? `(${salesReturn.withholdingRate}%)` : ""}
                      </span>
                      <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                        {salesReturn.withholdingType === "TDS"
                          ? `-${currSym}${salesReturn.withholdingAmount.toFixed(2)}`
                          : `+${currSym}${salesReturn.withholdingAmount.toFixed(2)}`}
                      </span>
                    </div>
                  )
                )}
                {salesReturn.roundOff !== undefined && (
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Round Off</span>
                    <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                      {salesReturn.roundOff > 0 ? `+${currSym}${salesReturn.roundOff.toFixed(2)}` : salesReturn.roundOff < 0 ? `-${currSym}${Math.abs(salesReturn.roundOff).toFixed(2)}` : `${currSym}0.00`}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-2 text-base font-bold border-t-2 border-slate-900 dark:border-slate-100 text-slate-900 dark:text-white">
                  <span>Net Return Total:</span>
                  <span className="text-blue-600 dark:text-blue-400 tabular-nums">{currSym}{salesReturn.grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Warehouse Verification Signatures */}
            <div className="pt-8 grid grid-cols-3 gap-6 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
              <div>
                <div className="h-12"></div>
                <div className="border-t border-slate-300 dark:border-slate-700 pt-1 font-medium">Customer Rep / Driver</div>
              </div>
              <div>
                <div className="h-12"></div>
                <div className="border-t border-slate-300 dark:border-slate-700 pt-1 font-medium">QC Inspector</div>
              </div>
              <div>
                <div className="h-12"></div>
                <div className="border-t border-slate-300 dark:border-slate-700 pt-1 font-medium">Warehouse Manager</div>
              </div>
            </div>

          </div>
        ) : (
          /* Line Items Tab */
          <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Inspected Item Details ({salesReturn.items.length})
            </h3>
            <div className="border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                    <TableHead className="text-xs font-bold">Item</TableHead>
                    <TableHead className="text-xs font-bold">Condition</TableHead>
                    <TableHead className="text-right text-xs font-bold">Return Qty</TableHead>
                    <TableHead className="text-right text-xs font-bold">Rate</TableHead>
                    <TableHead className="text-right text-xs font-bold">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesReturn.items.map((it, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs font-semibold">{it.name}</TableCell>
                      <TableCell className="text-xs">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getConditionBadge(it.condition)}`}>
                          {(it.condition || "damaged").toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-xs font-semibold tabular-nums">{it.qty}</TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{currSym}{it.rate.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-xs font-bold tabular-nums">{currSym}{it.total.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
