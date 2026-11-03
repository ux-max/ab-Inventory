"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useApp } from "@/context/AppContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { ArrowLeft, Save, X, Check, Building2, User, CreditCard, Landmark, FileText } from "lucide-react"
import { formatINR } from "@/lib/utils"

interface RecordPaymentFormProps {
  type: "payment_in" | "payment_out"
  defaultPartyId?: string
  defaultDocId?: string
  onCancel: () => void
  onSuccess?: (paymentNo: string) => void
}

export function RecordPaymentForm({
  type,
  defaultPartyId,
  defaultDocId,
  onCancel,
  onSuccess
}: RecordPaymentFormProps) {
  const { parties, salesDocs, purchaseDocs, recordPayment } = useApp()

  const isPaymentIn = type === "payment_in"

  // Party category switcher: Payment Out can pay vendor OR refund customer; Payment In can receive from customer OR receive vendor refund
  const defaultParty = parties.find(p => p.id === defaultPartyId)
  const initialCategory: "customer" | "supplier" = defaultParty
    ? (defaultParty.type === "customer" ? "customer" : "supplier")
    : (isPaymentIn ? "customer" : "supplier")

  const [partyCategory, setPartyCategory] = useState<"customer" | "supplier">(initialCategory)
  
  // Filter condition:
  // Payment In: only show parties where Customer/Vendor pays you (Due Dr > 0 or has unpaid invoices)
  // Payment Out: only show parties where You pay the Vendor/Customer (Payable Cr < 0 or has unpaid bills)
  const [filterDueOnly, setFilterDueOnly] = useState<boolean>(true)

  const qualifiesForPayment = (p: typeof parties[0], cat: "customer" | "supplier") => {
    if (isPaymentIn) {
      if (cat === "customer") {
        const hasUnpaidInv = salesDocs.some(s => {
          if (s.partyId !== p.id && s.partyName !== p.name) return false
          if (s.status === "paid") return false
          const bal = s.balanceAmount !== undefined ? s.balanceAmount : Math.max(0, s.grandTotal - (s.paidAmount || 0))
          return bal > 0
        })
        return p.balance > 0 || hasUnpaidInv
      } else {
        return p.balance > 0
      }
    } else {
      if (cat === "supplier") {
        const hasUnpaidBill = purchaseDocs.some(b => {
          if (b.partyId !== p.id && b.partyName !== p.name) return false
          const bal = b.grandTotal - (b.paidAmount || 0)
          return bal > 0 && b.status !== "posted"
        })
        return p.balance < 0 || hasUnpaidBill
      } else {
        return p.balance < 0
      }
    }
  }

  // Base list of parties matching category
  const baseCategoryParties = useMemo(() => {
    return parties.filter(p => 
      partyCategory === "customer" 
        ? (p.type === "customer" || p.type === "both") 
        : (p.type === "supplier" || p.type === "both")
    )
  }, [parties, partyCategory])

  const relevantParties = useMemo(() => {
    let list = filterDueOnly 
      ? baseCategoryParties.filter(p => qualifiesForPayment(p, partyCategory))
      : baseCategoryParties

    if (defaultPartyId && !list.some(p => p.id === defaultPartyId)) {
      const dp = parties.find(p => p.id === defaultPartyId)
      if (dp) list = [dp, ...list]
    }
    return list
  }, [baseCategoryParties, filterDueOnly, partyCategory, isPaymentIn, defaultPartyId, salesDocs, purchaseDocs, parties])

  const [partyId, setPartyId] = useState<string>(() => {
    if (defaultPartyId) return defaultPartyId
    const initialBase = parties.filter(p => 
      initialCategory === "customer" 
        ? (p.type === "customer" || p.type === "both") 
        : (p.type === "supplier" || p.type === "both")
    )
    const initialFiltered = initialBase.filter(p => qualifiesForPayment(p, initialCategory))
    return (initialFiltered[0] || initialBase[0])?.id || ""
  })

  const [amount, setAmount] = useState<string>("")
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0])
  const [paymentMode, setPaymentMode] = useState<"cash" | "upi" | "bank" | "cheque" | "card">("upi")
  const [account, setAccount] = useState("HDFC Current A/c (..4029)")
  const [referenceNo, setReferenceNo] = useState("")
  const [selectedDocId, setSelectedDocId] = useState<string>(defaultDocId || "")
  const [notes, setNotes] = useState("")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const selectedParty = parties.find(p => p.id === partyId)
  const partyCurrencySymbol = selectedParty?.currencySymbol || (selectedParty?.currency === "USD" ? "$" : selectedParty?.currency === "EUR" ? "€" : selectedParty?.currency === "AED" ? "د.إ" : selectedParty?.currency === "GBP" ? "£" : "₹")

  const handleCategoryChange = (cat: "customer" | "supplier") => {
    setPartyCategory(cat)
    const baseList = parties.filter(p => 
      cat === "customer" 
        ? (p.type === "customer" || p.type === "both") 
        : (p.type === "supplier" || p.type === "both")
    )
    const filtered = filterDueOnly ? baseList.filter(p => qualifiesForPayment(p, cat)) : baseList
    const nextParty = filtered[0] || baseList[0]
    setPartyId(nextParty?.id || "")
    setSelectedDocId("")
    if (nextParty) {
      if (isPaymentIn && nextParty.balance > 0) {
        setAmount(String(nextParty.balance))
      } else if (!isPaymentIn && nextParty.balance < 0) {
        setAmount(String(Math.abs(nextParty.balance)))
      } else {
        setAmount("")
      }
    } else {
      setAmount("")
    }
  }

  // Auto-fill amount when party changes if amount is empty
  useEffect(() => {
    if (selectedParty && (!amount || amount === "0")) {
      if (isPaymentIn) {
        if (selectedParty.balance > 0) {
          setAmount(String(selectedParty.balance))
        }
      } else {
        if (selectedParty.balance < 0) {
          setAmount(String(Math.abs(selectedParty.balance)))
        }
      }
    }
  }, [partyId, partyCategory, isPaymentIn, selectedParty])

  // Find open invoices for customer or open bills for vendor
  const openInvoices = salesDocs.filter(d => {
    const isPartyMatch = d.partyId === partyId || (selectedParty && d.partyName === selectedParty.name)
    if (!isPartyMatch) return false
    if (d.status === "paid") return false
    const bal = d.balanceAmount !== undefined ? d.balanceAmount : Math.max(0, d.grandTotal - (d.paidAmount || 0))
    return bal > 0
  })

  const openBills = purchaseDocs.filter(b => {
    const isPartyMatch = b.partyId === partyId || (selectedParty && b.partyName === selectedParty.name)
    if (!isPartyMatch) return false
    const balance = b.grandTotal - (b.paidAmount || 0)
    return balance > 0 && b.status !== "posted"
  })

  // Auto-fill amount if docId is selected
  useEffect(() => {
    if (selectedDocId) {
      if (isPaymentIn) {
        const inv = salesDocs.find(d => d.id === selectedDocId)
        if (inv) {
          const bal = inv.balanceAmount !== undefined 
            ? inv.balanceAmount 
            : Math.max(0, inv.grandTotal - (inv.paidAmount || 0))
          setAmount(String(bal))
        }
      } else {
        const bill = purchaseDocs.find(b => b.id === selectedDocId)
        if (bill) {
          const balance = bill.grandTotal - (bill.paidAmount || 0)
          setAmount(String(balance > 0 ? balance : bill.grandTotal))
        }
      }
    }
  }, [selectedDocId, isPaymentIn, salesDocs, purchaseDocs])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg("Please enter a valid payment amount greater than zero.")
      return
    }

    if (!partyId) {
      setErrorMsg(`Please select a valid ${partyCategory === "customer" ? "customer" : "vendor"}.`)
      return
    }

    if (selectedDocId && isPaymentIn) {
      const inv = salesDocs.find(d => d.id === selectedDocId)
      if (inv) {
        const maxDue = inv.balanceAmount !== undefined 
          ? inv.balanceAmount 
          : Math.max(0, inv.grandTotal - (inv.paidAmount || 0))
        if (parsedAmount > maxDue) {
          setErrorMsg(`Amount cannot exceed the remaining balance due of ${partyCurrencySymbol}${maxDue.toFixed(2)}. An advance of ${partyCurrencySymbol}${(inv.paidAmount || 0).toFixed(2)} was already received in the invoice.`)
          return
        }
      }
    }

    // Get selected doc details
    let linkedDocNo: string | undefined = undefined
    let linkedDocCurrency: string | undefined = undefined
    let linkedDocCurrencySymbol: string | undefined = undefined
    let linkedDocExchangeRate: number | undefined = undefined

    if (selectedDocId) {
      if (isPaymentIn) {
        const inv = salesDocs.find(d => d.id === selectedDocId)
        linkedDocNo = inv?.docNo
        linkedDocCurrency = inv?.currency
        linkedDocCurrencySymbol = inv?.currencySymbol
        linkedDocExchangeRate = inv?.exchangeRate
      } else {
        const bill = purchaseDocs.find(b => b.id === selectedDocId)
        linkedDocNo = bill?.docNo
        linkedDocCurrency = bill?.currency
        linkedDocCurrencySymbol = bill?.currencySymbol
        linkedDocExchangeRate = bill?.exchangeRate
      }
    }

    const payCurrency = linkedDocCurrency || selectedParty?.currency || "INR"
    const payCurrencySymbol = linkedDocCurrencySymbol || partyCurrencySymbol || "₹"

    const res = recordPayment({
      type,
      partyId,
      partyName: selectedParty?.name || "Unknown Party",
      amount: parsedAmount,
      currency: payCurrency,
      currencySymbol: payCurrencySymbol,
      exchangeRate: linkedDocExchangeRate,
      date,
      paymentMode,
      depositAccount: isPaymentIn ? account : undefined,
      paidFromAccount: !isPaymentIn ? account : undefined,
      referenceNo: referenceNo.trim() || undefined,
      docId: selectedDocId || undefined,
      docNo: linkedDocNo,
      notes: notes.trim() || undefined,
      status: "completed"
    })

    if (res.success) {
      if (onSuccess) onSuccess(res.paymentNo || "")
      onCancel()
    } else {
      setErrorMsg(res.message)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-auto">
      {/* 1. Header Bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            title="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              {isPaymentIn ? "Record Payment Received (Payment In)" : "Record Payment Made (Payment Out)"}
            </h1>
            <p className="text-[11px] text-slate-500">
              {isPaymentIn 
                ? "Record customer payment against invoices or advance receipts."
                : "Record disbursement to vendors against bills or purchase orders."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="h-8 px-3 text-xs font-semibold gap-1.5 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <X className="h-3.5 w-3.5 text-slate-500" />
            <span>Cancel</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            className="h-8 px-4 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-2xs gap-1.5"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save Payment</span>
          </Button>
        </div>
      </div>

      {/* 2. Main Form Canvas */}
      <form onSubmit={handleSubmit} className="w-full max-w-4xl px-8 py-6 space-y-6 text-xs">
        {errorMsg && (
          <div className="p-3 rounded-md bg-rose-50 text-rose-800 border border-rose-200 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Party Category Radio Buttons */}
        <div className="flex items-center gap-6">
          {!isPaymentIn ? (
            <>
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800 dark:text-slate-200">
                <input
                  type="radio"
                  name="partyCategory"
                  value="supplier"
                  checked={partyCategory === "supplier"}
                  onChange={() => handleCategoryChange("supplier")}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                />
                <span>Vendor / Supplier (You pay the Vendor)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800 dark:text-slate-200">
                <input
                  type="radio"
                  name="partyCategory"
                  value="customer"
                  checked={partyCategory === "customer"}
                  onChange={() => handleCategoryChange("customer")}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                />
                <span>Customer (You pay the Customer - Advance Refund)</span>
              </label>
            </>
          ) : (
            <>
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800 dark:text-slate-200">
                <input
                  type="radio"
                  name="partyCategory"
                  value="customer"
                  checked={partyCategory === "customer"}
                  onChange={() => handleCategoryChange("customer")}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                />
                <span>Customer (Customer pays you)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800 dark:text-slate-200">
                <input
                  type="radio"
                  name="partyCategory"
                  value="supplier"
                  checked={partyCategory === "supplier"}
                  onChange={() => handleCategoryChange("supplier")}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                />
                <span>Vendor (Vendor pays you - Refund)</span>
              </label>
            </>
          )}
        </div>

        {/* Party Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-red-600 dark:text-red-400">
                {partyCategory === "customer" ? "Customer Name*" : "Vendor / Supplier Name*"}
              </label>
              <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={filterDueOnly}
                  onChange={(e) => setFilterDueOnly(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span>
                  {isPaymentIn ? "Only show who pays you" : "Only show who you need to pay"}
                </span>
              </label>
            </div>

            <Select
              searchable
              searchPlaceholder={`Search ${partyCategory === "customer" ? "customer" : "vendor"} by name, GSTIN...`}
              placeholder={`Select ${partyCategory === "customer" ? "customer" : "vendor"}...`}
              value={partyId}
              onValueChange={(val) => {
                setPartyId(val)
                setSelectedDocId("")
              }}
              className="w-full h-9 text-xs font-medium"
              options={relevantParties.map(p => {
                let balDesc = ""
                if (isPaymentIn) {
                  if (partyCategory === "customer") {
                    if (p.balance > 0) balDesc = ` • Customer pays you: ${partyCurrencySymbol}${p.balance.toLocaleString()} (Dr)`
                    else if (p.balance < 0) balDesc = ` • Advance with us: ${partyCurrencySymbol}${Math.abs(p.balance).toLocaleString()} (Cr)`
                    else balDesc = ` • Settled`
                  } else {
                    if (p.balance > 0) balDesc = ` • Vendor pays you (Refund): ${partyCurrencySymbol}${p.balance.toLocaleString()} (Dr)`
                    else if (p.balance < 0) balDesc = ` • Payable: ${partyCurrencySymbol}${Math.abs(p.balance).toLocaleString()} (Cr)`
                    else balDesc = ` • Settled`
                  }
                } else {
                  if (partyCategory === "supplier") {
                    if (p.balance < 0) balDesc = ` • You pay the Vendor: ${partyCurrencySymbol}${Math.abs(p.balance).toLocaleString()} (Cr)`
                    else if (p.balance > 0) balDesc = ` • Advance paid: ${partyCurrencySymbol}${p.balance.toLocaleString()} (Dr)`
                    else balDesc = ` • Settled`
                  } else {
                    if (p.balance < 0) balDesc = ` • You pay the Customer (Refund): ${partyCurrencySymbol}${Math.abs(p.balance).toLocaleString()} (Cr)`
                    else if (p.balance > 0) balDesc = ` • Receivable: ${partyCurrencySymbol}${p.balance.toLocaleString()} (Dr)`
                    else balDesc = ` • Settled`
                  }
                }

                return {
                  value: p.id,
                  label: p.name,
                  description: `${p.gstin ? `GSTIN: ${p.gstin}` : (p.phone ? `Phone: ${p.phone}` : "No GSTIN")}${balDesc}`
                }
              })}
            />

            {relevantParties.length === 0 && (
              <div className="mt-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                No {partyCategory === "customer" ? "customers" : "vendors"} currently found who {isPaymentIn ? "owe you money" : "need to be paid"}. Uncheck the filter above to view all parties.
              </div>
            )}

            {selectedParty && (
              <div className="mt-1.5 text-[11px] text-slate-500 flex items-center gap-3">
                <span>Phone: {selectedParty.phone}</span>
                <span>•</span>
                <span>State: {selectedParty.state || "Maharashtra"}</span>
                {selectedParty.balance !== 0 && (
                  <>
                    <span>•</span>
                    <span className={
                      isPaymentIn 
                        ? (selectedParty.balance > 0 ? "text-red-600 dark:text-red-400 font-semibold" : "text-emerald-600 dark:text-emerald-400 font-semibold")
                        : (selectedParty.balance < 0 ? "text-red-600 dark:text-red-400 font-semibold" : "text-emerald-600 dark:text-emerald-400 font-semibold")
                    }>
                      {isPaymentIn
                        ? (selectedParty.balance > 0 
                            ? `Customer pays you: ${partyCurrencySymbol}${selectedParty.balance.toLocaleString()} Dr` 
                            : `Customer Advance: ${partyCurrencySymbol}${Math.abs(selectedParty.balance).toLocaleString()} Cr`)
                        : (selectedParty.balance < 0 
                            ? `You pay the ${partyCategory === "supplier" ? "Vendor" : "Customer"}: ${partyCurrencySymbol}${Math.abs(selectedParty.balance).toLocaleString()} Cr` 
                            : `Advance with Vendor: ${partyCurrencySymbol}${selectedParty.balance.toLocaleString()} Dr`)}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-red-600 dark:text-red-400 mb-1.5">
              {isPaymentIn ? `Amount Received (${partyCurrencySymbol})*` : `Amount Paid / Refunded (${partyCurrencySymbol})*`}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs font-semibold text-slate-400">{partyCurrencySymbol}</span>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7 h-9 text-xs font-bold tabular-nums"
                required
              />
            </div>
          </div>
        </div>

        {/* Date & Payment Mode */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-medium text-red-600 dark:text-red-400 mb-1.5">
              Payment Date*
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-9 text-xs"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Payment Mode*
            </label>
            <Select
              value={paymentMode}
              onValueChange={(val) => setPaymentMode(val as any)}
              className="w-full h-9 text-xs font-medium"
              options={[
                { value: "upi", label: "UPI (GPay / PhonePe / QR)" },
                { value: "bank", label: "Bank Transfer (NEFT / RTGS / IMPS)" },
                { value: "cash", label: "Cash" },
                { value: "cheque", label: "Cheque" },
                { value: "card", label: "Credit / Debit Card" },
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              {isPaymentIn ? "Deposit To Account*" : "Paid From Account*"}
            </label>
            <Select
              value={account}
              onValueChange={(val) => setAccount(val)}
              className="w-full h-9 text-xs font-medium"
              options={[
                { value: "HDFC Current A/c (..4029)", label: "HDFC Current A/c (..4029)" },
                { value: "ICICI Bank (..8821)", label: "ICICI Bank (..8821)" },
                { value: "Petty Cash / Counter", label: "Petty Cash / Counter" },
                { value: "Undeposited Funds", label: "Undeposited Funds" },
              ]}
            />
          </div>
        </div>

        {/* Reference Number */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Reference / Transaction ID / UTR / Cheque #
          </label>
          <Input
            type="text"
            placeholder="e.g. UTR1920381029, CHQ-882012, or UPI Ref"
            value={referenceNo}
            onChange={(e) => setReferenceNo(e.target.value)}
            className="h-9 text-xs max-w-md font-mono"
          />
        </div>

        <div className="border-b border-dashed border-slate-200 dark:border-slate-800 my-6" />

        {/* Invoice / Bill Allocation Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {isPaymentIn 
                ? (partyCategory === "supplier" ? "Vendor Refund Allocation" : "Invoice Allocation (Unpaid Invoices)") 
                : (partyCategory === "customer" ? "Customer Advance Refund Allocation" : "Bill Allocation (Unpaid Bills)")}
            </span>
            <span className="text-[11px] text-slate-500">
              {(!isPaymentIn && partyCategory === "customer") || (isPaymentIn && partyCategory === "supplier")
                ? "Direct ledger adjustment against party balance."
                : "Select a document to link this payment, or leave unlinked for advance payment."}
            </span>
          </div>

          {isPaymentIn ? (
            partyCategory === "supplier" ? (
              <div className="p-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 text-xs text-slate-600 dark:text-slate-400">
                Vendor refund receipt will be deposited into <strong className="text-slate-700 dark:text-slate-200">{account}</strong> and adjust the vendor advance balance directly.
              </div>
            ) : (
              openInvoices.length === 0 ? (
                <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 text-center text-xs">
                  No pending invoices found for {selectedParty?.name || "this customer"}. This payment will be recorded as an advance customer credit.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedDocId && (() => {
                    const selInv = openInvoices.find(i => i.id === selectedDocId)
                    if (!selInv) return null
                    const selPaid = selInv.paidAmount || 0
                    const selBal = selInv.balanceAmount !== undefined ? selInv.balanceAmount : Math.max(0, selInv.grandTotal - selPaid)
                    const sym = selInv.currencySymbol || partyCurrencySymbol
                    return (
                      <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs flex flex-wrap items-center justify-between gap-2">
                        <span className="text-slate-700 dark:text-slate-300">
                          Selected: <strong className="text-blue-600 dark:text-blue-400">{selInv.docNo}</strong> (Total: {sym}{selInv.grandTotal.toFixed(2)})
                          {selPaid > 0 && (
                            <span className="ml-2 font-semibold text-emerald-600 dark:text-emerald-400">
                              ✓ {sym}{selPaid.toFixed(2)} received in advance
                            </span>
                          )}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          Only Remaining Due: <span className="text-emerald-600 dark:text-emerald-400">{sym}{selBal.toFixed(2)}</span>
                        </span>
                      </div>
                    )
                  })()}

                  <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-300">
                        <tr>
                          <th className="py-2.5 px-3 w-10 text-center">Select</th>
                          <th className="py-2.5 px-3">Invoice #</th>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3 text-right">Invoice Total</th>
                          <th className="py-2.5 px-3 text-right">Advance Paid</th>
                          <th className="py-2.5 px-3 text-right">Remaining Due</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {openInvoices.map(inv => {
                          const isSelected = selectedDocId === inv.id
                          const invSym = inv.currencySymbol || partyCurrencySymbol
                          const invPaid = inv.paidAmount || 0
                          const invBal = inv.balanceAmount !== undefined 
                            ? inv.balanceAmount 
                            : Math.max(0, inv.grandTotal - invPaid)
                          return (
                            <tr
                              key={inv.id}
                              onClick={() => setSelectedDocId(isSelected ? "" : inv.id)}
                              className={`cursor-pointer transition-colors ${
                                isSelected ? "bg-blue-50/80 dark:bg-blue-950/40" : "hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                              }`}
                            >
                              <td className="p-2.5 text-center">
                                <input
                                  type="radio"
                                  name="selectedInvoice"
                                  checked={isSelected}
                                  onChange={() => setSelectedDocId(inv.id)}
                                  className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-slate-300"
                                />
                              </td>
                              <td className="p-2.5 font-semibold text-blue-600 dark:text-blue-400">
                                {inv.docNo}
                              </td>
                              <td className="p-2.5 text-slate-500">{inv.date}</td>
                              <td className="p-2.5 text-right font-semibold tabular-nums">
                                {invSym}{inv.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="p-2.5 text-right tabular-nums text-slate-500">
                                {invPaid > 0 ? (
                                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                    {invSym}{invPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="p-2.5 text-right font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                                {invSym}{invBal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            )
          ) : (
            partyCategory === "customer" ? (
              <div className="p-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 text-xs text-slate-600 dark:text-slate-400">
                Payment made to customer will be disbursed from <strong className="text-slate-700 dark:text-slate-200">{account}</strong> to <strong className="text-slate-700 dark:text-slate-200">{selectedParty?.name || "the customer"}</strong> and adjust their advance credit balance directly.
              </div>
            ) : (
              openBills.length === 0 ? (
                <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 text-center text-xs">
                  No pending bills found for {selectedParty?.name || "this vendor"}. This payment will be recorded as an advance vendor payment.
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-300">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">Select</th>
                        <th className="py-2.5 px-3">Bill #</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3 text-right">Bill Amount</th>
                        <th className="py-2.5 px-3 text-right">Balance Due</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {openBills.map(bill => {
                        const isSelected = selectedDocId === bill.id
                        const balance = bill.grandTotal - (bill.paidAmount || 0)
                        const billSym = bill.currencySymbol || partyCurrencySymbol
                        return (
                          <tr
                            key={bill.id}
                            onClick={() => setSelectedDocId(isSelected ? "" : bill.id)}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? "bg-blue-50/80 dark:bg-blue-950/40" : "hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                            }`}
                          >
                            <td className="p-2.5 text-center">
                              <input
                                type="radio"
                                name="selectedBill"
                                checked={isSelected}
                                onChange={() => setSelectedDocId(bill.id)}
                                className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-slate-300"
                              />
                            </td>
                            <td className="p-2.5 font-semibold text-blue-600 dark:text-blue-400">
                              {bill.docNo}
                            </td>
                            <td className="p-2.5 text-slate-500">{bill.date}</td>
                            <td className="p-2.5 text-right font-semibold tabular-nums">
                              {billSym}{bill.grandTotal.toLocaleString()}
                            </td>
                            <td className="p-2.5 text-right font-bold tabular-nums text-rose-600 dark:text-rose-400">
                              {billSym}{(balance > 0 ? balance : bill.grandTotal).toLocaleString()}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )
            )
          )}
        </div>

        <div className="border-b border-dashed border-slate-200 dark:border-slate-800 my-6" />

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Notes / Internal Remarks
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Cleared via UPI transaction ref, bank confirmation received"
            className="w-full max-w-xl p-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
          />
        </div>
      </form>
    </div>
  )
}
