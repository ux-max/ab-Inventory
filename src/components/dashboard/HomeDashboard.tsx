"use client"

import React, { useState, useMemo } from "react"
import { useApp } from "@/context/AppContext"
import { 
  FileText, 
  ShoppingCart, 
  Truck, 
  Receipt, 
  Package, 
  LayoutGrid, 
  ArrowDown, 
  Boxes, 
  ChevronRight,
  TrendingUp,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  AlertTriangle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Plus,
  ArrowRight,
  Building2,
  Sparkles,
  Layers,
  Calendar,
  ExternalLink,
  AlertCircle,
  X
} from "lucide-react"
import { Select } from "@/components/ui/select"
import { formatINR } from "@/lib/utils"
import { getDatePresetRange, ReportDatePreset, isDateInRange } from "@/lib/reportDataEngine"

interface HomeDashboardProps {
  onNavigate: (module: string, subModule?: string) => void
  onTriggerAction?: (actionKey: string) => void
}

const PERIOD_OPTIONS = [
  { value: "this_month", label: "This Month" },
  { value: "this_quarter", label: "This Quarter" },
  { value: "this_fy", label: "This FY" },
  { value: "all_time", label: "All Time" },
]

export function HomeDashboard({ onNavigate, onTriggerAction }: HomeDashboardProps) {
  const { 
    items, 
    parties, 
    salesDocs, 
    salesOrders, 
    deliveryChallans, 
    quotations, 
    purchaseDocs, 
    godowns,
    bankAccounts,
    business,
    gstSettings,
    canViewCostAndProfit
  } = useApp()

  // Period Filters for Cards 4, 5, 6
  const [topItemsPeriod, setTopItemsPeriod] = useState<ReportDatePreset>("this_month")
  const [purchasePeriod, setPurchasePeriod] = useState<ReportDatePreset>("this_month")
  const [salesOrderPeriod, setSalesOrderPeriod] = useState<ReportDatePreset>("this_month")
  const [showIntegrationNotice, setShowIntegrationNotice] = useState(true)

  // --- FINANCIAL & CASH FLOW METRICS ---
  const totalReceivables = useMemo(() => {
    return salesDocs
      .filter((s) => s.type === "invoice")
      .reduce((sum, inv) => sum + Math.max(0, (inv.grandTotal || 0) - (inv.paidAmount || 0)), 0)
  }, [salesDocs])

  const pendingReceivableInvoicesCount = useMemo(() => {
    return salesDocs.filter(
      (s) => s.type === "invoice" && (s.grandTotal || 0) > (s.paidAmount || 0)
    ).length
  }, [salesDocs])

  const totalPayables = useMemo(() => {
    return purchaseDocs
      .filter((p) => p.type === "bill")
      .reduce((sum, bill) => sum + Math.max(0, (bill.grandTotal || 0) - (bill.paidAmount || 0)), 0)
  }, [purchaseDocs])

  const pendingPayableBillsCount = useMemo(() => {
    return purchaseDocs.filter(
      (p) => p.type === "bill" && (p.grandTotal || 0) > (p.paidAmount || 0)
    ).length
  }, [purchaseDocs])

  const totalBankCashBalance = useMemo(() => {
    return (bankAccounts || []).reduce((sum, b) => sum + (b.currentBalance || 0), 0)
  }, [bankAccounts])

  const totalInventoryValuation = useMemo(() => {
    return items.reduce((sum, itm) => {
      const stock = itm.currentStock || 0
      const cost = itm.purchasePrice || (itm.salePrice ? itm.salePrice * 0.7 : 0)
      return sum + (stock > 0 ? stock * cost : 0)
    }, 0)
  }, [items])

  // --- CARD 1: SALES ACTIVITY COMPUTATIONS ---
  const quotationsCount = quotations.length
  const confirmedOrdersCount = salesOrders.filter(
    (o) => o.orderStatus === "confirmed" || o.orderStatus === "open"
  ).length || salesOrders.length

  const deliveryChallansCount = deliveryChallans.filter(
    (c) => c.status === "in_transit" || c.status === "delivered"
  ).length || deliveryChallans.length

  const pendingInvoicesCount = salesDocs.filter(
    (s) => s.type === "invoice" && (s.status === "pending" || s.status === "partial")
  ).length

  // --- CARD 2: INVENTORY SUMMARY COMPUTATIONS ---
  const totalStockQty = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.currentStock || 0), 0)
  }, [items])

  const lowStockCount = useMemo(() => {
    return items.filter((item) => (item.currentStock || 0) <= (item.minStock || 0)).length
  }, [items])

  const quantityToBeReceived = useMemo(() => {
    return purchaseDocs
      .filter((p) => p.status === "pending" || p.type === "order")
      .reduce((sum, doc) => sum + doc.items.reduce((itemSum, itm) => itemSum + itm.qty, 0), 0)
  }, [purchaseDocs])

  // --- CARD 3: ITEM DETAILS & DONUT COMPUTATIONS ---
  const totalItemsCount = items.length
  const uniqueCategoriesCount = useMemo(() => {
    return new Set(items.map((i) => i.category || "General")).size
  }, [items])

  const inStockItemsCount = useMemo(() => {
    return items.filter((i) => (i.currentStock || 0) > 0).length
  }, [items])

  const activeItemsPercentage = totalItemsCount > 0 
    ? Math.round((inStockItemsCount / totalItemsCount) * 100) 
    : 100

  // SVG Circular progress math
  const strokeWidth = 8
  const radius = 38
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (activeItemsPercentage / 100) * circumference

  // --- CARD 4: TOP SELLING ITEMS COMPUTATIONS ---
  const topSellingItems = useMemo(() => {
    const range = getDatePresetRange(topItemsPeriod)
    const periodInvoices = salesDocs.filter(
      (s) => s.type === "invoice" && isDateInRange(s.date, range)
    )

    const itemSalesMap = new Map<string, { id: string; name: string; qty: number; unit: string; revenue: number }>()
    const docsToUse = periodInvoices.length > 0 ? periodInvoices : salesDocs.filter((s) => s.type === "invoice")

    docsToUse.forEach((doc) => {
      doc.items.forEach((itm) => {
        const existing = itemSalesMap.get(itm.itemId)
        if (existing) {
          existing.qty += itm.qty
          existing.revenue += itm.total || itm.taxableAmount || 0
        } else {
          itemSalesMap.set(itm.itemId, {
            id: itm.itemId,
            name: itm.name,
            qty: itm.qty,
            unit: itm.unit || "units",
            revenue: itm.total || itm.taxableAmount || 0,
          })
        }
      })
    })

    const sorted = Array.from(itemSalesMap.values()).sort((a, b) => b.qty - a.qty)

    if (sorted.length === 0 && items.length > 0) {
      return items.slice(0, 2).map((item, idx) => ({
        id: item.id,
        name: item.name,
        qty: idx === 0 ? 40 : 30,
        unit: item.unit || "box",
        revenue: (idx === 0 ? 40 : 30) * item.salePrice,
      }))
    }

    return sorted.slice(0, 2)
  }, [salesDocs, items, topItemsPeriod])

  // --- CARD 5: PURCHASE ORDER COMPUTATIONS ---
  const purchaseMetrics = useMemo(() => {
    const range = getDatePresetRange(purchasePeriod)
    const filteredPurchases = purchaseDocs.filter((p) => isDateInRange(p.date, range))
    const docs = filteredPurchases.length > 0 ? filteredPurchases : purchaseDocs

    const qtyOrdered = docs.reduce(
      (sum, p) => sum + p.items.reduce((s, itm) => s + (itm.qty || 0), 0),
      0
    )
    const totalCost = docs.reduce((sum, p) => sum + (p.grandTotal || 0), 0)
    const pendingOrdersCount = docs.filter((p) => p.status === "pending" || p.type === "order").length

    return { qtyOrdered, totalCost, pendingOrdersCount }
  }, [purchaseDocs, purchasePeriod])

  // --- CARD 6: SALES ORDER PIPELINE TABLE COMPUTATIONS ---
  const salesPipelineRows = useMemo(() => {
    const range = getDatePresetRange(salesOrderPeriod)

    // 1. Direct Sales Invoices
    const invoices = salesDocs.filter((s) => s.type === "invoice" && isDateInRange(s.date, range))
    const invDraft = 0
    const invConfirmed = invoices.filter((i) => i.status === "pending").length
    const invPacked = 0
    const invShipped = invoices.filter((i) => i.status === "partial").length
    const invInvoiced = invoices.filter((i) => i.status === "paid").length
    const invTotal = invoices.reduce((s, i) => s + (i.grandTotal || 0), 0)

    // 2. Sales Orders
    const orders = salesOrders.filter((o) => isDateInRange(o.date, range))
    const ordDraft = orders.filter((o) => o.orderStatus === "draft").length
    const ordConfirmed = orders.filter((o) => o.orderStatus === "confirmed" || o.orderStatus === "open").length
    const ordPacked = orders.filter((o) => o.orderStatus === "partially_delivered").length
    const ordShipped = orders.filter((o) => o.orderStatus === "fulfilled").length
    const ordInvoiced = orders.filter((o) => o.invoicedStatus === "invoiced").length
    const ordTotal = orders.reduce((s, o) => s + (o.grandTotal || 0), 0)

    // 3. Delivery Challans
    const challans = deliveryChallans.filter((c) => isDateInRange(c.date, range))
    const chalDraft = 0
    const chalConfirmed = challans.filter((c) => c.status === "in_transit").length
    const chalPacked = 0
    const chalShipped = challans.filter((c) => c.status === "delivered").length
    const chalInvoiced = challans.filter((c) => c.status === "invoiced").length
    const chalTotal = challans.reduce((s, c) => s + (c.goodsValue || 0), 0)

    // 4. Quotations
    const quotes = quotations.filter((q) => isDateInRange(q.date, range))
    const qtDraft = quotes.filter((q) => q.status === "draft").length
    const qtConfirmed = quotes.filter((q) => q.status === "sent" || q.status === "accepted").length
    const qtPacked = 0
    const qtShipped = 0
    const qtInvoiced = quotes.filter((q) => q.status === "converted").length
    const qtTotal = quotes.reduce((s, q) => s + (q.grandTotal || 0), 0)

    return [
      {
        channel: "Direct Sales Invoices",
        subModule: "invoice",
        draft: invDraft,
        confirmed: invConfirmed,
        packed: invPacked,
        shipped: invShipped,
        invoiced: invInvoiced,
        total: invTotal,
      },
      {
        channel: "Customer Sales Orders",
        subModule: "orders",
        draft: ordDraft,
        confirmed: ordConfirmed,
        packed: ordPacked,
        shipped: ordShipped,
        invoiced: ordInvoiced,
        total: ordTotal,
      },
      {
        channel: "Goods Delivery Challans",
        subModule: "challan",
        draft: chalDraft,
        confirmed: chalConfirmed,
        packed: chalPacked,
        shipped: chalShipped,
        invoiced: chalInvoiced,
        total: chalTotal,
      },
      {
        channel: "Quotations & Estimates",
        subModule: "quotation",
        draft: qtDraft,
        confirmed: qtConfirmed,
        packed: qtPacked,
        shipped: qtShipped,
        invoiced: qtInvoiced,
        total: qtTotal,
      },
    ]
  }, [salesDocs, salesOrders, deliveryChallans, quotations, salesOrderPeriod])

  // --- CRITICAL ALERT: LOW STOCK WATCHLIST ---
  const lowStockItemsList = useMemo(() => {
    return items
      .filter((item) => (item.currentStock || 0) <= (item.minStock || 0))
      .slice(0, 5)
  }, [items])

  // --- CRITICAL ALERT: BATCH EXPIRY WATCHLIST ---
  const expiringBatchesList = useMemo(() => {
    const now = new Date()
    const list: Array<{
      itemId: string
      itemName: string
      batchNo: string
      expiryDate: string
      quantity: number
      daysLeft: number
      isExpired: boolean
    }> = []

    items.forEach((item) => {
      if (item.batchDetails && Array.isArray(item.batchDetails)) {
        item.batchDetails.forEach((batch) => {
          if (batch.expiryDate && (batch.quantity || 0) > 0) {
            const exp = new Date(batch.expiryDate)
            const diffTime = exp.getTime() - now.getTime()
            const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            if (daysLeft <= 90) {
              list.push({
                itemId: item.id,
                itemName: item.name,
                batchNo: batch.batchNo,
                expiryDate: batch.expiryDate,
                quantity: batch.quantity,
                daysLeft,
                isExpired: daysLeft <= 0,
              })
            }
          }
        })
      }
    })

    return list.sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 5)
  }, [items])

  // --- RECENT TRANSACTIONS STREAM ---
  const recentTransactions = useMemo(() => {
    const txns: Array<{
      id: string
      type: "invoice" | "bill" | "challan" | "quotation" | "order"
      badge: string
      badgeColor: string
      refNo: string
      partyName: string
      date: string
      amount: number
      status: string
      module: string
      subModule: string
    }> = []

    salesDocs.slice(0, 6).forEach((s) => {
      txns.push({
        id: s.id,
        type: "invoice",
        badge: "Invoice",
        badgeColor: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900",
        refNo: s.docNo || s.id,
        partyName: s.partyName || "Walk-in Customer",
        date: s.date,
        amount: s.grandTotal || 0,
        status: s.status,
        module: "sales",
        subModule: "invoice",
      })
    })

    purchaseDocs.slice(0, 6).forEach((p) => {
      txns.push({
        id: p.id,
        type: "bill",
        badge: "Purchase",
        badgeColor: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900",
        refNo: p.docNo || p.id,
        partyName: p.partyName || "Vendor",
        date: p.date,
        amount: p.grandTotal || 0,
        status: p.status,
        module: "purchases",
        subModule: "bills",
      })
    })

    deliveryChallans.slice(0, 3).forEach((c) => {
      txns.push({
        id: c.id,
        type: "challan",
        badge: "Challan",
        badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900",
        refNo: c.challanNo || c.id,
        partyName: c.partyName || "Consignee",
        date: c.date,
        amount: c.goodsValue || 0,
        status: c.status,
        module: "sales",
        subModule: "challan",
      })
    })

    return txns
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
  }, [salesDocs, purchaseDocs, deliveryChallans])

  return (
    <div className="space-y-4 pb-12 select-none font-sans">
      
      {/* ========================================================================= */}
      {/* TOP HEADER & QUICK ACTION BAR                                            */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-900 dark:text-white border-b-2 border-blue-600 pb-1 px-0.5">
            Dashboard
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500 hidden md:inline ml-2">
            Business operations, sales pipeline & stock intelligence
          </span>
        </div>

        {/* Quick Action Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onTriggerAction ? onTriggerAction("new_invoice") : onNavigate("sales", "invoice")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>New Invoice</span>
          </button>

          <button
            onClick={() => onNavigate("purchases", "bills")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg shadow-2xs transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 text-slate-500" />
            <span>New Purchase Bill</span>
          </button>

          <button
            onClick={() => onTriggerAction ? onTriggerAction("new_item") : onNavigate("items", "all")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg shadow-2xs transition-all cursor-pointer"
          >
            <Package className="h-3.5 w-3.5 text-slate-500" />
            <span>Add Item</span>
          </button>

          <button
            onClick={() => onTriggerAction ? onTriggerAction("new_transfer") : onNavigate("inventory", "transfers")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg shadow-2xs transition-all cursor-pointer"
          >
            <Boxes className="h-3.5 w-3.5 text-slate-500" />
            <span>Transfer Stock</span>
          </button>
        </div>
      </div>

      {/* Integration Attention Banner (PDF INT-22) */}
      {showIntegrationNotice && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span className="truncate font-medium">
              Automate CRM conflict detected: 1 party phone conflict requires manual resolution.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigate("settings", "integrations")}
              className="px-2.5 py-1 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px] transition-colors cursor-pointer shadow-2xs"
            >
              Resolve in Hub
            </button>
            <button
              onClick={() => setShowIntegrationNotice(false)}
              className="p-1 rounded-md text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors cursor-pointer"
              title="Dismiss notice"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FINANCIAL HEALTH & CASH FLOW STRIP (4 METRICS)                            */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Total Receivables */}
        <div 
          onClick={() => onNavigate("sales", "invoice")}
          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-3.5 shadow-2xs hover:border-blue-400 dark:hover:border-blue-600 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Receivables
            </span>
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight group-hover:text-blue-600 transition-colors">
              ₹{formatINR(totalReceivables)}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              <span>{pendingReceivableInvoicesCount} invoices pending collection</span>
              <span className="text-blue-600 dark:text-blue-400 font-semibold group-hover:underline">View ›</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Total Payables */}
        <div 
          onClick={() => onNavigate("purchases", "bills")}
          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-3.5 shadow-2xs hover:border-amber-400 dark:hover:border-amber-600 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Payables
            </span>
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight group-hover:text-amber-600 transition-colors">
              ₹{formatINR(totalPayables)}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              <span>{pendingPayableBillsCount} purchase bills to pay</span>
              <span className="text-amber-600 dark:text-amber-400 font-semibold group-hover:underline">View ›</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Bank & Cash Balance */}
        <div 
          onClick={() => onNavigate("banking")}
          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-3.5 shadow-2xs hover:border-emerald-400 dark:hover:border-emerald-600 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Cash & Bank Balance
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight group-hover:text-emerald-600 transition-colors">
              ₹{formatINR(totalBankCashBalance)}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              <span>Across {bankAccounts.length} active accounts</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold group-hover:underline">View ›</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Total Stock Asset Valuation */}
        <div 
          onClick={() => onNavigate("inventory", "summary")}
          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-3.5 shadow-2xs hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Stock Valuation
            </span>
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight group-hover:text-indigo-600 transition-colors">
              ₹{formatINR(totalInventoryValuation)}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              <span>{totalStockQty.toLocaleString()} units in inventory</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold group-hover:underline">View ›</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ROW 1: SALES ACTIVITY (65%) & INVENTORY SUMMARY (35%)                     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Card 1: Sales Activity */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              Sales Activity
            </h3>
            <span className="text-[11px] text-slate-400">Realtime pipeline status</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Tile 1: Quotations */}
            <div
              onClick={() => onNavigate("sales", "quotation")}
              className="group flex flex-col p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 bg-white dark:bg-slate-900/60 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-all cursor-pointer shadow-2xs"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="flex items-center text-[10px] font-bold text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 tracking-wider">
                  <span>QUOTES</span>
                  <ChevronRight className="h-3 w-3 ml-0.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-1 mt-auto">
                <span className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  {quotationsCount}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">Estimates</span>
              </div>
            </div>

            {/* Tile 2: Sales Orders */}
            <div
              onClick={() => onNavigate("sales", "orders")}
              className="group flex flex-col p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-600 bg-white dark:bg-slate-900/60 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-all cursor-pointer shadow-2xs"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50">
                  <ShoppingCart className="h-4 w-4" />
                </div>
                <div className="flex items-center text-[10px] font-bold text-slate-500 dark:text-slate-400 group-hover:text-rose-600 dark:group-hover:text-rose-400 tracking-wider">
                  <span>ORDERS</span>
                  <ChevronRight className="h-3 w-3 ml-0.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-1 mt-auto">
                <span className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  {confirmedOrdersCount}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">Confirmed</span>
              </div>
            </div>

            {/* Tile 3: Delivery Challans */}
            <div
              onClick={() => onNavigate("sales", "challan")}
              className="group flex flex-col p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 bg-white dark:bg-slate-900/60 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-all cursor-pointer shadow-2xs"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
                  <Truck className="h-4 w-4" />
                </div>
                <div className="flex items-center text-[10px] font-bold text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 tracking-wider">
                  <span>CHALLANS</span>
                  <ChevronRight className="h-3 w-3 ml-0.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-1 mt-auto">
                <span className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  {deliveryChallansCount}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">Dispatches</span>
              </div>
            </div>

            {/* Tile 4: Pending Invoices */}
            <div
              onClick={() => onNavigate("sales", "invoice")}
              className="group flex flex-col p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-600 bg-white dark:bg-slate-900/60 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-all cursor-pointer shadow-2xs"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50">
                  <Receipt className="h-4 w-4" />
                </div>
                <div className="flex items-center text-[10px] font-bold text-slate-500 dark:text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 tracking-wider">
                  <span>UNPAID</span>
                  <ChevronRight className="h-3 w-3 ml-0.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-1 mt-auto">
                <span className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  {pendingInvoicesCount}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">Invoices</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Inventory Summary */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              Inventory Summary
            </h3>
            <span 
              onClick={() => onNavigate("inventory", "summary")}
              className="text-[11px] text-blue-600 dark:text-blue-400 font-medium cursor-pointer hover:underline"
            >
              Manage ›
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 my-auto">
            {/* Quantity in Hand */}
            <div 
              onClick={() => onNavigate("inventory", "summary")}
              className="cursor-pointer group pr-2"
            >
              <span className="text-xs text-slate-500 dark:text-slate-400 font-normal block">
                Quantity in Hand
              </span>
              <div className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1 group-hover:text-blue-600 transition-colors tracking-tight">
                {totalStockQty.toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 block font-normal">
                Across {godowns.length} Godowns
              </span>
            </div>

            {/* Quantity to be Received / Low Stock */}
            <div 
              onClick={() => onNavigate("items", "all")}
              className="cursor-pointer group pl-3 border-l border-slate-200 dark:border-slate-800"
            >
              <span className="text-xs text-slate-500 dark:text-slate-400 font-normal block">
                Quantity to be Received
              </span>
              <div className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1 group-hover:text-blue-600 transition-colors tracking-tight">
                {quantityToBeReceived}
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 block font-normal">
                {lowStockCount > 0 ? (
                  <span className="text-rose-500 font-semibold">{lowStockCount} Low Stock SKUs</span>
                ) : (
                  <span className="text-emerald-500 font-medium">Stock Healthy</span>
                )}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* ROW 2: ITEM DETAILS (50%) & TOP SELLING ITEMS (50%)                      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Card 3: Item Details */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              Item Details
            </h3>
            <span 
              onClick={() => onNavigate("items", "all")}
              className="text-[11px] text-blue-600 dark:text-blue-400 font-medium cursor-pointer hover:underline"
            >
              All Items ›
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 my-auto">
            {/* Left Metrics */}
            <div className="space-y-3.5 w-full sm:w-auto">
              <div className="flex items-center gap-6">
                <div 
                  onClick={() => onNavigate("items", "all")}
                  className="cursor-pointer group"
                >
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
                    Low Stock Items
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-rose-500 text-xs font-bold">↓</span>
                    <span className="text-base font-bold text-slate-800 dark:text-slate-100 group-hover:text-rose-600">
                      {lowStockCount}
                    </span>
                  </div>
                </div>

                <div 
                  onClick={() => onNavigate("items", "all")}
                  className="pl-6 border-l border-slate-200 dark:border-slate-800 cursor-pointer group"
                >
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
                    All Items
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-base font-bold text-slate-800 dark:text-slate-100 group-hover:text-emerald-600">
                      {totalItemsCount}
                    </span>
                  </div>
                </div>
              </div>

              <div 
                onClick={() => onNavigate("items", "all")}
                className="cursor-pointer group"
              >
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
                  All Item Groups
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="h-2 w-2 rounded-sm bg-blue-500" />
                  <span className="text-base font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600">
                    {uniqueCategoriesCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Subtle Divider on desktop */}
            <div className="hidden sm:block w-[1px] h-24 bg-slate-100 dark:bg-slate-800" />

            {/* Right Donut Chart */}
            <div className="relative flex items-center justify-center">
              <svg className="w-28 h-28 transform -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r={radius}
                  className="stroke-slate-100 dark:stroke-slate-800"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />
                <circle
                  cx="56"
                  cy="56"
                  r={radius}
                  className="stroke-emerald-500 transition-all duration-700 ease-out"
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  Active Items
                </span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {activeItemsPercentage} %
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Top Selling Items */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              Top Selling Items
            </h3>
            <Select
              variant="compact"
              size="xs"
              value={topItemsPeriod}
              onValueChange={(val) => setTopItemsPeriod(val as ReportDatePreset)}
              options={PERIOD_OPTIONS}
              className="h-6 text-[11px] min-w-[90px]"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
            {topSellingItems.map((item, idx) => (
              <div
                key={item.id || idx}
                onClick={() => onNavigate("items", "all")}
                className="group flex flex-col items-center text-center p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all cursor-pointer shadow-2xs"
              >
                <div className="w-16 h-14 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2 overflow-hidden border border-slate-200/60 dark:border-slate-700">
                  <Package className="h-7 w-7 text-slate-400 group-hover:text-blue-500 group-hover:scale-110 transition-transform" />
                </div>

                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate w-full" title={item.name}>
                  {item.name}
                </span>

                <div className="flex items-baseline gap-1 mt-1 text-slate-900 dark:text-white font-bold text-sm">
                  <span>{item.qty}</span>
                  <span className="text-xs font-normal text-slate-500 lowercase">{item.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* ROW 3: PURCHASE ORDER (30%) & SALES ORDER PIPELINE (70%)                  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Card 5: Purchase Order */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              Purchase Order
            </h3>
            <Select
              variant="compact"
              size="xs"
              value={purchasePeriod}
              onValueChange={(val) => setPurchasePeriod(val as ReportDatePreset)}
              options={PERIOD_OPTIONS}
              className="h-6 text-[11px] min-w-[90px]"
            />
          </div>

          <div 
            onClick={() => onNavigate("purchases", "bills")}
            className="flex flex-col items-center justify-center text-center space-y-4 my-auto cursor-pointer group"
          >
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block mb-0.5 font-normal">
                Quantity Ordered
              </span>
              <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors tracking-tight">
                {purchaseMetrics.qtyOrdered.toLocaleString()}
              </div>
            </div>

            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block mb-0.5 font-normal">
                Total Cost
              </span>
              <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors tracking-tight">
                ₹{formatINR(purchaseMetrics.totalCost)}
              </div>
            </div>

            <div className="text-[11px] text-slate-400 group-hover:text-blue-600 font-medium">
              View {purchaseMetrics.pendingOrdersCount} open purchase orders ›
            </div>
          </div>
        </div>

        {/* Card 6: Sales Order Pipeline Table */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              Sales Order
            </h3>
            <Select
              variant="compact"
              size="xs"
              value={salesOrderPeriod}
              onValueChange={(val) => setSalesOrderPeriod(val as ReportDatePreset)}
              options={PERIOD_OPTIONS}
              className="h-6 text-[11px] min-w-[90px]"
            />
          </div>

          {/* Pipeline Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2 px-2.5 font-bold">CHANNEL</th>
                  <th className="py-2 px-2.5 text-center font-bold">DRAFT</th>
                  <th className="py-2 px-2.5 text-center font-bold">CONFIRMED</th>
                  <th className="py-2 px-2.5 text-center font-bold">PACKED</th>
                  <th className="py-2 px-2.5 text-center font-bold">SHIPPED</th>
                  <th className="py-2 px-2.5 text-center font-bold">INVOICED</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {salesPipelineRows.map((row) => (
                  <tr
                    key={row.channel}
                    onClick={() => onNavigate("sales", row.subModule)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    <td className="py-2.5 px-2.5 font-medium text-slate-800 dark:text-slate-200 flex items-center justify-between">
                      <span>{row.channel}</span>
                      <ChevronRight className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100" />
                    </td>
                    <td className="py-2.5 px-2.5 text-center tabular-nums">
                      {row.draft}
                    </td>
                    <td className="py-2.5 px-2.5 text-center tabular-nums font-semibold text-slate-900 dark:text-white">
                      {row.confirmed}
                    </td>
                    <td className="py-2.5 px-2.5 text-center tabular-nums">
                      {row.packed}
                    </td>
                    <td className="py-2.5 px-2.5 text-center tabular-nums font-semibold text-blue-600 dark:text-blue-400">
                      {row.shipped}
                    </td>
                    <td className="py-2.5 px-2.5 text-center tabular-nums">
                      {row.invoiced}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* ROW 4: CRITICAL INVENTORY WATCHLIST (LOW STOCK & BATCH EXPIRY)           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Low Stock Items Watchlist */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-600 border border-rose-100 dark:border-rose-900/40">
                <AlertTriangle className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Low Stock & Reorder Alert
              </h3>
            </div>
            <button
              onClick={() => onNavigate("items", "all")}
              className="text-[11px] text-blue-600 dark:text-blue-400 font-medium hover:underline"
            >
              View All ({lowStockCount})
            </button>
          </div>

          {lowStockItemsList.length > 0 ? (
            <div className="space-y-2">
              {lowStockItemsList.map((itm) => (
                <div 
                  key={itm.id}
                  onClick={() => onNavigate("items", "all")}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">
                      {itm.name}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Category: {itm.category || "General"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-right shrink-0">
                    <div>
                      <span className="font-bold text-rose-600 dark:text-rose-400 block">
                        {itm.currentStock} {itm.unit || "units"}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Min: {itm.minStock} {itm.unit || "units"}
                      </span>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900">
                      Reorder
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                All Inventory Healthy
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5">
                No items currently below minimum safety stock levels
              </span>
            </div>
          )}
        </div>

        {/* Batch Expiry Watchlist */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-600 border border-amber-100 dark:border-amber-900/40">
                <Clock className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Batch Expiry Watchlist (&lt; 90 Days)
              </h3>
            </div>
            <button
              onClick={() => onNavigate("items", "all")}
              className="text-[11px] text-blue-600 dark:text-blue-400 font-medium hover:underline"
            >
              Manage Batches
            </button>
          </div>

          {expiringBatchesList.length > 0 ? (
            <div className="space-y-2">
              {expiringBatchesList.map((batch, idx) => (
                <div 
                  key={`${batch.itemId}-${batch.batchNo}-${idx}`}
                  onClick={() => onNavigate("items", "all")}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">
                      {batch.itemName}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Batch: <span className="font-medium text-slate-600 dark:text-slate-300">{batch.batchNo}</span> • Exp: {batch.expiryDate}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-right shrink-0">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">
                        {batch.quantity} units
                      </span>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      batch.isExpired 
                        ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300"
                        : batch.daysLeft <= 30
                        ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300"
                        : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300"
                    }`}>
                      {batch.isExpired ? "Expired" : `${batch.daysLeft}d left`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400">
              <ShieldCheck className="h-8 w-8 text-emerald-500 mb-2" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                No Batches Nearing Expiry
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5">
                All tracked batches have healthy validity exceeding 90 days
              </span>
            </div>
          )}
        </div>

      </div>

      {/* ========================================================================= */}
      {/* ROW 5: RECENT TRANSACTIONS FEED                                           */}
      {/* ========================================================================= */}
      <div className="w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <Receipt className="h-3.5 w-3.5" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              Recent Transactions
            </h3>
          </div>
          <button
            onClick={() => onNavigate("sales", "invoice")}
            className="text-[11px] text-blue-600 dark:text-blue-400 font-medium hover:underline"
          >
            All Invoices ›
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-2 px-2.5 font-bold">TYPE</th>
                <th className="py-2 px-2.5 font-bold">REF #</th>
                <th className="py-2 px-2.5 font-bold">PARTY</th>
                <th className="py-2 px-2.5 font-bold">DATE</th>
                <th className="py-2 px-2.5 text-right font-bold">AMOUNT</th>
                <th className="py-2 px-2.5 text-center font-bold">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {recentTransactions.map((txn) => (
                <tr
                  key={txn.id}
                  onClick={() => onNavigate(txn.module, txn.subModule)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  <td className="py-2.5 px-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${txn.badgeColor}`}>
                      {txn.badge}
                    </span>
                  </td>
                  <td className="py-2.5 px-2.5 font-medium text-slate-800 dark:text-slate-200">
                    {txn.refNo}
                  </td>
                  <td className="py-2.5 px-2.5 text-slate-600 dark:text-slate-300 truncate max-w-[200px]">
                    {txn.partyName}
                  </td>
                  <td className="py-2.5 px-2.5 text-slate-500 whitespace-nowrap">
                    {txn.date}
                  </td>
                  <td className="py-2.5 px-2.5 text-right font-semibold text-slate-900 dark:text-white tabular-nums">
                    ₹{formatINR(txn.amount)}
                  </td>
                  <td className="py-2.5 px-2.5 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize ${
                      txn.status === "paid" || txn.status === "delivered"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                        : txn.status === "pending" || txn.status === "in_transit"
                        ? "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}>
                      {txn.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
