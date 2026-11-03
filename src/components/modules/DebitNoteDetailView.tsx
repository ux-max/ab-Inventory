"use client"

import React, { useState } from "react"
import { DebitNote } from "@/types/inventory"
import { useApp } from "@/context/AppContext"
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { 
  FileText, 
  Printer, 
  X, 
  Trash2,
  CheckCircle2,
  ChevronDown,
  Check,
  AlertCircle
} from "lucide-react"
import { formatINR } from "@/lib/utils"

interface DebitNoteDetailViewProps {
  debitNote: DebitNote
  onClose: () => void
  onDelete?: () => void
}

export function DebitNoteDetailView({ 
  debitNote, 
  onClose, 
  onDelete 
}: DebitNoteDetailViewProps) {
  const { 
    business, 
    parties, 
    godowns, 
    updateDebitNoteStatus,
    gstSettings,
    formCustomColumns 
  } = useApp()
  const customColumns = (formCustomColumns?.debit_note || []).filter(c => c.isEnabled !== false)

  const [activeTab, setActiveTab] = useState<"preview" | "tax_breakdown">("preview")
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)

  const party = parties.find(p => p.id === debitNote.vendorId || p.name === debitNote.vendorName)
  const godown = debitNote.godownId ? godowns.find(g => g.id === debitNote.godownId) : undefined

  const sym = debitNote.currencySymbol || "₹"
  const curr = debitNote.currency || "INR"

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type })
    setTimeout(() => setToastMessage(null), 4000)
  }

  const formatAmountWords = (num: number) => {
    if (curr === "INR") {
      return `Indian Rupees ${Math.round(num).toLocaleString("en-IN")} Only`
    }
    return `${curr} ${Math.round(num).toLocaleString()} Only`
  }

  const getStatusBadge = (status: DebitNote["status"]) => {
    switch (status) {
      case "open":
        return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800"
      case "applied":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800"
      case "closed":
        return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
      default:
        return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
    }
  }

  const getReasonLabel = (r: string) => {
    switch (r) {
      case "purchase_return": return "01 - Purchase Return / Rejected Goods"
      case "damaged_in_transit": return "02 - Damaged in Transit"
      case "supplier_overcharge": return "03 - Supplier Overcharge / Price Difference"
      case "quality_rejection": return "04 - Quality Rejection"
      case "volume_rebate": return "05 - Volume / Annual Rebate Claim"
      default: return "06 - Other Reasons"
    }
  }

  return (
    <div className="relative flex flex-col h-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 overflow-hidden">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`absolute top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-md shadow-lg text-xs font-semibold flex items-center gap-2 border ${
          toastMessage.type === "success" 
            ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-700" 
            : "bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-700"
        }`}>
          {toastMessage.type === "success" ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-rose-600" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* 1. Header Action Bar */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 print:hidden no-print">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                Debit Note {debitNote.debitNoteNo}
              </h1>

              {/* Interactive Status Selector Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border flex items-center gap-1 transition-all hover:ring-2 hover:ring-offset-1 hover:ring-blue-300 dark:hover:ring-blue-700 cursor-pointer ${getStatusBadge(debitNote.status)}`}
                  title="Click to change status"
                >
                  <span>{debitNote.status.toUpperCase()}</span>
                  <ChevronDown className="h-3 w-3 opacity-70" />
                </button>

                {isStatusDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsStatusDropdownOpen(false)} />
                    <div className="absolute left-0 mt-1.5 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-1 z-50 text-xs">
                      <div className="px-3 py-1 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-100 dark:border-slate-700/60 mb-1">
                        Change Status
                      </div>
                      {(["open", "applied", "closed", "draft"] as DebitNote["status"][]).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => {
                            updateDebitNoteStatus(debitNote.id, st)
                            setIsStatusDropdownOpen(false)
                            showToast(`Status updated to ${st.toUpperCase()}`)
                          }}
                          className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/60 cursor-pointer ${
                            debitNote.status === st 
                              ? "font-bold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30" 
                              : "text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <span className="capitalize">
                            {st === "open" ? "Open (Available)" : st === "applied" ? "Applied (Deducted)" : st === "closed" ? "Closed (Settled)" : "Draft"}
                          </span>
                          {debitNote.status === st && <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {debitNote.isRcm && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300">
                  RCM (Sec 9(3)/9(4))
                </span>
              )}
              {debitNote.purchaseReturnNo && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Ref PR: {debitNote.purchaseReturnNo}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Vendor: <span className="font-semibold text-slate-700 dark:text-slate-300">{debitNote.vendorName}</span> • Date: {debitNote.date} • Ref Bill: <span className="font-medium text-slate-700 dark:text-slate-300">{debitNote.originalBillNo}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.print()}
            className="h-8 px-2.5 text-xs font-medium bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300 gap-1.5 shadow-2xs cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print</span>
          </Button>

          {onDelete && (
            <Button
              type="button"
              variant="outline"
              onClick={onDelete}
              className="h-8 px-2.5 text-xs font-medium text-rose-600 hover:text-rose-700 border-rose-200 hover:bg-rose-50 dark:border-rose-900/50 dark:hover:bg-rose-950/40 gap-1.5 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete</span>
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 2. Sub-tab navigation */}
      <div className="flex items-center gap-8 px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 print:hidden no-print">
        <button
          onClick={() => setActiveTab("preview")}
          className={`py-3 text-xs font-semibold tracking-wide border-b-2 transition-colors cursor-pointer ${
            activeTab === "preview"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          GST Debit Note (A4 Preview)
        </button>
        <button
          onClick={() => setActiveTab("tax_breakdown")}
          className={`py-3 text-xs font-semibold tracking-wide border-b-2 transition-colors cursor-pointer ${
            activeTab === "tax_breakdown"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          HSN Tax Breakdown
        </button>
      </div>

      {/* 3. Main Body */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-slate-950/60">
        {activeTab === "preview" ? (
          
          /* A4 Sheet Container */
          <div className="printable-document-sheet max-w-4xl mx-auto bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-xl rounded-sm p-8 text-slate-800 dark:text-slate-100 space-y-6 print:border-none print:shadow-none print:p-0 print:w-full">
            
            {/* Header: Company & Note Title */}
            <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-5">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  {business.name}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                  {business.address}
                </p>
                <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  <span>GSTIN: </span><span className="font-semibold">{business.gstin}</span> • <span>State: Maharashtra (27)</span>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs rounded-sm uppercase tracking-wider mb-2">
                  DEBIT NOTE
                </span>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {debitNote.debitNoteNo}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Date: <span className="font-semibold text-slate-700 dark:text-slate-300">{debitNote.date}</span>
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Section 34 of CGST Act, 2017
                </p>
              </div>
            </div>

            {/* Details Box */}
            <div className="grid grid-cols-2 gap-6 p-4 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-xs">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  ISSUED TO (SUPPLIER / VENDOR):
                </span>
                <p className="font-bold text-sm text-slate-900 dark:text-white">
                  {debitNote.vendorName}
                </p>
                {debitNote.vendorGstin && (
                  <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                    GSTIN: {debitNote.vendorGstin}
                  </p>
                )}
                {party?.address && (
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    {party.address}
                  </p>
                )}
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  <span className="text-slate-400">Place of Supply: </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{debitNote.placeOfSupply}</span>
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  ORIGINAL BILL & REASON:
                </span>
                <p className="text-slate-600 dark:text-slate-300">
                  <span className="text-slate-400">Original Bill No: </span>
                  <span className="font-semibold text-slate-900 dark:text-white">{debitNote.originalBillNo}</span>
                </p>
                {debitNote.purchaseReturnNo && (
                  <p className="text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400">Against Purchase Return: </span>
                    <span className="font-semibold text-slate-900 dark:text-white">{debitNote.purchaseReturnNo}</span>
                  </p>
                )}
                {debitNote.isRcm && (
                  <p className="text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400">Tax Applicability: </span>
                    <span className="font-semibold text-amber-700 dark:text-amber-400">Reverse Charge Mechanism (Sec 9(3)/9(4))</span>
                  </p>
                )}
                <p className="text-slate-600 dark:text-slate-300">
                  <span className="text-slate-400">Statutory Reason: </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{getReasonLabel(debitNote.reason)}</span>
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  <span className="text-slate-400">Settlement Status: </span>
                  <span className={`font-semibold ${debitNote.status === "applied" ? "text-blue-600 dark:text-blue-400" : debitNote.status === "closed" ? "text-slate-700 dark:text-slate-300" : "text-emerald-600 dark:text-emerald-400"}`}>
                    {debitNote.status === "applied" 
                      ? `APPLIED (Deducted vs ${debitNote.appliedBillNo || debitNote.originalBillNo})` 
                      : debitNote.status === "closed"
                      ? "CLOSED (Refunded / Settled)"
                      : "OPEN (Available Unadjusted Debit)"}
                  </span>
                </p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800/80">
                    <TableHead className="w-10 px-3 py-2.5 text-center text-xs font-semibold text-slate-700 dark:text-slate-300">#</TableHead>
                    <TableHead className="px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300">ITEM DESCRIPTION</TableHead>
                    <TableHead className="w-20 px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300">HSN</TableHead>
                    <TableHead className="w-20 px-3 py-2.5 text-right text-xs font-semibold text-slate-700 dark:text-slate-300">QTY</TableHead>
                    <TableHead className="w-24 px-3 py-2.5 text-right text-xs font-semibold text-slate-700 dark:text-slate-300">RATE ({sym})</TableHead>
                    <TableHead className="w-24 px-3 py-2.5 text-right text-xs font-semibold text-slate-700 dark:text-slate-300">TAXABLE ({sym})</TableHead>
                    <TableHead className="w-16 px-3 py-2.5 text-right text-xs font-semibold text-slate-700 dark:text-slate-300">GST %</TableHead>
                    {customColumns.map(col => (
                      <TableHead 
                        key={col.id} 
                        className={`px-3 py-2.5 text-center text-xs uppercase font-medium text-slate-700 dark:text-slate-300 ${col.printOnPaper === false ? "print:hidden" : ""}`}
                      >
                        {col.name}
                      </TableHead>
                    ))}
                    <TableHead className="w-28 px-3 py-2.5 text-right text-xs font-semibold text-slate-700 dark:text-slate-300">TOTAL ({sym})</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {debitNote.items.map((line, idx) => (
                    <TableRow key={idx} className="border-b border-slate-100 dark:border-slate-800/60">
                      <TableCell className="px-3 py-3 text-center text-xs text-slate-400 tabular-nums">{idx + 1}</TableCell>
                      <TableCell className="px-3 py-3 text-xs">
                        <div className="font-semibold text-slate-900 dark:text-white">{line.name}</div>
                        {line.code && (
                          <div className="text-[11px] text-slate-500">SKU: {line.code}</div>
                        )}
                      </TableCell>
                      <TableCell className="px-3 py-3 text-xs tabular-nums text-slate-500">{line.hsn || "8471"}</TableCell>
                      <TableCell className="px-3 py-3 text-right text-xs font-semibold tabular-nums text-slate-900 dark:text-white">
                        {line.qty}
                      </TableCell>
                      <TableCell className="px-3 py-3 text-right text-xs tabular-nums text-slate-700 dark:text-slate-300">
                        {sym}{line.rate.toFixed(2)}
                      </TableCell>
                      <TableCell className="px-3 py-3 text-right text-xs tabular-nums text-slate-800 dark:text-slate-200">
                        {sym}{line.amount.toFixed(2)}
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
                        {sym}{line.total.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Summary & Totals */}
            <div className="grid grid-cols-2 gap-8 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
              <div className="space-y-3">
                {debitNote.notes && (
                  <div className="p-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                    <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Remarks:</span>
                    <p className="text-slate-600 dark:text-slate-400 italic">{debitNote.notes}</p>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 block mb-0.5">Debit Amount in Words:</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 italic">
                    {formatAmountWords(debitNote.grandTotal)}
                  </p>
                </div>
                {debitNote.terms && (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                    <span className="font-bold text-slate-600 dark:text-slate-300">Terms & Conditions:</span>
                    <pre className="whitespace-pre-wrap font-sans text-[11px] text-slate-500">{debitNote.terms}</pre>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Taxable Subtotal:</span>
                  <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{sym}{debitNote.subtotal.toFixed(2)}</span>
                </div>
                {debitNote.isRcm ? (
                  <div className="p-2.5 my-1 rounded bg-amber-50/70 border border-amber-200/80 text-amber-900 dark:bg-amber-950/30 dark:border-amber-800/60 dark:text-amber-200 space-y-1">
                    <div className="flex justify-between items-center font-semibold text-[11px]">
                      <span>RCM Tax Reversal:</span>
                      <span className="tabular-nums font-bold">
                        {sym}{((debitNote.cgstTotal || 0) + (debitNote.sgstTotal || 0) + (debitNote.igstTotal || 0)).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-tight">
                      Reversed in GSTR-3B Table 3.1(d) & 4(B)(2). Excluded from vendor debit.
                    </p>
                  </div>
                ) : (
                  <>
                    {debitNote.cgstTotal > 0 && (
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500">CGST Amount:</span>
                        <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{sym}{debitNote.cgstTotal.toFixed(2)}</span>
                      </div>
                    )}
                    {debitNote.sgstTotal > 0 && (
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500">SGST Amount:</span>
                        <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{sym}{debitNote.sgstTotal.toFixed(2)}</span>
                      </div>
                    )}
                    {debitNote.igstTotal > 0 && (
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500">IGST Amount:</span>
                        <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{sym}{debitNote.igstTotal.toFixed(2)}</span>
                      </div>
                    )}
                  </>
                )}
                {debitNote.withholdingAmount !== undefined && debitNote.withholdingAmount > 0 && (
                  ((debitNote.withholdingType === "TDS" && gstSettings?.enableTds) ||
                   (debitNote.withholdingType === "TCS" && gstSettings?.enableTcs)) && (
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">
                        {debitNote.withholdingType} {debitNote.withholdingRate ? `(${debitNote.withholdingRate}%)` : ""}
                      </span>
                      <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                        {debitNote.withholdingType === "TDS"
                          ? `-${sym}${debitNote.withholdingAmount.toFixed(2)}`
                          : `+${sym}${debitNote.withholdingAmount.toFixed(2)}`}
                      </span>
                    </div>
                  )
                )}
                <div className="flex justify-between py-2 text-base font-bold border-t-2 border-slate-900 dark:border-slate-100 text-slate-900 dark:text-white">
                  <span>Net Debit Note Amount:</span>
                  <span className="text-blue-600 dark:text-blue-400 tabular-nums">{sym}{debitNote.grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Declaration & Signature */}
            <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex justify-between items-end text-xs">
              <div className="max-w-md text-[11px] text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700 dark:text-slate-300">Statutory Tax Declaration:</p>
                <p>We declare that Input Tax Credit (ITC) has been proportionately reversed as required under Section 16(2) and Section 34 of the CGST Act, 2017.</p>
              </div>

              <div className="text-right">
                <p className="font-bold text-slate-900 dark:text-white">{business.name}</p>
                <div className="h-14"></div>
                <div className="border-t border-slate-300 dark:border-slate-700 pt-1 text-[11px] font-medium text-slate-500">
                  Authorized Signatory
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* Tax Breakdown Tab */
          <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                HSN / SAC ITC Reversal Summary (GSTR-3B Table 4B)
              </h3>
              {debitNote.isRcm && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300">
                  RCM Purchase Reversal
                </span>
              )}
            </div>
            {debitNote.isRcm && (
              <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-950/20 p-2.5 rounded border border-amber-200/60">
                <strong>Statutory RCM Accounting Note:</strong> Taxes below represent reversal of self-assessed RCM liability (GSTR-3B Table 3.1(d)) and corresponding ITC reversal (Table 4(B)(2)). The vendor was never charged GST on this supply and thus only the taxable amount is debited to their ledger.
              </p>
            )}
            <div className="border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                    <TableHead className="text-xs font-bold">HSN/SAC</TableHead>
                    <TableHead className="text-right text-xs font-bold">Taxable Value (₹)</TableHead>
                    <TableHead className="text-right text-xs font-bold">CGST (₹)</TableHead>
                    <TableHead className="text-right text-xs font-bold">SGST (₹)</TableHead>
                    <TableHead className="text-right text-xs font-bold">IGST (₹)</TableHead>
                    <TableHead className="text-right text-xs font-bold">Total Reversal (₹)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {debitNote.items.map((it, i) => {
                    const totalTax = it.cgst + it.sgst + it.igst
                    return (
                      <TableRow key={i}>
                        <TableCell className="text-xs font-medium tabular-nums text-slate-700 dark:text-slate-300">{it.hsn || "8471"}</TableCell>
                        <TableCell className="text-right text-xs tabular-nums">₹{it.amount.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-xs tabular-nums">₹{it.cgst.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-xs tabular-nums">₹{it.sgst.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-xs tabular-nums">₹{it.igst.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-xs font-bold tabular-nums">₹{totalTax.toFixed(2)}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}

