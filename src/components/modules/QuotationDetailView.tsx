"use client"

import React, { useState } from "react"
import { Quotation, FormPrintSettings, DEFAULT_FORM_PRINT_SETTINGS_BASE, DEFAULT_FORM_PRINT_SETTINGS_MAP } from "@/types/inventory"
import { useApp } from "@/context/AppContext"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { 
  FileSpreadsheet, 
  Printer, 
  Download, 
  Share2, 
  ShoppingBag, 
  Receipt, 
  X, 
  Package, 
  CheckCircle2, 
  Clock, 
  Calendar,
  Building2,
  Info,
  Layers,
  ArrowRight,
  AlertTriangle,
  QrCode,
  Landmark
} from "lucide-react"
import { formatINR } from "@/lib/utils"
import { DetailActionsMenu } from "@/components/ui/detail-actions-menu"

interface QuotationDetailViewProps {
  quotation: Quotation
  onClose: () => void
  onConvertToOrder: (quotationId: string) => void
  onConvertToInvoice: (quotationId: string) => void
  onEdit?: () => void
  onDelete?: () => void
}

import { getStateNameFromCode } from "@/lib/gstConstants"

export function QuotationDetailView({ 
  quotation, 
  onClose, 
  onConvertToOrder, 
  onConvertToInvoice,
  onEdit,
  onDelete
}: QuotationDetailViewProps) {
  const { business, parties, deleteQuotation, gstSettings, formPrintSettings, formCustomColumns } = useApp()
  const printConfig: FormPrintSettings = formPrintSettings?.quotation || DEFAULT_FORM_PRINT_SETTINGS_MAP.quotation || DEFAULT_FORM_PRINT_SETTINGS_BASE
  const customColumns = (formCustomColumns?.quotation || []).filter(c => c.isEnabled !== false)
  const [activeTab, setActiveTab] = useState<"preview" | "items" | "history">("preview")

  const party = parties.find(p => p.id === quotation.partyId || (p.name && quotation.partyName && p.name.trim().toLowerCase() === quotation.partyName.trim().toLowerCase()))
  const currSym = quotation.currencySymbol || party?.currencySymbol || (quotation.currency === "USD" ? "$" : "₹")
  const isConverted = quotation.status === "converted"
  const isExpired = quotation.status === "expired" || (quotation.validTillDate && new Date(quotation.validTillDate) < new Date())

  const totalQuantity = quotation.items.reduce((sum, item) => sum + item.qty, 0)

  const formatAmountWords = (num: number) => {
    return `${quotation.currency || "INR"} ${Math.round(num).toLocaleString("en-US")} Only`
  }

  const getStatusBadge = (status: Quotation["status"]) => {
    switch (status) {
      case "converted":
        return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800"
      case "accepted":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
      case "sent":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800"
      case "rejected":
      case "expired":
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
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                Quotation {quotation.quotationNo}
              </h1>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${getStatusBadge(quotation.status)}`}>
                {quotation.status.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Customer: <span className="font-semibold text-slate-700 dark:text-slate-300">{quotation.partyName}</span> • Date: {quotation.date} • Valid Till: <span className={isExpired ? "text-rose-600 font-semibold" : "font-medium"}>{quotation.validTillDate}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {!isConverted && (
            <>
              <Button
                size="sm"
                onClick={() => onConvertToOrder(quotation.id)}
                className="h-8 px-3.5 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-2xs rounded-md"
                title="Convert this approved quotation into a Sales Order"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                <span>Convert to Order</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onConvertToInvoice(quotation.id)}
                className="h-8 px-3 text-xs gap-1.5 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold"
                title="Convert this quotation directly into a Commercial Tax Invoice"
              >
                <Receipt className="h-3.5 w-3.5" />
                <span>Convert to Invoice</span>
              </Button>
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
            onClick={() => alert(`Downloading PDF for Quotation ${quotation.quotationNo}`)}
            className="h-8 px-3 text-xs gap-1.5 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Download className="h-3.5 w-3.5" />
            <span>PDF</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => alert(`WhatsApp quotation proposal sent to ${quotation.partyName}`)}
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
                deleteQuotation(quotation.id)
                onClose()
              }
            }}
            title="Delete Quotation"
            description={`Are you sure you want to delete Quotation ${quotation.quotationNo}? This estimate will be permanently removed.`}
            itemName={`${quotation.quotationNo} • ${quotation.partyName}`}
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
          QUOTATION PREVIEW
        </button>
        <button
          onClick={() => setActiveTab("items")}
          className={`py-3 text-xs font-semibold tracking-wide border-b-2 transition-colors ${
            activeTab === "items"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          ITEMS & TAX BREAKDOWN ({quotation.items.length})
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
            
            {/* Status notification banner if converted or expired */}
            {isConverted && (
              <div className="p-3.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-lg flex items-center justify-between text-xs text-purple-900 dark:text-purple-200 print:hidden no-print">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0" />
                  <span>This Quotation was converted into <strong>{quotation.convertedDocNo || "commercial document"}</strong>.</span>
                </div>
                <span className="font-semibold text-purple-700 dark:text-purple-300 uppercase text-[10px]">Closed</span>
              </div>
            )}

            {isExpired && !isConverted && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg flex items-center justify-between text-xs text-rose-900 dark:text-rose-200 print:hidden no-print">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>This Quotation passed its validity date ({quotation.validTillDate}). Prices may need revision.</span>
                </div>
                <span className="font-semibold text-rose-700 dark:text-rose-300 uppercase text-[10px]">Price Expired</span>
              </div>
            )}

            {/* Official Printable Quotation Document formatted to A4 Paper Dimensions */}
            <div className="printable-document-sheet w-full max-w-[210mm] min-h-[297mm] mx-auto bg-white dark:bg-slate-900 border border-slate-300/80 dark:border-slate-800 shadow-2xl rounded-xs p-[12mm] sm:p-[16mm] text-slate-800 dark:text-slate-100 flex flex-col justify-between print:shadow-none print:border-none print:p-0 print:max-w-none print:min-h-0 print:m-0 print:w-full">
              <div className="space-y-6">
              
              {/* Header: Company & Quotation Title */}
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
                    <p>{business.address}</p>
                    <p>State: {business.state} ({business.stateCode})</p>
                    <p className={printConfig.showGstin === false ? "print:hidden" : ""}>GSTIN: <span className="font-semibold text-slate-700 dark:text-slate-300">{business.gstin}</span></p>
                    <p className={printConfig.showBusinessContact === false ? "print:hidden" : ""}>Phone: {business.phone} • Email: {business.email}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-black text-blue-600 tracking-tight block">
                    ESTIMATE / QUOTATION
                  </span>
                  <div className="mt-3 text-xs space-y-1 text-slate-600 dark:text-slate-400">
                    <p>
                      <span className="text-slate-400">Quotation #: </span>
                      <span className="font-bold text-slate-900 dark:text-white">{quotation.quotationNo}</span>
                    </p>
                    <p>
                      <span className="text-slate-400">Estimate Date: </span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{quotation.date}</span>
                    </p>
                    <p className={printConfig.showDueDateAndTerms === false ? "print:hidden" : ""}>
                      <span className="text-slate-400">Valid Till: </span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{quotation.validTillDate}</span>
                    </p>
                    {gstSettings?.enablePlaceOfSupply && (
                      <p className={printConfig.showPlaceOfSupply === false ? "print:hidden" : ""}>
                        <span className="text-slate-400">Place of Supply: </span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {quotation.partyStateCode} {getStateNameFromCode(quotation.partyStateCode) ? `(${getStateNameFromCode(quotation.partyStateCode)})` : ""}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Proposed To & Dispatch Terms */}
              <div className="grid grid-cols-2 gap-8 py-6 border-b border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Proposed To (Buyer)
                  </span>
                  <div className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                    {quotation.partyName}
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 space-y-0.5">
                    <p>{party?.address || "Registered Address"}</p>
                    <p className={printConfig.showCustomerGstin === false ? "print:hidden" : ""}>GSTIN: <span className="font-semibold text-slate-700 dark:text-slate-300">{quotation.partyGstin || party?.gstin || "Unregistered"}</span></p>
                    <p>State: {party?.state || "Maharashtra"} ({quotation.partyStateCode || "27"})</p>
                    {party?.phone && <p className={printConfig.showBusinessContact === false ? "print:hidden" : ""}>Phone: {party.phone}</p>}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Dispatch & Terms
                  </span>
                  <div className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                    {quotation.godownName || "Main Warehouse"}
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 space-y-0.5">
                    <p className={printConfig.showDispatchAddress === false ? "print:hidden" : ""}><span className="text-slate-400">Dispatch Location: </span>{quotation.godownName || "Main Central Godown"}</p>
                    <p className={printConfig.showDueDateAndTerms === false ? "print:hidden" : ""}><span className="text-slate-400">Price Validity: </span><span className="font-medium text-slate-800 dark:text-slate-200">{quotation.validTillDate}</span></p>
                    <p><span className="text-slate-400">Document Type: </span>Formal Commercial Quotation</p>
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
                        <TableHead className="px-3 py-2.5 text-xs">ITEM & DESCRIPTION</TableHead>
                        <TableHead className={`px-3 py-2.5 text-xs ${printConfig.showHsnSac === false ? "print:hidden" : ""}`}>HSN/SAC</TableHead>
                        <TableHead className="px-3 py-2.5 text-right text-xs">QTY</TableHead>
                        <TableHead className="px-3 py-2.5 text-right text-xs">RATE</TableHead>
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
                        <TableHead className="px-3 py-2.5 text-right text-xs">AMOUNT</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quotation.items.map((line, idx) => (
                        <TableRow key={idx} className="border-b border-slate-100 dark:border-slate-800/60">
                          <TableCell className="px-3 py-3 text-center text-xs text-slate-400">{idx + 1}</TableCell>
                          <TableCell className="px-3 py-3 text-xs">
                            <div className="font-semibold text-slate-900 dark:text-white">{line.name}</div>
                          </TableCell>
                          <TableCell className={`px-3 py-3 text-xs tabular-nums text-slate-500 ${printConfig.showHsnSac === false ? "print:hidden" : ""}`}>{line.hsn || "—"}</TableCell>
                          <TableCell className="px-3 py-3 text-right text-xs font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                            {line.qty} {printConfig.showUnit !== false ? line.unit : ""}
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
                
                {/* Left Column: Instant UPI Payment & Notes */}
                <div className="space-y-4">
                  <div className={`p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 ${printConfig.showBankDetails === false ? "print:hidden" : ""}`}>
                    <div className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                      <QrCode className="h-4 w-4 text-blue-600" />
                      <span>Instant UPI Payment</span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 space-y-1">
                      <p><span className="text-slate-400">UPI ID: </span><span className="font-semibold text-slate-900 dark:text-white">{business.upiId}</span></p>
                      <p><span className="text-slate-400">Bank: </span>State Bank of India</p>
                      <p><span className="text-slate-400">A/C No: </span>398200192837</p>
                      <p><span className="text-slate-400">IFSC: </span>SBIN0001234</p>
                    </div>
                  </div>

                  <div className={printConfig.showAmountInWords === false ? "print:hidden" : ""}>
                    <span className="text-slate-400 block mb-1">Total in Words:</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 italic">
                      {formatAmountWords(quotation.grandTotal)}
                    </p>
                  </div>

                  {quotation.notes && (
                    <div className={printConfig.showCustomerNotes === false ? "print:hidden" : ""}>
                      <span className="text-slate-400 block mb-1 font-semibold uppercase text-[10px]">Commercial Notes:</span>
                      <p className="text-slate-600 dark:text-slate-300">{quotation.notes}</p>
                    </div>
                  )}
                </div>

                {/* Right Column: Totals Calculation */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{currSym}{quotation.subtotal.toFixed(2)}</span>
                  </div>
                  {quotation.cgstTotal !== undefined && quotation.cgstTotal > 0 && (
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">CGST</span>
                      <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{currSym}{quotation.cgstTotal.toFixed(2)}</span>
                    </div>
                  )}
                  {quotation.sgstTotal !== undefined && quotation.sgstTotal > 0 && (
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">SGST</span>
                      <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{currSym}{quotation.sgstTotal.toFixed(2)}</span>
                    </div>
                  )}
                  {quotation.igstTotal !== undefined && quotation.igstTotal > 0 && (
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">IGST</span>
                      <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{currSym}{quotation.igstTotal.toFixed(2)}</span>
                    </div>
                  )}
                  {quotation.additionalCharges && quotation.additionalCharges.length > 0 ? (
                    quotation.additionalCharges.map((ch, idx) => (
                      <div key={idx} className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500">{ch.name || "Additional Charge"}</span>
                        <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                          {ch.amount > 0 ? `+${currSym}${ch.amount.toFixed(2)}` : `-${currSym}${Math.abs(ch.amount).toFixed(2)}`}
                        </span>
                      </div>
                    ))
                  ) : (
                    quotation.adjustment !== undefined && quotation.adjustment !== 0 && (
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500">{quotation.adjustmentLabel || "Additional Charge"}</span>
                        <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                          {quotation.adjustment > 0 ? `+${currSym}${quotation.adjustment.toFixed(2)}` : `-${currSym}${Math.abs(quotation.adjustment).toFixed(2)}`}
                        </span>
                      </div>
                    )
                  )}
                  {quotation.withholdingAmount !== undefined && quotation.withholdingAmount > 0 && (
                    ((quotation.withholdingType === "TDS" && gstSettings?.enableTds) ||
                     (quotation.withholdingType === "TCS" && gstSettings?.enableTcs)) && (
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500">
                          {quotation.withholdingType} {quotation.withholdingRate ? `(${quotation.withholdingRate}%)` : ""}
                        </span>
                        <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                          {quotation.withholdingType === "TDS"
                            ? `-${currSym}${quotation.withholdingAmount.toFixed(2)}`
                            : `+${currSym}${quotation.withholdingAmount.toFixed(2)}`}
                        </span>
                      </div>
                    )
                  )}
                  {quotation.roundOff !== undefined && (
                    <div className={`flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 ${printConfig.showRoundOff === false ? "print:hidden" : ""}`}>
                      <span className="text-slate-500">Round Off</span>
                      <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                        {quotation.roundOff > 0 ? `+${currSym}${quotation.roundOff.toFixed(2)}` : quotation.roundOff < 0 ? `-${currSym}${Math.abs(quotation.roundOff).toFixed(2)}` : `${currSym}0.00`}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 text-base font-bold border-b-2 border-slate-900 dark:border-slate-100">
                    <span className="text-slate-900 dark:text-white">Total Estimated Value</span>
                    <span className="text-blue-600 dark:text-blue-400 tabular-nums">{currSym}{quotation.grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              </div>

              {/* Document Footer: Terms & Signature at the bottom of A4 page */}
              <div className="mt-auto pt-8 flex justify-between items-end text-xs text-slate-500">
                <div className={printConfig.showTermsConditions === false ? "print:hidden" : ""}>
                  <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Terms & Conditions:</p>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 whitespace-pre-line max-w-md font-mono">
                    {quotation.terms || "1. Rates valid till specified expiry date.\n2. Payment terms as agreed.\n3. Goods dispatched upon purchase order confirmation."}
                  </div>
                </div>

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
        )}

        {activeTab === "items" && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                Items Tax Breakdown Table
              </h3>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-800">
                    <TableHead className="text-xs">Item Name</TableHead>
                    <TableHead className="text-right text-xs">Qty</TableHead>
                    <TableHead className="text-right text-xs">Taxable ({currSym})</TableHead>
                    <TableHead className="text-right text-xs">CGST ({currSym})</TableHead>
                    <TableHead className="text-right text-xs">SGST ({currSym})</TableHead>
                    <TableHead className="text-right text-xs">IGST ({currSym})</TableHead>
                    <TableHead className="text-right text-xs">Total ({currSym})</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotation.items.map((it, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="text-xs font-semibold">{it.name}</TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{it.qty} {it.unit}</TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{currSym}{it.taxableAmount.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{currSym}{it.cgst.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{currSym}{it.sgst.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{currSym}{it.igst.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-xs font-bold tabular-nums">{currSym}{it.total.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Lifecycle & Activity History
              </h3>
              <div className="space-y-4 text-xs">
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold">1</div>
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">Quotation Created</div>
                    <div className="text-slate-500">Drafted on {quotation.date} by Sales Team</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 font-bold">2</div>
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">Sent to Customer</div>
                    <div className="text-slate-500">Dispatched via WhatsApp / Email to {quotation.partyName}</div>
                  </div>
                </div>

                {isConverted && (
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 font-bold">3</div>
                    <div>
                      <div className="font-semibold text-purple-700 dark:text-purple-300">Converted Document</div>
                      <div className="text-slate-500">Converted into {quotation.convertedDocType === "order" ? "Sales Order" : "Tax Invoice"} {quotation.convertedDocNo}</div>
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
