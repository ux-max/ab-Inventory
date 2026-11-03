"use client"

import React, { useState } from "react"
import { PurchaseDocument, FormPrintSettings, DEFAULT_FORM_PRINT_SETTINGS_BASE, DEFAULT_FORM_PRINT_SETTINGS_MAP } from "@/types/inventory"
import { useApp } from "@/context/AppContext"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Select } from "@/components/ui/select"
import { 
  ShoppingBag, 
  Edit3, 
  Printer, 
  Warehouse, 
  X, 
  Building2, 
  CheckCircle2, 
  CreditCard,
  Clock,
  Layers,
  AlertCircle
} from "lucide-react"

import { DetailActionsMenu } from "@/components/ui/detail-actions-menu"

interface BillDetailViewProps {
  bill: PurchaseDocument
  onClose: () => void
  onEdit?: () => void
  onDelete?: () => void
}

import { getStateNameFromCode } from "@/lib/gstConstants"

export function BillDetailView({ bill, onClose, onEdit, onDelete }: BillDetailViewProps) {
  const { parties, business, recordPayment, deletePurchaseBill, gstSettings, formPrintSettings, formCustomColumns } = useApp()
  const printConfig: FormPrintSettings = formPrintSettings?.bill || DEFAULT_FORM_PRINT_SETTINGS_MAP.bill || DEFAULT_FORM_PRINT_SETTINGS_BASE
  const customColumns = (formCustomColumns?.bill || []).filter(c => c.isEnabled !== false)
  const [activeTab, setActiveTab] = useState<"preview" | "payments" | "history">("preview")

  // Record Payment Out Drawer State
  const [isPaymentDrawerOpen, setIsPaymentDrawerOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split("T")[0])
  const [paymentMode, setPaymentMode] = useState<"cash" | "upi" | "bank" | "cheque" | "card">("bank")
  const [paymentAccount, setPaymentAccount] = useState("HDFC Current A/c (..4029)")
  const [paymentRefNo, setPaymentRefNo] = useState("")
  const [paymentNotes, setPaymentNotes] = useState("")
  const [drawerError, setDrawerError] = useState<string | null>(null)
  const [drawerSuccess, setDrawerSuccess] = useState<string | null>(null)

  const vendor = parties.find(p => p.id === bill.partyId || p.name === bill.partyName)
  const balanceDue = Math.max(0, bill.grandTotal - (bill.paidAmount || 0))
  const isUnpaidOrPartial = balanceDue > 0 || bill.status === "pending"

  const currSym = bill.currencySymbol || vendor?.currencySymbol || "₹"
  const currCode = bill.currency || vendor?.currency || "INR"

  const isGstEnabled = Boolean(gstSettings?.enableGst)
  const isItcOptionEnabled = isGstEnabled && (gstSettings?.enableItc !== false)
  const isRcmOptionEnabled = isGstEnabled && (gstSettings?.enableRcm !== false)
  const effectiveIsRcm = isRcmOptionEnabled && Boolean(bill.isRcm)

  // Number to Indian/Foreign words helper for clear presentation
  const formatAmountWords = (num: number) => {
    if (currCode !== "INR") {
      return `${currCode} ${Math.round(num).toLocaleString()} Only`
    }
    return `Indian Rupees ${Math.round(num).toLocaleString("en-IN")} Only`
  }

  const openPaymentDrawer = () => {
    setPaymentAmount(String(balanceDue > 0 ? balanceDue : bill.grandTotal))
    setPaymentDate(new Date().toISOString().split("T")[0])
    setPaymentMode("bank")
    setPaymentAccount("HDFC Current A/c (..4029)")
    setPaymentRefNo("")
    setPaymentNotes(`Payment made against bill ${bill.docNo}`)
    setDrawerError(null)
    setDrawerSuccess(null)
    setIsPaymentDrawerOpen(true)
  }

  const handleSavePayment = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setDrawerError(null)

    const parsedAmount = parseFloat(paymentAmount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setDrawerError(`Please enter a valid payment amount greater than ${currSym}0.`)
      return
    }

    const res = recordPayment({
      type: "payment_out",
      partyId: bill.partyId,
      partyName: bill.partyName,
      amount: parsedAmount,
      currency: currCode,
      currencySymbol: currSym,
      exchangeRate: bill.exchangeRate,
      date: paymentDate,
      paymentMode,
      paidFromAccount: paymentAccount,
      referenceNo: paymentRefNo.trim() || undefined,
      docId: bill.id,
      docNo: bill.docNo,
      notes: paymentNotes.trim() || undefined,
      status: "completed"
    })

    if (res.success) {
      setDrawerSuccess(res.message)
      setTimeout(() => {
        setIsPaymentDrawerOpen(false)
        setDrawerSuccess(null)
      }, 700)
    } else {
      setDrawerError(res.message)
    }
  }

  return (
    <div className="relative flex flex-col h-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 overflow-hidden">
      
      {/* 1. Header Action Bar */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 print:hidden no-print">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                Bill {bill.docNo}
              </h1>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                balanceDue === 0 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                  : (bill.paidAmount || 0) > 0
                  ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800"
                  : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
              }`}>
                {balanceDue === 0 ? "PAID" : (bill.paidAmount || 0) > 0 ? "PARTIAL" : "PENDING"}
              </span>
              {(bill.isCredit || bill.paymentMode === "credit") && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800 flex items-center gap-1">
                  <CreditCard className="h-3 w-3" />
                  Vendor Credit
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Vendor: <span className="font-semibold text-slate-700 dark:text-slate-300">{bill.partyName}</span> • Date: {bill.date}
              {bill.dueDate && (
                <span className="ml-2 font-medium text-rose-600 dark:text-rose-400">• Due: {bill.dueDate}</span>
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Primary Record Payment Button for Vendor Bills */}
          {isUnpaidOrPartial && (
            <Button
              size="sm"
              onClick={openPaymentDrawer}
              className="h-8 px-3.5 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-2xs rounded-md"
            >
              <CreditCard className="h-3.5 w-3.5" />
              <span>Record Payment</span>
            </Button>
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

          <DetailActionsMenu
            onEdit={onEdit}
            onDelete={() => {
              if (onDelete) {
                onDelete()
              } else {
                deletePurchaseBill(bill.id)
                onClose()
              }
            }}
            title="Delete Purchase Bill"
            description={`Are you sure you want to delete Bill ${bill.docNo}? This action cannot be undone.`}
            itemName={`${bill.docNo} • ${bill.partyName}`}
          />

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
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
          Bill Preview
        </button>
        <button
          onClick={() => setActiveTab("payments")}
          className={`py-3 text-xs font-semibold tracking-wide border-b-2 transition-colors ${
            activeTab === "payments"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          Payment & Stock Location
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`py-3 text-xs font-semibold tracking-wide border-b-2 transition-colors ${
            activeTab === "history"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          Audit History
        </button>
      </div>

      {/* 3. Tab Contents */}
      <div className={`flex-1 overflow-y-auto ${
        activeTab === "preview" 
          ? "p-4 sm:p-8 bg-slate-200/60 dark:bg-slate-950/80 flex justify-center items-start" 
          : "p-6 sm:p-8 bg-slate-50/60 dark:bg-slate-950/60"
      }`}>
        
        {/* Bill Preview formatted to authentic A4 Paper Dimensions */}
        {activeTab === "preview" && (
          <div className="printable-document-sheet w-full max-w-[210mm] min-h-[297mm] mx-auto bg-white dark:bg-slate-900 border border-slate-300/80 dark:border-slate-800 shadow-2xl rounded-xs p-[12mm] sm:p-[16mm] text-slate-800 dark:text-slate-100 flex flex-col justify-between print:shadow-none print:border-none print:p-0 print:max-w-none print:min-h-0 print:m-0 print:w-full">
            <div className="space-y-6">
            
            {/* Document Header */}
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
                <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight block">
                  PURCHASE BILL
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mt-0.5">
                  Inward Vendor Receipt
                </span>
                
                <div className="mt-3 text-xs space-y-1 text-slate-600 dark:text-slate-400">
                  <p>
                    <span className="text-slate-400">Bill #: </span>
                    <span className="font-bold text-slate-900 dark:text-white">{bill.docNo}</span>
                  </p>
                  <p>
                    <span className="text-slate-400">Bill Date: </span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{bill.date}</span>
                  </p>
                  {bill.dueDate && (
                    <p>
                      <span className="text-slate-400">Payment Due: </span>
                      <span className="font-semibold text-rose-600 dark:text-rose-400">{bill.dueDate}</span>
                    </p>
                  )}
                  {bill.creditTerms && (
                    <p>
                      <span className="text-slate-400">Credit Terms: </span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{bill.creditTerms}</span>
                    </p>
                  )}
                  <p>
                    <span className="text-slate-400">Destination: </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{bill.godownName || "Main Godown"}</span>
                  </p>
                  {gstSettings?.enablePlaceOfSupply && bill.partyStateCode && (
                    <p>
                      <span className="text-slate-400">Place of Supply: </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {bill.partyStateCode} {getStateNameFromCode(bill.partyStateCode) ? `(${getStateNameFromCode(bill.partyStateCode)})` : ""}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Vendor & Receiving Details */}
            <div className="grid grid-cols-2 gap-8 py-5 border-b border-slate-200 dark:border-slate-800 text-xs">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Vendor / Supplier Details
                </span>
                <div className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                  {bill.partyName}
                </div>
                <div className="text-slate-600 dark:text-slate-400 space-y-0.5">
                  <p>{vendor?.address || "Supplier Address"}</p>
                  <p>GSTIN: <span className="font-semibold text-slate-700 dark:text-slate-300">{bill.partyGstin || vendor?.gstin || "Unregistered"}</span></p>
                  <p>Phone: {vendor?.phone || "N/A"}</p>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Receiving Details
                </span>
                <div className="text-slate-600 dark:text-slate-400 space-y-1">
                  <p><span className="text-slate-400">Receiving Godown: </span><span className="font-semibold text-slate-800 dark:text-slate-200">{bill.godownName || "Main Warehouse"}</span></p>
                  <p><span className="text-slate-400">Recorded By: </span><span className="font-medium text-slate-800 dark:text-slate-200">{bill.createdBy}</span></p>
                  <p><span className="text-slate-400">Total Items: </span><span className="font-medium text-slate-800 dark:text-slate-200">{bill.items.length} Lines</span></p>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="py-6">
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                      <TableHead className="w-10 px-3 py-2.5 text-center text-xs">#</TableHead>
                      <TableHead className="px-3 py-2.5 text-xs">ITEM &amp; SPECIFICATION</TableHead>
                      <TableHead className={`px-3 py-2.5 text-xs ${printConfig.showHsnSac === false ? "print:hidden" : ""}`}>HSN</TableHead>
                      <TableHead className="px-3 py-2.5 text-right text-xs">QTY</TableHead>
                      <TableHead className="px-3 py-2.5 text-right text-xs">RATE</TableHead>
                      <TableHead className={`px-3 py-2.5 text-right text-xs ${printConfig.showTaxRate === false ? "print:hidden" : ""}`}>GST %</TableHead>
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
                    {bill.items.map((itm, idx) => (
                      <TableRow key={idx} className="border-b border-slate-100 dark:border-slate-800/60">
                        <TableCell className="px-3 py-3 text-center text-xs text-slate-400">{idx + 1}</TableCell>
                        <TableCell className="px-3 py-3 text-xs">
                          <div className="font-semibold text-slate-900 dark:text-white">{itm.name}</div>
                          {itm.batchNo && (
                            <div className="text-[11px] text-slate-500">
                              Batch: {itm.batchNo} {itm.expiryDate ? `• Exp: ${itm.expiryDate}` : ""}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className={`px-3 py-3 text-xs tabular-nums text-slate-500 ${printConfig.showHsnSac === false ? "print:hidden" : ""}`}>{itm.hsn || "8471"}</TableCell>
                        <TableCell className="px-3 py-3 text-right text-xs font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                          {itm.qty} {printConfig.showUnit === false ? <span className="print:hidden">{itm.unit}</span> : itm.unit}
                        </TableCell>
                        <TableCell className="px-3 py-3 text-right text-xs tabular-nums text-slate-800 dark:text-slate-200">
                          {currSym}{itm.rate.toFixed(2)}
                        </TableCell>
                        <TableCell className={`px-3 py-3 text-right text-xs tabular-nums text-slate-500 ${printConfig.showTaxRate === false ? "print:hidden" : ""}`}>
                          {itm.gstRate !== undefined ? itm.gstRate : 18}%
                        </TableCell>
                        {customColumns.map(col => (
                          <TableCell 
                            key={col.id} 
                            className={`px-3 py-3 text-center text-xs text-slate-700 dark:text-slate-300 ${col.printOnPaper === false ? "print:hidden" : ""}`}
                          >
                            {(itm as any).customColumns?.[col.id] || "—"}
                          </TableCell>
                        ))}
                        <TableCell className="px-3 py-3 text-right text-xs font-semibold tabular-nums text-slate-900 dark:text-white">
                          {currSym}{itm.total.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Total Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2 pb-6 border-b border-slate-200 dark:border-slate-800 text-xs">
              <div className="space-y-3">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                  Note: Goods received and verified against supplier delivery memo. Inward stock ledger credited.
                </p>
                {effectiveIsRcm && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-semibold text-[11px]">
                    <AlertCircle className="h-3.5 w-3.5 text-blue-600" />
                    <span>Reverse Charge Mechanism (RCM) Applied</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 block mb-1">Total in Words:</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 italic">
                    {formatAmountWords(bill.grandTotal)}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                    {currSym}{(bill.subtotal ?? (effectiveIsRcm ? bill.grandTotal : bill.grandTotal / 1.18)).toFixed(2)}
                  </span>
                </div>
                {isGstEnabled && (
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">
                      {effectiveIsRcm ? "RCM Tax (Self-Payable to Govt)" : "Tax (GST)"}
                    </span>
                    <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                      {currSym}{(
                        bill.cgstTotal !== undefined || bill.sgstTotal !== undefined || bill.igstTotal !== undefined
                          ? ((bill.cgstTotal ?? 0) + (bill.sgstTotal ?? 0) + (bill.igstTotal ?? 0))
                          : (effectiveIsRcm ? 0 : bill.grandTotal - (bill.grandTotal / 1.18))
                      ).toFixed(2)}
                    </span>
                  </div>
                )}
                {isItcOptionEnabled && (
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Input Tax Credit (ITC)</span>
                    <span className={`font-semibold tabular-nums ${bill.itcEligibility === "ineligible" ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                      {bill.itcEligibility === "ineligible" 
                        ? "Ineligible (₹0.00)" 
                        : `${currSym}${(
                            bill.cgstTotal !== undefined || bill.sgstTotal !== undefined || bill.igstTotal !== undefined
                              ? ((bill.cgstTotal ?? 0) + (bill.sgstTotal ?? 0) + (bill.igstTotal ?? 0))
                              : (effectiveIsRcm ? 0 : bill.grandTotal - (bill.grandTotal / 1.18))
                          ).toFixed(2)} (${(bill.itcEligibility || "inputs").replace("_", " ").toUpperCase()})`}
                    </span>
                  </div>
                )}
                {bill.additionalCharges && bill.additionalCharges.length > 0 ? (
                  bill.additionalCharges.map((ch, idx) => (
                    <div key={idx} className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">{ch.name || "Additional Charge"}</span>
                      <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                        {ch.amount > 0 ? `+${currSym}${ch.amount.toFixed(2)}` : `-${currSym}${Math.abs(ch.amount).toFixed(2)}`}
                      </span>
                    </div>
                  ))
                ) : (
                  bill.adjustment !== undefined && bill.adjustment !== 0 && (
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">{bill.adjustmentLabel || "Adjustment"}</span>
                      <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                        {bill.adjustment > 0 ? `+${currSym}${bill.adjustment.toFixed(2)}` : `-${currSym}${Math.abs(bill.adjustment).toFixed(2)}`}
                      </span>
                    </div>
                  )
                )}
                {bill.withholdingAmount !== undefined && bill.withholdingAmount > 0 && (
                  ((bill.withholdingType === "TDS" && gstSettings?.enableTds) ||
                   (bill.withholdingType === "TCS" && gstSettings?.enableTcs)) && (
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">
                        {bill.withholdingType} {bill.withholdingRate ? `(${bill.withholdingRate}%)` : ""}
                      </span>
                      <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                        {bill.withholdingType === "TDS"
                          ? `-${currSym}${bill.withholdingAmount.toFixed(2)}`
                          : `+${currSym}${bill.withholdingAmount.toFixed(2)}`}
                      </span>
                    </div>
                  )
                )}
                {bill.roundOff !== undefined && (
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Round Off</span>
                    <span className="tabular-nums font-semibold text-slate-900 dark:text-white">
                      {bill.roundOff > 0 ? `+${currSym}${bill.roundOff.toFixed(2)}` : bill.roundOff < 0 ? `-${currSym}${Math.abs(bill.roundOff).toFixed(2)}` : `${currSym}0.00`}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-2 text-base font-bold border-b-2 border-slate-900 dark:border-slate-100">
                  <span className="text-slate-900 dark:text-white">
                    {effectiveIsRcm ? "Net Vendor Bill" : "Total Bill Amount"}
                  </span>
                  <span className="text-blue-600 dark:text-blue-400 tabular-nums">
                    {currSym}{bill.grandTotal.toFixed(2)}
                  </span>
                </div>

                {/* Visible Payment Settlement Breakdown */}
                <div className="pt-2 flex justify-between text-xs">
                  <span className="text-slate-500">Payment Made:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {currSym}{(bill.paidAmount ?? (bill.status === "posted" ? bill.grandTotal : 0)).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Balance Payable:</span>
                  <span className={`font-bold tabular-nums text-sm ${balanceDue > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                    {currSym}{balanceDue.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            </div>

            {/* Document Footer at the bottom of A4 page */}
            <div className="mt-auto pt-8 flex justify-between items-end text-xs text-slate-500">
              <div className="text-center">
                <div className="font-semibold text-slate-800 dark:text-slate-200 mb-12">
                  Goods Received & Checked
                </div>
                <div className="border-t border-slate-300 dark:border-slate-700 pt-1 text-[11px]">
                  Store Keeper Signature
                </div>
              </div>

              <div className="text-center">
                <div className="font-semibold text-slate-800 dark:text-slate-200 mb-12">
                  For {business.name}
                </div>
                <div className="border-t border-slate-300 dark:border-slate-700 pt-1 text-[11px]">
                  Authorized Verification
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Payments & Stock Location */}
        {activeTab === "payments" && (
          <div className="w-full max-w-4xl mx-auto space-y-6">
            <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Stock Receipt & Destination</h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 block mb-1">Destination Godown</span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">
                    {bill.godownName || "Central Warehouse"}
                  </span>
                </div>
                <div className="p-4 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                  <span className="text-emerald-700 dark:text-emerald-400 block mb-1">Inventory Updated</span>
                  <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                    Stock Added ({bill.items.reduce((acc, i) => acc + i.qty, 0)} units)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Audit History */}
        {activeTab === "history" && (
          <div className="w-full max-w-4xl mx-auto space-y-4">
            <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Purchase Audit Trail</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Vendor billing verification and inward inventory records</p>
                </div>
                <Badge variant="outline" className="text-xs font-semibold px-2.5 py-0.5">
                  {bill.docNo}
                </Badge>
              </div>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800 text-xs">
                <div className="relative">
                  <div className="absolute -left-[21px] top-0.5 h-3 w-3 rounded-full bg-blue-600 border-2 border-white dark:border-slate-900 shadow-xs" />
                  <div className="font-semibold text-slate-900 dark:text-white">Purchase Bill Entered</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">Recorded by {bill.createdBy} on {bill.date}</div>
                </div>
                <div className="relative">
                  <div className="absolute -left-[21px] top-0.5 h-3 w-3 rounded-full bg-emerald-600 border-2 border-white dark:border-slate-900 shadow-xs" />
                  <div className="font-semibold text-slate-900 dark:text-white">Stock Credited to Godown</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">Stock updated in {bill.godownName || "Main Warehouse"}</div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Slide-over Drawer Backdrop */}
      {isPaymentDrawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setIsPaymentDrawerOpen(false)}
        />
      )}

      {/* Slide-over Drawer Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-lg lg:max-w-xl bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isPaymentDrawerOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
        }`}
      >
        {/* Drawer Sticky Header */}
        <div className="h-14 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Record Payment</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800">
                  Payment Out
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Bill {bill.docNo} • {bill.partyName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPaymentDrawerOpen(false)}
              className="h-8 px-2.5 text-xs font-semibold border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSavePayment}
              className="h-8 px-3.5 text-xs font-semibold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-2xs rounded-md"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Save Payment</span>
            </Button>
            <button
              onClick={() => setIsPaymentDrawerOpen(false)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-1"
              title="Close Drawer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {drawerError && (
            <div className="p-3 rounded-lg bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{drawerError}</span>
            </div>
          )}

          {drawerSuccess && (
            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{drawerSuccess}</span>
            </div>
          )}

          {/* Bill Context Card */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Vendor Details</span>
              <span className="text-slate-500 font-mono text-[11px]">{vendor?.phone ? `+91 ${vendor.phone}` : bill.partyGstin || "Registered Supplier"}</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-medium">Bill Total</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                  {currSym}{bill.grandTotal.toFixed(2)}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-medium">Paid So Far</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {currSym}{(bill.paidAmount || 0).toFixed(2)}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/40">
                <span className="text-[10px] text-rose-700 dark:text-rose-400 block font-semibold">Balance Due</span>
                <span className="text-xs font-bold text-rose-600 dark:text-rose-300 tabular-nums">
                  {currSym}{balanceDue.toFixed(2)}
                </span>
              </div>
            </div>

            {balanceDue > 0 && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500">Quick Fill:</span>
                <button
                  type="button"
                  onClick={() => setPaymentAmount(String(balanceDue))}
                  className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Pay Full Balance ({currSym}{balanceDue.toFixed(2)})
                </button>
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-red-600 dark:text-red-400 mb-1.5">
                Amount Paid ({currSym})*
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-semibold text-slate-400">{currSym}</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="pl-7 h-9 text-xs font-bold tabular-nums"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Payment Date*
                </label>
                <Input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Payment Mode*
                </label>
                <Select
                  value={paymentMode}
                  onValueChange={(val) => setPaymentMode(val as any)}
                  className="w-full h-9 text-xs font-semibold"
                  options={[
                    { value: "bank", label: "Bank Transfer (NEFT/RTGS)" },
                    { value: "upi", label: "UPI / QR Code" },
                    { value: "cheque", label: "Cheque" },
                    { value: "cash", label: "Cash" },
                    { value: "card", label: "Corporate Card" },
                  ]}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Paid From Account*
              </label>
              <Select
                value={paymentAccount}
                onValueChange={(val) => setPaymentAccount(val)}
                className="w-full h-9 text-xs font-medium"
                options={[
                  { value: "HDFC Current A/c (..4029)", label: "HDFC Current A/c (..4029)" },
                  { value: "ICICI Business A/c (..9921)", label: "ICICI Business A/c (..9921)" },
                  { value: "State Bank of India (..5102)", label: "State Bank of India (..5102)" },
                  { value: "Cash in Hand", label: "Cash in Hand" },
                  { value: "Petty Cash Account", label: "Petty Cash Account" },
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Reference / UTR / Cheque Number
              </label>
              <Input
                type="text"
                placeholder="e.g. Bank Ref / UTR / Cheque No."
                value={paymentRefNo}
                onChange={(e) => setPaymentRefNo(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Notes / Remarks
              </label>
              <textarea
                rows={2}
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Outcome Preview */}
            {parseFloat(paymentAmount) > 0 && (
              <div className={`p-3 rounded-lg border text-xs font-medium ${
                parseFloat(paymentAmount) >= balanceDue
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                  : "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300"
              }`}>
                {parseFloat(paymentAmount) >= balanceDue ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>This payment settles the purchase bill in full and will mark it as <strong>PAID</strong>.</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <span>Bill will remain <strong>PARTIAL</strong> with remaining balance of ₹{(balanceDue - parseFloat(paymentAmount)).toFixed(2)}.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
