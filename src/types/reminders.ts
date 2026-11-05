// ==========================================
// AUTO REMINDERS & NOTIFICATIONS TYPES
// ==========================================

export type ReminderChannel = "whatsapp" | "email" | "both" | "sms"

export type PartyReminderType =
  | "upcoming_due"    // 2-3 days before due date
  | "due_today"       // On invoice due date
  | "overdue_level_1" // 3-5 days overdue (gentle)
  | "overdue_level_2" // 10-15 days overdue (firm)
  | "overdue_level_3" // 30+ days overdue (final)
  | "quotation_expiring"
  | "challan_dispatched"
  | "payment_received"
  | "vendor_bill_due"

export type AdminAlertType =
  | "low_stock"
  | "near_expiry"
  | "daily_overdue_digest"
  | "gst_gstr1_deadline"
  | "gst_gstr3b_deadline"
  | "eway_bill_expiring"
  | "pending_einvoice"
  | "vendor_bills_due"
  | "job_work_overdue"

export type ReminderSchedulePreset = "standard" | "aggressive" | "gentle" | "custom"

export interface InvoiceReminderConfig {
  enabled: boolean
  preset: ReminderSchedulePreset
  customDaysBeforeDue?: number // e.g. 3
  customOverdueIntervals?: number[] // e.g. [7, 15, 30]
  preferredChannel: ReminderChannel
  targetPhone?: string
  targetEmail?: string
  isPaused?: boolean
  lastSentAt?: string
  lastSentType?: PartyReminderType
  nextScheduledAt?: string
  nextScheduledType?: PartyReminderType
}

export interface ReminderLogEntry {
  id: string
  invoiceId?: string
  invoiceNo?: string
  partyId?: string
  partyName: string
  type: PartyReminderType | AdminAlertType
  channel: ReminderChannel
  sentAt: string
  status: "sent" | "delivered" | "failed" | "pending"
  messagePreview: string
  recipientPhoneOrEmail: string
  amountDue?: number
  triggeredBy: "auto" | "manual"
}

export interface ReminderMessageTemplates {
  upcoming_due: string
  due_today: string
  overdue_level_1: string
  overdue_level_2: string
  overdue_level_3: string
  quotation_expiring: string
  payment_received: string
}

export interface AutoRemindersSettings {
  enableAutoCustomerReminders: boolean
  enableAutoVendorReminders: boolean
  defaultSchedulePreset: ReminderSchedulePreset
  defaultChannel: ReminderChannel
  beforeDueDays: number // default: 3
  reminderStartTiming?: "before" | "after"
  reminderStartTarget?: "due_date" | "invoice_date"
  overdueLevel1Days: number // default: 3
  overdueLevel2Days: number // default: 10
  overdueLevel3Days: number // default: 30
  
  // Admin alert thresholds
  enableAdminLowStockAlerts: boolean
  enableAdminExpiryAlerts: boolean
  expiryAlertDaysThreshold: number // e.g. 60 days
  enableAdminGstAlerts: boolean
  enableAdminEwayBillAlerts: boolean
  enableAdminDailyDigest: boolean

  // Admin daily digest delivery settings
  adminDigestWhatsApp?: boolean
  adminDigestEmail?: boolean
  adminWhatsAppNumber?: string
  adminEmailAddress?: string
  adminDigestTime?: string
  includeLowStockInDigest?: boolean
  includeDueBillsInDigest?: boolean
  includeSalesSummaryInDigest?: boolean

  // Templates
  templates: ReminderMessageTemplates
}

export interface ComputedPartyReminder {
  id: string
  invoiceId: string
  invoiceNo: string
  partyId: string
  partyName: string
  partyPhone: string
  partyEmail?: string
  amountDue: number
  totalAmount: number
  dueDate: string
  daysDiff: number // negative = days remaining, 0 = due today, positive = days overdue
  type: PartyReminderType
  urgency: "normal" | "medium" | "high" | "critical"
  suggestedChannel: ReminderChannel
  generatedMessage: string
  whatsAppUrl: string
}

export interface ComputedAdminAlert {
  id: string
  type: AdminAlertType
  title: string
  description: string
  urgency: "info" | "warning" | "danger"
  timestamp: string
  actionLabel?: string
  actionUrl?: string
  actionType?: "reorder" | "view_batch" | "file_gst" | "extend_eway" | "send_reminder"
  relatedId?: string
}

