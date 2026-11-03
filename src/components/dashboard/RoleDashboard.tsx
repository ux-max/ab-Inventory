"use client"

import React from "react"
import { useApp } from "@/context/AppContext"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Receipt, 
  Warehouse, 
  Plus, 
  FileText, 
  ShieldCheck, 
  Factory, 
  ShoppingBag, 
  CheckCircle2, 
  EyeOff,
  Boxes
} from "lucide-react"

import { formatINR } from "@/lib/utils"

interface RoleDashboardProps {
  onNavigate: (module: string) => void
  onTriggerAction: (actionKey: string) => void
}

export function RoleDashboard({ onNavigate, onTriggerAction }: RoleDashboardProps) {
  const { 
    currentRole, 
    roleConfig, 
    items, 
    parties, 
    salesDocs, 
    purchaseDocs, 
    stockAudits, 
    stockMovements, 
    jobWorks, 
    canViewCostAndProfit 
  } = useApp()

  // Computed metrics
  const totalStockQty = items.reduce((sum, item) => sum + item.currentStock, 0)
  const totalStockValue = items.reduce((sum, item) => sum + (item.currentStock * item.purchasePrice), 0)
  const lowStockItems = items.filter(i => i.currentStock <= i.minStock)
  const todayStr = "2026-10-14"
  const todaySalesDocs = salesDocs.filter(s => s.date === todayStr || s.date === "2026-10-13")
  const todaySalesTotal = todaySalesDocs.reduce((sum, s) => sum + s.grandTotal, 0)
  
  // Outstanding
  const receivables = parties.filter(p => p.balance > 0).reduce((sum, p) => sum + p.balance, 0)
  const payables = parties.filter(p => p.balance < 0).reduce((sum, p) => sum + Math.abs(p.balance), 0)
  
  // Gross profit estimation (only if permitted!)
  const totalSalesRevenue = salesDocs.reduce((acc, s) => acc + s.subtotal, 0)
  const totalCOGS = salesDocs.reduce((acc, s) => {
    return acc + s.items.reduce((itemAcc, itm) => itemAcc + ((itm.purchaseCost || 0) * itm.qty), 0)
  }, 0)
  const estimatedGrossProfit = totalSalesRevenue - totalCOGS

  // --- 1. OWNER DASHBOARD (PRD 2.4) ---
  if (currentRole === "owner") {
    return (
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-lg">
          <div>
            <div className="flex items-center gap-2">
              <Badge className="bg-white/20 text-white border-0 text-[10px] font-semibold">HOM-01</Badge>
              <span className="text-xs font-medium text-blue-100">Executive Overview</span>
            </div>
            <h2 className="text-xl font-bold mt-1 tracking-tight">Namaste, {roleConfig.name}</h2>
            <p className="text-xs text-blue-100 mt-0.5">
              Real-time enterprise metrics across 3 godowns • Cloud synced
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              onClick={() => onTriggerAction("new_invoice")} 
              className="bg-white text-blue-600 hover:bg-blue-50 font-bold border-0 text-xs shadow-sm cursor-pointer"
            >
              <Plus className="h-4 w-4 mr-1 text-blue-600" /> New Sale Invoice
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onNavigate("reports")} 
              className="border border-white/50 bg-white/10 text-white hover:bg-white/20 font-semibold text-xs cursor-pointer"
            >
              Full P&L Report
            </Button>
          </div>
        </div>

        {/* 6 Core Metric Tiles per PRD */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Stock Value</span>
              <Boxes className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                ₹{formatINR(totalStockValue)}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {totalStockQty.toLocaleString()} units in 3 godowns
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Estimated Gross Profit</span>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                ₹{formatINR(estimatedGrossProfit, 1)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Net Sales minus COGS (Weighted Avg)
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Receivables</span>
              <ArrowDownLeft className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                ₹{formatINR(receivables)}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                From {parties.filter(p => p.balance > 0).length} customers
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Payables Due</span>
              <ArrowUpRight className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                ₹{formatINR(payables)}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                To {parties.filter(p => p.balance < 0).length} suppliers
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Operational Attention Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Low Stock Alerts */}
          <Card className="lg:col-span-1 border-slate-200 dark:border-slate-800">
            <CardHeader className="p-4 pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-900 dark:text-white">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Low Stock Triggers
                </CardTitle>
                <CardDescription className="text-xs">Items at or below minimum level</CardDescription>
              </div>
              <Badge variant="destructive" className="text-xs">{lowStockItems.length}</Badge>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2.5">
              {lowStockItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/40">
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">{item.name}</div>
                    <div className="text-xs text-slate-500 tabular-nums">SKU: {item.code} • Min: {item.minStock}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold tabular-nums text-amber-700 dark:text-amber-400">
                      {item.currentStock} {item.unit}
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => onNavigate("purchases")} 
                      className="h-6 px-2 text-[10px] ml-2 font-medium"
                    >
                      Reorder
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Sales Invoices */}
          <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800">
            <CardHeader className="p-4 pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-900 dark:text-white">
                  <Receipt className="h-4 w-4 text-blue-600" />
                  Recent Sales Documents
                </CardTitle>
                <CardDescription className="text-xs">Generated invoices with GST & IRN status</CardDescription>
              </div>
              <Button size="sm" variant="ghost" onClick={() => onNavigate("sales")} className="text-xs">
                View All
              </Button>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {salesDocs.slice(0, 4).map(doc => (
                  <div key={doc.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        {doc.docNo}
                        <Badge variant={doc.status === "paid" ? "default" : "secondary"} className="text-[10px]">
                          {doc.status}
                        </Badge>
                        {doc.irn && <Badge variant="outline" className="text-[9px] text-emerald-600 border-emerald-300">E-Inv IRN</Badge>}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {doc.partyName} • {doc.date}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900 dark:text-white">
                        ₹{doc.grandTotal.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400 capitalize">
                        Mode: {doc.paymentMode}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // --- 2. BILLING STAFF DASHBOARD (PRD 2.4 & Strict "No Cost" rule) ---
  if (currentRole === "sales") {
    return (
      <div className="space-y-6">
        {/* Banner with Clear "No Cost" Indicator */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Badge className="bg-white/20 text-white border-0 text-[10px]">Counter Billing</Badge>
                <span className="text-xs text-emerald-100 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> High-Speed POS Ready
                </span>
              </div>
              <h2 className="text-xl font-bold mt-1">Counter: {roleConfig.name}</h2>
              <p className="text-xs text-emerald-100 mt-0.5">
                Fast invoice generation with automatic stock deduction & UPI QR sharing.
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => onTriggerAction("new_invoice")}
              className="bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-sm shadow-md h-11 px-6 cursor-pointer"
            >
              <Plus className="h-5 w-5 mr-1 text-emerald-700" /> Create New Invoice
            </Button>
          </div>
        </div>

        {/* Billing Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="p-4 pb-2">
              <span className="text-xs font-semibold text-slate-500">Today&apos;s Total Collections</span>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                ₹{todaySalesTotal.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Across {todaySalesDocs.length} invoices generated</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="p-4 pb-2">
              <span className="text-xs font-semibold text-slate-500">Available Items</span>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {items.length} SKUs
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Ready for immediate billing</p>
            </CardContent>
          </Card>

          {/* Sensitive Field Protection Notice per PRD Section 2.3 & AC-03 */}
          <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900/50">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-400">Security Rule Active</span>
              <EyeOff className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-xs font-semibold text-amber-900 dark:text-amber-300">
                Purchase Cost & Margins Masked
              </div>
              <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-1">
                Billing staff only sees selling prices and available stocks.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Invoices for Counter */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="p-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold">Recent Invoices Generated</CardTitle>
              <CardDescription className="text-xs">Quick review & share via WhatsApp</CardDescription>
            </div>
            <Button size="sm" onClick={() => onNavigate("sales")} variant="outline" className="text-xs">
              View All Invoices
            </Button>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {salesDocs.slice(0, 5).map(doc => (
                <div key={doc.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      {doc.docNo}
                      <span className="text-slate-400 font-normal">({doc.partyName})</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Items: {doc.items.length} • Mode: {doc.paymentMode} • Time: {doc.date}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-600 text-sm">
                      ₹{doc.grandTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // --- 3. STORE / GODOWN MANAGER DASHBOARD (PRD 2.4) ---
  if (currentRole === "store_keeper") {
    return (
      <div className="space-y-6">
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-700 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Badge className="bg-white/20 text-white border-0 text-[10px]">Godown Operations</Badge>
            <h2 className="text-xl font-bold mt-1">Store Keeper: {roleConfig.name}</h2>
            <p className="text-xs text-amber-100 mt-0.5">
              Goods receiving, inter-godown transfers, and physical stock count audits.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              onClick={() => onTriggerAction("new_transfer")} 
              className="bg-white text-amber-700 hover:bg-amber-50 font-bold text-xs"
            >
              New Transfer
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onTriggerAction("new_adjustment")} 
              className="border-white/40 text-white hover:bg-white/10 text-xs"
            >
              Stock Adjustment
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="p-4 pb-2">
              <span className="text-xs font-semibold text-slate-500">Low Stock SKUs</span>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-amber-600">{lowStockItems.length} Items</div>
              <p className="text-[11px] text-slate-500 mt-1">Requires immediate warehouse replenishment</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="p-4 pb-2">
              <span className="text-xs font-semibold text-slate-500">Open Physical Audits</span>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-blue-600">
                {stockAudits.filter(a => a.status !== "approved").length} Audits
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Waiting for count reconciliation</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="p-4 pb-2">
              <span className="text-xs font-semibold text-slate-500">Expiring Batches (90d)</span>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-rose-600">1 Batch</div>
              <p className="text-[11px] text-slate-500 mt-1">AZI-25E04 expires in Nov 2026</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Stock Movements */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-bold">Recent Stock Ledger Entries</CardTitle>
            <CardDescription className="text-xs">Immutable audit trail of inbound/outbound movements</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {stockMovements.slice(0, 5).map(m => (
                <div key={m.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white">{m.itemName}</span>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Ref: {m.refDocNo} • {m.godownName} • Reason: {m.reason || "Standard posting"}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-semibold text-sm tabular-nums ${m.qtyChange < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                      {m.qtyChange > 0 ? `+${m.qtyChange}` : m.qtyChange}
                    </span>
                    <div className="text-xs text-slate-400 tabular-nums">{m.timestamp}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // --- 4. PURCHASE MANAGER DASHBOARD (PRD 2.4) ---
  if (currentRole === "purchase") {
    return (
      <div className="space-y-6">
        <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-700 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Badge className="bg-white/20 text-white border-0 text-[10px]">Procurement Desk</Badge>
            <h2 className="text-xl font-bold mt-1">Purchase Mgr: {roleConfig.name}</h2>
            <p className="text-xs text-indigo-100 mt-0.5">
              Reorder lists, supplier purchase bills, and price negotiations.
            </p>
          </div>
          <Button 
            size="sm" 
            onClick={() => onNavigate("purchases")} 
            className="bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-xs"
          >
            Create Purchase Order
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="p-4 pb-2">
              <span className="text-xs font-semibold text-slate-500">Items Needing Reorder</span>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-amber-600">{lowStockItems.length} SKUs</div>
              <p className="text-[11px] text-slate-500 mt-1">Azithromycin, Raw Glycerine, etc.</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="p-4 pb-2">
              <span className="text-xs font-semibold text-slate-500">Supplier Payables</span>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">₹{payables.toLocaleString()}</div>
              <p className="text-[11px] text-slate-500 mt-1">Bharat Chem & Universal Packaging</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="p-4 pb-2">
              <span className="text-xs font-semibold text-slate-500">Total Purchase Volume</span>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-indigo-600">
                ₹{purchaseDocs.reduce((a, b) => a + b.grandTotal, 0).toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Across this fiscal quarter</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // --- 5. ACCOUNTANT / CA DASHBOARD (PRD 2.4 & Section 5.5) ---
  if (currentRole === "accountant") {
    return (
      <div className="space-y-6">
        <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-800 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Badge className="bg-white/20 text-white border-0 text-[10px]">Statutory & Tax Audit</Badge>
            <h2 className="text-xl font-bold mt-1">{roleConfig.name}</h2>
            <p className="text-xs text-purple-100 mt-0.5">
              Read-only GST returns (GSTR-1, GSTR-3B), E-Way bill reconciliation & stock valuation.
            </p>
          </div>
          <Button 
            size="sm" 
            onClick={() => onNavigate("gst")} 
            className="bg-white text-purple-700 hover:bg-purple-50 font-bold text-xs"
          >
            Open GST Hub
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="p-4 pb-2">
              <span className="text-xs font-semibold text-slate-500">Output GST Collected</span>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                ₹{salesDocs.reduce((a, b) => a + b.taxTotal, 0).toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Ready for GSTR-1 summary</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="p-4 pb-2">
              <span className="text-xs font-semibold text-slate-500">E-Invoicing IRNs Generated</span>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-emerald-600">
                {salesDocs.filter(s => s.irn).length} Invoices
              </div>
              <p className="text-[11px] text-slate-500 mt-1">NIC portal synced</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="p-4 pb-2">
              <span className="text-xs font-semibold text-slate-500">Closing Stock Valuation</span>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-purple-600">₹{totalStockValue.toLocaleString()}</div>
              <p className="text-[11px] text-slate-500 mt-1">Method: Weighted Average Cost</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // --- 6. PRODUCTION SUPERVISOR DASHBOARD (PRD 2.4 & Section 5.6) ---
  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-700 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge className="bg-white/20 text-white border-0 text-[10px]">Manufacturing Shop Floor</Badge>
          <h2 className="text-xl font-bold mt-1">Supervisor: {roleConfig.name}</h2>
          <p className="text-xs text-rose-100 mt-0.5">
            BOM recipes, manufacture assembly entries, and job work out challans.
          </p>
        </div>
        <Button 
          size="sm" 
          onClick={() => onTriggerAction("new_manufacture")} 
          className="bg-white text-rose-700 hover:bg-rose-50 font-bold text-xs"
        >
          Record Production
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="p-4 pb-2">
            <span className="text-xs font-semibold text-slate-500">Finished SKUs with BOM</span>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {items.filter(i => i.isManufactured).length} Products
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Hand Sanitizer Dispenser 500ml</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="p-4 pb-2">
            <span className="text-xs font-semibold text-slate-500">Raw Material Status</span>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-amber-600">1 Item Short</div>
            <p className="text-[11px] text-slate-500 mt-1">Glycerine & Carbomer Mix low stock</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="p-4 pb-2">
            <span className="text-xs font-semibold text-slate-500">Active Job Works</span>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-purple-600">{jobWorks.length} Challans</div>
            <p className="text-[11px] text-slate-500 mt-1">Shree Ganesh Bottling</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
