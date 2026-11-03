"use client"

import React, { useState, useEffect } from "react"
import { useApp } from "@/context/AppContext"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { TableCheckbox } from "@/components/ui/table-bulk-actions"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AddPartyForm } from "@/components/forms/AddPartyForm"
import { RecordPaymentForm } from "@/components/forms/RecordPaymentForm"
import { Input } from "@/components/ui/input"
import { 
  Plus, 
  RotateCw, 
  Filter, 
  MoreHorizontal, 
  Search, 
  Phone, 
  Mail, 
  Building2, 
  FileText,
  Edit3
} from "lucide-react"
import { Party } from "@/types/inventory"
import { PartyDetailView } from "./PartyDetailView"
import { Select } from "@/components/ui/select"
import { Pagination } from "@/components/ui/pagination"

interface PartiesModuleProps {
  initialOpenAdd?: boolean
  onCloseAddTrigger?: () => void
  subModule?: string
}

export function PartiesModule({ initialOpenAdd = false, onCloseAddTrigger, subModule = "customers" }: PartiesModuleProps) {
  const { parties, addParty, updateParty, salesDocs, purchaseDocs, payments } = useApp()
  const [selectedPartyId, setSelectedPartyId] = useState<string | null>(null)
  const [isAddMode, setIsAddMode] = useState(initialOpenAdd)
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([])
  const [inlineSearch, setInlineSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [paymentMode, setPaymentMode] = useState<"payment_in" | "payment_out" | null>(null)
  const targetType: "customer" | "supplier" = subModule === "suppliers" ? "supplier" : "customer"
  const [partyTypeFilter, setPartyTypeFilter] = useState<"all" | "customer" | "supplier">(
    subModule === "suppliers" ? "supplier" : "customer"
  )

  useEffect(() => {
    setPartyTypeFilter(subModule === "suppliers" ? "supplier" : "customer")
    setSelectedPartyId(null)
  }, [subModule])

  const title = subModule === "suppliers" ? "Vendors" : "Customers"

  // Filter based on subModule and filters
  const filteredParties = parties.filter(p => {
    if (partyTypeFilter === "customer" && p.type === "supplier") return false
    if (partyTypeFilter === "supplier" && p.type === "customer") return false
    if (inlineSearch.trim()) {
      const q = inlineSearch.toLowerCase()
      return p.name.toLowerCase().includes(q) || p.phone.includes(q) || p.address.toLowerCase().includes(q)
    }
    return true
  })

  useEffect(() => {
    setCurrentPage(1)
  }, [partyTypeFilter, inlineSearch])

  const paginatedParties = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredParties.slice(start, start + pageSize)
  }, [filteredParties, currentPage, pageSize])

  const partyFilterOptions = [
    { value: "all", label: `All ${title}` },
    { value: "customer", label: "Customers" },
    { value: "supplier", label: "Vendors" },
  ]

  const selectedParty = parties.find(p => p.id === selectedPartyId) || null
  const partyInvoices = selectedParty ? salesDocs.filter(s => s.partyId === selectedParty.id) : []

  const toggleSelectRow = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setSelectedRowIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  if (isAddMode) {
    return (
      <AddPartyForm
        partyType={targetType}
        initialParty={selectedParty}
        onSave={(data) => {
          let res: { success: boolean; message: string }
          if (selectedParty) {
            res = updateParty(selectedParty.id, data)
          } else {
            res = addParty(data)
          }
          if (res && !res.success) {
            alert(res.message)
            return false
          }
          setIsAddMode(false)
          // If editing an existing party, keep that party open so user sees updated details immediately
          if (!selectedParty) {
            setSelectedPartyId(null)
          }
          if (onCloseAddTrigger) onCloseAddTrigger()
          return true
        }}
        onCancel={() => {
          setIsAddMode(false)
          if (onCloseAddTrigger) onCloseAddTrigger()
        }}
      />
    )
  }

  if (paymentMode) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-slate-950 overflow-y-auto">
        <RecordPaymentForm
          type={paymentMode}
          defaultPartyId={selectedPartyId || undefined}
          onCancel={() => setPaymentMode(null)}
          onSuccess={() => setPaymentMode(null)}
        />
      </div>
    )
  }

  if (selectedPartyId && selectedParty) {
    return (
      <div className="flex h-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden select-none">
        {/* Left: Master Party List */}
        <div className="master-list-panel w-80 lg:w-96 shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden print:hidden no-print">
          
          {/* Action Bar matching Reference */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-11 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-slate-900 dark:text-white">{title}</span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <Select
                variant="ghost"
                value={partyTypeFilter}
                onValueChange={(val) => setPartyTypeFilter(val as any)}
                options={partyFilterOptions}
                className="font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
              />
            </div>

            <Button
              size="sm"
              onClick={() => {
                setSelectedPartyId(null)
                setIsAddMode(true)
              }}
              className="h-7 w-7 p-0 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-2xs cursor-pointer"
              title={`Add New ${targetType}`}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Search */}
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-2 shrink-0">
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder={`Search ${title.toLowerCase()}...`}
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
            {filteredParties.map(p => {
              const isSelected = p.id === selectedPartyId
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPartyId(p.id)}
                  className={`flex items-start justify-between p-3 cursor-pointer transition-colors ${
                    isSelected 
                      ? "bg-blue-50/80 dark:bg-blue-950/40 border-l-[3px] border-l-blue-600" 
                      : "hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0 pr-2">
                    <input
                      type="checkbox"
                      checked={selectedRowIds.includes(p.id)}
                      onChange={(e) => toggleSelectRow(p.id, e as any)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                        {p.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {p.address || p.phone}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {(() => {
                      const isCust = p.type === "customer" || p.type === "both"
                      const unpaidCredit = isCust
                        ? salesDocs
                            .filter(s => (s.partyId === p.id || s.partyName === p.name))
                            .reduce((acc, s) => {
                              if (s.status === "paid") return acc
                              const linkedP = payments.filter(pmt => pmt.docId === s.id || pmt.docNo === s.docNo)
                              const paidFromPayments = linkedP.reduce((sum, pmt) => sum + pmt.amount, 0)
                              const totalPaid = Math.max(s.paidAmount || 0, paidFromPayments)
                              const bal = s.balanceAmount !== undefined ? s.balanceAmount : Math.max(0, s.grandTotal - totalPaid)
                              if (bal <= 0) return acc
                              if (s.isCredit || s.paymentMode === "credit" || s.status === "partial" || s.status === "pending") {
                                return acc + bal
                              }
                              return acc
                            }, 0)
                        : purchaseDocs
                            .filter(b => (b.partyId === p.id || b.partyName === p.name))
                            .reduce((acc, b) => {
                              if (b.status === "posted" && (b.paidAmount || 0) >= b.grandTotal) return acc
                              const linkedP = payments.filter(pmt => pmt.docId === b.id || pmt.docNo === b.docNo)
                              const paidFromPayments = linkedP.reduce((sum, pmt) => sum + pmt.amount, 0)
                              const totalPaid = Math.max(b.paidAmount || 0, paidFromPayments)
                              const bal = Math.max(0, b.grandTotal - totalPaid)
                              if (bal <= 0) return acc
                              if (b.isCredit || b.paymentMode === "credit" || b.status === "pending" || b.status === "posted") {
                                return acc + bal
                              }
                              return acc
                            }, 0)
                      const hasCreditDue = isCust && unpaidCredit > 0
                      const used = unpaidCredit
                      const avail = Math.max(0, p.creditLimit - used)
                      const sym = p.currencySymbol || "₹"

                      return (
                        <>
                          <div className="text-xs font-semibold tabular-nums text-slate-900 dark:text-white">
                            {sym}{hasCreditDue 
                              ? unpaidCredit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                              : Math.abs(p.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div className={`text-[10px] font-semibold mt-0.5 ${
                            (hasCreditDue || p.balance > 0) 
                              ? (isCust ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400")
                              : p.balance < 0 
                              ? (isCust ? "text-purple-600 dark:text-purple-400" : "text-amber-600 dark:text-amber-400")
                              : "text-slate-400"
                          }`}>
                            {isCust 
                              ? (hasCreditDue ? "Receivable (Dr)" : p.balance > 0 ? "Receivable (Dr)" : p.balance < 0 ? "Advance (Cr)" : "Settled")
                              : (p.balance < 0 ? "Payable (Cr)" : p.balance > 0 ? "Advance Paid (Dr)" : "Settled")}
                          </div>
                          <div className="text-[9px] text-slate-400 mt-0.5">
                            Avail: {sym}{avail.toLocaleString()}
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Master List Footer */}
          <Pagination
            variant="master-list"
            totalCount={filteredParties.length}
            pageSize={pageSize}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>

        {/* Right: Party Detail View Canvas */}
        <div className="flex-1 h-full overflow-hidden">
          <PartyDetailView
            party={selectedParty}
            onClose={() => setSelectedPartyId(null)}
            onEdit={() => setIsAddMode(true)}
            onRecordPayment={(type) => setPaymentMode(type)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      
      {/* 1. Zoho Standard Action Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-11">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-sm text-slate-900 dark:text-white">
            {title}
          </span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <Select
            variant="ghost"
            value={partyTypeFilter}
            onValueChange={(val) => setPartyTypeFilter(val as any)}
            options={partyFilterOptions}
            className="font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            onClick={() => {
              setSelectedPartyId(null)
              setIsAddMode(true)
            }}
            className="h-7 px-3 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-2xs gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New</span>
          </Button>
        </div>
      </div>

      {/* 2. Standard Card Data Table using ui/table.tsx */}
      <div className="p-4 md:p-6 flex-1 overflow-auto space-y-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
                <TableHead className="w-12 px-4 py-3 text-center">
                  <TableCheckbox
                    checked={paginatedParties.length > 0 && selectedRowIds.length === paginatedParties.length}
                    indeterminate={selectedRowIds.length > 0 && selectedRowIds.length < paginatedParties.length}
                    onChange={() => {
                      if (selectedRowIds.length === paginatedParties.length) setSelectedRowIds([])
                      else setSelectedRowIds(paginatedParties.map(p => p.id))
                    }}
                  />
                </TableHead>
                <TableHead className="px-4 py-3">NAME & ADDRESS</TableHead>
                <TableHead className="px-4 py-3">PHONE</TableHead>
                <TableHead className="px-4 py-3">GSTIN</TableHead>
                <TableHead className="px-4 py-3">STATE</TableHead>
                <TableHead className="px-4 py-3 text-right">CREDIT LIMIT & AVAILABLE</TableHead>
                <TableHead className="px-4 py-3 text-right">RECEIVABLES / PAYABLES</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedParties.map(p => {
                const isSelected = selectedRowIds.includes(p.id)
                const isCust = p.type === "customer" || p.type === "both"
                const unpaidCredit = isCust
                  ? salesDocs
                      .filter(s => (s.partyId === p.id || s.partyName === p.name))
                      .reduce((acc, s) => {
                        if (s.status === "paid") return acc
                        const linkedP = payments.filter(pmt => pmt.docId === s.id || pmt.docNo === s.docNo)
                        const paidFromPayments = linkedP.reduce((sum, pmt) => sum + pmt.amount, 0)
                        const totalPaid = Math.max(s.paidAmount || 0, paidFromPayments)
                        const bal = s.balanceAmount !== undefined ? s.balanceAmount : Math.max(0, s.grandTotal - totalPaid)
                        if (bal <= 0) return acc
                        if (s.isCredit || s.paymentMode === "credit" || s.status === "partial" || s.status === "pending") {
                          return acc + bal
                        }
                        return acc
                      }, 0)
                  : purchaseDocs
                      .filter(b => (b.partyId === p.id || b.partyName === p.name))
                      .reduce((acc, b) => {
                        if (b.status === "posted" && (b.paidAmount || 0) >= b.grandTotal) return acc
                        const linkedP = payments.filter(pmt => pmt.docId === b.id || pmt.docNo === b.docNo)
                        const paidFromPayments = linkedP.reduce((sum, pmt) => sum + pmt.amount, 0)
                        const totalPaid = Math.max(b.paidAmount || 0, paidFromPayments)
                        const bal = Math.max(0, b.grandTotal - totalPaid)
                        if (bal <= 0) return acc
                        if (b.isCredit || b.paymentMode === "credit" || b.status === "pending" || b.status === "posted") {
                          return acc + bal
                        }
                        return acc
                      }, 0)
                const hasCreditDue = isCust && unpaidCredit > 0
                const used = unpaidCredit
                const avail = Math.max(0, p.creditLimit - used)
                const sym = p.currencySymbol || (p.currency === "USD" ? "$" : p.currency === "EUR" ? "€" : p.currency === "AED" ? "د.إ" : p.currency === "GBP" ? "£" : "₹")

                return (
                  <TableRow
                    key={p.id}
                    onClick={() => setSelectedPartyId(p.id)}
                    className={`border-b border-slate-100 dark:border-slate-800/80 transition-colors cursor-pointer group ${
                      isSelected ? "bg-blue-50/50 dark:bg-blue-950/30" : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    <TableCell className="px-4 py-3.5 text-center" onClick={(e) => {
                      e.stopPropagation()
                      setSelectedRowIds(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])
                    }}>
                      <TableCheckbox checked={isSelected} onChange={() => {}} />
                    </TableCell>

                    <TableCell className="px-4 py-3.5">
                      <div className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                        {p.name}
                      </div>
                      <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-xs">{p.address}</div>
                    </TableCell>

                    <TableCell className="px-4 py-3.5 text-xs font-normal tabular-nums text-slate-600 dark:text-slate-300">
                      {p.phone}
                    </TableCell>

                    <TableCell className="px-4 py-3.5 text-xs font-normal text-slate-500 dark:text-slate-400">
                      {p.gstin || "Unregistered"}
                    </TableCell>

                    <TableCell className="px-4 py-3.5 text-sm font-normal text-slate-600 dark:text-slate-300">
                      {p.state}
                    </TableCell>

                    <TableCell className="px-4 py-3.5 text-right font-normal text-xs tabular-nums">
                      <div>
                        <span className={`font-semibold ${avail > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                          {sym}{avail.toLocaleString()}
                        </span>
                        <div className="text-[10px] text-slate-400">
                          Limit: {sym}{p.creditLimit.toLocaleString()}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="px-4 py-3.5 text-right font-semibold text-sm tabular-nums">
                      <div className="flex items-center justify-end gap-2.5">
                        <div className="text-right">
                          <span className={
                            (hasCreditDue || p.balance > 0) 
                              ? (isCust ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400")
                              : p.balance < 0 
                              ? (isCust ? "text-purple-600 dark:text-purple-400" : "text-amber-600 dark:text-amber-400") 
                              : "text-slate-400"
                          }>
                            {sym}{hasCreditDue 
                              ? unpaidCredit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                              : Math.abs(p.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <div className={`text-[10px] font-semibold ${
                            (hasCreditDue || p.balance > 0) 
                              ? (isCust ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400")
                              : p.balance < 0 
                              ? (isCust ? "text-purple-600 dark:text-purple-400" : "text-amber-600 dark:text-amber-400") 
                              : "text-slate-400"
                          }`}>
                            {isCust
                              ? (hasCreditDue ? "Dr (To Receive)" : p.balance > 0 ? "Dr (To Receive)" : p.balance < 0 ? "Cr (Advance)" : "Settled")
                              : (p.balance < 0 ? "Cr (Payable)" : p.balance > 0 ? "Dr (Advance Paid)" : "Settled")}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedPartyId(p.id)
                            setIsAddMode(true)
                          }}
                          className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title={`Edit ${p.name}`}
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {/* Standard Table Footer inside Card */}
          <Pagination
            totalCount={filteredParties.length}
            pageSize={pageSize}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemLabel="Total Count"
          />
        </div>
      </div>

    </div>
  )
}
