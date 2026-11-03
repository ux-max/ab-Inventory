"use client"

import React, { useState, useMemo } from "react"
import { useApp } from "@/context/AppContext"
import { 
  QrCode, 
  Search, 
  Printer, 
  ExternalLink, 
  Check, 
  Copy, 
  ShieldCheck, 
  Calendar,
  Layers,
  FileCheck2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  X
} from "lucide-react"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getStateNameFromCode, getDocPlaceOfSupply } from "@/lib/gstConstants"
import { GspConnectDrawer } from "@/components/modals/GspConnectDrawer"
import { EwayEinvoiceIllustration } from "@/components/gst/EwayEinvoiceIllustration"

interface EInvoicesModuleProps {
  onNavigate?: (module: string, subModule?: string) => void
}

export function EInvoicesModule({ onNavigate }: EInvoicesModuleProps) {
  const { 
    salesDocs, 
    business, 
    gspConnection, 
    disconnectGspPortal, 
    generateEInvoiceForInvoice 
  } = useApp()

  const [isConnectDrawerOpen, setIsConnectDrawerOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [generatingDocNo, setGeneratingDocNo] = useState<string | null>(null)

  const activeEInvoices = useMemo(() => {
    return salesDocs.filter(d => Boolean(d.irn))
  }, [salesDocs])

  const b2bInvoices = useMemo(() => {
    return salesDocs.filter(d => Boolean(d.partyGstin && d.partyGstin.trim().length >= 15))
  }, [salesDocs])

  const filteredInvoices = useMemo(() => {
    let list = salesDocs.filter(d => Boolean(d.irn) || (d.partyGstin && d.partyGstin.trim().length >= 15))

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      list = list.filter(d => 
        (d.irn && d.irn.toLowerCase().includes(q)) ||
        d.docNo.toLowerCase().includes(q) ||
        d.partyName.toLowerCase().includes(q) ||
        (d.partyGstin && d.partyGstin.toLowerCase().includes(q)) ||
        (d.ackNo && d.ackNo.toLowerCase().includes(q))
      )
    }

    return list
  }, [salesDocs, searchTerm])

  const totalValue = activeEInvoices.reduce((sum, d) => sum + (d.grandTotal || d.subtotal || 0), 0)

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleGenerateIrn = (docNo: string) => {
    setGeneratingDocNo(docNo)
    setTimeout(() => {
      generateEInvoiceForInvoice(docNo)
      setGeneratingDocNo(null)
    }, 600)
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
                <QrCode className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                    E-Invoices (IRN)
                  </h1>
                  <Badge variant="outline" className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700">
                    IRP Standard
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Invoice Registration Portal (IRP) validation with 64-character IRN and QR code
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
                Connect to E-Way Bill & E-Invoice Portal
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Seamlessly upload B2B sales invoices to the Government Invoice Registration Portal (IRP). Authenticate once to generate encrypted 64-character IRN hashes and digital signed QR codes effortlessly.
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
                  Single Connection
                </span>
                <span className="text-[10px] text-slate-400 leading-tight block">
                  Connect once for both E-Way Bill (EWB-01) and E-Invoice (IRP).
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80">
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block mb-0.5">
                  Instant IRN Generation
                </span>
                <span className="text-[10px] text-slate-400 leading-tight block">
                  Generates valid 64-char hash and signed QR code in real-time.
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80">
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block mb-0.5">
                  B2B Tax Compliance
                </span>
                <span className="text-[10px] text-slate-400 leading-tight block">
                  Satisfies Rule 48(4) statutory criteria for GST input tax credits.
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
              <QrCode className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  E-Invoices (IRN)
                </h1>
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300">
                  IRP Synced
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Government Invoice Registration Portal (IRP) registered B2B invoices with 64-character IRN and QR validation
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
              Generated E-Invoices
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
              {activeEInvoices.length}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              <span>Signed QR Validated</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Registered Volume
            </div>
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1 tabular-nums">
              ₹{totalValue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Across active IRN invoices
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              B2B Registered Buyers
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
              {b2bInvoices.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Mandatory IRP eligible
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Government IRP Status
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white mt-1.5 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>IRP-1 Online (einvoice1)</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Govt Token Active
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search Bar */}
      <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex items-center justify-between gap-3 shrink-0">
        <div className="relative w-full sm:w-80">
          <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by IRN, Ack #, Invoice #, Buyer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
          />
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400">
          Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{filteredInvoices.length}</span> B2B invoices
        </div>
      </div>

      {/* 4. Table */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 dark:bg-slate-800/50">
                <TableHead className="font-bold text-xs">IRN (Hash) / Status</TableHead>
                <TableHead className="font-bold text-xs">Ack # & Date</TableHead>
                <TableHead className="font-bold text-xs">Invoice #</TableHead>
                <TableHead className="font-bold text-xs">Buyer & GSTIN</TableHead>
                <TableHead className="font-bold text-xs">Place of Supply</TableHead>
                <TableHead className="font-bold text-xs text-right">Taxable (₹)</TableHead>
                <TableHead className="font-bold text-xs text-right">Total Invoice (₹)</TableHead>
                <TableHead className="font-bold text-xs text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-slate-400 text-xs">
                    <QrCode className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="font-medium text-slate-600 dark:text-slate-400">No E-Invoices found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      B2B invoices generated to registered GSTIN parties automatically appear here for IRN sync.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((inv) => {
                  const pos = getDocPlaceOfSupply(inv, business.stateCode || "27")
                  const stateName = getStateNameFromCode(pos)
                  const hasIrn = Boolean(inv.irn)
                  const isGenerating = generatingDocNo === inv.docNo

                  return (
                    <TableRow key={inv.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      
                      {/* IRN */}
                      <TableCell className="font-mono text-xs">
                        {hasIrn ? (
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span 
                                className="font-bold text-blue-600 dark:text-blue-400 truncate max-w-[140px] block"
                                title={inv.irn}
                              >
                                {inv.irn?.slice(0, 16)}...
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(inv.irn!, inv.id)}
                                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                                title="Copy 64-char IRN"
                              >
                                {copiedId === inv.id ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                              <ShieldCheck className="h-3 w-3" /> Signed QR Valid
                            </span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={isGenerating}
                            onClick={() => handleGenerateIrn(inv.docNo)}
                            className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white shadow-2xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <Sparkles className="h-3 w-3" />
                            <span>{isGenerating ? "Syncing..." : "Generate IRN"}</span>
                          </button>
                        )}
                      </TableCell>

                      {/* Ack */}
                      <TableCell className="font-mono text-xs">
                        {inv.ackNo ? (
                          <div>
                            <div className="font-bold text-slate-800 dark:text-slate-200">{inv.ackNo}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {inv.ackDate ? new Date(inv.ackDate).toLocaleDateString("en-IN") : "Today"}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </TableCell>

                      {/* Invoice Doc */}
                      <TableCell className="text-xs">
                        <div className="font-semibold text-slate-900 dark:text-white">{inv.docNo}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3" />
                          <span>{inv.date}</span>
                        </div>
                      </TableCell>

                      {/* Buyer */}
                      <TableCell className="text-xs">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{inv.partyName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {inv.partyGstin || "Unregistered Buyer"}
                        </div>
                      </TableCell>

                      {/* POS */}
                      <TableCell className="text-xs">
                        <span className="font-semibold">{pos}</span>
                        <span className="text-slate-500"> - {stateName}</span>
                      </TableCell>

                      {/* Taxable */}
                      <TableCell className="text-xs text-right tabular-nums text-slate-700 dark:text-slate-300">
                        ₹{(inv.subtotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>

                      {/* Total */}
                      <TableCell className="text-xs font-bold text-right tabular-nums text-slate-900 dark:text-white">
                        ₹{(inv.grandTotal || inv.subtotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>

                      {/* Action */}
                      <TableCell className="text-right text-xs">
                        <div className="flex items-center justify-end gap-1.5">
                          {hasIrn && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.print()}
                              className="h-7 px-2 text-[11px] gap-1 cursor-pointer"
                              title="Print E-Invoice with QR Code"
                            >
                              <Printer className="h-3 w-3" />
                              <span>QR Print</span>
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

      {/* Slide-over Connection Drawer (Re-authentication) */}
      <GspConnectDrawer
        isOpen={isConnectDrawerOpen}
        onClose={() => setIsConnectDrawerOpen(false)}
      />

    </div>
  )
}
