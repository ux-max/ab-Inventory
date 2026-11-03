"use client"

import React, { useState } from "react"
import { DeliveryChallan, FormPrintSettings, DEFAULT_FORM_PRINT_SETTINGS_BASE, DEFAULT_FORM_PRINT_SETTINGS_MAP } from "@/types/inventory"
import { useApp } from "@/context/AppContext"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { 
  Truck, 
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
  Info,
  ShieldCheck,
  MapPin,
  AlertCircle
} from "lucide-react"
import { formatINR } from "@/lib/utils"
import { DetailActionsMenu } from "@/components/ui/detail-actions-menu"

interface ChallanDetailViewProps {
  challan: DeliveryChallan
  onClose: () => void
  onConvertToInvoice: (challanId: string) => void
  onEdit?: () => void
  onDelete?: () => void
}

export function ChallanDetailView({ 
  challan, 
  onClose, 
  onConvertToInvoice,
  onEdit,
  onDelete
}: ChallanDetailViewProps) {
  const { business, parties, godowns, deleteDeliveryChallan, gstSettings, formPrintSettings, formCustomColumns } = useApp()
  const printConfig: FormPrintSettings = formPrintSettings?.challan || DEFAULT_FORM_PRINT_SETTINGS_MAP.challan || DEFAULT_FORM_PRINT_SETTINGS_BASE
  const customColumns = (formCustomColumns?.challan || []).filter(c => c.isEnabled !== false)
  const [activeTab, setActiveTab] = useState<"preview" | "transport" | "history">("preview")

  const party = parties.find(p => p.id === orderId(challan.partyId) || p.name === challan.partyName)
  const isInvoiced = challan.status === "invoiced"

  function orderId(id: string) {
    return id
  }

  const formatAmountWords = (num: number) => {
    return `Indian Rupees ${Math.round(num).toLocaleString("en-IN")} Only`
  }

  const purposeConfig = 
    challan.challanType === "supply_on_approval"
      ? {
          bannerTitle: "STATUTORY PURPOSE: SUPPLY ON APPROVAL / DEMO (RULE 55(1)(c))",
          bannerSub: "Non-Sale Movement • Returnable within 6 months if not approved",
          dotClass: "bg-purple-500"
        }
      : challan.challanType === "job_work"
      ? {
          bannerTitle: "STATUTORY PURPOSE: JOB WORK DELIVERY (RULE 55(1)(a))",
          bannerSub: "Non-Sale Movement • Sent for job work / processing under Section 143",
          dotClass: "bg-amber-500"
        }
      : {
          bannerTitle: "STATUTORY PURPOSE: TRANSPORT OF GOODS FOR SALE / DISPATCH (RULE 55(1)(c))",
          bannerSub: "Physical Stock Deducted from Godown • Tax invoice to be generated upon delivery",
          dotClass: "bg-blue-600"
        }

  return (
    <div className="relative flex flex-col h-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 overflow-hidden">
      
      {/* 1. Header Action Bar - Unified with current theme */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 print:hidden no-print">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                Delivery Challan {challan.challanNo}
              </h1>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                challan.status === "invoiced"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                  : challan.status === "delivered"
                  ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800"
                  : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
              }`}>
                {challan.status.replace("_", " ").toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Customer: <span className="font-semibold text-slate-700 dark:text-slate-300">{challan.partyName}</span> • Date: {challan.date}
            </p>
          </div>
        </div>

        {/* Action Buttons - Standardized with primary blue and outline buttons */}
        <div className="flex items-center gap-2">
          {!isInvoiced && (
            <Button
              size="sm"
              onClick={() => onConvertToInvoice(challan.id)}
              className="h-8 px-3.5 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-2xs rounded-md"
              title="Generate Commercial Tax Invoice from this Delivery Challan"
            >
              <Receipt className="h-3.5 w-3.5" />
              <span>Generate Tax Invoice</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="h-8 px-3 text-xs gap-1.5 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Slip</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => alert(`Downloading PDF for Delivery Challan ${challan.challanNo}`)}
            className="h-8 px-3 text-xs gap-1.5 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Download className="h-3.5 w-3.5" />
            <span>PDF</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => alert(`WhatsApp notification with Delivery Challan copy sent to ${challan.partyName}`)}
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
                deleteDeliveryChallan(challan.id)
                onClose()
              }
            }}
            title="Delete Delivery Challan"
            description={`Are you sure you want to delete Delivery Challan ${challan.challanNo}? This action cannot be undone.`}
            itemName={`${challan.challanNo} • ${challan.partyName}`}
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

      {/* 2. Tabs Navigation - Uniform theme blue underline across all tabs */}
      <div className="flex items-center gap-8 px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 print:hidden no-print">
        <button
          onClick={() => setActiveTab("preview")}
          className={`py-3 text-xs font-semibold tracking-wide border-b-2 transition-colors ${
            activeTab === "preview"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          Challan Preview
        </button>
        <button
          onClick={() => setActiveTab("transport")}
          className={`py-3 text-xs font-semibold tracking-wide border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === "transport"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <span>Transport & Rule 55 Details</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold tabular-nums">
            {challan.items.length} items
          </span>
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

      {/* 3. Main Document Preview Sheet / Tabs */}
      <div className={`flex-1 overflow-y-auto ${
        activeTab === "preview" 
          ? "p-4 sm:p-8 bg-slate-200/60 dark:bg-slate-950/80 flex justify-center items-start" 
          : "p-6 sm:p-8 bg-slate-50/60 dark:bg-slate-950/60"
      }`}>
        
        {/* PREVIEW TAB: Authentic Delivery Challan Sheet Canvas formatted to A4 */}
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
                  DELIVERY CHALLAN
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mt-0.5">
                  Goods Dispatch Slip • Rule 55
                </span>
                
                <div className="mt-3 text-xs space-y-1 text-slate-600 dark:text-slate-400">
                  <p>
                    <span className="text-slate-400">Challan #: </span>
                    <span className="font-bold text-slate-900 dark:text-white">{challan.challanNo}</span>
                  </p>
                  <p>
                    <span className="text-slate-400">Challan Date: </span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{challan.date}</span>
                  </p>
                  <p className={printConfig.showOrderNumber === false ? "print:hidden" : ""}>
                    <span className="text-slate-400">Ref Sales Order: </span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{challan.salesOrderId || "SO-26-0012"}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Consignee & Transport Logistics in Clean Two-Column Layout */}
            <div className="grid grid-cols-2 gap-8 py-5 border-b border-slate-200 dark:border-slate-800 text-xs">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Deliver To (Consignee)
                </span>
                <div className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                  {challan.partyName}
                </div>
                <div className="text-slate-600 dark:text-slate-400 space-y-0.5">
                  <p>{party?.address || "Site / Delivery Destination Address"}</p>
                  <p>GSTIN: <span className="font-semibold text-slate-700 dark:text-slate-300">{challan.partyGstin || party?.gstin || "Unregistered"}</span></p>
                  {gstSettings?.enablePlaceOfSupply && (
                      <p>Place of Supply: {party?.state || "Maharashtra"} ({challan.partyStateCode || "27"})</p>
                    )}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Transport & Dispatch Details
                </span>
                <div className="text-slate-600 dark:text-slate-400 space-y-1">
                  <p><span className="text-slate-400">Dispatch Godown: </span><span className="font-semibold text-slate-800 dark:text-slate-200">{challan.godownName}</span></p>
                  <p><span className="text-slate-400">Vehicle Number: </span><span className="font-mono font-semibold text-slate-900 dark:text-white">{challan.vehicleNo}</span></p>
                  <p><span className="text-slate-400">Transporter: </span><span className="font-medium text-slate-800 dark:text-slate-200">{challan.transporter}</span></p>
                  <p><span className="text-slate-400">Purpose: </span><span className="font-medium text-slate-800 dark:text-slate-200">{purposeConfig.bannerTitle}</span></p>
                </div>
              </div>
            </div>

            {/* Dispatched Goods Table */}
            <div className="py-6">
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                      <TableHead className="w-10 px-3 py-2.5 text-center text-xs">#</TableHead>
                      <TableHead className="px-3 py-2.5 text-xs">DISPATCHED GOODS DESCRIPTION</TableHead>
                      <TableHead className={`px-3 py-2.5 text-xs ${printConfig.showHsnSac === false ? "print:hidden" : ""}`}>HSN/SAC</TableHead>
                      <TableHead className="px-3 py-2.5 text-right text-xs">DISPATCHED QTY</TableHead>
                      <TableHead className={`px-3 py-2.5 text-right text-xs ${printConfig.showTaxRate === false ? "print:hidden" : ""}`}>DECLARED RATE</TableHead>
                      {customColumns.map(col => (
                        <TableHead 
                          key={col.id} 
                          className={`px-3 py-2.5 text-center text-xs uppercase font-medium text-slate-700 dark:text-slate-300 ${col.printOnPaper === false ? "print:hidden" : ""}`}
                        >
                          {col.name}
                        </TableHead>
                      ))}
                      <TableHead className="px-3 py-2.5 text-right text-xs">RULE 55 VALUATION</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {challan.items.map((line, idx) => (
                      <TableRow key={idx} className="border-b border-slate-100 dark:border-slate-800/60">
                        <TableCell className="px-3 py-3 text-center text-xs text-slate-400">{idx + 1}</TableCell>
                        <TableCell className="px-3 py-3 text-xs">
                          <div className="font-semibold text-slate-900 dark:text-white">{line.name}</div>
                          {line.batchNo && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              Batch: {line.batchNo} {line.expiryDate ? `• Exp: ${line.expiryDate}` : ""}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className={`px-3 py-3 text-xs tabular-nums text-slate-500 ${printConfig.showHsnSac === false ? "print:hidden" : ""}`}>{line.hsn || "8471"}</TableCell>
                        <TableCell className="px-3 py-3 text-right text-xs font-semibold tabular-nums text-slate-900 dark:text-white">
                          {line.qty} {printConfig.showUnit === false ? <span className="print:hidden">{line.unit}</span> : line.unit}
                        </TableCell>
                        <TableCell className={`px-3 py-3 text-right text-xs tabular-nums text-slate-800 dark:text-slate-200 ${printConfig.showTaxRate === false ? "print:hidden" : ""}`}>
                          ₹{line.rate.toFixed(2)}
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
                          ₹{line.total.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Clean Totals Section & Statutory Declaration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2 pb-6 border-b border-slate-200 dark:border-slate-800 text-xs">
              <div className="space-y-3">
                <div>
                  <span className="text-slate-400 block mb-0.5">Declared Valuation in Words:</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 italic">
                    {formatAmountWords(challan.goodsValue)}
                  </p>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                  Declaration: Goods are transported under Rule 55 of CGST Rules for delivery/job work and do not constitute a sale invoice.
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Total Units Dispatched</span>
                  <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{challan.totalUnits} Units</span>
                </div>
                {challan.withholdingAmount !== undefined && challan.withholdingAmount > 0 && (
                  ((challan.withholdingType === "TDS" && gstSettings?.enableTds) ||
                   (challan.withholdingType === "TCS" && gstSettings?.enableTcs)) && (
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">
                        {challan.withholdingType} {challan.withholdingRate ? `(${challan.withholdingRate}%)` : ""}
                      </span>
                      <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                        {challan.withholdingType === "TDS"
                          ? `-₹${challan.withholdingAmount.toFixed(2)}`
                          : `+₹${challan.withholdingAmount.toFixed(2)}`}
                      </span>
                    </div>
                  )
                )}
                <div className="flex justify-between py-2 text-base font-bold border-b-2 border-slate-900 dark:border-slate-100">
                  <span className="text-slate-900 dark:text-white">Declared Goods Value</span>
                  <span className="text-blue-600 dark:text-blue-400 tabular-nums">₹{challan.goodsValue.toFixed(2)}</span>
                </div>
              </div>
            </div>
            </div>

            {/* Document Footer: Clean Business Signatures at the bottom of A4 page */}
            <div className="mt-auto pt-8 flex justify-between items-end text-xs text-slate-500">
              <div className={`text-center ${printConfig.showReceiverSignature === false ? "print:hidden" : ""}`}>
                <div className="font-semibold text-slate-800 dark:text-slate-200 mb-12">
                  {challan.partyName}
                </div>
                <div className="border-t border-slate-300 dark:border-slate-700 pt-1 text-[11px]">
                  Receiver's Signature & Stamp
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
        )}

        {/* TRANSPORT TAB */}
        {activeTab === "transport" && (
          <div className="w-full max-w-4xl mx-auto space-y-6">
            <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Rule 55 Statutory Transport Specifications</h3>
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
                  <span className="text-blue-700 dark:text-blue-400 block mb-1">Vehicle Number</span>
                  <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
                    {challan.vehicleNo}
                  </span>
                </div>
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 block mb-1">Transporter / Logistics</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {challan.transporter}
                  </span>
                </div>
                <div className="p-4 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                  <span className="text-emerald-700 dark:text-emerald-400 block mb-1">Dispatch Status</span>
                  <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                    {challan.status.replace("_", " ")}
                  </span>
                </div>
              </div>

              <div className="pt-2 text-xs space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Statutory Purpose (Rule 55)</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{challanTypeLabel(challan.challanType)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">LR / RR Consignment Note #</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{challan.lrNumber || "LR: VT-88219"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">E-Way Bill Number</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{challan.ewayBillNo || "381029482910"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Source Godown (Stock Deducted)</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{challan.godownName}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === "history" && (
          <div className="w-full max-w-4xl mx-auto space-y-4">
            <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Delivery Challan Audit History</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Statutory transit trail and warehouse dispatch logs</p>
                </div>
                <Badge variant="outline" className="text-xs font-semibold px-2.5 py-0.5">
                  {challan.challanNo}
                </Badge>
              </div>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800 text-xs">
                <div className="relative">
                  <div className="absolute -left-[21px] top-0.5 h-3 w-3 rounded-full bg-blue-600 border-2 border-white dark:border-slate-900 shadow-xs" />
                  <div className="font-semibold text-slate-900 dark:text-white">Delivery Challan Issued</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">Created under Rule 55 on {challan.date}</div>
                </div>
                <div className="relative">
                  <div className="absolute -left-[21px] top-0.5 h-3 w-3 rounded-full bg-blue-600 border-2 border-white dark:border-slate-900 shadow-xs" />
                  <div className="font-semibold text-slate-900 dark:text-white">Physical Stock Deducted</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">{challan.totalUnits} Units deducted from {challan.godownName}</div>
                </div>
                <div className="relative">
                  <div className="absolute -left-[21px] top-0.5 h-3 w-3 rounded-full bg-slate-400 border-2 border-white dark:border-slate-900 shadow-xs" />
                  <div className="font-semibold text-slate-900 dark:text-white">Dispatched in Transit</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">Vehicle {challan.vehicleNo} via {challan.transporter}</div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

function challanTypeLabel(type: string) {
  if (type === "supply_on_approval") return "Supply on Approval / Demo (Rule 55(1)(c))"
  if (type === "job_work") return "Job Work / Processing (Rule 55(1)(a))"
  return "Transport of Goods for Sale / Dispatch (Rule 55(1)(c))"
}
