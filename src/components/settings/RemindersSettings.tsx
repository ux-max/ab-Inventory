"use client"

import React, { useState } from "react"
import { useApp } from "@/context/AppContext"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
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
  Send
} from "lucide-react"
import { DEFAULT_REMINDER_TEMPLATES } from "@/lib/reminderEngine"
import { ReminderMessageTemplates } from "@/types/reminders"

export function RemindersSettings() {
  const { 
    autoReminderSettings, 
    updateAutoReminderSettings, 
    reminderLogs,
    business 
  } = useApp()

  const [settings, setSettings] = useState(autoReminderSettings)
  const [activeTemplateTab, setActiveTemplateTab] = useState<keyof ReminderMessageTemplates>("due_today")
  const [saveSuccess, setSaveSuccess] = useState(false)

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
    upcoming_due: "Upcoming Due (3 Days Before)",
    due_today: "Due Today Notice",
    overdue_level_1: "Overdue Level 1 (Gentle)",
    overdue_level_2: "Overdue Level 2 (Firm)",
    overdue_level_3: "Overdue Level 3 (Final Notice)",
    quotation_expiring: "Quotation Expiry Follow-up",
    payment_received: "Payment Received Receipt"
  }

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
              Configure automated WhatsApp/Email reminders for customers and operational alerts for your business.
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

        {/* 2. Customer Payment Reminders (Invoices) */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Customer Payment Reminders</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Automated schedules for unpaid and partial sales invoices.</p>
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
                    Primary Dispatch Channel
                  </label>
                  <Select
                    value={settings.defaultChannel}
                    onValueChange={(val) => setSettings({ ...settings, defaultChannel: val as any })}
                    options={[
                      { value: "whatsapp", label: "WhatsApp (Direct wa.me link with UPI)" },
                      { value: "email", label: "Email" },
                    ]}
                    className="w-full h-8 text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Default Schedule Preset
                  </label>
                  <Select
                    value={settings.defaultSchedulePreset}
                    onValueChange={(val) => setSettings({ ...settings, defaultSchedulePreset: val as any })}
                    options={[
                      { value: "standard", label: "Standard (3d before, Due date, 7d & 15d overdue)" },
                      { value: "aggressive", label: "Aggressive (1d before, Due date, every 3d overdue)" },
                      { value: "gentle", label: "Gentle (Due date, 15d overdue)" },
                    ]}
                    className="w-full h-8 text-xs"
                  />
                </div>
              </div>

              {/* Intervals Configuration */}
              <div className="pt-2">
                <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                  Reminder Intervals (Days)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
                    <span className="text-[11px] font-medium text-slate-500 block">Upcoming Notice</span>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Input
                        type="number"
                        min={1}
                        max={15}
                        value={settings.beforeDueDays}
                        onChange={(e) => setSettings({ ...settings, beforeDueDays: parseInt(e.target.value) || 1 })}
                        className="h-8 text-xs font-semibold w-16"
                      />
                      <span className="text-[11px] text-slate-400">days before</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
                    <span className="text-[11px] font-medium text-slate-500 block">Overdue Level 1</span>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Input
                        type="number"
                        min={1}
                        max={15}
                        value={settings.overdueLevel1Days}
                        onChange={(e) => setSettings({ ...settings, overdueLevel1Days: parseInt(e.target.value) || 1 })}
                        className="h-8 text-xs font-semibold w-16"
                      />
                      <span className="text-[11px] text-slate-400">days overdue</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
                    <span className="text-[11px] font-medium text-slate-500 block">Overdue Level 2</span>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Input
                        type="number"
                        min={5}
                        max={30}
                        value={settings.overdueLevel2Days}
                        onChange={(e) => setSettings({ ...settings, overdueLevel2Days: parseInt(e.target.value) || 5 })}
                        className="h-8 text-xs font-semibold w-16"
                      />
                      <span className="text-[11px] text-slate-400">days overdue</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
                    <span className="text-[11px] font-medium text-slate-500 block">Final Notice</span>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Input
                        type="number"
                        min={15}
                        max={90}
                        value={settings.overdueLevel3Days}
                        onChange={(e) => setSettings({ ...settings, overdueLevel3Days: parseInt(e.target.value) || 15 })}
                        className="h-8 text-xs font-semibold w-16"
                      />
                      <span className="text-[11px] text-slate-400">days overdue</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. Customizable Message Templates */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Message Templates</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Customize WhatsApp and email reminder wording.</p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleResetTemplate(activeTemplateTab)}
              className="h-7 px-2.5 text-xs text-slate-600 dark:text-slate-300 gap-1 border-slate-200 dark:border-slate-700"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset Template</span>
            </Button>
          </div>

          {/* Template Selector Tabs */}
          <div className="flex flex-wrap gap-1 mt-4 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/80">
            {(Object.keys(templateLabels) as Array<keyof ReminderMessageTemplates>).map(key => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTemplateTab(key)}
                className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                  activeTemplateTab === key
                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-semibold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                {templateLabels[key]}
              </button>
            ))}
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

          {/* Template Textarea */}
          <div className="mt-3">
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
              placeholder="Enter message template..."
            />
          </div>
        </div>

        {/* 4. Business Admin & Team Alerts ("To Me") */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-1.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Business Admin Alerts ("To Me")</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Internal alerts delivered to the top navigation bell icon.</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            
            {/* Low Stock Alert */}
            <div className="flex items-start justify-between p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="pr-3">
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">Low Stock Alert</span>
                <span className="text-[11px] text-slate-500">Alert when current inventory falls to or below minimum safety stock.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={settings.enableAdminLowStockAlerts}
                  onChange={(e) => setSettings({ ...settings, enableAdminLowStockAlerts: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Batch Near Expiry Alert */}
            <div className="flex items-start justify-between p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="pr-3">
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">Batch Near Expiry Alert</span>
                <span className="text-[11px] text-slate-500">Alert when batch is within {settings.expiryAlertDaysThreshold} days of expiry date.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={settings.enableAdminExpiryAlerts}
                  onChange={(e) => setSettings({ ...settings, enableAdminExpiryAlerts: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* GST Filing Deadlines */}
            <div className="flex items-start justify-between p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="pr-3">
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">GST Compliance Deadlines</span>
                <span className="text-[11px] text-slate-500">Monthly deadline reminders for GSTR-1 (11th) and GSTR-3B (20th).</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={settings.enableAdminGstAlerts}
                  onChange={(e) => setSettings({ ...settings, enableAdminGstAlerts: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Vendor Bills Due */}
            <div className="flex items-start justify-between p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="pr-3">
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">Supplier Bill Due Notices</span>
                <span className="text-[11px] text-slate-500">Remind supplier payment due dates to preserve credit and cash discounts.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={settings.enableAutoVendorReminders}
                  onChange={(e) => setSettings({ ...settings, enableAutoVendorReminders: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

          </div>
        </div>

        {/* 5. Recent Dispatched Reminders Log */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Reminders Log</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">History of dispatched notifications to parties.</p>
            </div>
            <span className="text-xs text-slate-400">
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
                {reminderLogs.slice(0, 5).map(log => (
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
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}

