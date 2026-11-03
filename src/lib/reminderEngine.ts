import { 
  AutoRemindersSettings, 
  ComputedPartyReminder, 
  ComputedAdminAlert, 
  PartyReminderType, 
  ReminderMessageTemplates 
} from "@/types/reminders"
import { SalesDocument, Party, Item, PurchaseDocument, BusinessProfile } from "@/types/inventory"

// Default clean, non-AI-slop business templates matching Zoho & Khatabook standards
export const DEFAULT_REMINDER_TEMPLATES: ReminderMessageTemplates = {
  upcoming_due: "Dear {party_name}, this is a gentle reminder that invoice {invoice_no} of {amount_due} is due on {due_date}. You can pay via UPI to {upi_id}. Thank you, {company_name}.",
  due_today: "Dear {party_name}, invoice {invoice_no} for {amount_due} is due today ({due_date}). Please clear the balance via UPI: {upi_id} or bank transfer. Regards, {company_name}.",
  overdue_level_1: "Dear {party_name}, invoice {invoice_no} of {amount_due} was due on {due_date} and is now {days_overdue} days overdue. Kindly process the payment at your earliest convenience via UPI: {upi_id}. Thank you, {company_name}.",
  overdue_level_2: "Dear {party_name}, this is a firm reminder regarding overdue invoice {invoice_no} for {amount_due}, due since {due_date} ({days_overdue} days ago). Please settle the pending amount today to maintain uninterrupted credit terms. UPI: {upi_id}. {company_name}.",
  overdue_level_3: "FINAL NOTICE: Invoice {invoice_no} for {amount_due} is critically overdue by {days_overdue} days. Immediate settlement is required via UPI {upi_id} or bank transfer to avoid account suspension. Contact {company_phone}. {company_name}.",
  quotation_expiring: "Dear {party_name}, quotation {invoice_no} for {amount_due} is expiring in 3 days. Please confirm your order to reserve pricing and stock allocations. Regards, {company_name}.",
  payment_received: "Dear {party_name}, we have received your payment of {amount_received} for invoice {invoice_no}. Remaining balance due: {balance_due}. Thank you for your business! {company_name}."
}

export const DEFAULT_AUTO_REMINDER_SETTINGS: AutoRemindersSettings = {
  enableAutoCustomerReminders: true,
  enableAutoVendorReminders: true,
  defaultSchedulePreset: "standard",
  defaultChannel: "whatsapp",
  beforeDueDays: 3,
  overdueLevel1Days: 3,
  overdueLevel2Days: 10,
  overdueLevel3Days: 30,
  enableAdminLowStockAlerts: true,
  enableAdminExpiryAlerts: true,
  expiryAlertDaysThreshold: 60,
  enableAdminGstAlerts: true,
  enableAdminEwayBillAlerts: true,
  enableAdminDailyDigest: true,
  templates: DEFAULT_REMINDER_TEMPLATES
}

/**
 * Calculates date difference in days (Target Date - Reference Date)
 * Negative = future date (days remaining)
 * 0 = today
 * Positive = past date (days overdue)
 */
export function calculateDaysDifference(targetDateStr: string, referenceDate?: Date): number {
  if (!targetDateStr) return 0
  const target = new Date(targetDateStr)
  if (isNaN(target.getTime())) return 0
  
  // Strip time for pure day difference; use stable date during SSR prerender
  const activeRef = referenceDate || (typeof window !== "undefined" ? new Date() : new Date("2026-11-01T00:00:00.000Z"))
  const ref = new Date(activeRef.getFullYear(), activeRef.getMonth(), activeRef.getDate())
  const tgt = new Date(target.getFullYear(), target.getMonth(), target.getDate())
  
  const diffTime = ref.getTime() - tgt.getTime()
  return Math.round(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Fills message template placeholders with authentic transaction values
 */
export function formatReminderText(
  template: string,
  context: {
    party_name: string
    invoice_no: string
    due_date: string
    amount_due: string
    days_overdue?: string | number
    amount_received?: string
    balance_due?: string
    upi_id?: string
    company_name?: string
    company_phone?: string
  }
): string {
  let result = template
  Object.entries(context).forEach(([key, val]) => {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), String(val || ""))
  })
  return result
}

/**
 * Generates an official WhatsApp Web direct link with URL-encoded text
 */
export function buildWhatsAppLink(phone: string, message: string): string {
  const cleanPhone = (phone || "").replace(/\D/g, "")
  const internationalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone
  return `https://wa.me/${internationalPhone}?text=${encodeURIComponent(message)}`
}

/**
 * Evaluates all unpaid / partial sales invoices and returns actionable Party Reminders
 */
export function computePartyReminders(
  invoices: SalesDocument[],
  parties: Party[],
  business: BusinessProfile,
  settings: AutoRemindersSettings = DEFAULT_AUTO_REMINDER_SETTINGS
): ComputedPartyReminder[] {
  if (!settings.enableAutoCustomerReminders) return []

  const reminders: ComputedPartyReminder[] = []

  invoices.forEach(inv => {
    if (inv.type !== "invoice") return

    // Calculate balance
    const balance = inv.balanceAmount !== undefined 
      ? inv.balanceAmount 
      : (inv.status === "paid" ? 0 : Math.max(0, inv.grandTotal - (inv.paidAmount || 0)))

    if (balance <= 0 || inv.status === "paid" || inv.status === "cancelled") return

    const party = parties.find(p => p.id === inv.partyId || (p.name && inv.partyName && p.name.trim().toLowerCase() === inv.partyName.trim().toLowerCase()))
    const partyPhone = party?.phone || party?.mobile || ""
    const partyEmail = party?.email || ""

    const daysDiff = calculateDaysDifference(inv.dueDate || inv.date)
    const currSym = inv.currencySymbol || "₹"
    const amountStr = `${currSym}${balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`

    let type: PartyReminderType | null = null
    let urgency: "normal" | "medium" | "high" | "critical" = "normal"
    let templateKey: keyof ReminderMessageTemplates = "upcoming_due"

    // Upcoming Due (e.g. 1 to 3 days before due date)
    if (daysDiff < 0 && Math.abs(daysDiff) <= settings.beforeDueDays) {
      type = "upcoming_due"
      urgency = "normal"
      templateKey = "upcoming_due"
    } 
    // Due Today
    else if (daysDiff === 0) {
      type = "due_today"
      urgency = "medium"
      templateKey = "due_today"
    } 
    // Overdue Level 1 (Gentle)
    else if (daysDiff > 0 && daysDiff <= settings.overdueLevel2Days) {
      type = "overdue_level_1"
      urgency = "medium"
      templateKey = "overdue_level_1"
    } 
    // Overdue Level 2 (Firm)
    else if (daysDiff > settings.overdueLevel2Days && daysDiff <= settings.overdueLevel3Days) {
      type = "overdue_level_2"
      urgency = "high"
      templateKey = "overdue_level_2"
    } 
    // Overdue Level 3 (Final Notice)
    else if (daysDiff > settings.overdueLevel3Days) {
      type = "overdue_level_3"
      urgency = "critical"
      templateKey = "overdue_level_3"
    }

    if (type) {
      const template = settings.templates[templateKey] || DEFAULT_REMINDER_TEMPLATES[templateKey]
      const message = formatReminderText(template, {
        party_name: inv.partyName,
        invoice_no: inv.docNo,
        due_date: inv.dueDate || inv.date,
        amount_due: amountStr,
        days_overdue: Math.max(0, daysDiff),
        upi_id: business.upiId || "apexglobal@okaxis",
        company_name: business.tradeName || business.name,
        company_phone: business.phone
      })

      reminders.push({
        id: `party-rem-${inv.id}-${type}`,
        invoiceId: inv.id,
        invoiceNo: inv.docNo,
        partyId: inv.partyId,
        partyName: inv.partyName,
        partyPhone,
        partyEmail,
        amountDue: balance,
        totalAmount: inv.grandTotal,
        dueDate: inv.dueDate || inv.date,
        daysDiff,
        type,
        urgency,
        suggestedChannel: settings.defaultChannel || "whatsapp",
        generatedMessage: message,
        whatsAppUrl: buildWhatsAppLink(partyPhone, message)
      })
    }
  })

  // Sort by urgency and then by days overdue (most critical first)
  return reminders.sort((a, b) => b.daysDiff - a.daysDiff)
}

/**
 * Computes internal operational and compliance alerts for the business owner/admin
 */
export function computeAdminAlerts(
  items: Item[],
  purchaseBills: PurchaseDocument[] = [],
  salesWithEway: SalesDocument[] = [],
  settings: AutoRemindersSettings = DEFAULT_AUTO_REMINDER_SETTINGS
): ComputedAdminAlert[] {
  const alerts: ComputedAdminAlert[] = []
  const today = new Date()

  // 1. Low Stock & Reorder Alerts
  if (settings.enableAdminLowStockAlerts) {
    items.forEach(item => {
      const minLevel = item.minStock || 0
      const current = item.currentStock || 0
      if (minLevel > 0 && current <= minLevel) {
        alerts.push({
          id: `admin-low-stock-${item.id}`,
          type: "low_stock",
          title: `Low Stock: ${item.name}`,
          description: `Current stock (${current} ${item.unit || "PCS"}) is at or below minimum level (${minLevel}).`,
          urgency: current === 0 ? "danger" : "warning",
          timestamp: "Just now",
          actionLabel: "Create PO",
          actionType: "reorder",
          relatedId: item.id
        })
      }
    })
  }

  // 2. Near Expiry Batch Alerts
  if (settings.enableAdminExpiryAlerts) {
    items.forEach(item => {
      if (item.batchDetails && item.batchDetails.length > 0) {
        item.batchDetails.forEach(batch => {
          if (batch.expiryDate && (batch.quantity || 0) > 0) {
            const daysToExpiry = -calculateDaysDifference(batch.expiryDate, today)
            if (daysToExpiry <= settings.expiryAlertDaysThreshold) {
              const isExpired = daysToExpiry <= 0
              alerts.push({
                id: `admin-expiry-${item.id}-${batch.batchNo}`,
                type: "near_expiry",
                title: isExpired ? `Expired Batch: ${item.name}` : `Near Expiry: ${item.name}`,
                description: `Batch #${batch.batchNo} (${batch.quantity} ${item.unit || "PCS"}) ${isExpired ? "expired on" : "expires in"} ${batch.expiryDate} (${daysToExpiry > 0 ? `${daysToExpiry} days left` : "Expired"}).`,
                urgency: isExpired ? "danger" : "warning",
                timestamp: "Active",
                actionLabel: "View Item",
                actionType: "view_batch",
                relatedId: item.id
              })
            }
          }
        })
      }
    })
  }

  // 3. GST Statutory Deadlines (GSTR-1 & GSTR-3B)
  if (settings.enableAdminGstAlerts) {
    const currentDay = today.getDate()
    
    // GSTR-1 Deadline: 11th of current month
    if (currentDay >= 6 && currentDay <= 11) {
      const daysLeft = 11 - currentDay
      alerts.push({
        id: `admin-gst-gstr1-${today.getMonth()}`,
        type: "gst_gstr1_deadline",
        title: "GST Compliance: GSTR-1 Filing Due",
        description: daysLeft === 0 
          ? "Today (11th) is the last day to file GSTR-1 return for outward supplies." 
          : `GSTR-1 return filing deadline is in ${daysLeft} days (11th ${today.toLocaleString('default', { month: 'short' })}).`,
        urgency: daysLeft <= 1 ? "danger" : "warning",
        timestamp: "Statutory",
        actionLabel: "Open GST Module",
        actionType: "file_gst"
      })
    }

    // GSTR-3B Deadline: 20th of current month
    if (currentDay >= 15 && currentDay <= 20) {
      const daysLeft = 20 - currentDay
      alerts.push({
        id: `admin-gst-gstr3b-${today.getMonth()}`,
        type: "gst_gstr3b_deadline",
        title: "GST Compliance: GSTR-3B Filing Due",
        description: daysLeft === 0 
          ? "Today (20th) is the deadline for GSTR-3B tax payment and return." 
          : `GSTR-3B return & tax payment deadline is in ${daysLeft} days (20th ${today.toLocaleString('default', { month: 'short' })}).`,
        urgency: daysLeft <= 1 ? "danger" : "warning",
        timestamp: "Statutory",
        actionLabel: "Open GST Module",
        actionType: "file_gst"
      })
    }
  }

  // 4. E-Way Bills
  if (settings.enableAdminEwayBillAlerts && salesWithEway.length > 0) {
    salesWithEway.forEach(doc => {
      if (doc.ewayBillNo) {
        alerts.push({
          id: `admin-ewb-${doc.id}`,
          type: "eway_bill_expiring",
          title: `E-Way Bill Active: #${doc.ewayBillNo}`,
          description: `E-Way bill for ${doc.partyName} (Invoice #${doc.docNo}) is active.`,
          urgency: "info",
          timestamp: "Active",
          actionLabel: "View Invoice",
          actionType: "extend_eway",
          relatedId: doc.id
        })
      }
    })
  }

  // 5. Vendor Bills Due Today / Overdue
  if (settings.enableAutoVendorReminders && purchaseBills.length > 0) {
    purchaseBills.forEach(bill => {
      const balance = Math.max(0, bill.grandTotal - (bill.paidAmount || 0))
      if (balance > 0 && bill.dueDate && bill.status !== "cancelled") {
        const daysDiff = calculateDaysDifference(bill.dueDate, today)
        if (daysDiff >= 0) {
          alerts.push({
            id: `admin-vendor-bill-${bill.id}`,
            type: "vendor_bills_due",
            title: `Vendor Payment Due: ${bill.partyName}`,
            description: `Bill #${bill.docNo} for ₹${balance.toLocaleString('en-IN')} is ${daysDiff === 0 ? "due today" : `${daysDiff} days overdue`}.`,
            urgency: daysDiff > 7 ? "danger" : "warning",
            timestamp: bill.dueDate,
            actionLabel: "Pay Bill",
            actionType: "reorder",
            relatedId: bill.id
          })
        }
      }
    })
  }

  return alerts
}
