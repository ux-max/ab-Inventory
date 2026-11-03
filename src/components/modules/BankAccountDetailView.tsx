"use client"

import React, { useState } from "react"
import { BankAccount } from "@/types/inventory"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Landmark, 
  X, 
  Copy, 
  Check, 
  Star, 
  QrCode, 
  FileText, 
  CreditCard, 
  Building2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle2,
  Calendar,
  Layers,
  ChevronDown
} from "lucide-react"
import { DetailActionsMenu } from "@/components/ui/detail-actions-menu"
import { useApp } from "@/context/AppContext"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"

interface BankAccountDetailViewProps {
  account: BankAccount
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onMakeDefault: () => void
  onToggleStatus?: () => void
}

export function BankAccountDetailView({
  account,
  onClose,
  onEdit,
  onDelete,
  onMakeDefault,
  onToggleStatus
}: BankAccountDetailViewProps) {
  const { payments, updateBankAccount } = useApp()
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false)

  const isActive = account.isActive !== false

  const handleSetStatus = (newActive: boolean) => {
    updateBankAccount(account.id, { isActive: newActive })
    if (onToggleStatus && newActive !== isActive) {
      onToggleStatus()
    }
    setIsStatusDropdownOpen(false)
  }

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const openingBal = Number(account.openingBalance ?? account.currentBalance ?? 0)
  const currentBal = Number(account.currentBalance ?? account.openingBalance ?? 0)

  // Payments potentially routed through bank (bank, upi, cheque, transfer)
  const relatedPayments = payments.filter(
    p => p.paymentMode === "bank" || p.paymentMode === "upi" || p.paymentMode === "cheque"
  ).slice(0, 8)

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900 overflow-y-auto select-none text-slate-900 dark:text-slate-100">
      
      {/* 1. Header Toolbar */}
      <div className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Landmark className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight truncate">
                {account.accountDisplayName}
              </h1>
              {account.isDefault && (
                <Badge variant="blue" className="text-[10px] py-0 px-2 h-4.5 font-semibold shrink-0">
                  Default
                </Badge>
              )}

              {/* Interactive Status Selector Dropdown */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 transition-all hover:ring-2 hover:ring-offset-1 hover:ring-blue-300 dark:hover:ring-blue-700 cursor-pointer ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                      : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                  }`}
                  title="Click to change status"
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                  <span>{isActive ? "Active" : "Inactive"}</span>
                  <ChevronDown className="h-3 w-3 opacity-70" />
                </button>

                {isStatusDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsStatusDropdownOpen(false)} />
                    <div className="absolute left-0 mt-1.5 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-1 z-50 text-xs">
                      <div className="px-3 py-1 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-100 dark:border-slate-700/60 mb-1">
                        Change Status
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSetStatus(true)}
                        className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/60 cursor-pointer ${
                          isActive 
                            ? "font-bold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30" 
                            : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          <span>Active</span>
                        </div>
                        {isActive && <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetStatus(false)}
                        className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/60 cursor-pointer ${
                          !isActive 
                            ? "font-bold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30" 
                            : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-slate-400" />
                          <span>Inactive</span>
                        </div>
                        {!isActive && <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {account.bankName || "Commercial Bank"} • {account.branchName ? `${account.branchName} • ` : ""}{(account.accountType || "current").replace("_", " ").toUpperCase()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!account.isDefault && (
            <Button
              variant="outline"
              size="sm"
              onClick={onMakeDefault}
              className="h-8 px-3 text-xs font-semibold gap-1.5 border-slate-300 dark:border-slate-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 cursor-pointer"
            >
              <Star className="h-3.5 w-3.5" />
              <span>Set Default</span>
            </Button>
          )}

          <DetailActionsMenu
            onEdit={onEdit}
            onDelete={onDelete}
            title="Delete Bank Account"
            description={`Are you sure you want to delete bank account "${account.accountDisplayName}"? This action cannot be undone.`}
            itemName={account.accountDisplayName}
          />

          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8 px-2 text-xs font-semibold border-slate-300 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
            title="Close Detail View"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 2. Main Content Canvas */}
      <div className="p-6 md:p-8 max-w-4xl space-y-6 text-xs">
        
        {/* Opening Balance Card */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Opening Balance
              </span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums mt-1">
                ₹{openingBal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="flex items-center gap-6 sm:text-right">
              <div>
                <span className="text-[11px] text-slate-500 block">Current Ledger Balance</span>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                  ₹{currentBal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="border-l border-slate-200 dark:border-slate-800 pl-6">
                <span className="text-[11px] text-slate-500 block">As of Date</span>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {account.asOfDate || "—"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Banking Specifications Grid */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Account Specifications
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Account Number */}
            <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Account Number
              </span>
              <div className="flex items-center justify-between mt-1">
                <span className="font-mono text-xs font-semibold text-slate-900 dark:text-white">
                  {account.accountNumber || "—"}
                </span>
                {account.accountNumber && (
                  <button
                    onClick={() => handleCopy(account.accountNumber, "acc")}
                    className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                    title="Copy Account Number"
                  >
                    {copiedKey === "acc" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* IFSC Code */}
            <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                IFSC Code
              </span>
              <div className="flex items-center justify-between mt-1">
                <span className="font-mono text-xs font-semibold text-slate-900 dark:text-white uppercase">
                  {account.ifscCode || "—"}
                </span>
                {account.ifscCode && (
                  <button
                    onClick={() => handleCopy(account.ifscCode, "ifsc")}
                    className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                    title="Copy IFSC Code"
                  >
                    {copiedKey === "ifsc" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Account Holder */}
            <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Account Holder
              </span>
              <p className="text-xs font-semibold text-slate-900 dark:text-white mt-1 truncate">
                {account.accountHolderName || "—"}
              </p>
            </div>

            {/* Bank Name */}
            <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Bank Name
              </span>
              <p className="text-xs font-semibold text-slate-900 dark:text-white mt-1 truncate">
                {account.bankName || "—"}
              </p>
            </div>

            {/* Branch Name */}
            <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Branch Name
              </span>
              <p className="text-xs font-semibold text-slate-900 dark:text-white mt-1 truncate">
                {account.branchName || "Main Branch"}
              </p>
            </div>

            {/* UPI ID */}
            <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                UPI ID / VPA
              </span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {account.upiId || "—"}
                </span>
                {account.upiId && (
                  <button
                    onClick={() => handleCopy(account.upiId!, "upi")}
                    className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                    title="Copy UPI ID"
                  >
                    {copiedKey === "upi" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Remittance & Preferences */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Invoice Printing & QR Remittance
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/30">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                account.printUpiQrOnInvoices 
                  ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400" 
                  : "bg-slate-100 text-slate-400"
              }`}>
                <QrCode className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                  Dynamic UPI QR Code
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {account.printUpiQrOnInvoices ? "Printed automatically on sales invoices" : "Disabled for invoices"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/30">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                account.printBankDetailsOnInvoices 
                  ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400" 
                  : "bg-slate-100 text-slate-400"
              }`}>
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                  Bank Remittance Details
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {account.printBankDetailsOnInvoices ? "Printed on invoice footer for NEFT/RTGS" : "Disabled for invoices"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Related Payment Vouchers */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
          <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Recent Banking Activity
            </h3>
            <span className="text-[11px] text-slate-500">
              Showing recent digital & bank transactions
            </span>
          </div>

          {relatedPayments.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No recent bank payment vouchers found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 text-[11px]">
                  <TableHead className="px-4 py-2.5">DATE</TableHead>
                  <TableHead className="px-4 py-2.5">PAYMENT#</TableHead>
                  <TableHead className="px-4 py-2.5">PARTY</TableHead>
                  <TableHead className="px-4 py-2.5">MODE</TableHead>
                  <TableHead className="px-4 py-2.5 text-right">AMOUNT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relatedPayments.map(p => {
                  const isPaymentIn = p.type === "payment_in"
                  return (
                    <TableRow key={p.id} className="border-b border-slate-100 dark:border-slate-800/80 text-xs">
                      <TableCell className="px-4 py-2.5 text-slate-500 tabular-nums">
                        {p.date}
                      </TableCell>
                      <TableCell className="px-4 py-2.5 font-medium text-slate-900 dark:text-white">
                        {p.paymentNo}
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-slate-700 dark:text-slate-300">
                        {p.partyName}
                      </TableCell>
                      <TableCell className="px-4 py-2.5 uppercase text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                        {p.paymentMode}
                      </TableCell>
                      <TableCell className={`px-4 py-2.5 text-right font-semibold tabular-nums ${
                        isPaymentIn ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"
                      }`}>
                        {isPaymentIn ? "+" : "-"}₹{p.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </div>

      </div>
    </div>
  )
}
