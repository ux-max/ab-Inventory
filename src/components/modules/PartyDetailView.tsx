"use client"

import React, { useState, useMemo } from "react"
import { Party } from "@/types/inventory"
import { useApp } from "@/context/AppContext"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { DetailActionsMenu } from "@/components/ui/detail-actions-menu"
import { 
  Building2, 
  Edit3, 
  MoreHorizontal, 
  X, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard, 
  FileText, 
  Clock, 
  Share2, 
  ArrowUpRight, 
  ArrowDownLeft,
  CheckCircle2,
  DollarSign,
  Plus
} from "lucide-react"

interface PartyDetailViewProps {
  party: Party
  onClose: () => void
  onEdit?: () => void
  onDelete?: () => void
  onCreateInvoice?: () => void
  onRecordPayment?: (type: "payment_in" | "payment_out") => void
}

export function PartyDetailView({ party, onClose, onEdit, onDelete, onCreateInvoice, onRecordPayment }: PartyDetailViewProps) {
  const { salesDocs, purchaseDocs, payments, deleteParty, gstSettings } = useApp()
  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "statement">("overview")
  const [txFilter, setTxFilter] = useState<"all" | "invoices" | "bills" | "payments">("all")

  // Transactions relating to this party
  const partySales = salesDocs.filter(s => s.partyId === party.id || s.partyName === party.name)
  const partyPurchases = purchaseDocs.filter(p => p.partyId === party.id || p.partyName === party.name)
  const partyPayments = payments.filter(p => p.partyId === party.id || (p.partyName && p.partyName.trim().toLowerCase() === party.name.trim().toLowerCase()))

  const isCustomer = party.type === "customer" || party.type === "both"
  const isVendor = party.type === "supplier" || party.type === "both"

  // Financial calculations
  const totalInvoiced = partySales.reduce((acc, s) => acc + s.grandTotal, 0)
  const totalBilled = partyPurchases.reduce((acc, p) => acc + p.grandTotal, 0)
  const totalPaid = partySales.reduce((acc, s) => acc + (s.paidAmount || (s.status === "paid" ? s.grandTotal : 0)), 0)

  // Credit calculation:
  // Any credit sales or unpaid invoices represent amounts due from customer
  const unpaidCreditSales = partySales
    .filter(s => s.partyId === party.id || s.partyName === party.name)
    .reduce((acc, s) => {
      if (s.status === "paid") return acc
      const linkedP = payments.filter(p => p.docId === s.id || p.docNo === s.docNo)
      const paidFromPayments = linkedP.reduce((sum, p) => sum + p.amount, 0)
      const totalPaid = Math.max(s.paidAmount || 0, paidFromPayments)
      const bal = s.balanceAmount !== undefined ? s.balanceAmount : Math.max(0, s.grandTotal - totalPaid)
      if (bal <= 0) return acc
      if (s.isCredit || s.paymentMode === "credit" || s.status === "partial" || s.status === "pending") {
        return acc + bal
      }
      return acc
    }, 0)

  // Unpaid credit purchases represent credit utilized from vendor
  const unpaidCreditPurchases = partyPurchases
    .filter(p => p.partyId === party.id || p.partyName === party.name)
    .reduce((acc, p) => {
      if (p.status === "posted" && (p.paidAmount || 0) >= p.grandTotal) return acc
      const linkedP = payments.filter(pmt => pmt.docId === p.id || pmt.docNo === p.docNo)
      const paidFromPayments = linkedP.reduce((sum, pmt) => sum + pmt.amount, 0)
      const totalPaid = Math.max(p.paidAmount || 0, paidFromPayments)
      const bal = Math.max(0, p.grandTotal - totalPaid)
      if (bal <= 0) return acc
      if (p.isCredit || p.paymentMode === "credit" || p.status === "pending" || p.status === "posted") {
        return acc + bal
      }
      return acc
    }, 0)

  // Credit used strictly reflects unpaid credit documents (Credit Invoices / Bills).
  // Account ledger balance (Opening Balance / Payments In & Out) is kept completely separate!
  const usedCredit = isCustomer ? unpaidCreditSales : unpaidCreditPurchases

  // Available Credit: DEDUCTED from total credit limit
  const availableCredit = Math.max(0, party.creditLimit - usedCredit)
  const creditUtilPercent = party.creditLimit > 0 
    ? Math.min(100, Math.round((usedCredit / party.creditLimit) * 100)) 
    : 0

  const hasCreditDue = isCustomer ? unpaidCreditSales > 0 : unpaidCreditPurchases > 0
  const isReceivable = hasCreditDue || party.balance > 0
  const isPayable = !hasCreditDue && party.balance < 0
  const pSym = party.currencySymbol || (party.currency === "USD" ? "$" : party.currency === "EUR" ? "€" : party.currency === "AED" ? "د.إ" : party.currency === "GBP" ? "£" : "₹")

  // Statement Ledger Calculation including Opening Balance
  const statementRows = useMemo(() => {
    const rawOpening = party.openingBalance !== undefined ? party.openingBalance : Math.abs(party.balance)
    const isDrOpening = party.openingBalanceType 
      ? party.openingBalanceType === "debit" 
      : (isCustomer ? party.balance >= 0 : party.balance > 0)
    const opBal = isDrOpening ? rawOpening : -rawOpening

    const txns: Array<{
      id: string
      date: string
      desc: string
      debit: number
      credit: number
    }> = []

    partySales.forEach(s => {
      txns.push({
        id: s.id,
        date: s.date,
        desc: `Sales Invoice #${s.docNo}`,
        debit: s.grandTotal,
        credit: 0
      })
      // If invoice had advance / down payment and no standalone payment record exists in partyPayments
      const hasLinkedPayment = partyPayments.some(p => p.docId === s.id || p.docNo === s.docNo)
      if ((s.paidAmount || 0) > 0 && !hasLinkedPayment) {
        txns.push({
          id: `adv-${s.id}`,
          date: s.date,
          desc: `Advance Received on Invoice #${s.docNo}`,
          debit: 0,
          credit: s.paidAmount || 0
        })
      }
    })

    partyPurchases.forEach(p => {
      txns.push({
        id: p.id,
        date: p.date,
        desc: `Purchase Bill #${p.docNo}`,
        debit: 0,
        credit: p.grandTotal
      })
    })

    partyPayments.forEach(pay => {
      if (pay.type === "payment_in") {
        txns.push({
          id: pay.id,
          date: pay.date,
          desc: `Payment Received (${pay.paymentMode.toUpperCase()}${pay.referenceNo ? ` - ${pay.referenceNo}` : ""})`,
          debit: 0,
          credit: pay.amount
        })
      } else {
        txns.push({
          id: pay.id,
          date: pay.date,
          desc: `Payment Made (${pay.paymentMode.toUpperCase()}${pay.referenceNo ? ` - ${pay.referenceNo}` : ""})`,
          debit: pay.amount,
          credit: 0
        })
      }
    })

    txns.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    let running = opBal
    const rows = [
      {
        id: "opening",
        date: party.openingBalanceDate || "2026-04-01",
        desc: `Opening Balance (${isDrOpening ? "Debit / To Receive" : "Credit / To Pay"})`,
        debit: isDrOpening ? rawOpening : 0,
        credit: !isDrOpening ? rawOpening : 0,
        balance: opBal
      }
    ]

    txns.forEach(tx => {
      running += (tx.debit - tx.credit)
      rows.push({
        ...tx,
        balance: running
      })
    })

    return rows
  }, [party, partySales, partyPurchases, partyPayments, isCustomer])

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 overflow-hidden">
      
      {/* 1. Header matching Reference Image Layout */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                {party.name}
              </h1>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide border ${
                party.type === "customer" 
                  ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800"
                  : party.type === "supplier"
                  ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
              }`}>
                {party.type === "supplier" ? "Vendor" : party.type === "both" ? "Customer & Vendor" : "Customer"}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              GSTIN: <span className="font-medium text-slate-700 dark:text-slate-300">{party.gstin || "Unregistered"}</span> • {party.state}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="h-8 px-3 text-xs gap-1.5 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold cursor-pointer"
              title={party.type === "supplier" ? "Edit Vendor" : "Edit Customer"}
            >
              <Edit3 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span>Edit</span>
            </Button>
          )}

          {onCreateInvoice && isCustomer && (
            <Button
              size="sm"
              onClick={onCreateInvoice}
              className="h-8 px-3 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-2xs font-semibold cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Invoice</span>
            </Button>
          )}

          {onRecordPayment && isCustomer && (hasCreditDue || party.balance > 0) && (
            <Button
              size="sm"
              onClick={() => onRecordPayment("payment_in")}
              className="h-8 px-3 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer shadow-2xs"
              title="Record payment received"
            >
              <ArrowDownLeft className="h-3.5 w-3.5" />
              <span>Receive Payment</span>
            </Button>
          )}

          {onRecordPayment && isCustomer && !hasCreditDue && party.balance < 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRecordPayment("payment_out")}
              className="h-8 px-3 text-xs gap-1.5 border-amber-300 dark:border-amber-700 bg-amber-50/80 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 hover:bg-amber-100 font-semibold cursor-pointer"
              title="Refund customer advance payment (Payment Out)"
            >
              <ArrowUpRight className="h-3.5 w-3.5 text-amber-600" />
              <span>Refund Advance</span>
            </Button>
          )}

          {onRecordPayment && isCustomer && !hasCreditDue && party.balance > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRecordPayment("payment_in")}
              className="h-8 px-3 text-xs gap-1.5 border-emerald-300 dark:border-emerald-700 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 font-semibold cursor-pointer"
              title="Record payment received from customer"
            >
              <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-600" />
              <span>Payment In</span>
            </Button>
          )}

          {onRecordPayment && isVendor && party.balance < 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRecordPayment("payment_out")}
              className="h-8 px-3 text-xs gap-1.5 border-purple-300 dark:border-purple-700 bg-purple-50/80 dark:bg-purple-950/40 text-purple-800 dark:text-purple-200 hover:bg-purple-100 font-semibold cursor-pointer"
              title="Pay vendor bill"
            >
              <ArrowUpRight className="h-3.5 w-3.5 text-purple-600" />
              <span>Payment Out</span>
            </Button>
          )}

          {onRecordPayment && isVendor && party.balance > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRecordPayment("payment_in")}
              className="h-8 px-3 text-xs gap-1.5 border-emerald-300 dark:border-emerald-700 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 font-semibold cursor-pointer"
              title="Receive advance refund from vendor (Payment In)"
            >
              <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-600" />
              <span>Receive Refund</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => alert(`WhatsApp notification initiated for ${party.name} (${party.phone})`)}
            className="h-8 px-3 text-xs gap-1.5 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            title="Chat on WhatsApp"
          >
            <Share2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>WhatsApp</span>
          </Button>

          <DetailActionsMenu
            onEdit={onEdit}
            onDelete={() => {
              if (onDelete) {
                onDelete()
              } else {
                deleteParty(party.id)
                onClose()
              }
            }}
            title={party.type === "supplier" ? "Delete Vendor" : "Delete Customer"}
            description={`Are you sure you want to delete "${party.name}"? This party and all associated records will be permanently removed.`}
            itemName={`${party.name} • ${party.gstin || party.state}`}
          />

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            title="Close Detail View"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 2. Tabs Navigation matching Reference Image */}
      <div className="flex items-center gap-8 px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <button
          onClick={() => setActiveTab("overview")}
          className={`py-3 text-xs font-semibold tracking-wide border-b-2 transition-colors ${
            activeTab === "overview"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("transactions")}
          className={`py-3 text-xs font-semibold tracking-wide border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === "transactions"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <span>Transactions</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold tabular-nums">
            {partySales.length + partyPurchases.length + partyPayments.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("statement")}
          className={`py-3 text-xs font-semibold tracking-wide border-b-2 transition-colors ${
            activeTab === "statement"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          Statement
        </button>
      </div>

      {/* 3. Tab Contents */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl">
            
            {/* Left Column: Two-Column Form Info */}
            <div className="lg:col-span-7 space-y-7">
              
              {/* Primary Contact Details */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                  Contact Information
                </h3>
                <div className="space-y-2.5 text-xs">
                  <div className="grid grid-cols-3 py-1 border-b border-slate-100 dark:border-slate-800/60">
                    <span className="text-slate-500 dark:text-slate-400">Primary Contact</span>
                    <span className="col-span-2 font-medium text-slate-800 dark:text-slate-200">{party.name}</span>
                  </div>
                  <div className="grid grid-cols-3 py-1 border-b border-slate-100 dark:border-slate-800/60">
                    <span className="text-slate-500 dark:text-slate-400">Company Name</span>
                    <span className="col-span-2 font-medium text-slate-800 dark:text-slate-200">{party.name}</span>
                  </div>
                  <div className="grid grid-cols-3 py-1 border-b border-slate-100 dark:border-slate-800/60">
                    <span className="text-slate-500 dark:text-slate-400">Email</span>
                    <span className="col-span-2 font-medium text-blue-600 dark:text-blue-400">
                      {party.email || `${party.name.toLowerCase().replace(/[^a-z0-9]/g, "")}@example.com`}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 py-1 border-b border-slate-100 dark:border-slate-800/60">
                    <span className="text-slate-500 dark:text-slate-400">Phone</span>
                    <span className="col-span-2 font-medium tabular-nums text-slate-800 dark:text-slate-200">{party.phone}</span>
                  </div>
                  <div className="grid grid-cols-3 py-1 border-b border-slate-100 dark:border-slate-800/60">
                    <span className="text-slate-500 dark:text-slate-400">Payment Terms</span>
                    <span className="col-span-2 font-medium text-slate-800 dark:text-slate-200">Due on Receipt (Net 30)</span>
                  </div>
                  <div className="grid grid-cols-3 py-1 border-b border-slate-100 dark:border-slate-800/60">
                    <span className="text-slate-500 dark:text-slate-400">Billing Currency</span>
                    <span className="col-span-2 font-semibold text-slate-800 dark:text-slate-200">
                      {party.currency || "INR"} ({party.currencySymbol || "₹"})
                    </span>
                  </div>
                  <div className="grid grid-cols-3 py-1 border-b border-slate-100 dark:border-slate-800/60">
                    <span className="text-slate-500 dark:text-slate-400">Opening Balance</span>
                    <div className="col-span-2 flex items-center gap-1.5 font-semibold tabular-nums text-slate-900 dark:text-white">
                      <span>{pSym}{(party.openingBalance ?? Math.abs(party.balance)).toLocaleString()}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                        (party.openingBalanceType === "debit" || (!party.openingBalanceType && (isCustomer ? party.balance >= 0 : party.balance > 0)))
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      }`}>
                        {(party.openingBalanceType === "debit" || (!party.openingBalanceType && (isCustomer ? party.balance >= 0 : party.balance > 0)))
                          ? "Debit (Dr - To Receive)"
                          : "Credit (Cr - To Pay)"}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 py-1 border-b border-slate-100 dark:border-slate-800/60">
                    <span className="text-slate-500 dark:text-slate-400">Credit Limit</span>
                    <span className="col-span-2 font-semibold tabular-nums text-slate-900 dark:text-white">
                      {party.currencySymbol || "₹"}{party.creditLimit.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Address and Tax Information */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                  Address & Tax Details
                </h3>
                <div className="space-y-2.5 text-xs">
                  <div className="grid grid-cols-3 py-1 border-b border-slate-100 dark:border-slate-800/60">
                    <span className="text-slate-500 dark:text-slate-400">Billing Address</span>
                    <span className="col-span-2 font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                      {party.address}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 py-1 border-b border-slate-100 dark:border-slate-800/60">
                    <span className="text-slate-500 dark:text-slate-400">Shipping Address</span>
                    <span className="col-span-2 font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                      {party.address}
                    </span>
                  </div>
                  {gstSettings?.enableGst && gstSettings?.enablePlaceOfSupply && (
                    <div className="grid grid-cols-3 py-1 border-b border-slate-100 dark:border-slate-800/60">
                      <span className="text-slate-500 dark:text-slate-400">State / Place of Supply</span>
                      <span className="col-span-2 font-medium text-slate-800 dark:text-slate-200">
                        {party.state} {party.stateCode ? `[${party.stateCode}]` : ""}
                      </span>
                    </div>
                  )}
                  <div className="grid grid-cols-3 py-1 border-b border-slate-100 dark:border-slate-800/60">
                    <span className="text-slate-500 dark:text-slate-400">GST Treatment</span>
                    <span className="col-span-2 font-medium text-slate-800 dark:text-slate-200">
                      {party.gstTreatment || (party.gstin ? "Registered Business - Regular" : "Consumer (B2C)")}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 py-1 border-b border-slate-100 dark:border-slate-800/60">
                    <span className="text-slate-500 dark:text-slate-400">GSTIN</span>
                    <span className="col-span-2 font-semibold tabular-nums text-slate-900 dark:text-white">
                      {party.gstin || (party.gstTreatment === "Consumer" ? "Not applicable (Consumer)" : "Unregistered")}
                    </span>
                  </div>
                  {party.pan && (
                    <div className="grid grid-cols-3 py-1 border-b border-slate-100 dark:border-slate-800/60">
                      <span className="text-slate-500 dark:text-slate-400">PAN Number</span>
                      <span className="col-span-2 font-semibold tabular-nums text-slate-900 dark:text-white">
                        {party.pan}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Special Pricing or Notes */}
              {party.specialPrices && Object.keys(party.specialPrices).length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Custom Special Pricing
                  </h3>
                  <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
                    <div className="bg-slate-50 dark:bg-slate-800/50 px-3 py-2 font-semibold text-slate-600 dark:text-slate-300">
                      Item ID / Custom Price Map
                    </div>
                    <div className="p-3 divide-y divide-slate-100 dark:divide-slate-800">
                      {Object.entries(party.specialPrices).map(([itemId, rate]) => (
                        <div key={itemId} className="flex justify-between py-1.5">
                          <span className="text-slate-600 dark:text-slate-400">Item #{itemId}</span>
                          <span className="font-semibold tabular-nums text-slate-900 dark:text-white">₹{rate.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Financial Balances & Metric Cards */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Primary Balance Card */}
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {hasCreditDue 
                      ? "Credit Amount Due (Customer to Pay)"
                      : isCustomer 
                      ? (isPayable ? "Customer Advance Deposit" : "Outstanding Receivables") 
                      : (isReceivable ? "Vendor Advance / To Receive" : "Outstanding Payables")}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    (hasCreditDue || isReceivable) 
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      : isPayable
                      ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                      : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  }`}>
                    {hasCreditDue || party.balance !== 0 ? "Pending" : "Settled"}
                  </span>
                </div>

                <div className="flex items-baseline gap-2.5">
                  <div className="text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
                    {pSym}{hasCreditDue 
                      ? unpaidCreditSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : Math.abs(party.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                    (hasCreditDue || (isCustomer ? party.balance > 0 : party.balance < 0)) 
                      ? "text-amber-800 bg-amber-100 dark:text-amber-300 dark:bg-amber-950" 
                      : party.balance !== 0
                      ? "text-emerald-800 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-950" 
                      : "text-slate-500 bg-slate-100 dark:bg-slate-800"
                  }`}>
                    {hasCreditDue 
                      ? "Dr (To Receive)" 
                      : party.balance > 0 
                      ? (isCustomer ? "Dr (To Receive)" : "Dr (Advance Paid)") 
                      : party.balance < 0 
                      ? (isCustomer ? "Cr (Advance)" : "Cr (To Pay)") 
                      : "Settled"}
                  </span>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Opening Balance</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                      {pSym}{(party.openingBalance ?? Math.abs(party.balance)).toLocaleString()}{" "}
                      <span className="text-[10px] text-slate-400">
                        ({(party.openingBalanceType === "debit" || (!party.openingBalanceType && (isCustomer ? party.balance >= 0 : party.balance > 0))) ? "Dr" : "Cr"})
                      </span>
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Credit Remaining</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {pSym}{availableCredit.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Credit Facility & Utilization Card */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Credit Facility & Terms</span>
                  </div>
                  {party.creditLimit > 0 && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      creditUtilPercent > 90
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
                        : creditUtilPercent > 70
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                    }`}>
                      {creditUtilPercent}% Utilized
                    </span>
                  )}
                </div>

                {party.creditLimit > 0 ? (
                  <>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          creditUtilPercent > 90
                            ? "bg-rose-500"
                            : creditUtilPercent > 70
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${creditUtilPercent}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                        <span className="text-slate-400 block text-[10px]">Total Limit</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                          {pSym}{party.creditLimit.toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                        <span className="text-slate-400 block text-[10px]">Used Credit</span>
                        <span className="font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                          {pSym}{usedCredit.toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                        <span className="text-slate-400 block text-[10px]">Available</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {pSym}{availableCredit.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    No credit limit configured for this party. Credit sales and purchases can be executed as permitted.
                  </p>
                )}
              </div>

              {/* 2x2 Metric Cards matching Zoho Standard */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">Total Invoiced</div>
                  <div className="text-base font-bold text-slate-900 dark:text-white tabular-nums mt-1">
                    {pSym}{totalInvoiced.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">Total Paid</div>
                  <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
                    {pSym}{totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">Credit Invoices</div>
                  <div className="text-base font-bold text-purple-600 dark:text-purple-400 tabular-nums mt-1">
                    {partySales.filter(s => s.isCredit || s.paymentMode === "credit").length} of {partySales.length}
                  </div>
                </div>

                <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">Credit Purchases</div>
                  <div className="text-base font-bold text-blue-600 dark:text-blue-400 tabular-nums mt-1">
                    {partyPurchases.filter(p => p.isCredit || p.paymentMode === "credit").length} of {partyPurchases.length}
                  </div>
                </div>
              </div>

              {/* Quick Communication Box */}
              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-xs space-y-2.5">
                <div className="font-semibold text-slate-900 dark:text-white text-xs">Quick Contact</div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Phone className="h-3.5 w-3.5 text-blue-600" />
                  <a href={`tel:${party.phone}`} className="hover:underline">{party.phone}</a>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Mail className="h-3.5 w-3.5 text-blue-600" />
                  <a href={`mailto:${party.email || "info@example.com"}`} className="hover:underline">{party.email || "info@example.com"}</a>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === "transactions" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => setTxFilter("all")}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                    txFilter === "all" ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  All ({partySales.length + partyPurchases.length + partyPayments.length})
                </button>
                <button
                  onClick={() => setTxFilter("invoices")}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                    txFilter === "invoices" ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  Sales Invoices ({partySales.length})
                </button>
                <button
                  onClick={() => setTxFilter("bills")}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                    txFilter === "bills" ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  Purchase Bills ({partyPurchases.length})
                </button>
                <button
                  onClick={() => setTxFilter("payments")}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                    txFilter === "payments" ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  Payments ({partyPayments.length})
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800">
                    <TableHead className="px-4 py-3 text-xs">DATE</TableHead>
                    <TableHead className="px-4 py-3 text-xs">DOCUMENT #</TableHead>
                    <TableHead className="px-4 py-3 text-xs">TYPE</TableHead>
                    <TableHead className="px-4 py-3 text-xs text-center">STATUS</TableHead>
                    <TableHead className="px-4 py-3 text-xs text-right">AMOUNT</TableHead>
                    <TableHead className="px-4 py-3 text-xs text-right">BALANCE DUE</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partySales.length === 0 && partyPurchases.length === 0 && partyPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                        No transactions found for this party.
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {(txFilter === "all" || txFilter === "invoices") && partySales.map(doc => {
                        const isCreditDoc = doc.isCredit || doc.paymentMode === "credit"
                        const linkedPayments = payments.filter(p => p.docId === doc.id || p.docNo === doc.docNo)
                        const totalDocPaid = linkedPayments.reduce((sum, p) => sum + p.amount, 0)
                        const effectivePaid = isCreditDoc 
                          ? totalDocPaid 
                          : (doc.paidAmount || (doc.status === "paid" ? doc.grandTotal : 0))
                        const effectiveBalance = isCreditDoc 
                          ? Math.max(0, doc.grandTotal - effectivePaid) 
                          : (doc.balanceAmount ?? (doc.status === "paid" ? 0 : doc.grandTotal))
                        const effectiveStatus = isCreditDoc 
                          ? (effectiveBalance === 0 ? "paid" : effectivePaid > 0 ? "partial" : "pending") 
                          : doc.status

                        return (
                          <TableRow key={doc.id} className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                            <TableCell className="px-4 py-3 text-xs tabular-nums text-slate-500">{doc.date}</TableCell>
                            <TableCell className="px-4 py-3 text-xs font-semibold text-blue-600 dark:text-blue-400">{doc.docNo}</TableCell>
                            <TableCell className="px-4 py-3 text-xs uppercase font-medium text-slate-600 dark:text-slate-400">
                              <div className="flex items-center gap-1.5">
                                <span>Invoice</span>
                                {isCreditDoc && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                    Credit
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-xs text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                effectiveStatus === "paid" 
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                                  : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                              }`}>
                                {effectiveStatus}
                              </span>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-xs font-semibold tabular-nums text-right text-slate-900 dark:text-white">
                              {doc.currencySymbol || pSym}{doc.grandTotal.toFixed(2)}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-xs font-semibold tabular-nums text-right text-slate-900 dark:text-white">
                              {doc.currencySymbol || pSym}{effectiveBalance.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        )
                      })}

                      {(txFilter === "all" || txFilter === "bills") && partyPurchases.map(bill => {
                        const billBalanceDue = Math.max(0, bill.grandTotal - (bill.paidAmount || 0))
                        return (
                          <TableRow key={bill.id} className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                            <TableCell className="px-4 py-3 text-xs tabular-nums text-slate-500">{bill.date}</TableCell>
                            <TableCell className="px-4 py-3 text-xs font-semibold text-purple-600 dark:text-purple-400">{bill.docNo}</TableCell>
                            <TableCell className="px-4 py-3 text-xs uppercase font-medium text-slate-600 dark:text-slate-400">
                              <div className="flex items-center gap-1.5">
                                <span>Bill</span>
                                {(bill.isCredit || bill.paymentMode === "credit") && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                    Credit
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-xs text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                billBalanceDue === 0
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                                  : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                              }`}>
                                {billBalanceDue === 0 ? "paid" : "pending"}
                              </span>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-xs font-semibold tabular-nums text-right text-slate-900 dark:text-white">
                              {bill.currencySymbol || pSym}{bill.grandTotal.toFixed(2)}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-xs font-semibold tabular-nums text-right text-slate-900 dark:text-white">
                              {bill.currencySymbol || pSym}{billBalanceDue.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                      {(txFilter === "all" || txFilter === "payments") && partyPayments.map(pmt => (
                        <TableRow key={pmt.id} className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                          <TableCell className="px-4 py-3 text-xs tabular-nums text-slate-500">{pmt.date}</TableCell>
                          <TableCell className="px-4 py-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400">{pmt.paymentNo}</TableCell>
                          <TableCell className="px-4 py-3 text-xs uppercase font-medium text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-1.5">
                              <span>{pmt.type === "payment_in" ? "Payment Received" : "Payment Made"}</span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 uppercase">
                                {pmt.paymentMode}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-xs text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                              Completed
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-xs font-semibold tabular-nums text-right text-slate-900 dark:text-white">
                            {pmt.currencySymbol || pSym}{pmt.amount.toFixed(2)}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-xs font-medium tabular-nums text-right text-slate-400">
                            {pmt.docNo || "Settlement"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Statement / Ledger Tab */}
        {activeTab === "statement" && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Statement of Accounts</h4>
                <p className="text-xs text-slate-500 mt-0.5">Showing all historical debits and credits for {party.name}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500">Net Closing Balance:</span>
                <div className="text-base font-bold tabular-nums text-slate-900 dark:text-white">
                  {pSym}{Math.abs(party.balance).toFixed(2)} {isReceivable ? "Dr" : isPayable ? "Cr" : ""}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800">
                    <TableHead className="px-4 py-3 text-xs">DATE</TableHead>
                    <TableHead className="px-4 py-3 text-xs">TRANSACTION DETAILS</TableHead>
                    <TableHead className="px-4 py-3 text-xs text-right">DEBIT ({pSym})</TableHead>
                    <TableHead className="px-4 py-3 text-xs text-right">CREDIT ({pSym})</TableHead>
                    <TableHead className="px-4 py-3 text-xs text-right">RUNNING BALANCE ({pSym})</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statementRows.map((row) => {
                    const isPositive = row.balance >= 0
                    return (
                      <TableRow 
                        key={row.id} 
                        className={`border-b border-slate-100 dark:border-slate-800/80 ${
                          row.id === "opening" ? "bg-slate-50/50 dark:bg-slate-800/30 font-semibold" : ""
                        }`}
                      >
                        <TableCell className="px-4 py-3 text-xs text-slate-500 tabular-nums">{row.date}</TableCell>
                        <TableCell className="px-4 py-3 text-xs text-slate-800 dark:text-slate-200">
                          {row.desc}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-xs font-semibold text-right tabular-nums text-slate-900 dark:text-white">
                          {row.debit > 0 ? `${pSym}${row.debit.toFixed(2)}` : "-"}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-xs font-semibold text-right tabular-nums text-slate-900 dark:text-white">
                          {row.credit > 0 ? `${pSym}${row.credit.toFixed(2)}` : "-"}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-xs font-bold text-right tabular-nums">
                          <span className={isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}>
                            {pSym}{Math.abs(row.balance).toFixed(2)} {row.balance !== 0 ? (isPositive ? "Dr" : "Cr") : ""}
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
