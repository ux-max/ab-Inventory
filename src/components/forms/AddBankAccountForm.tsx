"use client"

import React, { useState } from "react"
import { useApp } from "@/context/AppContext"
import { BankAccount } from "@/types/inventory"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { 
  Save, 
  X, 
  ArrowLeft, 
  CheckCircle2,
  AlertCircle,
  Info
} from "lucide-react"

interface AddBankAccountFormProps {
  initialData?: BankAccount | null
  onSave: (bankData: Omit<BankAccount, "id" | "createdAt">) => void
  onCancel: () => void
}

export function AddBankAccountForm({ initialData, onSave, onCancel }: AddBankAccountFormProps) {
  const { bankAccounts } = useApp()

  const [accountDisplayName, setAccountDisplayName] = useState(initialData?.accountDisplayName || "")
  const [openingBalance, setOpeningBalance] = useState<string | number>(initialData?.openingBalance ?? "")
  const [asOfDate, setAsOfDate] = useState(
    initialData?.asOfDate || new Date().toISOString().split("T")[0]
  )
  const [accountNumber, setAccountNumber] = useState(initialData?.accountNumber || "")
  const [ifscCode, setIfscCode] = useState(initialData?.ifscCode || "")
  const [upiId, setUpiId] = useState(initialData?.upiId || "")
  const [bankName, setBankName] = useState(initialData?.bankName || "")
  const [accountHolderName, setAccountHolderName] = useState(initialData?.accountHolderName || "")
  const [branchName, setBranchName] = useState(initialData?.branchName || "")
  const [accountType, setAccountType] = useState<"current" | "savings" | "overdraft" | "cash_credit">(
    initialData?.accountType || "current"
  )

  const [printUpiQrOnInvoices, setPrintUpiQrOnInvoices] = useState(
    initialData?.printUpiQrOnInvoices ?? true
  )
  const [printBankDetailsOnInvoices, setPrintBankDetailsOnInvoices] = useState(
    initialData?.printBankDetailsOnInvoices ?? true
  )
  const [isDefault, setIsDefault] = useState(
    initialData?.isDefault ?? (bankAccounts.length === 0)
  )
  const [isActive, setIsActive] = useState<boolean>(
    initialData?.isActive !== false
  )

  const [errorMsg, setErrorMsg] = useState("")
  const [ifscStatus, setIfscStatus] = useState<string | null>(null)

  // Smart IFSC lookup simulator for common Indian Banks
  const handleIfscLookup = (code: string) => {
    const clean = code.trim().toUpperCase()
    setIfscCode(clean)
    if (!clean || clean.length < 4) {
      setIfscStatus(null)
      return
    }

    const prefix = clean.substring(0, 4)
    const bankMap: Record<string, string> = {
      HDFC: "HDFC Bank",
      SBIN: "State Bank of India",
      ICIC: "ICICI Bank",
      KKBK: "Kotak Mahindra Bank",
      AXIS: "Axis Bank",
      UTIB: "Axis Bank",
      PUNB: "Punjab National Bank",
      BARB: "Bank of Baroda",
      CNRB: "Canara Bank",
      UBIN: "Union Bank of India",
      IDIB: "Indian Bank",
      YESB: "Yes Bank",
      INDB: "IndusInd Bank",
      IDFB: "IDFC FIRST Bank",
      FDRL: "Federal Bank"
    }

    if (bankMap[prefix]) {
      if (!bankName) {
        setBankName(bankMap[prefix])
      }
      setIfscStatus(`Verified: ${bankMap[prefix]}`)
    } else {
      setIfscStatus(null)
    }
  }

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setErrorMsg("")

    if (!accountDisplayName.trim()) {
      setErrorMsg("Account Display Name is required.")
      return
    }

    const payload: Omit<BankAccount, "id" | "createdAt"> = {
      accountDisplayName: accountDisplayName.trim(),
      openingBalance: Number(openingBalance) || 0,
      asOfDate,
      accountNumber: accountNumber.trim(),
      ifscCode: ifscCode.trim().toUpperCase(),
      upiId: upiId.trim(),
      bankName: bankName.trim(),
      accountHolderName: accountHolderName.trim(),
      branchName: branchName.trim(),
      accountType,
      printUpiQrOnInvoices,
      printBankDetailsOnInvoices,
      isDefault,
      currentBalance: Number(openingBalance) || 0,
      isActive
    }

    onSave(payload)
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-auto">
      {/* 1. Standard Form Header (Sticky Top) */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-8 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={onCancel}
            className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title="Back to List"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {initialData ? "Edit Bank Account" : "Add Bank Account"}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="h-8 px-3 text-xs font-semibold bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 gap-1.5 shadow-2xs cursor-pointer"
          >
            <X className="h-3.5 w-3.5 text-slate-500" />
            <span>Cancel</span>
          </Button>

          <Button
            type="button"
            onClick={() => handleSubmit()}
            className="h-8 px-4 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-2xs rounded-md cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save Bank Account</span>
          </Button>
        </div>
      </div>

      {/* 2. Main Form Canvas */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between">
        <div className="w-full max-w-5xl px-8 py-6 space-y-7">
          {errorMsg && (
            <div className="p-3 rounded-md bg-rose-50 text-rose-800 border border-rose-200 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* SECTION 1: Account Information */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Account Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Account Display Name <span className="text-rose-500 font-semibold">*</span>
                </label>
                <Input
                  type="text"
                  value={accountDisplayName}
                  onChange={e => setAccountDisplayName(e.target.value)}
                  placeholder="e.g. HDFC Current A/C, ICICI Main"
                  className="h-9 text-xs border-slate-300 dark:border-slate-700 focus-visible:ring-blue-500 bg-white dark:bg-slate-900"
                />
                <p className="text-[11px] text-slate-400 mt-1">Short identifier used in transactions and reports</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Opening Balance
                </label>
                <div className="flex rounded-md shadow-2xs border border-slate-300 dark:border-slate-700 overflow-hidden focus-within:ring-1 focus-within:ring-blue-600 bg-white dark:bg-slate-900">
                  <span className="inline-flex items-center px-3 bg-slate-50 dark:bg-slate-800 text-slate-500 text-xs font-medium border-r border-slate-200 dark:border-slate-700">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={openingBalance}
                    onChange={e => setOpeningBalance(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 px-3 py-1.5 text-xs bg-transparent focus:outline-none font-medium tabular-nums text-slate-900 dark:text-slate-100"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Initial ledger opening balance</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  As of Date
                </label>
                <Input
                  type="date"
                  value={asOfDate}
                  onChange={e => setAsOfDate(e.target.value)}
                  className="h-9 text-xs border-slate-300 dark:border-slate-700 focus-visible:ring-blue-500 bg-white dark:bg-slate-900"
                />
                <p className="text-[11px] text-slate-400 mt-1">Balance cut-off date</p>
              </div>
            </div>
          </div>

          {/* SECTION 2: Bank & Account Details */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Bank & Account Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Account Number
                </label>
                <Input
                  type="text"
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value)}
                  placeholder="Enter Account Number"
                  className="h-9 text-xs tabular-nums border-slate-300 dark:border-slate-700 focus-visible:ring-blue-500 bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Account Holder Name
                </label>
                <Input
                  type="text"
                  value={accountHolderName}
                  onChange={e => setAccountHolderName(e.target.value)}
                  placeholder="Enter Account Holder Name"
                  className="h-9 text-xs border-slate-300 dark:border-slate-700 focus-visible:ring-blue-500 bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  UPI ID for QR Code
                </label>
                <Input
                  type="text"
                  value={upiId}
                  onChange={e => setUpiId(e.target.value)}
                  placeholder="e.g. company@okhdfcbank"
                  className="h-9 text-xs border-slate-300 dark:border-slate-700 focus-visible:ring-blue-500 bg-white dark:bg-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  IFSC Code
                </label>
                <Input
                  type="text"
                  value={ifscCode}
                  onChange={e => handleIfscLookup(e.target.value)}
                  placeholder="e.g. HDFC0000240"
                  maxLength={11}
                  className="h-9 uppercase text-xs tracking-wider border-slate-300 dark:border-slate-700 focus-visible:ring-blue-500 bg-white dark:bg-slate-900"
                />
                {ifscStatus && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium mt-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {ifscStatus}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Bank Name
                </label>
                <Input
                  type="text"
                  value={bankName}
                  onChange={e => setBankName(e.target.value)}
                  placeholder="e.g. HDFC Bank, ICICI Bank"
                  className="h-9 text-xs border-slate-300 dark:border-slate-700 focus-visible:ring-blue-500 bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Branch Name
                </label>
                <Input
                  type="text"
                  value={branchName}
                  onChange={e => setBranchName(e.target.value)}
                  placeholder="e.g. Nariman Point, Mumbai"
                  className="h-9 text-xs border-slate-300 dark:border-slate-700 focus-visible:ring-blue-500 bg-white dark:bg-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Account Type
                </label>
                <Select
                  value={accountType}
                  onValueChange={(val) => setAccountType(val as any)}
                  className="w-full h-9 text-xs"
                  options={[
                    { value: "current", label: "Current Account" },
                    { value: "savings", label: "Savings Account" },
                    { value: "overdraft", label: "Bank Overdraft (OD)" },
                    { value: "cash_credit", label: "Cash Credit (CC)" }
                  ]}
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: Invoice & Remittance Preferences */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Invoice & Payment Preferences
            </h2>

            <div className="space-y-4 bg-slate-50/60 dark:bg-slate-900/40 rounded-lg p-5 border border-slate-200/80 dark:border-slate-800">
              {/* Checkbox 1: Print offline UPI QR on Invoices */}
              <label className="flex items-start gap-3 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={printUpiQrOnInvoices}
                  onChange={e => setPrintUpiQrOnInvoices(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-colors cursor-pointer"
                />
                <div className="flex-1 text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                    Print offline UPI QR on Invoices (Only UPI, No automatic reconciliation)
                    <Info className="h-3.5 w-3.5 text-slate-400" />
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Generates an instant Bharat QR on your printed tax invoices so customers can scan and pay directly via GPay, PhonePe, or Paytm.
                  </p>
                </div>
              </label>

              {/* Checkbox 2: Print Bank Details on Invoices */}
              <label className="flex items-start gap-3 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={printBankDetailsOnInvoices}
                  onChange={e => setPrintBankDetailsOnInvoices(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-colors cursor-pointer"
                />
                <div className="flex-1 text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                    Print Bank Details on Invoices
                    <Info className="h-3.5 w-3.5 text-slate-400" />
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Prints this account's Bank Name, Account Number, IFSC Code, and Branch in the remittance section of Sales Invoices.
                  </p>
                </div>
              </label>

              {/* Checkbox 3: Set as Default Account */}
              <label className="flex items-start gap-3 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={e => setIsDefault(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-colors cursor-pointer"
                />
                <div className="flex-1 text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                    Set as Default Bank Account
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-800">
                      Recommended
                    </span>
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    All default invoices, payment receipts, and customer remittances will use this primary bank account.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* SECTION 4: Account Status */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Account Status
            </h2>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs">
                <input
                  type="radio"
                  name="accountStatus"
                  checked={isActive}
                  onChange={() => setIsActive(true)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                />
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs">
                <input
                  type="radio"
                  name="accountStatus"
                  checked={!isActive}
                  onChange={() => setIsActive(false)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                />
                <span className="font-semibold text-slate-600 dark:text-slate-400">Inactive</span>
              </label>
            </div>
            <p className="text-[11px] text-slate-400">
              Inactive accounts cannot be used for new transactions but remain preserved for historical audit trails.
            </p>
          </div>
        </div>
      </form>
    </div>
  )
}
