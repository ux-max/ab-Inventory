"use client"

import React, { useState } from "react"
import { useApp } from "@/context/AppContext"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Bell, 
  MessageSquare, 
  Mail, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  Package, 
  FileText, 
  RotateCcw,
  Sparkles,
  Save,
  Send,
  Users,
  Smartphone,
  Check,
  ArrowUpRight,
  ExternalLink,
  ChevronDown
} from "lucide-react"
import { DEFAULT_REMINDER_TEMPLATES } from "@/lib/reminderEngine"
import { ReminderMessageTemplates } from "@/types/reminders"

interface MeRemindersConfig {
  lowStockEmail: boolean
  pendingInvoicesEmail: boolean
  dailySummaryEmail: boolean
  dailySummaryWhatsApp: boolean
  weeklySummaryEmail: boolean
  weeklySummaryWhatsApp: boolean
  monthlySummaryEmail: boolean
  monthlySummaryWhatsApp: boolean
  gstr1ReportEmail: boolean
  ownerWhatsApp: string
  ownerEmail: string
}

function InSwitchPillToggle({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex items-center h-6 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer select-none shadow-2xs ${
        active
          ? "bg-blue-600 text-white pl-2.5 pr-1 gap-1.5"
          : "bg-slate-500/90 dark:bg-slate-700 text-slate-100 pl-1 pr-2.5 gap-1.5 hover:bg-slate-600"
      }`}
      title={`Toggle ${label}`}
    >
      {active ? (
        <>
          <span className="text-[11px] font-semibold">{label}</span>
          <span className="w-3.5 h-3.5 bg-white rounded-full shadow-2xs shrink-0" />
        </>
      ) : (
        <>
          <span className="w-3.5 h-3.5 bg-white rounded-full shadow-2xs shrink-0" />
          <span className="text-[11px] font-medium">{label}</span>
        </>
      )}
    </button>
  )
}

interface CompoundScheduleInputProps {
  label: string
  days: number
  timing: "before" | "after"
  targetDate: "due_date" | "invoice_date"
  onChangeDays: (days: number) => void
  onChangeTiming: (timing: "before" | "after") => void
  onChangeTargetDate: (target: "due_date" | "invoice_date") => void
  disableTiming?: boolean
  disableTarget?: boolean
}

function CompoundReminderScheduleInput({
  label,
  days,
  timing,
  targetDate,
  onChangeDays,
  onChangeTiming,
  onChangeTargetDate,
  disableTiming = false,
  disableTarget = false,
}: CompoundScheduleInputProps) {
  const targetLabel = targetDate === "invoice_date" ? "invoice date" : "due date"
  const helperText =
    days === 0
      ? `Reminds on ${targetLabel}`
      : `Reminds ${days} day${days > 1 ? "s" : ""} ${timing} ${targetLabel}`

  return (
    <div>
      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5 text-xs">
        {label}
      </label>
      <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xs divide-x divide-slate-200 dark:divide-slate-800 h-9 max-w-full">
        {/* Days input */}
        <div className="flex items-center px-2.5 gap-1.5 shrink-0">
          <input
            type="number"
            min={0}
            max={90}
            value={days}
            onChange={(e) => onChangeDays(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-9 text-center font-semibold text-xs text-slate-900 dark:text-slate-100 bg-transparent focus:outline-hidden"
          />
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 select-none">
            Days
          </span>
        </div>

        {/* Timing dropdown */}
        <div className="relative flex items-center px-2.5 shrink-0">
          <select
            value={timing}
            disabled={disableTiming}
            onChange={(e) => onChangeTiming(e.target.value as "before" | "after")}
            className="text-xs font-medium text-slate-700 dark:text-slate-200 bg-transparent focus:outline-hidden cursor-pointer pr-4 appearance-none disabled:cursor-not-allowed"
          >
            <option value="before" className="dark:bg-slate-900 text-slate-800 dark:text-slate-200">Before</option>
            <option value="after" className="dark:bg-slate-900 text-slate-800 dark:text-slate-200">After</option>
          </select>
          <ChevronDown className="w-3 h-3 text-slate-400 pointer-events-none absolute right-1.5" />
        </div>

        {/* Target date dropdown */}
        <div className="relative flex items-center px-2.5 flex-1 min-w-[95px]">
          <select
            value={targetDate}
            disabled={disableTarget}
            onChange={(e) => onChangeTargetDate(e.target.value as "due_date" | "invoice_date")}
            className="w-full text-xs font-medium text-slate-700 dark:text-slate-200 bg-transparent focus:outline-hidden cursor-pointer pr-4 appearance-none disabled:cursor-not-allowed"
          >
            <option value="due_date" className="dark:bg-slate-900 text-slate-800 dark:text-slate-200">Due date</option>
            <option value="invoice_date" className="dark:bg-slate-900 text-slate-800 dark:text-slate-200">Invoice date</option>
          </select>
          <ChevronDown className="w-3 h-3 text-slate-400 pointer-events-none absolute right-1.5" />
        </div>
      </div>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
        {helperText}
      </p>
    </div>
  )
}

interface RemindersSettingsProps {
  onNavigateToIntegrations?: () => void
}

export function RemindersSettings({ onNavigateToIntegrations }: RemindersSettingsProps = {}) {
  const { 
    autoReminderSettings, 
    updateAutoReminderSettings, 
    reminderLogs,
    business 
  } = useApp()

  const DEFAULT_EMAIL_SUBJECTS: Record<keyof ReminderMessageTemplates, string> = {
    upcoming_due: "Payment Notice: Invoice {invoice_no} due on {due_date}",
    due_today: "Payment Due Today: Invoice {invoice_no} ({amount_due})",
    overdue_level_1: "Friendly Reminder: Invoice {invoice_no} is {days_overdue} days overdue",
    overdue_level_2: "Urgent Payment Notice: Invoice {invoice_no} is {days_overdue} days overdue",
    overdue_level_3: "FINAL NOTICE: Invoice {invoice_no} overdue - Immediate settlement required",
    quotation_expiring: "Quotation {invoice_no} expiring in 3 days - Confirm order",
    payment_received: "Payment Receipt Confirmed for Invoice {invoice_no}"
  }

  const [settings, setSettings] = useState(autoReminderSettings)
  const [emailSubjects, setEmailSubjects] = useState(DEFAULT_EMAIL_SUBJECTS)
  const [activeCategoryTab, setActiveCategoryTab] = useState<"party" | "me">("party")
  const [activeTemplateTab, setActiveTemplateTab] = useState<keyof ReminderMessageTemplates>("due_today")
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [testReportSent, setTestReportSent] = useState(false)

  const [meReminders, setMeReminders] = useState<MeRemindersConfig>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("ab_reminders_to_me")
        if (saved) return JSON.parse(saved)
      } catch (e) {}
    }
    return {
      lowStockEmail: false,
      pendingInvoicesEmail: false,
      dailySummaryEmail: true,
      dailySummaryWhatsApp: true,
      weeklySummaryEmail: true,
      weeklySummaryWhatsApp: true,
      monthlySummaryEmail: true,
      monthlySummaryWhatsApp: true,
      gstr1ReportEmail: true,
      ownerWhatsApp: "+91 98200 11001",
      ownerEmail: "admin@automatebusiness.com",
    }
  })

  const [editingMeContact, setEditingMeContact] = useState(false)
  const [meSaveSuccess, setMeSaveSuccess] = useState(false)

  const handleSaveMeReminders = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("ab_reminders_to_me", JSON.stringify(meReminders))
      } catch (e) {}
    }
    setMeSaveSuccess(true)
    setTimeout(() => setMeSaveSuccess(false), 2500)
  }

  const isWhatsAppActive = settings.defaultChannel === "whatsapp" || settings.defaultChannel === "both"
  const isEmailActive = settings.defaultChannel === "email" || settings.defaultChannel === "both"

  const toggleChannel = (channel: "whatsapp" | "email") => {
    if (channel === "whatsapp") {
      if (isWhatsAppActive) {
        if (isEmailActive) {
          setSettings(prev => ({ ...prev, defaultChannel: "email" }))
        }
      } else {
        setSettings(prev => ({ ...prev, defaultChannel: isEmailActive ? "both" : "whatsapp" }))
      }
    } else {
      if (isEmailActive) {
        if (isWhatsAppActive) {
          setSettings(prev => ({ ...prev, defaultChannel: "whatsapp" }))
        }
      } else {
        setSettings(prev => ({ ...prev, defaultChannel: isWhatsAppActive ? "both" : "email" }))
      }
    }
  }

  const handleSendTestReport = () => {
    setTestReportSent(true)
    setTimeout(() => setTestReportSent(false), 4000)
  }

  const handleSave = () => {
    updateAutoReminderSettings(settings)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2500)
  }

  const handleResetTemplate = (key: keyof ReminderMessageTemplates) => {
    setSettings(prev => ({
      ...prev,
      templates: {
        ...prev.templates,
        [key]: DEFAULT_REMINDER_TEMPLATES[key]
      }
    }))
  }

  const insertPlaceholder = (placeholder: string) => {
    const current = settings.templates[activeTemplateTab] || ""
    setSettings(prev => ({
      ...prev,
      templates: {
        ...prev.templates,
        [activeTemplateTab]: `${current} ${placeholder}`
      }
    }))
  }

  const templateLabels: Record<keyof ReminderMessageTemplates, string> = {
    upcoming_due: settings.beforeDueDays > 0 ? `Upcoming Due (${settings.beforeDueDays} Days Before)` : "Upcoming Notice (Due Date)",
    due_today: "Due Today Notice",
    overdue_level_1: "Overdue Level 1 (Gentle)",
    overdue_level_2: "Overdue Level 2 (Firm)",
    overdue_level_3: "Overdue Level 3 (Final Notice)",
    quotation_expiring: "Quotation Expiry Follow-up",
    payment_received: "Payment Received Receipt"
  }

  const templateKeys = Object.keys(templateLabels) as (keyof ReminderMessageTemplates)[]

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/40 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* 1. Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span>Auto Reminders &amp; Alerts</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Configure automated reminders for parties (customers &amp; suppliers) and operational alerts for your business.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {saveSuccess && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                Settings Saved
              </span>
            )}
            <Button
              size="sm"
              onClick={handleSave}
              className="h-8 px-4 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-2xs gap-1.5"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save Settings</span>
            </Button>
          </div>
        </div>

        {/* Simple Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-8">
          <button
            type="button"
            onClick={() => setActiveCategoryTab("party")}
            className={`pb-3 text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeCategoryTab === "party"
                ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Reminder to Party</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategoryTab("me")}
            className={`pb-3 text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeCategoryTab === "me"
                ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium"
            }`}
          >
            <Bell className="h-4 w-4" />
            <span>Reminder to Me</span>
          </button>
        </div>

        {activeCategoryTab === "party" ? (
          <>
            {/* 2. Customer Payment Reminders (Invoices) */}
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Customer Payment Reminders</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Automated schedules for unpaid and partial sales invoices sent to customers.</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableAutoCustomerReminders}
                    onChange={(e) => setSettings({ ...settings, enableAutoCustomerReminders: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {settings.enableAutoCustomerReminders && (
                <div className="mt-4 space-y-4 text-xs">
                  
                  {/* Default Channel & Schedule */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                        Dispatch Channels
                      </label>

                      {/* Interactive Dual-Channel Selector Pills */}
                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={() => toggleChannel("whatsapp")}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                            isWhatsAppActive
                              ? "bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300 shadow-2xs"
                              : "bg-white border-slate-200 text-slate-500 hover:text-slate-800 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400"
                          }`}
                        >
                          <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                          <span>WhatsApp</span>
                          {isWhatsAppActive && <Check className="h-3 w-3 text-emerald-600" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleChannel("email")}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                            isEmailActive
                              ? "bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-950/60 dark:border-blue-800 dark:text-blue-300 shadow-2xs"
                              : "bg-white border-slate-200 text-slate-500 hover:text-slate-800 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400"
                          }`}
                        >
                          <Mail className="h-3.5 w-3.5 text-blue-600" />
                          <span>Email</span>
                          {isEmailActive && <Check className="h-3 w-3 text-blue-600" />}
                        </button>
                      </div>
                    </div>

                    {/* Reminder Start Date (Matching Image 1 Compound Control) */}
                    <CompoundReminderScheduleInput
                      label="Reminder Start Date"
                      days={settings.beforeDueDays}
                      timing={settings.reminderStartTiming || "before"}
                      targetDate={settings.reminderStartTarget || "due_date"}
                      onChangeDays={(days) => setSettings({ ...settings, beforeDueDays: days })}
                      onChangeTiming={(timing) => setSettings({ ...settings, reminderStartTiming: timing })}
                      onChangeTargetDate={(target) => setSettings({ ...settings, reminderStartTarget: target })}
                    />
                  </div>

                  {/* Overdue Follow-up Schedules using the same compound bar pattern */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-2 text-xs">
                      Overdue Follow-up Schedules
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <CompoundReminderScheduleInput
                        label="Overdue Follow-up (Level 1)"
                        days={settings.overdueLevel1Days}
                        timing="after"
                        targetDate="due_date"
                        onChangeDays={(days) => setSettings({ ...settings, overdueLevel1Days: days })}
                        onChangeTiming={() => {}}
                        onChangeTargetDate={() => {}}
                      />

                      <CompoundReminderScheduleInput
                        label="Firm Notice (Level 2)"
                        days={settings.overdueLevel2Days}
                        timing="after"
                        targetDate="due_date"
                        onChangeDays={(days) => setSettings({ ...settings, overdueLevel2Days: days })}
                        onChangeTiming={() => {}}
                        onChangeTargetDate={() => {}}
                      />

                      <CompoundReminderScheduleInput
                        label="Final Notice (Level 3)"
                        days={settings.overdueLevel3Days}
                        timing="after"
                        targetDate="due_date"
                        onChangeDays={(days) => setSettings({ ...settings, overdueLevel3Days: days })}
                        onChangeTiming={() => {}}
                        onChangeTargetDate={() => {}}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Customer Email Templates (Email-Only Designer) */}
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Customer Email Templates</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Customize email subject lines and body copy dispatched to customer parties.
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleResetTemplate(activeTemplateTab)}
                  className="h-7 px-2.5 text-xs text-slate-600 dark:text-slate-300 gap-1 border-slate-200 dark:border-slate-700"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset Email Template</span>
                </Button>
              </div>

              {/* Template Event Dropdown */}
              <div className="mt-4">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5 text-xs">
                  Template Event
                </label>
                <div className="relative max-w-md">
                  <select
                    value={activeTemplateTab}
                    onChange={(e) => setActiveTemplateTab(e.target.value as keyof ReminderMessageTemplates)}
                    className="w-full h-8.5 px-3 pr-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-blue-500 shadow-2xs cursor-pointer appearance-none"
                  >
                    {templateKeys.map(key => (
                      <option key={key} value={key} className="dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                        {templateLabels[key]}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Email Subject Line */}
              <div className="mt-4">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1 text-xs">
                  Email Subject Line
                </label>
                <Input
                  type="text"
                  value={emailSubjects[activeTemplateTab] || ""}
                  onChange={(e) => setEmailSubjects(prev => ({
                    ...prev,
                    [activeTemplateTab]: e.target.value
                  }))}
                  className="h-8 text-xs font-medium w-full bg-slate-50/50 dark:bg-slate-900/50"
                  placeholder="e.g. Payment Notice: Invoice {invoice_no} is due on {due_date}"
                />
              </div>

              {/* Dynamic Placeholders Toolbar */}
              <div className="mt-3">
                <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                  Insert Dynamic Variable:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { tag: "{party_name}", desc: "Customer Name" },
                    { tag: "{invoice_no}", desc: "Invoice Number" },
                    { tag: "{amount_due}", desc: "Due Amount" },
                    { tag: "{due_date}", desc: "Due Date" },
                    { tag: "{days_overdue}", desc: "Overdue Days" },
                    { tag: "{upi_id}", desc: "Business UPI ID" },
                    { tag: "{company_name}", desc: "Your Business" },
                  ].map(p => (
                    <button
                      key={p.tag}
                      type="button"
                      onClick={() => insertPlaceholder(p.tag)}
                      className="px-2 py-0.5 text-[11px] rounded bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 font-mono transition-colors border border-blue-200 dark:border-blue-800 cursor-pointer"
                      title={p.desc}
                    >
                      {p.tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Email Body Textarea */}
              <div className="mt-3">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1 text-xs">
                  Email Message Body
                </label>
                <textarea
                  rows={4}
                  value={settings.templates[activeTemplateTab] || ""}
                  onChange={(e) => setSettings({
                    ...settings,
                    templates: {
                      ...settings.templates,
                      [activeTemplateTab]: e.target.value
                    }
                  })}
                  className="w-full text-xs p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-sans focus:outline-hidden focus:ring-1 focus:ring-blue-500 shadow-2xs leading-relaxed"
                  placeholder="Enter email message body..."
                />
              </div>
            </div>

            {/* 5. Recent Dispatched Reminders Log */}
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Reminders Log</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">History of dispatched notifications sent to customer parties.</p>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  {reminderLogs.length} logged
                </span>
              </div>

              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[10px]">
                      <th className="py-2 px-3">Date &amp; Time</th>
                      <th className="py-2 px-3">Invoice</th>
                      <th className="py-2 px-3">Party Name</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3">Channel</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {reminderLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400 text-xs">
                          No reminders dispatched yet. Reminders will appear here when scheduled or sent.
                        </td>
                      </tr>
                    ) : (
                      reminderLogs.slice(0, 5).map(log => (
                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2 px-3 text-slate-500 tabular-nums">{log.sentAt}</td>
                          <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">{log.invoiceNo || "—"}</td>
                          <td className="py-2 px-3 text-slate-700 dark:text-slate-300">{log.partyName}</td>
                          <td className="py-2 px-3">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {log.type.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="py-2 px-3 uppercase text-[10px] font-semibold text-slate-500">{log.channel}</td>
                          <td className="py-2 px-3">
                            <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-200 dark:border-emerald-800">
                              {log.status}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
            
            {/* Delivery Contact Banner with Edit Capability */}
            <div className="pb-5 mb-6 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <Mail className="h-3.5 w-3.5 text-blue-600" />
                  <span className="text-slate-400">Email:</span>
                  {editingMeContact ? (
                    <Input
                      value={meReminders.ownerEmail}
                      onChange={(e) => setMeReminders(prev => ({ ...prev, ownerEmail: e.target.value }))}
                      className="h-6 w-52 text-xs py-0"
                    />
                  ) : (
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{meReminders.ownerEmail}</span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-slate-400">WhatsApp:</span>
                  {editingMeContact ? (
                    <Input
                      value={meReminders.ownerWhatsApp}
                      onChange={(e) => setMeReminders(prev => ({ ...prev, ownerWhatsApp: e.target.value }))}
                      className="h-6 w-36 text-xs py-0"
                    />
                  ) : (
                    <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{meReminders.ownerWhatsApp}</span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingMeContact(!editingMeContact)}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
              >
                {editingMeContact ? "Done" : "Edit Contacts"}
              </button>
            </div>

            {/* List of 6 Reminders Matching User Reference Image */}
            <div className="space-y-6">
              
              {/* 1. Low Stock Reminder */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Low Stock Reminder
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Sends Notification/ Email about the products with low stock (default below 10)
                  </p>
                </div>
                <div className="shrink-0">
                  <InSwitchPillToggle
                    label="Email"
                    active={meReminders.lowStockEmail}
                    onClick={() => setMeReminders(prev => ({ ...prev, lowStockEmail: !prev.lowStockEmail }))}
                  />
                </div>
              </div>

              {/* 2. Pending Invoices Reminder */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Pending Invoices Reminder
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Sends Notification/ Email about the pending invoices for previous 30 days
                  </p>
                </div>
                <div className="shrink-0">
                  <InSwitchPillToggle
                    label="Email"
                    active={meReminders.pendingInvoicesEmail}
                    onClick={() => setMeReminders(prev => ({ ...prev, pendingInvoicesEmail: !prev.pendingInvoicesEmail }))}
                  />
                </div>
              </div>

              {/* 3. Daily Summary */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Daily Summary
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Sends Notification/Email about the Profit and Loss Statement for the Day
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <InSwitchPillToggle
                    label="Email"
                    active={meReminders.dailySummaryEmail}
                    onClick={() => setMeReminders(prev => ({ ...prev, dailySummaryEmail: !prev.dailySummaryEmail }))}
                  />
                  <InSwitchPillToggle
                    label="WhatsApp"
                    active={meReminders.dailySummaryWhatsApp}
                    onClick={() => setMeReminders(prev => ({ ...prev, dailySummaryWhatsApp: !prev.dailySummaryWhatsApp }))}
                  />
                </div>
              </div>

              {/* 4. Weekly Summary */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Weekly Summary
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Sends Notification/Email about the Profit and Loss Statement for the Last Week
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <InSwitchPillToggle
                    label="Email"
                    active={meReminders.weeklySummaryEmail}
                    onClick={() => setMeReminders(prev => ({ ...prev, weeklySummaryEmail: !prev.weeklySummaryEmail }))}
                  />
                  <InSwitchPillToggle
                    label="WhatsApp"
                    active={meReminders.weeklySummaryWhatsApp}
                    onClick={() => setMeReminders(prev => ({ ...prev, weeklySummaryWhatsApp: !prev.weeklySummaryWhatsApp }))}
                  />
                </div>
              </div>

              {/* 5. Monthly Summary */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Monthly Summary
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Sends Notification/Email about the Profit and Loss Statement for Previous Month
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <InSwitchPillToggle
                    label="Email"
                    active={meReminders.monthlySummaryEmail}
                    onClick={() => setMeReminders(prev => ({ ...prev, monthlySummaryEmail: !prev.monthlySummaryEmail }))}
                  />
                  <InSwitchPillToggle
                    label="WhatsApp"
                    active={meReminders.monthlySummaryWhatsApp}
                    onClick={() => setMeReminders(prev => ({ ...prev, monthlySummaryWhatsApp: !prev.monthlySummaryWhatsApp }))}
                  />
                </div>
              </div>

              {/* 6. Monthly GSTR 1 Report */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Monthly GSTR 1 Report
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Sends Notification/Email With the GSTR 1 Report
                  </p>
                </div>
                <div className="shrink-0">
                  <InSwitchPillToggle
                    label="Email"
                    active={meReminders.gstr1ReportEmail}
                    onClick={() => setMeReminders(prev => ({ ...prev, gstr1ReportEmail: !prev.gstr1ReportEmail }))}
                  />
                </div>
              </div>

            </div>

            {/* Bottom Save & Update Button */}
            <div className="mt-8 pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <Button
                type="button"
                onClick={handleSaveMeReminders}
                className="h-9 px-5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-2xs cursor-pointer"
              >
                Save &amp; Update
              </Button>
              {meSaveSuccess && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5 animate-fadeIn">
                  <CheckCircle2 className="h-4 w-4" />
                  Settings updated successfully!
                </span>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  )
}

