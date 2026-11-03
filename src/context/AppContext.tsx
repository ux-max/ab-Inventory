"use client"

import React, { createContext, useContext, useState, useEffect, useMemo } from "react"
import {
  UserRole,
  RoleConfig,
  BusinessProfile,
  Item,
  ItemBatch,
  Party,
  SalesDocument,
  InvoiceItem,
  PurchaseDocument,
  StockMovement,
  StockAudit,
  Godown,
  JobWork,
  JobWorkStatus,
  PaymentRecord,
  SalesOrder,
  DeliveryChallan,
  Quotation,
  ProformaInvoice,
  SalesReturn,
  CreditNote,
  PurchaseReturn,
  DebitNote,
  CreditNoteStatus,
  DebitNoteStatus,
  SalesReturnStatus,
  PurchaseReturnStatus,
  BankAccount,
  GstSettings,
  TaxRateItem,
  TaxGroupItem,
  WithholdingRateItem,
  CustomItemField,
  ItemFieldToggles,
  PrintSettings,
  DocumentSettings,
  DEFAULT_DOCUMENT_SETTINGS,
  DocumentPrefixSuffixSettings,
  DEFAULT_PREFIX_SUFFIX_SETTINGS,
  DocumentSequenceType,
  PrefixSuffixEntry,
  CurrencyItem,
  StandardTerms,
  TermsTemplate,
  ApplicableDocumentType,
  FormCustomFieldDocType,
  FormCustomFieldsMap,
  DEFAULT_DOCUMENT_CUSTOM_FIELDS,
  FormNotesTermsConfig,
  FormNotesTermsMap,
  DEFAULT_FORM_NOTES_TERMS,
  FormNotePreset,
  FormTermsPreset,
  FormPrintSettings,
  FormPrintSettingsMap,
  DEFAULT_FORM_PRINT_SETTINGS_BASE,
  DEFAULT_FORM_PRINT_SETTINGS_MAP,
  CustomItemColumn,
  FormCustomColumnsMap,
  DEFAULT_FORM_CUSTOM_COLUMNS_MAP,
  TeamUser,
  GspPortalConnection
} from "@/types/inventory"
import {
  AutoRemindersSettings,
  ReminderLogEntry,
  ComputedPartyReminder,
  ComputedAdminAlert,
  InvoiceReminderConfig
} from "@/types/reminders"
import {
  DEFAULT_AUTO_REMINDER_SETTINGS,
  computePartyReminders,
  computeAdminAlerts
} from "@/lib/reminderEngine"
import { INITIAL_TAX_RATES, INITIAL_TAX_GROUPS, INITIAL_TDS_RATES, INITIAL_TCS_RATES, isInterStateTransaction } from "@/lib/gstConstants"
import {
  ROLE_CONFIGS,
  INITIAL_BUSINESS,
  INITIAL_ITEMS,
  INITIAL_PARTIES,
  INITIAL_SALES_DOCUMENTS,
  INITIAL_SALES_ORDERS,
  INITIAL_DELIVERY_CHALLANS,
  INITIAL_PURCHASE_DOCUMENTS,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_STOCK_AUDITS,
  INITIAL_GODOWNS,
  INITIAL_JOB_WORKS,
  INITIAL_PAYMENTS,
  INITIAL_QUOTATIONS,
  INITIAL_PROFORMA_INVOICES,
  INITIAL_SALES_RETURNS,
  INITIAL_CREDIT_NOTES,
  INITIAL_PURCHASE_RETURNS,
  INITIAL_DEBIT_NOTES,
  INITIAL_BANK_ACCOUNTS,
  INITIAL_CUSTOM_ITEM_FIELDS,
  INITIAL_ITEM_FIELD_TOGGLES,
  INITIAL_PRINT_SETTINGS,
  INITIAL_CURRENCIES,
  INITIAL_STANDARD_TERMS,
  INITIAL_TERMS_TEMPLATES,
  INITIAL_TEAM_USERS
} from "@/data/mockData"

export const DEFAULT_CATEGORIES = [
  "General",
  "Pharmaceuticals",
  "Packaging",
  "Chemicals",
  "Consumables",
  "Finished Assembly",
  "Electronics",
  "FMCG & Groceries",
  "Raw Materials",
  "Manufactured Goods",
]

export const DEFAULT_UNITS = [
  "box",
  "pcs",
  "kg",
  "metre",
  "litre",
  "tin",
  "btl",
  "strip",
  "gm",
  "pack",
  "roll",
  "dozen",
  "sqm",
  "bundle",
  "can",
  "bag",
  "set",
]

interface AppContextType {
  // Auth state
  isAuthenticated: boolean
  login: (phone?: string, otp?: string) => boolean
  logout: () => void
  userPhone: string

  // Role & Permissions
  currentRole: UserRole
  roleConfig: RoleConfig
  roles: Record<string, RoleConfig>
  setCurrentRole: (role: UserRole) => void
  addCustomRole: (role: Omit<RoleConfig, "id">) => { success: boolean; id?: string; message?: string }
  updateRole: (id: string, updates: Partial<RoleConfig>) => { success: boolean; message?: string }
  deleteCustomRole: (id: string) => { success: boolean; message: string }
  resetRoleToDefault: (id: string) => void
  canViewCostAndProfit: boolean
  isModuleAllowed: (module: string) => boolean

  // Users & Team Management
  teamUsers: TeamUser[]
  inviteUser: (user: Omit<TeamUser, "id" | "createdAt">) => { success: boolean; message: string; id?: string }
  updateTeamUser: (id: string, updates: Partial<TeamUser>) => { success: boolean; message: string }
  deleteTeamUser: (id: string) => { success: boolean; message: string }
  toggleUserStatus: (id: string) => void
  loginAsUser: (userId: string) => { success: boolean; message: string }

  // Banking
  bankAccounts: BankAccount[]
  addBankAccount: (account: Omit<BankAccount, "id" | "createdAt">) => { success: boolean; message: string; id?: string }
  updateBankAccount: (id: string, updates: Partial<BankAccount>) => { success: boolean; message: string }
  deleteBankAccount: (id: string) => { success: boolean; message: string }
  setDefaultBankAccount: (id: string) => { success: boolean; message: string }

  // Business & Godowns
  business: BusinessProfile
  updateBusiness: (updates: Partial<BusinessProfile>) => void
  godowns: Godown[]
  addGodown: (godown: Omit<Godown, "id">) => { success: boolean; message: string; id?: string }
  updateGodown: (id: string, updates: Partial<Godown>) => { success: boolean; message: string }
  deleteGodown: (id: string) => { success: boolean; message: string }
  activeGodownId: string
  setActiveGodownId: (id: string) => void

  // GST & Taxes Settings
  gstSettings: GstSettings
  updateGstSettings: (updates: Partial<GstSettings>) => void
  gspConnection: GspPortalConnection
  connectGspPortal: (credentials: { provider: GspPortalConnection["provider"]; apiUsername: string; password?: string; environment?: "production" | "sandbox" }) => Promise<{ success: boolean; message: string }>
  disconnectGspPortal: () => void
  generateEwayBillForInvoice: (docNo: string, details: { vehicleNo: string; distanceKm: number; transporterId?: string }) => { success: boolean; message: string; ewayBillNo: string }
  generateEInvoiceForInvoice: (docNo: string) => { success: boolean; message: string; irn: string; qrCode: string; ackNo: string }
  taxRates: TaxRateItem[]
  taxGroups: TaxGroupItem[]
  addTaxRate: (rate: Omit<TaxRateItem, "id">) => void
  updateTaxRate: (id: string, updates: Partial<TaxRateItem>) => void
  deleteTaxRate: (id: string) => void
  addTaxGroup: (group: Omit<TaxGroupItem, "id">) => void
  updateTaxGroup: (id: string, updates: Partial<TaxGroupItem>) => void
  deleteTaxGroup: (id: string) => void
  tdsRates: WithholdingRateItem[]
  addTdsRate: (rate: Omit<WithholdingRateItem, "id">) => void
  updateTdsRate: (id: string, updates: Partial<WithholdingRateItem>) => void
  deleteTdsRate: (id: string) => void
  tcsRates: WithholdingRateItem[]
  addTcsRate: (rate: Omit<WithholdingRateItem, "id">) => void
  updateTcsRate: (id: string, updates: Partial<WithholdingRateItem>) => void
  deleteTcsRate: (id: string) => void

  // Entities
  items: Item[]
  categories: string[]
  units: string[]
  addCategory: (category: string) => { success: boolean; message: string; category?: string }
  addUnit: (unit: string) => { success: boolean; message: string; unit?: string }
  parties: Party[]
  salesDocs: SalesDocument[]
  salesOrders: SalesOrder[]
  deliveryChallans: DeliveryChallan[]
  quotations: Quotation[]
  proformaInvoices: ProformaInvoice[]
  salesReturns: SalesReturn[]
  creditNotes: CreditNote[]
  purchaseReturns: PurchaseReturn[]
  debitNotes: DebitNote[]
  purchaseDocs: PurchaseDocument[]
  stockMovements: StockMovement[]
  stockAudits: StockAudit[]
  jobWorks: JobWork[]
  payments: PaymentRecord[]

  // Inventory & Transaction Operations (Authoritative V2.2 Rules)
  createSalesInvoice: (invoice: Omit<SalesDocument, "id" | "docNo" | "date" | "createdBy">) => { success: boolean; message: string; docNo?: string }
  createSalesOrder: (order: Omit<SalesOrder, "id" | "orderNo">) => { success: boolean; message: string; orderNo?: string }
  createDeliveryChallan: (challan: Omit<DeliveryChallan, "id" | "challanNo">) => { success: boolean; message: string; challanNo?: string }
  convertOrderToChallan: (orderId: string, challanData?: Partial<DeliveryChallan>) => { success: boolean; message: string; challanNo?: string }
  convertChallanToInvoice: (challanId: string) => { success: boolean; message: string; docNo?: string }
  convertOrderToInvoice: (orderId: string) => { success: boolean; message: string; docNo?: string }
  createStockTransfer: (fromGodownId: string, toGodownId: string, itemId: string, qty: number, reason: string) => { success: boolean; message: string }
  createStockAdjustment: (godownId: string, itemId: string, qtyDiff: number, reason: string, batchNo?: string) => { success: boolean; message: string }
  createStockAudit: (godownId: string, category: string, itemsList: { itemId: string; countedQty: number }[]) => { success: boolean; message: string; audit?: StockAudit }
  approveStockAudit: (auditId: string) => { success: boolean; message: string }
  recordManufacture: (finishedItemId: string, qty: number, godownId: string, metadata?: { actor?: string; refDocNo?: string; reason?: string }) => { success: boolean; message: string }
  createJobWork: (jobWorkData: {
    workerName: string
    finishedItemId: string
    expectedQty: number
    godownId: string
    jobWorkCharges: number
    date: string
    vehicleNo?: string
    transporter?: string
    expectedReturnDate?: string
    notes?: string
    termsAndConditions?: string
    partyGstin?: string
    partyAddress?: string
    customLines?: Array<{ itemId: string; qty: number; rate?: number; unit?: string }>
  }) => { success: boolean; message: string; jobNo?: string }
  receiveJobWork: (jobWorkId: string, receivedQty?: number, godownId?: string) => { success: boolean; message: string }
  updateJobWorkStatus: (id: string, status: JobWorkStatus) => { success: boolean; message: string }
  addItem: (item: Omit<Item, "id" | "currentStock">) => { success: boolean; message: string; item?: Item }
  updateItem: (id: string, updates: Partial<Item>) => { success: boolean; message: string; item?: Item }
  addBatchToItem: (itemId: string, batch: ItemBatch) => { success: boolean; message: string }
  addBulkItems: (items: Array<Omit<Item, "id" | "currentStock">>) => { success: boolean; message: string; addedCount: number; skippedCount: number }
  addParty: (party: Omit<Party, "id">) => { success: boolean; message: string }
  updateParty: (id: string, updates: Partial<Party>) => { success: boolean; message: string }
  recordPayment: (payment: Omit<PaymentRecord, "id" | "paymentNo" | "createdBy">) => { success: boolean; message: string; paymentNo?: string }
  deleteSalesOrder: (id: string) => { success: boolean; message: string }
  deleteSalesInvoice: (id: string) => { success: boolean; message: string }
  deleteDeliveryChallan: (id: string) => { success: boolean; message: string }
  createPurchaseBill: (bill: Omit<PurchaseDocument, "id" | "docNo" | "date" | "createdBy"> & { docNo?: string; date?: string }) => { success: boolean; message: string; docNo?: string; id?: string }
  updatePurchaseBill: (id: string, updates: Partial<PurchaseDocument>) => { success: boolean; message: string }
  deletePurchaseBill: (id: string) => { success: boolean; message: string }
  deletePayment: (id: string) => { success: boolean; message: string }
  deleteItem: (id: string) => { success: boolean; message: string }
  deleteParty: (id: string) => { success: boolean; message: string }
  createQuotation: (quotation: Omit<Quotation, "id" | "quotationNo">) => { success: boolean; message: string; quotationNo?: string }
  createProformaInvoice: (proforma: Omit<ProformaInvoice, "id" | "proformaNo">) => { success: boolean; message: string; proformaNo?: string }
  convertQuotationToOrder: (quotationId: string) => { success: boolean; message: string; orderNo?: string }
  convertQuotationToInvoice: (quotationId: string) => { success: boolean; message: string; docNo?: string }
  convertProformaToInvoice: (proformaId: string) => { success: boolean; message: string; docNo?: string }
  deleteQuotation: (id: string) => { success: boolean; message: string }
  deleteProformaInvoice: (id: string) => { success: boolean; message: string }
  createSalesReturn: (sr: Omit<SalesReturn, "id" | "returnNo">) => { success: boolean; message: string; returnNo?: string }
  deleteSalesReturn: (id: string) => { success: boolean; message: string }
  createCreditNote: (cn: Omit<CreditNote, "id" | "creditNoteNo">) => { success: boolean; message: string; creditNoteNo?: string }
  deleteCreditNote: (id: string) => { success: boolean; message: string }
  createPurchaseReturn: (pr: Omit<PurchaseReturn, "id" | "returnNo">) => { success: boolean; message: string; returnNo?: string }
  deletePurchaseReturn: (id: string) => { success: boolean; message: string }
  createDebitNote: (dn: Omit<DebitNote, "id" | "debitNoteNo">) => { success: boolean; message: string; debitNoteNo?: string }
  deleteDebitNote: (id: string) => { success: boolean; message: string }

  // Note & Return Lifecycle Operations
  applyCreditNoteToInvoice: (creditNoteId: string, invoiceId: string, amount: number) => { success: boolean; message: string }
  refundCreditNote: (creditNoteId: string, paymentMode: "cash" | "bank" | "upi", refundNotes?: string) => { success: boolean; message: string }
  updateCreditNoteStatus: (creditNoteId: string, status: CreditNoteStatus) => { success: boolean; message: string }
  reopenCreditNote: (creditNoteId: string) => { success: boolean; message: string }

  applyDebitNoteToBill: (debitNoteId: string, billId: string, amount: number) => { success: boolean; message: string }
  refundDebitNote: (debitNoteId: string, paymentMode: "cash" | "bank" | "upi", refundNotes?: string) => { success: boolean; message: string }
  updateDebitNoteStatus: (debitNoteId: string, status: DebitNoteStatus) => { success: boolean; message: string }
  reopenDebitNote: (debitNoteId: string) => { success: boolean; message: string }

  updateSalesReturnStatus: (id: string, status: SalesReturnStatus) => { success: boolean; message: string }
  updatePurchaseReturnStatus: (id: string, status: PurchaseReturnStatus) => { success: boolean; message: string }

  // Global Dialogs & Search
  isGlobalSearchOpen: boolean
  setIsGlobalSearchOpen: (open: boolean) => void
  isQuickCreateOpen: boolean
  setIsQuickCreateOpen: (open: boolean) => void

  // Settings & Customization
  customItemFields: CustomItemField[]
  addCustomItemField: (field: Omit<CustomItemField, "id">) => { success: boolean; message: string }
  updateCustomItemField: (id: string, updates: Partial<CustomItemField>) => { success: boolean; message: string }
  deleteCustomItemField: (id: string) => { success: boolean; message: string }

  itemFieldToggles: ItemFieldToggles
  updateItemFieldToggles: (updates: Partial<ItemFieldToggles>) => void

  printSettings: PrintSettings
  updatePrintSettings: (updates: Partial<PrintSettings>) => void

  documentSettings: DocumentSettings
  updateDocumentSettings: (updates: Partial<DocumentSettings>) => void

  prefixSuffixSettings: DocumentPrefixSuffixSettings
  updatePrefixSuffixSettings: (newSettings: DocumentPrefixSuffixSettings) => void
  setDefaultPrefixSuffix: (docType: DocumentSequenceType, kind: "prefix" | "suffix", id: string) => void
  addPrefixSuffixEntry: (docType: DocumentSequenceType, kind: "prefix" | "suffix", value: string, isDefault?: boolean) => void
  editPrefixSuffixEntry: (docType: DocumentSequenceType, kind: "prefix" | "suffix", id: string, value: string) => void
  deletePrefixSuffixEntry: (docType: DocumentSequenceType, kind: "prefix" | "suffix", id: string) => void

  currencies: CurrencyItem[]
  addCurrency: (currency: Omit<CurrencyItem, "id">) => { success: boolean; message: string }
  updateCurrency: (id: string, updates: Partial<CurrencyItem>) => { success: boolean; message: string }
  deleteCurrency: (id: string) => { success: boolean; message: string }

  standardTerms: StandardTerms
  updateStandardTerms: (updates: Partial<StandardTerms>) => void

  termsTemplates: TermsTemplate[]
  addTermsTemplate: (template: Omit<TermsTemplate, "id">) => { success: boolean; message: string; id?: string }
  updateTermsTemplate: (id: string, updates: Partial<TermsTemplate>) => { success: boolean; message: string }
  deleteTermsTemplate: (id: string) => { success: boolean; message: string }
  setDefaultTermsTemplate: (id: string, docType: ApplicableDocumentType) => { success: boolean; message: string }

  // Form-wise Custom Fields (Max 6) & Form-wise Notes/Terms
  documentCustomFields: FormCustomFieldsMap
  addFormCustomField: (docType: FormCustomFieldDocType, field: Omit<CustomItemField, "id">) => { success: boolean; message: string }
  updateFormCustomField: (docType: FormCustomFieldDocType, fieldId: string, updates: Partial<CustomItemField>) => { success: boolean; message: string }
  deleteFormCustomField: (docType: FormCustomFieldDocType, fieldId: string) => { success: boolean; message: string }

  formNotesTerms: FormNotesTermsMap
  updateFormNotesTerms: (docType: DocumentSequenceType, updates: Partial<FormNotesTermsConfig>) => void
  resetFormNotesTerms: (docType: DocumentSequenceType) => void
  addFormNotePreset: (docType: DocumentSequenceType, preset: Omit<FormNotePreset, "id">) => { success: boolean; message: string }
  updateFormNotePreset: (docType: DocumentSequenceType, presetId: string, updates: Partial<FormNotePreset>) => { success: boolean; message: string }
  deleteFormNotePreset: (docType: DocumentSequenceType, presetId: string) => { success: boolean; message: string }
  addFormTermsPreset: (docType: DocumentSequenceType, preset: Omit<FormTermsPreset, "id">) => { success: boolean; message: string }
  updateFormTermsPreset: (docType: DocumentSequenceType, presetId: string, updates: Partial<FormTermsPreset>) => { success: boolean; message: string }
  deleteFormTermsPreset: (docType: DocumentSequenceType, presetId: string) => { success: boolean; message: string }

  formPrintSettings: FormPrintSettingsMap
  updateFormPrintSettings: (docType: DocumentSequenceType, updates: Partial<FormPrintSettings>) => void
  resetFormPrintSettings: (docType: DocumentSequenceType) => void

  // Form-wise Custom Product/Item Table Columns (Max 3 per form)
  formCustomColumns: FormCustomColumnsMap
  addCustomColumn: (docType: DocumentSequenceType, name: string, printOnPaper?: boolean) => { success: boolean; message: string; column?: CustomItemColumn }
  updateCustomColumn: (docType: DocumentSequenceType, columnId: string, updates: Partial<CustomItemColumn>) => { success: boolean; message: string }
  deleteCustomColumn: (docType: DocumentSequenceType, columnId: string) => { success: boolean; message: string }

  // Auto Reminders & Notifications
  autoReminderSettings: AutoRemindersSettings
  updateAutoReminderSettings: (updates: Partial<AutoRemindersSettings>) => void
  reminderLogs: ReminderLogEntry[]
  addReminderLog: (log: Omit<ReminderLogEntry, "id" | "sentAt">) => void
  partyReminders: ComputedPartyReminder[]
  adminAlerts: ComputedAdminAlert[]
  invoiceReminderConfigs: Record<string, InvoiceReminderConfig>
  updateInvoiceReminderConfig: (invoiceId: string, updates: Partial<InvoiceReminderConfig>) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const savedAuth = localStorage.getItem("ab_auth")
      return savedAuth !== "false"
    }
    return true
  })
  const [userPhone, setUserPhone] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("ab_user_phone") || "+91 98200 45678"
    }
    return "+91 98200 45678"
  })

  const login = (phone?: string, _otp?: string) => {
    setIsAuthenticated(true)
    if (phone) {
      setUserPhone(phone)
      if (typeof window !== "undefined") {
        localStorage.setItem("ab_user_phone", phone)
      }
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("ab_auth", "true")
    }
    return true
  }

  const logout = () => {
    setIsAuthenticated(false)
    if (typeof window !== "undefined") {
      localStorage.setItem("ab_auth", "false")
    }
  }

  // State
  const [currentRole, setCurrentRole] = useState<UserRole>("owner")
  const [roles, setRoles] = useState<Record<string, RoleConfig>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ab_roles_config")
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          const SYSTEM_ROLE_RENAMES: Record<string, { name: string; title: string }> = {
            owner: { name: "Business Owner", title: "Admin / Full Access" },
            sales: { name: "Billing Staff", title: "Counter Sales & Billing" },
            store_keeper: { name: "Store Keeper", title: "Godown & Stock Manager" },
            purchase: { name: "Purchase Manager", title: "Procurement & Orders" },
            accountant: { name: "Accountant", title: "Finance, Audit & Taxes" },
            production: { name: "Production Supervisor", title: "Assembly & Manufacturing" }
          }
          Object.values(parsed).forEach((r: any) => {
            if (r && SYSTEM_ROLE_RENAMES[r.id]) {
              r.name = SYSTEM_ROLE_RENAMES[r.id].name
              r.title = SYSTEM_ROLE_RENAMES[r.id].title
            }
            if (r && r.avatarColor === "bg-purple-600") r.avatarColor = "bg-slate-700"
            if (r && (r.avatarColor === "bg-rose-600" || r.avatarColor === "bg-red-600")) r.avatarColor = "bg-slate-800"
          })
          return { ...ROLE_CONFIGS, ...parsed }
        } catch (e) {
          console.error("Failed to parse saved roles", e)
        }
      }
    }
    return ROLE_CONFIGS
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ab_roles_config", JSON.stringify(roles))
    }
  }, [roles])

  const [teamUsers, setTeamUsers] = useState<TeamUser[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ab_team_users")
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error("Failed to parse saved team users", e)
        }
      }
    }
    return INITIAL_TEAM_USERS
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ab_team_users", JSON.stringify(teamUsers))
    }
  }, [teamUsers])
  const [business, setBusiness] = useState<BusinessProfile>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ab_business")
      if (saved) {
        try {
          return { ...INITIAL_BUSINESS, ...JSON.parse(saved) }
        } catch (e) {
          console.error("Failed to parse saved business", e)
        }
      }
    }
    return INITIAL_BUSINESS
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ab_business", JSON.stringify(business))
    }
  }, [business])

  // Custom Item Fields (Max 6)
  const [customItemFields, setCustomItemFields] = useState<CustomItemField[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ab_custom_item_fields")
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error("Failed to parse saved custom item fields", e)
        }
      }
    }
    return INITIAL_CUSTOM_ITEM_FIELDS
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ab_custom_item_fields", JSON.stringify(customItemFields))
    }
  }, [customItemFields])

  const addCustomItemField = (field: Omit<CustomItemField, "id">) => {
    if (customItemFields.length >= 6) {
      return { success: false, message: "Maximum 6 custom fields allowed." }
    }
    const newField: CustomItemField = {
      ...field,
      id: `cf-${Date.now()}`
    }
    setCustomItemFields(prev => [...prev, newField])
    setDocumentCustomFields(prev => ({
      ...prev,
      item: [...(prev.item || []), newField]
    }))
    return { success: true, message: `Custom field "${newField.name}" added.` }
  }

  const updateCustomItemField = (id: string, updates: Partial<CustomItemField>) => {
    setCustomItemFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f))
    setDocumentCustomFields(prev => ({
      ...prev,
      item: (prev.item || []).map(f => f.id === id ? { ...f, ...updates } : f)
    }))
    return { success: true, message: "Custom field updated." }
  }

  const deleteCustomItemField = (id: string) => {
    setCustomItemFields(prev => prev.filter(f => f.id !== id))
    setDocumentCustomFields(prev => ({
      ...prev,
      item: (prev.item || []).filter(f => f.id !== id)
    }))
    return { success: true, message: "Custom field removed." }
  }

  // Item Field Toggles
  const [itemFieldToggles, setItemFieldToggles] = useState<ItemFieldToggles>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ab_item_field_toggles")
      if (saved) {
        try {
          return { ...INITIAL_ITEM_FIELD_TOGGLES, ...JSON.parse(saved) }
        } catch (e) {
          console.error("Failed to parse saved item field toggles", e)
        }
      }
    }
    return INITIAL_ITEM_FIELD_TOGGLES
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ab_item_field_toggles", JSON.stringify(itemFieldToggles))
    }
  }, [itemFieldToggles])

  const updateItemFieldToggles = (updates: Partial<ItemFieldToggles>) => {
    setItemFieldToggles(prev => ({ ...prev, ...updates }))
  }

  // Print Settings & Themes
  const [printSettings, setPrintSettings] = useState<PrintSettings>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ab_print_settings")
      if (saved) {
        try {
          return { ...INITIAL_PRINT_SETTINGS, ...JSON.parse(saved) }
        } catch (e) {
          console.error("Failed to parse saved print settings", e)
        }
      }
    }
    return INITIAL_PRINT_SETTINGS
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ab_print_settings", JSON.stringify(printSettings))
    }
  }, [printSettings])

  const updatePrintSettings = (updates: Partial<PrintSettings>) => {
    setPrintSettings(prev => ({ ...prev, ...updates }))
  }

  // Document Settings (Form & PDF fields visibility)
  const [documentSettings, setDocumentSettings] = useState<DocumentSettings>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ab_document_settings")
      if (saved) {
        try {
          return { ...DEFAULT_DOCUMENT_SETTINGS, ...JSON.parse(saved) }
        } catch (e) {
          console.error("Failed to parse saved document settings", e)
        }
      }
    }
    return DEFAULT_DOCUMENT_SETTINGS
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ab_document_settings", JSON.stringify(documentSettings))
    }
  }, [documentSettings])

  const updateDocumentSettings = (updates: Partial<DocumentSettings>) => {
    setDocumentSettings(prev => ({ ...prev, ...updates }))
  }

  // Document Prefix & Suffix Settings
  const [prefixSuffixSettings, setPrefixSuffixSettings] = useState<DocumentPrefixSuffixSettings>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ab_prefix_suffix_settings")
      if (saved) {
        try {
          return { ...DEFAULT_PREFIX_SUFFIX_SETTINGS, ...JSON.parse(saved) }
        } catch (e) {
          console.error("Failed to parse saved prefix suffix settings", e)
        }
      }
    }
    return DEFAULT_PREFIX_SUFFIX_SETTINGS
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ab_prefix_suffix_settings", JSON.stringify(prefixSuffixSettings))
    }
  }, [prefixSuffixSettings])

  const updatePrefixSuffixSettings = (newSettings: DocumentPrefixSuffixSettings) => {
    setPrefixSuffixSettings(newSettings)
  }

  const setDefaultPrefixSuffix = (docType: DocumentSequenceType, kind: "prefix" | "suffix", id: string) => {
    setPrefixSuffixSettings(prev => {
      const current = prev[docType] || { prefixes: [], suffixes: [] }
      const listKey = kind === "prefix" ? "prefixes" : "suffixes"
      const updatedList = current[listKey].map(item => ({
        ...item,
        isDefault: item.id === id
      }))
      const updated = {
        ...prev,
        [docType]: {
          ...current,
          [listKey]: updatedList
        }
      }

      // Sync active prefix back to business
      if (kind === "prefix") {
        const defaultItem = updatedList.find(i => i.isDefault)
        if (defaultItem) {
          if (docType === "invoice") updateBusiness({ invoicePrefix: defaultItem.value })
          if (docType === "bill") updateBusiness({ billPrefix: defaultItem.value })
          if (docType === "challan") updateBusiness({ challanPrefix: defaultItem.value })
          if (docType === "order") updateBusiness({ orderPrefix: defaultItem.value })
          if (docType === "quotation") updateBusiness({ quotationPrefix: defaultItem.value })
        }
      }

      return updated
    })
  }

  const addPrefixSuffixEntry = (docType: DocumentSequenceType, kind: "prefix" | "suffix", value: string, isDefault = false) => {
    if (!value.trim()) return
    setPrefixSuffixSettings(prev => {
      const current = prev[docType] || { prefixes: [], suffixes: [] }
      const listKey = kind === "prefix" ? "prefixes" : "suffixes"
      const newEntry: PrefixSuffixEntry = {
        id: `${kind}-${docType}-${Date.now()}`,
        value: value.trim(),
        isDefault: isDefault || current[listKey].length === 0,
        createdAt: new Date().toISOString()
      }
      const updatedList = newEntry.isDefault
        ? [...current[listKey].map(i => ({ ...i, isDefault: false })), newEntry]
        : [...current[listKey], newEntry]

      const updated = {
        ...prev,
        [docType]: {
          ...current,
          [listKey]: updatedList
        }
      }

      if (kind === "prefix" && newEntry.isDefault) {
        if (docType === "invoice") updateBusiness({ invoicePrefix: newEntry.value })
        if (docType === "bill") updateBusiness({ billPrefix: newEntry.value })
        if (docType === "challan") updateBusiness({ challanPrefix: newEntry.value })
        if (docType === "order") updateBusiness({ orderPrefix: newEntry.value })
        if (docType === "quotation") updateBusiness({ quotationPrefix: newEntry.value })
      }

      return updated
    })
  }

  const editPrefixSuffixEntry = (docType: DocumentSequenceType, kind: "prefix" | "suffix", id: string, value: string) => {
    if (!value.trim()) return
    setPrefixSuffixSettings(prev => {
      const current = prev[docType] || { prefixes: [], suffixes: [] }
      const listKey = kind === "prefix" ? "prefixes" : "suffixes"
      const updatedList = current[listKey].map(item => item.id === id ? { ...item, value: value.trim() } : item)

      const updated = {
        ...prev,
        [docType]: {
          ...current,
          [listKey]: updatedList
        }
      }

      if (kind === "prefix") {
        const item = updatedList.find(i => i.id === id && i.isDefault)
        if (item) {
          if (docType === "invoice") updateBusiness({ invoicePrefix: item.value })
          if (docType === "bill") updateBusiness({ billPrefix: item.value })
          if (docType === "challan") updateBusiness({ challanPrefix: item.value })
          if (docType === "order") updateBusiness({ orderPrefix: item.value })
          if (docType === "quotation") updateBusiness({ quotationPrefix: item.value })
        }
      }

      return updated
    })
  }

  const deletePrefixSuffixEntry = (docType: DocumentSequenceType, kind: "prefix" | "suffix", id: string) => {
    setPrefixSuffixSettings(prev => {
      const current = prev[docType] || { prefixes: [], suffixes: [] }
      const listKey = kind === "prefix" ? "prefixes" : "suffixes"
      const deletedItem = current[listKey].find(i => i.id === id)
      const remaining = current[listKey].filter(i => i.id !== id)
      if (deletedItem?.isDefault && remaining.length > 0) {
        remaining[0].isDefault = true
      }
      return {
        ...prev,
        [docType]: {
          ...current,
          [listKey]: remaining
        }
      }
    })
  }

  // Form-wise Custom Fields (Max 6 per form)
  const [documentCustomFields, setDocumentCustomFields] = useState<FormCustomFieldsMap>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ab_document_custom_fields")
      if (saved) {
        try {
          return { ...DEFAULT_DOCUMENT_CUSTOM_FIELDS, ...JSON.parse(saved) }
        } catch (e) {
          console.error("Failed to parse saved document custom fields", e)
        }
      }
    }
    return DEFAULT_DOCUMENT_CUSTOM_FIELDS
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ab_document_custom_fields", JSON.stringify(documentCustomFields))
    }
  }, [documentCustomFields])

  const addFormCustomField = (docType: FormCustomFieldDocType, field: Omit<CustomItemField, "id">) => {
    const currentList = documentCustomFields[docType] || []
    if (currentList.length >= 6) {
      return { success: false, message: "Maximum 6 custom fields allowed per form." }
    }
    const newField: CustomItemField = {
      ...field,
      id: `cf-${docType}-${Date.now()}`
    }
    setDocumentCustomFields(prev => ({
      ...prev,
      [docType]: [...(prev[docType] || []), newField]
    }))
    if (docType === "item") {
      setCustomItemFields(prev => [...prev, newField])
    }
    return { success: true, message: `Custom field "${newField.name}" added.` }
  }

  const updateFormCustomField = (docType: FormCustomFieldDocType, fieldId: string, updates: Partial<CustomItemField>) => {
    setDocumentCustomFields(prev => ({
      ...prev,
      [docType]: (prev[docType] || []).map(f => f.id === fieldId ? { ...f, ...updates } : f)
    }))
    if (docType === "item") {
      setCustomItemFields(prev => prev.map(f => f.id === fieldId ? { ...f, ...updates } : f))
    }
    return { success: true, message: "Custom field updated." }
  }

  const deleteFormCustomField = (docType: FormCustomFieldDocType, fieldId: string) => {
    setDocumentCustomFields(prev => ({
      ...prev,
      [docType]: (prev[docType] || []).filter(f => f.id !== fieldId)
    }))
    if (docType === "item") {
      setCustomItemFields(prev => prev.filter(f => f.id !== fieldId))
    }
    return { success: true, message: "Custom field removed." }
  }

  // Form-wise Notes & Terms
  const [formNotesTerms, setFormNotesTerms] = useState<FormNotesTermsMap>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ab_form_notes_terms")
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          const merged: any = {}
          const keys = Object.keys(DEFAULT_FORM_NOTES_TERMS) as DocumentSequenceType[]
          keys.forEach(k => {
            const def = DEFAULT_FORM_NOTES_TERMS[k]
            const curr = parsed[k] || {}
            merged[k] = {
              ...def,
              ...curr,
              notesPresets: curr.notesPresets && curr.notesPresets.length > 0 ? curr.notesPresets : def.notesPresets,
              termsPresets: curr.termsPresets && curr.termsPresets.length > 0 ? curr.termsPresets : def.termsPresets,
            }
          })
          return merged
        } catch (e) {
          console.error("Failed to parse saved form notes & terms", e)
        }
      }
    }
    return DEFAULT_FORM_NOTES_TERMS
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ab_form_notes_terms", JSON.stringify(formNotesTerms))
    }
  }, [formNotesTerms])

  const updateFormNotesTerms = (docType: DocumentSequenceType, updates: Partial<FormNotesTermsConfig>) => {
    setFormNotesTerms(prev => ({
      ...prev,
      [docType]: {
        ...(prev[docType] || DEFAULT_FORM_NOTES_TERMS[docType]),
        ...updates
      }
    }))
  }

  const resetFormNotesTerms = (docType: DocumentSequenceType) => {
    if (DEFAULT_FORM_NOTES_TERMS[docType]) {
      setFormNotesTerms(prev => ({
        ...prev,
        [docType]: DEFAULT_FORM_NOTES_TERMS[docType]
      }))
    }
  }

  const addFormNotePreset = (docType: DocumentSequenceType, preset: Omit<FormNotePreset, "id">) => {
    const newPreset: FormNotePreset = {
      ...preset,
      id: `np-${docType}-${Date.now()}`
    }
    setFormNotesTerms(prev => {
      const currentConfig = prev[docType] || DEFAULT_FORM_NOTES_TERMS[docType]
      const currentPresets = currentConfig.notesPresets || []
      const updatedPresets: FormNotePreset[] = preset.isDefault
        ? [...currentPresets.map(p => ({ ...p, isDefault: false })), newPreset]
        : [...currentPresets, newPreset]

      return {
        ...prev,
        [docType]: {
          ...currentConfig,
          notesPresets: updatedPresets,
          ...(preset.isDefault ? { notes: preset.content } : {})
        }
      }
    })
    return { success: true, message: `Note preset "${newPreset.title}" added.` }
  }

  const updateFormNotePreset = (docType: DocumentSequenceType, presetId: string, updates: Partial<FormNotePreset>) => {
    setFormNotesTerms(prev => {
      const currentConfig = prev[docType] || DEFAULT_FORM_NOTES_TERMS[docType]
      const currentPresets = currentConfig.notesPresets || []
      const updatedPresets = currentPresets.map(p => {
        if (p.id === presetId) {
          return { ...p, ...updates }
        }
        if (updates.isDefault) {
          return { ...p, isDefault: false }
        }
        return p
      })

      const target = updatedPresets.find(p => p.id === presetId)
      return {
        ...prev,
        [docType]: {
          ...currentConfig,
          notesPresets: updatedPresets,
          ...(updates.isDefault && target ? { notes: target.content } : {})
        }
      }
    })
    return { success: true, message: "Note preset updated." }
  }

  const deleteFormNotePreset = (docType: DocumentSequenceType, presetId: string) => {
    setFormNotesTerms(prev => {
      const currentConfig = prev[docType] || DEFAULT_FORM_NOTES_TERMS[docType]
      const currentPresets = currentConfig.notesPresets || []
      return {
        ...prev,
        [docType]: {
          ...currentConfig,
          notesPresets: currentPresets.filter(p => p.id !== presetId)
        }
      }
    })
    return { success: true, message: "Note preset deleted." }
  }

  const addFormTermsPreset = (docType: DocumentSequenceType, preset: Omit<FormTermsPreset, "id">) => {
    const newPreset: FormTermsPreset = {
      ...preset,
      id: `tp-${docType}-${Date.now()}`
    }
    setFormNotesTerms(prev => {
      const currentConfig = prev[docType] || DEFAULT_FORM_NOTES_TERMS[docType]
      const currentPresets = currentConfig.termsPresets || []
      const updatedPresets: FormNotePreset[] = preset.isDefault
        ? [...currentPresets.map(p => ({ ...p, isDefault: false })), newPreset]
        : [...currentPresets, newPreset]

      return {
        ...prev,
        [docType]: {
          ...currentConfig,
          termsPresets: updatedPresets,
          ...(preset.isDefault ? { terms: preset.content } : {})
        }
      }
    })
    return { success: true, message: `Terms preset "${newPreset.title}" added.` }
  }

  const updateFormTermsPreset = (docType: DocumentSequenceType, presetId: string, updates: Partial<FormTermsPreset>) => {
    setFormNotesTerms(prev => {
      const currentConfig = prev[docType] || DEFAULT_FORM_NOTES_TERMS[docType]
      const currentPresets = currentConfig.termsPresets || []
      const updatedPresets = currentPresets.map(p => {
        if (p.id === presetId) {
          return { ...p, ...updates }
        }
        if (updates.isDefault) {
          return { ...p, isDefault: false }
        }
        return p
      })

      const target = updatedPresets.find(p => p.id === presetId)
      return {
        ...prev,
        [docType]: {
          ...currentConfig,
          termsPresets: updatedPresets,
          ...(updates.isDefault && target ? { terms: target.content } : {})
        }
      }
    })
    return { success: true, message: "Terms preset updated." }
  }

  const deleteFormTermsPreset = (docType: DocumentSequenceType, presetId: string) => {
    setFormNotesTerms(prev => {
      const currentConfig = prev[docType] || DEFAULT_FORM_NOTES_TERMS[docType]
      const currentPresets = currentConfig.termsPresets || []
      return {
        ...prev,
        [docType]: {
          ...currentConfig,
          termsPresets: currentPresets.filter(p => p.id !== presetId)
        }
      }
    })
    return { success: true, message: "Terms preset deleted." }
  }

  // Form-wise Physical Paper Print Settings
  const [formPrintSettings, setFormPrintSettings] = useState<FormPrintSettingsMap>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ab_form_print_settings")
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          const merged: any = {}
          const keys = Object.keys(DEFAULT_FORM_PRINT_SETTINGS_MAP) as DocumentSequenceType[]
          keys.forEach(k => {
            const def = DEFAULT_FORM_PRINT_SETTINGS_MAP[k] || DEFAULT_FORM_PRINT_SETTINGS_BASE
            const curr = parsed[k] || {}
            merged[k] = { ...def, ...curr }
          })
          return merged as FormPrintSettingsMap
        } catch (e) {
          console.error("Failed to parse saved form print settings", e)
        }
      }
    }
    return DEFAULT_FORM_PRINT_SETTINGS_MAP
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ab_form_print_settings", JSON.stringify(formPrintSettings))
    }
  }, [formPrintSettings])

  const updateFormPrintSettings = (docType: DocumentSequenceType, updates: Partial<FormPrintSettings>) => {
    setFormPrintSettings(prev => ({
      ...prev,
      [docType]: {
        ...(prev[docType] || DEFAULT_FORM_PRINT_SETTINGS_MAP[docType] || DEFAULT_FORM_PRINT_SETTINGS_BASE),
        ...updates
      }
    }))
  }

  const resetFormPrintSettings = (docType: DocumentSequenceType) => {
    const def = DEFAULT_FORM_PRINT_SETTINGS_MAP[docType] || DEFAULT_FORM_PRINT_SETTINGS_BASE
    setFormPrintSettings(prev => ({
      ...prev,
      [docType]: { ...def }
    }))
  }

  // Form-wise Custom Line Item Table Columns (Max 3 per document form)
  const [formCustomColumns, setFormCustomColumns] = useState<FormCustomColumnsMap>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ab_form_custom_item_columns")
      if (saved) {
        try {
          return { ...DEFAULT_FORM_CUSTOM_COLUMNS_MAP, ...JSON.parse(saved) }
        } catch (e) {
          console.error("Failed to parse saved form custom columns", e)
        }
      }
    }
    return DEFAULT_FORM_CUSTOM_COLUMNS_MAP
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ab_form_custom_item_columns", JSON.stringify(formCustomColumns))
    }
  }, [formCustomColumns])

  const addCustomColumn = (docType: DocumentSequenceType, name: string, printOnPaper: boolean = true) => {
    const currentList = formCustomColumns[docType] || []
    if (currentList.length >= 3) {
      return { success: false, message: "Maximum 3 custom columns allowed in product section." }
    }
    const trimmed = name.trim()
    if (!trimmed) {
      return { success: false, message: "Column name cannot be empty." }
    }
    if (currentList.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      return { success: false, message: `A column named "${trimmed}" already exists.` }
    }
    const newCol: CustomItemColumn = {
      id: `col-${docType}-${Date.now()}`,
      name: trimmed,
      isEnabled: true,
      printOnPaper
    }
    setFormCustomColumns(prev => ({
      ...prev,
      [docType]: [...(prev[docType] || []), newCol]
    }))
    return { success: true, message: `Column "${trimmed}" added to product section.`, column: newCol }
  }

  const updateCustomColumn = (docType: DocumentSequenceType, columnId: string, updates: Partial<CustomItemColumn>) => {
    setFormCustomColumns(prev => ({
      ...prev,
      [docType]: (prev[docType] || []).map(c => c.id === columnId ? { ...c, ...updates } : c)
    }))
    return { success: true, message: "Custom column updated." }
  }

  const deleteCustomColumn = (docType: DocumentSequenceType, columnId: string) => {
    setFormCustomColumns(prev => ({
      ...prev,
      [docType]: (prev[docType] || []).filter(c => c.id !== columnId)
    }))
    return { success: true, message: "Custom column removed." }
  }

  // Auto Reminders & Notifications
  const [autoReminderSettings, setAutoReminderSettings] = useState<AutoRemindersSettings>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ab_auto_reminder_settings")
      if (saved) {
        try {
          return { ...DEFAULT_AUTO_REMINDER_SETTINGS, ...JSON.parse(saved) }
        } catch (e) {
          console.error("Failed to parse saved auto reminder settings", e)
        }
      }
    }
    return DEFAULT_AUTO_REMINDER_SETTINGS
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ab_auto_reminder_settings", JSON.stringify(autoReminderSettings))
    }
  }, [autoReminderSettings])

  const updateAutoReminderSettings = (updates: Partial<AutoRemindersSettings>) => {
    setAutoReminderSettings(prev => ({ ...prev, ...updates }))
  }

  const [reminderLogs, setReminderLogs] = useState<ReminderLogEntry[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ab_reminder_logs")
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error("Failed to parse saved reminder logs", e)
        }
      }
    }
    return [
      {
        id: "rem-log-1",
        invoiceNo: "INV-26-0042",
        partyName: "MedLife Healthcare Distributors",
        type: "overdue_level_1",
        channel: "whatsapp",
        sentAt: "2026-10-25 10:15 AM",
        status: "delivered",
        messagePreview: "Dear MedLife Healthcare Distributors, invoice INV-26-0042 of ₹20,222.00 was due on 2026-10-22. Kindly process the payment at your earliest convenience via UPI: apexglobal@okaxis.",
        recipientPhoneOrEmail: "+91 98200 45678",
        amountDue: 20222,
        triggeredBy: "auto"
      },
      {
        id: "rem-log-2",
        invoiceNo: "INV-26-0043",
        partyName: "Gujarat Surgical & Diagnostics",
        type: "due_today",
        channel: "whatsapp",
        sentAt: "2026-10-28 09:00 AM",
        status: "delivered",
        messagePreview: "Dear Gujarat Surgical & Diagnostics, invoice INV-26-0043 for ₹6,446.00 is due today (2026-10-28). Please clear the balance via UPI: apexglobal@okaxis or bank transfer.",
        recipientPhoneOrEmail: "+91 94260 11223",
        amountDue: 6446,
        triggeredBy: "auto"
      }
    ]
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ab_reminder_logs", JSON.stringify(reminderLogs))
    }
  }, [reminderLogs])

  const addReminderLog = (logData: Omit<ReminderLogEntry, "id" | "sentAt">) => {
    const newLog: ReminderLogEntry = {
      ...logData,
      id: `rem-log-${Date.now()}`,
      sentAt: new Date().toLocaleString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    }
    setReminderLogs(prev => [newLog, ...prev])
  }

  const [invoiceReminderConfigs, setInvoiceReminderConfigs] = useState<Record<string, InvoiceReminderConfig>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ab_invoice_reminder_configs")
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error("Failed to parse saved invoice reminder configs", e)
        }
      }
    }
    return {}
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ab_invoice_reminder_configs", JSON.stringify(invoiceReminderConfigs))
    }
  }, [invoiceReminderConfigs])

  const updateInvoiceReminderConfig = (invoiceId: string, updates: Partial<InvoiceReminderConfig>) => {
    setInvoiceReminderConfigs(prev => {
      const existing = prev[invoiceId] || {
        enabled: true,
        preset: "standard",
        preferredChannel: "whatsapp"
      }
      return {
        ...prev,
        [invoiceId]: { ...existing, ...updates }
      }
    })
  }

  // Multi-Currency
  const [currencies, setCurrencies] = useState<CurrencyItem[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ab_currencies")
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error("Failed to parse saved currencies", e)
        }
      }
    }
    return INITIAL_CURRENCIES
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ab_currencies", JSON.stringify(currencies))
    }
  }, [currencies])

  const addCurrency = (currency: Omit<CurrencyItem, "id">) => {
    const newCurr: CurrencyItem = {
      ...currency,
      id: `curr-${Date.now()}`
    }
    setCurrencies(prev => [...prev, newCurr])
    return { success: true, message: `Currency "${newCurr.code}" added.` }
  }

  const updateCurrency = (id: string, updates: Partial<CurrencyItem>) => {
    setCurrencies(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
    return { success: true, message: "Currency updated." }
  }

  const deleteCurrency = (id: string) => {
    const target = currencies.find(c => c.id === id)
    if (target?.isBase) {
      return { success: false, message: "Cannot delete the base reporting currency." }
    }
    setCurrencies(prev => prev.filter(c => c.id !== id))
    return { success: true, message: "Currency removed." }
  }

  // Standard Terms & Conditions
  const [standardTerms, setStandardTerms] = useState<StandardTerms>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ab_standard_terms")
      if (saved) {
        try {
          return { ...INITIAL_STANDARD_TERMS, ...JSON.parse(saved) }
        } catch (e) {
          console.error("Failed to parse saved standard terms", e)
        }
      }
    }
    return INITIAL_STANDARD_TERMS
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ab_standard_terms", JSON.stringify(standardTerms))
    }
  }, [standardTerms])

  const updateStandardTerms = (updates: Partial<StandardTerms>) => {
    setStandardTerms(prev => ({ ...prev, ...updates }))
  }

  // Terms & Conditions Multiple Presets Library
  const [termsTemplates, setTermsTemplates] = useState<TermsTemplate[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ab_terms_templates")
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error("Failed to parse saved terms templates", e)
        }
      }
    }
    return INITIAL_TERMS_TEMPLATES
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ab_terms_templates", JSON.stringify(termsTemplates))
    }
  }, [termsTemplates])

  const addTermsTemplate = (template: Omit<TermsTemplate, "id">) => {
    const newTemplate: TermsTemplate = {
      ...template,
      id: `terms-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10)
    }
    setTermsTemplates(prev => [newTemplate, ...prev])
    return { success: true, message: `Terms preset "${newTemplate.title}" created.`, id: newTemplate.id }
  }

  const updateTermsTemplate = (id: string, updates: Partial<TermsTemplate>) => {
    setTermsTemplates(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
    return { success: true, message: "Terms preset updated." }
  }

  const deleteTermsTemplate = (id: string) => {
    setTermsTemplates(prev => prev.filter(t => t.id !== id))
    return { success: true, message: "Terms preset deleted." }
  }

  const setDefaultTermsTemplate = (id: string, docType: ApplicableDocumentType) => {
    setTermsTemplates(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, isDefault: true }
      }
      if (docType === "all" || t.applicableTo.includes(docType) || t.applicableTo.includes("all")) {
        return { ...t, isDefault: false }
      }
      return t
    }))
    return { success: true, message: "Default preset updated." }
  }

  const [godowns, setGodowns] = useState<Godown[]>(INITIAL_GODOWNS)
  const [activeGodownId, setActiveGodownId] = useState<string>("godown-1")

  const addGodown = (godownData: Omit<Godown, "id">) => {
    const id = `godown-${Date.now()}`
    const newGodown: Godown = {
      ...godownData,
      id
    }
    if (newGodown.isDefault) {
      setGodowns(prev => prev.map(g => ({ ...g, isDefault: false })).concat(newGodown))
    } else {
      setGodowns(prev => [...prev, newGodown])
    }
    return { success: true, message: `Godown "${newGodown.name}" created successfully.`, id }
  }

  const updateGodown = (id: string, updates: Partial<Godown>) => {
    setGodowns(prev => prev.map(g => {
      if (g.id !== id) {
        if (updates.isDefault) return { ...g, isDefault: false }
        return g
      }
      return { ...g, ...updates }
    }))
    return { success: true, message: `Godown updated successfully.` }
  }

  const deleteGodown = (id: string) => {
    const target = godowns.find(g => g.id === id)
    if (target?.isDefault) {
      return { success: false, message: "Cannot delete the primary default godown." }
    }
    setGodowns(prev => prev.filter(g => g.id !== id))
    return { success: true, message: `Godown removed.` }
  }

  const [items, setItems] = useState<Item[]>(INITIAL_ITEMS)
  const [parties, setParties] = useState<Party[]>(INITIAL_PARTIES)
  const [salesDocs, setSalesDocs] = useState<SalesDocument[]>(INITIAL_SALES_DOCUMENTS)
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>(INITIAL_SALES_ORDERS)
  const [deliveryChallans, setDeliveryChallans] = useState<DeliveryChallan[]>(INITIAL_DELIVERY_CHALLANS)
  const [quotations, setQuotations] = useState<Quotation[]>(INITIAL_QUOTATIONS)
  const [proformaInvoices, setProformaInvoices] = useState<ProformaInvoice[]>(INITIAL_PROFORMA_INVOICES)
  const [salesReturns, setSalesReturns] = useState<SalesReturn[]>(INITIAL_SALES_RETURNS)
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>(INITIAL_CREDIT_NOTES)
  const [purchaseReturns, setPurchaseReturns] = useState<PurchaseReturn[]>(INITIAL_PURCHASE_RETURNS)
  const [debitNotes, setDebitNotes] = useState<DebitNote[]>(INITIAL_DEBIT_NOTES)
  const [purchaseDocs, setPurchaseDocs] = useState<PurchaseDocument[]>(INITIAL_PURCHASE_DOCUMENTS)
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(INITIAL_STOCK_MOVEMENTS)
  const [stockAudits, setStockAudits] = useState<StockAudit[]>(INITIAL_STOCK_AUDITS)
  const [jobWorks, setJobWorks] = useState<JobWork[]>(INITIAL_JOB_WORKS)
  const [payments, setPayments] = useState<PaymentRecord[]>(INITIAL_PAYMENTS)

  const [isClient, setIsClient] = useState(false)
  useEffect(() => {
    setIsClient(true)
  }, [])

  const partyReminders = useMemo(() => {
    if (!isClient) return []
    return computePartyReminders(salesDocs, parties, business, autoReminderSettings)
  }, [isClient, salesDocs, parties, business, autoReminderSettings])

  const adminAlerts = useMemo(() => {
    if (!isClient) return []
    return computeAdminAlerts(items, purchaseDocs, salesDocs, autoReminderSettings)
  }, [isClient, items, purchaseDocs, salesDocs, autoReminderSettings])

  // Dynamic Categories and Units with localStorage persistence and default fallback
  const [categories, setCategories] = useState<string[]>(() => {
    const defaults = [...DEFAULT_CATEGORIES]
    INITIAL_ITEMS.forEach(item => {
      if (item.category && !defaults.some(d => d.toLowerCase() === item.category.toLowerCase())) {
        defaults.push(item.category)
      }
    })
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ab_categories")
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0) {
            const merged = [...parsed]
            defaults.forEach(d => {
              if (!merged.some(m => m.toLowerCase() === d.toLowerCase())) {
                merged.push(d)
              }
            })
            return merged
          }
        } catch (e) {
          console.error("Failed to parse saved categories", e)
        }
      }
    }
    return defaults
  })

  const [units, setUnits] = useState<string[]>(() => {
    const defaults = [...DEFAULT_UNITS]
    INITIAL_ITEMS.forEach(item => {
      if (item.unit && !defaults.some(d => d.toLowerCase() === item.unit.toLowerCase())) {
        defaults.push(item.unit)
      }
    })
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ab_units")
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0) {
            const merged = [...parsed]
            defaults.forEach(d => {
              if (!merged.some(m => m.toLowerCase() === d.toLowerCase())) {
                merged.push(d)
              }
            })
            return merged
          }
        } catch (e) {
          console.error("Failed to parse saved units", e)
        }
      }
    }
    return defaults
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ab_categories", JSON.stringify(categories))
    }
  }, [categories])

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ab_units", JSON.stringify(units))
    }
  }, [units])

  const addCategory = (cat: string) => {
    const trimmed = cat.trim()
    if (!trimmed) return { success: false, message: "Category name cannot be empty." }
    const existing = categories.find(c => c.toLowerCase() === trimmed.toLowerCase())
    if (existing) {
      return { success: true, message: `Category "${existing}" already exists.`, category: existing }
    }
    setCategories(prev => [...prev, trimmed])
    return { success: true, message: `Category "${trimmed}" added successfully.`, category: trimmed }
  }

  const addUnit = (u: string) => {
    const trimmed = u.trim()
    if (!trimmed) return { success: false, message: "Unit name cannot be empty." }
    const existing = units.find(unit => unit.toLowerCase() === trimmed.toLowerCase())
    if (existing) {
      return { success: true, message: `Unit "${existing}" already exists.`, unit: existing }
    }
    setUnits(prev => [...prev, trimmed])
    return { success: true, message: `Unit "${trimmed}" added successfully.`, unit: trimmed }
  }

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ab_bank_accounts")
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error("Failed to parse saved bank accounts", e)
        }
      }
    }
    return INITIAL_BANK_ACCOUNTS
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ab_bank_accounts", JSON.stringify(bankAccounts))
    }
  }, [bankAccounts])

  // GST & Taxes Global Settings
  const [gstSettings, setGstSettings] = useState<GstSettings>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ab_gst_settings")
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          return {
            enableGst: true,
            isCompositionScheme: false,
            compositionCategory: "trader_manufacturer",
            compositionRate: 1,
            enableHsnSac: true,
            enablePlaceOfSupply: true,
            enableTcs: true,
            enableTds: true,
            enableItc: true,
            enableRcm: true,
            ...parsed,
          }
        } catch (e) {
          console.error("Failed to parse saved gst settings", e)
        }
      }
    }
    return {
      enableGst: true,
      isCompositionScheme: false,
      compositionCategory: "trader_manufacturer",
      compositionRate: 1,
      enableHsnSac: true,
      enablePlaceOfSupply: true,
      enableTcs: true,
      enableTds: true,
      enableItc: true,
      enableRcm: true,
    }
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ab_gst_settings", JSON.stringify(gstSettings))
    }
  }, [gstSettings])

  const updateGstSettings = (updates: Partial<GstSettings>) => {
    setGstSettings(prev => {
      const next = { ...prev, ...updates }
      if (updates.enableGst === false) {
        next.isCompositionScheme = false
      }
      if (next.isCompositionScheme && !next.compositionCategory) {
        next.compositionCategory = "trader_manufacturer"
        next.compositionRate = 1
      }
      if (updates.compositionCategory) {
        next.compositionRate = updates.compositionCategory === "restaurant" ? 5 : updates.compositionCategory === "service_provider" ? 6 : 1
      }
      return next
    })

    if (updates.enableGst === false) {
      setBusiness(b => ({ ...b, isCompositionScheme: false }))
    } else if (updates.isCompositionScheme !== undefined || updates.compositionCategory !== undefined || updates.compositionRate !== undefined) {
      setBusiness(b => {
        const isComp = updates.isCompositionScheme !== undefined ? updates.isCompositionScheme : b.isCompositionScheme
        const compCat = updates.compositionCategory || b.compositionCategory || "trader_manufacturer"
        const compRate = updates.compositionRate ?? (compCat === "restaurant" ? 5 : compCat === "service_provider" ? 6 : 1)
        return {
          ...b,
          isCompositionScheme: isComp,
          compositionCategory: compCat,
          compositionRate: compRate
        }
      })
    }
  }

  // GSP E-Way Bill & E-Invoice Portal Connection
  const DEFAULT_GSP_CONNECTION: GspPortalConnection = {
    isConnected: false,
    provider: "nic_direct",
    apiUsername: "",
    gstin: "27AABCA1234F1Z5",
    environment: "production"
  }

  const [gspConnection, setGspConnection] = useState<GspPortalConnection>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ab_gsp_connection")
      if (saved) {
        try {
          return { ...DEFAULT_GSP_CONNECTION, ...JSON.parse(saved) }
        } catch (e) {
          console.error("Failed to parse saved gsp connection", e)
        }
      }
    }
    return DEFAULT_GSP_CONNECTION
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ab_gsp_connection", JSON.stringify(gspConnection))
    }
  }, [gspConnection])

  const connectGspPortal = async (credentials: {
    provider: GspPortalConnection["provider"]
    apiUsername: string
    password?: string
    environment?: "production" | "sandbox"
  }) => {
    const connectedState: GspPortalConnection = {
      isConnected: true,
      provider: credentials.provider || "nic_direct",
      apiUsername: credentials.apiUsername || "AB_API_USER",
      gstin: business.gstin || "27AABCA1234F1Z5",
      environment: credentials.environment || "production",
      connectedAt: new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }),
      expiresAt: "In 24 hours (Auto-renews)"
    }
    setGspConnection(connectedState)
    return { 
      success: true, 
      message: `Connected to Government NIC Portal via ${credentials.provider === "nic_direct" ? "NIC Direct GSP" : credentials.provider.toUpperCase()}` 
    }
  }

  const disconnectGspPortal = () => {
    setGspConnection({
      ...DEFAULT_GSP_CONNECTION,
      isConnected: false,
      gstin: business.gstin || "27AABCA1234F1Z5"
    })
  }

  const generateEwayBillForInvoice = (docNo: string, details: { vehicleNo: string; distanceKm: number; transporterId?: string }) => {
    const random12Digit = "24" + Math.floor(1000000000 + Math.random() * 9000000000).toString().slice(0, 10)
    
    setSalesDocs(prev => prev.map(doc => {
      if (doc.docNo === docNo) {
        return {
          ...doc,
          ewayBillNo: random12Digit,
          vehicleNo: details.vehicleNo.toUpperCase(),
          distance: `${details.distanceKm} km`,
          transporterId: details.transporterId || doc.transporterId || "TRANS-IN-9821"
        }
      }
      return doc
    }))

    return {
      success: true,
      message: `E-Way Bill ${random12Digit} generated successfully.`,
      ewayBillNo: random12Digit
    }
  }

  const generateEInvoiceForInvoice = (docNo: string) => {
    const hexChars = "0123456789abcdef"
    let generatedIrn = ""
    for (let i = 0; i < 64; i++) {
      generatedIrn += hexChars[Math.floor(Math.random() * hexChars.length)]
    }
    const ackNo = "11" + Math.floor(10000000000 + Math.random() * 90000000000).toString().slice(0, 13)
    const ackDate = new Date().toISOString()
    const qrCodeMock = `NIC-IRP-VERIFIED|${docNo}|${ackNo}|${generatedIrn.slice(0, 16)}`

    setSalesDocs(prev => prev.map(doc => {
      if (doc.docNo === docNo) {
        return {
          ...doc,
          irn: generatedIrn,
          ackNo,
          ackDate,
          qrCode: qrCodeMock
        }
      }
      return doc
    }))

    return {
      success: true,
      message: `E-Invoice IRN generated and validated with NIC.`,
      irn: generatedIrn,
      ackNo,
      qrCode: qrCodeMock
    }
  }

  // Tax Rates & Tax Groups State
  const [taxRates, setTaxRates] = useState<TaxRateItem[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ab_tax_rates")
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error("Failed to parse saved tax rates", e)
        }
      }
    }
    return INITIAL_TAX_RATES
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ab_tax_rates", JSON.stringify(taxRates))
    }
  }, [taxRates])

  const [taxGroups, setTaxGroups] = useState<TaxGroupItem[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ab_tax_groups")
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error("Failed to parse saved tax groups", e)
        }
      }
    }
    return INITIAL_TAX_GROUPS
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ab_tax_groups", JSON.stringify(taxGroups))
    }
  }, [taxGroups])

  const addTaxRate = (rate: Omit<TaxRateItem, "id">) => {
    const newId = `tr-custom-${Date.now()}`
    setTaxRates(prev => [...prev, { ...rate, id: newId }])
  }

  const updateTaxRate = (id: string, updates: Partial<TaxRateItem>) => {
    setTaxRates(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
  }

  const deleteTaxRate = (id: string) => {
    setTaxRates(prev => prev.filter(t => t.id !== id))
  }

  const addTaxGroup = (group: Omit<TaxGroupItem, "id">) => {
    const newId = `tg-custom-${Date.now()}`
    setTaxGroups(prev => [...prev, { ...group, id: newId }])
  }

  const updateTaxGroup = (id: string, updates: Partial<TaxGroupItem>) => {
    setTaxGroups(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g))
  }

  const deleteTaxGroup = (id: string) => {
    setTaxGroups(prev => prev.filter(g => g.id !== id))
  }

  // TDS & TCS Rates State
  const [tdsRates, setTdsRates] = useState<WithholdingRateItem[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ab_tds_rates")
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error("Failed to parse saved tds rates", e)
        }
      }
    }
    return INITIAL_TDS_RATES
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ab_tds_rates", JSON.stringify(tdsRates))
    }
  }, [tdsRates])

  const addTdsRate = (rate: Omit<WithholdingRateItem, "id">) => {
    const newId = `tds-custom-${Date.now()}`
    setTdsRates(prev => [...prev, { ...rate, id: newId }])
  }

  const updateTdsRate = (id: string, updates: Partial<WithholdingRateItem>) => {
    setTdsRates(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
  }

  const deleteTdsRate = (id: string) => {
    setTdsRates(prev => prev.filter(t => t.id !== id))
  }

  const [tcsRates, setTcsRates] = useState<WithholdingRateItem[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ab_tcs_rates")
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error("Failed to parse saved tcs rates", e)
        }
      }
    }
    return INITIAL_TCS_RATES
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ab_tcs_rates", JSON.stringify(tcsRates))
    }
  }, [tcsRates])

  const addTcsRate = (rate: Omit<WithholdingRateItem, "id">) => {
    const newId = `tcs-custom-${Date.now()}`
    setTcsRates(prev => [...prev, { ...rate, id: newId }])
  }

  const updateTcsRate = (id: string, updates: Partial<WithholdingRateItem>) => {
    setTcsRates(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
  }

  const deleteTcsRate = (id: string) => {
    setTcsRates(prev => prev.filter(t => t.id !== id))
  }


  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false)
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false)

  // Dynamic role management & permissions
  const addCustomRole = (newRoleData: Omit<RoleConfig, "id">) => {
    const id = `role_${Date.now()}`
    const newRole: RoleConfig = {
      ...newRoleData,
      id,
      isSystem: false,
      modulePermissions: newRoleData.modulePermissions || {},
      allowedModules: newRoleData.allowedModules || []
    }
    setRoles(prev => ({ ...prev, [id]: newRole }))
    return { success: true, id, message: "Custom role created successfully." }
  }

  const updateRole = (id: string, updates: Partial<RoleConfig>) => {
    setRoles(prev => {
      const existing = prev[id]
      if (!existing) return prev
      return {
        ...prev,
        [id]: {
          ...existing,
          ...updates,
        }
      }
    })
    return { success: true, message: "Role updated successfully." }
  }

  const deleteCustomRole = (id: string) => {
    const role = roles[id]
    if (!role) return { success: false, message: "Role not found." }
    if (role.isSystem) return { success: false, message: "System roles cannot be deleted." }
    if (currentRole === id) {
      setCurrentRole("owner")
    }
    setRoles(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    return { success: true, message: "Role deleted successfully." }
  }

  const resetRoleToDefault = (id: string) => {
    if (ROLE_CONFIGS[id]) {
      setRoles(prev => ({ ...prev, [id]: { ...ROLE_CONFIGS[id] } }))
    }
  }

  // Active role config resolution
  const roleConfig = roles[currentRole] || roles["owner"] || ROLE_CONFIGS.owner
  const canViewCostAndProfit = roleConfig?.canViewCostAndProfit ?? true

  const isModuleAllowed = (module: string) => {
    // Owner always has access to all modules
    if (currentRole === "owner") return true
    if (!roleConfig) return true

    // Check granular module permissions first if available
    if (roleConfig.modulePermissions && roleConfig.modulePermissions[module] !== undefined) {
      return roleConfig.modulePermissions[module] !== "none"
    }

    // Default fallback to allowedModules list
    return roleConfig.allowedModules?.includes(module) ?? true
  }

  // Team user management operations
  const inviteUser = (userData: Omit<TeamUser, "id" | "createdAt">) => {
    const id = `user-${Date.now()}`
    const newUser: TeamUser = {
      ...userData,
      id,
      createdAt: new Date().toISOString().split("T")[0],
      lastLogin: "Never logged in"
    }
    setTeamUsers(prev => [newUser, ...prev])
    return { success: true, message: `User ${newUser.name} invited successfully.`, id }
  }

  const updateTeamUser = (id: string, updates: Partial<TeamUser>) => {
    setTeamUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u))
    return { success: true, message: "User updated successfully." }
  }

  const deleteTeamUser = (id: string) => {
    const user = teamUsers.find(u => u.id === id)
    if (user && (user.roleId === "owner" || user.id === "user-1")) {
      return { success: false, message: "Business Owner / Administrator account cannot be deleted." }
    }
    setTeamUsers(prev => prev.filter(u => u.id !== id))
    return { success: true, message: "User deleted successfully." }
  }

  const toggleUserStatus = (id: string) => {
    setTeamUsers(prev => prev.map(u => {
      if (u.id === id) {
        if (u.roleId === "owner" || u.id === "user-1") {
          return u // Admin/Owner account is permanently active
        }
        return { ...u, isActive: !u.isActive }
      }
      return u
    }))
  }

  const loginAsUser = (userId: string) => {
    const user = teamUsers.find(u => u.id === userId)
    if (!user) return { success: false, message: "User not found." }
    if (!user.isActive) return { success: false, message: "This user account is currently inactive. Please enable it to log in." }

    // Switch active persona/role to the user's role
    setCurrentRole(user.roleId as UserRole)
    setTeamUsers(prev => prev.map(u => u.id === userId ? { ...u, lastLogin: "Just now" } : u))
    return { success: true, message: `Switched session to ${user.name} (${roles[user.roleId]?.name || user.roleId})` }
  }

  const updateBusiness = (updates: Partial<BusinessProfile>) => {
    setBusiness(prev => ({ ...prev, ...updates }))
    if (updates.isCompositionScheme !== undefined || updates.compositionCategory !== undefined || updates.compositionRate !== undefined) {
      setGstSettings(g => ({
        ...g,
        isCompositionScheme: updates.isCompositionScheme !== undefined ? updates.isCompositionScheme : g.isCompositionScheme,
        compositionCategory: updates.compositionCategory || g.compositionCategory || "trader_manufacturer",
        compositionRate: updates.compositionRate ?? (updates.compositionCategory === "restaurant" ? 5 : updates.compositionCategory === "service_provider" ? 6 : (g.compositionRate ?? 1))
      }))
    }
  }


  // Keyboard shortcut Ctrl+K / Cmd+K for Global Search (PRD HOM-02)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setIsGlobalSearchOpen(prev => !prev)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Create Sales Invoice (PRD SAL-02, F5, AC-01, AC-05, AC-06)
  const createSalesInvoice = (invoiceData: Omit<SalesDocument, "id" | "docNo" | "date" | "createdBy">) => {
    // 1. Concurrency / Invariant Stock Check
    for (const lineItem of invoiceData.items) {
      const targetItem = items.find(i => i.id === lineItem.itemId)
      if (!targetItem) {
        return { success: false, message: `Item not found: ${lineItem.name}` }
      }
      const availableInGodown = targetItem.stockByGodown[invoiceData.godownId] || 0
      if (availableInGodown < lineItem.qty) {
        return {
          success: false,
          message: `Insufficient stock in selected godown for "${targetItem.name}". Available: ${availableInGodown} ${targetItem.unit}, Requested: ${lineItem.qty}`
        }
      }
    }

    const nextDocNum = `INV-26-00${salesDocs.length + 43}`
    const todayStr = new Date().toISOString().split("T")[0]
    const actorName = `${roleConfig.name} (${roleConfig.title})`

    // Generate simulated IRN/Ack if e-invoice enabled
    const irnSim = business.enableEInvoice ? Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('') : undefined
    const ackSim = business.enableEInvoice ? `112610${Date.now().toString().slice(-6)}` : undefined

    const pos = invoiceData.placeOfSupply || invoiceData.partyStateCode || business.stateCode || "27"

    // Accurate calculation of advance paid and remaining credit balance
    const effectivePaid = invoiceData.paidAmount || 0
    const effectiveBalance = invoiceData.balanceAmount !== undefined
      ? invoiceData.balanceAmount
      : Math.max(0, invoiceData.grandTotal - effectivePaid)

    const finalStatus = effectiveBalance <= 0
      ? "paid"
      : (effectivePaid > 0 ? "partial" : (invoiceData.status || "pending"))

    // Finalize line items with batch-specific purchase costs if available
    const finalizedItems: InvoiceItem[] = invoiceData.items.map(line => {
      const itm = items.find(i => i.id === line.itemId)
      if (line.batchNo && itm?.batchDetails) {
        const batch = itm.batchDetails.find(b => b.batchNo.trim().toUpperCase() === line.batchNo!.trim().toUpperCase())
        if (batch) {
          const batchCost = batch.purchasePrice ?? batch.costPrice
          return {
            ...line,
            purchaseCost: line.purchaseCost && line.purchaseCost > 0 ? line.purchaseCost : (batchCost ?? itm.purchasePrice ?? 0)
          }
        }
      }
      return line
    })

    const newDoc: SalesDocument = {
      ...invoiceData,
      items: finalizedItems,
      placeOfSupply: pos,
      partyStateCode: pos,
      id: `inv-${Date.now()}`,
      docNo: nextDocNum,
      date: todayStr,
      createdBy: actorName,
      paidAmount: effectivePaid,
      balanceAmount: effectiveBalance,
      status: finalStatus,
      irn: irnSim,
      ackNo: ackSim,
      ewayBillNo: invoiceData.grandTotal >= 50000 ? `241109${Math.floor(100000 + Math.random() * 900000)}` : undefined
    }

    // 2. Commit atomic stock movements & update stock balances
    const newMovements: StockMovement[] = []
    const updatedItems = items.map(itm => {
      const itemLines = invoiceData.items.filter(l => l.itemId === itm.id)
      if (itemLines.length === 0) return itm

      const totalSoldQty = itemLines.reduce((sum, l) => sum + l.qty, 0)
      const prevQty = itm.currentStock
      const newQty = prevQty - totalSoldQty
      const currentInGodown = itm.stockByGodown[invoiceData.godownId] || 0

      // Batch stock reduction
      let updatedBatches = itm.batchDetails ? [...itm.batchDetails] : undefined
      if (updatedBatches) {
        for (const line of itemLines) {
          if (line.batchNo) {
            const cleanBNo = line.batchNo.trim().toUpperCase()
            updatedBatches = updatedBatches.map(b => {
              if (b.batchNo.trim().toUpperCase() === cleanBNo) {
                const currentInitial = b.initialQuantity !== undefined ? b.initialQuantity : b.quantity
                return {
                  ...b,
                  initialQuantity: currentInitial,
                  quantity: Math.max(0, b.quantity - line.qty)
                }
              }
              return b
            })
          }
        }
      }

      for (const line of itemLines) {
        newMovements.push({
          id: `mov-${Date.now()}-${itm.id}-${line.batchNo || Math.random()}`,
          timestamp: new Date().toLocaleString(),
          itemId: itm.id,
          itemName: itm.name,
          movementType: "sale",
          qtyChange: -line.qty,
          previousStock: prevQty,
          newStock: newQty,
          godownId: invoiceData.godownId,
          godownName: invoiceData.godownName,
          refDocNo: nextDocNum,
          actor: actorName,
          reason: line.batchNo ? `Tax Invoice posted (Batch: ${line.batchNo})` : "Tax Invoice posted",
          batchNo: line.batchNo
        })
      }

      return {
        ...itm,
        currentStock: newQty,
        batchDetails: updatedBatches,
        stockByGodown: {
          ...itm.stockByGodown,
          [invoiceData.godownId]: currentInGodown - totalSoldQty
        }
      }
    })

    // 3. Update customer outstanding balance strictly by the remaining credit balance (effectiveBalance)
    // Advance amount is already received in cash/bank, so it is NOT added to customer receivable balance
    if (effectiveBalance > 0) {
      setParties(prevParties => prevParties.map(p => {
        const isMatch = p.id === invoiceData.partyId || (invoiceData.partyName && p.name.trim().toLowerCase() === invoiceData.partyName.trim().toLowerCase())
        if (isMatch) {
          return { ...p, balance: p.balance + effectiveBalance }
        }
        return p
      }))
    }

    // 4. If advance/immediate payment was received at invoice creation time, record it in payments
    if (effectivePaid > 0) {
      const pmtId = `pmt-${Date.now()}`
      const pmtNo = `PAY-IN-2026-${String(payments.filter(p => p.type === "payment_in").length + 1).padStart(4, "0")}`
      const payMode = invoiceData.paymentMode === "credit" ? "upi" : ((invoiceData.paymentMode as any) || "upi")
      const newPmt: PaymentRecord = {
        id: pmtId,
        paymentNo: pmtNo,
        type: "payment_in",
        partyId: invoiceData.partyId,
        partyName: invoiceData.partyName,
        amount: effectivePaid,
        currency: newDoc.currency,
        currencySymbol: newDoc.currencySymbol,
        exchangeRate: newDoc.exchangeRate,
        date: todayStr,
        paymentMode: payMode,
        depositAccount: "HDFC Current A/c (..4029)",
        docId: newDoc.id,
        docNo: nextDocNum,
        notes: `Advance/Down payment received for invoice ${nextDocNum}`,
        status: "completed",
        createdBy: actorName
      }
      setPayments(prev => [newPmt, ...prev])
    }

    setItems(updatedItems)
    setStockMovements(prev => [newMovements[0], ...newMovements.slice(1), ...prev])
    setSalesDocs(prev => [newDoc, ...prev])

    return { success: true, message: `Invoice ${nextDocNum} generated and stock updated successfully!`, docNo: nextDocNum }
  }

  // Create Sales Order (Pre-sale order booking, reserves inventory without physical deduction)
  const createSalesOrder = (orderData: Omit<SalesOrder, "id" | "orderNo">) => {
    const nextOrderNo = `SO-26-00${salesOrders.length + 15}`
    const newOrder: SalesOrder = {
      ...orderData,
      id: `so-${Date.now()}`,
      orderNo: nextOrderNo,
      createdAt: new Date().toISOString()
    }

    setSalesOrders(prev => [newOrder, ...prev])

    return {
      success: true,
      message: `Sales Order ${nextOrderNo} confirmed. Inventory reserved for customer.`,
      orderNo: nextOrderNo
    }
  }

  // Create Delivery Challan (CGST Rule 55: Dispatches goods, immediately reduces physical stock in Godown)
  const createDeliveryChallan = (challanData: Omit<DeliveryChallan, "id" | "challanNo">) => {
    // 1. Verify stock in dispatch godown
    for (const lineItem of challanData.items) {
      const targetItem = items.find(i => i.id === lineItem.itemId)
      if (!targetItem) {
        return { success: false, message: `Item not found: ${lineItem.name}` }
      }
      const availableInGodown = targetItem.stockByGodown[challanData.godownId] || 0
      if (availableInGodown < lineItem.qty) {
        return {
          success: false,
          message: `Insufficient stock in ${challanData.godownName} for "${targetItem.name}". Available: ${availableInGodown} ${targetItem.unit}, Requested: ${lineItem.qty}`
        }
      }
    }

    const nextChallanNo = `DC-26-00${deliveryChallans.length + 11}`
    const actorName = `${roleConfig.name} (${roleConfig.title})`

    const newChallan: DeliveryChallan = {
      ...challanData,
      id: `dc-${Date.now()}`,
      challanNo: nextChallanNo,
      createdAt: new Date().toISOString()
    }

    // 2. Immediately decrement physical inventory from the Godown
    const newMovements: StockMovement[] = []
    const updatedItems = items.map(itm => {
      const itemLines = challanData.items.filter(l => l.itemId === itm.id)
      if (itemLines.length === 0) return itm

      const totalDispatchedQty = itemLines.reduce((sum, l) => sum + l.qty, 0)
      const prevQty = itm.currentStock
      const newQty = prevQty - totalDispatchedQty
      const currentInGodown = itm.stockByGodown[challanData.godownId] || 0

      // Batch stock reduction
      let updatedBatches = itm.batchDetails ? [...itm.batchDetails] : undefined
      if (updatedBatches) {
        for (const line of itemLines) {
          if (line.batchNo) {
            const cleanBNo = line.batchNo.trim().toUpperCase()
            updatedBatches = updatedBatches.map(b => {
              if (b.batchNo.trim().toUpperCase() === cleanBNo) {
                const currentInitial = b.initialQuantity !== undefined ? b.initialQuantity : b.quantity
                return {
                  ...b,
                  initialQuantity: currentInitial,
                  quantity: Math.max(0, b.quantity - line.qty)
                }
              }
              return b
            })
          }
        }
      }

      for (const line of itemLines) {
        newMovements.push({
          id: `mov-${Date.now()}-${itm.id}-${line.batchNo || Math.random()}`,
          timestamp: new Date().toLocaleString(),
          itemId: itm.id,
          itemName: itm.name,
          movementType: "outward_challan" as any,
          qtyChange: -line.qty,
          previousStock: prevQty,
          newStock: newQty,
          godownId: challanData.godownId,
          godownName: challanData.godownName,
          refDocNo: nextChallanNo,
          actor: actorName,
          reason: line.batchNo
            ? `Delivery Challan dispatch (${challanData.challanType}, Batch: ${line.batchNo})`
            : `Delivery Challan dispatch (${challanData.challanType})`,
          batchNo: line.batchNo
        })
      }

      return {
        ...itm,
        currentStock: newQty,
        batchDetails: updatedBatches,
        stockByGodown: {
          ...itm.stockByGodown,
          [challanData.godownId]: currentInGodown - totalDispatchedQty
        }
      }
    })

    setItems(updatedItems)
    setStockMovements(prev => [...newMovements, ...prev])
    setDeliveryChallans(prev => [newChallan, ...prev])

    // If linked to a Sales Order, mark the order as fulfilled
    if (challanData.linkedOrderId) {
      setSalesOrders(prev => prev.map(so => {
        if (so.id !== challanData.linkedOrderId) return so
        return {
          ...so,
          orderStatus: "fulfilled"
        }
      }))
    }

    return {
      success: true,
      message: `Delivery Challan ${nextChallanNo} generated. ${challanData.totalUnits} units dispatched from ${challanData.godownName}.`,
      challanNo: nextChallanNo
    }
  }

  // Convert Sales Order to Delivery Challan
  const convertOrderToChallan = (orderId: string, customChallanData?: Partial<DeliveryChallan>) => {
    const order = salesOrders.find(o => o.id === orderId)
    if (!order) return { success: false, message: "Sales Order not found." }

    const totalUnits = order.items.reduce((sum, item) => sum + item.qty, 0)
    const todayStr = new Date().toISOString().split("T")[0]

    return createDeliveryChallan({
      date: todayStr,
      partyId: order.partyId,
      partyName: order.partyName,
      partyGstin: order.partyGstin,
      partyAddress: "Registered Dispatch Address",
      challanType: customChallanData?.challanType || "goods_dispatch",
      vehicleNo: customChallanData?.vehicleNo || "MH-04-AB-8291",
      transporter: customChallanData?.transporter || "V-Trans Logistics",
      godownId: order.godownId,
      godownName: order.godownName,
      items: order.items,
      totalUnits,
      goodsValue: order.grandTotal,
      currency: order.currency,
      currencySymbol: order.currencySymbol,
      exchangeRate: order.exchangeRate,
      status: "in_transit",
      linkedOrderId: order.id,
      notes: `Generated from Sales Order ${order.orderNo}`
    })
  }

  // Convert Delivery Challan to Tax Invoice (Note: Stock is NOT deducted again since DC already deducted it)
  const convertChallanToInvoice = (challanId: string) => {
    const challan = deliveryChallans.find(c => c.id === challanId)
    if (!challan) return { success: false, message: "Delivery Challan not found." }

    const party = parties.find(p => p.id === challan.partyId) || parties[0]
    const godown = godowns.find(g => g.id === challan.godownId) || godowns[0]
    const subtotal = challan.items.reduce((s, i) => s + (i.taxableAmount || (i.rate * i.qty)), 0)
    const cgstTotal = challan.items.reduce((s, i) => s + (i.cgst || 0), 0)
    const sgstTotal = challan.items.reduce((s, i) => s + (i.sgst || 0), 0)
    const igstTotal = challan.items.reduce((s, i) => s + (i.igst || 0), 0)
    const grandTotal = challan.goodsValue || (subtotal + cgstTotal + sgstTotal + igstTotal)

    const nextDocNum = `INV-26-00${salesDocs.length + 43}`
    const todayStr = new Date().toISOString().split("T")[0]
    const actorName = `${roleConfig.name} (${roleConfig.title})`

    const newInvoice: SalesDocument = {
      id: `inv-${Date.now()}`,
      docNo: nextDocNum,
      type: "invoice",
      date: todayStr,
      dueDate: todayStr,
      partyId: challan.partyId,
      partyName: challan.partyName,
      partyGstin: challan.partyGstin,
      partyStateCode: party.stateCode || "27",
      godownId: godown.id,
      godownName: godown.name,
      items: challan.items,
      subtotal,
      taxTotal: cgstTotal + sgstTotal + igstTotal,
      cgstTotal,
      sgstTotal,
      igstTotal,
      roundOff: 0,
      grandTotal,
      currency: challan.currency,
      currencySymbol: challan.currencySymbol,
      exchangeRate: challan.exchangeRate,
      paidAmount: 0,
      balanceAmount: grandTotal,
      paymentMode: "credit",
      status: "pending",
      notes: `Billed against Delivery Challan ${challan.challanNo}`,
      createdBy: actorName
    }

    // Update customer accounts receivable
    setParties(prev => prev.map(p => {
      if (p.id === challan.partyId) {
        return { ...p, balance: p.balance + grandTotal }
      }
      return p
    }))

    // Mark delivery challan as invoiced
    setDeliveryChallans(prev => prev.map(c => {
      if (c.id !== challanId) return c
      return { ...c, status: "invoiced", linkedInvoiceId: newInvoice.id }
    }))

    setSalesDocs(prev => [newInvoice, ...prev])

    return {
      success: true,
      message: `Tax Invoice ${nextDocNum} generated from Delivery Challan ${challan.challanNo}.`,
      docNo: nextDocNum
    }
  }

  // Convert Sales Order directly to Tax Invoice (Deducts stock on-the-fly and closes SO)
  const convertOrderToInvoice = (orderId: string) => {
    const order = salesOrders.find(o => o.id === orderId)
    if (!order) return { success: false, message: "Sales Order not found." }

    const pos = order.partyStateCode || business.stateCode || "27"
    const isInter = isInterStateTransaction(pos, business.stateCode || "27")

    const res = createSalesInvoice({
      type: "invoice",
      partyId: order.partyId,
      partyName: order.partyName,
      partyGstin: order.partyGstin,
      partyStateCode: pos,
      placeOfSupply: pos,
      godownId: order.godownId,
      godownName: order.godownName,
      items: order.items,
      subtotal: order.subtotal,
      taxTotal: order.taxTotal,
      cgstTotal: isInter ? 0 : order.taxTotal / 2,
      sgstTotal: isInter ? 0 : order.taxTotal / 2,
      igstTotal: isInter ? order.taxTotal : 0,
      roundOff: 0,
      grandTotal: order.grandTotal,
      currency: order.currency,
      currencySymbol: order.currencySymbol,
      exchangeRate: order.exchangeRate,
      paidAmount: 0,
      balanceAmount: order.grandTotal,
      paymentMode: "credit",
      status: "pending",
      notes: `Direct fulfillment of Sales Order ${order.orderNo}`
    })

    if (res.success) {
      setSalesOrders(prev => prev.map(so => {
        if (so.id !== orderId) return so
        return { ...so, orderStatus: "fulfilled", invoicedStatus: "invoiced" }
      }))
    }

    return res
  }

  const createStockTransfer = (fromGodownId: string, toGodownId: string, itemId: string, qty: number, reason: string) => {
    if (fromGodownId === toGodownId) {
      return { success: false, message: "Source and destination godowns cannot be identical." }
    }
    const targetItem = items.find(i => i.id === itemId)
    if (!targetItem) return { success: false, message: "Item not found." }

    const sourceStock = targetItem.stockByGodown[fromGodownId] || 0
    if (sourceStock < qty) {
      return { success: false, message: `Insufficient quantity in source godown. Available: ${sourceStock}, Requested: ${qty}` }
    }

    const fromGodownName = godowns.find(g => g.id === fromGodownId)?.name || "Godown"
    const toGodownName = godowns.find(g => g.id === toGodownId)?.name || "Godown"
    const actorName = `${roleConfig.name} (${roleConfig.title})`
    const transferRef = `TRF-${Date.now().toString().slice(-4)}`

    // Update item godown stocks
    const updatedItems = items.map(itm => {
      if (itm.id !== itemId) return itm
      const curFrom = itm.stockByGodown[fromGodownId] || 0
      const curTo = itm.stockByGodown[toGodownId] || 0
      return {
        ...itm,
        stockByGodown: {
          ...itm.stockByGodown,
          [fromGodownId]: curFrom - qty,
          [toGodownId]: curTo + qty
        }
      }
    })

    const transferOutMovement: StockMovement = {
      id: `mov-${Date.now()}-out`,
      timestamp: new Date().toLocaleString(),
      itemId: targetItem.id,
      itemName: targetItem.name,
      movementType: "transfer_out",
      qtyChange: -qty,
      previousStock: targetItem.currentStock,
      newStock: targetItem.currentStock,
      godownId: fromGodownId,
      godownName: fromGodownName,
      refDocNo: transferRef,
      actor: actorName,
      reason: `Transfer to ${toGodownName}: ${reason}`
    }

    const transferInMovement: StockMovement = {
      id: `mov-${Date.now()}-in`,
      timestamp: new Date().toLocaleString(),
      itemId: targetItem.id,
      itemName: targetItem.name,
      movementType: "transfer_in",
      qtyChange: qty,
      previousStock: targetItem.currentStock,
      newStock: targetItem.currentStock,
      godownId: toGodownId,
      godownName: toGodownName,
      refDocNo: transferRef,
      actor: actorName,
      reason: `Transfer from ${fromGodownName}: ${reason}`
    }

    setItems(updatedItems)
    setStockMovements(prev => [transferOutMovement, transferInMovement, ...prev])
    return { success: true, message: `Successfully transferred ${qty} ${targetItem.unit} from ${fromGodownName} to ${toGodownName} (${transferRef})` }
  }

  // Stock Adjustment with Reason (PRD INV-11, ADJ-01, AC-11)
  const createStockAdjustment = (godownId: string, itemId: string, qtyDiff: number, reason: string, batchNo?: string) => {
    if (!reason.trim()) {
      return { success: false, message: "A mandatory reason must be provided for stock adjustments." }
    }
    const targetItem = items.find(i => i.id === itemId)
    if (!targetItem) return { success: false, message: "Item not found." }

    const curGodownQty = targetItem.stockByGodown[godownId] || 0
    if (curGodownQty + qtyDiff < 0) {
      return { success: false, message: `Adjustment would result in negative stock in this godown. Current: ${curGodownQty}` }
    }

    if (batchNo && targetItem.batchDetails) {
      const cleanBNo = batchNo.trim().toUpperCase()
      const targetBatch = targetItem.batchDetails.find(b => b.batchNo.trim().toUpperCase() === cleanBNo)
      if (targetBatch && targetBatch.quantity + qtyDiff < 0) {
        return {
          success: false,
          message: `Adjustment would result in negative stock for batch ${batchNo}. Current available: ${targetBatch.quantity} ${targetItem.unit}`
        }
      }
    }

    const godownName = godowns.find(g => g.id === godownId)?.name || "Godown"
    const actorName = `${roleConfig.name} (${roleConfig.title})`
    const adjRef = `ADJ-${Date.now().toString().slice(-4)}`

    const updatedItems = items.map(itm => {
      if (itm.id !== itemId) return itm
      let updatedBatches = itm.batchDetails ? [...itm.batchDetails] : undefined
      if (batchNo && updatedBatches) {
        const cleanBNo = batchNo.trim().toUpperCase()
        updatedBatches = updatedBatches.map(b => {
          if (b.batchNo.trim().toUpperCase() === cleanBNo) {
            const currentInitial = b.initialQuantity !== undefined ? b.initialQuantity : b.quantity
            const nextQty = Math.max(0, b.quantity + qtyDiff)
            const nextInitial = qtyDiff > 0 ? currentInitial + qtyDiff : currentInitial
            return {
              ...b,
              initialQuantity: nextInitial,
              quantity: nextQty
            }
          }
          return b
        })
      }
      return {
        ...itm,
        currentStock: itm.currentStock + qtyDiff,
        batchDetails: updatedBatches,
        stockByGodown: {
          ...itm.stockByGodown,
          [godownId]: curGodownQty + qtyDiff
        }
      }
    })

    const adjMovement: StockMovement = {
      id: `mov-${Date.now()}-adj`,
      timestamp: new Date().toLocaleString(),
      itemId: targetItem.id,
      itemName: targetItem.name,
      movementType: qtyDiff > 0 ? "adjustment_add" : "adjustment_reduce",
      qtyChange: qtyDiff,
      previousStock: targetItem.currentStock,
      newStock: targetItem.currentStock + qtyDiff,
      godownId,
      godownName,
      refDocNo: adjRef,
      actor: actorName,
      reason: batchNo ? `${reason} (Batch: ${batchNo})` : reason,
      batchNo: batchNo
    }

    setItems(updatedItems)
    setStockMovements(prev => [adjMovement, ...prev])
    return {
      success: true,
      message: `Adjusted ${targetItem.name}${batchNo ? ` (Batch: ${batchNo})` : ""} by ${qtyDiff > 0 ? "+" : ""}${qtyDiff} ${targetItem.unit}. Reason: ${reason}`
    }
  }

  // Create Physical Stock Audit (PRD INV-13 to 16, F7)
  const createStockAudit = (
    godownId: string,
    category: string,
    itemsList: { itemId: string; countedQty: number }[]
  ) => {
    const godown = godowns.find(g => g.id === godownId)
    if (!godown) return { success: false, message: "Godown not found." }

    const auditItems = itemsList.map(entry => {
      const itm = items.find(i => i.id === entry.itemId)
      const systemQty = itm ? (itm.stockByGodown[godownId] || 0) : 0
      const countedQty = entry.countedQty
      const varianceQty = countedQty - systemQty
      const unitCost = itm?.purchasePrice || itm?.salePrice || 100
      const varianceValue = varianceQty * unitCost

      return {
        itemId: entry.itemId,
        itemName: itm?.name || "Item",
        systemQty,
        countedQty,
        varianceQty,
        unitCost,
        varianceValue
      }
    })

    const auditNo = `AUD-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(stockAudits.length + 1).padStart(2, "0")}`
    const newAudit: StockAudit = {
      id: `adt-${Date.now()}`,
      auditNo,
      date: new Date().toISOString().split("T")[0],
      godownId,
      godownName: godown.name,
      category: category || "General Inventory",
      status: "review",
      items: auditItems
    }

    setStockAudits(prev => [newAudit, ...prev])
    return { success: true, message: `Stock Audit ${auditNo} recorded successfully as Pending Review!`, audit: newAudit }
  }

  // Stock Audit Approval (PRD INV-16, F7)
  const approveStockAudit = (auditId: string) => {
    const audit = stockAudits.find(a => a.id === auditId)
    if (!audit) return { success: false, message: "Audit not found." }
    if (audit.status === "approved") return { success: false, message: "Audit is already approved." }

    const actorName = `${roleConfig.name} (${roleConfig.title})`
    const newMovements: StockMovement[] = []

    const updatedItems = items.map(itm => {
      const auditedItem = audit.items.find(ai => ai.itemId === itm.id)
      if (!auditedItem || auditedItem.varianceQty === 0) return itm

      const godownQty = itm.stockByGodown[audit.godownId] || 0
      const variance = auditedItem.varianceQty

      newMovements.push({
        id: `mov-${Date.now()}-${itm.id}-audit`,
        timestamp: new Date().toLocaleString(),
        itemId: itm.id,
        itemName: itm.name,
        movementType: variance > 0 ? "adjustment_add" : "adjustment_reduce",
        qtyChange: variance,
        previousStock: itm.currentStock,
        newStock: itm.currentStock + variance,
        godownId: audit.godownId,
        godownName: audit.godownName,
        refDocNo: audit.auditNo,
        actor: actorName,
        reason: `Physical Count Reconciliation variance (${variance > 0 ? "+" : ""}${variance})`
      })

      return {
        ...itm,
        currentStock: itm.currentStock + variance,
        stockByGodown: {
          ...itm.stockByGodown,
          [audit.godownId]: godownQty + variance
        }
      }
    })

    setItems(updatedItems)
    setStockMovements(prev => [...newMovements, ...prev])
    setStockAudits(prev => prev.map(a => a.id === auditId ? { ...a, status: "approved", approvedBy: actorName, approvedAt: new Date().toLocaleString() } : a))

    return { success: true, message: `Audit ${audit.auditNo} approved! Variances posted to stock ledger.` }
  }

  // Manufacture Finished Item (PRD 6.1A, F4, MFG-02, MFG-03)
  const recordManufacture = (finishedItemId: string, qty: number, godownId: string, metadata?: { actor?: string; refDocNo?: string; reason?: string }) => {
    const finishedItem = items.find(i => i.id === finishedItemId)
    if (!finishedItem || !finishedItem.bom) {
      return { success: false, message: "Selected item does not have a Bill of Materials configured." }
    }

    // Check shortage for each raw material in the BOM
    for (const bomItem of finishedItem.bom) {
      const neededQty = bomItem.qty * qty
      const rawItem = items.find(i => i.id === bomItem.rawItemId)
      if (!rawItem) {
        return { success: false, message: `Raw material not found: ${bomItem.rawItemName}` }
      }
      const availableRaw = rawItem.stockByGodown[godownId] || 0
      if (availableRaw < neededQty) {
        return {
          success: false,
          message: `Shortage of raw material "${rawItem.name}". Needed: ${neededQty} ${rawItem.unit}, Available in godown: ${availableRaw} ${rawItem.unit}`
        }
      }
    }

    const godownName = godowns.find(g => g.id === godownId)?.name || "Godown"
    const actorName = metadata?.actor || `${roleConfig.name} (${roleConfig.title})`
    const mfgDoc = metadata?.refDocNo || `MFG-${Date.now().toString().slice(-4)}`
    const mfgReason = metadata?.reason || "Standard BOM Production Batch"

    // Atomically consume raw materials and increment finished goods
    const newMovements: StockMovement[] = []
    const updatedItems = items.map(itm => {
      // Check if raw material to consume
      const bomLine = finishedItem.bom?.find(b => b.rawItemId === itm.id)
      if (bomLine) {
        const consumeQty = bomLine.qty * qty
        const curStock = itm.stockByGodown[godownId] || 0
        newMovements.push({
          id: `mov-${Date.now()}-raw-${itm.id}`,
          timestamp: new Date().toLocaleString(),
          itemId: itm.id,
          itemName: itm.name,
          movementType: "mfg_consumption",
          qtyChange: -consumeQty,
          previousStock: itm.currentStock,
          newStock: itm.currentStock - consumeQty,
          godownId,
          godownName,
          refDocNo: mfgDoc,
          actor: actorName,
          reason: `${mfgReason} (Consumed for ${qty}x ${finishedItem.name})`
        })
        return {
          ...itm,
          currentStock: itm.currentStock - consumeQty,
          stockByGodown: {
            ...itm.stockByGodown,
            [godownId]: curStock - consumeQty
          }
        }
      }

      // Check if finished good
      if (itm.id === finishedItemId) {
        const curStock = itm.stockByGodown[godownId] || 0
        newMovements.push({
          id: `mov-${Date.now()}-fg-${itm.id}`,
          timestamp: new Date().toLocaleString(),
          itemId: itm.id,
          itemName: itm.name,
          movementType: "mfg_output",
          qtyChange: qty,
          previousStock: itm.currentStock,
          newStock: itm.currentStock + qty,
          godownId,
          godownName,
          refDocNo: mfgDoc,
          actor: actorName,
          reason: mfgReason
        })
        return {
          ...itm,
          currentStock: itm.currentStock + qty,
          stockByGodown: {
            ...itm.stockByGodown,
            [godownId]: curStock + qty
          }
        }
      }

      return itm
    })

    setItems(updatedItems)
    setStockMovements(prev => [...newMovements, ...prev])

    return {
      success: true,
      message: `Production recorded! Produced ${qty} ${finishedItem.unit} of "${finishedItem.name}" and consumed raw materials according to BOM.`
    }
  }

  // Create Job Work Challan (External Subcontracting / Processing)
  const createJobWork = (jobWorkData: {
    workerName: string
    finishedItemId: string
    expectedQty: number
    godownId: string
    jobWorkCharges: number
    date: string
    vehicleNo?: string
    transporter?: string
    expectedReturnDate?: string
    notes?: string
    termsAndConditions?: string
    partyGstin?: string
    partyAddress?: string
    customLines?: Array<{ itemId: string; qty: number; rate?: number; unit?: string }>
  }) => {
    const finishedItem = items.find(i => i.id === jobWorkData.finishedItemId)
    if (!finishedItem) {
      return { success: false, message: "Finished item not found." }
    }

    const dispatchLines = (jobWorkData.customLines && jobWorkData.customLines.length > 0)
      ? jobWorkData.customLines
      : (finishedItem.bom || []).map(b => ({ itemId: b.rawItemId, qty: b.qty * jobWorkData.expectedQty }))

    // Check shortage for each raw material in BOM or custom lines
    for (const line of dispatchLines) {
      const rawItem = items.find(i => i.id === line.itemId)
      if (!rawItem) {
        return { success: false, message: `Raw material not found in item catalog.` }
      }
      const availableRaw = rawItem.stockByGodown[jobWorkData.godownId] || 0
      if (availableRaw < line.qty) {
        return {
          success: false,
          message: `Shortage of raw material "${rawItem.name}". Needed: ${line.qty} ${rawItem.unit}, Available: ${availableRaw} ${rawItem.unit}`
        }
      }
    }

    const godownName = godowns.find(g => g.id === jobWorkData.godownId)?.name || "Godown"
    const actorName = `${roleConfig.name} (${roleConfig.title})`
    const jobNo = `JW-2026-${String(jobWorks.length + 15).padStart(4, "0")}`

    const rawMaterialsSent: Array<{
      itemId: string
      itemName: string
      qty: number
      rate?: number
      unit?: string
      hsn?: string
    }> = []
    const newMovements: StockMovement[] = []

    const updatedItems = items.map(itm => {
      const line = dispatchLines.find(l => l.itemId === itm.id)
      if (line) {
        const consumeQty = line.qty
        const customLine = dispatchLines.find(l => l.itemId === itm.id) as any
        rawMaterialsSent.push({
          itemId: itm.id,
          itemName: itm.name,
          qty: consumeQty,
          rate: customLine?.rate || itm.purchasePrice || 0,
          unit: customLine?.unit || itm.unit || "PCS",
          hsn: itm.hsn || "8471"
        })
        const curStock = itm.stockByGodown[jobWorkData.godownId] || 0
        newMovements.push({
          id: `mov-${Date.now()}-jw-${itm.id}`,
          timestamp: new Date().toLocaleString(),
          itemId: itm.id,
          itemName: itm.name,
          movementType: "transfer_out",
          qtyChange: -consumeQty,
          previousStock: itm.currentStock,
          newStock: itm.currentStock - consumeQty,
          godownId: jobWorkData.godownId,
          godownName,
          refDocNo: jobNo,
          actor: actorName,
          reason: `Job Work raw materials dispatched to ${jobWorkData.workerName} ${jobWorkData.vehicleNo ? `(${jobWorkData.vehicleNo})` : ""}`
        })
        return {
          ...itm,
          currentStock: itm.currentStock - consumeQty,
          stockByGodown: {
            ...itm.stockByGodown,
            [jobWorkData.godownId]: curStock - consumeQty
          }
        }
      }
      return itm
    })

    const newJobWork: JobWork = {
      id: `jw-${Date.now()}`,
      jobNo,
      date: jobWorkData.date || new Date().toISOString().split("T")[0],
      workerName: jobWorkData.workerName,
      finishedItemId: finishedItem.id,
      finishedItemName: finishedItem.name,
      expectedQty: jobWorkData.expectedQty,
      receivedQty: 0,
      status: "open",
      rawMaterialsSent,
      jobWorkCharges: jobWorkData.jobWorkCharges,
      vehicleNo: jobWorkData.vehicleNo,
      transporter: jobWorkData.transporter,
      godownId: jobWorkData.godownId,
      godownName,
      expectedReturnDate: jobWorkData.expectedReturnDate,
      customerNotes: jobWorkData.notes,
      termsAndConditions: jobWorkData.termsAndConditions,
      partyGstin: jobWorkData.partyGstin,
      partyAddress: jobWorkData.partyAddress
    }

    setItems(updatedItems)
    setStockMovements(prev => [...newMovements, ...prev])
    setJobWorks(prev => [newJobWork, ...prev])

    return {
      success: true,
      message: `Job Work Challan ${jobNo} generated successfully for ${jobWorkData.workerName}!`,
      jobNo
    }
  }

  const receiveJobWork = (jobWorkId: string, receivedQty?: number, targetGodownId?: string) => {
    const jw = jobWorks.find(j => j.id === jobWorkId)
    if (!jw) return { success: false, message: "Job Work Challan not found." }

    const qtyToReceive = receivedQty !== undefined ? receivedQty : jw.expectedQty
    const godownToReceive = targetGodownId || jw.godownId || godowns[0]?.id || "gdn-1"
    const targetGodown = godowns.find(g => g.id === godownToReceive)
    const godownName = targetGodown?.name || "Main Warehouse"
    const actorName = `${roleConfig.name} (${roleConfig.title})`

    const updatedItems = items.map(itm => {
      if (itm.id === jw.finishedItemId) {
        const curStock = itm.stockByGodown[godownToReceive] || 0
        return {
          ...itm,
          currentStock: itm.currentStock + qtyToReceive,
          stockByGodown: {
            ...itm.stockByGodown,
            [godownToReceive]: curStock + qtyToReceive
          }
        }
      }
      return itm
    })

    const newMovement: StockMovement = {
      id: `mov-${Date.now()}-jw-recv`,
      timestamp: new Date().toLocaleString(),
      itemId: jw.finishedItemId,
      itemName: jw.finishedItemName,
      movementType: "transfer_in",
      qtyChange: qtyToReceive,
      previousStock: items.find(i => i.id === jw.finishedItemId)?.currentStock || 0,
      newStock: (items.find(i => i.id === jw.finishedItemId)?.currentStock || 0) + qtyToReceive,
      godownId: godownToReceive,
      godownName,
      refDocNo: jw.jobNo,
      actor: actorName,
      reason: `Received finished goods from Job Worker ${jw.workerName} against challan ${jw.jobNo}`
    }

    const updatedJobWorks = jobWorks.map(j => {
      if (j.id === jobWorkId) {
        return {
          ...j,
          status: "received" as const,
          receivedQty: qtyToReceive
        }
      }
      return j
    })

    setItems(updatedItems)
    setStockMovements(prev => [newMovement, ...prev])
    setJobWorks(updatedJobWorks)

    return {
      success: true,
      message: `Successfully received ${qtyToReceive} units of ${jw.finishedItemName} from ${jw.workerName}!`
    }
  }

  // Add Item (PRD ITM-01)
  const addItem = (itemData: Omit<Item, "id" | "currentStock">) => {
    // Check duplicates
    if (items.some(i => i.code.toLowerCase() === itemData.code.toLowerCase())) {
      return { success: false, message: `An item with SKU code "${itemData.code}" already exists.` }
    }
    if (itemData.category && itemData.category.trim()) {
      addCategory(itemData.category.trim())
    }
    if (itemData.unit && itemData.unit.trim()) {
      addUnit(itemData.unit.trim())
    }
    const totalOpening = Object.values(itemData.stockByGodown || {}).reduce((a, b) => a + b, 0)
    const newItem: Item = {
      ...itemData,
      id: `itm-${Date.now()}`,
      currentStock: totalOpening
    }
    setItems(prev => [newItem, ...prev])
    return { success: true, message: `Item "${newItem.name}" added successfully.`, item: newItem }
  }

  // Update Item (Edit Item with duplicate SKU check and state sync)
  const updateItem = (id: string, updates: Partial<Item>) => {
    const existing = items.find(i => i.id === id)
    if (!existing) {
      return { success: false, message: "Item not found." }
    }

    if (updates.category && updates.category.trim()) {
      addCategory(updates.category.trim())
    }
    if (updates.unit && updates.unit.trim()) {
      addUnit(updates.unit.trim())
    }

    // Check duplicate code if code was updated
    if (updates.code && updates.code.trim().toLowerCase() !== existing.code.toLowerCase()) {
      if (items.some(i => i.id !== id && i.code.toLowerCase() === updates.code!.trim().toLowerCase())) {
        return { success: false, message: `An item with SKU code "${updates.code}" already exists.` }
      }
    }

    // Preserve stock unless specifically updated
    const updatedStockByGodown = updates.stockByGodown || existing.stockByGodown || {}
    const calculatedCurrentStock = updates.currentStock !== undefined
      ? updates.currentStock
      : (updates.stockByGodown ? Object.values(updatedStockByGodown).reduce((a, b) => a + b, 0) : existing.currentStock)

    const updatedItem: Item = {
      ...existing,
      ...updates,
      id, // Preserve authoritative ID
      currentStock: calculatedCurrentStock,
      stockByGodown: updatedStockByGodown
    }

    setItems(prev => prev.map(i => {
      if (i.id === id) return updatedItem
      // If item is a manufactured product and its BOM contains the updated raw material, auto-sync the recipe unitCost
      if (i.isManufactured && i.bom && i.bom.some(b => b.rawItemId === id)) {
        return {
          ...i,
          bom: i.bom.map(b => {
            if (b.rawItemId !== id) return b
            return {
              ...b,
              rawItemName: updates.name ? updates.name.trim() : b.rawItemName,
              unit: updates.unit || b.unit,
              unitCost: updates.purchasePrice !== undefined ? updates.purchasePrice : b.unitCost
            }
          })
        }
      }
      return i
    }))
    return { success: true, message: `Item "${updatedItem.name}" updated successfully.`, item: updatedItem }
  }

  const addBatchToItem = (itemId: string, newBatch: ItemBatch) => {
    const target = items.find(i => i.id === itemId)
    if (!target) {
      return { success: false, message: "Item not found" }
    }

    const cleanBatchNo = newBatch.batchNo ? newBatch.batchNo.trim().toUpperCase() : ""
    if (!cleanBatchNo) {
      return { success: false, message: "Batch number is required." }
    }

    const qtyToAdd = Number(newBatch.quantity) || 0
    const targetGodownId = newBatch.godownId || godowns[0]?.id || "godown-1"
    const targetGodown = godowns.find(g => g.id === targetGodownId)
    const godownName = targetGodown?.name || "Main Warehouse"

    let updatedBatches: ItemBatch[] = target.batchDetails ? [...target.batchDetails] : []
    const existingIndex = updatedBatches.findIndex(b => b.batchNo.trim().toUpperCase() === cleanBatchNo)

    if (existingIndex >= 0) {
      const prevInitial = updatedBatches[existingIndex].initialQuantity ?? updatedBatches[existingIndex].quantity
      updatedBatches[existingIndex] = {
        ...updatedBatches[existingIndex],
        quantity: updatedBatches[existingIndex].quantity + qtyToAdd,
        initialQuantity: prevInitial + qtyToAdd,
        manufacturingDate: newBatch.manufacturingDate || updatedBatches[existingIndex].manufacturingDate,
        expiryDate: newBatch.expiryDate || updatedBatches[existingIndex].expiryDate,
        godownId: targetGodownId,
        purchasePrice: newBatch.purchasePrice !== undefined ? newBatch.purchasePrice : updatedBatches[existingIndex].purchasePrice,
        costPrice: newBatch.costPrice !== undefined ? newBatch.costPrice : (newBatch.purchasePrice !== undefined ? newBatch.purchasePrice : updatedBatches[existingIndex].costPrice),
        salePrice: newBatch.salePrice !== undefined ? newBatch.salePrice : updatedBatches[existingIndex].salePrice
      }
    } else {
      updatedBatches.push({
        ...newBatch,
        batchNo: cleanBatchNo,
        quantity: qtyToAdd,
        initialQuantity: newBatch.initialQuantity ?? qtyToAdd,
        godownId: targetGodownId,
        purchasePrice: newBatch.purchasePrice ?? newBatch.costPrice ?? target.purchasePrice,
        costPrice: newBatch.costPrice ?? newBatch.purchasePrice ?? target.purchasePrice,
        salePrice: newBatch.salePrice ?? target.salePrice
      })
    }

    const prevStock = target.currentStock
    const nextStock = prevStock + qtyToAdd
    const prevGodownStock = target.stockByGodown[targetGodownId] || 0
    const nextGodownStock = prevGodownStock + qtyToAdd

    const updatedItem: Item = {
      ...target,
      hasBatch: true,
      enableWholesale: false,
      batchDetails: updatedBatches,
      currentStock: nextStock,
      stockByGodown: {
        ...target.stockByGodown,
        [targetGodownId]: nextGodownStock
      }
    }

    setItems(prev => prev.map(i => i.id === itemId ? updatedItem : i))

    if (qtyToAdd > 0) {
      const movement: StockMovement = {
        id: `mov-${Date.now()}-${target.id}`,
        timestamp: new Date().toLocaleString(),
        itemId: target.id,
        itemName: target.name,
        movementType: "adjustment_add",
        qtyChange: qtyToAdd,
        previousStock: prevStock,
        newStock: nextStock,
        godownId: targetGodownId,
        godownName,
        refDocNo: cleanBatchNo,
        actor: `${roleConfig.name} (${roleConfig.title})`,
        reason: `Restocked / Added batch ${cleanBatchNo}`,
        batchNo: cleanBatchNo
      }
      setStockMovements(prev => [movement, ...prev])
    }

    return { success: true, message: `Batch ${cleanBatchNo} successfully added to ${target.name}.` }
  }

  // Bulk Add Items (from Vyapar, Zoho, myBillBook, Tally, or Excel)
  const addBulkItems = (newItemsData: Array<Omit<Item, "id" | "currentStock">>) => {
    let addedCount = 0
    let skippedCount = 0
    const itemsToAdd: Item[] = []

    newItemsData.forEach((itemData, idx) => {
      const isDuplicate = items.some(i => i.code.toLowerCase() === itemData.code.toLowerCase()) ||
        itemsToAdd.some(i => i.code.toLowerCase() === itemData.code.toLowerCase())
      if (isDuplicate) {
        skippedCount++
        return
      }
      const totalOpening = Object.values(itemData.stockByGodown || {}).reduce((a, b) => a + b, 0)
      itemsToAdd.push({
        ...itemData,
        id: `itm-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
        currentStock: totalOpening
      })
      addedCount++
    })

    if (itemsToAdd.length > 0) {
      setItems(prev => [...itemsToAdd, ...prev])
    }

    return {
      success: addedCount > 0,
      addedCount,
      skippedCount,
      message: `Successfully imported ${addedCount} items${skippedCount > 0 ? ` (${skippedCount} duplicate SKU codes skipped)` : ""}.`
    }
  }

  // Add Party (PRD PTY-02)
  const addParty = (partyData: Omit<Party, "id">) => {
    const cleanPhone = partyData.phone ? partyData.phone.trim() : ""
    if (cleanPhone && cleanPhone !== "+91 98765 00000" && parties.some(p => p.phone && p.phone.trim() === cleanPhone)) {
      return { success: false, message: `A party with phone number ${partyData.phone} already exists.` }
    }
    const newParty: Party = {
      ...partyData,
      id: `pty-${Date.now()}`
    }
    setParties(prev => [newParty, ...prev])
    return { success: true, message: `Party "${newParty.name}" added successfully.` }
  }

  // Update Party (e.g. edit currency, terms, details)
  const updateParty = (id: string, updates: Partial<Party>) => {
    const cleanPhone = updates.phone ? updates.phone.trim() : ""
    if (cleanPhone && cleanPhone !== "+91 98765 00000" && parties.some(p => p.id !== id && p.phone && p.phone.trim() === cleanPhone)) {
      return { success: false, message: `Another party with phone number ${updates.phone} already exists.` }
    }
    setParties(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
    return { success: true, message: "Party updated successfully." }
  }

  // Record Payment (Payment In / Payment Out)
  const recordPayment = (paymentData: Omit<PaymentRecord, "id" | "paymentNo" | "createdBy">) => {
    const actorName = `${roleConfig.name} (${roleConfig.title})`
    const isPaymentIn = paymentData.type === "payment_in"
    const prefix = isPaymentIn ? "PAY-IN-2026" : "PAY-OUT-2026"
    const nextSeq = String(payments.filter(p => p.type === paymentData.type).length + 1).padStart(4, "0")
    const generatedPaymentNo = `${prefix}-${nextSeq}`
    const newId = `pmt-${Date.now()}`

    const party = parties.find(p => p.id === paymentData.partyId)
    const linkedDoc = isPaymentIn
      ? salesDocs.find(d => d.id === paymentData.docId)
      : purchaseDocs.find(b => b.id === paymentData.docId)

    const paymentCurrency = paymentData.currency || linkedDoc?.currency || party?.currency || "INR"
    const paymentCurrencySymbol = paymentData.currencySymbol || linkedDoc?.currencySymbol || party?.currencySymbol || (paymentCurrency === "USD" ? "$" : paymentCurrency === "EUR" ? "€" : paymentCurrency === "GBP" ? "£" : paymentCurrency === "AED" ? "AED" : "₹")
    const paymentExchangeRate = paymentData.exchangeRate || linkedDoc?.exchangeRate || 1

    const newPayment: PaymentRecord = {
      ...paymentData,
      currency: paymentCurrency,
      currencySymbol: paymentCurrencySymbol,
      exchangeRate: paymentExchangeRate,
      id: newId,
      paymentNo: generatedPaymentNo,
      createdBy: actorName,
      status: paymentData.status || "completed"
    }

    // If Payment In is linked to a sales invoice
    if (isPaymentIn && paymentData.docId) {
      setSalesDocs(prev => prev.map(doc => {
        if (doc.id !== paymentData.docId) return doc
        const newPaid = (doc.paidAmount || 0) + paymentData.amount
        const newBalance = Math.max(0, doc.grandTotal - newPaid)
        return {
          ...doc,
          paidAmount: newPaid,
          balanceAmount: newBalance,
          status: newBalance <= 0 ? "paid" : "partial"
        }
      }))
    }

    // If Payment Out is linked to a purchase bill
    if (!isPaymentIn && paymentData.docId) {
      setPurchaseDocs(prev => prev.map(doc => {
        if (doc.id !== paymentData.docId) return doc
        const newPaid = (doc.paidAmount || 0) + paymentData.amount
        return {
          ...doc,
          paidAmount: newPaid,
          status: newPaid >= doc.grandTotal ? "posted" : doc.status
        }
      }))
    }

    // Sync party outstanding balances
    setParties(prev => prev.map(p => {
      const isMatch = p.id === paymentData.partyId || (paymentData.partyName && p.name.trim().toLowerCase() === paymentData.partyName.trim().toLowerCase())
      if (!isMatch) return p
      if (isPaymentIn) {
        // Customer paid us: reduce customer receivable balance
        return { ...p, balance: p.balance - paymentData.amount }
      } else {
        // We paid vendor: reduce vendor payable liability (moves negative balance towards 0)
        return { ...p, balance: p.balance + paymentData.amount }
      }
    }))

    setPayments(prev => [newPayment, ...prev])

    return {
      success: true,
      message: `${isPaymentIn ? "Payment Received" : "Payment Made"} of ${paymentCurrencySymbol}${paymentData.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} recorded successfully (${generatedPaymentNo}).`,
      paymentNo: generatedPaymentNo
    }
  }

  const deleteSalesOrder = (id: string) => {
    const order = salesOrders.find(o => o.id === id)
    setSalesOrders(prev => prev.filter(o => o.id !== id))
    return { success: true, message: `Sales Order ${order?.orderNo || id} deleted successfully.` }
  }

  const deleteSalesInvoice = (id: string) => {
    const inv = salesDocs.find(i => i.id === id)
    if (inv) {
      if (inv.balanceAmount > 0) {
        setParties(prev => prev.map(p => {
          const isMatch = p.id === inv.partyId || (inv.partyName && p.name.trim().toLowerCase() === inv.partyName.trim().toLowerCase())
          if (!isMatch) return p
          return { ...p, balance: Math.max(0, p.balance - inv.balanceAmount) }
        }))
      }

      // Restore item, godown, and batch stock
      if (inv.items && inv.items.length > 0) {
        setItems(prevItems => prevItems.map(itm => {
          const itemLines = inv.items.filter(l => l.itemId === itm.id)
          if (itemLines.length === 0) return itm

          const totalRestoredQty = itemLines.reduce((sum, l) => sum + l.qty, 0)
          let updatedBatches = itm.batchDetails ? [...itm.batchDetails] : undefined
          if (updatedBatches) {
            for (const line of itemLines) {
              if (line.batchNo) {
                const cleanBNo = line.batchNo.trim().toUpperCase()
                updatedBatches = updatedBatches.map(b => {
                  if (b.batchNo.trim().toUpperCase() === cleanBNo) {
                    return { ...b, quantity: b.quantity + line.qty }
                  }
                  return b
                })
              }
            }
          }

          const currentInGodown = itm.stockByGodown[inv.godownId] || 0
          return {
            ...itm,
            currentStock: itm.currentStock + totalRestoredQty,
            batchDetails: updatedBatches,
            stockByGodown: {
              ...itm.stockByGodown,
              [inv.godownId]: currentInGodown + totalRestoredQty
            }
          }
        }))
      }
    }
    // Remove any payments linked to this deleted invoice
    setPayments(prev => prev.filter(p => p.docId !== id && p.docNo !== inv?.docNo))
    setSalesDocs(prev => prev.filter(i => i.id !== id))
    return { success: true, message: `Invoice ${inv?.docNo || id} deleted successfully.` }
  }

  const deleteDeliveryChallan = (id: string) => {
    const challan = deliveryChallans.find(c => c.id === id)
    if (challan && challan.items && challan.items.length > 0) {
      setItems(prevItems => prevItems.map(itm => {
        const itemLines = challan.items.filter(l => l.itemId === itm.id)
        if (itemLines.length === 0) return itm

        const totalRestoredQty = itemLines.reduce((sum, l) => sum + l.qty, 0)
        let updatedBatches = itm.batchDetails ? [...itm.batchDetails] : undefined
        if (updatedBatches) {
          for (const line of itemLines) {
            if (line.batchNo) {
              const cleanBNo = line.batchNo.trim().toUpperCase()
              updatedBatches = updatedBatches.map(b => {
                if (b.batchNo.trim().toUpperCase() === cleanBNo) {
                  return { ...b, quantity: b.quantity + line.qty }
                }
                return b
              })
            }
          }
        }

        const currentInGodown = itm.stockByGodown[challan.godownId] || 0
        return {
          ...itm,
          currentStock: itm.currentStock + totalRestoredQty,
          batchDetails: updatedBatches,
          stockByGodown: {
            ...itm.stockByGodown,
            [challan.godownId]: currentInGodown + totalRestoredQty
          }
        }
      }))
    }
    setDeliveryChallans(prev => prev.filter(c => c.id !== id))
    return { success: true, message: `Delivery Challan ${challan?.challanNo || id} deleted successfully.` }
  }

  const createPurchaseBill = (billData: Omit<PurchaseDocument, "id" | "docNo" | "date" | "createdBy"> & { docNo?: string; date?: string }) => {
    let nextDocNum = billData.docNo
    if (!nextDocNum) {
      const existingNums = purchaseDocs
        .map(d => {
          const match = d.docNo?.match(/BILL-26-(\d+)/)
          return match ? parseInt(match[1], 10) : 0
        })
        .filter(n => !isNaN(n))
      const maxNum = existingNums.length > 0 ? Math.max(...existingNums) : 89
      const nextNum = Math.max(maxNum + 1, purchaseDocs.length + 89)
      nextDocNum = `BILL-26-${String(nextNum).padStart(4, "0")}`
    }
    const todayStr = billData.date || new Date().toISOString().split("T")[0]
    const actorName = `${roleConfig.name} (${roleConfig.title})`
    const targetGodown = godowns.find(g => g.id === billData.godownId)
    const godownName = targetGodown?.name || "Main Warehouse"

    const newDoc: PurchaseDocument = {
      ...billData,
      id: `pur-${Date.now()}`,
      docNo: nextDocNum,
      type: "bill",
      date: todayStr,
      godownName,
      createdBy: actorName
    }

    // Atomic stock increment for items received into godown
    const newMovements: StockMovement[] = []
    const updatedItems = items.map(itm => {
      const line = billData.items.find(l => l.itemId === itm.id)
      if (!line) return itm

      const prevQty = itm.currentStock
      const newQty = prevQty + line.qty
      const currentInGodown = itm.stockByGodown[billData.godownId] || 0

      // Inward batch stock allocation
      let updatedBatches: ItemBatch[] = itm.batchDetails ? [...itm.batchDetails] : []
      if (line.batchNo) {
        const cleanBNo = line.batchNo.trim().toUpperCase()
        const bIdx = updatedBatches.findIndex(b => b.batchNo.trim().toUpperCase() === cleanBNo)
        if (bIdx >= 0) {
          const prevInit = updatedBatches[bIdx].initialQuantity ?? updatedBatches[bIdx].quantity
          updatedBatches[bIdx] = {
            ...updatedBatches[bIdx],
            quantity: updatedBatches[bIdx].quantity + line.qty,
            initialQuantity: prevInit + line.qty,
            godownId: billData.godownId,
            purchasePrice: line.rate,
            costPrice: line.rate
          }
        } else {
          const nextYear = new Date()
          nextYear.setFullYear(nextYear.getFullYear() + 1)
          updatedBatches.push({
            batchNo: cleanBNo,
            manufacturingDate: line.manufacturingDate || todayStr,
            expiryDate: line.expiryDate || nextYear.toISOString().split("T")[0],
            quantity: line.qty,
            initialQuantity: line.qty,
            godownId: billData.godownId,
            purchasePrice: line.rate,
            costPrice: line.rate,
            salePrice: itm.salePrice
          })
        }
      }

      newMovements.push({
        id: `mov-${Date.now()}-${itm.id}`,
        timestamp: new Date().toLocaleString(),
        itemId: itm.id,
        itemName: itm.name,
        movementType: "purchase",
        qtyChange: line.qty,
        previousStock: prevQty,
        newStock: newQty,
        godownId: billData.godownId,
        godownName,
        refDocNo: nextDocNum,
        actor: actorName,
        reason: line.batchNo
          ? `Purchase Bill received from ${billData.partyName} (Batch: ${line.batchNo})`
          : `Purchase Bill received from ${billData.partyName} (Vendor Inv: ${billData.vendorInvoiceNo || "N/A"})`,
        batchNo: line.batchNo
      })

      // Inventory Valuation Calculation (FIFO vs Weighted Average Cost)
      let updatedPurchasePrice = itm.purchasePrice
      if (line.rate > 0) {
        if (itm.valuationMethod === "Weighted Average") {
          // Weighted Average Cost: (Existing Stock * Existing Cost + New Purchase Qty * New Rate) / (Existing Stock + New Qty)
          if (prevQty > 0) {
            updatedPurchasePrice = Number((((prevQty * (itm.purchasePrice || 0)) + (line.qty * line.rate)) / newQty).toFixed(2))
          } else {
            updatedPurchasePrice = line.rate
          }
        } else {
          // FIFO: Tracks latest lot / replacement cost
          updatedPurchasePrice = line.rate
        }
      }

      return {
        ...itm,
        currentStock: newQty,
        hasBatch: line.batchNo ? true : itm.hasBatch,
        batchDetails: updatedBatches.length > 0 ? updatedBatches : itm.batchDetails,
        purchasePrice: updatedPurchasePrice,
        stockByGodown: {
          ...itm.stockByGodown,
          [billData.godownId]: currentInGodown + line.qty
        }
      }
    })

    // Update vendor payable balance (increasing supplier payable liability)
    const unpaidAmount = Math.max(0, billData.grandTotal - (billData.paidAmount || 0))
    setParties(prev => prev.map(p => {
      const isMatch = p.id === billData.partyId || (billData.partyName && p.name.trim().toLowerCase() === billData.partyName.trim().toLowerCase())
      if (!isMatch) return p
      return {
        ...p,
        balance: p.balance - unpaidAmount
      }
    }))

    // If initial payment was recorded at bill creation time
    if ((billData.paidAmount || 0) > 0) {
      const pmtId = `pmt-${Date.now()}`
      const pmtNo = `PAY-OUT-2026-${String(payments.filter(p => p.type === "payment_out").length + 1).padStart(4, "0")}`
      const newPmt: PaymentRecord = {
        id: pmtId,
        paymentNo: pmtNo,
        type: "payment_out",
        partyId: billData.partyId,
        partyName: billData.partyName,
        amount: billData.paidAmount,
        date: todayStr,
        paymentMode: (billData.paymentMode as any) || "bank",
        paidFromAccount: "HDFC Current A/c (..4029)",
        docId: newDoc.id,
        docNo: nextDocNum,
        notes: `Immediate payment recorded for purchase bill ${nextDocNum}`,
        status: "completed",
        createdBy: actorName
      }
      setPayments(prev => [newPmt, ...prev])
    }

    setItems(updatedItems)
    setStockMovements(prev => [...newMovements, ...prev])
    setPurchaseDocs(prev => [newDoc, ...prev])

    return {
      success: true,
      message: `Purchase Bill ${nextDocNum} created successfully and inventory updated!`,
      docNo: nextDocNum,
      id: newDoc.id
    }
  }

  const updatePurchaseBill = (id: string, updates: Partial<PurchaseDocument>) => {
    setPurchaseDocs(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b))
    return { success: true, message: `Purchase Bill updated successfully.` }
  }

  const deletePurchaseBill = (id: string) => {
    const bill = purchaseDocs.find(b => b.id === id)
    if (bill) {
      const unpaid = Math.max(0, bill.grandTotal - (bill.paidAmount || 0))
      if (unpaid > 0) {
        setParties(prev => prev.map(p => {
          const isMatch = p.id === bill.partyId || (bill.partyName && p.name.trim().toLowerCase() === bill.partyName.trim().toLowerCase())
          if (!isMatch) return p
          return { ...p, balance: p.balance + unpaid }
        }))
      }

      // Revert stock added by this purchase bill
      if (bill.items && bill.items.length > 0) {
        setItems(prevItems => prevItems.map(itm => {
          const itemLines = bill.items.filter(l => l.itemId === itm.id)
          if (itemLines.length === 0) return itm

          const totalBillQty = itemLines.reduce((sum, l) => sum + l.qty, 0)
          let updatedBatches = itm.batchDetails ? [...itm.batchDetails] : undefined
          if (updatedBatches) {
            for (const line of itemLines) {
              if (line.batchNo) {
                const cleanBNo = line.batchNo.trim().toUpperCase()
                updatedBatches = updatedBatches.map(b => {
                  if (b.batchNo.trim().toUpperCase() === cleanBNo) {
                    return {
                      ...b,
                      quantity: Math.max(0, b.quantity - line.qty),
                      initialQuantity: b.initialQuantity !== undefined ? Math.max(0, b.initialQuantity - line.qty) : b.quantity
                    }
                  }
                  return b
                })
              }
            }
          }

          const currentInGodown = itm.stockByGodown[bill.godownId] || 0
          return {
            ...itm,
            currentStock: Math.max(0, itm.currentStock - totalBillQty),
            batchDetails: updatedBatches,
            stockByGodown: {
              ...itm.stockByGodown,
              [bill.godownId]: Math.max(0, currentInGodown - totalBillQty)
            }
          }
        }))
      }
    }
    setPurchaseDocs(prev => prev.filter(b => b.id !== id))
    return { success: true, message: `Purchase Bill ${bill?.docNo || id} deleted successfully.` }
  }

  const deletePayment = (id: string) => {
    const pmt = payments.find(p => p.id === id)
    setPayments(prev => prev.filter(p => p.id !== id))
    return { success: true, message: `Payment ${pmt?.paymentNo || id} deleted successfully.` }
  }

  const deleteItem = (id: string) => {
    const item = items.find(i => i.id === id)
    setItems(prev => prev.filter(i => i.id !== id))
    return { success: true, message: `Item ${item?.name || id} deleted successfully.` }
  }

  const deleteParty = (id: string) => {
    const party = parties.find(p => p.id === id)
    setParties(prev => prev.filter(p => p.id !== id))
    return { success: true, message: `Party ${party?.name || id} deleted successfully.` }
  }

  // Create Quotation (Pre-sale proposal, non-GST, 0 inventory deduction)
  const createQuotation = (quotationData: Omit<Quotation, "id" | "quotationNo">) => {
    const nextQuotationNo = `QT-26-00${quotations.length + 11}`
    const newQuotation: Quotation = {
      ...quotationData,
      id: `qt-${Date.now()}`,
      quotationNo: nextQuotationNo,
      createdAt: new Date().toISOString()
    }
    setQuotations(prev => [newQuotation, ...prev])
    return {
      success: true,
      message: `Quotation ${nextQuotationNo} created successfully!`,
      quotationNo: nextQuotationNo
    }
  }

  // Create Proforma Invoice (Preliminary commercial bill to request advance)
  const createProformaInvoice = (proformaData: Omit<ProformaInvoice, "id" | "proformaNo">) => {
    const nextProformaNo = `PI-26-00${proformaInvoices.length + 11}`
    const newProforma: ProformaInvoice = {
      ...proformaData,
      id: `pi-${Date.now()}`,
      proformaNo: nextProformaNo,
      createdAt: new Date().toISOString()
    }
    setProformaInvoices(prev => [newProforma, ...prev])
    return {
      success: true,
      message: `Proforma Invoice ${nextProformaNo} generated successfully!`,
      proformaNo: nextProformaNo
    }
  }

  // Convert Quotation to Confirmed Sales Order
  const convertQuotationToOrder = (quotationId: string) => {
    const qt = quotations.find(q => q.id === quotationId)
    if (!qt) return { success: false, message: "Quotation not found." }

    const res = createSalesOrder({
      date: new Date().toISOString().split("T")[0],
      expectedDeliveryDate: qt.validTillDate || new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
      partyId: qt.partyId,
      partyName: qt.partyName,
      partyGstin: qt.partyGstin,
      partyStateCode: qt.partyStateCode,
      godownId: qt.godownId,
      godownName: qt.godownName,
      items: qt.items,
      subtotal: qt.subtotal,
      taxTotal: qt.taxTotal,
      cgstTotal: qt.cgstTotal,
      sgstTotal: qt.sgstTotal,
      igstTotal: qt.igstTotal,
      roundOff: qt.roundOff,
      grandTotal: qt.grandTotal,
      currency: qt.currency,
      currencySymbol: qt.currencySymbol,
      exchangeRate: qt.exchangeRate,
      orderStatus: "confirmed",
      invoicedStatus: "not_invoiced",
      referenceNo: qt.quotationNo,
      notes: `Generated from Quotation ${qt.quotationNo}. ${qt.notes || ""}`
    })

    if (res.success) {
      setQuotations(prev => prev.map(q => {
        if (q.id !== quotationId) return q
        return { ...q, status: "converted", convertedDocNo: res.orderNo, convertedDocType: "order" }
      }))
    }
    return res
  }

  // Convert Quotation directly to Commercial Tax Invoice
  const convertQuotationToInvoice = (quotationId: string) => {
    const qt = quotations.find(q => q.id === quotationId)
    if (!qt) return { success: false, message: "Quotation not found." }

    const pos = qt.partyStateCode || business.stateCode || "27"
    const isInter = isInterStateTransaction(pos, business.stateCode || "27")

    const res = createSalesInvoice({
      type: "invoice",
      partyId: qt.partyId,
      partyName: qt.partyName,
      partyGstin: qt.partyGstin,
      partyStateCode: pos,
      placeOfSupply: pos,
      godownId: qt.godownId,
      godownName: qt.godownName,
      items: qt.items,
      subtotal: qt.subtotal,
      taxTotal: qt.taxTotal,
      cgstTotal: isInter ? 0 : (qt.cgstTotal || qt.taxTotal / 2),
      sgstTotal: isInter ? 0 : (qt.sgstTotal || qt.taxTotal / 2),
      igstTotal: isInter ? (qt.igstTotal || qt.taxTotal) : 0,
      roundOff: qt.roundOff || 0,
      grandTotal: qt.grandTotal,
      currency: qt.currency,
      currencySymbol: qt.currencySymbol,
      exchangeRate: qt.exchangeRate,
      paidAmount: 0,
      balanceAmount: qt.grandTotal,
      paymentMode: "credit",
      status: "pending",
      notes: `Direct billing against Quotation ${qt.quotationNo}`
    })

    if (res.success) {
      setQuotations(prev => prev.map(q => {
        if (q.id !== quotationId) return q
        return { ...q, status: "converted", convertedDocNo: res.docNo, convertedDocType: "invoice" }
      }))
    }
    return res
  }

  // Convert Proforma Invoice to Tax Invoice (Carrying forward advance payments)
  const convertProformaToInvoice = (proformaId: string) => {
    const pi = proformaInvoices.find(p => p.id === proformaId)
    if (!pi) return { success: false, message: "Proforma Invoice not found." }

    const advancePaid = pi.advanceReceived || 0
    const balance = Math.max(0, pi.grandTotal - advancePaid)
    const pos = pi.partyStateCode || business.stateCode || "27"
    const isInter = isInterStateTransaction(pos, business.stateCode || "27")

    const res = createSalesInvoice({
      type: "invoice",
      partyId: pi.partyId,
      partyName: pi.partyName,
      partyGstin: pi.partyGstin,
      partyStateCode: pos,
      placeOfSupply: pos,
      godownId: pi.godownId,
      godownName: pi.godownName,
      items: pi.items,
      subtotal: pi.subtotal,
      taxTotal: pi.taxTotal,
      cgstTotal: isInter ? 0 : (pi.cgstTotal || pi.taxTotal / 2),
      sgstTotal: isInter ? 0 : (pi.sgstTotal || pi.taxTotal / 2),
      igstTotal: isInter ? (pi.igstTotal || pi.taxTotal) : 0,
      roundOff: pi.roundOff || 0,
      grandTotal: pi.grandTotal,
      currency: pi.currency,
      currencySymbol: pi.currencySymbol,
      exchangeRate: pi.exchangeRate,
      paidAmount: advancePaid,
      balanceAmount: balance,
      paymentMode: advancePaid >= pi.grandTotal ? "upi" : "credit",
      status: balance === 0 ? "paid" : advancePaid > 0 ? "partial" : "pending",
      notes: `Converted from Proforma ${pi.proformaNo}. Advance adjusted: ₹${advancePaid}`
    })

    if (res.success) {
      setProformaInvoices(prev => prev.map(p => {
        if (p.id !== proformaId) return p
        return { ...p, status: "invoiced", linkedInvoiceId: res.docNo, linkedInvoiceNo: res.docNo }
      }))
    }
    return res
  }

  // Delete Quotation
  const deleteQuotation = (id: string) => {
    const qt = quotations.find(q => q.id === id)
    setQuotations(prev => prev.filter(q => q.id !== id))
    return { success: true, message: `Quotation ${qt?.quotationNo || id} deleted successfully.` }
  }

  // Delete Proforma Invoice
  const deleteProformaInvoice = (id: string) => {
    const pi = proformaInvoices.find(p => p.id === id)
    setProformaInvoices(prev => prev.filter(p => p.id !== id))
    return { success: true, message: `Proforma Invoice ${pi?.proformaNo || id} deleted successfully.` }
  }

  // Create Sales Return (SR-26-XXXX)
  const createSalesReturn = (returnData: Omit<SalesReturn, "id" | "returnNo">) => {
    const nextSeq = salesReturns.length + 1
    const returnNo = `SR-26-${String(nextSeq).padStart(4, "0")}`
    const newId = `sr-${Date.now()}`

    const newReturn: SalesReturn = {
      ...returnData,
      id: newId,
      returnNo,
    }

    // Add physical stock to Godown if condition is resalable or received
    if (returnData.status === "received") {
      setItems(prevItems => prevItems.map(item => {
        const returnedLine = returnData.items.find(l => l.itemId === item.id)
        if (!returnedLine) return item

        const godownId = returnData.receivingGodownId || activeGodownId || "godown-1"
        const currentGodownStock = item.stockByGodown?.[godownId] ?? item.currentStock

        let updatedBatches = item.batchDetails ? [...item.batchDetails] : undefined
        if (updatedBatches && (returnedLine as any).batchNo) {
          const cleanBNo = (returnedLine as any).batchNo.trim().toUpperCase()
          updatedBatches = updatedBatches.map(b => {
            if (b.batchNo.trim().toUpperCase() === cleanBNo) {
              return { ...b, quantity: b.quantity + returnedLine.qty }
            }
            return b
          })
        }

        return {
          ...item,
          currentStock: item.currentStock + returnedLine.qty,
          batchDetails: updatedBatches,
          stockByGodown: {
            ...item.stockByGodown,
            [godownId]: currentGodownStock + returnedLine.qty
          }
        }
      }))

      // Record Stock Movement
      for (const line of returnData.items) {
        setStockMovements(prev => [
          {
            id: `mov-${Date.now()}-${line.itemId}`,
            timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
            itemId: line.itemId,
            itemName: line.name,
            movementType: "sales_return",
            qtyChange: line.qty,
            previousStock: 0,
            newStock: line.qty,
            godownId: returnData.receivingGodownId,
            godownName: godowns.find(g => g.id === returnData.receivingGodownId)?.name || "Warehouse",
            refDocNo: returnNo,
            actor: roleConfig.name,
            reason: `Sales Return received (${returnData.reason})`
          },
          ...prev
        ])
      }
    }

    setSalesReturns(prev => [newReturn, ...prev])
    return { success: true, message: `Sales Return ${returnNo} created successfully.`, returnNo }
  }

  // Delete Sales Return
  const deleteSalesReturn = (id: string) => {
    const sr = salesReturns.find(s => s.id === id)
    setSalesReturns(prev => prev.filter(s => s.id !== id))
    return { success: true, message: `Sales Return ${sr?.returnNo || id} deleted successfully.` }
  }

  // Create Credit Note (CN-26-XXXX)
  const createCreditNote = (creditNoteData: Omit<CreditNote, "id" | "creditNoteNo">) => {
    const nextSeq = creditNotes.length + 1
    const creditNoteNo = `CN-26-${String(nextSeq).padStart(4, "0")}`
    const newId = `cn-${Date.now()}`

    const newCreditNote: CreditNote = {
      ...creditNoteData,
      id: newId,
      creditNoteNo,
    }

    // Direct physical stock return if marked returnToInventory
    if (creditNoteData.returnToInventory && creditNoteData.godownId) {
      setItems(prevItems => prevItems.map(item => {
        const line = creditNoteData.items.find(l => l.itemId === item.id)
        if (!line) return item
        const gId = creditNoteData.godownId!
        const curGStock = item.stockByGodown?.[gId] ?? item.currentStock

        let updatedBatches = item.batchDetails ? [...item.batchDetails] : undefined
        if (updatedBatches && (line as any).batchNo) {
          const cleanBNo = (line as any).batchNo.trim().toUpperCase()
          updatedBatches = updatedBatches.map(b => {
            if (b.batchNo.trim().toUpperCase() === cleanBNo) {
              return { ...b, quantity: b.quantity + line.qty }
            }
            return b
          })
        }

        return {
          ...item,
          currentStock: item.currentStock + line.qty,
          batchDetails: updatedBatches,
          stockByGodown: {
            ...item.stockByGodown,
            [gId]: curGStock + line.qty
          }
        }
      }))
    }

    // If linked to Sales Return, update the Sales Return
    if (creditNoteData.salesReturnId) {
      setSalesReturns(prev => prev.map(sr => {
        if (sr.id === creditNoteData.salesReturnId) {
          return { ...sr, creditNoteId: newId, creditNoteNo, status: "closed" }
        }
        return sr
      }))
    }

    setCreditNotes(prev => [newCreditNote, ...prev])
    return { success: true, message: `Credit Note ${creditNoteNo} issued successfully.`, creditNoteNo }
  }

  // Delete Credit Note
  const deleteCreditNote = (id: string) => {
    const cn = creditNotes.find(c => c.id === id)
    setCreditNotes(prev => prev.filter(c => c.id !== id))
    return { success: true, message: `Credit Note ${cn?.creditNoteNo || id} deleted successfully.` }
  }

  // Create Purchase Return (PR-26-XXXX)
  const createPurchaseReturn = (returnData: Omit<PurchaseReturn, "id" | "returnNo">) => {
    const nextSeq = purchaseReturns.length + 1
    const returnNo = `PR-26-${String(nextSeq).padStart(4, "0")}`
    const newId = `pr-${Date.now()}`

    const newReturn: PurchaseReturn = {
      ...returnData,
      id: newId,
      returnNo,
    }

    // Deduct physical stock from Godown
    setItems(prevItems => prevItems.map(item => {
      const line = returnData.items.find(l => l.itemId === item.id)
      if (!line) return item
      const gId = returnData.dispatchGodownId || activeGodownId || "godown-1"
      const curGStock = item.stockByGodown?.[gId] ?? item.currentStock

      let updatedBatches = item.batchDetails ? [...item.batchDetails] : undefined
      if (updatedBatches && (line as any).batchNo) {
        const cleanBNo = (line as any).batchNo.trim().toUpperCase()
        updatedBatches = updatedBatches.map(b => {
          if (b.batchNo.trim().toUpperCase() === cleanBNo) {
            return {
              ...b,
              quantity: Math.max(0, b.quantity - line.qty),
              initialQuantity: b.initialQuantity !== undefined ? Math.max(0, b.initialQuantity - line.qty) : b.quantity
            }
          }
          return b
        })
      }

      return {
        ...item,
        currentStock: Math.max(0, item.currentStock - line.qty),
        batchDetails: updatedBatches,
        stockByGodown: {
          ...item.stockByGodown,
          [gId]: Math.max(0, curGStock - line.qty)
        }
      }
    }))

    // Record Stock Movement
    for (const line of returnData.items) {
      setStockMovements(prev => [
        {
          id: `mov-${Date.now()}-${line.itemId}`,
          timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
          itemId: line.itemId,
          itemName: line.name,
          movementType: "purchase_return",
          qtyChange: -line.qty,
          previousStock: 0,
          newStock: 0,
          godownId: returnData.dispatchGodownId,
          godownName: godowns.find(g => g.id === returnData.dispatchGodownId)?.name || "Warehouse",
          refDocNo: returnNo,
          actor: roleConfig.name,
          reason: `Purchase Return dispatched to vendor (${returnData.reason})`
        },
        ...prev
      ])
    }

    setPurchaseReturns(prev => [newReturn, ...prev])
    return { success: true, message: `Purchase Return ${returnNo} recorded successfully.`, returnNo }
  }

  // Delete Purchase Return
  const deletePurchaseReturn = (id: string) => {
    const pr = purchaseReturns.find(p => p.id === id)
    setPurchaseReturns(prev => prev.filter(p => p.id !== id))
    return { success: true, message: `Purchase Return ${pr?.returnNo || id} deleted successfully.` }
  }

  // Create Debit Note (DN-26-XXXX)
  const createDebitNote = (debitNoteData: Omit<DebitNote, "id" | "debitNoteNo">) => {
    const nextSeq = debitNotes.length + 1
    const debitNoteNo = `DN-26-${String(nextSeq).padStart(4, "0")}`
    const newId = `dn-${Date.now()}`

    const newDebitNote: DebitNote = {
      ...debitNoteData,
      id: newId,
      debitNoteNo,
    }

    // If marked deductFromInventory directly
    if (debitNoteData.deductFromInventory && debitNoteData.godownId) {
      setItems(prevItems => prevItems.map(item => {
        const line = debitNoteData.items.find(l => l.itemId === item.id)
        if (!line) return item
        const gId = debitNoteData.godownId!
        const curGStock = item.stockByGodown?.[gId] ?? item.currentStock
        return {
          ...item,
          currentStock: Math.max(0, item.currentStock - line.qty),
          stockByGodown: {
            ...item.stockByGodown,
            [gId]: Math.max(0, curGStock - line.qty)
          }
        }
      }))
    }

    // If linked to Purchase Return, update the Purchase Return
    if (debitNoteData.purchaseReturnId) {
      setPurchaseReturns(prev => prev.map(pr => {
        if (pr.id === debitNoteData.purchaseReturnId) {
          return { ...pr, debitNoteId: newId, debitNoteNo, status: "closed" }
        }
        return pr
      }))
    }

    setDebitNotes(prev => [newDebitNote, ...prev])
    return { success: true, message: `Debit Note ${debitNoteNo} issued successfully.`, debitNoteNo }
  }

  // Delete Debit Note
  const deleteDebitNote = (id: string) => {
    const dn = debitNotes.find(d => d.id === id)
    setDebitNotes(prev => prev.filter(d => d.id !== id))
    return { success: true, message: `Debit Note ${dn?.debitNoteNo || id} deleted successfully.` }
  }

  // Apply Credit Note against an unpaid customer Invoice (OPEN -> APPLIED)
  const applyCreditNoteToInvoice = (creditNoteId: string, invoiceId: string, amount: number) => {
    const cn = creditNotes.find(c => c.id === creditNoteId)
    if (!cn) return { success: false, message: "Credit Note not found." }
    const inv = salesDocs.find(d => d.id === invoiceId)
    if (!inv) return { success: false, message: "Invoice not found." }

    const curUnpaid = inv.balanceAmount > 0 ? inv.balanceAmount : Math.max(0, inv.grandTotal - (inv.paidAmount || 0))
    const adjustAmt = Math.min(amount, cn.grandTotal, curUnpaid > 0 ? curUnpaid : cn.grandTotal)
    if (adjustAmt <= 0) return { success: false, message: "Adjustment amount must be greater than zero." }

    const newPaid = (inv.paidAmount || 0) + adjustAmt
    const newBalance = Math.max(0, inv.grandTotal - newPaid)
    const newDocStatus: "paid" | "partial" | "pending" = newBalance <= 0 ? "paid" : "partial"

    // 1. Update Invoice balance and status
    setSalesDocs(prev => prev.map(d => d.id === invoiceId ? {
      ...d,
      paidAmount: newPaid,
      balanceAmount: newBalance,
      status: newDocStatus
    } : d))

    // 2. Reduce Customer Party receivable balance
    setParties(prev => prev.map(p => {
      if (p.id === cn.customerId || p.name === cn.customerName) {
        return { ...p, balance: Math.max(0, (p.balance || 0) - adjustAmt) }
      }
      return p
    }))

    // 3. Update Credit Note status to APPLIED
    const today = new Date().toISOString().substring(0, 10)
    setCreditNotes(prev => prev.map(c => c.id === creditNoteId ? {
      ...c,
      status: "applied",
      appliedInvoiceId: inv.id,
      appliedInvoiceNo: inv.docNo,
      appliedAmount: adjustAmt,
      appliedDate: today,
      appliedMethod: "invoice_offset"
    } : c))

    return {
      success: true,
      message: `Credit Note ${cn.creditNoteNo} of ₹${adjustAmt.toLocaleString()} applied against Invoice ${inv.docNo}. Status updated to APPLIED.`
    }
  }

  // Refund Credit Note directly to customer (OPEN -> CLOSED)
  const refundCreditNote = (creditNoteId: string, paymentMode: "cash" | "bank" | "upi", refundNotes?: string) => {
    const cn = creditNotes.find(c => c.id === creditNoteId)
    if (!cn) return { success: false, message: "Credit Note not found." }

    const today = new Date().toISOString().substring(0, 10)
    setCreditNotes(prev => prev.map(c => c.id === creditNoteId ? {
      ...c,
      status: "closed",
      appliedAmount: cn.grandTotal,
      appliedDate: today,
      appliedMethod: "customer_refund",
      notes: refundNotes ? `${c.notes ? c.notes + " | " : ""}${refundNotes} (Refunded via ${paymentMode.toUpperCase()})` : c.notes
    } : c))

    return {
      success: true,
      message: `Credit Note ${cn.creditNoteNo} refunded via ${paymentMode.toUpperCase()} and marked as CLOSED.`
    }
  }

  // Manual Status Change for Credit Note
  const updateCreditNoteStatus = (creditNoteId: string, status: CreditNoteStatus) => {
    const cn = creditNotes.find(c => c.id === creditNoteId)
    if (!cn) return { success: false, message: "Credit Note not found." }

    setCreditNotes(prev => prev.map(c => c.id === creditNoteId ? {
      ...c,
      status
    } : c))

    return {
      success: true,
      message: `Credit Note ${cn.creditNoteNo} status updated to ${status.toUpperCase()}.`
    }
  }

  // Reopen Credit Note back to OPEN
  const reopenCreditNote = (creditNoteId: string) => {
    const cn = creditNotes.find(c => c.id === creditNoteId)
    if (!cn) return { success: false, message: "Credit Note not found." }

    if (cn.appliedInvoiceId && cn.appliedAmount) {
      setSalesDocs(prev => prev.map(d => {
        if (d.id === cn.appliedInvoiceId) {
          const revPaid = Math.max(0, (d.paidAmount || 0) - (cn.appliedAmount || 0))
          const revBalance = Math.max(0, d.grandTotal - revPaid)
          return {
            ...d,
            paidAmount: revPaid,
            balanceAmount: revBalance,
            status: revPaid <= 0 ? "pending" : "partial"
          }
        }
        return d
      }))
    }

    setCreditNotes(prev => prev.map(c => c.id === creditNoteId ? {
      ...c,
      status: "open",
      appliedInvoiceId: undefined,
      appliedInvoiceNo: undefined,
      appliedAmount: undefined,
      appliedDate: undefined,
      appliedMethod: undefined
    } : c))

    return {
      success: true,
      message: `Credit Note ${cn.creditNoteNo} reopened to OPEN status.`
    }
  }

  // Apply Debit Note against an outstanding Vendor Purchase Bill (OPEN -> APPLIED)
  const applyDebitNoteToBill = (debitNoteId: string, billId: string, amount: number) => {
    const dn = debitNotes.find(d => d.id === debitNoteId)
    if (!dn) return { success: false, message: "Debit Note not found." }
    const bill = purchaseDocs.find(d => d.id === billId)
    if (!bill) return { success: false, message: "Purchase Bill not found." }

    const curUnpaid = Math.max(0, bill.grandTotal - (bill.paidAmount || 0))
    const deductAmt = Math.min(amount, dn.grandTotal, curUnpaid > 0 ? curUnpaid : dn.grandTotal)
    if (deductAmt <= 0) return { success: false, message: "Deduction amount must be greater than zero." }

    const newPaid = (bill.paidAmount || 0) + deductAmt

    // 1. Update Purchase Bill paidAmount
    setPurchaseDocs(prev => prev.map(d => d.id === billId ? {
      ...d,
      paidAmount: newPaid,
      status: newPaid >= d.grandTotal ? "posted" : d.status
    } : d))

    // 2. Reduce Vendor accounts payable balance
    setParties(prev => prev.map(p => {
      if (p.id === dn.vendorId || p.name === dn.vendorName) {
        return { ...p, balance: (p.balance || 0) + deductAmt }
      }
      return p
    }))

    // 3. Update Debit Note status to APPLIED
    const today = new Date().toISOString().substring(0, 10)
    setDebitNotes(prev => prev.map(d => d.id === debitNoteId ? {
      ...d,
      status: "applied",
      appliedBillId: bill.id,
      appliedBillNo: bill.docNo,
      appliedAmount: deductAmt,
      appliedDate: today,
      appliedMethod: "bill_offset"
    } : d))

    return {
      success: true,
      message: `Debit Note ${dn.debitNoteNo} of ₹${deductAmt.toLocaleString()} deducted from Purchase Bill ${bill.docNo}. Status updated to APPLIED.`
    }
  }

  // Refund Debit Note directly from vendor (OPEN -> CLOSED)
  const refundDebitNote = (debitNoteId: string, paymentMode: "cash" | "bank" | "upi", refundNotes?: string) => {
    const dn = debitNotes.find(d => d.id === debitNoteId)
    if (!dn) return { success: false, message: "Debit Note not found." }

    const today = new Date().toISOString().substring(0, 10)
    setDebitNotes(prev => prev.map(d => d.id === debitNoteId ? {
      ...d,
      status: "closed",
      appliedAmount: dn.grandTotal,
      appliedDate: today,
      appliedMethod: "vendor_refund",
      notes: refundNotes ? `${d.notes ? d.notes + " | " : ""}${refundNotes} (Settled via ${paymentMode.toUpperCase()})` : d.notes
    } : d))

    return {
      success: true,
      message: `Debit Note ${dn.debitNoteNo} settled via ${paymentMode.toUpperCase()} refund and marked as CLOSED.`
    }
  }

  // Manual Status Change for Debit Note
  const updateDebitNoteStatus = (debitNoteId: string, status: DebitNoteStatus) => {
    const dn = debitNotes.find(d => d.id === debitNoteId)
    if (!dn) return { success: false, message: "Debit Note not found." }

    setDebitNotes(prev => prev.map(d => d.id === debitNoteId ? {
      ...d,
      status
    } : d))

    return {
      success: true,
      message: `Debit Note ${dn.debitNoteNo} status updated to ${status.toUpperCase()}.`
    }
  }

  // Reopen Debit Note back to OPEN
  const reopenDebitNote = (debitNoteId: string) => {
    const dn = debitNotes.find(d => d.id === debitNoteId)
    if (!dn) return { success: false, message: "Debit Note not found." }

    if (dn.appliedBillId && dn.appliedAmount) {
      setPurchaseDocs(prev => prev.map(d => {
        if (d.id === dn.appliedBillId) {
          const revPaid = Math.max(0, (d.paidAmount || 0) - (dn.appliedAmount || 0))
          return {
            ...d,
            paidAmount: revPaid
          }
        }
        return d
      }))
    }

    setDebitNotes(prev => prev.map(d => d.id === debitNoteId ? {
      ...d,
      status: "open",
      appliedBillId: undefined,
      appliedBillNo: undefined,
      appliedAmount: undefined,
      appliedDate: undefined,
      appliedMethod: undefined
    } : d))

    return {
      success: true,
      message: `Debit Note ${dn.debitNoteNo} reopened to OPEN status.`
    }
  }

  // Return Status Updates
  const updateSalesReturnStatus = (id: string, status: SalesReturnStatus) => {
    const sr = salesReturns.find(s => s.id === id)
    if (!sr) return { success: false, message: "Sales Return not found." }
    setSalesReturns(prev => prev.map(s => s.id === id ? { ...s, status } : s))
    return { success: true, message: `Sales Return ${sr.returnNo} status updated to ${status.toUpperCase()}.` }
  }

  const updatePurchaseReturnStatus = (id: string, status: PurchaseReturnStatus) => {
    const pr = purchaseReturns.find(p => p.id === id)
    if (!pr) return { success: false, message: "Purchase Return not found." }
    setPurchaseReturns(prev => prev.map(p => p.id === id ? { ...p, status } : p))
    return { success: true, message: `Purchase Return ${pr.returnNo} status updated to ${status.toUpperCase()}.` }
  }

  const updateJobWorkStatus = (id: string, status: JobWorkStatus) => {
    const jw = jobWorks.find(j => j.id === id)
    if (!jw) return { success: false, message: "Job Work not found." }
    setJobWorks(prev => prev.map(j => j.id === id ? { ...j, status } : j))
    return { success: true, message: `Job Work Challan ${jw.jobNo} status updated to ${status.toUpperCase()}.` }
  }

  // Bank Accounts Management
  const addBankAccount = (accountData: Omit<BankAccount, "id" | "createdAt">) => {
    const newId = `bank-${Date.now()}`
    const openingBal = Number(accountData.openingBalance) || 0
    const newAccount: BankAccount = {
      ...accountData,
      id: newId,
      openingBalance: openingBal,
      currentBalance: accountData.currentBalance !== undefined ? Number(accountData.currentBalance) : openingBal,
      createdAt: new Date().toISOString()
    }

    setBankAccounts(prev => {
      if (newAccount.isDefault || prev.length === 0) {
        newAccount.isDefault = true
        return [...prev.map(a => ({ ...a, isDefault: false })), newAccount]
      }
      return [...prev, newAccount]
    })

    return { success: true, message: `Bank account "${newAccount.accountDisplayName}" created successfully.`, id: newId }
  }

  const updateBankAccount = (id: string, updates: Partial<BankAccount>) => {
    setBankAccounts(prev => {
      const isDefaultChangedToTrue = updates.isDefault === true
      return prev.map(a => {
        if (a.id === id) {
          return { ...a, ...updates }
        }
        if (isDefaultChangedToTrue) {
          return { ...a, isDefault: false }
        }
        return a
      })
    })
    return { success: true, message: "Bank account updated successfully." }
  }

  const deleteBankAccount = (id: string) => {
    setBankAccounts(prev => {
      const remaining = prev.filter(a => a.id !== id)
      const wasDefault = prev.find(a => a.id === id)?.isDefault
      if (wasDefault && remaining.length > 0 && !remaining.some(a => a.isDefault)) {
        remaining[0] = { ...remaining[0], isDefault: true }
      }
      return remaining
    })
    return { success: true, message: "Bank account deleted." }
  }

  const setDefaultBankAccount = (id: string) => {
    setBankAccounts(prev => prev.map(a => ({
      ...a,
      isDefault: a.id === id,
      printBankDetailsOnInvoices: a.id === id ? true : a.printBankDetailsOnInvoices
    })))
    return { success: true, message: "Default bank account updated." }
  }

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
        userPhone,
        currentRole,
        roleConfig,
        roles,
        setCurrentRole,
        addCustomRole,
        updateRole,
        deleteCustomRole,
        resetRoleToDefault,
        canViewCostAndProfit,
        isModuleAllowed,
        teamUsers,
        inviteUser,
        updateTeamUser,
        deleteTeamUser,
        toggleUserStatus,
        loginAsUser,
        business,
        updateBusiness,
        godowns,
        addGodown,
        updateGodown,
        deleteGodown,
        activeGodownId,
        setActiveGodownId,
        items,
        categories,
        units,
        addCategory,
        addUnit,
        parties,
        salesDocs,
        salesOrders,
        deliveryChallans,
        quotations,
        proformaInvoices,
        salesReturns,
        creditNotes,
        purchaseReturns,
        debitNotes,
        purchaseDocs,
        stockMovements,
        stockAudits,
        jobWorks,
        payments,
        bankAccounts,
        addBankAccount,
        updateBankAccount,
        deleteBankAccount,
        setDefaultBankAccount,
        createSalesInvoice,
        createSalesOrder,
        createDeliveryChallan,
        createQuotation,
        createProformaInvoice,
        convertQuotationToOrder,
        convertQuotationToInvoice,
        convertProformaToInvoice,
        convertOrderToChallan,
        convertChallanToInvoice,
        convertOrderToInvoice,
        createSalesReturn,
        deleteSalesReturn,
        createCreditNote,
        deleteCreditNote,
        createPurchaseReturn,
        deletePurchaseReturn,
        createDebitNote,
        deleteDebitNote,
        applyCreditNoteToInvoice,
        refundCreditNote,
        updateCreditNoteStatus,
        reopenCreditNote,
        applyDebitNoteToBill,
        refundDebitNote,
        updateDebitNoteStatus,
        reopenDebitNote,
        updateSalesReturnStatus,
        updatePurchaseReturnStatus,
        createStockTransfer,
        createStockAdjustment,
        createStockAudit,
        approveStockAudit,
        recordManufacture,
        createJobWork,
        receiveJobWork,
        updateJobWorkStatus,
        addItem,
        updateItem,
        addBatchToItem,
        addBulkItems,
        addParty,
        updateParty,
        recordPayment,
        deleteSalesOrder,
        deleteSalesInvoice,
        deleteDeliveryChallan,
        deleteQuotation,
        deleteProformaInvoice,
        createPurchaseBill,
        updatePurchaseBill,
        deletePurchaseBill,
        deletePayment,
        deleteItem,
        deleteParty,
        isGlobalSearchOpen,
        setIsGlobalSearchOpen,
        isQuickCreateOpen,
        setIsQuickCreateOpen,
        gstSettings,
        updateGstSettings,
        gspConnection,
        connectGspPortal,
        disconnectGspPortal,
        generateEwayBillForInvoice,
        generateEInvoiceForInvoice,
        taxRates,
        taxGroups,
        addTaxRate,
        updateTaxRate,
        deleteTaxRate,
        addTaxGroup,
        updateTaxGroup,
        deleteTaxGroup,
        tdsRates,
        addTdsRate,
        updateTdsRate,
        deleteTdsRate,
        tcsRates,
        addTcsRate,
        updateTcsRate,
        deleteTcsRate,
        customItemFields,
        addCustomItemField,
        updateCustomItemField,
        deleteCustomItemField,
        itemFieldToggles,
        updateItemFieldToggles,
        printSettings,
        updatePrintSettings,
        documentSettings,
        updateDocumentSettings,
        prefixSuffixSettings,
        updatePrefixSuffixSettings,
        setDefaultPrefixSuffix,
        addPrefixSuffixEntry,
        editPrefixSuffixEntry,
        deletePrefixSuffixEntry,
        currencies,
        addCurrency,
        updateCurrency,
        deleteCurrency,
        standardTerms,
        updateStandardTerms,
        termsTemplates,
        addTermsTemplate,
        updateTermsTemplate,
        deleteTermsTemplate,
        setDefaultTermsTemplate,
        documentCustomFields,
        addFormCustomField,
        updateFormCustomField,
        deleteFormCustomField,
        formNotesTerms,
        updateFormNotesTerms,
        resetFormNotesTerms,
        addFormNotePreset,
        updateFormNotePreset,
        deleteFormNotePreset,
        addFormTermsPreset,
        updateFormTermsPreset,
        deleteFormTermsPreset,
        formPrintSettings,
        updateFormPrintSettings,
        resetFormPrintSettings,

        formCustomColumns,
        addCustomColumn,
        updateCustomColumn,
        deleteCustomColumn,

        // Auto Reminders & Notifications
        autoReminderSettings,
        updateAutoReminderSettings,
        reminderLogs,
        addReminderLog,
        partyReminders,
        adminAlerts,
        invoiceReminderConfigs,
        updateInvoiceReminderConfig,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}
