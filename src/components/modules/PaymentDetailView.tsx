"use client"

import React from "react"
import { PaymentRecord } from "@/types/inventory"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Printer, Share2, ArrowLeft, CheckCircle2, Landmark, CreditCard, Building2, User, FileText } from "lucide-react"
import { formatINR } from "@/lib/utils"

import { useApp } from "@/context/AppContext"
import { DetailActionsMenu } from "@/components/ui/detail-actions-menu"

interface PaymentDetailViewProps {
  payment: PaymentRecord
  onClose: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export function PaymentDetailView({ payment, onClose, onEdit, onDelete }: PaymentDetailViewProps) {
  const { deletePayment, parties } = useApp()
  const isPaymentIn = payment.type === "payment_in"
  const party = parties.find(p => p.id === payment.partyId)
  const sym = payment.currencySymbol || party?.currencySymbol || (payment.currency === "USD" ? "$" : payment.currency === "EUR" ? "€" : payment.currency === "GBP" ? "£" : payment.currency === "AED" ? "AED" : "₹")

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900 overflow-y-auto select-none text-slate-900 dark:text-slate-100">
      {/* Top Header Bar */}
      <div className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 flex items-center justify-between shrink-0 print:hidden no-print">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                {payment.paymentNo}
              </h1>
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                {(payment.status || "completed").toUpperCase()}
              </Badge>
            </div>
            <span className="text-xs text-slate-500">{isPaymentIn ? "Customer Receipt" : "Vendor Payment Voucher"}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="h-8 px-3 text-xs font-semibold gap-1.5 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Voucher</span>
          </Button>

          <DetailActionsMenu
            onEdit={onEdit}
            onDelete={() => {
              if (onDelete) {
                onDelete()
              } else {
                deletePayment(payment.id)
                onClose()
              }
            }}
            title={isPaymentIn ? "Delete Payment Received" : "Delete Payment Made"}
            description={`Are you sure you want to delete payment record ${payment.paymentNo}? This action cannot be undone.`}
            itemName={`${payment.paymentNo} • ${payment.partyName} (${sym}${payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`}
          />

          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8 px-2 text-xs font-semibold border-slate-300 dark:border-slate-700 text-slate-500 hover:text-slate-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Payment Voucher Slip */}
      <div className="printable-document-sheet p-8 max-w-3xl space-y-6 text-xs print:p-0 print:border-none print:shadow-none print:w-full">
        {/* Receipt Header Card */}
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                {isPaymentIn ? "Payment Received (Payment In)" : "Payment Made (Payment Out)"}
              </span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums mt-1">
                {sym}{payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-500 block">Date of Payment</span>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{payment.date}</span>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 grid grid-cols-2 gap-4">
            <div>
              <span className="text-slate-500 block text-[11px]">
                {isPaymentIn ? "Received From (Customer)" : "Paid To (Vendor)"}
              </span>
              <span className="font-bold text-xs text-slate-900 dark:text-white mt-0.5 block">
                {payment.partyName}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px]">Payment Mode</span>
              <Badge variant="secondary" className="text-[11px] font-semibold uppercase mt-0.5">
                {payment.paymentMode}
              </Badge>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px]">
                {isPaymentIn ? "Deposited To" : "Paid From"}
              </span>
              <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 mt-0.5 block">
                {payment.depositAccount || payment.paidFromAccount || "Bank Account"}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px]">Reference / UTR / Cheque #</span>
              <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                {payment.referenceNo || "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Linked Document Information */}
        {payment.docNo && (
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Linked Document
            </span>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="font-semibold text-xs text-blue-600 dark:text-blue-400">
                  {payment.docNo}
                </span>
              </div>
              <span className="text-xs text-slate-500">Allocated: {sym}{payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        )}

        {/* Notes & Recorded By */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Notes / Remarks</span>
            <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
              {payment.notes || "No notes recorded for this transaction."}
            </p>
          </div>
          <div className="border-t border-slate-100 dark:border-slate-800 pt-2 text-[11px] text-slate-400">
            Recorded By: <span className="font-semibold text-slate-600 dark:text-slate-300">{payment.createdBy}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
