"use client"

import React, { useState } from "react"
import { CreditNote } from "@/types/inventory"
import { useApp } from "@/context/AppContext"
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { 
  Receipt, 
  Printer, 
  X, 
  CheckCircle2, 
  Trash2,
  ChevronDown,
  Check,
  AlertCircle
} from "lucide-react"
import { formatINR } from "@/lib/utils"

interface CreditNoteDetailViewProps {
  creditNote: CreditNote
  onClose: () => void
  onDelete?: () => void
}

export function CreditNoteDetailView({ 
  creditNote, 
  onClose, 
  onDelete 
}: CreditNoteDetailViewProps) {
  const { 
    business, 
    parties, 
    godowns, 
    updateCreditNoteStatus,
    gstSettings,
    formCustomColumns 
  } = useApp()
  const customColumns = (formCustomColumns?.credit_note || []).filter(c => c.isEnabled !== false)

  const [activeTab, setActiveTab] = useState<"preview" | "tax_breakdown">("preview")
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)

  const party = parties.find(p => p.id === creditNote.customerId || (p.name && creditNote.customerName && p.name.trim().toLowerCase() === creditNote.customerName.trim().toLowerCase()))
  const currSym = creditNote.currencySymbol || party?.currencySymbol || (creditNote.currency === "USD" ? "$" : "₹")
  const godown = creditNote.godownId ? godowns.find(g => g.id === creditNote.godownId) : undefined

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type })
    setTimeout(() => setToastMessage(null), 4000)
  }

  const formatAmountWords = (num: number) => {
    return `${creditNote.currency || "INR"} ${Math.round(num).toLocaleString("en-US")} Only`
  }

  const getStatusBadge = (status: CreditNote["status"]) => {
    switch (status) {
      case "open":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
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
      case "sales_return": return "01 - Sales Return / Goods Rejected"
      case "defective_goods": return "02 - Defective / Damaged Goods"
      case "post_sale_discount": return "03 - Post-Sale Discount / Rebate"
      case "billing_error": return "04 - Billing / Rate Discrepancy"
      case "order_cancellation": return "05 - Cancellation of Order"
      default: return "06 - Other Reasons"
    }
  }

  return (
    <div className="relative flex flex-col h-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 overflow-hidden">
      
      {/* Toast Feedback */}
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
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                Credit Note {creditNote.creditNoteNo}
              </h1>

              {/* Interactive Status Selector Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border flex items-center gap-1 transition-all hover:ring-2 hover:ring-offset-1 hover:ring-blue-300 dark:hover:ring-blue-700 cursor-pointer ${getStatusBadge(creditNote.status)}`}
                  title="Click to change status"
                >
                  <span>{creditNote.status.toUpperCase()}</span>
                  <ChevronDown className="h-3 w-3 opacity-70" />
                </button>

                {isStatusDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsStatusDropdownOpen(false)} />
                    <div className="absolute left-0 mt-1.5 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-1 z-50 text-xs">
                      <div className="px-3 py-1 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-100 dark:border-slate-700/60 mb-1">
                        Change Status
                      </div>
                      {(["open", "applied", "closed", "draft"] as CreditNote["status"][]).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => {
                            updateCreditNoteStatus(creditNote.id, st)
                            setIsStatusDropdownOpen(false)
                            showToast(`Status updated to ${st.toUpperCase()}`)
                          }}
                          className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/60 cursor-pointer ${
                            creditNote.status === st 
                              ? "font-bold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30" 
                              : "text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <span className="capitalize">
                            {st === "open" ? "Open (Available)" : st === "applied" ? "Applied (Offset)" : st === "closed" ? "Closed (Settled)" : "Draft"}
                          </span>
                          {creditNote.status === st && <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {creditNote.salesReturnNo && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Ref SR: {creditNote.salesReturnNo}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Customer: <span className="font-semibold text-slate-700 dark:text-slate-300">{creditNote.customerName}</span> • Date: {creditNote.date} • Ref Inv: <span className="font-medium text-slate-700 dark:text-slate-300">{creditNote.originalInvoiceNo}</span>
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
          GST Credit Note (A4 Preview)
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
            
            {/* Header: Business & Note Title */}
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
                  CREDIT NOTE
                </span>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {creditNote.creditNoteNo}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Date: <span className="font-semibold text-slate-700 dark:text-slate-300">{creditNote.date}</span>
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Section 34 of CGST Act, 2017
                </p>
              </div>
            </div>

            {/* Statutory Details Box */}
            <div className="grid grid-cols-2 gap-6 p-4 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-xs">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  ISSUED TO (CUSTOMER):
                </span>
                <p className="font-bold text-sm text-slate-900 dark:text-white">
                  {creditNote.customerName}
                </p>
                {creditNote.customerGstin && (
                  <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                    GSTIN: {creditNote.customerGstin}
                  </p>
                )}
                {party?.address && (
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    {party.address}
                  </p>
                )}
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  <span className="text-slate-400">Place of Supply: </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{creditNote.placeOfSupply}</span>
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  ORIGINAL INVOICE & GST REFERENCE:
                </span>
                <p className="text-slate-600 dark:text-slate-300">
                  <span className="text-slate-400">Original Invoice No: </span>
                  <span className="font-semibold text-slate-900 dark:text-white">{creditNote.originalInvoiceNo}</span>
                </p>
                {creditNote.salesReturnNo && (
                  <p className="text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400">Against Sales Return: </span>
                    <span className="font-semibold text-slate-900 dark:text-white">{creditNote.salesReturnNo}</span>
                  </p>
                )}
                <p className="text-slate-600 dark:text-slate-300">
                  <span className="text-slate-400">Statutory Reason: </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{getReasonLabel(creditNote.reason)}</span>
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  <span className="text-slate-400">Settlement Status: </span>
                  <span className={`font-semibold ${creditNote.status === "applied" ? "text-blue-600 dark:text-blue-400" : creditNote.status === "closed" ? "text-slate-700 dark:text-slate-300" : "text-emerald-600 dark:text-emerald-400"}`}>
                    {creditNote.status === "applied" 
                      ? `APPLIED (Adjusted vs ${creditNote.appliedInvoiceNo || creditNote.originalInvoiceNo})` 
                      : creditNote.status === "closed"
                      ? "CLOSED (Refunded / Settled)"
                      : "OPEN (Available Unadjusted Credit)"}
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
                    <TableHead className="w-24 px-3 py-2.5 text-right text-xs font-semibold text-slate-700 dark:text-slate-300">RATE ({currSym})</TableHead>
                    <TableHead className="w-24 px-3 py-2.5 text-right text-xs font-semibold text-slate-700 dark:text-slate-300">TAXABLE ({currSym})</TableHead>
                    <TableHead className="w-16 px-3 py-2.5 text-right text-xs font-semibold text-slate-700 dark:text-slate-300">GST %</TableHead>
                    {customColumns.map(col => (
                      <TableHead 
                        key={col.id} 
                        className={`px-3 py-2.5 text-center text-xs uppercase font-medium text-slate-700 dark:text-slate-300 ${col.printOnPaper === false ? "print:hidden" : ""}`}
                      >
                        {col.name}
                      </TableHead>
                    ))}
                    <TableHead className="w-28 px-3 py-2.5 text-right text-xs font-semibold text-slate-700 dark:text-slate-300">TOTAL ({currSym})</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {creditNote.items.map((line, idx) => (
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
                        {currSym}{line.rate.toFixed(2)}
                      </TableCell>
                      <TableCell className="px-3 py-3 text-right text-xs tabular-nums text-slate-800 dark:text-slate-200">
                        {currSym}{line.amount.toFixed(2)}
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
                {creditNote.notes && (
                  <div className="p-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                    <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Remarks:</span>
                    <p className="text-slate-600 dark:text-slate-400 italic">{creditNote.notes}</p>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 block mb-0.5">Credit Amount in Words:</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 italic">
                    {formatAmountWords(creditNote.grandTotal)}
                  </p>
                </div>
                {creditNote.terms && (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                    <span className="font-bold text-slate-600 dark:text-slate-300">Terms & Conditions:</span>
                    <pre className="whitespace-pre-wrap font-sans text-[11px] text-slate-500">{creditNote.terms}</pre>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Taxable Subtotal:</span>
                  <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{currSym}{creditNote.subtotal.toFixed(2)}</span>
                </div>
                {creditNote.cgstTotal > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">CGST Amount:</span>
                    <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{currSym}{creditNote.cgstTotal.toFixed(2)}</span>
                  </div>
                )}
                {creditNote.sgstTotal > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">SGST Amount:</span>
                    <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{currSym}{creditNote.sgstTotal.toFixed(2)}</span>
                  </div>
                )}
                {creditNote.igstTotal > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">IGST Amount:</span>
                    <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{currSym}{creditNote.igstTotal.toFixed(2)}</span>
                  </div>
                )}
                {creditNote.additionalCharges && creditNote.additionalCharges.length > 0 ? (
                  creditNote.additionalCharges.map((ch, idx) => (
                    <div key={idx} className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">{ch.name || "Additional Charge"}</span>
                      <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                        {ch.amount > 0 ? `+${currSym}${ch.amount.toFixed(2)}` : `-${currSym}${Math.abs(ch.amount).toFixed(2)}`}
                      </span>
                    </div>
                  ))
                ) : (
                  creditNote.adjustment !== undefined && creditNote.adjustment !== 0 && (
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">{creditNote.adjustmentLabel || "Additional Charge"}</span>
                      <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                        {creditNote.adjustment > 0 ? `+${currSym}${creditNote.adjustment.toFixed(2)}` : `-${currSym}${Math.abs(creditNote.adjustment).toFixed(2)}`}
                      </span>
                    </div>
                  )
                )}
                {creditNote.withholdingAmount !== undefined && creditNote.withholdingAmount > 0 && (
                  ((creditNote.withholdingType === "TDS" && gstSettings?.enableTds) ||
                   (creditNote.withholdingType === "TCS" && gstSettings?.enableTcs)) && (
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">
                        {creditNote.withholdingType} {creditNote.withholdingRate ? `(${creditNote.withholdingRate}%)` : ""}
                      </span>
                      <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                        {creditNote.withholdingType === "TDS"
                          ? `-${currSym}${creditNote.withholdingAmount.toFixed(2)}`
                          : `+${currSym}${creditNote.withholdingAmount.toFixed(2)}`}
                      </span>
                    </div>
                  )
                )}
                {creditNote.roundOff !== undefined && (
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Round Off</span>
                    <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                      {creditNote.roundOff > 0 ? `+${currSym}${creditNote.roundOff.toFixed(2)}` : creditNote.roundOff < 0 ? `-${currSym}${Math.abs(creditNote.roundOff).toFixed(2)}` : `${currSym}0.00`}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-2 text-base font-bold border-t-2 border-slate-900 dark:border-slate-100 text-slate-900 dark:text-white">
                  <span>Net Credit Note Amount:</span>
                  <span className="text-blue-600 dark:text-blue-400 tabular-nums">{currSym}{creditNote.grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Statutory Declaration & Signature */}
            <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex justify-between items-end text-xs">
              <div className="max-w-md text-[11px] text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700 dark:text-slate-300">GST Declaration:</p>
                <p>We declare that this Credit Note shows the actual tax liability adjusted as per Section 34 of the CGST Act, 2017 and related rules.</p>
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
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              HSN / SAC Tax Liability Summary (GSTR-1 Table 9B)
            </h3>
            <div className="border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                    <TableHead className="text-xs font-bold">HSN/SAC</TableHead>
                    <TableHead className="text-right text-xs font-bold">Taxable Value ({currSym})</TableHead>
                    <TableHead className="text-right text-xs font-bold">CGST ({currSym})</TableHead>
                    <TableHead className="text-right text-xs font-bold">SGST ({currSym})</TableHead>
                    <TableHead className="text-right text-xs font-bold">IGST ({currSym})</TableHead>
                    <TableHead className="text-right text-xs font-bold">Total Tax ({currSym})</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {creditNote.items.map((it, i) => {
                    const totalTax = it.cgst + it.sgst + it.igst
                    return (
                      <TableRow key={i}>
                        <TableCell className="text-xs font-medium tabular-nums text-slate-700 dark:text-slate-300">{it.hsn || "8471"}</TableCell>
                        <TableCell className="text-right text-xs tabular-nums">{currSym}{it.amount.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-xs tabular-nums">{currSym}{it.cgst.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-xs tabular-nums">{currSym}{it.sgst.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-xs tabular-nums">{currSym}{it.igst.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-xs font-bold tabular-nums">{currSym}{totalTax.toFixed(2)}</TableCell>
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

