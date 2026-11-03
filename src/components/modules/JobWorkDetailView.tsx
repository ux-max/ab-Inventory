"use client"

import React, { useState } from "react"
import { JobWork } from "@/types/inventory"
import { useApp } from "@/context/AppContext"
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Dialog, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  Printer, 
  Download, 
  Share2, 
  X, 
  CheckCircle2, 
  Truck, 
  Building2, 
  Package,
  ChevronDown,
  Check
} from "lucide-react"

interface JobWorkDetailViewProps {
  jobWork: JobWork
  onClose: () => void
  onReceiveSuccess?: (msg: string) => void
}

export function JobWorkDetailView({ jobWork, onClose, onReceiveSuccess }: JobWorkDetailViewProps) {
  const { business, parties, godowns, items, stockMovements, receiveJobWork, updateJobWorkStatus } = useApp()
  const [activeTab, setActiveTab] = useState<"preview" | "overview" | "history">("preview")
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false)

  // Receive Finished Goods Modal State
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false)
  const [receiveQty, setReceiveQty] = useState(jobWork.expectedQty)
  const [targetGodownId, setTargetGodownId] = useState(jobWork.godownId || godowns[0]?.id || "gdn-1")
  const [receiveError, setReceiveError] = useState("")

  const party = parties.find(p => p.name === jobWork.workerName)
  const finishedItem = items.find(i => i.id === jobWork.finishedItemId)
  const isReceived = jobWork.status === "received"

  const getStatusBadge = (status: JobWork["status"]) => {
    switch (status) {
      case "received":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
      case "open":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
      case "closed":
        return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800"
      case "draft":
        return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
      case "cancelled":
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800"
      default:
        return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300"
    }
  }

  // Material valuation calculation
  const totalMaterialValue = jobWork.rawMaterialsSent.reduce((acc, m) => {
    const rate = m.rate || 0
    return acc + (m.qty * rate)
  }, 0)
  const totalChallanValuation = totalMaterialValue + (Number(jobWork.jobWorkCharges) || 0)
  const totalUnitsDispatched = jobWork.rawMaterialsSent.reduce((acc, m) => acc + m.qty, 0)

  // Format amount in words
  const formatAmountWords = (num: number) => {
    return `Indian Rupees ${Math.round(num).toLocaleString("en-IN")} Only`
  }

  const handleReceiveGoods = (e: React.FormEvent) => {
    e.preventDefault()
    setReceiveError("")

    const parsed = Number(receiveQty)
    if (isNaN(parsed) || parsed <= 0) {
      setReceiveError("Please enter a valid quantity to receive.")
      return
    }

    const res = receiveJobWork(jobWork.id, parsed, targetGodownId)
    if (!res.success) {
      setReceiveError(res.message)
      return
    }

    setIsReceiveModalOpen(false)
    if (onReceiveSuccess) {
      onReceiveSuccess(res.message)
    }
  }

  // Stock movements relating to this job work challan
  const relevantMovements = stockMovements.filter(m => m.refDocNo === jobWork.jobNo)

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 overflow-hidden select-none">
      
      {/* 1. Header Action Bar - Unified with InvoiceDetailView / ChallanDetailView */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 print:hidden no-print">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                Job Work Challan {jobWork.jobNo}
              </h1>
              {/* Interactive Status Selector Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border flex items-center gap-1 transition-all hover:ring-2 hover:ring-offset-1 hover:ring-blue-300 dark:hover:ring-blue-700 cursor-pointer ${getStatusBadge(jobWork.status)}`}
                  title="Click to change status"
                >
                  <span>{jobWork.status.toUpperCase()}</span>
                  <ChevronDown className="h-3 w-3 opacity-70" />
                </button>

                {isStatusDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsStatusDropdownOpen(false)} />
                    <div className="absolute left-0 mt-1.5 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-1 z-50 text-xs">
                      <div className="px-3 py-1 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-100 dark:border-slate-700/60 mb-1">
                        Change Status
                      </div>
                      {(["draft", "open", "received", "closed", "cancelled"] as JobWork["status"][]).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => {
                            const res = updateJobWorkStatus(jobWork.id, st)
                            setIsStatusDropdownOpen(false)
                            if (onReceiveSuccess) {
                              onReceiveSuccess(res.message)
                            }
                          }}
                          className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/60 cursor-pointer ${
                            jobWork.status === st 
                              ? "font-bold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30" 
                              : "text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <span className="capitalize">{st}</span>
                          {jobWork.status === st && <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Job Worker: <span className="font-semibold text-slate-700 dark:text-slate-300">{jobWork.workerName}</span> • Date: {jobWork.date}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {!isReceived && (
            <Button
              size="sm"
              onClick={() => setIsReceiveModalOpen(true)}
              className="h-8 px-3.5 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-2xs rounded-md cursor-pointer"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Receive Finished Goods</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="h-8 px-3 text-xs gap-1.5 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => alert(`Downloading PDF for Job Work Challan ${jobWork.jobNo}`)}
            className="h-8 px-3 text-xs gap-1.5 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>PDF</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => alert(`WhatsApp notification sent to ${jobWork.workerName}`)}
            className="h-8 px-3 text-xs gap-1.5 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            <Share2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>WhatsApp</span>
          </Button>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
            title="Close Detail View"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 2. Tabs Navigation matching InvoiceDetailView */}
      <div className="flex items-center gap-8 px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 print:hidden no-print">
        <button
          onClick={() => setActiveTab("preview")}
          className={`py-3 text-xs font-semibold tracking-wide border-b-2 transition-colors cursor-pointer ${
            activeTab === "preview"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          Challan Preview
        </button>

        <button
          onClick={() => setActiveTab("overview")}
          className={`py-3 text-xs font-semibold tracking-wide border-b-2 transition-colors cursor-pointer ${
            activeTab === "overview"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          Job Work Details
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`py-3 text-xs font-semibold tracking-wide border-b-2 transition-colors cursor-pointer ${
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
        
        {/* Document Preview formatted to authentic A4 Paper Dimensions */}
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
                    <p>State: {business.state} ({business.stateCode || "27"})</p>
                    <p>GSTIN: <span className="font-semibold text-slate-700 dark:text-slate-300">{business.gstin}</span></p>
                    <p>Phone: {business.phone} • Email: {business.email}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight block">
                    DELIVERY CHALLAN
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mt-0.5">
                    Job Work • Rule 55
                  </span>

                  <div className="mt-3 text-xs space-y-1 text-slate-600 dark:text-slate-400">
                    <p>
                      <span className="text-slate-400">Challan #: </span>
                      <span className="font-bold text-slate-900 dark:text-white font-mono">{jobWork.jobNo}</span>
                    </p>
                    <p>
                      <span className="text-slate-400">Challan Date: </span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{jobWork.date}</span>
                    </p>
                    {jobWork.expectedReturnDate && (
                      <p>
                        <span className="text-slate-400">Return Date: </span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{jobWork.expectedReturnDate}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Consignee & Dispatch in Clean Two-Column Layout */}
              <div className="grid grid-cols-2 gap-8 py-5 border-b border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Job Worker (Consignee)
                  </span>
                  <div className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                    {jobWork.workerName}
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 space-y-0.5">
                    <p>{jobWork.partyAddress || party?.address || "Registered Facility Address"}</p>
                    <p>GSTIN: <span className="font-semibold text-slate-700 dark:text-slate-300">{jobWork.partyGstin || party?.gstin || "Unregistered"}</span></p>
                    <p>Place of Supply: {party?.state || business.state || "Maharashtra"} ({party?.stateCode || business.stateCode || "27"})</p>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Dispatch Details
                  </span>
                  <div className="text-slate-600 dark:text-slate-400 space-y-1">
                    <p><span className="text-slate-400">Dispatch Godown: </span><span className="font-semibold text-slate-800 dark:text-slate-200">{jobWork.godownName || "Main Warehouse"}</span></p>
                    <p><span className="text-slate-400">Vehicle Number: </span><span className="font-mono font-semibold text-slate-900 dark:text-white">{jobWork.vehicleNo || "—"}</span></p>
                    {jobWork.transporter && (
                      <p><span className="text-slate-400">Transporter: </span><span className="font-medium text-slate-800 dark:text-slate-200">{jobWork.transporter}</span></p>
                    )}
                    <p><span className="text-slate-400">Target Finished Item: </span><span className="font-semibold text-slate-800 dark:text-slate-200">{jobWork.expectedQty} units of {jobWork.finishedItemName}</span></p>
                  </div>
                </div>
              </div>

              {/* Items Table matching standard invoice/challan table */}
              <div className="py-6">
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                        <TableHead className="w-10 px-3 py-2.5 text-center text-xs">#</TableHead>
                        <TableHead className="px-3 py-2.5 text-xs">ITEM & DESCRIPTION</TableHead>
                        <TableHead className="px-3 py-2.5 text-xs">HSN/SAC</TableHead>
                        <TableHead className="px-3 py-2.5 text-right text-xs">QTY</TableHead>
                        <TableHead className="px-3 py-2.5 text-right text-xs">RATE</TableHead>
                        <TableHead className="px-3 py-2.5 text-right text-xs">AMOUNT</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobWork.rawMaterialsSent.map((mat, idx) => (
                        <TableRow key={idx} className="border-b border-slate-100 dark:border-slate-800/60">
                          <TableCell className="px-3 py-3 text-center text-xs text-slate-400">{idx + 1}</TableCell>
                          <TableCell className="px-3 py-3 text-xs">
                            <div className="font-semibold text-slate-900 dark:text-white">{mat.itemName}</div>
                          </TableCell>
                          <TableCell className="px-3 py-3 text-xs tabular-nums text-slate-500">{mat.hsn || "8471"}</TableCell>
                          <TableCell className="px-3 py-3 text-right text-xs font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                            {mat.qty} {mat.unit || "PCS"}
                          </TableCell>
                          <TableCell className="px-3 py-3 text-right text-xs tabular-nums text-slate-800 dark:text-slate-200">
                            ₹{(mat.rate || 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="px-3 py-3 text-right text-xs font-semibold tabular-nums text-slate-900 dark:text-white">
                            ₹{((mat.rate || 0) * mat.qty).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Clean Totals Section matching InvoiceDetailView */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2 pb-6 border-b border-slate-200 dark:border-slate-800 text-xs">
                <div className="space-y-3">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Total in Words:</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 italic">
                      {formatAmountWords(totalChallanValuation)}
                    </p>
                  </div>
                  {jobWork.customerNotes && (
                    <div>
                      <span className="text-slate-400 block mb-0.5">Notes:</span>
                      <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                        {jobWork.customerNotes}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Raw Materials Total ({totalUnitsDispatched} units)</span>
                    <span className="font-semibold tabular-nums text-slate-900 dark:text-white">₹{totalMaterialValue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Job Work / Processing Charges</span>
                    <span className="font-semibold tabular-nums text-slate-900 dark:text-white">₹{(Number(jobWork.jobWorkCharges) || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 text-base font-bold border-b-2 border-slate-900 dark:border-slate-100">
                    <span className="text-slate-900 dark:text-white">Total Valuation</span>
                    <span className="text-blue-600 dark:text-blue-400 tabular-nums">₹{totalChallanValuation.toFixed(2)}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Document Signatures at bottom of A4 page */}
            <div className="mt-auto pt-8 flex justify-between items-end text-xs text-slate-500">
              <div className="text-center">
                <div className="font-semibold text-slate-800 dark:text-slate-200 mb-12">
                  {jobWork.workerName}
                </div>
                <div className="border-t border-slate-300 dark:border-slate-700 pt-1 text-[11px]">
                  Receiver's Signature
                </div>
              </div>

              <div className="text-center">
                <div className="font-semibold text-slate-800 dark:text-slate-200 mb-12">
                  For {business.tradeName || business.name}
                </div>
                <div className="border-t border-slate-300 dark:border-slate-700 pt-1 text-[11px]">
                  Authorized Signatory
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: Job Work Details */}
        {activeTab === "overview" && (
          <div className="max-w-4xl mx-auto space-y-6 text-xs">
            
            {/* Status & Progress */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Production & Return Progress</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Monitoring finished assembly return from job worker</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase ${
                  isReceived
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                    : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                }`}>
                  {isReceived ? "Completed" : "In Progress"}
                </span>
              </div>

              <div className="pt-4 space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600 dark:text-slate-400">Target Finished Assembly: {jobWork.finishedItemName}</span>
                  <span className="text-slate-900 dark:text-white tabular-nums">{jobWork.receivedQty} / {jobWork.expectedQty} units</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${isReceived ? "bg-emerald-500" : "bg-blue-600"}`}
                    style={{ width: `${Math.min(100, (jobWork.receivedQty / (jobWork.expectedQty || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
                <span className="text-slate-500 font-medium block">Raw Materials Total</span>
                <span className="text-base font-bold text-slate-900 dark:text-white mt-1 block">
                  ₹{totalMaterialValue.toFixed(2)}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">{jobWork.rawMaterialsSent.length} components dispatched</span>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
                <span className="text-slate-500 font-medium block">Processing Charges</span>
                <span className="text-base font-bold text-slate-900 dark:text-white mt-1 block">
                  ₹{(Number(jobWork.jobWorkCharges) || 0).toFixed(2)}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">Job work charges</span>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
                <span className="text-slate-500 font-medium block">Total Valuation</span>
                <span className="text-base font-bold text-blue-600 dark:text-blue-400 mt-1 block">
                  ₹{totalChallanValuation.toFixed(2)}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">Declared valuation</span>
              </div>
            </div>

            {/* Details Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-slate-500" />
                  <span>Job Worker</span>
                </h4>
                <div className="space-y-1 text-slate-600 dark:text-slate-400">
                  <p><span className="text-slate-400">Name: </span><span className="font-semibold text-slate-800 dark:text-slate-200">{jobWork.workerName}</span></p>
                  <p><span className="text-slate-400">GSTIN: </span><span className="font-semibold text-slate-800 dark:text-slate-200">{jobWork.partyGstin || party?.gstin || "Unregistered"}</span></p>
                  <p><span className="text-slate-400">Address: </span><span>{jobWork.partyAddress || party?.address || "Registered Facility"}</span></p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Truck className="h-4 w-4 text-slate-500" />
                  <span>Dispatch & Logistics</span>
                </h4>
                <div className="space-y-1 text-slate-600 dark:text-slate-400">
                  <p><span className="text-slate-400">Godown: </span><span>{jobWork.godownName || "Main Warehouse"}</span></p>
                  <p><span className="text-slate-400">Vehicle No: </span><span className="font-mono font-semibold">{jobWork.vehicleNo || "—"}</span></p>
                  <p><span className="text-slate-400">Transporter: </span><span>{jobWork.transporter || "Direct Dispatch"}</span></p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: Audit History */}
        {activeTab === "history" && (
          <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Audit History</h3>
              <p className="text-xs text-slate-500 mt-0.5">Stock movement ledger tracking for this challan</p>
            </div>

            <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px]">
                    <TableHead className="px-3 py-2">DATE & TIME</TableHead>
                    <TableHead className="px-3 py-2">ITEM</TableHead>
                    <TableHead className="px-3 py-2 text-center">TYPE</TableHead>
                    <TableHead className="px-3 py-2 text-right">QTY</TableHead>
                    <TableHead className="px-3 py-2">GODOWN</TableHead>
                    <TableHead className="px-3 py-2">REASON</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relevantMovements.length > 0 ? (
                    relevantMovements.map(mov => (
                      <TableRow key={mov.id} className="border-b border-slate-100 dark:border-slate-800/60 text-xs">
                        <TableCell className="px-3 py-2.5 font-mono text-slate-500">{mov.timestamp}</TableCell>
                        <TableCell className="px-3 py-2.5 font-semibold text-slate-900 dark:text-white">{mov.itemName}</TableCell>
                        <TableCell className="px-3 py-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            mov.qtyChange < 0
                              ? "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                          }`}>
                            {mov.qtyChange < 0 ? "OUT" : "IN"}
                          </span>
                        </TableCell>
                        <TableCell className={`px-3 py-2.5 text-right font-bold tabular-nums ${
                          mov.qtyChange < 0 ? "text-rose-600" : "text-emerald-600"
                        }`}>
                          {mov.qtyChange > 0 ? `+${mov.qtyChange}` : mov.qtyChange}
                        </TableCell>
                        <TableCell className="px-3 py-2.5 text-slate-600 dark:text-slate-400">{mov.godownName}</TableCell>
                        <TableCell className="px-3 py-2.5 text-slate-500 text-[11px]">{mov.reason}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    jobWork.rawMaterialsSent.map((mat, i) => (
                      <TableRow key={i} className="border-b border-slate-100 dark:border-slate-800/60 text-xs">
                        <TableCell className="px-3 py-2.5 font-mono text-slate-500">{jobWork.date} 10:30 AM</TableCell>
                        <TableCell className="px-3 py-2.5 font-semibold text-slate-900 dark:text-white">{mat.itemName}</TableCell>
                        <TableCell className="px-3 py-2.5 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                            OUT
                          </span>
                        </TableCell>
                        <TableCell className="px-3 py-2.5 text-right font-bold tabular-nums text-rose-600">
                          -{mat.qty} {mat.unit || ""}
                        </TableCell>
                        <TableCell className="px-3 py-2.5 text-slate-600 dark:text-slate-400">{jobWork.godownName || "Main Warehouse"}</TableCell>
                        <TableCell className="px-3 py-2.5 text-slate-500 text-[11px]">
                          Dispatched for Job Work ({jobWork.jobNo})
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                  {isReceived && (
                    <TableRow className="border-b border-slate-100 dark:border-slate-800/60 text-xs bg-emerald-50/20 dark:bg-emerald-950/20">
                      <TableCell className="px-3 py-2.5 font-mono text-slate-500">{jobWork.date} 04:45 PM</TableCell>
                      <TableCell className="px-3 py-2.5 font-semibold text-emerald-800 dark:text-emerald-300">{jobWork.finishedItemName}</TableCell>
                      <TableCell className="px-3 py-2.5 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                          IN
                        </span>
                      </TableCell>
                      <TableCell className="px-3 py-2.5 text-right font-bold tabular-nums text-emerald-600">
                        +{jobWork.receivedQty} {finishedItem?.unit || "units"}
                      </TableCell>
                      <TableCell className="px-3 py-2.5 text-slate-600 dark:text-slate-400">{jobWork.godownName || "Main Warehouse"}</TableCell>
                      <TableCell className="px-3 py-2.5 text-slate-500 text-[11px]">
                        Finished goods received ({jobWork.jobNo})
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

      </div>

      {/* Receive Finished Goods Modal - Matching Application Modal Standards */}
      <Dialog open={isReceiveModalOpen} onOpenChange={setIsReceiveModalOpen} className="max-w-xl p-0 overflow-hidden">
        <form onSubmit={handleReceiveGoods} className="flex flex-col">
          {/* Header Bar matching Application Modal Standards */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between pr-12">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Package className="h-4.5 w-4.5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Receive Finished Goods
                  </h3>
                  <Badge variant="blue" className="text-[10px] font-semibold py-0 px-1.5 h-4.5">
                    Stock Receipt
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Record receipt of finished products processed by subcontractor {jobWork.workerName}.
                </p>
              </div>
            </div>
          </div>

          {/* Validation Error Alert */}
          {receiveError && (
            <div className="mx-6 mt-4 p-2.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs font-semibold flex items-center gap-2">
              <span>{receiveError}</span>
            </div>
          )}

          {/* Form Body - Matching Add Item Form typography, borders, and input styling */}
          <div className="px-6 py-5 space-y-4 text-xs">
            {/* Field 1: Finished Product */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Finished Product
              </label>
              <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-semibold text-slate-900 dark:text-white">
                {jobWork.finishedItemName}
              </div>
            </div>

            {/* Field 2 & 3: Expected Output & Quantity Received* */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Expected Output
                </label>
                <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                  {jobWork.expectedQty} {finishedItem?.unit || "units"}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Quantity Received <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="number"
                  min={1}
                  value={receiveQty}
                  onChange={(e) => setReceiveQty(Number(e.target.value) || 1)}
                  required
                  className="h-9 text-xs font-semibold tabular-nums border-slate-300 dark:border-slate-700 rounded-md focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white dark:bg-slate-900"
                />
              </div>
            </div>

            {/* Field 4: Destination Godown* */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Destination Godown <span className="text-rose-500">*</span>
              </label>
              <Select
                value={targetGodownId}
                onValueChange={setTargetGodownId}
                options={godowns.map(g => ({ value: g.id, label: g.name }))}
                className="w-full h-9 text-xs border-slate-300 dark:border-slate-700 rounded-md"
              />
            </div>
          </div>

          {/* Footer Actions matching Application Standards */}
          <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 flex items-center justify-end gap-2.5">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsReceiveModalOpen(false)}
              className="h-8.5 px-4 text-xs font-semibold bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="h-8.5 px-5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Confirm Receipt</span>
            </Button>
          </div>
        </form>
      </Dialog>

    </div>
  )
}
