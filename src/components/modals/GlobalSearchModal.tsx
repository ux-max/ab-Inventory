"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
import { useApp } from "@/context/AppContext"
import { Dialog } from "@/components/ui/dialog"
import {
  Search,
  Package,
  Users,
  Receipt,
  ArrowRight,
  X,
  CornerDownLeft,
  LayoutDashboard,
  Boxes,
  FileText,
  Settings,
  Truck,
  Landmark,
  ChevronRight
} from "lucide-react"

interface GlobalSearchModalProps {
  onNavigate: (module: string) => void
}

type FilterCategory = "all" | "items" | "parties" | "invoices" | "nav"

export function GlobalSearchModal({ onNavigate }: GlobalSearchModalProps) {
  const {
    isGlobalSearchOpen,
    setIsGlobalSearchOpen,
    items,
    parties,
    salesDocs,
    canViewCostAndProfit
  } = useApp()

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFilter, setSelectedFilter] = useState<FilterCategory>("all")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Reset search when modal opens
  useEffect(() => {
    if (isGlobalSearchOpen) {
      setSearchTerm("")
      setSelectedFilter("all")
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isGlobalSearchOpen])

  const cleanTerm = searchTerm.toLowerCase().trim()

  // 1. Matched Items
  const matchedItems = useMemo(() => {
    if (!cleanTerm) return items.slice(0, 4)
    return items
      .filter(
        i =>
          i.name.toLowerCase().includes(cleanTerm) ||
          i.code.toLowerCase().includes(cleanTerm) ||
          i.category?.toLowerCase().includes(cleanTerm)
      )
      .slice(0, 5)
  }, [items, cleanTerm])

  // 2. Matched Parties
  const matchedParties = useMemo(() => {
    if (!cleanTerm) return parties.slice(0, 3)
    return parties
      .filter(
        p =>
          p.name.toLowerCase().includes(cleanTerm) ||
          p.phone.includes(cleanTerm) ||
          (p.gstin && p.gstin.toLowerCase().includes(cleanTerm))
      )
      .slice(0, 4)
  }, [parties, cleanTerm])

  // 3. Matched Invoices
  const matchedInvoices = useMemo(() => {
    if (!cleanTerm) return salesDocs.slice(0, 3)
    return salesDocs
      .filter(
        inv =>
          inv.docNo.toLowerCase().includes(cleanTerm) ||
          inv.partyName.toLowerCase().includes(cleanTerm)
      )
      .slice(0, 4)
  }, [salesDocs, cleanTerm])

  // 4. Quick Navigation Actions
  const navActions = useMemo(() => {
    const allActions = [
      { id: "dashboard", title: "Home Dashboard", subtitle: "Overview & business metrics", icon: LayoutDashboard },
      { id: "items", title: "Items & Inventory", subtitle: "Product catalog, stock & barcodes", icon: Boxes },
      { id: "sales", title: "Sales Invoices", subtitle: "Billing, quotations & challans", icon: Receipt },
      { id: "reports", title: "Reports & Analytics", subtitle: "P&L, stock valuation & GST summary", icon: FileText },
      { id: "eway_bills", title: "E-Way Bills", subtitle: "Logistics dispatch & vehicle tracking", icon: Truck },
      { id: "bank_accounts", title: "Banking & Accounts", subtitle: "Cash books & ledger balances", icon: Landmark },
      { id: "settings", title: "System Settings", subtitle: "Company profile, roles & godowns", icon: Settings }
    ]

    if (!cleanTerm) {
      return allActions.slice(0, 3)
    }

    return allActions.filter(
      act =>
        act.title.toLowerCase().includes(cleanTerm) ||
        act.subtitle.toLowerCase().includes(cleanTerm)
    )
  }, [cleanTerm])

  // Calculate total visible items based on filter
  const allFlattenedItems = useMemo(() => {
    const list: Array<{ type: string; id: string; module: string }> = []
    if (selectedFilter === "all" || selectedFilter === "items") {
      matchedItems.forEach(i => list.push({ type: "item", id: i.id, module: "items" }))
    }
    if (selectedFilter === "all" || selectedFilter === "parties") {
      matchedParties.forEach(p => list.push({ type: "party", id: p.id, module: "parties" }))
    }
    if (selectedFilter === "all" || selectedFilter === "invoices") {
      matchedInvoices.forEach(inv => list.push({ type: "invoice", id: inv.id, module: "sales" }))
    }
    if (selectedFilter === "all" || selectedFilter === "nav") {
      navActions.forEach(n => list.push({ type: "nav", id: n.id, module: n.id }))
    }
    return list
  }, [selectedFilter, matchedItems, matchedParties, matchedInvoices, navActions])

  const totalResults = allFlattenedItems.length

  const handleSelect = (module: string) => {
    setIsGlobalSearchOpen(false)
    onNavigate(module)
  }

  // Keyboard Navigation: Up, Down, Enter, Esc
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % Math.max(1, totalResults))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + totalResults) % Math.max(1, totalResults))
    } else if (e.key === "Enter" && allFlattenedItems[selectedIndex]) {
      e.preventDefault()
      handleSelect(allFlattenedItems[selectedIndex].module)
    } else if (e.key === "Escape") {
      setIsGlobalSearchOpen(false)
    }
  }

  if (!isGlobalSearchOpen) return null

  return (
    <Dialog
      open={isGlobalSearchOpen}
      onOpenChange={setIsGlobalSearchOpen}
      className="max-w-[640px] p-0 overflow-hidden rounded-2xl shadow-2xl border border-slate-200/90 bg-white"
    >
      {/* 1. Spotlight Command Input Bar */}
      <div className="relative flex items-center px-4 h-14 border-b border-slate-100 gap-3">
        <Search className="h-5 w-5 text-slate-400 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value)
            setSelectedIndex(0)
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search items, SKU, parties, invoices, or type a command..."
          className="w-full h-full bg-transparent text-[15px] font-medium text-slate-900 placeholder:text-slate-400 outline-none border-none pr-10"
        />
        {searchTerm ? (
          <button
            type="button"
            onClick={() => {
              setSearchTerm("")
              inputRef.current?.focus()
            }}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <div className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            ESC
          </div>
        )}
      </div>

      {/* 2. Filter Category Chips */}
      <div className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-50/70 border-b border-slate-100 overflow-x-auto select-none">
        <button
          type="button"
          onClick={() => { setSelectedFilter("all"); setSelectedIndex(0) }}
          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            selectedFilter === "all"
              ? "bg-[#2563eb] text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-200/70"
          }`}
        >
          All
        </button>

        <button
          type="button"
          onClick={() => { setSelectedFilter("items"); setSelectedIndex(0) }}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            selectedFilter === "items"
              ? "bg-[#2563eb] text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-200/70"
          }`}
        >
          <span>Items</span>
          <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${selectedFilter === "items" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"}`}>
            {matchedItems.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { setSelectedFilter("parties"); setSelectedIndex(0) }}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            selectedFilter === "parties"
              ? "bg-[#2563eb] text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-200/70"
          }`}
        >
          <span>Parties</span>
          <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${selectedFilter === "parties" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"}`}>
            {matchedParties.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { setSelectedFilter("invoices"); setSelectedIndex(0) }}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            selectedFilter === "invoices"
              ? "bg-[#2563eb] text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-200/70"
          }`}
        >
          <span>Invoices</span>
          <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${selectedFilter === "invoices" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"}`}>
            {matchedInvoices.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { setSelectedFilter("nav"); setSelectedIndex(0) }}
          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            selectedFilter === "nav"
              ? "bg-[#2563eb] text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-200/70"
          }`}
        >
          Navigation
        </button>
      </div>

      {/* 3. Results Content List */}
      <div className="max-h-[380px] overflow-y-auto p-2 space-y-4">
        {totalResults === 0 ? (
          <div className="py-12 text-center">
            <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Search className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800">No matching records found</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Try searching by product name, SKU, customer name, GSTIN, or invoice number.
            </p>
          </div>
        ) : (
          <>
            {/* Items Category */}
            {(selectedFilter === "all" || selectedFilter === "items") && matchedItems.length > 0 && (
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1 flex items-center justify-between">
                  <span>Items & Products</span>
                  <span className="text-[10px] font-normal text-slate-400">{matchedItems.length} found</span>
                </div>
                <div className="space-y-1 mt-1">
                  {matchedItems.map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect("items")}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-all text-left group cursor-pointer border border-transparent hover:border-slate-100"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                          <Package className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900 truncate">
                              {item.name}
                            </span>
                            <span className="font-mono text-[11px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                              {item.code}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <span>Sale: ₹{item.salePrice}</span>
                            {canViewCostAndProfit && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span>Cost: ₹{item.purchasePrice}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        <div className="text-right">
                          <div className="flex items-center gap-1.5 justify-end">
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                item.currentStock <= item.minStock ? "bg-amber-500" : "bg-emerald-500"
                              }`}
                            />
                            <span className="text-xs font-bold text-slate-800">
                              {item.currentStock} {item.unit}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {item.currentStock <= item.minStock ? "Low Stock" : "Available"}
                          </span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Parties Category */}
            {(selectedFilter === "all" || selectedFilter === "parties") && matchedParties.length > 0 && (
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1 flex items-center justify-between">
                  <span>Parties & Contacts</span>
                  <span className="text-[10px] font-normal text-slate-400">{matchedParties.length} found</span>
                </div>
                <div className="space-y-1 mt-1">
                  {matchedParties.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelect("parties")}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-all text-left group cursor-pointer border border-transparent hover:border-slate-100"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                          <Users className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900 truncate">
                              {p.name}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded capitalize ${
                                p.type === "customer"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : "bg-purple-50 text-purple-700 border border-purple-200"
                              }`}
                            >
                              {p.type}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <span>Phone: {p.phone}</span>
                            <span className="text-slate-300">•</span>
                            <span className="font-mono text-[11px] text-slate-400">
                              GST: {p.gstin || "Unregistered"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        <div className="text-right">
                          <div className="text-xs font-bold text-slate-900">
                            ₹{p.balance.toLocaleString()}
                          </div>
                          <span className="text-[10px] text-slate-400">Balance</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Invoices Category */}
            {(selectedFilter === "all" || selectedFilter === "invoices") && matchedInvoices.length > 0 && (
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1 flex items-center justify-between">
                  <span>Sales Invoices</span>
                  <span className="text-[10px] font-normal text-slate-400">{matchedInvoices.length} found</span>
                </div>
                <div className="space-y-1 mt-1">
                  {matchedInvoices.map(inv => (
                    <button
                      key={inv.id}
                      type="button"
                      onClick={() => handleSelect("sales")}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-all text-left group cursor-pointer border border-transparent hover:border-slate-100"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0 border border-violet-100">
                          <Receipt className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900">
                              {inv.docNo}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded capitalize ${
                                inv.status === "paid"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              {inv.status}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 truncate">
                            {inv.partyName} • {inv.date}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        <div className="text-right">
                          <div className="text-xs font-bold text-slate-900">
                            ₹{inv.grandTotal.toLocaleString()}
                          </div>
                          <span className="text-[10px] text-slate-400">Total</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Navigation Category */}
            {(selectedFilter === "all" || selectedFilter === "nav") && navActions.length > 0 && (
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1 flex items-center justify-between">
                  <span>Quick Navigation</span>
                </div>
                <div className="space-y-1 mt-1">
                  {navActions.map(action => {
                    const IconComponent = action.icon
                    return (
                      <button
                        key={action.id}
                        type="button"
                        onClick={() => handleSelect(action.id)}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-all text-left group cursor-pointer border border-transparent hover:border-slate-100"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 border border-slate-200">
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900">
                              {action.title}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {action.subtitle}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-slate-400 group-hover:text-slate-700 transition-colors">
                          <span className="text-[11px] font-medium hidden sm:inline">Jump to</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 4. Elegant Minimalist Keyboard Hint Footer */}
      <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 font-mono text-[10px] font-semibold text-slate-600 shadow-2xs">
              ↑
            </kbd>
            <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 font-mono text-[10px] font-semibold text-slate-600 shadow-2xs">
              ↓
            </kbd>
            <span>to navigate</span>
          </span>

          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 font-mono text-[10px] font-semibold text-slate-600 shadow-2xs flex items-center">
              <CornerDownLeft className="h-2.5 w-2.5" />
            </kbd>
            <span>to select</span>
          </span>
        </div>

        <div className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 font-mono text-[10px] font-semibold text-slate-600 shadow-2xs">
            ESC
          </kbd>
          <span>to close</span>
        </div>
      </div>
    </Dialog>
  )
}

export default GlobalSearchModal
