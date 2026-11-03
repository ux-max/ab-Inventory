"use client"

import React, { useState, useMemo } from "react"
import { useApp } from "@/context/AppContext"
import { BankAccount } from "@/types/inventory"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { TableCheckbox } from "@/components/ui/table-bulk-actions"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import { Pagination } from "@/components/ui/pagination"
import { AddBankAccountForm } from "@/components/forms/AddBankAccountForm"
import { BankAccountDetailView } from "./BankAccountDetailView"
import { 
  Plus, 
  Search,
  RotateCw, 
  Filter, 
  Landmark, 
  Edit3, 
  Trash2, 
  Copy, 
  Check, 
  MoreVertical,
  CheckCircle2,
  AlertCircle
} from "lucide-react"

export function BankAccountsModule() {
  const { 
    bankAccounts, 
    addBankAccount, 
    updateBankAccount, 
    deleteBankAccount, 
    setDefaultBankAccount 
  } = useApp()

  const [view, setView] = useState<"list" | "create" | "edit">("list")
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null)
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([])
  
  const [accountTypeFilter, setAccountTypeFilter] = useState<string>("all")
  const [inlineSearch, setInlineSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const handleCopy = (text: string, key: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  // Filtered accounts based on account type and search
  const filteredAccounts = useMemo(() => {
    return bankAccounts.filter(acc => {
      if (accountTypeFilter !== "all" && acc.accountType !== accountTypeFilter) {
        return false
      }
      if (inlineSearch.trim()) {
        const q = inlineSearch.toLowerCase()
        const matchesName = acc.accountDisplayName.toLowerCase().includes(q)
        const matchesBank = (acc.bankName || "").toLowerCase().includes(q)
        const matchesAccNo = (acc.accountNumber || "").toLowerCase().includes(q)
        const matchesIfsc = (acc.ifscCode || "").toLowerCase().includes(q)
        const matchesUpi = (acc.upiId || "").toLowerCase().includes(q)
        if (!matchesName && !matchesBank && !matchesAccNo && !matchesIfsc && !matchesUpi) {
          return false
        }
      }
      return true
    })
  }, [bankAccounts, accountTypeFilter, inlineSearch])

  const paginatedAccounts = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredAccounts.slice(start, start + pageSize)
  }, [filteredAccounts, currentPage, pageSize])

  const selectedAccount = useMemo(() => {
    return bankAccounts.find(a => a.id === selectedAccountId) || null
  }, [bankAccounts, selectedAccountId])

  // Bulk selection toggles
  const toggleSelectAll = () => {
    if (selectedRowIds.length === paginatedAccounts.length) {
      setSelectedRowIds([])
    } else {
      setSelectedRowIds(paginatedAccounts.map(a => a.id))
    }
  }

  const toggleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedRowIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleSave = (bankData: Omit<BankAccount, "id" | "createdAt">) => {
    if (editingAccount) {
      updateBankAccount(editingAccount.id, bankData)
    } else {
      addBankAccount(bankData)
    }
    setView("list")
    setEditingAccount(null)
  }

  const handleEdit = (account: BankAccount) => {
    setEditingAccount(account)
    setView("edit")
  }

  const handleDelete = (id: string) => {
    deleteBankAccount(id)
    if (selectedAccountId === id) {
      setSelectedAccountId(null)
    }
    setSelectedRowIds(prev => prev.filter(x => x !== id))
  }

  // 1. Create / Edit Mode
  if (view === "create" || view === "edit") {
    return (
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 overflow-y-auto">
        <AddBankAccountForm
          initialData={editingAccount}
          onSave={handleSave}
          onCancel={() => {
            setView("list")
            setEditingAccount(null)
          }}
        />
      </div>
    )
  }

  // 2. Master-Detail View (When an account is clicked)
  if (selectedAccountId && selectedAccount) {
    return (
      <div className="flex h-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden select-none">
        {/* Left: Master Accounts List */}
        <div className="master-list-panel w-80 lg:w-96 shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden print:hidden no-print">
          {/* Action Bar */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-11 shrink-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                Bank Accounts
              </span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <Select
                variant="ghost"
                value={accountTypeFilter}
                onValueChange={(val) => setAccountTypeFilter(val)}
                options={[
                  { value: "all", label: "All Accounts" },
                  { value: "current", label: "Current" },
                  { value: "savings", label: "Savings" },
                  { value: "overdraft", label: "Overdraft / CC" },
                ]}
                className="font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs"
              />
            </div>

            <Button
              size="sm"
              onClick={() => {
                setEditingAccount(null)
                setView("create")
              }}
              className="h-7 w-7 p-0 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-2xs shrink-0"
              title="Add Bank Account"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Search */}
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-2 shrink-0">
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search accounts..."
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

          {/* Master List items */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredAccounts.map(account => {
              const isSelected = account.id === selectedAccountId
              const bal = Number(account.currentBalance ?? account.openingBalance ?? 0)

              return (
                <div
                  key={account.id}
                  onClick={() => setSelectedAccountId(account.id)}
                  className={`flex items-start justify-between p-3 cursor-pointer transition-colors ${
                    isSelected 
                      ? "bg-blue-50/80 dark:bg-blue-950/40 border-l-[3px] border-l-blue-600" 
                      : "hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <div className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                        {account.accountDisplayName}
                      </div>
                      {account.isDefault && (
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" title="Default Account" />
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {account.bankName || "Commercial Bank"} • {(account.accountType || "current").toUpperCase()}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-semibold tabular-nums text-slate-900 dark:text-white">
                      ₹{bal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] font-semibold mt-0.5 uppercase text-slate-500">
                      {account.isDefault ? "Default" : account.isActive !== false ? "Active" : "Inactive"}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Master List Bottom Pagination Bar */}
          <Pagination
            variant="master-list"
            totalCount={filteredAccounts.length}
            pageSize={pageSize}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>

        {/* Right: Bank Account Detail Canvas */}
        <div className="flex-1 h-full overflow-hidden">
          <BankAccountDetailView
            account={selectedAccount}
            onClose={() => setSelectedAccountId(null)}
            onEdit={() => handleEdit(selectedAccount)}
            onDelete={() => handleDelete(selectedAccount.id)}
            onMakeDefault={() => setDefaultBankAccount(selectedAccount.id)}
            onToggleStatus={() => updateBankAccount(selectedAccount.id, { isActive: selectedAccount.isActive === false ? true : false })}
          />
        </div>
      </div>
    )
  }

  // 3. Full Standard Table View (When no account is selected)
  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden select-none">
      
      {/* 1. Standard Top Action Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-11 shrink-0">
        {/* Left: Module Title & Type Filter */}
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-sm text-slate-900 dark:text-white">
            Bank Accounts
          </span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <Select
            variant="ghost"
            value={accountTypeFilter}
            onValueChange={(val) => {
              setAccountTypeFilter(val)
              setCurrentPage(1)
            }}
            options={[
              { value: "all", label: "All Accounts" },
              { value: "current", label: "Current Accounts" },
              { value: "savings", label: "Savings Accounts" },
              { value: "overdraft", label: "Overdraft Accounts" },
              { value: "cash_credit", label: "Cash Credit (CC)" },
            ]}
            className="font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
          />
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => {
              setEditingAccount(null)
              setView("create")
            }}
            className="h-7 px-3 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-2xs gap-1 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New</span>
          </Button>
        </div>
      </div>

      {/* 2. Standard Card Data Table */}
      <div className="p-4 md:p-6 flex-1 overflow-auto space-y-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
                <TableHead className="w-12 px-4 py-3 text-center">
                  <TableCheckbox
                    checked={paginatedAccounts.length > 0 && selectedRowIds.length === paginatedAccounts.length}
                    indeterminate={selectedRowIds.length > 0 && selectedRowIds.length < paginatedAccounts.length}
                    onChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="px-4 py-3">ACCOUNT NAME & BANK</TableHead>
                <TableHead className="px-4 py-3">ACCOUNT NUMBER</TableHead>
                <TableHead className="px-4 py-3">IFSC CODE</TableHead>
                <TableHead className="px-4 py-3">ACCOUNT TYPE</TableHead>
                <TableHead className="px-4 py-3">UPI ID</TableHead>
                <TableHead className="px-4 py-3 text-center">STATUS</TableHead>
                <TableHead className="px-4 py-3 text-right">CURRENT BALANCE</TableHead>
                <TableHead className="px-4 py-3 text-center w-20">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-16 text-slate-400 text-xs">
                    No bank accounts found matching criteria.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedAccounts.map(account => {
                  const isSelected = selectedRowIds.includes(account.id)
                  const bal = Number(account.currentBalance ?? account.openingBalance ?? 0)

                  return (
                    <TableRow
                      key={account.id}
                      onClick={() => setSelectedAccountId(account.id)}
                      className={`border-b border-slate-100 dark:border-slate-800/80 transition-colors cursor-pointer group ${
                        isSelected 
                          ? "bg-blue-50/50 dark:bg-blue-950/30" 
                          : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                      }`}
                    >
                      {/* Selection Checkbox */}
                      <TableCell className="px-4 py-3.5 text-center" onClick={(e) => toggleSelectRow(account.id, e)}>
                        <TableCheckbox
                          checked={isSelected}
                          onChange={() => {}}
                        />
                      </TableCell>

                      {/* Account Display Name & Bank */}
                      <TableCell className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {account.accountDisplayName}
                          </div>
                          {account.isDefault && (
                            <Badge variant="blue" className="text-[10px] py-0 px-1.5 h-4 font-semibold">
                              Default
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                          {account.bankName || "Commercial Bank"}{account.branchName ? ` • ${account.branchName}` : ""}
                        </div>
                      </TableCell>

                      {/* Account Number with Quick Copy */}
                      <TableCell className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-sm font-normal text-slate-600 dark:text-slate-300 tabular-nums">
                          <span>{account.accountNumber || "—"}</span>
                          {account.accountNumber && (
                            <button
                              onClick={(e) => handleCopy(account.accountNumber, `${account.id}-acc`, e)}
                              className="text-slate-400 hover:text-blue-600 p-0.5 transition-colors"
                              title="Copy Account Number"
                            >
                              {copiedKey === `${account.id}-acc` ? (
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </TableCell>

                      {/* IFSC Code with Quick Copy */}
                      <TableCell className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-sm font-normal text-slate-600 dark:text-slate-300 uppercase">
                          <span>{account.ifscCode || "—"}</span>
                          {account.ifscCode && (
                            <button
                              onClick={(e) => handleCopy(account.ifscCode, `${account.id}-ifsc`, e)}
                              className="text-slate-400 hover:text-blue-600 p-0.5 transition-colors"
                              title="Copy IFSC Code"
                            >
                              {copiedKey === `${account.id}-ifsc` ? (
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </TableCell>

                      {/* Account Type */}
                      <TableCell className="px-4 py-3.5 text-sm font-normal text-slate-600 dark:text-slate-300 capitalize">
                        {(account.accountType || "current").replace("_", " ")}
                      </TableCell>

                      {/* UPI ID */}
                      <TableCell className="px-4 py-3.5 text-sm font-normal text-slate-600 dark:text-slate-300 truncate max-w-[180px]">
                        {account.upiId || "—"}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => updateBankAccount(account.id, { isActive: account.isActive === false ? true : false })}
                          className="cursor-pointer transition-transform active:scale-95"
                          title={`Status is ${account.isActive !== false ? "Active" : "Inactive"}. Click to toggle.`}
                        >
                          {account.isActive !== false ? (
                            <Badge variant="outline" className="text-xs font-medium bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 hover:bg-emerald-100 transition-colors">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs font-medium bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 hover:bg-slate-200 transition-colors">
                              Inactive
                            </Badge>
                          )}
                        </button>
                      </TableCell>

                      {/* Current Balance */}
                      <TableCell className="px-4 py-3.5 text-right font-semibold text-sm tabular-nums text-slate-900 dark:text-white">
                        ₹{bal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>

                      {/* Quick Actions */}
                      <TableCell className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEdit(account)}
                            className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Edit Account"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(account.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Delete Account"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>

          {/* Table Bottom Pagination Bar */}
          <Pagination
            variant="table"
            totalCount={filteredAccounts.length}
            pageSize={pageSize}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemLabel="Total Bank Accounts"
          />
        </div>
      </div>

    </div>
  )
}
