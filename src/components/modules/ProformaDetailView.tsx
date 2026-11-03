"use client"

import React, { useState } from "react"
import { ProformaInvoice, FormPrintSettings, DEFAULT_FORM_PRINT_SETTINGS_BASE, DEFAULT_FORM_PRINT_SETTINGS_MAP } from "@/types/inventory"
import { useApp } from "@/context/AppContext"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { 
  Receipt, 
  Printer, 
  Download, 
  Share2, 
  CreditCard, 
  X, 
  Package, 
  CheckCircle2, 
  Clock, 
  Calendar,
  Building2,
  Info,
  Layers,
  ArrowRight,
  Landmark,
  QrCode,
  AlertCircle
} from "lucide-react"
import { formatINR } from "@/lib/utils"
import { DetailActionsMenu } from "@/components/ui/detail-actions-menu"

interface ProformaDetailViewProps {
  proforma: ProformaInvoice
  onClose: () => void
  onConvertToInvoice: (proformaId: string) => void
  onRecordAdvance?: (proformaId: string) => void
  onEdit?: () => void
  onDelete?: () => void
}

import { getStateNameFromCode } from "@/lib/gstConstants"

export function ProformaDetailView({ 
  proforma, 
  onClose, 
  onConvertToInvoice, 
  onRecordAdvance,
  onEdit,
  onDelete
}: ProformaDetailViewProps) {
  const { business, parties, deleteProformaInvoice, gstSettings, formPrintSettings, formCustomColumns } = useApp()
  const printConfig: FormPrintSettings = formPrintSettings?.proforma || DEFAULT_FORM_PRINT_SETTINGS_MAP.proforma || DEFAULT_FORM_PRINT_SETTINGS_BASE
  const customColumns = (formCustomColumns?.proforma || []).filter(c => c.isEnabled !== false)
  const [activeTab, setActiveTab] = useState<"preview" | "advance" | "history">("preview")

  const party = parties.find(p => p.id === proforma.partyId || (p.name && proforma.partyName && p.name.trim().toLowerCase() === proforma.partyName.trim().toLowerCase()))
  const currSym = proforma.currencySymbol || party?.currencySymbol || (proforma.currency === "USD" ? "$" : "₹")
  const isInvoiced = proforma.status === "invoiced"
  const advanceReceived = proforma.advanceReceived || 0
  const advanceRequested = proforma.advanceRequested || 0
  const balanceToPay = Math.max(0, proforma.grandTotal - advanceReceived)

  const totalQuantity = proforma.items.reduce((sum, item) => sum + item.qty, 0)

  const formatAmountWords = (num: number) => {
    return `${proforma.currency || "INR"} ${Math.round(num).toLocaleString("en-US")} Only`
  }

  const getStatusBadge = (status: ProformaInvoice["status"]) => {
    switch (status) {
      case "invoiced":
        return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800"
      case "advance_received":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
      case "sent":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800"
      case "cancelled":
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800"
      default:
        return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
    }
  }

  return (
    <div className="relative flex flex-col h-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 overflow-hidden">
      
      {/* 1. Header Action Bar - Unified with current theme */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 print:hidden no-print">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                Proforma Invoice {proforma.proformaNo}
              </h1>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${getStatusBadge(proforma.status)}`}>
                {proforma.status.replace("_", " ").toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Customer: <span className="font-semibold text-slate-700 dark:text-slate-300">{proforma.partyName}</span> • Date: {proforma.date} • Due: {proforma.dueDate || "Immediate"}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {!isInvoiced && (
            <>
              <Button
                size="sm"
                onClick={() => onConvertToInvoice(proforma.id)}
                className="h-8 px-3.5 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-2xs rounded-md"
                title="Convert this Proforma into a final Commercial Tax Invoice with adjusted advances"
              >
                <Receipt className="h-3.5 w-3.5" />
                <span>Convert to Invoice</span>
              </Button>

              {onRecordAdvance && balanceToPay > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRecordAdvance(proforma.id)}
                  className="h-8 px-3 text-xs gap-1.5 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 font-semibold"
                  title="Record advance payment received against this Proforma"
                >
                  <CreditCard className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Record Advance</span>
                </Button>
              )}
            </>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="h-8 px-3 text-xs gap-1.5 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => alert(`Downloading PDF for Proforma Invoice ${proforma.proformaNo}`)}
            className="h-8 px-3 text-xs gap-1.5 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Download className="h-3.5 w-3.5" />
            <span>PDF</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => alert(`WhatsApp Proforma Invoice copy sent to ${proforma.partyName}`)}
            className="h-8 px-3 text-xs gap-1.5 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Share2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>WhatsApp</span>
          </Button>

          <DetailActionsMenu
            onEdit={onEdit}
            onDelete={() => {
              if (onDelete) {
                onDelete()
              } else {
                deleteProformaInvoice(proforma.id)
                onClose()
              }
            }}
            title="Delete Proforma Invoice"
            description={`Are you sure you want to delete Proforma Invoice ${proforma.proformaNo}? This action cannot be undone.`}
            itemName={`${proforma.proformaNo} • ${proforma.partyName}`}
          />

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-1"
            title="Close Detail View"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 2. Tabs Navigation */}
      <div className="flex items-center gap-8 px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 print:hidden no-print">
        <button
          onClick={() => setActiveTab("preview")}
          className={`py-3 text-xs font-semibold tracking-wide border-b-2 transition-colors ${
            activeTab === "preview"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          PROFORMA PREVIEW
        </button>
        <button
          onClick={() => setActiveTab("advance")}
          className={`py-3 text-xs font-semibold tracking-wide border-b-2 transition-colors ${
            activeTab === "advance"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          ADVANCE & PAYMENT REMITTANCE
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`py-3 text-xs font-semibold tracking-wide border-b-2 transition-colors ${
            activeTab === "history"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          TIMELINE & AUDIT LOG
        </button>
      </div>

      {/* 3. Main Body */}
      <div className={`flex-1 overflow-y-auto ${
        activeTab === "preview" 
          ? "p-4 sm:p-8 bg-slate-200/60 dark:bg-slate-950/80 flex justify-center items-start" 
          : "p-6 sm:p-8 bg-slate-50/60 dark:bg-slate-950/60"
      }`}>
        {activeTab === "preview" && (
          <div className="w-full max-w-[210mm] mx-auto space-y-4">
            
            {/* Advance Status Notification Card */}
            <div className={`p-4 rounded-xl border flex items-center justify-between text-xs print:hidden ${
              isInvoiced 
                ? "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200"
                : advanceReceived >= proforma.grandTotal
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                : advanceReceived > 0
                ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200"
                : "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200"
            }`}>
              <div className="flex items-center gap-2.5">
                <Info className="h-4 w-4 shrink-0" />
                <div>
                  <span className="font-bold">
                    {isInvoiced
                      ? `Final Tax Invoice Generated (${proforma.linkedInvoiceNo || "INV"}).`
                      : advanceReceived >= proforma.grandTotal
                      ? "Full 100% Advance Received! Ready for dispatch & Tax Invoicing."
                      : advanceReceived > 0
                      ? `Partial Advance of ₹${advanceReceived.toLocaleString("en-IN")} Received. Balance Due: ₹${balanceToPay.toLocaleString("en-IN")}`
                      : `Awaiting Advance Payment. Requested: ₹${(advanceRequested || proforma.grandTotal).toLocaleString("en-IN")}`}
                  </span>
                  <p className="text-[11px] opacity-80 mt-0.5">
                    Note: A Proforma Invoice does not register GST turnover until converted into a legal Tax Invoice.
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider block">Balance Payable</span>
                <span className="text-sm font-extrabold tabular-nums">{currSym}{balanceToPay.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Official Printable Proforma Invoice Document formatted to A4 Paper Dimensions */}
            <div className="printable-document-sheet w-full max-w-[210mm] min-h-[297mm] mx-auto bg-white dark:bg-slate-900 border border-slate-300/80 dark:border-slate-800 shadow-2xl rounded-xs p-[12mm] sm:p-[16mm] text-slate-800 dark:text-slate-100 flex flex-col justify-between print:shadow-none print:border-none print:p-0 print:max-w-none print:min-h-0 print:m-0 print:w-full">
              <div className="space-y-6">
              
              {/* Header: Company & Proforma Title */}
              <div className="flex justify-between items-start pb-6 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`h-7 w-7 rounded-md bg-blue-600 text-white font-black text-sm flex items-center justify-center ${printConfig.showLogo === false ? "print:hidden" : ""}`}>
                      AB
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {business.tradeName || business.name}
                    </h2>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5 mt-2">
                    <p className={printConfig.showDispatchAddress === false ? "print:hidden" : ""}>{business.address}</p>
                    <p>State: {business.state} ({business.stateCode})</p>
                    <p className={printConfig.showGstin === false ? "print:hidden" : ""}>GSTIN: <span className="font-semibold text-slate-700 dark:text-slate-300">{business.gstin}</span></p>
                    <p className={printConfig.showBusinessContact === false ? "print:hidden" : ""}>Phone: {business.phone} • Email: {business.email}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-black text-blue-600 tracking-tight block">
                    PROFORMA INVOICE
                  </span>
                  <div className="mt-3 text-xs space-y-1 text-slate-600 dark:text-slate-400">
                    <p>
                      <span className="text-slate-400">Proforma #: </span>
                      <span className="font-bold text-slate-900 dark:text-white">{proforma.proformaNo}</span>
                    </p>
                    <p>
                      <span className="text-slate-400">Proforma Date: </span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{proforma.date}</span>
                    </p>
                    <p className={printConfig.showDueDateAndTerms === false ? "print:hidden" : ""}>
                      <span className="text-slate-400">Payment Due: </span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{proforma.dueDate || "Upon Receipt"}</span>
                    </p>
                    {gstSettings?.enablePlaceOfSupply && (
                      <p className={printConfig.showPlaceOfSupply === false ? "print:hidden" : ""}>
                        <span className="text-slate-400">Place of Supply: </span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {proforma.partyStateCode || "27"} {getStateNameFromCode(proforma.partyStateCode || "27") ? `(${getStateNameFromCode(proforma.partyStateCode || "27")})` : ""}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Billed To & Dispatch Terms */}
              <div className="grid grid-cols-2 gap-8 py-6 border-b border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Billed To (Buyer)
                  </span>
                  <div className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                    {proforma.partyName}
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 space-y-0.5">
                    <p>{party?.address || "Registered Address"}</p>
                    <p className={printConfig.showCustomerGstin === false ? "print:hidden" : ""}>GSTIN: <span className="font-semibold text-slate-700 dark:text-slate-300">{proforma.partyGstin || party?.gstin || "Unregistered"}</span></p>
                    <p>State: {party?.state || "Maharashtra"} ({proforma.partyStateCode || "27"})</p>
                    {party?.phone && <p className={printConfig.showBusinessContact === false ? "print:hidden" : ""}>Phone: {party.phone}</p>}
                  </div>
                </div>

                <div className={printConfig.showShippingAddress === false ? "print:hidden" : ""}>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Dispatch &amp; Terms
                  </span>
                  <div className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                    {proforma.godownName || "Main Warehouse"}
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 space-y-0.5">
                    <p className={printConfig.showDispatchAddress === false ? "print:hidden" : ""}><span className="text-slate-400">Dispatch Location: </span>{proforma.godownName || "Main Central Godown"}</p>
                    <p><span className="text-slate-400">Payment Due: </span><span className="font-medium text-slate-800 dark:text-slate-200">{proforma.dueDate || "Upon Receipt"}</span></p>
                    <p><span className="text-slate-400">Document Type: </span>Commercial Proforma Invoice</p>
                  </div>
                </div>
              </div>

              {/* Items Table using atom Table */}
              <div className="py-6">
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                        <TableHead className="w-10 px-3 py-2.5 text-center text-xs">#</TableHead>
                        <TableHead className="px-3 py-2.5 text-xs">ITEM &amp; DESCRIPTION</TableHead>
                        <TableHead className={`px-3 py-2.5 text-xs ${printConfig.showHsnSac === false ? "print:hidden" : ""}`}>HSN/SAC</TableHead>
                        <TableHead className="px-3 py-2.5 text-right text-xs">QTY</TableHead>
                        <TableHead className="px-3 py-2.5 text-right text-xs">RATE ({currSym})</TableHead>
                        <TableHead className={`px-3 py-2.5 text-right text-xs ${printConfig.showItemDiscount === false ? "print:hidden" : ""}`}>DISC %</TableHead>
                        <TableHead className={`px-3 py-2.5 text-right text-xs ${printConfig.showTaxRate === false ? "print:hidden" : ""}`}>TAX %</TableHead>
                        {customColumns.map(col => (
                          <TableHead 
                            key={col.id} 
                            className={`px-3 py-2.5 text-center text-xs uppercase font-medium text-slate-700 dark:text-slate-300 ${col.printOnPaper === false ? "print:hidden" : ""}`}
                          >
                            {col.name}
                          </TableHead>
                        ))}
                        <TableHead className="px-3 py-2.5 text-right text-xs">AMOUNT ({currSym})</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {proforma.items.map((line, idx) => (
                        <TableRow key={idx} className="border-b border-slate-100 dark:border-slate-800/60">
                          <TableCell className="px-3 py-3 text-center text-xs text-slate-400">{idx + 1}</TableCell>
                          <TableCell className="px-3 py-3 text-xs">
                            <div className="font-semibold text-slate-900 dark:text-white">{line.name}</div>
                          </TableCell>
                          <TableCell className={`px-3 py-3 text-xs tabular-nums text-slate-500 ${printConfig.showHsnSac === false ? "print:hidden" : ""}`}>{line.hsn || "—"}</TableCell>
                          <TableCell className="px-3 py-3 text-right text-xs font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                            {line.qty} {printConfig.showUnit === false ? <span className="print:hidden">{line.unit}</span> : line.unit}
                          </TableCell>
                          <TableCell className="px-3 py-3 text-right text-xs tabular-nums text-slate-800 dark:text-slate-200">
                            {currSym}{line.rate.toFixed(2)}
                          </TableCell>
                          <TableCell className={`px-3 py-3 text-right text-xs tabular-nums text-slate-500 ${printConfig.showItemDiscount === false ? "print:hidden" : ""}`}>
                            {line.discountPercent > 0 ? `${line.discountPercent}%` : "—"}
                          </TableCell>
                          <TableCell className={`px-3 py-3 text-right text-xs tabular-nums text-slate-500 ${printConfig.showTaxRate === false ? "print:hidden" : ""}`}>
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
              </div>

              {/* Calculations & Summary Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2 pb-6 border-b border-slate-200 dark:border-slate-800 text-xs">
                
                {/* Left Column: Bank Details & UPI */}
                <div className="space-y-4">
                  <div className={`p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 ${printConfig.showBankDetails === false ? "print:hidden" : ""}`}>
                    <div className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                      <QrCode className="h-4 w-4 text-blue-600" />
                      <span>Instant UPI / Bank Remittance</span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 space-y-1">
                      <p><span className="text-slate-400">UPI ID: </span><span className="font-semibold text-slate-900 dark:text-white">{business.upiId || "apexglobal@okaxis"}</span></p>
                      <p><span className="text-slate-400">Bank: </span>State Bank of India</p>
                      <p><span className="text-slate-400">A/C No: </span>398200192837</p>
                      <p><span className="text-slate-400">IFSC: </span>SBIN0001234</p>
                      {proforma.bankDetails && (
                        <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-700">{proforma.bankDetails}</p>
                      )}
                    </div>
                  </div>

                  <div className={printConfig.showAmountInWords === false ? "print:hidden" : ""}>
                    <span className="text-slate-400 block mb-1">Total in Words:</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 italic">
                      {formatAmountWords(proforma.grandTotal)}
                    </p>
                  </div>

                  {proforma.notes && (
                    <div className={printConfig.showCustomerNotes === false ? "print:hidden" : ""}>
                      <span className="text-slate-400 block mb-1 font-semibold uppercase text-[10px]">Commercial Notes:</span>
                      <p className="text-slate-600 dark:text-slate-300">{proforma.notes}</p>
                    </div>
                  )}
                </div>

                {/* Right Column: Totals Calculation */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{currSym}{proforma.subtotal.toFixed(2)}</span>
                  </div>
                  {proforma.cgstTotal !== undefined && proforma.cgstTotal > 0 && (
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">CGST</span>
                      <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{currSym}{proforma.cgstTotal.toFixed(2)}</span>
                    </div>
                  )}
                  {proforma.sgstTotal !== undefined && proforma.sgstTotal > 0 && (
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">SGST</span>
                      <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{currSym}{proforma.sgstTotal.toFixed(2)}</span>
                    </div>
                  )}
                  {proforma.igstTotal !== undefined && proforma.igstTotal > 0 && (
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">IGST</span>
                      <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{currSym}{proforma.igstTotal.toFixed(2)}</span>
                    </div>
                  )}
                  {proforma.additionalCharges && proforma.additionalCharges.length > 0 ? (
                    proforma.additionalCharges.map((ch, idx) => (
                      <div key={idx} className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500">{ch.name || "Additional Charge"}</span>
                        <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                          {ch.amount > 0 ? `+${currSym}${ch.amount.toFixed(2)}` : `-${currSym}${Math.abs(ch.amount).toFixed(2)}`}
                        </span>
                      </div>
                    ))
                  ) : (
                    proforma.adjustment !== undefined && proforma.adjustment !== 0 && (
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500">{proforma.adjustmentLabel || "Additional Charge"}</span>
                        <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                          {proforma.adjustment > 0 ? `+${currSym}${proforma.adjustment.toFixed(2)}` : `-${currSym}${Math.abs(proforma.adjustment).toFixed(2)}`}
                        </span>
                      </div>
                    )
                  )}
                  {proforma.withholdingAmount !== undefined && proforma.withholdingAmount > 0 && (
                    ((proforma.withholdingType === "TDS" && gstSettings?.enableTds) ||
                     (proforma.withholdingType === "TCS" && gstSettings?.enableTcs)) && (
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500">
                          {proforma.withholdingType} {proforma.withholdingRate ? `(${proforma.withholdingRate}%)` : ""}
                        </span>
                        <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                          {proforma.withholdingType === "TDS"
                            ? `-${currSym}${proforma.withholdingAmount.toFixed(2)}`
                            : `+${currSym}${proforma.withholdingAmount.toFixed(2)}`}
                        </span>
                      </div>
                    )
                  )}
                  {proforma.roundOff !== undefined && (
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">Round Off</span>
                      <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                        {proforma.roundOff > 0 ? `+${currSym}${proforma.roundOff.toFixed(2)}` : proforma.roundOff < 0 ? `-${currSym}${Math.abs(proforma.roundOff).toFixed(2)}` : `${currSym}0.00`}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 text-base font-bold border-b-2 border-slate-900 dark:border-slate-100">
                    <span className="text-slate-900 dark:text-white">Total Proforma Value</span>
                    <span className="text-blue-600 dark:text-blue-400 tabular-nums">{currSym}{proforma.grandTotal.toFixed(2)}</span>
                  </div>

                  <div className="pt-2 flex justify-between text-xs">
                    <span className="text-slate-500">Advance Requested:</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
                      {currSym}{(advanceRequested || proforma.grandTotal).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Advance Received:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      - {currSym}{advanceReceived.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs font-bold pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-amber-600 dark:text-amber-400">Balance Due:</span>
                    <span className="text-amber-600 dark:text-amber-400 tabular-nums">
                      {currSym}{balanceToPay.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              </div>

              {/* Document Footer: Terms & Signature at the bottom of A4 page */}
              <div className="mt-auto pt-8 flex justify-between items-end text-xs text-slate-500">
                <div className={printConfig.showTermsConditions === false ? "print:hidden" : ""}>
                  <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Terms &amp; Conditions:</p>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 whitespace-pre-line max-w-md font-mono">
                    {proforma.terms || "1. Proforma Invoice is issued for advance remittance purposes.\n2. Final Tax Invoice will be issued upon dispatch.\n3. Goods dispatch is subject to receipt of advance payment."}
                  </div>
                </div>

                <div className="flex items-end gap-8">
                  {printConfig.showReceiverSignature && (
                    <div className="text-center print:block hidden">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 mb-12">
                        Receiver's Acknowledgment
                      </div>
                      <div className="border-t border-slate-300 dark:border-slate-700 pt-1 text-[11px]">
                        Receiver's Signature &amp; Stamp
                      </div>
                    </div>
                  )}

                  <div className={`text-center ${printConfig.showAuthorizedSignature === false ? "print:hidden" : ""}`}>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 mb-12">
                      For {business.name}
                    </div>
                    <div className="border-t border-slate-300 dark:border-slate-700 pt-1 text-[11px]">
                      Authorized Signatory
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {activeTab === "advance" && (
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Advance Remittance Status & History
              </h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <span className="text-xs text-slate-500 block">Total Proforma Value</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white mt-1 block">
                    {currSym}{proforma.grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg">
                  <span className="text-xs text-emerald-600 block">Advance Received</span>
                  <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300 mt-1 block">
                    {currSym}{advanceReceived.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-lg">
                  <span className="text-xs text-amber-600 block">Balance Pending</span>
                  <span className="text-lg font-bold text-amber-700 dark:text-amber-300 mt-1 block">
                    {currSym}{balanceToPay.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {advanceReceived > 0 ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Advance payment confirmed. When converting to Tax Invoice, this advance will automatically be credited against invoice payable amount.</span>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>No advance payment recorded yet. Share Proforma copy with buyer to request advance clearance.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Proforma Lifecycle & Timeline
              </h3>
              <div className="space-y-4 text-xs">
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold">1</div>
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">Proforma Generated</div>
                    <div className="text-slate-500">Drafted on {proforma.date} for {proforma.partyName}</div>
                  </div>
                </div>

                {advanceReceived > 0 && (
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 font-bold">2</div>
                    <div>
                      <div className="font-semibold text-emerald-700 dark:text-emerald-300">Advance Received</div>
                      <div className="text-slate-500">Amount: {currSym}{advanceReceived.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} acknowledged</div>
                    </div>
                  </div>
                )}

                {isInvoiced && (
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 font-bold">3</div>
                    <div>
                      <div className="font-semibold text-purple-700 dark:text-purple-300">Final Tax Invoice Raised</div>
                      <div className="text-slate-500">Tax Invoice {proforma.linkedInvoiceNo} created and physical stock deducted</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
