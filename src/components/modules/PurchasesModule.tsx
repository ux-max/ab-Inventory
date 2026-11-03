"use client"

import React, { useState, useEffect } from "react"
import { useApp } from "@/context/AppContext"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { TableCheckbox } from "@/components/ui/table-bulk-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { BillDetailView } from "./BillDetailView"
import { RecordPaymentForm } from "@/components/forms/RecordPaymentForm"
import { PaymentDetailView } from "./PaymentDetailView"
import { NewPurchaseReturnForm } from "@/components/forms/NewPurchaseReturnForm"
import { NewDebitNoteForm } from "@/components/forms/NewDebitNoteForm"
import { PurchaseReturnDetailView } from "./PurchaseReturnDetailView"
import { DebitNoteDetailView } from "./DebitNoteDetailView"
import { NewPurchaseBillForm } from "@/components/forms/NewPurchaseBillForm"
import { 
  Plus, 
  RotateCw, 
  Filter, 
  MoreHorizontal, 
  Search, 
  ShoppingBag, 
  AlertTriangle,
  CreditCard,
  CheckCircle2,
  Receipt,
  Truck,
  FileText,
  Clock,
  Package,
  TrendingDown
} from "lucide-react"

import { Select } from "@/components/ui/select"
import { Pagination } from "@/components/ui/pagination"
import { formatINR } from "@/lib/utils"
import { PurchaseDocument } from "@/types/inventory"

export type PurchasesTab = "bills" | "payments_made" | "purchase_returns" | "debit_notes" | "reorder"

interface PurchasesModuleProps {
  subModule?: string
}

export function PurchasesModule({ subModule = "bills" }: PurchasesModuleProps) {
  const { 
    purchaseDocs, 
    purchaseReturns, 
    debitNotes, 
    items, 
    parties, 
    godowns, 
    payments, 
    deletePurchaseReturn, 
    deleteDebitNote 
  } = useApp()

  const [activeTab, setActiveTab] = useState<PurchasesTab>(() => {
    if (subModule === "payments_made") return "payments_made"
    if (subModule === "purchase_returns") return "purchase_returns"
    if (subModule === "debit_notes") return "debit_notes"
    if (subModule === "reorder") return "reorder"
    return "bills"
  })

  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null)
  const [selectedReturnId, setSelectedReturnId] = useState<string | null>(null)
  const [selectedDebitNoteId, setSelectedDebitNoteId] = useState<string | null>(null)

  const [isRecordPaymentMode, setIsRecordPaymentMode] = useState(false)
  const [isCreateReturnMode, setIsCreateReturnMode] = useState(false)
  const [isCreateDebitNoteMode, setIsCreateDebitNoteMode] = useState(false)
  const [linkedReturnIdForDebitNote, setLinkedReturnIdForDebitNote] = useState<string | undefined>(undefined)
  const [isCreateBillMode, setIsCreateBillMode] = useState(false)
  const [editingBillId, setEditingBillId] = useState<string | null>(null)
  const [reorderDraftBill, setReorderDraftBill] = useState<PurchaseDocument | null>(null)

  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([])
  const [inlineSearch, setInlineSearch] = useState("")
  const [viewFilter, setViewFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [actionToast, setActionToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setActionToast({ message, type })
    setTimeout(() => setActionToast(null), 4000)
  }

  useEffect(() => {
    if (subModule === "payments_made") {
      setActiveTab("payments_made")
    } else if (subModule === "purchase_returns") {
      setActiveTab("purchase_returns")
    } else if (subModule === "debit_notes") {
      setActiveTab("debit_notes")
    } else if (subModule === "reorder") {
      setActiveTab("reorder")
    } else {
      setActiveTab("bills")
    }
    setSelectedDocId(null)
    setSelectedPaymentId(null)
    setSelectedReturnId(null)
    setSelectedDebitNoteId(null)
    setViewFilter("all")
  }, [subModule])

  const lowStockItems = items.filter(i => i.currentStock <= i.minStock)
  const selectedDoc = purchaseDocs.find(p => p.id === selectedDocId) || null

  const filteredPurchaseDocs = purchaseDocs.filter(doc => {
    if (inlineSearch.trim()) {
      const q = inlineSearch.toLowerCase()
      return doc.docNo.toLowerCase().includes(q) || doc.partyName.toLowerCase().includes(q)
    }
    return true
  })

  // Filter payments out
  const paymentsOut = payments.filter(p => p.type === "payment_out")
  const filteredPaymentsOut = paymentsOut.filter(p => {
    if (inlineSearch.trim()) {
      const q = inlineSearch.toLowerCase()
      return (
        p.paymentNo.toLowerCase().includes(q) ||
        p.partyName.toLowerCase().includes(q) ||
        (p.docNo && p.docNo.toLowerCase().includes(q)) ||
        (p.referenceNo && p.referenceNo.toLowerCase().includes(q))
      )
    }
    return true
  })

  // Filter Purchase Returns
  const filteredPurchaseReturns = purchaseReturns.filter(pr => {
    if (viewFilter === "dispatched" && pr.status !== "dispatched") return false
    if (viewFilter === "draft" && pr.status !== "draft") return false
    if (viewFilter === "acknowledged" && pr.status !== "acknowledged") return false
    if (inlineSearch.trim()) {
      const q = inlineSearch.toLowerCase()
      return (
        pr.returnNo.toLowerCase().includes(q) ||
        pr.vendorName.toLowerCase().includes(q) ||
        pr.originalBillNo.toLowerCase().includes(q) ||
        (pr.debitNoteNo && pr.debitNoteNo.toLowerCase().includes(q))
      )
    }
    return true
  })

  // Filter Debit Notes
  const filteredDebitNotes = debitNotes.filter(dn => {
    if (viewFilter === "open" && dn.status !== "open") return false
    if (viewFilter === "applied" && dn.status !== "applied") return false
    if (viewFilter === "closed" && dn.status !== "closed") return false
    if (inlineSearch.trim()) {
      const q = inlineSearch.toLowerCase()
      return (
        dn.debitNoteNo.toLowerCase().includes(q) ||
        dn.vendorName.toLowerCase().includes(q) ||
        dn.originalBillNo.toLowerCase().includes(q) ||
        (dn.purchaseReturnNo && dn.purchaseReturnNo.toLowerCase().includes(q))
      )
    }
    return true
  })

  const selectedPayment = paymentsOut.find(p => p.id === selectedPaymentId) || null
  const selectedReturn = purchaseReturns.find(r => r.id === selectedReturnId) || null
  const selectedDebitNote = debitNotes.find(d => d.id === selectedDebitNoteId) || null

  // If in Create or Edit Purchase Bill mode
  if (isCreateBillMode || editingBillId || reorderDraftBill) {
    const editingBill = editingBillId ? purchaseDocs.find(b => b.id === editingBillId) : (reorderDraftBill || undefined)
    const isReorder = Boolean(reorderDraftBill && !editingBillId)
    return (
      <NewPurchaseBillForm
        initialBill={editingBill}
        title={isReorder ? "New Purchase Bill (Reorder)" : undefined}
        onCancel={() => {
          setIsCreateBillMode(false)
          setEditingBillId(null)
          setReorderDraftBill(null)
        }}
        onSuccess={(docNo) => {
          setIsCreateBillMode(false)
          setEditingBillId(null)
          setReorderDraftBill(null)
          showToast(`Purchase Bill ${docNo || ""} saved successfully!`, "success")
        }}
      />
    )
  }

  // If in record payment mode
  if (isRecordPaymentMode) {
    return (
      <RecordPaymentForm
        type="payment_out"
        onCancel={() => setIsRecordPaymentMode(false)}
        onSuccess={() => {
          setIsRecordPaymentMode(false)
          showToast("Payment Out recorded successfully!", "success")
        }}
      />
    )
  }

  // If in Create Purchase Return mode
  if (isCreateReturnMode) {
    return (
      <NewPurchaseReturnForm
        onCancel={() => setIsCreateReturnMode(false)}
        onSuccess={(returnNo) => {
          setIsCreateReturnMode(false)
          showToast(`Purchase Return ${returnNo || ""} recorded successfully!`, "success")
        }}
      />
    )
  }

  // If in Create Debit Note mode
  if (isCreateDebitNoteMode) {
    return (
      <NewDebitNoteForm
        initialPurchaseReturnId={linkedReturnIdForDebitNote}
        onCancel={() => {
          setIsCreateDebitNoteMode(false)
          setLinkedReturnIdForDebitNote(undefined)
        }}
        onSuccess={(noteNo) => {
          setIsCreateDebitNoteMode(false)
          setLinkedReturnIdForDebitNote(undefined)
          showToast(`Debit Note ${noteNo || ""} issued successfully!`, "success")
        }}
      />
    )
  }

  // Master-Detail for Purchase Returns
  if (activeTab === "purchase_returns" && selectedReturnId && selectedReturn) {
    return (
      <div className="flex h-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden select-none print:block print:h-auto print:w-full print:overflow-visible">
        {/* Left: Master Return List */}
        <div className="master-list-panel w-80 lg:w-96 shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden print:hidden no-print">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-11 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-slate-900 dark:text-white">Purchase Returns</span>
              <span className="text-xs text-slate-500 font-medium">({filteredPurchaseReturns.length})</span>
            </div>
            <Button
              size="sm"
              onClick={() => setIsCreateReturnMode(true)}
              className="h-7 px-2.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md gap-1"
            >
              <Plus className="h-3 w-3" />
              <span>New</span>
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {filteredPurchaseReturns.map(pr => (
              <div
                key={pr.id}
                onClick={() => setSelectedReturnId(pr.id)}
                className={`p-3 text-xs cursor-pointer transition-colors ${
                  pr.id === selectedReturnId
                    ? "bg-blue-50/70 dark:bg-blue-950/40 border-l-4 border-blue-600 text-blue-900 dark:text-blue-100"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-slate-900 dark:text-white font-medium">{pr.returnNo}</span>
                  <span className="text-slate-900 dark:text-white tabular-nums font-semibold">
                    {pr.currencySymbol && pr.currencySymbol !== "₹" ? `${pr.currencySymbol}${pr.grandTotal.toFixed(2)}` : formatINR(pr.grandTotal)}
                  </span>
                </div>
                <div className="text-slate-600 dark:text-slate-300 font-normal truncate mt-0.5">{pr.vendorName}</div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                  <span>{pr.date}</span>
                  <span className="uppercase text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{pr.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Purchase Return Detail Canvas */}
        <div className="flex-1 h-full overflow-hidden print:block print:h-auto print:w-full print:overflow-visible print:p-0 print:m-0">
          <PurchaseReturnDetailView
            purchaseReturn={selectedReturn}
            onClose={() => setSelectedReturnId(null)}
            onGenerateDebitNote={(prId) => {
              setLinkedReturnIdForDebitNote(prId)
              setIsCreateDebitNoteMode(true)
            }}
          />
        </div>
      </div>
    )
  }

  // Master-Detail for Debit Notes
  if (activeTab === "debit_notes" && selectedDebitNoteId && selectedDebitNote) {
    return (
      <div className="flex h-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden select-none print:block print:h-auto print:w-full print:overflow-visible">
        {/* Left: Master Debit Note List */}
        <div className="master-list-panel w-80 lg:w-96 shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden print:hidden no-print">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-11 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-slate-900 dark:text-white">Debit Notes</span>
              <span className="text-xs text-slate-500 font-medium">({filteredDebitNotes.length})</span>
            </div>
            <Button
              size="sm"
              onClick={() => setIsCreateDebitNoteMode(true)}
              className="h-7 px-2.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md gap-1"
            >
              <Plus className="h-3 w-3" />
              <span>New</span>
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {filteredDebitNotes.map(dn => (
              <div
                key={dn.id}
                onClick={() => setSelectedDebitNoteId(dn.id)}
                className={`p-3 text-xs cursor-pointer transition-colors ${
                  dn.id === selectedDebitNoteId
                    ? "bg-blue-50/70 dark:bg-blue-950/40 border-l-4 border-blue-600 text-blue-900 dark:text-blue-100"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-slate-900 dark:text-white font-medium">{dn.debitNoteNo}</span>
                  <span className="text-slate-900 dark:text-white tabular-nums font-semibold">
                    {dn.currencySymbol && dn.currencySymbol !== "₹" ? `${dn.currencySymbol}${dn.grandTotal.toFixed(2)}` : formatINR(dn.grandTotal)}
                  </span>
                </div>
                <div className="text-slate-600 dark:text-slate-300 font-normal truncate mt-0.5">{dn.vendorName}</div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                  <span>{dn.date}</span>
                  <span className="uppercase text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{dn.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Debit Note Detail Canvas */}
        <div className="flex-1 h-full overflow-hidden print:block print:h-auto print:w-full print:overflow-visible print:p-0 print:m-0">
          <DebitNoteDetailView
            debitNote={selectedDebitNote}
            onClose={() => setSelectedDebitNoteId(null)}
          />
        </div>
      </div>
    )
  }

  // Master-Detail for Bills
  if (activeTab === "bills" && selectedDocId && selectedDoc) {
    return (
      <div className="flex h-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden select-none print:block print:h-auto print:w-full print:overflow-visible">
        {/* Left: Master Bill List */}
        <div className="master-list-panel w-80 lg:w-96 shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden print:hidden no-print">
          {/* Action Bar matching Reference */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-11 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-slate-900 dark:text-white">Bills</span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <Select
                variant="ghost"
                value={activeTab}
                onValueChange={(val) => setActiveTab(val as any)}
                options={[
                  { value: "bills", label: "All Bills" },
                  { value: "payments_made", label: "Payment Out (Payments Made)" },
                  { value: "reorder", label: "Reorder Suggestions" },
                ]}
                className="font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
              />
            </div>

            <Button
              size="sm"
              onClick={() => setIsCreateBillMode(true)}
              className="h-7 w-7 p-0 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-2xs cursor-pointer"
              title="Add New Bill"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Search */}
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-2 shrink-0">
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search bills..."
              value={inlineSearch}
              onChange={(e) => setInlineSearch(e.target.value)}
              className="w-full text-xs bg-transparent border-0 focus:outline-none placeholder:text-slate-400 text-slate-800 dark:text-slate-200"
            />
            {inlineSearch && (
              <button onClick={() => setInlineSearch("")} className="text-slate-400 hover:text-slate-600 text-xs">
                ✕
              </button>
            )}
          </div>

          {/* Master List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredPurchaseDocs.map(doc => {
              const isSelected = doc.id === selectedDocId
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDocId(doc.id)}
                  className={`flex items-start justify-between p-3 cursor-pointer transition-colors ${
                    isSelected 
                      ? "bg-blue-50/80 dark:bg-blue-950/40 border-l-[3px] border-l-blue-600" 
                      : "hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0 pr-2">
                    <input
                      type="checkbox"
                      checked={selectedRowIds.includes(doc.id)}
                      onChange={(e) => {
                        e.stopPropagation()
                        setSelectedRowIds(prev => prev.includes(doc.id) ? prev.filter(x => x !== doc.id) : [...prev, doc.id])
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                        {doc.partyName}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {doc.docNo} • {doc.date}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {(() => {
                      const partyForDoc = parties.find(p => p.id === doc.partyId || (p.name && doc.partyName && p.name.trim().toLowerCase() === doc.partyName.trim().toLowerCase()))
                      const docSymbol = doc.currencySymbol || partyForDoc?.currencySymbol || (doc.currency === "USD" || partyForDoc?.currency === "USD" ? "$" : doc.currency === "EUR" ? "€" : "₹")
                      return (
                        <>
                          <div className="text-xs font-semibold tabular-nums text-slate-900 dark:text-white">
                            {docSymbol}{doc.grandTotal.toFixed(2)}
                          </div>
                          {doc.paidAmount !== undefined && doc.paidAmount < doc.grandTotal ? (
                            <div className="text-[10px] font-semibold mt-0.5 text-rose-600 dark:text-rose-400 tabular-nums">
                              Due: {docSymbol}{(doc.grandTotal - doc.paidAmount).toFixed(2)}
                            </div>
                          ) : (
                            <div className="text-[10px] font-semibold mt-0.5 text-emerald-600 dark:text-emerald-400">
                              PAID
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </div>
                </div>
              )
            })}
          </div>

          <Pagination
            variant="master-list"
            totalCount={filteredPurchaseDocs.length}
            pageSize={pageSize}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>

        {/* Right: Bill Detail View Canvas */}
        <div className="flex-1 h-full overflow-hidden print:block print:h-auto print:w-full print:overflow-visible print:p-0 print:m-0">
          <BillDetailView
            bill={selectedDoc}
            onClose={() => setSelectedDocId(null)}
            onEdit={() => setEditingBillId(selectedDoc.id)}
          />
        </div>
      </div>
    )
  }

  // Master-Detail for Payments Made
  if (activeTab === "payments_made" && selectedPaymentId && selectedPayment) {
    return (
      <div className="flex h-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden select-none print:block print:h-auto print:w-full print:overflow-visible">
        {/* Left: Master Payments Out List */}
        <div className="master-list-panel w-80 lg:w-96 shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden print:hidden no-print">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-11 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-slate-900 dark:text-white">Payments Made</span>
            </div>

            <Button
              size="sm"
              onClick={() => setIsRecordPaymentMode(true)}
              className="h-7 w-7 p-0 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-2xs"
              title="Record Payment"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-2 shrink-0">
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search payments..."
              value={inlineSearch}
              onChange={(e) => setInlineSearch(e.target.value)}
              className="w-full text-xs bg-transparent border-0 focus:outline-none placeholder:text-slate-400 text-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredPaymentsOut.map(pmt => {
              const isSelected = pmt.id === selectedPaymentId
              return (
                <div
                  key={pmt.id}
                  onClick={() => setSelectedPaymentId(pmt.id)}
                  className={`flex items-start justify-between p-3 cursor-pointer transition-colors ${
                    isSelected 
                      ? "bg-blue-50/80 dark:bg-blue-950/40 border-l-[3px] border-l-blue-600" 
                      : "hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                      {pmt.partyName}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {pmt.paymentNo} • {pmt.date}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold tabular-nums text-slate-900 dark:text-white">
                      {pmt.currencySymbol && pmt.currencySymbol !== "₹" ? `${pmt.currencySymbol}${pmt.amount.toFixed(2)}` : `₹${pmt.amount.toLocaleString()}`}
                    </div>
                    <div className="text-[10px] font-semibold mt-0.5 uppercase text-slate-500">
                      {pmt.paymentMode}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="px-3 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
            <span>Rows: {filteredPaymentsOut.length}</span>
          </div>
        </div>

        {/* Right: Payment Detail Canvas */}
        <div className="flex-1 h-full overflow-hidden print:block print:h-auto print:w-full print:overflow-visible print:p-0 print:m-0">
          <PaymentDetailView
            payment={selectedPayment}
            onClose={() => setSelectedPaymentId(null)}
            onEdit={() => setIsRecordPaymentMode(true)}
          />
        </div>
      </div>
    )
  }

  // Full Table View
  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      
      {/* 1. Zoho Standard Action Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-11 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-sm text-slate-900 dark:text-white">
            Purchases
          </span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <Select
            variant="ghost"
            value={activeTab}
            onValueChange={(val) => {
              setActiveTab(val as any)
              setCurrentPage(1)
              setViewFilter("all")
              setInlineSearch("")
            }}
            options={[
              { value: "bills", label: "All Bills" },
              { value: "payments_made", label: "Payment Out (Payments Made)" },
              { value: "purchase_returns", label: "Purchase Returns (Outward Slips)" },
              { value: "debit_notes", label: "Debit Notes (Supplier Reversal)" },
              { value: "reorder", label: "Reorder Suggestions" },
            ]}
            className="font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Search */}
          <div className="relative hidden sm:block w-48 md:w-60">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder={`Search ${
                activeTab === "purchase_returns" ? "returns, vendors..."
                : activeTab === "debit_notes" ? "debit notes, vendors..."
                : activeTab === "payments_made" ? "payments, vendors..."
                : "bills..."
              }`}
              value={inlineSearch}
              onChange={(e) => setInlineSearch(e.target.value)}
              className="h-7 pl-8 text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-md"
            />
          </div>

          {activeTab === "payments_made" && (
            <Button
              size="sm"
              onClick={() => setIsRecordPaymentMode(true)}
              className="h-7 px-3 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-2xs gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Record Payment</span>
            </Button>
          )}

          {activeTab === "purchase_returns" && (
            <Button
              size="sm"
              onClick={() => setIsCreateReturnMode(true)}
              className="h-7 px-3 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-2xs gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Purchase Return</span>
            </Button>
          )}

          {activeTab === "debit_notes" && (
            <Button
              size="sm"
              onClick={() => {
                setLinkedReturnIdForDebitNote(undefined)
                setIsCreateDebitNoteMode(true)
              }}
              className="h-7 px-3 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-2xs gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Debit Note</span>
            </Button>
          )}

          {activeTab === "bills" && (
            <Button
              size="sm"
              onClick={() => setIsCreateBillMode(true)}
              className="h-7 px-3 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-2xs gap-1 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Bill</span>
            </Button>
          )}
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionToast && (
        <div className={`mx-4 sm:mx-6 mt-3 p-3 rounded-lg flex items-center justify-between text-xs shadow-xs animate-in fade-in slide-in-from-top-2 ${
          actionToast.type === "success" 
            ? "bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800" 
            : "bg-red-50 border border-red-200 text-red-800 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800"
        }`}>
          <div className="flex items-center gap-2">
            {actionToast.type === "success" ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />}
            <span>{actionToast.message}</span>
          </div>
          <button onClick={() => setActionToast(null)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* 2. Main Tab Body */}
      {activeTab === "payments_made" ? (
        /* PAYMENTS MADE (PAYMENT OUT) TABLE */
        <div className="p-4 md:p-6 flex-1 overflow-auto space-y-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
                  <TableHead className="px-4 py-3">DATE</TableHead>
                  <TableHead className="px-4 py-3">PAYMENT #</TableHead>
                  <TableHead className="px-4 py-3">VENDOR NAME</TableHead>
                  <TableHead className="px-4 py-3">BILL #</TableHead>
                  <TableHead className="px-4 py-3">MODE</TableHead>
                  <TableHead className="px-4 py-3">PAID FROM</TableHead>
                  <TableHead className="px-4 py-3">REFERENCE #</TableHead>
                  <TableHead className="px-4 py-3 text-right">AMOUNT PAID</TableHead>
                  <TableHead className="px-4 py-3 text-center">STATUS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPaymentsOut.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <CreditCard className="h-8 w-8 text-slate-300 dark:text-slate-700" />
                        <span className="font-semibold text-xs text-slate-600 dark:text-slate-400">
                          No payments made recorded yet
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsRecordPaymentMode(true)}
                          className="h-7 text-xs font-semibold text-blue-600 border-blue-200 mt-1"
                        >
                          Record First Payment
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPaymentsOut.map(pmt => (
                    <TableRow
                      key={pmt.id}
                      onClick={() => setSelectedPaymentId(pmt.id)}
                      className="border-b border-slate-100 dark:border-slate-800/80 transition-colors cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    >
                      <TableCell className="px-4 py-3.5 text-sm font-normal tabular-nums text-slate-600 dark:text-slate-300">
                        {pmt.date}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 font-semibold text-sm text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                        {pmt.paymentNo}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 font-medium text-sm text-slate-900 dark:text-white">
                        {pmt.partyName}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-sm font-normal text-slate-600 dark:text-slate-300">
                        {pmt.docNo || "Advance Payment"}
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {pmt.paymentMode}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-sm font-normal text-slate-600 dark:text-slate-300">
                        {pmt.paidFromAccount || "HDFC Current A/c"}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-sm font-normal text-slate-600 dark:text-slate-400 font-mono">
                        {pmt.referenceNo || "—"}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-right text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                        {pmt.currencySymbol && pmt.currencySymbol !== "₹" ? `${pmt.currencySymbol}${pmt.amount.toFixed(2)}` : `₹${pmt.amount.toLocaleString()}`}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800">
                          Completed
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            <Pagination
              totalCount={filteredPaymentsOut.length}
              pageSize={pageSize}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              itemLabel="Total Payment Records"
            />
          </div>
        </div>
      ) : activeTab === "bills" ? (
        /* BILLS TABLE */
        <div className="p-4 md:p-6 flex-1 overflow-auto space-y-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
                  <TableHead className="w-12 px-4 py-3 text-center">
                    <TableCheckbox
                      checked={selectedRowIds.length > 0 && selectedRowIds.length === purchaseDocs.length}
                      indeterminate={selectedRowIds.length > 0 && selectedRowIds.length < purchaseDocs.length}
                      onChange={() => {
                        if (selectedRowIds.length === purchaseDocs.length) setSelectedRowIds([])
                        else setSelectedRowIds(purchaseDocs.map(s => s.id))
                      }}
                    />
                  </TableHead>
                  <TableHead className="px-4 py-3">DATE</TableHead>
                  <TableHead className="px-4 py-3">BILL#</TableHead>
                  <TableHead className="px-4 py-3">VENDOR NAME</TableHead>
                  <TableHead className="px-4 py-3 text-center">STATUS</TableHead>
                  <TableHead className="px-4 py-3 text-right">TOTAL AMOUNT</TableHead>
                  <TableHead className="px-4 py-3 text-right">PAID AMOUNT</TableHead>
                  <TableHead className="px-4 py-3 text-right">BALANCE DUE</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchaseDocs.map(doc => {
                  const isSelected = selectedRowIds.includes(doc.id)

                  return (
                    <TableRow
                      key={doc.id}
                      onClick={() => setSelectedDocId(doc.id)}
                      className={`border-b border-slate-100 dark:border-slate-800/80 transition-colors cursor-pointer group ${
                        isSelected ? "bg-blue-50/50 dark:bg-blue-950/30" : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                      }`}
                    >
                      <TableCell className="px-4 py-3.5 text-center" onClick={(e) => {
                        e.stopPropagation()
                        setSelectedRowIds(prev => prev.includes(doc.id) ? prev.filter(x => x !== doc.id) : [...prev, doc.id])
                      }}>
                        <TableCheckbox checked={isSelected} onChange={() => {}} />
                      </TableCell>

                      <TableCell className="px-4 py-3.5 text-xs font-normal tabular-nums text-slate-500 dark:text-slate-400">
                        {doc.date}
                      </TableCell>

                      <TableCell className="px-4 py-3.5 font-semibold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                        {doc.docNo}
                      </TableCell>

                      <TableCell className="px-4 py-3.5 font-medium text-sm text-slate-800 dark:text-slate-200">
                        {doc.partyName}
                      </TableCell>

                      <TableCell className="px-4 py-3.5 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${
                          doc.paidAmount >= doc.grandTotal
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400"
                            : doc.paidAmount > 0
                            ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-400"
                            : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-400"
                        }`}>
                          {doc.paidAmount >= doc.grandTotal ? "PAID" : doc.paidAmount > 0 ? "PARTIAL" : "PENDING"}
                        </span>
                      </TableCell>

                      {(() => {
                        const partyForDoc = parties.find(p => p.id === doc.partyId || (p.name && doc.partyName && p.name.trim().toLowerCase() === doc.partyName.trim().toLowerCase()))
                        const docSymbol = doc.currencySymbol || partyForDoc?.currencySymbol || (doc.currency === "USD" || partyForDoc?.currency === "USD" ? "$" : doc.currency === "EUR" ? "€" : "₹")
                        return (
                          <>
                            <TableCell className="px-4 py-3.5 text-right font-semibold text-sm tabular-nums text-slate-900 dark:text-white">
                              {docSymbol}{doc.grandTotal.toFixed(2)}
                            </TableCell>

                            <TableCell className="px-4 py-3.5 text-right font-semibold text-sm tabular-nums text-emerald-600 dark:text-emerald-400">
                              {docSymbol}{doc.paidAmount.toFixed(2)}
                            </TableCell>

                            <TableCell className="px-4 py-3.5 text-right font-bold text-sm tabular-nums">
                              <span className={doc.grandTotal - doc.paidAmount > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}>
                                {docSymbol}{Math.max(0, doc.grandTotal - doc.paidAmount).toFixed(2)}
                              </span>
                            </TableCell>
                          </>
                        )
                      })()}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            <Pagination
              totalCount={filteredPurchaseDocs.length}
              pageSize={pageSize}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              itemLabel="Total Bills"
            />
          </div>
        </div>
      ) : activeTab === "purchase_returns" ? (
        /* PURCHASE RETURNS (OUTWARD DISPATCH SLIPS) */
        <div className="p-4 md:p-6 flex-1 overflow-auto space-y-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <button
              type="button"
              onClick={() => {
                setViewFilter("all")
                setCurrentPage(1)
              }}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                viewFilter === "all"
                  ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/25 ring-1 ring-blue-600/30 shadow-2xs"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs"
              }`}
            >
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Total Purchase Returns</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1.5 tabular-nums">
                {purchaseReturns.length}
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setViewFilter(viewFilter === "dispatched" ? "all" : "dispatched")
                setCurrentPage(1)
              }}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                viewFilter === "dispatched"
                  ? "border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/25 ring-1 ring-emerald-600/30 shadow-2xs"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs"
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Dispatched Value</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1.5 tabular-nums">
                ₹{formatINR(purchaseReturns.filter(r => r.status === "dispatched").reduce((acc, r) => acc + r.grandTotal, 0))}
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setViewFilter(viewFilter === "draft" ? "all" : "draft")
                setCurrentPage(1)
              }}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                viewFilter === "draft"
                  ? "border-amber-600 bg-amber-50/60 dark:bg-amber-950/25 ring-1 ring-amber-600/30 shadow-2xs"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs"
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Draft Gate Passes</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1.5 tabular-nums">
                {purchaseReturns.filter(r => r.status === "draft").length}
              </div>
            </button>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Total Units Outward</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1.5 tabular-nums">
                {purchaseReturns.reduce((sum, r) => sum + r.items.reduce((s, it) => s + it.qty, 0), 0)}
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Filter:</span>
            <button
              onClick={() => { setViewFilter("all"); setCurrentPage(1); }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                viewFilter === "all" ? "bg-blue-600 text-white font-semibold shadow-xs" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              All ({purchaseReturns.length})
            </button>
            <button
              onClick={() => { setViewFilter("dispatched"); setCurrentPage(1); }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                viewFilter === "dispatched" ? "bg-blue-600 text-white font-semibold shadow-xs" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              Dispatched ({purchaseReturns.filter(r => r.status === "dispatched").length})
            </button>
            <button
              onClick={() => { setViewFilter("draft"); setCurrentPage(1); }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                viewFilter === "draft" ? "bg-blue-600 text-white font-semibold shadow-xs" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              Draft ({purchaseReturns.filter(r => r.status === "draft").length})
            </button>
            <button
              onClick={() => { setViewFilter("acknowledged"); setCurrentPage(1); }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                viewFilter === "acknowledged" ? "bg-blue-600 text-white font-semibold shadow-xs" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              Acknowledged ({purchaseReturns.filter(r => r.status === "acknowledged").length})
            </button>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
                  <TableHead className="px-4 py-3">DATE</TableHead>
                  <TableHead className="px-4 py-3">RETURN SLIP #</TableHead>
                  <TableHead className="px-4 py-3">VENDOR</TableHead>
                  <TableHead className="px-4 py-3">BILL REF</TableHead>
                  <TableHead className="px-4 py-3">DISPATCH GODOWN</TableHead>
                  <TableHead className="px-4 py-3">REASON</TableHead>
                  <TableHead className="px-4 py-3 text-right">OUTWARD VALUE</TableHead>
                  <TableHead className="px-4 py-3 text-center">STATUS</TableHead>
                  <TableHead className="px-4 py-3 text-center">DEBIT NOTE</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchaseReturns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-slate-500">
                      No purchase returns found matching your filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPurchaseReturns.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(pr => {
                    const g = godowns.find(gd => gd.id === pr.dispatchGodownId)
                    return (
                      <TableRow
                        key={pr.id}
                        onClick={() => setSelectedReturnId(pr.id)}
                        className="border-b border-slate-100 dark:border-slate-800/80 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 group transition-colors"
                      >
                        <TableCell className="px-4 py-3.5 text-sm font-normal tabular-nums text-slate-600 dark:text-slate-300">
                          {pr.date}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 font-semibold text-sm text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                          {pr.returnNo}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 font-medium text-sm text-slate-900 dark:text-white">
                          {pr.vendorName}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-sm font-normal text-slate-600 dark:text-slate-300">
                          {pr.originalBillNo}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-sm font-normal text-slate-600 dark:text-slate-300">
                          {g?.name || "Main Godown"}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-sm font-normal text-slate-600 dark:text-slate-300 capitalize">
                          {pr.reason.replace(/_/g, " ")}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-right text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                          {pr.currencySymbol && pr.currencySymbol !== "₹" ? `${pr.currencySymbol}${pr.grandTotal.toFixed(2)}` : formatINR(pr.grandTotal)}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border ${
                            pr.status === "dispatched" ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300"
                            : pr.status === "acknowledged" ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300"
                            : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300"
                          }`}>
                            {pr.status}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-center">
                          {pr.debitNoteNo ? (
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                              {pr.debitNoteNo}
                            </span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setLinkedReturnIdForDebitNote(pr.id)
                                setIsCreateDebitNoteMode(true)
                              }}
                              className="text-xs font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 hover:underline cursor-pointer"
                            >
                              + Gen Note
                            </button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>

            <Pagination
              totalCount={filteredPurchaseReturns.length}
              pageSize={pageSize}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              itemLabel="Total Purchase Returns"
            />
          </div>
        </div>
      ) : activeTab === "debit_notes" ? (
        /* DEBIT NOTES (SUPPLIER REVERSALS) */
        <div className="p-4 md:p-6 flex-1 overflow-auto space-y-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <button
              type="button"
              onClick={() => {
                setViewFilter("all")
                setCurrentPage(1)
              }}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                viewFilter === "all"
                  ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/25 ring-1 ring-blue-600/30 shadow-2xs"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs"
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Total Debit Notes</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1.5 tabular-nums">
                {debitNotes.length}
              </div>
            </button>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Total Debit Issued</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1.5 tabular-nums">
                ₹{formatINR(debitNotes.reduce((sum, dn) => sum + dn.grandTotal, 0))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setViewFilter(viewFilter === "open" ? "all" : "open")
                setCurrentPage(1)
              }}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                viewFilter === "open"
                  ? "border-sky-600 bg-sky-50/60 dark:bg-sky-950/25 ring-1 ring-sky-600/30 shadow-2xs"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs"
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0" />
                <span className="text-xs font-semibold text-sky-700 dark:text-sky-300">Open Debits (Unsettled)</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1.5 tabular-nums">
                ₹{formatINR(debitNotes.filter(dn => dn.status === "open").reduce((sum, dn) => sum + dn.grandTotal, 0))}
              </div>
            </button>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">ITC Reversal Amount</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1.5 tabular-nums">
                ₹{formatINR(debitNotes.reduce((sum, dn) => sum + (dn.cgstTotal + dn.sgstTotal + dn.igstTotal), 0))}
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Filter:</span>
            <button
              onClick={() => { setViewFilter("all"); setCurrentPage(1); }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                viewFilter === "all" ? "bg-blue-600 text-white font-semibold shadow-xs" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              All ({debitNotes.length})
            </button>
            <button
              onClick={() => { setViewFilter("open"); setCurrentPage(1); }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                viewFilter === "open" ? "bg-blue-600 text-white font-semibold shadow-xs" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              Open ({debitNotes.filter(dn => dn.status === "open").length})
            </button>
            <button
              onClick={() => { setViewFilter("applied"); setCurrentPage(1); }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                viewFilter === "applied" ? "bg-blue-600 text-white font-semibold shadow-xs" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              Applied ({debitNotes.filter(dn => dn.status === "applied").length})
            </button>
            <button
              onClick={() => { setViewFilter("closed"); setCurrentPage(1); }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                viewFilter === "closed" ? "bg-blue-600 text-white font-semibold shadow-xs" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              Closed ({debitNotes.filter(dn => dn.status === "closed").length})
            </button>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
                  <TableHead className="px-4 py-3">DATE</TableHead>
                  <TableHead className="px-4 py-3">DEBIT NOTE #</TableHead>
                  <TableHead className="px-4 py-3">VENDOR</TableHead>
                  <TableHead className="px-4 py-3">BILL REF</TableHead>
                  <TableHead className="px-4 py-3">PURCHASE RETURN #</TableHead>
                  <TableHead className="px-4 py-3">REASON</TableHead>
                  <TableHead className="px-4 py-3">PLACE OF SUPPLY</TableHead>
                  <TableHead className="px-4 py-3 text-right">DEBIT VALUE</TableHead>
                  <TableHead className="px-4 py-3 text-center">STATUS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDebitNotes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-slate-500">
                      No debit notes found matching your filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDebitNotes.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(dn => (
                    <TableRow
                      key={dn.id}
                      onClick={() => setSelectedDebitNoteId(dn.id)}
                      className="border-b border-slate-100 dark:border-slate-800/80 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 group transition-colors"
                    >
                      <TableCell className="px-4 py-3.5 text-sm font-normal tabular-nums text-slate-600 dark:text-slate-300">
                        {dn.date}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 font-semibold text-sm text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                        {dn.debitNoteNo}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 font-medium text-sm text-slate-900 dark:text-white">
                        {dn.vendorName}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-sm font-normal text-slate-600 dark:text-slate-300">
                        {dn.originalBillNo}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-sm font-normal text-slate-600 dark:text-slate-300">
                        {dn.purchaseReturnNo || "—"}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-sm font-normal text-slate-600 dark:text-slate-300 capitalize">
                        {dn.reason.replace(/_/g, " ")}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-sm font-normal text-slate-600 dark:text-slate-300">
                        {dn.placeOfSupply}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-right text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                        {dn.currencySymbol && dn.currencySymbol !== "₹" ? `${dn.currencySymbol}${dn.grandTotal.toFixed(2)}` : formatINR(dn.grandTotal)}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border ${
                          dn.status === "open" ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300"
                          : dn.status === "applied" ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300"
                          : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300"
                        }`}>
                          {dn.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            <Pagination
              totalCount={filteredDebitNotes.length}
              pageSize={pageSize}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              itemLabel="Total Debit Notes"
            />
          </div>
        </div>
      ) : (
        /* REORDER SUGGESTIONS */
        <div className="p-4 md:p-6 flex-1 overflow-auto space-y-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-sm text-slate-900 dark:text-white">Automated Reorder Suggestions</h2>
                <p className="text-xs text-slate-500 mt-0.5">Calculated based on current on-hand quantities vs min safety stock thresholds.</p>
              </div>
              <Badge variant="outline" className="text-xs font-semibold text-rose-600 border-rose-200 bg-rose-50/50">
                {lowStockItems.length} Items Below Min Stock
              </Badge>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4 py-3">ITEM NAME</TableHead>
                  <TableHead className="px-4 py-3">SKU CODE</TableHead>
                  <TableHead className="px-4 py-3 text-right">CURRENT STOCK</TableHead>
                  <TableHead className="px-4 py-3 text-right">MIN THRESHOLD</TableHead>
                  <TableHead className="px-4 py-3 text-right">SUGGESTED REORDER</TableHead>
                  <TableHead className="px-4 py-3 text-center">ACTION</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-xs text-slate-500">
                      All item stocks are currently above minimum threshold levels.
                    </TableCell>
                  </TableRow>
                ) : (
                  lowStockItems.map(item => {
                    const suggestedOrder = (item.minStock * 2) - item.currentStock
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="px-4 py-3 font-semibold text-sm">{item.name}</TableCell>
                        <TableCell className="px-4 py-3 text-xs text-slate-500">{item.code}</TableCell>
                        <TableCell className="px-4 py-3 text-right text-sm font-bold text-rose-600 tabular-nums">
                          {item.currentStock} {item.unit}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right text-xs text-slate-500 tabular-nums">
                          {item.minStock} {item.unit}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-blue-600">
                          {suggestedOrder > 0 ? suggestedOrder : item.minStock} {item.unit}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          <Button
                            size="sm"
                            className="h-7 px-2.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md cursor-pointer"
                            onClick={() => {
                              const suggestedOrder = (item.minStock * 2) - item.currentStock
                              const reorderQty = suggestedOrder > 0 ? suggestedOrder : item.minStock
                              const rate = item.purchasePrice || 100
                              const gstRate = item.gstRate ?? 18
                              const taxableAmount = reorderQty * rate
                              const taxAmount = (taxableAmount * gstRate) / 100
                              const total = taxableAmount + taxAmount

                              const draftDoc: PurchaseDocument = {
                                id: "",
                                docNo: `PO-${Date.now().toString().slice(-4)}`,
                                type: "bill",
                                date: new Date().toISOString().split("T")[0],
                                partyId: "",
                                partyName: "",
                                partyGstin: "",
                                partyStateCode: "27",
                                godownId: godowns[0]?.id || "godown-1",
                                godownName: godowns[0]?.name || "Main Godown",
                                items: [{
                                  itemId: item.id,
                                  name: item.name,
                                  hsn: item.hsn || "290512",
                                  qty: reorderQty,
                                  unit: item.unit || "BOX",
                                  rate,
                                  discountPercent: 0,
                                  gstRate,
                                  taxableAmount,
                                  cgst: taxAmount / 2,
                                  sgst: taxAmount / 2,
                                  igst: 0,
                                  total
                                }],
                                subtotal: taxableAmount,
                                cgstTotal: taxAmount / 2,
                                sgstTotal: taxAmount / 2,
                                igstTotal: 0,
                                grandTotal: total,
                                status: "pending",
                                paidAmount: 0,
                                createdBy: "Admin",
                                notes: `Reorder purchase generated for low stock item: ${item.name} (${item.code})`
                              }

                              setReorderDraftBill(draftDoc)
                              setIsCreateBillMode(true)
                            }}
                          >
                            Create PO
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>

            <Pagination
              totalCount={lowStockItems.length}
              pageSize={pageSize}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              itemLabel="Total Suggestions"
            />
          </div>
        </div>
      )}

    </div>
  )
}
