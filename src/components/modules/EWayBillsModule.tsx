"use client"

import React, { useState, useMemo } from "react"
import { useApp } from "@/context/AppContext"
import {
  Truck,
  Search,
  Printer,
  ExternalLink,
  Check,
  Copy,
  Filter,
  ShieldCheck,
  AlertCircle,
  FileText,
  MapPin,
  Calendar,
  Plus,
  ArrowRight,
  Radio,
  CheckCircle2,
  X,
  Lock
} from "lucide-react"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getStateNameFromCode, getDocPlaceOfSupply } from "@/lib/gstConstants"
import { GspConnectDrawer } from "@/components/modals/GspConnectDrawer"
import { EwayEinvoiceIllustration } from "@/components/gst/EwayEinvoiceIllustration"

interface EWayBillsModuleProps {
  onNavigate?: (module: string, subModule?: string) => void
}

export function EWayBillsModule({ onNavigate }: EWayBillsModuleProps) {
  const {
    salesDocs,
    business,
    gspConnection,
    disconnectGspPortal,
    generateEwayBillForInvoice
  } = useApp()

  const [isConnectDrawerOpen, setIsConnectDrawerOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | "generated" | "eligible">("all")
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Modal State for Generating E-Way Bill on specific invoice
  const [generatingForDoc, setGeneratingForDoc] = useState<any | null>(null)
  const [vehicleNo, setVehicleNo] = useState("MH-04-AB-1092")
  const [distanceKm, setDistanceKm] = useState<number>(45)
  const [transporterId, setTransporterId] = useState("TRANS-IN-9821")
  const [generateFeedback, setGenerateFeedback] = useState<string | null>(null)

  // Invoices qualifying or having e-way bills
  const invoicesWithEway = useMemo(() => {
    return salesDocs.filter(d => Boolean(d.ewayBillNo))
  }, [salesDocs])

  const eligibleInvoices = useMemo(() => {
    return salesDocs.filter(d => (d.grandTotal || d.subtotal || 0) >= 50000)
  }, [salesDocs])

  const filteredInvoices = useMemo(() => {
    let list = salesDocs.filter(d => {
      if (filterType === "generated") return Boolean(d.ewayBillNo)
      if (filterType === "eligible") return (d.grandTotal || d.subtotal || 0) >= 50000 && !d.ewayBillNo
      return Boolean(d.ewayBillNo) || (d.grandTotal || d.subtotal || 0) >= 50000
    })

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      list = list.filter(d =>
        (d.ewayBillNo && d.ewayBillNo.toLowerCase().includes(q)) ||
        d.docNo.toLowerCase().includes(q) ||
        d.partyName.toLowerCase().includes(q) ||
        (d.partyGstin && d.partyGstin.toLowerCase().includes(q))
      )
    }

    return list
  }, [salesDocs, filterType, searchTerm])

  const totalEwayCount = invoicesWithEway.length
  const totalEligibleValue = invoicesWithEway.reduce((sum, d) => sum + (d.grandTotal || d.subtotal || 0), 0)

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleOpenGenerateModal = (inv: any) => {
    setGeneratingForDoc(inv)
    setVehicleNo(inv.vehicleNo || "MH-04-AB-1092")
    setDistanceKm(45)
    setTransporterId(inv.transporterId || "TRANS-IN-9821")
    setGenerateFeedback(null)
  }

  const handleConfirmGenerateEway = (e: React.FormEvent) => {
    e.preventDefault()
    if (!generatingForDoc) return

    const res = generateEwayBillForInvoice(generatingForDoc.docNo, {
      vehicleNo,
      distanceKm: Number(distanceKm) || 20,
      transporterId
    })

    if (res.success) {
      setGenerateFeedback(`Success: E-Way Bill ${res.ewayBillNo} generated.`)
      setTimeout(() => {
        setGeneratingForDoc(null)
      }, 1200)
    }
  }

  // =========================================================================
  // VIEW A: DISCONNECTED STATE (Portal Setup Required)
  // =========================================================================
  if (!gspConnection.isConnected) {
    return (
      <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50/60 dark:bg-slate-950 font-sans">

        {/* Top Minimal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 shadow-2xs">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                    E-Way Bills
                  </h1>
                  <Badge variant="outline" className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700">
                    GST EWB-01
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Statutory transit consignment permits under Rule 138 of CGST Rules
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-medium">
                Portal: Not Connected
              </span>
            </div>
          </div>
        </div>

        {/* Hero Connection Showcase */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-xl w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-xs text-center space-y-6">

            {/* Custom Theme SVG Illustration */}
            <div className="flex justify-center">
              <EwayEinvoiceIllustration className="w-80 h-44" />
            </div>

            {/* Content & Value Proposition */}
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Connect to E-Way Bill Portal
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Seamlessly generate official GST EWB-01 transit permits directly from invoices. Authenticate once via Government NIC API integration to generate instant E-Way bills and E-Invoices effortlessly.
              </p>
            </div>

            {/* Primary Action Button */}
            <div>
              <button
                type="button"
                onClick={() => setIsConnectDrawerOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Connect to E-Way Bill Portal</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* 3 Core Value Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-left">
              <div className="p-3 rounded-lg bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80">
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block mb-0.5">
                  Unified Integration
                </span>
                <span className="text-[10px] text-slate-400 leading-tight block">
                  1-time connect powers both E-Way Bill and E-Invoice (IRN) generation.
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80">
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block mb-0.5">
                  1-Click Generation
                </span>
                <span className="text-[10px] text-slate-400 leading-tight block">
                  Auto-populates items, HSN codes, party GSTIN and tax values from invoice.
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80">
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block mb-0.5">
                  Statutory NIC Sync
                </span>
                <span className="text-[10px] text-slate-400 leading-tight block">
                  Instant 12-digit E-Way bill number & printable govt transit slips.
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Slide-over Connection Drawer */}
        <GspConnectDrawer
          isOpen={isConnectDrawerOpen}
          onClose={() => setIsConnectDrawerOpen(false)}
        />

      </div>
    )
  }

  // =========================================================================
  // VIEW B: CONNECTED OPERATIONAL VIEW
  // =========================================================================
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/60 dark:bg-slate-950 font-sans">

      {/* 1. Header Toolbar */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 shadow-2xs">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  E-Way Bills
                </h1>
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300">
                  GST EWB-01
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Statutory transit consignment permits under Rule 138 of CGST Rules for consignments exceeding ₹50,000
              </p>
            </div>
          </div>

          {/* Portal Live Connected Status & Actions */}
          <div className="flex items-center gap-2.5">
            <div className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <div className="text-left">
                <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 block leading-none">
                  NIC Live Connected
                </span>
                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono">
                  {gspConnection.provider === "nic_direct" ? "NIC Direct GSP" : gspConnection.provider.toUpperCase()} • {gspConnection.apiUsername}
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={disconnectGspPortal}
              className="h-8 px-2.5 text-xs text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer hover:bg-slate-50"
              title="Disconnect or re-configure portal credentials"
            >
              Disconnect
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="h-8 px-3 text-xs font-semibold gap-1.5 border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Register</span>
            </Button>
          </div>
        </div>

        {/* 2. Top Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 mt-4">
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active E-Way Bills
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
              {totalEwayCount}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              <span>Valid & In-Transit</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Consignment Value
            </div>
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1 tabular-nums">
              ₹{totalEligibleValue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Across {totalEwayCount} active movements
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Qualifying Invoices (&gt; ₹50k)
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
              {eligibleInvoices.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Mandatory E-Way bill threshold
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Registered GSTIN
            </div>
            <div className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-1.5">
              {business.gstin || "27AABCA1234F1Z5"}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Dispatch State: {business.state || "Maharashtra"}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search and Filter Bar */}
      <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
        <div className="relative w-full sm:w-80">
          <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by E-Way Bill #, Invoice #, Party..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setFilterType("all")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${filterType === "all"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
          >
            All Shipments
          </button>
          <button
            onClick={() => setFilterType("generated")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${filterType === "generated"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
          >
            Generated ({invoicesWithEway.length})
          </button>
          <button
            onClick={() => setFilterType("eligible")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${filterType === "eligible"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
          >
            Pending (&gt;₹50k)
          </button>
        </div>
      </div>

      {/* 4. Main Operational Table */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 dark:bg-slate-800/50">
                <TableHead className="font-bold text-xs">E-Way Bill #</TableHead>
                <TableHead className="font-bold text-xs">Invoice # & Date</TableHead>
                <TableHead className="font-bold text-xs">Recipient / Consignee</TableHead>
                <TableHead className="font-bold text-xs">Place of Supply</TableHead>
                <TableHead className="font-bold text-xs text-right">Consignment Value (₹)</TableHead>
                <TableHead className="font-bold text-xs">Vehicle / Transporter</TableHead>
                <TableHead className="font-bold text-xs text-center">Status</TableHead>
                <TableHead className="font-bold text-xs text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-slate-400 text-xs">
                    <Truck className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="font-medium text-slate-600 dark:text-slate-400">No E-Way bills found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Invoices exceeding ₹50,000 value automatically qualify for government E-Way Bill generation.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((inv) => {
                  const pos = getDocPlaceOfSupply(inv, business.stateCode || "27")
                  const stateName = getStateNameFromCode(pos)
                  const hasEway = Boolean(inv.ewayBillNo)

                  return (
                    <TableRow key={inv.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <TableCell className="font-mono text-xs">
                        {hasEway ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-blue-600 dark:text-blue-400">
                              {inv.ewayBillNo}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(inv.ewayBillNo!, inv.id)}
                              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                              title="Copy E-Way Bill Number"
                            >
                              {copiedId === inv.id ? (
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenGenerateModal(inv)}
                            className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 cursor-pointer flex items-center gap-1"
                          >
                            <Plus className="h-3 w-3 stroke-[2.5]" />
                            <span>Generate E-Way</span>
                          </button>
                        )}
                      </TableCell>

                      <TableCell className="text-xs">
                        <div className="font-semibold text-slate-900 dark:text-white">{inv.docNo}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3" />
                          <span>{inv.date}</span>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{inv.partyName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {inv.partyGstin || "Unregistered Buyer"}
                        </div>
                      </TableCell>

                      <TableCell className="text-xs">
                        <span className="font-semibold">{pos}</span>
                        <span className="text-slate-500"> - {stateName}</span>
                      </TableCell>

                      <TableCell className="text-xs font-bold text-right tabular-nums text-slate-900 dark:text-white">
                        ₹{(inv.grandTotal || inv.subtotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>

                      <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                        <div className="font-medium">{inv.vehicleNo || "MH-04-AB-1092"}</div>
                        <div className="text-[10px] text-slate-400">
                          {inv.distance || "45 km"} • {inv.transporterId || "Transporter Assigned"}
                        </div>
                      </TableCell>

                      <TableCell className="text-center text-xs">
                        {hasEway ? (
                          <Badge variant="default" className="text-[10px] bg-emerald-600 text-white font-semibold">
                            ACTIVE
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-300">
                            PENDING (&gt;50K)
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right text-xs">
                        <div className="flex items-center justify-end gap-1.5">
                          {hasEway && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.print()}
                              className="h-7 px-2 text-[11px] gap-1 cursor-pointer"
                              title="Print E-Way Bill Slip"
                            >
                              <Printer className="h-3 w-3" />
                              <span>Slip</span>
                            </Button>
                          )}
                          {onNavigate && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onNavigate("sales", "invoice")}
                              className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50 cursor-pointer gap-1"
                            >
                              <span>View</span>
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal: Generate E-Way Bill for an Invoice */}
      {generatingForDoc && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Generate E-Way Bill for {generatingForDoc.docNo}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setGeneratingForDoc(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmGenerateEway} className="p-5 space-y-3.5">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Party:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{generatingForDoc.partyName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Consignment Value:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    ₹{(generatingForDoc.grandTotal || generatingForDoc.subtotal || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Transport Vehicle Number <span className="text-slate-400">*</span>
                </label>
                <input
                  type="text"
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                  placeholder="e.g. MH-04-AB-1092"
                  required
                  className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Approx Distance (km)
                  </label>
                  <input
                    type="number"
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(Number(e.target.value))}
                    min={1}
                    required
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Transporter ID (TRANSIN)
                  </label>
                  <input
                    type="text"
                    value={transporterId}
                    onChange={(e) => setTransporterId(e.target.value)}
                    placeholder="TRANS-IN-9821"
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {generateFeedback && (
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>{generateFeedback}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setGeneratingForDoc(null)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Submit to NIC</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide-over Connection Drawer (Re-authentication) */}
      <GspConnectDrawer
        isOpen={isConnectDrawerOpen}
        onClose={() => setIsConnectDrawerOpen(false)}
      />

    </div>
  )
}
