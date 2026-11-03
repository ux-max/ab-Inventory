"use client"

import React, { useState } from "react"
import { 
  FileText, 
  ShoppingCart, 
  BookOpen, 
  Layers, 
  TrendingUp, 
  CircleDollarSign, 
  ArrowLeftRight, 
  Users, 
  PieChart, 
  Package, 
  ShieldCheck, 
  Boxes, 
  AlertTriangle, 
  History, 
  Clock, 
  Warehouse, 
  Sparkles,
  Search,
  ChevronRight,
  RotateCcw,
  RotateCw,
  FileMinus,
  FilePlus
} from "lucide-react"
import { cn } from "@/lib/utils"

export type ReportKey =
  // Transaction
  | "sale_invoices"
  | "purchase_bills"
  | "sales_returns"
  | "purchase_returns"
  | "credit_notes"
  | "debit_notes"
  | "day_book"
  | "all_transactions"
  | "profit_loss"
  | "bill_wise_profit"
  | "cash_flow"
  // Party
  | "party_statement"
  | "credit_ledger"
  | "party_pnl"
  | "all_parties"
  | "party_by_item"
  | "sale_purchase_by_party"
  // GST
  | "gstr_1"
  | "gstr_2"
  | "gstr_3b"
  | "cmp_08"
  | "hsn_summary"
  // Withholding
  | "tds_tcs_receivables"
  | "tds_tcs_payables"
  // Stock
  | "stock_summary"
  | "low_stock"
  | "stock_movement"
  | "batch_expiry"
  | "godown_stock"

export interface ReportCategory {
  id: string
  title: string
  reports: Array<{
    id: ReportKey
    label: string
    icon: React.ElementType
  }>
}

export const REPORT_CATEGORIES: ReportCategory[] = [
  {
    id: "transaction",
    title: "Transaction report",
    reports: [
      { id: "sale_invoices", label: "Sale", icon: FileText },
      { id: "purchase_bills", label: "Purchase", icon: ShoppingCart },
      { id: "sales_returns", label: "Sale Return", icon: RotateCcw },
      { id: "purchase_returns", label: "Purchase Return", icon: RotateCw },
      { id: "credit_notes", label: "Credit Note", icon: FileMinus },
      { id: "debit_notes", label: "Debit Note", icon: FilePlus },
      { id: "day_book", label: "Day book", icon: BookOpen },
      { id: "all_transactions", label: "All Transactions", icon: Layers },
      { id: "profit_loss", label: "Profit And Loss", icon: TrendingUp },
      { id: "bill_wise_profit", label: "Bill Wise Profit", icon: CircleDollarSign },
      { id: "cash_flow", label: "Cash flow", icon: ArrowLeftRight }
    ]
  },
  {
    id: "party",
    title: "Party report",
    reports: [
      { id: "party_statement", label: "Party Statement", icon: BookOpen },
      { id: "credit_ledger", label: "Credit Wise Ledger & Ageing", icon: CircleDollarSign },
      { id: "party_pnl", label: "Party wise Profit & Loss", icon: PieChart },
      { id: "all_parties", label: "All parties", icon: Users },
      { id: "party_by_item", label: "Party Report By Item", icon: Package },
      { id: "sale_purchase_by_party", label: "Sale Purchase By Party", icon: ArrowLeftRight }
    ]
  },
  {
    id: "gst",
    title: "GST reports",
    reports: [
      { id: "gstr_1", label: "GSTR 1", icon: ShieldCheck },
      { id: "gstr_2", label: "GSTR 2", icon: ShieldCheck },
      { id: "gstr_3b", label: "GSTR 3 B", icon: ShieldCheck },
      { id: "cmp_08", label: "CMP-08 (Composition Statement)", icon: ShieldCheck },
      { id: "hsn_summary", label: "Sale Summary By HSN", icon: FileText }
    ]
  },
  {
    id: "withholding",
    title: "TDS & TCS Reports",
    reports: [
      { id: "tds_tcs_receivables", label: "TDS / TCS Receivables", icon: CircleDollarSign },
      { id: "tds_tcs_payables", label: "TDS / TCS Payables", icon: ArrowLeftRight }
    ]
  },
  {
    id: "stock",
    title: "Item / Stock reports",
    reports: [
      { id: "stock_summary", label: "Stock Summary", icon: Boxes },
      { id: "low_stock", label: "Low Stock Summary", icon: AlertTriangle },
      { id: "stock_movement", label: "Stock Movement", icon: History },
      { id: "batch_expiry", label: "Batch & Expiry Ageing", icon: Clock },
      { id: "godown_stock", label: "Godown-wise Stock", icon: Warehouse }
    ]
  }
]

interface ReportsSidebarProps {
  activeReport: ReportKey
  onSelectReport: (key: ReportKey) => void
}

export function ReportsSidebar({ activeReport, onSelectReport }: ReportsSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredCategories = REPORT_CATEGORIES.map(cat => ({
    ...cat,
    reports: cat.reports.filter(r => 
      r.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(cat => cat.reports.length > 0)

  return (
    <div className="w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-[#f8fafc]/80 dark:bg-slate-900/60 flex flex-col h-full select-none">
      {/* Search Filter for Reports */}
      <div className="p-3 border-b border-slate-200/80 dark:border-slate-800">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Categories & Reports Navigation List */}
      <div className="flex-1 overflow-y-auto py-2 space-y-4">
        {filteredCategories.map(cat => (
          <div key={cat.id} className="space-y-1">
            <div className="px-3 py-1 text-[11px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-400">
              {cat.title}
            </div>

            <div className="space-y-0.5">
              {cat.reports.map(report => {
                const isActive = activeReport === report.id
                return (
                  <button
                    key={report.id}
                    type="button"
                    onClick={() => onSelectReport(report.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-all cursor-pointer",
                      isActive
                        ? "bg-slate-200/80 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold border-l-3 border-blue-600 shadow-2xs"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-200"
                    )}
                  >
                    <span className="truncate flex-1">{report.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
