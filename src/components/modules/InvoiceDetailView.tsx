"use client"

import React, { useState } from "react"
import { SalesDocument, FormPrintSettings, DEFAULT_FORM_PRINT_SETTINGS_BASE, DEFAULT_FORM_PRINT_SETTINGS_MAP } from "@/types/inventory"
import { useApp } from "@/context/AppContext"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Select } from "@/components/ui/select"
import {
  FileText,
  Edit3,
  Printer,
  Download,
  Share2,
  X,
  CheckCircle2,
  Clock,
  CreditCard,
  QrCode,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  Landmark,
  AlertCircle,
  Bell,
  MessageSquare,
  Copy,
  Mail,
  Send,
  PauseCircle,
  PlayCircle,
  BellOff,
  AlertTriangle,
  ChevronDown,
  Phone,
  Settings as SettingsIcon
} from "lucide-react"
import { calculateDaysDifference, formatReminderText, buildWhatsAppLink, DEFAULT_REMINDER_TEMPLATES } from "@/lib/reminderEngine"
import { PartyReminderType } from "@/types/reminders"


import { getStateNameFromCode } from "@/lib/gstConstants"

interface InvoiceDetailViewProps {
  invoice: SalesDocument
  onClose: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export function InvoiceDetailView({ invoice, onClose, onEdit, onDelete }: InvoiceDetailViewProps) {
  const { 
    business, 
    parties, 
    recordPayment, 
    deleteSalesInvoice, 
    gstSettings, 
    payments, 
    formPrintSettings, 
    formCustomColumns,
    autoReminderSettings,
    reminderLogs,
    addReminderLog,
    invoiceReminderConfigs,
    updateInvoiceReminderConfig
  } = useApp()
  const printConfig: FormPrintSettings = formPrintSettings?.invoice || DEFAULT_FORM_PRINT_SETTINGS_MAP.invoice || DEFAULT_FORM_PRINT_SETTINGS_BASE
  const customColumns = (formCustomColumns?.invoice || []).filter(c => c.isEnabled !== false)
  const [activeTab, setActiveTab] = useState<"preview" | "payments" | "history">("preview")

  // Record Payment Drawer State
  const [isPaymentDrawerOpen, setIsPaymentDrawerOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split("T")[0])
  const [paymentMode, setPaymentMode] = useState<"cash" | "upi" | "bank" | "cheque" | "card">("upi")
  const [paymentAccount, setPaymentAccount] = useState("HDFC Current A/c (..4029)")
  const [paymentRefNo, setPaymentRefNo] = useState("")
  const [paymentNotes, setPaymentNotes] = useState("")
  const [drawerError, setDrawerError] = useState<string | null>(null)
  const [drawerSuccess, setDrawerSuccess] = useState<string | null>(null)

  const party = parties.find(p => p.id === invoice.partyId || p.name === invoice.partyName)
  const isPaid = invoice.status === "paid"
  const isPartial = invoice.status === "partial"

  const balanceDue = invoice.balanceAmount !== undefined
    ? invoice.balanceAmount
    : Math.max(0, invoice.grandTotal - (invoice.paidAmount || 0))

  const currSym = invoice.currencySymbol || party?.currencySymbol || "₹"
  const currCode = invoice.currency || party?.currency || "INR"

  // Auto-Reminder Configuration & State for this Invoice
  const invoiceConfig = invoiceReminderConfigs[invoice.id] || {
    enabled: autoReminderSettings.enableAutoCustomerReminders,
    preset: autoReminderSettings.defaultSchedulePreset || "standard",
    preferredChannel: autoReminderSettings.defaultChannel || "whatsapp"
  }

  const daysDiff = calculateDaysDifference(invoice.dueDate || invoice.date)
  const isOverdue = daysDiff > 0 && !isPaid

  // Next reminder label
  let nextReminderLabel = ""
  if (isPaid) {
    nextReminderLabel = "Invoice settled in full. Auto-reminders completed."
  } else if (!invoiceConfig.enabled) {
    nextReminderLabel = "Auto-reminders turned off for this invoice."
  } else if (invoiceConfig.isPaused) {
    nextReminderLabel = "Auto-reminders paused."
  } else if (daysDiff < 0) {
    nextReminderLabel = `Next reminder: Due Notice in ${Math.abs(daysDiff)} days (${invoice.dueDate || invoice.date})`
  } else if (daysDiff === 0) {
    nextReminderLabel = `Next reminder: Due Today Notice scheduled today via WhatsApp`
  } else {
    nextReminderLabel = `Invoice is ${daysDiff} days overdue. Escalation active.`
  }

  // Manual Reminder Modal
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false)
  const [reminderModalType, setReminderModalType] = useState<PartyReminderType>(
    daysDiff > 0 ? "overdue_level_1" : (daysDiff === 0 ? "due_today" : "upcoming_due")
  )

  const generateMessageForType = (type: PartyReminderType) => {
    const templateKey = type in autoReminderSettings.templates 
      ? (type as keyof typeof autoReminderSettings.templates) 
      : "due_today"
    const template = autoReminderSettings.templates[templateKey] || DEFAULT_REMINDER_TEMPLATES[templateKey]
    return formatReminderText(template, {
      party_name: invoice.partyName,
      invoice_no: invoice.docNo,
      due_date: invoice.dueDate || invoice.date,
      amount_due: `${currSym}${balanceDue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      days_overdue: Math.max(0, daysDiff),
      upi_id: business.upiId || "apexglobal@okaxis",
      company_name: business.tradeName || business.name,
      company_phone: business.phone
    })
  }

  const [customReminderMsg, setCustomReminderMsg] = useState("")
  const [reminderFeedback, setReminderFeedback] = useState<string | null>(null)
  const [isReminderMenuOpen, setIsReminderMenuOpen] = useState(false)
  const [actionFeedback, setActionFeedback] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setActionFeedback(msg)
    setTimeout(() => setActionFeedback(null), 3500)
  }

  const handleDirectWhatsAppSend = () => {
    const defaultType: PartyReminderType = daysDiff > 0 ? "overdue_level_1" : (daysDiff === 0 ? "due_today" : "upcoming_due")
    const msg = customReminderMsg || generateMessageForType(defaultType)
    const phone = party?.phone || party?.mobile || "9426033441"
    const waLink = buildWhatsAppLink(phone, msg)
    window.open(waLink, "_blank")
    addReminderLog({
      invoiceId: invoice.id,
      invoiceNo: invoice.docNo,
      partyId: invoice.partyId,
      partyName: invoice.partyName,
      type: defaultType,
      channel: "whatsapp",
      status: "delivered",
      messagePreview: msg,
      recipientPhoneOrEmail: phone,
      amountDue: balanceDue,
      triggeredBy: "manual"
    })
    setIsReminderMenuOpen(false)
    showToast(`WhatsApp reminder sent to ${invoice.partyName}!`)
  }

  const handleDirectEmailSend = () => {
    const defaultType: PartyReminderType = daysDiff > 0 ? "overdue_level_1" : (daysDiff === 0 ? "due_today" : "upcoming_due")
    const msg = customReminderMsg || generateMessageForType(defaultType)
    const email = party?.email || "orders@gsd-ahmedabad.com"
    const subject = encodeURIComponent(`Payment Reminder: Invoice ${invoice.docNo} from ${business.tradeName || business.name}`)
    const body = encodeURIComponent(msg)
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, "_blank")
    addReminderLog({
      invoiceId: invoice.id,
      invoiceNo: invoice.docNo,
      partyId: invoice.partyId,
      partyName: invoice.partyName,
      type: defaultType,
      channel: "email",
      status: "delivered",
      messagePreview: msg,
      recipientPhoneOrEmail: email,
      amountDue: balanceDue,
      triggeredBy: "manual"
    })
    setIsReminderMenuOpen(false)
    showToast(`Email client opened for ${invoice.partyName}`)
  }

  const handleCopyReminderMsg = () => {
    const defaultType: PartyReminderType = daysDiff > 0 ? "overdue_level_1" : (daysDiff === 0 ? "due_today" : "upcoming_due")
    const msg = customReminderMsg || generateMessageForType(defaultType)
    navigator.clipboard.writeText(msg)
    setIsReminderMenuOpen(false)
    showToast("Reminder message copied to clipboard!")
  }

  const openReminderModal = () => {
    const defaultType: PartyReminderType = daysDiff > 0 ? "overdue_level_1" : (daysDiff === 0 ? "due_today" : "upcoming_due")
    setReminderModalType(defaultType)
    setCustomReminderMsg(generateMessageForType(defaultType))
    setReminderFeedback(null)
    setIsReminderModalOpen(true)
  }

  const handleSendWhatsAppReminder = () => {
    const phone = party?.phone || party?.mobile || ""
    const waLink = buildWhatsAppLink(phone, customReminderMsg)
    window.open(waLink, "_blank")
    addReminderLog({
      invoiceId: invoice.id,
      invoiceNo: invoice.docNo,
      partyId: invoice.partyId,
      partyName: invoice.partyName,
      type: reminderModalType,
      channel: "whatsapp",
      status: "delivered",
      messagePreview: customReminderMsg,
      recipientPhoneOrEmail: phone || "Registered Phone",
      amountDue: balanceDue,
      triggeredBy: "manual"
    })
    setReminderFeedback("WhatsApp opened and reminder logged!")
    setTimeout(() => {
      setIsReminderModalOpen(false)
      setReminderFeedback(null)
    }, 1500)
  }

  const handleSendEmailReminder = () => {
    const email = party?.email || ""
    const subject = encodeURIComponent(`Payment Reminder: Invoice ${invoice.docNo} from ${business.tradeName || business.name}`)
    const body = encodeURIComponent(customReminderMsg)
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, "_blank")
    addReminderLog({
      invoiceId: invoice.id,
      invoiceNo: invoice.docNo,
      partyId: invoice.partyId,
      partyName: invoice.partyName,
      type: reminderModalType,
      channel: "email",
      status: "delivered",
      messagePreview: customReminderMsg,
      recipientPhoneOrEmail: email || "Registered Email",
      amountDue: balanceDue,
      triggeredBy: "manual"
    })
    setReminderFeedback("Email client opened and reminder logged!")
    setTimeout(() => {
      setIsReminderModalOpen(false)
      setReminderFeedback(null)
    }, 1500)
  }

  const togglePauseReminders = () => {
    updateInvoiceReminderConfig(invoice.id, {
      isPaused: !invoiceConfig.isPaused
    })
  }

  // Show Record Payment if invoice has balance due or is partial/pending
  const isUnpaidOrPartial = invoice.status === "partial" || invoice.status === "pending" || (!isPaid && balanceDue > 0)

  const openPaymentDrawer = () => {
    const bal = invoice.balanceAmount !== undefined
      ? invoice.balanceAmount
      : Math.max(0, invoice.grandTotal - (invoice.paidAmount || 0))
    setPaymentAmount(String(Math.max(0, bal)))
    setPaymentDate(new Date().toISOString().split("T")[0])
    setPaymentMode("upi")
    setPaymentAccount("HDFC Current A/c (..4029)")
    setPaymentRefNo("")
    setPaymentNotes(`Payment received for invoice ${invoice.docNo}`)
    setDrawerError(null)
    setDrawerSuccess(null)
    setIsPaymentDrawerOpen(true)
  }

  // Number to Indian/Foreign currency words helper
  const formatAmountWords = (num: number) => {
    if (currCode !== "INR") {
      return `${currCode} ${Math.round(num).toLocaleString()} Only`
    }
    return `Indian Rupees ${Math.round(num).toLocaleString("en-IN")} Only`
  }

  const handleSavePayment = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setDrawerError(null)

    const parsedAmount = parseFloat(paymentAmount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setDrawerError(`Please enter a valid payment amount greater than ${currSym}0.`)
      return
    }

    if (parsedAmount > balanceDue) {
      setDrawerError(`Payment amount cannot exceed the remaining balance due of ${currSym}${balanceDue.toFixed(2)}. An advance of ${currSym}${(invoice.paidAmount || 0).toFixed(2)} was already received.`)
      return
    }

    const res = recordPayment({
      type: "payment_in",
      partyId: invoice.partyId,
      partyName: invoice.partyName,
      amount: parsedAmount,
      currency: currCode,
      currencySymbol: currSym,
      exchangeRate: invoice.exchangeRate,
      date: paymentDate,
      paymentMode,
      depositAccount: paymentAccount,
      referenceNo: paymentRefNo.trim() || undefined,
      docId: invoice.id,
      docNo: invoice.docNo,
      notes: paymentNotes.trim() || undefined,
      status: "completed"
    })

    if (res.success) {
      setDrawerSuccess(res.message)
      setTimeout(() => {
        setIsPaymentDrawerOpen(false)
        setDrawerSuccess(null)
      }, 700)
    } else {
      setDrawerError(res.message)
    }
  }

  return (
    <div className="relative flex flex-col h-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 overflow-hidden">

      {/* 1. Header Action Bar */}
      <div className="relative flex items-center justify-between px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 print:hidden no-print">
        {/* Toast confirmation */}
        {actionFeedback && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 px-4 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold rounded-lg shadow-2xl flex items-center gap-2 border border-slate-800 dark:border-slate-200 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
        )}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                Invoice {invoice.docNo}
              </h1>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${invoice.status === "paid"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                : invoice.status === "partial"
                  ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800"
                  : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
                }`}>
                {invoice.status.toUpperCase()}
              </span>

              {(invoice.isCredit || invoice.paymentMode === "credit") && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800 flex items-center gap-1">
                  <CreditCard className="h-3 w-3" />
                  Sale on Credit
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Customer: <span className="font-semibold text-slate-700 dark:text-slate-300">{invoice.partyName}</span> • Date: {invoice.date}
              {invoice.creditTerms && ` • Terms: ${invoice.creditTerms}`}
            </p>
          </div>
        </div>

        {/* Action Buttons matching Zoho Standard */}
        <div className="flex items-center gap-2">
          {/* Primary Record Payment Button when Draft/Partial/Unpaid */}
          {isUnpaidOrPartial && (
            <Button
              size="sm"
              onClick={openPaymentDrawer}
              className="h-8 px-3.5 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-2xs rounded-md"
            >
              <CreditCard className="h-3.5 w-3.5" />
              <span>Record Payment</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="h-8 px-3 text-xs gap-1.5 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => alert(`Downloading PDF for invoice ${invoice.docNo}`)}
            className="h-8 px-3 text-xs gap-1.5 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Download className="h-3.5 w-3.5" />
            <span>PDF</span>
          </Button>

          {/* Payment Reminder Button with Direct Send Dropdown Popover */}
          {isUnpaidOrPartial && (
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsReminderMenuOpen(!isReminderMenuOpen)}
                className={`h-8 px-3 text-xs gap-1.5 border-slate-200 dark:border-slate-700 transition-colors ${
                  isReminderMenuOpen 
                    ? "bg-blue-50 text-blue-600 border-blue-300 dark:bg-blue-950/40 dark:text-blue-400" 
                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
                title="Send Payment Reminder directly to Party"
              >
                <Bell className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span>Reminder</span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </Button>

              {isReminderMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsReminderMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-1.5 w-80 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-xs animate-in fade-in zoom-in-95">
                    {/* Header summary */}
                    <div className="p-3 bg-slate-50/70 dark:bg-slate-800/40">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-semibold text-slate-900 dark:text-white truncate">
                          {invoice.partyName}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                            daysDiff > 0
                              ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800"
                              : daysDiff === 0
                              ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                              : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800"
                          }`}
                        >
                          {daysDiff > 0 ? `${daysDiff}d Overdue` : daysDiff === 0 ? "Due Today" : `Due in ${Math.abs(daysDiff)}d`}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                        <span>Balance Due:</span>
                        <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                          {currSym}{balanceDue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    {/* Actions List */}
                    <div className="p-1.5 space-y-1">
                      {/* 1-Click WhatsApp Send */}
                      <button
                        onClick={handleDirectWhatsAppSend}
                        className="w-full text-left p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-200 flex items-center justify-between transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/40">
                            <Share2 className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>Send via WhatsApp</span>
                              <span className="text-[9px] font-medium px-1 py-0.2 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">Direct</span>
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              {party?.phone || party?.mobile || "Customer chat"}
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                      </button>

                      {/* 1-Click Email Send */}
                      <button
                        onClick={handleDirectEmailSend}
                        className="w-full text-left p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-200 flex items-center justify-between transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
                            <Mail className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-xs text-slate-900 dark:text-white">Send via Email</div>
                            <div className="text-[11px] text-slate-400 truncate">
                              {party?.email || "Registered email"}
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                      </button>

                      {/* Copy Text */}
                      <button
                        onClick={handleCopyReminderMsg}
                        className="w-full text-left p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-200 flex items-center justify-between transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                            <Copy className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-xs text-slate-900 dark:text-white">Copy Reminder Text</div>
                            <div className="text-[11px] text-slate-400">Includes balance &amp; UPI ID</div>
                          </div>
                        </div>
                        <Copy className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors shrink-0 ml-2" />
                      </button>
                    </div>

                    {/* Footer Customize Action */}
                    <div className="p-2 bg-slate-50/50 dark:bg-slate-800/20">
                      <button
                        onClick={() => {
                          setIsReminderMenuOpen(false)
                          openReminderModal()
                        }}
                        className="w-full py-1.5 px-3 rounded-md text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer shadow-2xs"
                      >
                        <SettingsIcon className="h-3.5 w-3.5" />
                        <span>Customize Notice &amp; Schedule...</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* WhatsApp Button next to Reminder also directly dispatches WhatsApp reminder */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDirectWhatsAppSend}
            className="h-8 px-3 text-xs gap-1.5 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            title="Direct WhatsApp Reminder"
          >
            <Share2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>WhatsApp</span>
          </Button>

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

      {/* 2. Tabs Navigation */}
      <div className="flex items-center gap-8 px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 print:hidden no-print">
        <button
          onClick={() => setActiveTab("preview")}
          className={`py-3 text-xs font-semibold tracking-wide border-b-2 transition-colors ${activeTab === "preview"
            ? "border-blue-600 text-blue-600 dark:text-blue-400"
            : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
        >
          Invoice Preview
        </button>
        <button
          onClick={() => setActiveTab("payments")}
          className={`py-3 text-xs font-semibold tracking-wide border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === "payments"
            ? "border-blue-600 text-blue-600 dark:text-blue-400"
            : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
        >
          <span>Payments & Details</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold tabular-nums">
            {invoice.paymentMode.toUpperCase()}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`py-3 text-xs font-semibold tracking-wide border-b-2 transition-colors ${activeTab === "history"
            ? "border-blue-600 text-blue-600 dark:text-blue-400"
            : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
        >
          Audit History
        </button>
      </div>

      {/* 3. Tab Contents */}
      <div className={`flex-1 overflow-y-auto print:overflow-visible print:p-0 print:m-0 print:bg-white print:block ${activeTab === "preview"
        ? "p-4 sm:p-8 bg-slate-200/60 dark:bg-slate-950/80 flex justify-center items-start"
        : "p-6 sm:p-8 bg-slate-50/60 dark:bg-slate-950/60"
        }`}>

        {/* Invoice Document Preview formatted to authentic A4 Paper Dimensions */}
        {activeTab === "preview" && (
          <div className="w-full max-w-[210mm] mx-auto space-y-4 print:max-w-none print:w-full print:m-0 print:space-y-0">
            {/* Auto-Reminder Status Banner (Screen Only - Strictly Hidden in Print) */}
            <div className="print:hidden no-print rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 sm:p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`p-2 rounded-lg shrink-0 ${
                  isPaid 
                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                    : invoiceConfig.isPaused || !invoiceConfig.enabled
                    ? "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                    : daysDiff > 0
                    ? "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400"
                    : daysDiff === 0
                    ? "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
                    : "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
                }`}>
                  {isPaid ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : invoiceConfig.isPaused ? (
                    <PauseCircle className="h-5 w-5" />
                  ) : !invoiceConfig.enabled ? (
                    <BellOff className="h-5 w-5" />
                  ) : daysDiff > 0 ? (
                    <AlertCircle className="h-5 w-5" />
                  ) : (
                    <Clock className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {isPaid ? "Payment Settled" : isOverdue ? `Payment Overdue (${daysDiff} days)` : daysDiff === 0 ? "Payment Due Today" : "Auto-Reminder Active"}
                    </span>
                    <Badge variant="outline" className={`text-[10px] font-medium py-0 px-1.5 ${
                      isPaid 
                        ? "border-emerald-200 text-emerald-700 bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400"
                        : invoiceConfig.isPaused
                        ? "border-amber-200 text-amber-700 bg-amber-50 dark:border-amber-800 dark:text-amber-400"
                        : daysDiff > 0
                        ? "border-rose-200 text-rose-700 bg-rose-50 dark:border-rose-800 dark:text-rose-400"
                        : "border-blue-200 text-blue-700 bg-blue-50 dark:border-blue-800 dark:text-blue-400"
                    }`}>
                      {isPaid ? "Settled" : invoiceConfig.isPaused ? "Paused" : invoiceConfig.preset.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-md sm:max-w-lg">
                    {nextReminderLabel}
                  </p>
                </div>
              </div>

              {!isPaid && (
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={togglePauseReminders}
                    className="h-7 px-2.5 text-xs gap-1 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                    title={invoiceConfig.isPaused ? "Resume automated reminders" : "Pause automated reminders"}
                  >
                    {invoiceConfig.isPaused ? <PlayCircle className="h-3.5 w-3.5 text-emerald-600" /> : <PauseCircle className="h-3.5 w-3.5 text-slate-500" />}
                    <span>{invoiceConfig.isPaused ? "Resume" : "Pause"}</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={openReminderModal}
                    className="h-7 px-2.5 text-xs gap-1 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-2xs"
                  >
                    <Send className="h-3 w-3" />
                    <span>Send Reminder</span>
                  </Button>
                </div>
              )}
            </div>

            {/* Invoice Document Preview formatted to authentic A4 Paper Dimensions */}
            <div className="printable-document-sheet w-full max-w-[210mm] min-h-[297mm] mx-auto bg-white dark:bg-slate-900 border border-slate-300/80 dark:border-slate-800 shadow-2xl rounded-xs p-[12mm] sm:p-[16mm] text-slate-800 dark:text-slate-100 flex flex-col justify-between print:shadow-none print:border-none print:p-0 print:sm:p-0 print:max-w-full print:min-h-0 print:m-0 print:w-full">
            <div className="space-y-6">

              {/* Invoice Document Header */}
              <div className="flex justify-between items-start pb-6 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`h-7 w-7 rounded-md bg-blue-600 text-white font-black text-sm flex items-center justify-center ${printConfig.showLogo === false ? "print:hidden" : ""}`}>
                      AB
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {business.tradeName || business.name}
                    </h2>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5 mt-2">
                    <p className={printConfig.showDispatchAddress === false ? "print:hidden" : ""}>{business.address}</p>
                    <p>State: {business.state} ({business.stateCode})</p>
                    <p className={printConfig.showGstin === false ? "print:hidden" : ""}>GSTIN: <span className="font-semibold text-slate-700 dark:text-slate-300">{business.gstin}</span></p>
                    <p className={printConfig.showBusinessContact === false ? "print:hidden" : ""}>Phone: {business.phone} • Email: {business.email}</p>
                  </div>
                </div>

                <div className="text-right">
                  {Boolean(invoice.isBillOfSupply || invoice.isComposition || business?.isCompositionScheme) ? (
                    <div>
                      <span className="text-2xl font-black text-blue-600 tracking-tight block">BILL OF SUPPLY</span>
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 mt-1">
                        Composition Taxable Person
                      </span>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium italic mt-0.5">
                        Not eligible to collect tax on supplies
                      </p>
                    </div>
                  ) : (
                    <span className="text-2xl font-black text-blue-600 tracking-tight block">TAX INVOICE</span>
                  )}
                  <div className="mt-3 text-xs space-y-1 text-slate-600 dark:text-slate-400">
                    <p>
                      <span className="text-slate-400">Invoice #: </span>
                      <span className="font-bold text-slate-900 dark:text-white">{invoice.docNo}</span>
                    </p>
                    {(invoice.orderNo || invoice.orderNumber) && (
                      <p className={printConfig.showOrderNumber === false ? "print:hidden" : ""}>
                        <span className="text-slate-400">Order #: </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{invoice.orderNo || invoice.orderNumber}</span>
                      </p>
                    )}
                    <p>
                      <span className="text-slate-400">Invoice Date: </span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{invoice.date}</span>
                    </p>
                    <p className={printConfig.showDueDateAndTerms === false ? "print:hidden" : ""}>
                      <span className="text-slate-400">Payment Terms: </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{invoice.creditTerms || (invoice.isCredit ? "Net 30 (Credit)" : "Immediate")}</span>
                    </p>
                    <p className={printConfig.showDueDateAndTerms === false ? "print:hidden" : ""}>
                      <span className="text-slate-400">Due Date: </span>
                      <span className="font-bold text-slate-900 dark:text-white">{invoice.dueDate || invoice.date}</span>
                    </p>
                    {gstSettings?.enablePlaceOfSupply && (
                      <p className={printConfig.showPlaceOfSupply === false ? "print:hidden" : ""}>
                        <span className="text-slate-400">Place of Supply: </span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {invoice.partyStateCode} {getStateNameFromCode(invoice.partyStateCode) ? `(${getStateNameFromCode(invoice.partyStateCode)})` : ""}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Billed To & Shipped From */}
              <div className="grid grid-cols-2 gap-8 py-6 border-b border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Billed To
                  </span>
                  <div className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                    {invoice.partyName}
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 space-y-0.5">
                    <p>{party?.address || "Registered Address"}</p>
                    <p className={printConfig.showCustomerGstin === false ? "print:hidden" : ""}>GSTIN: <span className="font-semibold text-slate-700 dark:text-slate-300">{invoice.partyGstin || party?.gstin || "Unregistered"}</span></p>
                    <p>State: {party?.state || "Delhi"} ({invoice.partyStateCode})</p>
                  </div>
                </div>

                <div className={printConfig.showShippingAddress === false ? "print:hidden" : ""}>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Dispatch &amp; Terms
                  </span>
                  <div className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                    {invoice.godownName || "Main Warehouse"}
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 space-y-0.5">
                    <p><span className="text-slate-400">Dispatch Location: </span>{invoice.godownName || "Main Central Godown"}</p>
                    <p><span className="text-slate-400">Payment Mode: </span><span className="uppercase font-medium text-slate-800 dark:text-slate-200">{invoice.paymentMode || "Credit"}</span></p>
                    {invoice.ewayBillNo && <p className={printConfig.showEwayBill === false ? "print:hidden" : ""}><span className="text-slate-400">E-Way Bill: </span>{invoice.ewayBillNo}</p>}
                  </div>
                </div>
              </div>

              {/* Items Table using atom Table */}
              <div className="py-6">
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                        <TableHead className="w-10 px-3 py-2.5 text-center text-xs">#</TableHead>
                        <TableHead className="px-3 py-2.5 text-xs">ITEM &amp; DESCRIPTION</TableHead>
                        <TableHead className={`px-3 py-2.5 text-xs ${printConfig.showHsnSac === false ? "print:hidden" : ""}`}>HSN/SAC</TableHead>
                        <TableHead className="px-3 py-2.5 text-right text-xs">QTY</TableHead>
                        <TableHead className="px-3 py-2.5 text-right text-xs">RATE</TableHead>
                        <TableHead className={`px-3 py-2.5 text-right text-xs ${printConfig.showTaxRate === false ? "print:hidden" : ""}`}>TAX %</TableHead>
                        {customColumns.map(col => (
                          <TableHead
                            key={col.id}
                            className={`px-3 py-2.5 text-center text-xs uppercase font-medium text-slate-700 dark:text-slate-300 ${col.printOnPaper === false ? "print:hidden" : ""}`}
                          >
                            {col.name}
                          </TableHead>
                        ))}
                        <TableHead className="px-3 py-2.5 text-right text-xs">AMOUNT</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice.items.map((line, idx) => (
                        <TableRow key={idx} className="border-b border-slate-100 dark:border-slate-800/60">
                          <TableCell className="px-3 py-3 text-center text-xs text-slate-400">{idx + 1}</TableCell>
                          <TableCell className="px-3 py-3 text-xs">
                            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                              <span>{line.name}</span>
                              {line.isWholesale && (
                                <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-900">
                                  Wholesale
                                </span>
                              )}
                            </div>
                            {line.description && (
                              <div className={`text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 ${printConfig.showProductDescription === false ? "print:hidden" : ""}`}>
                                {line.description}
                              </div>
                            )}
                            {line.discountPercent > 0 && (
                              <div className={`text-[11px] text-emerald-600 dark:text-emerald-400 font-medium ${printConfig.showItemDiscount === false ? "print:hidden" : ""}`}>
                                Discount: {line.discountPercent}%
                              </div>
                            )}
                            {line.batchNo && (
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                Batch: {line.batchNo} {line.expiryDate ? `• Exp: ${line.expiryDate}` : ""}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className={`px-3 py-3 text-xs tabular-nums text-slate-500 ${printConfig.showHsnSac === false ? "print:hidden" : ""}`}>{line.hsn || "8471"}</TableCell>
                          <TableCell className="px-3 py-3 text-right text-xs font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                            {line.qty} {printConfig.showUnit === false ? <span className="print:hidden">{line.unit}</span> : line.unit}
                          </TableCell>
                          <TableCell className="px-3 py-3 text-right text-xs tabular-nums text-slate-800 dark:text-slate-200">
                            {currSym}{line.rate.toFixed(2)}
                          </TableCell>
                          <TableCell className={`px-3 py-3 text-right text-xs tabular-nums text-slate-500 ${printConfig.showTaxRate === false ? "print:hidden" : ""}`}>
                            {line.gstRate}%
                          </TableCell>
                          {customColumns.map(col => (
                            <TableCell
                              key={col.id}
                              className={`px-3 py-3 text-center text-xs text-slate-700 dark:text-slate-300 ${col.printOnPaper === false ? "print:hidden" : ""}`}
                            >
                              {line.customColumns?.[col.id] || "—"}
                            </TableCell>
                          ))}
                          <TableCell className="px-3 py-3 text-right text-xs font-semibold tabular-nums text-slate-900 dark:text-white">
                            {currSym}{line.total.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Calculations & Summary Section */}
              <div className="grid grid-cols-2 print:grid-cols-2 gap-8 pt-2 pb-6 border-b border-slate-200 dark:border-slate-800 text-xs">

                {/* Left Column: Bank Details & UPI */}
                <div className="space-y-4">
                  <div className={`p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 ${printConfig.showBankDetails === false ? "print:hidden" : ""}`}>
                    <div className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                      <QrCode className="h-4 w-4 text-blue-600" />
                      <span>Instant UPI Payment</span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 space-y-1">
                      <p><span className="text-slate-400">UPI ID: </span><span className="font-semibold text-slate-900 dark:text-white">{business.upiId}</span></p>
                      <p><span className="text-slate-400">Bank: </span>State Bank of India</p>
                      <p><span className="text-slate-400">A/C No: </span>398200192837</p>
                      <p><span className="text-slate-400">IFSC: </span>SBIN0001234</p>
                    </div>
                  </div>

                  <div className={printConfig.showAmountInWords === false ? "print:hidden" : ""}>
                    <span className="text-slate-400 block mb-1">Total in Words:</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 italic">
                      {formatAmountWords(invoice.grandTotal)}
                    </p>
                  </div>
                </div>

                {/* Right Column: Totals Calculation */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{currSym}{invoice.subtotal.toFixed(2)}</span>
                  </div>
                  {invoice.cgstTotal > 0 && (
                    <div className={`flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 ${printConfig.showTaxBreakdown === false ? "print:hidden" : ""}`}>
                      <span className="text-slate-500">CGST</span>
                      <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{currSym}{invoice.cgstTotal.toFixed(2)}</span>
                    </div>
                  )}
                  {invoice.sgstTotal > 0 && (
                    <div className={`flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 ${printConfig.showTaxBreakdown === false ? "print:hidden" : ""}`}>
                      <span className="text-slate-500">SGST</span>
                      <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{currSym}{invoice.sgstTotal.toFixed(2)}</span>
                    </div>
                  )}
                  {invoice.igstTotal > 0 && (
                    <div className={`flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 ${printConfig.showTaxBreakdown === false ? "print:hidden" : ""}`}>
                      <span className="text-slate-500">IGST</span>
                      <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{currSym}{invoice.igstTotal.toFixed(2)}</span>
                    </div>
                  )}
                  {invoice.additionalCharges && invoice.additionalCharges.length > 0 ? (
                    invoice.additionalCharges.map((ch, idx) => (
                      <div key={idx} className={`flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 ${printConfig.showAdditionalCharges === false ? "print:hidden" : ""}`}>
                        <span className="text-slate-500">{ch.name || "Additional Charge"}</span>
                        <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                          {ch.amount > 0 ? `+${currSym}${ch.amount.toFixed(2)}` : `-${currSym}${Math.abs(ch.amount).toFixed(2)}`}
                        </span>
                      </div>
                    ))
                  ) : (
                    invoice.adjustment !== undefined && invoice.adjustment !== 0 && (
                      <div className={`flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 ${printConfig.showAdditionalCharges === false ? "print:hidden" : ""}`}>
                        <span className="text-slate-500">{invoice.adjustmentLabel || "Adjustment"}</span>
                        <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                          {invoice.adjustment > 0 ? `+${currSym}${invoice.adjustment.toFixed(2)}` : `-${currSym}${Math.abs(invoice.adjustment).toFixed(2)}`}
                        </span>
                      </div>
                    )
                  )}
                  {invoice.withholdingAmount !== undefined && invoice.withholdingAmount > 0 && (
                    ((invoice.withholdingType === "TDS" && gstSettings?.enableTds) ||
                      (invoice.withholdingType === "TCS" && gstSettings?.enableTcs)) && (
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500">
                          {invoice.withholdingType} {invoice.withholdingRate ? `(${invoice.withholdingRate}%)` : ""}
                        </span>
                        <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                          {invoice.withholdingType === "TDS"
                            ? `-${currSym}${invoice.withholdingAmount.toFixed(2)}`
                            : `+${currSym}${invoice.withholdingAmount.toFixed(2)}`}
                        </span>
                      </div>
                    )
                  )}
                  {invoice.roundOff !== undefined && (
                    <div className={`flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 ${printConfig.showRoundOff === false ? "print:hidden" : ""}`}>
                      <span className="text-slate-500">Round Off</span>
                      <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                        {invoice.roundOff > 0 ? `+${currSym}${invoice.roundOff.toFixed(2)}` : invoice.roundOff < 0 ? `-${currSym}${Math.abs(invoice.roundOff).toFixed(2)}` : `${currSym}0.00`}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 text-base font-bold border-b-2 border-slate-900 dark:border-slate-100">
                    <span className="text-slate-900 dark:text-white">Grand Total</span>
                    <span className="text-blue-600 dark:text-blue-400 tabular-nums">{currSym}{invoice.grandTotal.toFixed(2)}</span>
                  </div>

                  <div className="pt-2 flex justify-between text-xs">
                    <span className="text-slate-500">Payment Received:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {currSym}{(invoice.paidAmount ?? (isPaid ? invoice.grandTotal : 0)).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">
                      {invoice.isCredit || invoice.paymentMode === "credit" ? "Credit Balance Due:" : "Balance Due:"}
                    </span>
                    <span className={`font-bold tabular-nums text-sm ${(invoice.balanceAmount ?? (isPaid ? 0 : invoice.grandTotal)) > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                      {currSym}{(invoice.balanceAmount ?? (isPaid ? 0 : invoice.grandTotal)).toFixed(2)}
                    </span>
                  </div>
                  {invoice.dueDate && (invoice.balanceAmount ?? (isPaid ? 0 : invoice.grandTotal)) > 0 && (
                    <div className="mt-2.5 p-2 rounded-md bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 text-[11px] flex items-center justify-between">
                      <span className="text-amber-800 dark:text-amber-300 font-medium flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Payment Due Date:
                      </span>
                      <span className="font-bold text-amber-900 dark:text-amber-200 tabular-nums">{invoice.dueDate}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Document Footer: Terms & Signature at the bottom of A4 page */}
            <div className="mt-auto pt-8 flex justify-between items-end text-xs text-slate-500">
              <div className="space-y-4 max-w-md">
                {invoice.notes && (
                  <div className={printConfig.showCustomerNotes === false ? "print:hidden" : ""}>
                    <p className="font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Notes:</p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">{invoice.notes}</p>
                  </div>
                )}

                <div className={printConfig.showTermsConditions === false ? "print:hidden" : ""}>
                  <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Terms &amp; Conditions:</p>
                  <ol className="list-decimal list-inside space-y-0.5 text-[11px]">
                    <li>Goods once sold will not be taken back or exchanged.</li>
                    <li>Interest @ 18% p.a. will be charged if payment is delayed.</li>
                    <li>Subject to Delhi Jurisdiction only.</li>
                  </ol>
                </div>
              </div>

              <div className="flex items-end gap-8">
                {printConfig.showReceiverSignature && (
                  <div className="text-center print:block hidden">
                    <div className="font-semibold text-slate-800 dark:text-slate-200 mb-12">
                      Received In Good Order
                    </div>
                    <div className="border-t border-slate-300 dark:border-slate-700 pt-1 text-[11px]">
                      Receiver's Signature &amp; Stamp
                    </div>
                  </div>
                )}

                <div className={`text-center ${printConfig.showAuthorizedSignature === false ? "print:hidden" : ""}`}>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mb-12">
                    For {business.name}
                  </div>
                  <div className="border-t border-slate-300 dark:border-slate-700 pt-1 text-[11px]">
                    Authorized Signatory
                  </div>
                </div>
              </div>
            </div>

            </div>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === "payments" && (
          <div className="w-full max-w-4xl mx-auto space-y-6">
            <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Payment Summary</h3>
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 block mb-1">Invoice Total</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                    ₹{invoice.grandTotal.toFixed(2)}
                  </span>
                </div>
                <div className="p-4 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                  <span className="text-emerald-700 dark:text-emerald-400 block mb-1">Total Paid</span>
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    ₹{(invoice.paidAmount ?? (isPaid ? invoice.grandTotal : 0)).toFixed(2)}
                  </span>
                </div>
                <div className="p-4 rounded-lg bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40">
                  <span className="text-rose-700 dark:text-rose-400 block mb-1">Balance Due</span>
                  <span className="text-lg font-bold text-rose-600 tabular-nums">
                    ₹{(invoice.balanceAmount ?? (isPaid ? 0 : invoice.grandTotal)).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="pt-2 text-xs space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Payment Mode</span>
                  <span className="font-semibold uppercase text-slate-900 dark:text-white">{invoice.paymentMode}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Payment Status</span>
                  <span className="font-semibold uppercase text-emerald-600">{invoice.status}</span>
                </div>
              </div>

              {/* Linked Payment Transactions */}
              {(() => {
                const linkedPayments = payments.filter(p => p.docId === invoice.id || p.docNo === invoice.docNo)
                if (linkedPayments.length === 0 && (invoice.paidAmount || 0) === 0) return null
                return (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <h4 className="font-semibold text-xs text-slate-700 dark:text-slate-300">Recorded Payments & Advances</h4>
                    <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-medium">
                          <tr>
                            <th className="p-2.5">Date</th>
                            <th className="p-2.5">Payment #</th>
                            <th className="p-2.5">Type / Mode</th>
                            <th className="p-2.5">Notes</th>
                            <th className="p-2.5 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {linkedPayments.length > 0 ? (
                            linkedPayments.map(p => (
                              <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                <td className="p-2.5 text-slate-500">{p.date}</td>
                                <td className="p-2.5 font-semibold text-blue-600 dark:text-blue-400">{p.paymentNo}</td>
                                <td className="p-2.5 uppercase font-medium text-slate-600 dark:text-slate-400">{p.paymentMode}</td>
                                <td className="p-2.5 text-slate-500 text-[11px]">{p.notes || "-"}</td>
                                <td className="p-2.5 text-right font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                                  {p.currencySymbol || currSym}{p.amount.toFixed(2)}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td className="p-2.5 text-slate-500">{invoice.date}</td>
                              <td className="p-2.5 font-semibold text-blue-600 dark:text-blue-400">Advance on Invoice</td>
                              <td className="p-2.5 uppercase font-medium text-slate-600 dark:text-slate-400">{invoice.paymentMode}</td>
                              <td className="p-2.5 text-slate-500 text-[11px]">Paid at invoice creation</td>
                              <td className="p-2.5 text-right font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                                {currSym}{(invoice.paidAmount || 0).toFixed(2)}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="w-full max-w-4xl mx-auto space-y-4">
            <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Document Audit History</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Lifecycle records and compliance audit log for this invoice</p>
                </div>
                <Badge variant="outline" className="text-xs font-semibold px-2.5 py-0.5">
                  {invoice.docNo}
                </Badge>
              </div>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800 text-xs">
                <div className="relative">
                  <div className="absolute -left-[21px] top-0.5 h-3 w-3 rounded-full bg-blue-600 border-2 border-white dark:border-slate-900 shadow-xs" />
                  <div className="font-semibold text-slate-900 dark:text-white">Invoice Created</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">Created by {invoice.createdBy} on {invoice.date}</div>
                </div>
                <div className="relative">
                  <div className="absolute -left-[21px] top-0.5 h-3 w-3 rounded-full bg-emerald-600 border-2 border-white dark:border-slate-900 shadow-xs" />
                  <div className="font-semibold text-slate-900 dark:text-white">Stock Deducted</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">Stock automatically deducted from {invoice.godownName || "Main Godown"}</div>
                </div>
                <div className="relative">
                  <div className="absolute -left-[21px] top-0.5 h-3 w-3 rounded-full bg-slate-400 border-2 border-white dark:border-slate-900 shadow-xs" />
                  <div className="font-semibold text-slate-900 dark:text-white">E-Way Bill Status</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">{invoice.ewayBillNo ? `Generated: ${invoice.ewayBillNo}` : "Below ₹50,000 threshold"}</div>
                </div>
              </div>
            </div>

            {/* Payment Reminders Log Section */}
            <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Bell className="h-4 w-4 text-blue-600" />
                    <span>Payment Reminders Log</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">History of WhatsApp and Email payment notices dispatched for this invoice</p>
                </div>
                {!isPaid && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={openReminderModal}
                    className="h-7 px-2.5 text-xs gap-1 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  >
                    <Send className="h-3 w-3 text-blue-600" />
                    <span>Send Reminder</span>
                  </Button>
                )}
              </div>

              {/* Logs List */}
              {(() => {
                const invoiceLogs = reminderLogs.filter(l => l.invoiceId === invoice.id || l.invoiceNo === invoice.docNo || l.partyId === invoice.partyId)
                if (invoiceLogs.length === 0) {
                  return (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No payment reminders sent yet for this document.
                    </div>
                  )
                }

                return (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {invoiceLogs.map(log => (
                      <div key={log.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className={`p-1.5 rounded mt-0.5 shrink-0 ${log.channel === "whatsapp" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40" : "bg-blue-50 text-blue-600 dark:bg-blue-950/40"}`}>
                            {log.channel === "whatsapp" ? <Share2 className="h-3.5 w-3.5" /> : <Mail className="h-3.5 w-3.5" />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900 dark:text-white capitalize">
                                {log.type.replace(/_/g, " ")} Notice
                              </span>
                              <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal uppercase">
                                {log.channel}
                              </Badge>
                              <span className="text-[10px] text-slate-400">
                                {new Date(log.sentAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 font-mono bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded border border-slate-100 dark:border-slate-800">
                              {log.messagePreview}
                            </p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              Recipient: {log.recipientPhoneOrEmail} • Method: {log.triggeredBy}
                            </span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 shrink-0">
                          Delivered
                        </Badge>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
          </div>
        )}

      </div>

      {/* Slide-over Drawer Backdrop */}
      {isPaymentDrawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setIsPaymentDrawerOpen(false)}
        />
      )}

      {/* Slide-over Drawer Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-lg lg:max-w-xl bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col transform transition-transform duration-300 ease-in-out ${isPaymentDrawerOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
          }`}
      >
        {/* Drawer Sticky Header */}
        <div className="h-14 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Record Payment</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800">
                  Payment In
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Invoice {invoice.docNo} • {invoice.partyName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPaymentDrawerOpen(false)}
              className="h-8 px-2.5 text-xs font-semibold border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSavePayment}
              className="h-8 px-3.5 text-xs font-semibold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-2xs rounded-md"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Save Payment</span>
            </Button>
            <button
              onClick={() => setIsPaymentDrawerOpen(false)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-1"
              title="Close Drawer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {drawerError && (
            <div className="p-3 rounded-lg bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{drawerError}</span>
            </div>
          )}

          {drawerSuccess && (
            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{drawerSuccess}</span>
            </div>
          )}

          {/* Invoice Context Card */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Customer Details</span>
              <span className="text-slate-500 font-mono text-[11px]">{party?.phone ? `+91 ${party.phone}` : invoice.partyGstin || "Registered Customer"}</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-medium">Invoice Total</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                  {currSym}{invoice.grandTotal.toFixed(2)}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-medium">Received So Far</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {currSym}{(invoice.paidAmount || 0).toFixed(2)}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/40">
                <span className="text-[10px] text-rose-700 dark:text-rose-400 block font-semibold">Balance Due</span>
                <span className="text-xs font-bold text-rose-600 dark:text-rose-300 tabular-nums">
                  {currSym}{balanceDue.toFixed(2)}
                </span>
              </div>
            </div>

            {balanceDue > 0 && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500">Quick Fill:</span>
                <button
                  type="button"
                  onClick={() => setPaymentAmount(String(balanceDue))}
                  className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Pay Full Balance ({currSym}{balanceDue.toFixed(2)})
                </button>
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-red-600 dark:text-red-400 mb-1.5">
                Amount Received ({currSym})*
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-semibold text-slate-400">{currSym}</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="pl-7 h-9 text-xs font-bold tabular-nums"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Payment Date*
                </label>
                <Input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
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
                  options={[
                    { value: "upi", label: "UPI / QR Code" },
                    { value: "bank", label: "Bank Transfer (NEFT/RTGS)" },
                    { value: "cash", label: "Cash" },
                    { value: "cheque", label: "Cheque" },
                    { value: "card", label: "Credit / Debit Card" },
                  ]}
                  className="w-full h-9"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Deposit To Account*
              </label>
              <Select
                value={paymentAccount}
                onValueChange={(val) => setPaymentAccount(val)}
                options={[
                  { value: "HDFC Current A/c (..4029)", label: "HDFC Current A/c (..4029)" },
                  { value: "ICICI Business A/c (..9921)", label: "ICICI Business A/c (..9921)" },
                  { value: "State Bank of India (..5102)", label: "State Bank of India (..5102)" },
                  { value: "Cash in Hand", label: "Cash in Hand" },
                  { value: "Petty Cash Account", label: "Petty Cash Account" },
                ]}
                className="w-full h-9"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Reference / UTR / Cheque Number
              </label>
              <Input
                type="text"
                placeholder="e.g. UPI Ref / UTR / Cheque No."
                value={paymentRefNo}
                onChange={(e) => setPaymentRefNo(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Notes / Remarks
              </label>
              <textarea
                rows={2}
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Outcome Preview */}
            {parseFloat(paymentAmount) > 0 && (
              <div className={`p-3 rounded-lg border text-xs font-medium ${parseFloat(paymentAmount) >= balanceDue
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                : "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300"
                }`}>
                {parseFloat(paymentAmount) >= balanceDue ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>This payment settles the invoice in full and will mark it as <strong>PAID</strong>.</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <span>Invoice will remain <strong>PARTIAL</strong> with remaining balance of ₹{(balanceDue - parseFloat(paymentAmount)).toFixed(2)}.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Send Payment Reminder Modal Dialog */}
      {isReminderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0 shadow-2xs">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">Send Payment Reminder</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Dispatch payment follow-up to {invoice.partyName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReminderModalOpen(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto text-xs">
              {/* Invoice Summary Card */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/70 flex items-center justify-between">
                <div>
                  <span className="font-bold text-sm text-slate-900 tracking-tight">{invoice.docNo}</span>
                  <span className="text-slate-400 mx-2">•</span>
                  <span className="text-slate-500 font-medium text-xs">Due: {invoice.dueDate || invoice.date}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider block">Balance Due</span>
                  <span className="font-extrabold text-base text-slate-900 tabular-nums">
                    {currSym}{balanceDue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Notice Type Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Notice Schedule &amp; Urgency
                </label>
                <div className="grid grid-cols-5 gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/50">
                  {[
                    { id: "upcoming_due", label: "Upcoming", badge: "-3d" },
                    { id: "due_today", label: "Due Today", badge: "0d" },
                    { id: "overdue_level_1", label: "Follow-up", badge: "+3d" },
                    { id: "overdue_level_2", label: "Urgent", badge: "+10d" },
                    { id: "overdue_level_3", label: "Final Notice", badge: "+30d" },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setReminderModalType(opt.id as PartyReminderType)
                        setCustomReminderMsg(generateMessageForType(opt.id as PartyReminderType))
                      }}
                      className={`py-2 px-1 rounded-lg text-xs font-medium transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer text-center ${
                        reminderModalType === opt.id
                          ? "bg-white text-blue-600 font-bold shadow-xs border border-slate-200/70"
                          : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                      }`}
                    >
                      <span className="truncate text-[11px] leading-tight font-medium">{opt.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                        reminderModalType === opt.id
                          ? "bg-blue-50 text-blue-700 font-bold"
                          : "bg-slate-200/60 text-slate-500 font-medium"
                      }`}>
                        {opt.badge}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Content Area */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-slate-700 text-xs">
                    Message Preview (Editable)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(customReminderMsg)
                      setReminderFeedback("Message copied to clipboard!")
                      setTimeout(() => setReminderFeedback(null), 2000)
                    }}
                    className="text-blue-600 hover:bg-blue-50 px-2 py-0.5 rounded-md transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer border border-blue-200/60"
                  >
                    <Copy className="h-3 w-3" />
                    <span>Copy Text</span>
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={customReminderMsg}
                  onChange={(e) => setCustomReminderMsg(e.target.value)}
                  className="w-full p-3.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-slate-800 font-sans text-xs leading-relaxed outline-none transition-all resize-none shadow-2xs bg-white"
                />
              </div>

              {/* Recipient Details */}
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <div className="h-6 w-6 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                    <Phone className="h-3.5 w-3.5" />
                  </div>
                  <span>Phone: <strong className="text-slate-900 font-semibold">{party?.phone || party?.mobile || "Not specified"}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <div className="h-6 w-6 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                    <Mail className="h-3.5 w-3.5" />
                  </div>
                  <span>Email: <strong className="text-slate-900 font-semibold">{party?.email || "Not specified"}</strong></span>
                </div>
              </div>

              {reminderFeedback && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center font-medium text-xs flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>{reminderFeedback}</span>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsReminderModalOpen(false)}
                className="h-9 px-4 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendEmailReminder}
                className="h-9 px-4 text-xs font-semibold rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-blue-700 transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
              >
                <Mail className="h-3.5 w-3.5 text-blue-600" />
                <span>Send via Email</span>
              </button>
              <button
                type="button"
                onClick={handleSendWhatsAppReminder}
                className="h-9 px-4 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <svg className="h-4 w-4 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.04 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.53 7.34C9.33 7.34 9 7.42 8.71 7.74C8.42 8.06 7.6 8.83 7.6 10.4C7.6 11.97 8.74 13.48 8.9 13.7C9.06 13.92 11.13 17.11 14.3 18.47C15.06 18.79 15.65 18.99 16.11 19.14C16.87 19.38 17.57 19.35 18.11 19.27C18.72 19.18 19.98 18.5 20.24 17.75C20.5 17.01 20.5 16.37 20.42 16.24C20.35 16.11 20.15 16.03 19.85 15.88C19.55 15.73 18.08 15.01 17.8 14.91C17.53 14.81 17.33 14.76 17.13 15.06C16.93 15.36 16.36 16.03 16.19 16.23C16.02 16.43 15.85 16.45 15.55 16.3C15.25 16.15 14.28 15.83 13.14 14.81C12.25 14.01 11.65 13.03 11.47 12.73C11.3 12.43 11.45 12.27 11.6 12.12C11.74 11.98 11.91 11.76 12.06 11.58C12.21 11.41 12.26 11.28 12.36 11.08C12.46 10.88 12.41 10.71 12.33 10.56C12.26 10.41 11.68 8.98 11.44 8.4C11.2 7.84 10.96 7.92 10.78 7.91C10.61 7.9 10.41 7.9 10.21 7.9C10.01 7.9 9.69 7.97 9.53 8.15V7.34Z"/>
                </svg>
                <span>Send via WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}