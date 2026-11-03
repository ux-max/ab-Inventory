export type UserRole = 
  | "owner" 
  | "sales" 
  | "store_keeper" 
  | "purchase" 
  | "accountant" 
  | "production"
  | (string & {})

export type PermissionLevel = "full" | "view" | "none"

export interface RoleConfig {
  id: UserRole
  name: string
  title: string
  description: string
  avatarColor: string
  isSystem?: boolean
  canViewCostAndProfit: boolean
  canEditStock: boolean
  canManageSettings: boolean
  allowedModules: string[]
  modulePermissions?: Record<string, PermissionLevel>
}

export interface TeamUser {
  id: string
  name: string
  email: string
  phone?: string
  roleId: string
  isActive: boolean
  createdAt: string
  lastLogin?: string
  avatarUrl?: string
  designation?: string
  password?: string
}

export interface GspPortalConnection {
  isConnected: boolean
  provider: "nic_direct" | "masters_india" | "cleartax" | "iris" | "sandbox"
  apiUsername: string
  gstin: string
  environment: "production" | "sandbox"
  connectedAt?: string
  expiresAt?: string
}

export interface BusinessProfile {
  name: string
  tradeName: string
  gstin: string
  pan?: string
  state: string
  stateCode: string
  address: string
  city?: string
  pincode?: string
  phone: string
  email: string
  website?: string
  logo?: string
  logoUrl?: string
  signatureUrl?: string
  bankDetails?: {
    bankName?: string
    accountNumber?: string
    ifsc?: string
    branch?: string
    upiId?: string
  }
  upiId: string
  invoicePrefix: string
  billPrefix: string
  challanPrefix?: string
  orderPrefix?: string
  quotationPrefix?: string
  isCompositionScheme: boolean
  compositionCategory?: "trader_manufacturer" | "restaurant" | "service_provider"
  compositionRate?: number
  enableBatch: boolean
  enableSerial: boolean
  enableGodown: boolean
  enableManufacturing: boolean
  enableEInvoice: boolean
}

export type CustomFieldType = "text" | "number" | "date" | "select"

export interface CustomItemField {
  id: string
  name: string
  type: CustomFieldType
  options?: string[]
  isEnabled: boolean
  printOnPaper: boolean
}

export interface ItemFieldToggles {
  wholesale: boolean
  mrp: boolean
  barcode: boolean
  hsn: boolean
  purchasePrice: boolean
  sku?: boolean
  category?: boolean
  images?: boolean
  description?: boolean
  inventoryTracking?: boolean
  batchTracking?: boolean
  serialTracking?: boolean
  manufacturing?: boolean
}

export type PrintTheme =
  | "gst1"
  | "gst2"
  | "gst3"
  | "gst4"
  | "gst5"
  | "gst6"
  | "double_divine"
  | "french_elite"
  | "modern"
  | "vintage"
  | "mrp_discount"
  | "elegant"
  | "service_template"
  | "landscape"
  | "evergreen"
  | "elegant_images"
  | "classic"
  | "compact"
  | "bill_to_ship_to"
  | "legend"
  | "service_template_2"

export type DocumentSequenceType = 
  | "invoice"
  | "bill"
  | "sales_return"
  | "purchase_return"
  | "order"
  | "challan"
  | "quotation"
  | "proforma"
  | "credit_note"
  | "debit_note"

export interface PrefixSuffixEntry {
  id: string
  value: string
  isDefault: boolean
  description?: string
  createdAt?: string
}

export type DocumentPrefixSuffixSettings = Record<DocumentSequenceType, {
  prefixes: PrefixSuffixEntry[]
  suffixes: PrefixSuffixEntry[]
}>

export const DEFAULT_PREFIX_SUFFIX_SETTINGS: DocumentPrefixSuffixSettings = {
  invoice: {
    prefixes: [
      { id: "p-inv-1", value: "INV-", isDefault: true },
      { id: "p-inv-2", value: "INV-26/", isDefault: false },
      { id: "p-inv-3", value: "AB/26-27/", isDefault: false }
    ],
    suffixes: [
      { id: "s-inv-1", value: "/26", isDefault: false }
    ]
  },
  bill: {
    prefixes: [
      { id: "p-bill-1", value: "BILL-", isDefault: true },
      { id: "p-bill-2", value: "PUR-26/", isDefault: false }
    ],
    suffixes: []
  },
  sales_return: {
    prefixes: [
      { id: "p-sr-1", value: "SR-", isDefault: true },
      { id: "p-sr-2", value: "SR-26/", isDefault: false }
    ],
    suffixes: []
  },
  purchase_return: {
    prefixes: [
      { id: "p-pr-1", value: "PR-", isDefault: true },
      { id: "p-pr-2", value: "PR-26/", isDefault: false }
    ],
    suffixes: []
  },
  order: {
    prefixes: [
      { id: "p-so-1", value: "SO-", isDefault: true },
      { id: "p-so-2", value: "ORD-26/", isDefault: false }
    ],
    suffixes: []
  },
  challan: {
    prefixes: [
      { id: "p-dc-1", value: "DC-", isDefault: true },
      { id: "p-dc-2", value: "CH-26/", isDefault: false }
    ],
    suffixes: []
  },
  quotation: {
    prefixes: [
      { id: "p-qt-1", value: "QTN-", isDefault: true },
      { id: "p-qt-2", value: "EST-26/", isDefault: false }
    ],
    suffixes: []
  },
  proforma: {
    prefixes: [
      { id: "p-pi-1", value: "PI-", isDefault: true },
      { id: "p-pi-2", value: "PRO-26/", isDefault: false }
    ],
    suffixes: []
  },
  credit_note: {
    prefixes: [
      { id: "p-cn-1", value: "CN-", isDefault: true },
      { id: "p-cn-2", value: "CRN-26/", isDefault: false }
    ],
    suffixes: []
  },
  debit_note: {
    prefixes: [
      { id: "p-dn-1", value: "DN-", isDefault: true },
      { id: "p-dn-2", value: "DBN-26/", isDefault: false }
    ],
    suffixes: []
  }
}

export type FormCustomFieldDocType = DocumentSequenceType | "item"

export interface CustomItemColumn {
  id: string
  name: string
  isEnabled: boolean
  printOnPaper: boolean
}

export type FormCustomColumnsMap = Record<DocumentSequenceType, CustomItemColumn[]>

export const DEFAULT_FORM_CUSTOM_COLUMNS_MAP: FormCustomColumnsMap = {
  invoice: [
    { id: "col-inv-1", name: "Batch / Lot No", isEnabled: true, printOnPaper: true },
    { id: "col-inv-2", name: "Warranty Period", isEnabled: false, printOnPaper: true },
  ],
  proforma: [
    { id: "col-prof-1", name: "Model / Grade", isEnabled: true, printOnPaper: true },
  ],
  quotation: [
    { id: "col-quot-1", name: "Delivery Timeline", isEnabled: true, printOnPaper: true },
  ],
  challan: [
    { id: "col-chal-1", name: "Package / Box No", isEnabled: true, printOnPaper: true },
  ],
  order: [
    { id: "col-ord-1", name: "Color / Size", isEnabled: true, printOnPaper: true },
  ],
  bill: [
    { id: "col-bill-1", name: "Mfg Batch", isEnabled: true, printOnPaper: true },
  ],
  sales_return: [],
  purchase_return: [],
  credit_note: [],
  debit_note: []
}

export type FormCustomFieldsMap = Record<FormCustomFieldDocType, CustomItemField[]>

export const DEFAULT_DOCUMENT_CUSTOM_FIELDS: FormCustomFieldsMap = {
  invoice: [
    { id: "cf-inv-1", name: "Vehicle Number", type: "text", isEnabled: true, printOnPaper: true },
    { id: "cf-inv-2", name: "E-way Bill No", type: "text", isEnabled: true, printOnPaper: true },
    { id: "cf-inv-3", name: "Dispatch Through", type: "select", options: ["By Road", "By Air", "By Train", "Courier"], isEnabled: true, printOnPaper: true },
  ],
  proforma: [
    { id: "cf-prof-1", name: "PO Reference Date", type: "date", isEnabled: true, printOnPaper: true },
    { id: "cf-prof-2", name: "Delivery Location", type: "text", isEnabled: true, printOnPaper: true },
    { id: "cf-prof-3", name: "E-way Bill No", type: "text", isEnabled: true, printOnPaper: true },
  ],
  quotation: [
    { id: "cf-quot-1", name: "Attention Person", type: "text", isEnabled: true, printOnPaper: true },
    { id: "cf-quot-2", name: "Validity (Days)", type: "number", isEnabled: true, printOnPaper: true },
    { id: "cf-quot-3", name: "Project / Tender Ref", type: "text", isEnabled: true, printOnPaper: true },
  ],
  order: [
    { id: "cf-ord-1", name: "Buyer PO Number", type: "text", isEnabled: true, printOnPaper: true },
    { id: "cf-ord-2", name: "Expected Delivery Date", type: "date", isEnabled: true, printOnPaper: true },
  ],
  challan: [
    { id: "cf-chal-1", name: "Vehicle Number", type: "text", isEnabled: true, printOnPaper: true },
    { id: "cf-chal-2", name: "Driver Name & Phone", type: "text", isEnabled: true, printOnPaper: true },
    { id: "cf-chal-3", name: "LR / GR Number", type: "text", isEnabled: true, printOnPaper: true },
  ],
  bill: [
    { id: "cf-bill-1", name: "Vendor Invoice Ref", type: "text", isEnabled: true, printOnPaper: true },
    { id: "cf-bill-2", name: "Gate Pass No", type: "text", isEnabled: true, printOnPaper: true },
  ],
  sales_return: [
    { id: "cf-sr-1", name: "Original Invoice No", type: "text", isEnabled: true, printOnPaper: true },
    { id: "cf-sr-2", name: "Return Reason", type: "select", options: ["Damaged in transit", "Defective unit", "Wrong item delivered", "Customer cancelled"], isEnabled: true, printOnPaper: true },
  ],
  purchase_return: [
    { id: "cf-pr-1", name: "Supplier Debit Ref", type: "text", isEnabled: true, printOnPaper: true },
    { id: "cf-pr-2", name: "Rejection Reason", type: "select", options: ["Quality rejection", "Over shipment", "Damage", "Specification mismatch"], isEnabled: true, printOnPaper: true },
  ],
  credit_note: [
    { id: "cf-cn-1", name: "Original Invoice No", type: "text", isEnabled: true, printOnPaper: true },
    { id: "cf-cn-2", name: "Reason for Credit", type: "text", isEnabled: true, printOnPaper: true },
  ],
  debit_note: [
    { id: "cf-dn-1", name: "Original Bill No", type: "text", isEnabled: true, printOnPaper: true },
    { id: "cf-dn-2", name: "Reason for Debit", type: "text", isEnabled: true, printOnPaper: true },
  ],
  item: [
    { id: "cf-item-1", name: "Batch / Lot Series", type: "text", isEnabled: true, printOnPaper: true },
    { id: "cf-item-2", name: "Material Grade", type: "select", options: ["Standard", "Deluxe", "Premium"], isEnabled: true, printOnPaper: true },
  ]
}

export interface FormNotePreset {
  id: string
  title: string
  content: string
  isDefault?: boolean
}

export interface FormTermsPreset {
  id: string
  title: string
  content: string
  isDefault?: boolean
}

export interface FormNotesTermsConfig {
  notes: string
  terms: string
  printNotesOnPdf?: boolean
  printTermsOnPdf?: boolean
  notesPresets?: FormNotePreset[]
  termsPresets?: FormTermsPreset[]
}

export type FormNotesTermsMap = Record<DocumentSequenceType, FormNotesTermsConfig>

export const DEFAULT_FORM_NOTES_TERMS: FormNotesTermsMap = {
  invoice: {
    notes: "Thanks for your business. Please remit payment by the due date.",
    terms: "1. Goods once sold will not be taken back.\n2. Interest @ 18% p.a. will be charged if payment is not made within credit period.\n3. All disputes subject to local jurisdiction.",
    printNotesOnPdf: true,
    printTermsOnPdf: true,
    notesPresets: [
      { id: "np-inv-1", title: "Standard Payment Request", content: "Thanks for your business. Please remit payment by the due date.", isDefault: true },
      { id: "np-inv-2", title: "Bank Transfer Instructions", content: "Please transfer via NEFT/RTGS to our HDFC bank account. Quote invoice number as reference.", isDefault: false },
      { id: "np-inv-3", title: "Immediate Counter Cash", content: "Payment received in full with thanks. Goods dispatched immediately.", isDefault: false }
    ],
    termsPresets: [
      { id: "tp-inv-1", title: "Standard Sales Terms (30 Days)", content: "1. Goods once sold will not be taken back.\n2. Interest @ 18% p.a. will be charged if payment is not made within credit period.\n3. All disputes subject to local jurisdiction.", isDefault: true },
      { id: "tp-inv-2", title: "100% Advance Payment", content: "1. 100% payment required prior to shipment.\n2. Goods will be dispatched within 48 hours of credit clearance.", isDefault: false },
      { id: "tp-inv-3", title: "7-Day Replacement Warranty", content: "1. Warranty covers manufacturing defects only.\n2. Defective units replaced within 7 business days of report.", isDefault: false }
    ]
  },
  proforma: {
    notes: "Proforma generated to request advance payment. Final Tax Invoice will be issued upon dispatch.",
    terms: "1. This is a Proforma Invoice, not a Tax Invoice.\n2. Goods will be dispatched within 48 hours of advance clearance.\n3. Price valid for 15 days from proforma date.",
    printNotesOnPdf: true,
    printTermsOnPdf: true,
    notesPresets: [
      { id: "np-prof-1", title: "Standard Advance Request", content: "Proforma generated to request advance payment. Final Tax Invoice will be issued upon dispatch.", isDefault: true },
      { id: "np-prof-2", title: "Custom Fabricated Order", content: "Production will commence immediately upon 50% advance bank clearance.", isDefault: false }
    ],
    termsPresets: [
      { id: "tp-prof-1", title: "Standard Proforma (15 Days)", content: "1. This is a Proforma Invoice, not a Tax Invoice.\n2. Goods will be dispatched within 48 hours of advance clearance.\n3. Price valid for 15 days from proforma date.", isDefault: true },
      { id: "tp-prof-2", title: "LC & Export Shipment Terms", content: "1. Payment via irrevocable Letter of Credit at sight.\n2. Shipment schedule subject to vessel availability.", isDefault: false }
    ]
  },
  quotation: {
    notes: "We look forward to receiving your valuable purchase order.",
    terms: "1. Quotation rates are valid for 30 days.\n2. Payment terms: 50% advance, balance against delivery.\n3. Applicable taxes extra as per GST rules.",
    printNotesOnPdf: true,
    printTermsOnPdf: true,
    notesPresets: [
      { id: "np-quot-1", title: "Standard Quote Closing", content: "We look forward to receiving your valuable purchase order.", isDefault: true },
      { id: "np-quot-2", title: "Project Tender Offer", content: "Special institutional project pricing valid for bulk commitment.", isDefault: false }
    ],
    termsPresets: [
      { id: "tp-quot-1", title: "Standard 30-Day Quotation", content: "1. Quotation rates are valid for 30 days.\n2. Payment terms: 50% advance, balance against delivery.\n3. Applicable taxes extra as per GST rules.", isDefault: true },
      { id: "tp-quot-2", title: "7-Day Spot Price", content: "1. Quotation based on today's raw material index; valid for 7 calendar days.\n2. Transport freight extra at actuals.", isDefault: false }
    ]
  },
  order: {
    notes: "Order accepted for processing and dispatch scheduling.",
    terms: "1. Order cancellation allowed within 24 hours of confirmation.\n2. Delivery dates estimated based on factory production schedule.",
    printNotesOnPdf: true,
    printTermsOnPdf: true,
    notesPresets: [
      { id: "np-ord-1", title: "Standard Order Acceptance", content: "Order accepted for processing and dispatch scheduling.", isDefault: true }
    ],
    termsPresets: [
      { id: "tp-ord-1", title: "Standard Sales Order Terms", content: "1. Order cancellation allowed within 24 hours of confirmation.\n2. Delivery dates estimated based on factory production schedule.", isDefault: true }
    ]
  },
  challan: {
    notes: "Material dispatched in sound condition.",
    terms: "1. Received items in good order and condition.\n2. Please return duplicate signed & stamped delivery challan copy.",
    printNotesOnPdf: true,
    printTermsOnPdf: true,
    notesPresets: [
      { id: "np-chal-1", title: "Standard Logistics Dispatch", content: "Material dispatched in sound condition. Please inspect seals and stamp receipt copy.", isDefault: true },
      { id: "np-chal-2", title: "Urgent Courier Gate Entry", content: "Urgent shipment for immediate factory floor processing. Gate pass required.", isDefault: false }
    ],
    termsPresets: [
      { id: "tp-chal-1", title: "Rule 55 Delivery Challan", content: "1. Received items in good order and condition.\n2. Please return duplicate signed & stamped delivery challan copy.", isDefault: true },
      { id: "tp-chal-2", title: "Returnable Demo / Exhibition", content: "1. Goods dispatched for client demonstration.\n2. Material remains company property; returnable within 14 days.", isDefault: false },
      { id: "tp-chal-3", title: "Job Work Outward Challan", content: "1. Sent for job work processing under Rule 55.\n2. Goods must be processed and returned within statutory 180 days.", isDefault: false }
    ]
  },
  bill: {
    notes: "Inward procurement bill verified against physical goods receipt.",
    terms: "Payment subject to store inspection and quality acceptance.",
    printNotesOnPdf: true,
    printTermsOnPdf: true,
    notesPresets: [
      { id: "np-bill-1", title: "Store Receipt Note", content: "Inward procurement bill verified against physical goods receipt.", isDefault: true }
    ],
    termsPresets: [
      { id: "tp-bill-1", title: "Purchase Acceptance Terms", content: "Payment subject to store inspection and quality acceptance.", isDefault: true }
    ]
  },
  sales_return: {
    notes: "Return material acknowledged and sent for stock verification.",
    terms: "Credit adjustment applied upon warehouse receipt confirmation.",
    printNotesOnPdf: true,
    printTermsOnPdf: true,
    notesPresets: [
      { id: "np-sr-1", title: "Return Inspection Note", content: "Return material acknowledged and sent for stock verification.", isDefault: true }
    ],
    termsPresets: [
      { id: "tp-sr-1", title: "Sales Return Policy", content: "Credit adjustment applied upon warehouse receipt confirmation.", isDefault: true }
    ]
  },
  purchase_return: {
    notes: "Material returned to supplier under RMA.",
    terms: "Debit note adjusted in future ledger payouts.",
    printNotesOnPdf: true,
    printTermsOnPdf: true,
    notesPresets: [
      { id: "np-pr-1", title: "Supplier RMA Note", content: "Material returned to supplier under RMA.", isDefault: true }
    ],
    termsPresets: [
      { id: "tp-pr-1", title: "Debit Settlement Terms", content: "Debit note adjusted in future ledger payouts.", isDefault: true }
    ]
  },
  credit_note: {
    notes: "Credit note issued for account adjustment or return settlement.",
    terms: "Amount credited can be adjusted against future invoices or refunded.",
    printNotesOnPdf: true,
    printTermsOnPdf: true,
    notesPresets: [
      { id: "np-cn-1", title: "Account Credit Note", content: "Credit note issued for account adjustment or return settlement.", isDefault: true }
    ],
    termsPresets: [
      { id: "tp-cn-1", title: "Credit Adjustment Terms", content: "Amount credited can be adjusted against future invoices or refunded.", isDefault: true }
    ]
  },
  debit_note: {
    notes: "Debit note issued for purchase discount adjustment or return.",
    terms: "Amount debited will be deducted from outstanding vendor balance.",
    printNotesOnPdf: true,
    printTermsOnPdf: true,
    notesPresets: [
      { id: "np-dn-1", title: "Vendor Debit Note", content: "Debit note issued for purchase discount adjustment or return.", isDefault: true }
    ],
    termsPresets: [
      { id: "tp-dn-1", title: "Debit Deduction Terms", content: "Amount debited will be deducted from outstanding vendor balance.", isDefault: true }
    ]
  }
}

export interface PrintSettings {
  theme: PrintTheme
  formThemes?: Partial<Record<DocumentSequenceType, PrintTheme>>
  primaryColor: string
  showLogo: boolean
  showSignature: boolean
  showBank: boolean
  showBankDetails?: boolean
  showHsn: boolean
  showDiscount: boolean
  showTerms: boolean
  showCustomFields: boolean
}

export interface FormPrintSettings {
  // Header & Brand
  showLogo: boolean
  showBusinessContact: boolean
  showGstin: boolean
  showDispatchAddress: boolean

  // Document & Party Meta
  showOrderNumber: boolean
  showDueDateAndTerms: boolean
  showPlaceOfSupply: boolean
  showSalesperson: boolean
  showEwayBill: boolean
  showCustomerGstin: boolean
  showShippingAddress: boolean

  // Line Items & Columns
  showProductDescription: boolean
  showHsnSac: boolean
  showItemDiscount: boolean
  showUnit: boolean
  showTaxRate: boolean

  // Financials & Totals
  showTaxBreakdown: boolean
  showAdditionalCharges: boolean
  showRoundOff: boolean
  showAmountInWords: boolean

  // Footer & Authorizations
  showBankDetails: boolean
  showTermsConditions: boolean
  showCustomerNotes: boolean
  showAuthorizedSignature: boolean
  showReceiverSignature: boolean
}

export type FormPrintSettingsMap = Record<DocumentSequenceType, FormPrintSettings>

export const DEFAULT_FORM_PRINT_SETTINGS_BASE: FormPrintSettings = {
  showLogo: true,
  showBusinessContact: true,
  showGstin: true,
  showDispatchAddress: true,
  showOrderNumber: true,
  showDueDateAndTerms: true,
  showPlaceOfSupply: true,
  showSalesperson: false,
  showEwayBill: true,
  showCustomerGstin: true,
  showShippingAddress: true,
  showProductDescription: true,
  showHsnSac: true,
  showItemDiscount: true,
  showUnit: true,
  showTaxRate: true,
  showTaxBreakdown: true,
  showAdditionalCharges: true,
  showRoundOff: true,
  showAmountInWords: true,
  showBankDetails: true,
  showTermsConditions: true,
  showCustomerNotes: true,
  showAuthorizedSignature: true,
  showReceiverSignature: false,
}

export const DEFAULT_FORM_PRINT_SETTINGS_MAP: FormPrintSettingsMap = {
  invoice: {
    ...DEFAULT_FORM_PRINT_SETTINGS_BASE,
  },
  proforma: {
    ...DEFAULT_FORM_PRINT_SETTINGS_BASE,
    showEwayBill: false,
  },
  quotation: {
    ...DEFAULT_FORM_PRINT_SETTINGS_BASE,
    showBankDetails: false,
    showEwayBill: false,
  },
  order: {
    ...DEFAULT_FORM_PRINT_SETTINGS_BASE,
    showBankDetails: false,
    showEwayBill: false,
  },
  challan: {
    ...DEFAULT_FORM_PRINT_SETTINGS_BASE,
    showBankDetails: false,
    showTaxRate: false,
    showTaxBreakdown: false,
    showReceiverSignature: true,
  },
  bill: {
    ...DEFAULT_FORM_PRINT_SETTINGS_BASE,
    showBankDetails: false,
    showReceiverSignature: false,
  },
  sales_return: {
    ...DEFAULT_FORM_PRINT_SETTINGS_BASE,
    showBankDetails: false,
    showReceiverSignature: true,
  },
  purchase_return: {
    ...DEFAULT_FORM_PRINT_SETTINGS_BASE,
    showBankDetails: false,
    showReceiverSignature: true,
  },
  credit_note: {
    ...DEFAULT_FORM_PRINT_SETTINGS_BASE,
    showReceiverSignature: false,
  },
  debit_note: {
    ...DEFAULT_FORM_PRINT_SETTINGS_BASE,
    showReceiverSignature: false,
  },
}

export interface DocumentSettings {
  showOrderNumber: boolean
  showPaymentTerms: boolean
  showSalesperson: boolean
  showPlaceOfSupply: boolean
  showItemDescription: boolean
  showDiscount: boolean
  showHsn: boolean
  showBarcodeScan: boolean
  showAdditionalCharges: boolean
  showRoundOff: boolean
  showCreditToggle: boolean
  showAdvancePayment: boolean
  showWithholdingTax: boolean
  showCustomerNotes: boolean
  showTermsConditions: boolean
  showLogo: boolean
  showSignature: boolean
  showBankDetails: boolean
}

export const DEFAULT_DOCUMENT_SETTINGS: DocumentSettings = {
  showOrderNumber: true,
  showPaymentTerms: true,
  showSalesperson: false,
  showPlaceOfSupply: true,
  showItemDescription: true,
  showDiscount: true,
  showHsn: true,
  showBarcodeScan: true,
  showAdditionalCharges: true,
  showRoundOff: true,
  showCreditToggle: true,
  showAdvancePayment: true,
  showWithholdingTax: true,
  showCustomerNotes: true,
  showTermsConditions: true,
  showLogo: true,
  showSignature: true,
  showBankDetails: true
}

export interface CurrencyItem {
  id: string
  code: string
  name: string
  symbol: string
  exchangeRate: number
  isBase: boolean
  isActive: boolean
}

export interface StandardTerms {
  invoice?: string
  quotation?: string
  salesOrder?: string
  proforma?: string
  challan?: string
  purchaseOrder?: string
  bill?: string
  invoiceTerms?: string
  quotationTerms?: string
  orderTerms?: string
  challanTerms?: string
  proformaTerms?: string
  poTerms?: string
  billTerms?: string
}

export type ApplicableDocumentType = 
  | "all"
  | "invoice" 
  | "quotation" 
  | "order" 
  | "challan" 
  | "proforma" 
  | "purchase_order" 
  | "purchase_bill"

export interface TermsTemplate {
  id: string
  title: string
  content: string
  applicableTo: ApplicableDocumentType[]
  isDefault?: boolean
  createdAt?: string
}

export type CompositionCategory = "trader_manufacturer" | "restaurant" | "service_provider"

export interface GstSettings {
  enableGst: boolean
  isCompositionScheme?: boolean
  compositionCategory?: CompositionCategory
  compositionRate?: number
  enableHsnSac: boolean
  enablePlaceOfSupply: boolean
  enableTcs: boolean
  enableTds: boolean
  enableItc?: boolean
  enableRcm?: boolean
}

export interface TaxRateItem {
  id: string
  name: string
  rate: number
  type?: "igst" | "cgst" | "sgst" | "cess" | "gst"
  description?: string
}

export interface TaxGroupItem {
  id: string
  name: string
  rate: number
  subTaxes: string[]
  description?: string
}

export interface WithholdingRateItem {
  id: string
  name: string
  rate: number
  section?: string
  collectionCode?: string
  description?: string
}

export interface Godown {
  id: string
  name: string
  address: string
  isDefault: boolean
  contactPerson: string
  godownType?: string
  phone?: string
  email?: string
  gstin?: string
  pincode?: string
}

export interface BOMItem {
  rawItemId: string
  rawItemName: string
  qty: number
  unit: string
  unitCost: number
}

export interface AdditionalCost {
  name: string
  amount: number
}

export interface ItemBatch {
  batchNo: string
  manufacturingDate: string
  expiryDate: string
  quantity: number
  initialQuantity?: number
  godownId: string
  mrp?: number
  salePrice?: number
  purchasePrice?: number
  costPrice?: number
}

export interface Item {
  id: string
  code: string
  itemCode?: string
  barcode?: string
  name: string
  type: "product" | "service"
  category: string
  brand: string
  unit: string
  secondaryUnit?: string
  conversionFactor?: number
  hsn: string
  gstRate: number
  salePrice: number
  salesTaxType?: "exclusive" | "inclusive"
  salesDiscount?: number
  salesDiscountType?: "percent" | "amount"
  purchasePrice: number
  purchaseTaxType?: "exclusive" | "inclusive"
  purchaseDiscount?: number
  mrp: number
  enableMrp?: boolean
  discountOnMrp?: number
  discountOnMrpType?: "percent" | "amount"
  discountOnMrpForWholesale?: number
  discountOnMrpForWholesaleType?: "percent" | "amount"
  calculateTaxOnMrp?: boolean
  wholesalePrice: number
  wholesaleTaxType?: "exclusive" | "inclusive"
  enableWholesale?: boolean
  wholesaleMinQty?: number
  wholesaleDiscount?: number
  wholesaleDiscountType?: "percent" | "amount"
  minStock: number
  currentStock: number
  stockByGodown: Record<string, number>
  hasBatch: boolean
  hasSerial: boolean
  isManufactured: boolean
  bom?: BOMItem[]
  additionalCosts?: AdditionalCost[]
  batchDetails?: ItemBatch[]
  serialNumbers?: Array<{
    serial: string
    godownId: string
    status: "available" | "sold"
  }>
  valuationMethod?: "FIFO" | "Weighted Average" | string
  inventoryAccount?: string
  customFields?: Record<string, string | number>
  image?: string
  images?: string[]
  primaryImageIndex?: number
}

export interface Party {
  id: string
  name: string
  type: "customer" | "supplier" | "both"
  customerType?: "business" | "individual"
  salutation?: string
  firstName?: string
  lastName?: string
  companyName?: string
  phone: string
  mobile?: string
  email: string
  gstTreatment?: string
  gstin: string
  pan?: string
  state: string
  stateCode: string
  address: string
  billingAddress?: {
    street: string
    city: string
    state: string
    pincode: string
  }
  paymentTerms?: string
  creditLimit: number
  openingBalance?: number
  openingBalanceType?: "debit" | "credit"
  openingBalanceDate?: string
  balance: number // +ve = receivable, -ve = payable
  specialPrices?: Record<string, number> // itemId -> custom rate
  currency?: string // e.g. "INR", "USD", "EUR", "AED", "GBP"
  currencySymbol?: string // e.g. "₹", "$", "€", "د.إ", "£"
}

export interface InvoiceItem {
  itemId: string
  name: string
  sku?: string
  hsn: string
  qty: number
  unit: string
  rate: number
  discountPercent: number
  discountType?: "percent" | "amount"
  discountAmount?: number
  gstRate: number
  taxableAmount: number
  cgst: number
  sgst: number
  igst: number
  total: number
  isWholesale?: boolean
  batchNo?: string
  manufacturingDate?: string
  expiryDate?: string
  serials?: string[]
  purchaseCost?: number // for profit calculation (hidden from sales)
  description?: string
  customColumns?: Record<string, string>
}

export interface AdditionalCharge {
  id?: string
  name: string
  amount: number
}

export interface SalesDocument {
  id: string
  docNo: string
  orderNo?: string
  orderNumber?: string
  type: "invoice" | "quotation" | "order" | "challan" | "return"
  date: string
  dueDate?: string
  partyId: string
  partyName: string
  partyGstin?: string
  partyStateCode: string
  placeOfSupply?: string
  godownId: string
  godownName: string
  currency?: string
  currencySymbol?: string
  exchangeRate?: number
  items: InvoiceItem[]
  subtotal: number
  taxTotal: number
  cgstTotal: number
  sgstTotal: number
  igstTotal: number
  roundOff: number
  adjustment?: number
  adjustmentLabel?: string
  additionalCharges?: AdditionalCharge[]
  withholdingType?: "TDS" | "TCS"
  withholdingRate?: number
  withholdingAmount?: number
  grandTotal: number
  paidAmount: number
  balanceAmount: number
  paymentMode: "cash" | "upi" | "bank" | "credit" | "split"
  isCredit?: boolean
  creditTerms?: string
  status: "paid" | "partial" | "pending" | "cancelled"
  isBillOfSupply?: boolean
  isComposition?: boolean
  notes?: string
  customFields?: Record<string, any>
  irn?: string
  ackNo?: string
  ackDate?: string
  qrCode?: string
  ewayBillNo?: string
  vehicleNo?: string
  distance?: string
  transporterId?: string
  transporterName?: string
  createdBy: string
}

export type QuotationStatus = "draft" | "sent" | "accepted" | "rejected" | "expired" | "converted"

export interface Quotation {
  id: string
  quotationNo: string // e.g. QT-26-0001
  date: string
  validTillDate: string
  partyId: string
  partyName: string
  partyGstin?: string
  partyStateCode?: string
  godownId: string
  godownName: string
  items: InvoiceItem[]
  subtotal: number
  taxTotal: number
  cgstTotal?: number
  sgstTotal?: number
  igstTotal?: number
  roundOff?: number
  adjustment?: number
  adjustmentLabel?: string
  additionalCharges?: AdditionalCharge[]
  withholdingType?: "TDS" | "TCS"
  withholdingRate?: number
  withholdingAmount?: number
  currency?: string
  currencySymbol?: string
  exchangeRate?: number
  grandTotal: number
  status: QuotationStatus
  convertedDocNo?: string
  convertedDocType?: "order" | "invoice"
  notes?: string
  terms?: string
  createdAt?: string
}

export type ProformaStatus = "draft" | "sent" | "advance_received" | "invoiced" | "cancelled"

export interface ProformaInvoice {
  id: string
  proformaNo: string // e.g. PI-26-0001
  date: string
  dueDate?: string
  partyId: string
  partyName: string
  partyGstin?: string
  partyStateCode?: string
  godownId: string
  godownName: string
  items: InvoiceItem[]
  subtotal: number
  taxTotal: number
  cgstTotal?: number
  sgstTotal?: number
  igstTotal?: number
  roundOff?: number
  adjustment?: number
  adjustmentLabel?: string
  additionalCharges?: AdditionalCharge[]
  withholdingType?: "TDS" | "TCS"
  withholdingRate?: number
  withholdingAmount?: number
  currency?: string
  currencySymbol?: string
  exchangeRate?: number
  grandTotal: number
  advanceRequested?: number
  advanceReceived?: number
  status: ProformaStatus
  linkedInvoiceId?: string
  linkedInvoiceNo?: string
  bankDetails?: string
  notes?: string
  terms?: string
  customFields?: Record<string, any>
  createdAt?: string
}

export type SalesOrderStatus = "draft" | "confirmed" | "open" | "partially_delivered" | "fulfilled" | "cancelled"
export type OrderInvoicedStatus = "not_invoiced" | "partially_invoiced" | "invoiced"

export interface SalesOrder {
  id: string
  orderNo: string // e.g. SO-26-0012
  date: string
  expectedDeliveryDate: string
  partyId: string
  partyName: string
  partyGstin?: string
  partyStateCode?: string
  godownId: string
  godownName: string
  items: InvoiceItem[]
  subtotal: number
  taxTotal: number
  cgstTotal?: number
  sgstTotal?: number
  igstTotal?: number
  roundOff?: number
  adjustment?: number
  adjustmentLabel?: string
  additionalCharges?: AdditionalCharge[]
  withholdingType?: "TDS" | "TCS"
  withholdingRate?: number
  withholdingAmount?: number
  currency?: string
  currencySymbol?: string
  exchangeRate?: number
  grandTotal: number
  orderStatus: SalesOrderStatus
  invoicedStatus: OrderInvoicedStatus
  referenceNo?: string
  notes?: string
  terms?: string
  createdAt?: string
}

export type ChallanType = "goods_dispatch" | "supply_on_approval" | "job_work"
export type ChallanStatus = "in_transit" | "delivered" | "returned" | "invoiced"

export interface DeliveryChallan {
  id: string
  challanNo: string // e.g. DC-26-0008
  date: string
  partyId: string
  partyName: string
  partyGstin?: string
  partyStateCode?: string
  partyAddress?: string
  challanType: ChallanType
  vehicleNo: string
  transporter: string
  lrNumber?: string
  ewayBillNo?: string
  godownId: string
  godownName: string
  items: InvoiceItem[]
  totalUnits: number
  goodsValue: number
  withholdingType?: "TDS" | "TCS"
  withholdingRate?: number
  withholdingAmount?: number
  currency?: string
  currencySymbol?: string
  exchangeRate?: number
  status: ChallanStatus
  linkedOrderId?: string
  salesOrderId?: string
  linkedInvoiceId?: string
  notes?: string
  terms?: string
  createdAt?: string
}

export interface PurchaseDocument {
  id: string
  docNo: string
  type: "bill" | "order" | "return"
  date: string
  vendorInvoiceNo?: string
  vendorInvoiceDate?: string
  dueDate?: string
  paymentTerms?: string
  partyId: string
  partyName: string
  partyGstin?: string
  partyStateCode?: string
  godownId: string
  godownName: string
  currency?: string
  currencySymbol?: string
  exchangeRate?: number
  items: Array<{
    itemId: string
    name: string
    hsn: string
    qty: number
    unit: string
    rate: number
    discountPercent?: number
    taxableAmount?: number
    gstRate: number
    cgst?: number
    sgst?: number
    igst?: number
    total: number
    batchNo?: string
    manufacturingDate?: string
    expiryDate?: string
    serials?: string[]
  }>
  subtotal?: number
  cgstTotal?: number
  sgstTotal?: number
  igstTotal?: number
  roundOff?: number
  adjustment?: number
  adjustmentLabel?: string
  additionalCharges?: AdditionalCharge[]
  withholdingType?: "TDS" | "TCS"
  withholdingRate?: number
  withholdingAmount?: number
  grandTotal: number
  status: "posted" | "pending" | "cancelled"
  paidAmount: number
  paymentMode?: "cash" | "upi" | "bank" | "credit" | "cheque"
  isCredit?: boolean
  creditTerms?: string
  itcEligibility?: "inputs" | "capital_goods" | "services" | "ineligible"
  isRcm?: boolean
  notes?: string
  termsAndConditions?: string
  createdBy: string
}

export interface StockMovement {
  id: string
  timestamp: string
  itemId: string
  itemName: string
  movementType: 
    | "sale" 
    | "purchase" 
    | "transfer_in" 
    | "transfer_out" 
    | "adjustment_add" 
    | "adjustment_reduce" 
    | "adjustment"
    | "mfg_consumption" 
    | "mfg_output" 
    | "sales_return" 
    | "purchase_return"
    | "outward_challan"
  qtyChange: number
  previousStock: number
  newStock: number
  godownId: string
  godownName: string
  refDocNo: string
  actor: string
  reason?: string
  batchNo?: string
}

export interface StockAudit {
  id: string
  auditNo: string
  date: string
  godownId: string
  godownName: string
  category: string
  status: "draft" | "review" | "approved"
  items: Array<{
    itemId: string
    itemName: string
    systemQty: number
    countedQty: number
    varianceQty: number
    unitCost: number
    varianceValue: number
  }>
  approvedBy?: string
  approvedAt?: string
}

export type JobWorkStatus = "draft" | "open" | "received" | "closed" | "cancelled"

export interface JobWork {
  id: string
  jobNo: string
  date: string
  workerName: string
  finishedItemId: string
  finishedItemName: string
  expectedQty: number
  receivedQty: number
  status: JobWorkStatus
  rawMaterialsSent: Array<{
    itemId: string
    itemName: string
    qty: number
    rate?: number
    unit?: string
    hsn?: string
  }>
  jobWorkCharges: number
  associatedInvoiceNo?: string
  vehicleNo?: string
  transporter?: string
  godownId?: string
  godownName?: string
  expectedReturnDate?: string
  customerNotes?: string
  termsAndConditions?: string
  partyGstin?: string
  partyAddress?: string
  orderNumber?: string
}

export interface ManufactureEntry {
  id: string
  entryNo: string
  date: string
  finishedItemId: string
  finishedItemName: string
  qtyProduced: number
  godownId: string
  godownName: string
  unitCost: number
  totalCost: number
  consumedItems: Array<{
    itemId: string
    itemName: string
    qtyConsumed: number
    unit: string
  }>
  actor: string
}

export interface PaymentRecord {
  id: string
  paymentNo: string
  type: "payment_in" | "payment_out"
  partyId: string
  partyName: string
  amount: number
  currency?: string
  currencySymbol?: string
  exchangeRate?: number
  date: string
  paymentMode: "cash" | "upi" | "bank" | "cheque" | "card"
  depositAccount?: string
  paidFromAccount?: string
  referenceNo?: string
  docId?: string
  docNo?: string
  notes?: string
  status?: "completed" | "draft" | "cancelled"
  createdBy: string
}

// ==========================================
// SALES RETURNS & CREDIT NOTES (SALES)
// ==========================================
export type SalesReturnStatus = "draft" | "pending" | "received" | "closed" | "cancelled"
export type CreditNoteStatus = "draft" | "open" | "applied" | "closed"

export type SalesReturnReason = 
  | "damaged_goods" 
  | "expired_stock" 
  | "wrong_item_delivered" 
  | "quality_issue" 
  | "customer_cancellation" 
  | "other"

export type CreditNoteReason = 
  | "sales_return" 
  | "defective_goods" 
  | "post_sale_discount" 
  | "billing_error" 
  | "order_cancellation" 
  | "other"

export interface ReturnItemLine {
  itemId: string
  name: string
  code: string
  hsn: string
  qty: number
  rate: number
  gstRate: number
  amount: number
  cgst: number
  sgst: number
  igst: number
  total: number
  condition?: "resalable" | "damaged" | "expired"
}

export interface SalesReturn {
  id: string
  returnNo: string // e.g. SR-26-0001
  date: string
  originalInvoiceId?: string
  originalInvoiceNo: string
  customerId: string
  customerName: string
  customerGstin?: string
  receivingGodownId: string
  reason: SalesReturnReason
  items: ReturnItemLine[]
  subtotal: number
  cgstTotal: number
  sgstTotal: number
  igstTotal: number
  roundOff?: number
  adjustment?: number
  adjustmentLabel?: string
  additionalCharges?: AdditionalCharge[]
  withholdingType?: "TDS" | "TCS"
  withholdingRate?: number
  withholdingAmount?: number
  currency?: string
  currencySymbol?: string
  exchangeRate?: number
  grandTotal: number
  status: SalesReturnStatus
  creditNoteId?: string
  creditNoteNo?: string
  notes?: string
}

export interface CreditNote {
  id: string
  creditNoteNo: string // e.g. CN-26-0001
  date: string
  originalInvoiceId?: string
  originalInvoiceNo: string
  salesReturnId?: string
  salesReturnNo?: string
  customerId: string
  customerName: string
  customerGstin?: string
  placeOfSupply: string
  reason: CreditNoteReason
  returnToInventory: boolean
  godownId?: string
  items: ReturnItemLine[]
  subtotal: number
  cgstTotal: number
  sgstTotal: number
  igstTotal: number
  roundOff?: number
  adjustment?: number
  adjustmentLabel?: string
  additionalCharges?: AdditionalCharge[]
  withholdingType?: "TDS" | "TCS"
  withholdingRate?: number
  withholdingAmount?: number
  currency?: string
  currencySymbol?: string
  exchangeRate?: number
  grandTotal: number
  status: CreditNoteStatus
  notes: string
  terms: string
  appliedInvoiceId?: string
  appliedInvoiceNo?: string
  appliedAmount?: number
  appliedDate?: string
  appliedMethod?: "invoice_offset" | "customer_refund" | "manual"
}

// ==========================================
// PURCHASE RETURNS & DEBIT NOTES (PURCHASES)
// ==========================================
export type PurchaseReturnStatus = "draft" | "dispatched" | "acknowledged" | "closed" | "cancelled"
export type DebitNoteStatus = "draft" | "open" | "applied" | "closed"

export type PurchaseReturnReason = 
  | "damaged_in_transit" 
  | "defective_batch" 
  | "supplier_rate_discrepancy" 
  | "quality_inspection_rejected" 
  | "wrong_specification" 
  | "other"

export type DebitNoteReason = 
  | "purchase_return" 
  | "damaged_in_transit" 
  | "supplier_overcharge" 
  | "quality_rejection" 
  | "volume_rebate" 
  | "other"

export interface PurchaseReturn {
  id: string
  returnNo: string // e.g. PR-26-0001
  date: string
  originalBillId?: string
  originalBillNo: string
  vendorId: string
  vendorName: string
  vendorGstin?: string
  dispatchGodownId: string
  transporter?: string
  lrNumber?: string
  reason: PurchaseReturnReason
  items: ReturnItemLine[]
  subtotal: number
  cgstTotal: number
  sgstTotal: number
  igstTotal: number
  roundOff?: number
  adjustment?: number
  adjustmentLabel?: string
  withholdingType?: "TDS" | "TCS"
  withholdingRate?: number
  withholdingAmount?: number
  grandTotal: number
  status: PurchaseReturnStatus
  isRcm?: boolean
  debitNoteId?: string
  debitNoteNo?: string
  notes?: string
  currency?: string
  currencySymbol?: string
  exchangeRate?: number
}

export interface DebitNote {
  id: string
  debitNoteNo: string // e.g. DN-26-0001
  date: string
  originalBillId?: string
  originalBillNo: string
  purchaseReturnId?: string
  purchaseReturnNo?: string
  vendorId: string
  vendorName: string
  vendorGstin?: string
  placeOfSupply: string
  currency?: string
  currencySymbol?: string
  exchangeRate?: number
  reason: DebitNoteReason
  deductFromInventory: boolean
  godownId?: string
  items: ReturnItemLine[]
  subtotal: number
  cgstTotal: number
  sgstTotal: number
  igstTotal: number
  roundOff?: number
  adjustment?: number
  adjustmentLabel?: string
  withholdingType?: "TDS" | "TCS"
  withholdingRate?: number
  withholdingAmount?: number
  grandTotal: number
  status: DebitNoteStatus
  isRcm?: boolean
  notes: string
  terms: string
  appliedBillId?: string
  appliedBillNo?: string
  appliedAmount?: number
  appliedDate?: string
  appliedMethod?: "bill_offset" | "vendor_refund" | "manual"
}

export interface BankAccount {
  id: string
  accountDisplayName: string
  openingBalance: number
  asOfDate: string
  accountNumber: string
  ifscCode: string
  upiId?: string
  bankName: string
  accountHolderName: string
  printUpiQrOnInvoices: boolean
  printBankDetailsOnInvoices: boolean
  currentBalance?: number
  isDefault?: boolean
  accountType?: "current" | "savings" | "overdraft" | "cash_credit"
  branchName?: string
  isActive?: boolean
  createdAt?: string
}
