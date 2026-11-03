import { 
  BusinessProfile, 
  Godown, 
  Item, 
  Party, 
  SalesDocument, 
  PurchaseDocument, 
  StockMovement, 
  StockAudit, 
  JobWork, 
  RoleConfig, 
  UserRole, 
  PaymentRecord, 
  SalesOrder, 
  DeliveryChallan, 
  Quotation, 
  ProformaInvoice, 
  SalesReturn, 
  CreditNote, 
  PurchaseReturn, 
  DebitNote, 
  BankAccount,
  CustomItemField,
  ItemFieldToggles,
  PrintSettings,
  CurrencyItem,
  StandardTerms,
  TermsTemplate,
  TeamUser
} from "@/types/inventory"

export const INITIAL_BUSINESS: BusinessProfile = {
  name: "Apex Global Traders & Mfrs",
  tradeName: "Apex Inventory Solutions Pvt Ltd",
  gstin: "27AABCA1234F1Z5",
  pan: "AABCA1234F",
  state: "Maharashtra",
  stateCode: "27",
  address: "Plot 42, MIDC Industrial Area, Andheri East",
  city: "Mumbai",
  pincode: "400093",
  phone: "+91 98200 45678",
  email: "billing@apexglobal.in",
  website: "https://apexglobal.in",
  logoUrl: "",
  signatureUrl: "",
  bankDetails: {
    bankName: "HDFC Bank",
    accountNumber: "50200012345678",
    ifsc: "HDFC0001234",
    branch: "Andheri East Branch",
    upiId: "apexglobal@okaxis"
  },
  upiId: "apexglobal@okaxis",
  invoicePrefix: "INV-26",
  billPrefix: "PUR-26",
  challanPrefix: "DC-26",
  orderPrefix: "SO-26",
  quotationPrefix: "QT-26",
  isCompositionScheme: false,
  compositionCategory: "trader_manufacturer",
  compositionRate: 1,
  enableBatch: true,
  enableSerial: true,
  enableGodown: true,
  enableManufacturing: true,
  enableEInvoice: true,
}

export const INITIAL_CUSTOM_ITEM_FIELDS: CustomItemField[] = [
  {
    id: "cf-1",
    name: "Shelf / Rack Location",
    type: "text",
    isEnabled: true,
    printOnPaper: false
  },
  {
    id: "cf-2",
    name: "Warranty Period",
    type: "select",
    options: ["No Warranty", "6 Months", "1 Year Replacement", "2 Years Comprehensive"],
    isEnabled: true,
    printOnPaper: true
  }
]

export const INITIAL_ITEM_FIELD_TOGGLES: ItemFieldToggles = {
  wholesale: true,
  mrp: true,
  barcode: true,
  hsn: true,
  purchasePrice: true,
  sku: true,
  category: true,
  images: true,
  description: true,
  inventoryTracking: true,
  batchTracking: true,
  serialTracking: true,
  manufacturing: true
}

export const INITIAL_PRINT_SETTINGS: PrintSettings = {
  theme: "gst1",
  primaryColor: "#2563eb",
  showLogo: true,
  showSignature: true,
  showBank: true,
  showHsn: true,
  showDiscount: true,
  showTerms: true,
  showCustomFields: true
}

export const INITIAL_CURRENCIES: CurrencyItem[] = [
  {
    id: "curr-inr",
    code: "INR",
    name: "Indian Rupee",
    symbol: "₹",
    exchangeRate: 1,
    isBase: true,
    isActive: true
  },
  {
    id: "curr-usd",
    code: "USD",
    name: "US Dollar",
    symbol: "$",
    exchangeRate: 84.10,
    isBase: false,
    isActive: true
  },
  {
    id: "curr-eur",
    code: "EUR",
    name: "Euro",
    symbol: "€",
    exchangeRate: 91.25,
    isBase: false,
    isActive: true
  },
  {
    id: "curr-aed",
    code: "AED",
    name: "UAE Dirham",
    symbol: "د.إ",
    exchangeRate: 22.90,
    isBase: false,
    isActive: true
  },
  {
    id: "curr-gbp",
    code: "GBP",
    name: "British Pound",
    symbol: "£",
    exchangeRate: 109.40,
    isBase: false,
    isActive: false
  }
]

export const INITIAL_STANDARD_TERMS: StandardTerms = {
  invoice: "1. Goods once sold will not be taken back without prior authorization.\n2. Payment is due within agreed credit period from the invoice date.\n3. Interest @ 18% per annum will be charged on overdue payments.\n4. All disputes are subject to local jurisdiction only.",
  quotation: "1. Prices quoted are valid for 15 days from the date of quotation.\n2. Goods will be dispatched within 48 hours of confirmed order.\n3. Taxes and freight will be charged as applicable at the time of delivery.\n4. Advance payment required for custom orders.",
  salesOrder: "1. Order confirmation is subject to stock availability and credit clearance.\n2. Delivery dates are estimated and subject to transit conditions.\n3. Cancellation requires 24 hours written notice before dispatch.",
  proforma: "1. This is a Proforma Invoice for advance payment and export/dispatch clearance.\n2. Tax Invoice will be generated upon full receipt of advance and physical dispatch.\n3. Remittance must reference this Proforma Invoice number.",
  challan: "1. Goods transport under Section 143 / Rule 55 of CGST Rules, 2017.\n2. Stock physically dispatched for approval / processing / delivery.\n3. Not a Sale Invoice.",
  purchaseOrder: "1. Goods must strictly match approved specifications and batch certifications.\n2. Deliveries with expiry less than 75% of shelf life will be rejected.\n3. Payment as per agreed vendor credit terms.",
  bill: "1. Inwarded stock verified against purchase order and delivery gate entry.\n2. ITC eligibility claimed in GSTR-3B Table 4.",
  invoiceTerms: "1. Goods once sold will not be taken back without prior authorization.\n2. Payment is due within agreed credit period from the invoice date.\n3. Interest @ 18% per annum will be charged on overdue payments.\n4. All disputes are subject to local jurisdiction only.",
  quotationTerms: "1. Prices quoted are valid for 15 days from the date of quotation.\n2. Goods will be dispatched within 48 hours of confirmed order.\n3. Taxes and freight will be charged as applicable at the time of delivery.\n4. Advance payment required for custom orders.",
  orderTerms: "1. Order confirmation is subject to stock availability and credit clearance.\n2. Delivery dates are estimated and subject to transit conditions.\n3. Cancellation requires 24 hours written notice before dispatch.",
  challanTerms: "1. Goods transport under Section 143 / Rule 55 of CGST Rules, 2017.\n2. Stock physically dispatched for approval / processing / delivery.\n3. Not a Sale Invoice.",
  proformaTerms: "1. This is a Proforma Invoice for advance payment and export/dispatch clearance.\n2. Tax Invoice will be generated upon full receipt of advance and physical dispatch.\n3. Remittance must reference this Proforma Invoice number.",
  poTerms: "1. Goods must strictly match approved specifications and batch certifications.\n2. Deliveries with expiry less than 75% of shelf life will be rejected.\n3. Payment as per agreed vendor credit terms.",
  billTerms: "1. Inwarded stock verified against purchase order and delivery gate entry.\n2. ITC eligibility claimed in GSTR-3B Table 4."
}

export const INITIAL_TERMS_TEMPLATES: TermsTemplate[] = [
  {
    id: "terms-1",
    title: "Standard 30-Day Sales Terms",
    applicableTo: ["invoice", "quotation", "order"],
    isDefault: true,
    content: "1. Goods once sold will not be taken back without prior authorization.\n2. Payment is due within 30 days from the invoice date.\n3. Interest @ 18% per annum will be charged on overdue payments after due date.\n4. All disputes are subject to local jurisdiction only.",
    createdAt: "2026-01-01"
  },
  {
    id: "terms-2",
    title: "Cash on Delivery / Immediate Payment",
    applicableTo: ["invoice", "quotation"],
    isDefault: false,
    content: "1. Payment is strictly due upon delivery of goods (Cash / UPI / Instant IMPS).\n2. Unloading will commence only after remittance confirmation.\n3. Physical inspection must be completed in the presence of delivery personnel.",
    createdAt: "2026-01-02"
  },
  {
    id: "terms-3",
    title: "Delivery Challan Transport & Transit (Rule 55)",
    applicableTo: ["challan"],
    isDefault: true,
    content: "1. Goods transported under Section 143 / Rule 55 of CGST Rules, 2017.\n2. Dispatched for job-work / exhibition / delivery on approval.\n3. Consignee must sign and stamp the duplicate copy of this delivery challan upon receipt.\n4. Not an Invoice for Sale.",
    createdAt: "2026-01-03"
  },
  {
    id: "terms-4",
    title: "100% Advance Payment Proforma Advice",
    applicableTo: ["proforma", "quotation"],
    isDefault: true,
    content: "1. This is a Proforma Invoice for advance payment advice, not a Tax Invoice.\n2. Tax Invoice will be generated upon full receipt of payment and physical dispatch.\n3. Order allocation and manufacturing reserved for 15 days from proforma date.\n4. Please quote this Proforma Invoice reference in your bank remittance.",
    createdAt: "2026-01-04"
  },
  {
    id: "terms-5",
    title: "Vendor Purchase Order & Quality Standards",
    applicableTo: ["purchase_order", "purchase_bill"],
    isDefault: true,
    content: "1. Supplies must strictly match approved technical specifications, COA, and batch certificates.\n2. Inward deliveries with expiry less than 75% of total shelf life will be rejected at gate.\n3. Payment release subject to GSTR-2B reflection and 30-day inspection clearance.",
    createdAt: "2026-01-05"
  },
  {
    id: "terms-6",
    title: "Export Sales & FOB Shipment Terms",
    applicableTo: ["invoice", "proforma", "quotation"],
    isDefault: false,
    content: "1. Goods supplied on FOB JNPT Port basis under Letter of Undertaking (LUT) without payment of IGST.\n2. Freight, marine transit insurance, and import customs clearance on buyer's account.\n3. Payment via Irrevocable Letter of Credit (LC) at sight or TT advance.",
    createdAt: "2026-01-06"
  },
  {
    id: "terms-7",
    title: "Annual Maintenance & Replacement Warranty",
    applicableTo: ["invoice", "order", "quotation"],
    isDefault: false,
    content: "1. Product carries 12 months comprehensive on-site warranty against manufacturing defects.\n2. Physical damage, electrical surge, water ingress, and unauthorized repairs void warranty.\n3. Service calls attended within 48 business hours of ticket logging.",
    createdAt: "2026-01-07"
  }
]

export const ROLE_CONFIGS: Record<string, RoleConfig> = {
  owner: {
    id: "owner",
    name: "Business Owner",
    title: "Admin / Full Access",
    description: "Full master access: can see purchase rates, profits, manage roles, adjust ledgers, and configure settings.",
    avatarColor: "bg-blue-600",
    isSystem: true,
    canViewCostAndProfit: true,
    canEditStock: true,
    canManageSettings: true,
    allowedModules: ["dashboard", "parties", "items", "sales", "purchases", "bank_accounts", "inventory", "manufacturing", "reports", "gst", "eway", "einvoice", "settings"],
    modulePermissions: {
      dashboard: "full",
      items: "full",
      parties: "full",
      sales: "full",
      purchases: "full",
      inventory: "full",
      banking: "full",
      bank_accounts: "full",
      eway: "full",
      einvoice: "full",
      reports: "full",
      gst: "full",
      manufacturing: "full",
      settings: "full"
    }
  },
  sales: {
    id: "sales",
    name: "Billing Staff",
    title: "Counter Sales & Billing",
    description: "Permitted fast sales billing & collections. Available stock is shown, but purchase prices and profit margins are strictly HIDDEN.",
    avatarColor: "bg-emerald-600",
    isSystem: true,
    canViewCostAndProfit: false,
    canEditStock: false,
    canManageSettings: false,
    allowedModules: ["dashboard", "parties", "items", "sales", "banking", "bank_accounts", "eway", "einvoice"],
    modulePermissions: {
      dashboard: "full",
      items: "view",
      parties: "full",
      sales: "full",
      purchases: "none",
      inventory: "none",
      banking: "view",
      bank_accounts: "view",
      eway: "full",
      einvoice: "full",
      reports: "none",
      gst: "none",
      manufacturing: "none",
      settings: "none"
    }
  },
  store_keeper: {
    id: "store_keeper",
    name: "Store Keeper",
    title: "Godown & Stock Manager",
    description: "Manages goods receiving, inter-godown transfers, physical count audits and adjustments. Financial costs are hidden.",
    avatarColor: "bg-amber-600",
    isSystem: true,
    canViewCostAndProfit: false,
    canEditStock: true,
    canManageSettings: false,
    allowedModules: ["dashboard", "items", "inventory", "eway"],
    modulePermissions: {
      dashboard: "full",
      items: "view",
      parties: "none",
      sales: "none",
      purchases: "none",
      inventory: "full",
      banking: "none",
      bank_accounts: "none",
      eway: "view",
      einvoice: "none",
      reports: "none",
      gst: "none",
      manufacturing: "none",
      settings: "none"
    }
  },
  purchase: {
    id: "purchase",
    name: "Purchase Manager",
    title: "Procurement & Orders",
    description: "Manages reorder lists, supplier purchase orders and bills. Sales invoices and profit margins are hidden.",
    avatarColor: "bg-indigo-600",
    isSystem: true,
    canViewCostAndProfit: true,
    canEditStock: true,
    canManageSettings: false,
    allowedModules: ["dashboard", "parties", "items", "purchases", "inventory", "banking", "bank_accounts"],
    modulePermissions: {
      dashboard: "full",
      items: "view",
      parties: "full",
      sales: "none",
      purchases: "full",
      inventory: "view",
      banking: "view",
      bank_accounts: "view",
      eway: "none",
      einvoice: "none",
      reports: "none",
      gst: "none",
      manufacturing: "none",
      settings: "none"
    }
  },
  accountant: {
    id: "accountant",
    name: "Accountant",
    title: "Finance, Audit & Taxes",
    description: "Read-only access across ledgers, stock valuation, and GST filing data (GSTR-1, GSTR-3B). Cannot alter inventory.",
    avatarColor: "bg-slate-700",
    isSystem: true,
    canViewCostAndProfit: true,
    canEditStock: false,
    canManageSettings: false,
    allowedModules: ["dashboard", "parties", "items", "sales", "purchases", "banking", "bank_accounts", "inventory", "reports", "gst", "eway", "einvoice"],
    modulePermissions: {
      dashboard: "full",
      items: "view",
      parties: "view",
      sales: "view",
      purchases: "view",
      inventory: "view",
      banking: "full",
      bank_accounts: "full",
      eway: "view",
      einvoice: "view",
      reports: "full",
      gst: "full",
      manufacturing: "none",
      settings: "none"
    }
  },
  production: {
    id: "production",
    name: "Production Supervisor",
    title: "Assembly & Manufacturing",
    description: "Oversees finished goods assembly, BOM recipes, raw material consumption, and job work out challans.",
    avatarColor: "bg-slate-800",
    isSystem: true,
    canViewCostAndProfit: false,
    canEditStock: true,
    canManageSettings: false,
    allowedModules: ["dashboard", "items", "manufacturing", "inventory"],
    modulePermissions: {
      dashboard: "full",
      items: "view",
      parties: "none",
      sales: "none",
      purchases: "none",
      inventory: "view",
      banking: "none",
      bank_accounts: "none",
      eway: "none",
      einvoice: "none",
      reports: "none",
      gst: "none",
      manufacturing: "full",
      settings: "none"
    }
  }
}

export const INITIAL_TEAM_USERS: TeamUser[] = [
  {
    id: "user-1",
    name: "Rajesh Sharma",
    email: "rajesh@apexglobal.in",
    phone: "9820011001",
    roleId: "owner",
    isActive: true,
    createdAt: "2026-01-01",
    lastLogin: "Today, 10:30 AM"
  },
  {
    id: "user-2",
    name: "Amit Verma",
    email: "amit.billing@apexglobal.in",
    phone: "9820022002",
    roleId: "sales",
    isActive: true,
    createdAt: "2026-01-15",
    lastLogin: "Today, 09:15 AM"
  },
  {
    id: "user-3",
    name: "Sunil Patil",
    email: "sunil.store@apexglobal.in",
    phone: "9820033003",
    roleId: "store_keeper",
    isActive: true,
    createdAt: "2026-02-01",
    lastLogin: "Yesterday"
  },
  {
    id: "user-4",
    name: "Neha Gupta",
    email: "neha.purchase@apexglobal.in",
    phone: "9820044004",
    roleId: "purchase",
    isActive: true,
    createdAt: "2026-02-10",
    lastLogin: "Oct 28, 2026"
  },
  {
    id: "user-5",
    name: "CA Ramesh Kulkarni",
    email: "ramesh.ca@apexglobal.in",
    phone: "9820055005",
    roleId: "accountant",
    isActive: true,
    createdAt: "2026-03-01",
    lastLogin: "Oct 29, 2026"
  },
  {
    id: "user-6",
    name: "Vikram Jadhav",
    email: "vikram.mfg@apexglobal.in",
    phone: "9820066006",
    roleId: "production",
    isActive: true,
    createdAt: "2026-03-15",
    lastLogin: "Oct 30, 2026"
  }
]

export const INITIAL_GODOWNS: Godown[] = [
  {
    id: "godown-1",
    name: "Main Warehouse (Bhiwandi)",
    address: "Unit 12, Logistic Hub, Mankoli Naka, Bhiwandi, Thane - 421302",
    isDefault: true,
    contactPerson: "Sunil Patil (+91 98765 11001)"
  },
  {
    id: "godown-2",
    name: "Central Store (Andheri)",
    address: "Plot 42, MIDC Cross Rd B, Andheri East, Mumbai - 400093",
    isDefault: false,
    contactPerson: "Dinesh Solanki (+91 98765 11002)"
  },
  {
    id: "godown-3",
    name: "Vashi Distribution Hub",
    address: "Sector 19C, APMC Market 2, Vashi, Navi Mumbai - 400703",
    isDefault: false,
    contactPerson: "Kishore More (+91 98765 11003)"
  }
]

export const INITIAL_ITEMS: Item[] = [
  {
    id: "itm-1",
    code: "MED-PCM-650",
    itemCode: "890123456001",
    barcode: "890123456001",
    name: "Paracetamol 650mg Blister Pack",
    type: "product",
    category: "Pharmaceuticals",
    brand: "Apex Pharma",
    unit: "BOX",
    secondaryUnit: "STRIP",
    conversionFactor: 10,
    hsn: "300490",
    gstRate: 12,
    salePrice: 320,
    salesTaxType: "exclusive",
    salesDiscount: 0,
    purchasePrice: 210,
    purchaseTaxType: "exclusive",
    purchaseDiscount: 2,
    mrp: 360,
    wholesalePrice: 280,
    wholesaleTaxType: "exclusive",
    enableWholesale: true,
    wholesaleMinQty: 25,
    wholesaleDiscount: 5,
    minStock: 50,
    currentStock: 140,
    stockByGodown: {
      "godown-1": 90,
      "godown-2": 30,
      "godown-3": 20
    },
    hasBatch: true,
    hasSerial: false,
    isManufactured: false,
    batchDetails: [
      { batchNo: "PCM-26B01", manufacturingDate: "2026-01-15", expiryDate: "2027-01-14", quantity: 80, initialQuantity: 100, godownId: "godown-1" },
      { batchNo: "PCM-25L99", manufacturingDate: "2025-11-10", expiryDate: "2026-11-09", quantity: 60, initialQuantity: 100, godownId: "godown-2" }
    ]
  },
  {
    id: "itm-2",
    code: "MED-AZI-500",
    itemCode: "890123456002",
    barcode: "890123456002",
    name: "Azithromycin 500mg Tablets",
    type: "product",
    category: "Pharmaceuticals",
    brand: "Apex Pharma",
    unit: "BOX",
    secondaryUnit: "STRIP",
    conversionFactor: 5,
    hsn: "300420",
    gstRate: 12,
    salePrice: 580,
    purchasePrice: 420,
    mrp: 650,
    wholesalePrice: 520,
    minStock: 30,
    currentStock: 25, // LOW STOCK
    stockByGodown: {
      "godown-1": 15,
      "godown-2": 10,
      "godown-3": 0
    },
    hasBatch: true,
    hasSerial: false,
    isManufactured: false,
    batchDetails: [
      { batchNo: "AZI-25E04", manufacturingDate: "2025-05-10", expiryDate: "2026-11-20", quantity: 25, initialQuantity: 50, godownId: "godown-1" }
    ]
  },
  {
    id: "itm-3",
    code: "ELC-POS-TH80",
    name: "Thermal Receipt Printer 80mm USB+LAN",
    type: "product",
    category: "Electronics",
    brand: "VoltTech",
    unit: "PCS",
    hsn: "844332",
    gstRate: 18,
    salePrice: 4850,
    purchasePrice: 3400,
    mrp: 5999,
    wholesalePrice: 4400,
    minStock: 10,
    currentStock: 18,
    stockByGodown: {
      "godown-1": 12,
      "godown-2": 4,
      "godown-3": 2
    },
    hasBatch: false,
    hasSerial: true,
    isManufactured: false,
    serialNumbers: [
      { serial: "TH80-2026-9011", godownId: "godown-1", status: "available" },
      { serial: "TH80-2026-9012", godownId: "godown-1", status: "available" },
      { serial: "TH80-2026-9013", godownId: "godown-2", status: "available" },
      { serial: "TH80-2026-9014", godownId: "godown-3", status: "available" }
    ]
  },
  {
    id: "itm-4",
    code: "FMCG-OIL-15L",
    name: "Pure Mustard Oil Tin (15 Litre)",
    type: "product",
    category: "FMCG & Groceries",
    brand: "ShudhGold",
    unit: "TIN",
    hsn: "151491",
    gstRate: 5,
    salePrice: 1950,
    purchasePrice: 1720,
    mrp: 2200,
    wholesalePrice: 1840,
    minStock: 40,
    currentStock: 65,
    stockByGodown: {
      "godown-1": 40,
      "godown-2": 15,
      "godown-3": 10
    },
    hasBatch: true,
    hasSerial: false,
    isManufactured: false,
    batchDetails: [
      { batchNo: "OIL-OCT-11", manufacturingDate: "2026-10-01", expiryDate: "2027-04-01", quantity: 65, initialQuantity: 80, godownId: "godown-1" }
    ]
  },
  {
    id: "itm-5",
    code: "MFG-SAN-500",
    name: "Hand Sanitizer Gel 500ml Dispenser (Finished Assembly)",
    type: "product",
    category: "Manufactured Goods",
    brand: "Apex Care",
    unit: "BTL",
    hsn: "380894",
    gstRate: 18,
    salePrice: 195,
    purchasePrice: 110,
    mrp: 249,
    wholesalePrice: 160,
    minStock: 100,
    currentStock: 120,
    stockByGodown: {
      "godown-1": 80,
      "godown-2": 40,
      "godown-3": 0
    },
    hasBatch: true,
    hasSerial: false,
    isManufactured: true,
    bom: [
      { rawItemId: "itm-raw-1", rawItemName: "IPA Isopropyl Alcohol 99% (Bulk)", qty: 0.35, unit: "LTR", unitCost: 120 },
      { rawItemId: "itm-raw-2", rawItemName: "500ml HDPE Bottle with Pump", qty: 1, unit: "PCS", unitCost: 18 },
      { rawItemId: "itm-raw-3", rawItemName: "Glycerine & Carbomer Mix", qty: 0.05, unit: "LTR", unitCost: 160 }
    ],
    additionalCosts: [
      { name: "Direct Bottling Labour", amount: 12 },
      { name: "Electricity & Overhead", amount: 4 },
      { name: "Outer Carton Packaging", amount: 3 }
    ]
  },
  {
    id: "itm-raw-1",
    code: "RAW-IPA-01",
    name: "IPA Isopropyl Alcohol 99% (Bulk)",
    type: "product",
    category: "Raw Materials",
    brand: "Industrial Pure",
    unit: "LTR",
    hsn: "290512",
    gstRate: 18,
    salePrice: 150,
    purchasePrice: 120,
    mrp: 180,
    wholesalePrice: 135,
    minStock: 200,
    currentStock: 650,
    stockByGodown: {
      "godown-1": 500,
      "godown-2": 150,
      "godown-3": 0
    },
    hasBatch: true,
    hasSerial: false,
    isManufactured: false
  },
  {
    id: "itm-raw-2",
    code: "RAW-BTL-500",
    name: "500ml HDPE Bottle with Pump",
    type: "product",
    category: "Raw Materials",
    brand: "PlastoPack",
    unit: "PCS",
    hsn: "392330",
    gstRate: 18,
    salePrice: 25,
    purchasePrice: 18,
    mrp: 30,
    wholesalePrice: 20,
    minStock: 500,
    currentStock: 1200,
    stockByGodown: {
      "godown-1": 1000,
      "godown-2": 200,
      "godown-3": 0
    },
    hasBatch: false,
    hasSerial: false,
    isManufactured: false
  },
  {
    id: "itm-raw-3",
    code: "RAW-GLY-01",
    name: "Glycerine & Carbomer Mix",
    type: "product",
    category: "Raw Materials",
    brand: "ChemMix",
    unit: "LTR",
    hsn: "290545",
    gstRate: 18,
    salePrice: 190,
    purchasePrice: 160,
    mrp: 220,
    wholesalePrice: 175,
    minStock: 80,
    currentStock: 45, // LOW STOCK
    stockByGodown: {
      "godown-1": 35,
      "godown-2": 10,
      "godown-3": 0
    },
    hasBatch: true,
    hasSerial: false,
    isManufactured: false
  }
]

export const INITIAL_PARTIES: Party[] = [
  {
    id: "pty-1",
    name: "MedLife Healthcare Distributors",
    type: "customer",
    phone: "+91 98211 55667",
    email: "procurement@medlifehc.in",
    gstin: "27AAACM9988G1Z2",
    state: "Maharashtra",
    stateCode: "27",
    address: "Shop 14, Apollo Commercial Complex, Dadar West, Mumbai - 400028",
    creditLimit: 250000,
    openingBalance: 48500,
    openingBalanceType: "debit",
    openingBalanceDate: "2026-04-01",
    balance: 54722,
    specialPrices: {
      "itm-1": 305 // discount for loyal customer
    }
  },
  {
    id: "pty-2",
    name: "Gujarat Surgical & Diagnostics",
    type: "customer",
    phone: "+91 94260 33441",
    email: "orders@gsd-ahmedabad.com",
    gstin: "24AACCG1122D1Z8",
    state: "Gujarat",
    stateCode: "24",
    address: "Ring Road, Near Iscon Circle, SG Highway, Ahmedabad - 380015",
    creditLimit: 500000,
    openingBalance: 112000,
    openingBalanceType: "debit",
    openingBalanceDate: "2026-04-01",
    balance: 112000
  },
  {
    id: "pty-3",
    name: "Bharat Chemical & Solvent Corp",
    type: "supplier",
    phone: "+91 98199 88776",
    email: "sales@bharatchem.co.in",
    gstin: "27AAACB3344K1ZR",
    state: "Maharashtra",
    stateCode: "27",
    address: "Plot 88, Chemical Zone, Dombivli East, Thane - 421204",
    creditLimit: 1000000,
    openingBalance: 84000,
    openingBalanceType: "credit",
    openingBalanceDate: "2026-04-01",
    balance: -84000 // we owe them 84,000
  },
  {
    id: "pty-4",
    name: "Universal Packaging Solutions",
    type: "supplier",
    phone: "+91 98255 44112",
    email: "billing@universalpoly.in",
    gstin: "24AAACU5566P1ZM",
    state: "Gujarat",
    stateCode: "24",
    address: "GIDC Industrial Estate, Vapi - 396195",
    creditLimit: 400000,
    openingBalance: 18500,
    openingBalanceType: "credit",
    openingBalanceDate: "2026-04-01",
    balance: -18500
  },
  {
    id: "pty-5",
    name: "Walk-in Retail Counter",
    type: "customer",
    phone: "+91 99999 00000",
    email: "walkin@counter.local",
    gstin: "",
    state: "Maharashtra",
    stateCode: "27",
    address: "Cash Counter, Andheri Showroom",
    creditLimit: 0,
    openingBalance: 0,
    openingBalanceType: "debit",
    openingBalanceDate: "2026-04-01",
    balance: 0
  }
]

export const INITIAL_SALES_DOCUMENTS: SalesDocument[] = [
  {
    id: "inv-101",
    docNo: "INV-26-0042",
    type: "invoice",
    date: "2026-10-12",
    dueDate: "2026-11-11",
    partyId: "pty-1",
    partyName: "MedLife Healthcare Distributors",
    partyGstin: "27AAACM9988G1Z2",
    partyStateCode: "27",
    placeOfSupply: "27",
    godownId: "godown-1",
    godownName: "Main Warehouse (Bhiwandi)",
    items: [
      {
        itemId: "itm-1",
        name: "Paracetamol 650mg Blister Pack",
        hsn: "300490",
        qty: 40,
        unit: "BOX",
        rate: 305,
        discountPercent: 0,
        gstRate: 12,
        taxableAmount: 12200,
        cgst: 732,
        sgst: 732,
        igst: 0,
        total: 13664,
        batchNo: "PCM-26B01",
        expiryDate: "2027-01-14",
        purchaseCost: 210
      },
      {
        itemId: "itm-5",
        name: "Hand Sanitizer Gel 500ml Dispenser",
        hsn: "380894",
        qty: 30,
        unit: "BTL",
        rate: 195,
        discountPercent: 5,
        gstRate: 18,
        taxableAmount: 5557.5,
        cgst: 500.18,
        sgst: 500.18,
        igst: 0,
        total: 6557.85,
        batchNo: "SAN-OCT-01",
        purchaseCost: 110
      }
    ],
    subtotal: 17757.5,
    taxTotal: 2464.36,
    cgstTotal: 1232.18,
    sgstTotal: 1232.18,
    igstTotal: 0,
    roundOff: -0.21,
    grandTotal: 20222,
    paidAmount: 14000,
    balanceAmount: 6222,
    paymentMode: "credit",
    isCredit: true,
    status: "partial",
    withholdingType: "TDS",
    withholdingRate: 1,
    withholdingAmount: 177.58,
    irn: "9f81a74d2b0e41982ab11c38e9102456aa0e9981273948501abed66710493821",
    ackNo: "11261012000042",
    ewayBillNo: "241109823451",
    createdBy: "Amit Verma (Sales)"
  },
  {
    id: "inv-102",
    docNo: "INV-26-0043",
    type: "invoice",
    date: "2026-10-13",
    dueDate: "2026-10-28",
    partyId: "pty-2",
    partyName: "Gujarat Surgical & Diagnostics",
    partyGstin: "24AACCG1122D1Z8",
    partyStateCode: "24", // Inter-state -> IGST applies!
    placeOfSupply: "24",
    godownId: "godown-1",
    godownName: "Main Warehouse (Bhiwandi)",
    items: [
      {
        itemId: "itm-3",
        name: "Thermal Receipt Printer 80mm USB+LAN",
        hsn: "844332",
        qty: 2,
        unit: "PCS",
        rate: 4850,
        discountPercent: 0,
        gstRate: 18,
        taxableAmount: 9700,
        cgst: 0,
        sgst: 0,
        igst: 1746,
        total: 11446,
        serials: ["TH80-2026-9011", "TH80-2026-9012"],
        purchaseCost: 3400
      }
    ],
    subtotal: 9700,
    taxTotal: 1746,
    cgstTotal: 0,
    sgstTotal: 0,
    igstTotal: 1746,
    roundOff: 0,
    grandTotal: 11446,
    paidAmount: 5000,
    balanceAmount: 6446,
    paymentMode: "credit",
    status: "partial",
    withholdingType: "TCS",
    withholdingRate: 1,
    withholdingAmount: 97.00,
    irn: "6b29cd4109ab38e12048f7614d1029471628490a6120489501ac7b0193489212",
    ackNo: "11261013000098",
    createdBy: "Rajesh Sharma (Owner)"
  }
]

export const INITIAL_PURCHASE_DOCUMENTS: PurchaseDocument[] = [
  {
    id: "pur-201",
    docNo: "BILL-26-0089",
    type: "bill",
    date: "2026-10-08",
    partyId: "pty-3",
    partyName: "Bharat Chemical & Solvent Corp",
    partyGstin: "27AAACB3344K1ZR",
    godownId: "godown-1",
    godownName: "Main Warehouse (Bhiwandi)",
    items: [
      {
        itemId: "itm-raw-1",
        name: "IPA Isopropyl Alcohol 99% (Bulk)",
        hsn: "290512",
        qty: 200,
        unit: "LTR",
        rate: 120,
        gstRate: 18,
        total: 28320,
        batchNo: "IPA-26J04"
      }
    ],
    subtotal: 24000,
    cgstTotal: 2160,
    sgstTotal: 2160,
    igstTotal: 0,
    roundOff: 0,
    adjustment: 0,
    grandTotal: 28320,
    paidAmount: 28320,
    status: "posted",
    withholdingType: "TDS",
    withholdingRate: 2,
    withholdingAmount: 480.00,
    createdBy: "Neha Gupta (Purchase)"
  },
  {
    id: "pur-202",
    docNo: "BILL-26-0090",
    type: "bill",
    date: "2026-10-10",
    partyId: "pty-3",
    partyName: "Bharat Chemical & Solvent Corp",
    partyGstin: "27AAACB3344K1ZR",
    godownId: "godown-1",
    godownName: "Main Warehouse (Bhiwandi)",
    items: [
      {
        itemId: "itm-raw-1",
        name: "IPA Isopropyl Alcohol 99% (Bulk)",
        hsn: "290512",
        qty: 300,
        unit: "LTR",
        rate: 125,
        gstRate: 18,
        total: 44250,
        batchNo: "IPA-26J05"
      }
    ],
    subtotal: 37500,
    cgstTotal: 3375,
    sgstTotal: 3375,
    igstTotal: 0,
    roundOff: 0,
    adjustment: 0,
    grandTotal: 44250,
    paidAmount: 20000,
    status: "pending",
    withholdingType: "TCS",
    withholdingRate: 1,
    withholdingAmount: 375.00,
    createdBy: "Neha Gupta (Purchase)"
  }
]

export const INITIAL_STOCK_MOVEMENTS: StockMovement[] = [
  {
    id: "mov-1",
    timestamp: "2026-10-12 14:32:00",
    itemId: "itm-1",
    itemName: "Paracetamol 650mg Blister Pack",
    movementType: "sale",
    qtyChange: -40,
    previousStock: 180,
    newStock: 140,
    godownId: "godown-1",
    godownName: "Main Warehouse (Bhiwandi)",
    refDocNo: "INV-26-0042",
    actor: "Amit Verma (Sales)",
    reason: "Tax Invoice posted"
  },
  {
    id: "mov-2",
    timestamp: "2026-10-12 14:32:00",
    itemId: "itm-5",
    itemName: "Hand Sanitizer Gel 500ml Dispenser",
    movementType: "sale",
    qtyChange: -30,
    previousStock: 150,
    newStock: 120,
    godownId: "godown-1",
    godownName: "Main Warehouse (Bhiwandi)",
    refDocNo: "INV-26-0042",
    actor: "Amit Verma (Sales)",
    reason: "Tax Invoice posted"
  },
  {
    id: "mov-3",
    timestamp: "2026-10-13 11:15:00",
    itemId: "itm-3",
    itemName: "Thermal Receipt Printer 80mm USB+LAN",
    movementType: "sale",
    qtyChange: -2,
    previousStock: 20,
    newStock: 18,
    godownId: "godown-1",
    godownName: "Main Warehouse (Bhiwandi)",
    refDocNo: "INV-26-0043",
    actor: "Rajesh Sharma (Owner)",
    reason: "Sale invoice posted (Serial allocation: TH80-2026-9011, 9012)"
  },
  {
    id: "mov-trf-1-out",
    timestamp: "2026-10-14 10:30:00",
    itemId: "itm-1",
    itemName: "Paracetamol 650mg Blister Pack",
    movementType: "transfer_out",
    qtyChange: -20,
    previousStock: 160,
    newStock: 140,
    godownId: "godown-1",
    godownName: "Main Warehouse (Bhiwandi)",
    refDocNo: "TRF-26-0001",
    actor: "Rajesh Sharma (Owner)",
    reason: "Transfer to Central Store (Andheri): Branch inventory replenishment"
  },
  {
    id: "mov-trf-1-in",
    timestamp: "2026-10-14 10:30:00",
    itemId: "itm-1",
    itemName: "Paracetamol 650mg Blister Pack",
    movementType: "transfer_in",
    qtyChange: 20,
    previousStock: 50,
    newStock: 70,
    godownId: "godown-2",
    godownName: "Central Store (Andheri)",
    refDocNo: "TRF-26-0001",
    actor: "Rajesh Sharma (Owner)",
    reason: "Received from Main Warehouse (Bhiwandi): Branch inventory replenishment"
  },
  {
    id: "mov-trf-2-out",
    timestamp: "2026-10-15 15:45:00",
    itemId: "itm-4",
    itemName: "Pure Mustard Oil Tin (15 Litre)",
    movementType: "transfer_out",
    qtyChange: -10,
    previousStock: 50,
    newStock: 40,
    godownId: "godown-1",
    godownName: "Main Warehouse (Bhiwandi)",
    refDocNo: "TRF-26-0002",
    actor: "Sunil Patil (Store Keeper)",
    reason: "Transfer to Vashi Distribution Hub: Retail fulfillment request"
  },
  {
    id: "mov-trf-2-in",
    timestamp: "2026-10-15 15:45:00",
    itemId: "itm-4",
    itemName: "Pure Mustard Oil Tin (15 Litre)",
    movementType: "transfer_in",
    qtyChange: 10,
    previousStock: 22,
    newStock: 32,
    godownId: "godown-3",
    godownName: "Vashi Distribution Hub",
    refDocNo: "TRF-26-0002",
    actor: "Sunil Patil (Store Keeper)",
    reason: "Received from Main Warehouse (Bhiwandi): Retail fulfillment request"
  }
]

export const INITIAL_STOCK_AUDITS: StockAudit[] = [
  {
    id: "adt-1",
    auditNo: "AUD-2026-10-01",
    date: "2026-10-10",
    godownId: "godown-1",
    godownName: "Main Warehouse (Bhiwandi)",
    category: "Pharmaceuticals",
    status: "approved",
    items: [
      {
        itemId: "itm-1",
        itemName: "Paracetamol 650mg Blister Pack",
        systemQty: 182,
        countedQty: 180,
        varianceQty: -2,
        unitCost: 210,
        varianceValue: -420
      },
      {
        itemId: "itm-2",
        itemName: "Azithromycin 500mg Tablets",
        systemQty: 25,
        countedQty: 25,
        varianceQty: 0,
        unitCost: 420,
        varianceValue: 0
      }
    ],
    approvedBy: "Rajesh Sharma (Owner)",
    approvedAt: "2026-10-10 18:30"
  }
]

export const INITIAL_JOB_WORKS: JobWork[] = [
  {
    id: "jw-1",
    jobNo: "JW-2026-0014",
    date: "2026-10-11",
    workerName: "Shree Ganesh Packaging & Bottling",
    partyGstin: "27AABCS1429B1ZB",
    partyAddress: "Plot 42, Anand Industrial Estate, Bhiwandi, Thane, Maharashtra - 421302",
    finishedItemId: "itm-5",
    finishedItemName: "Hand Sanitizer Gel 500ml Dispenser",
    expectedQty: 50,
    receivedQty: 50,
    status: "received",
    vehicleNo: "MH-04-JW-4412",
    transporter: "Direct Factory Dispatch (Rule 55)",
    godownId: "gdn-1",
    godownName: "Main Warehouse (Bhiwandi)",
    expectedReturnDate: "2026-10-26",
    customerNotes: "Raw materials dispatched for processing / job work. Finished goods to be returned along with delivery challan.",
    termsAndConditions: "Inputs dispatched under Section 143 / Rule 55 of CGST Rules, 2017. Finished products must be returned within the statutory period.",
    rawMaterialsSent: [
      { itemId: "itm-raw-1", itemName: "IPA Isopropyl Alcohol 99% (Bulk)", qty: 17.5, rate: 120, unit: "LTR", hsn: "2905" },
      { itemId: "itm-raw-2", itemName: "500ml HDPE Bottle with Pump", qty: 50, rate: 18, unit: "PCS", hsn: "3923" },
      { itemId: "itm-raw-3", itemName: "Glycerine & Carbomer Mix", qty: 2.5, rate: 160, unit: "LTR", hsn: "3824" }
    ],
    jobWorkCharges: 850
  }
]

export const INITIAL_PAYMENTS: PaymentRecord[] = [
  {
    id: "pmt-in-1",
    paymentNo: "PAY-IN-2026-0001",
    type: "payment_in",
    partyId: "pty-1",
    partyName: "MedLife Healthcare Distributors",
    amount: 14000,
    date: "2026-10-12",
    paymentMode: "upi",
    depositAccount: "HDFC Current A/c (..4029)",
    referenceNo: "UPI/329482910482",
    docId: "inv-101",
    docNo: "INV-26-0042",
    notes: "Part payment received on invoice generation",
    status: "completed",
    createdBy: "Amit Verma (Sales)"
  },
  {
    id: "pmt-in-2",
    paymentNo: "PAY-IN-2026-0002",
    type: "payment_in",
    partyId: "pty-2",
    partyName: "Gujarat Surgical & Diagnostics",
    amount: 5000,
    date: "2026-10-13",
    paymentMode: "bank",
    depositAccount: "ICICI Bank (..8821)",
    referenceNo: "NEFT-N329104812",
    docId: "inv-102",
    docNo: "INV-26-0043",
    notes: "Part payment against printer supply",
    status: "completed",
    createdBy: "Rajesh Sharma (Owner)"
  },
  {
    id: "pmt-out-1",
    paymentNo: "PAY-OUT-2026-0001",
    type: "payment_out",
    partyId: "pty-3",
    partyName: "Bharat Chemical & Solvent Corp",
    amount: 28320,
    date: "2026-10-09",
    paymentMode: "bank",
    paidFromAccount: "HDFC Current A/c (..4029)",
    referenceNo: "RTGS-HDFC29481029",
    docId: "pur-201",
    docNo: "BILL-26-0089",
    notes: "Payment cleared for 200 LTR IPA bulk purchase",
    status: "completed",
    createdBy: "Neha Gupta (Purchase)"
  }
]

export const INITIAL_SALES_ORDERS: SalesOrder[] = [
  {
    id: "so-101",
    orderNo: "SO-26-0012",
    date: "2026-10-14",
    expectedDeliveryDate: "2026-10-20",
    partyId: "pty-1",
    partyName: "MedLife Healthcare Distributors",
    partyGstin: "27AAACM9988G1Z2",
    partyStateCode: "27",
    godownId: "godown-1",
    godownName: "Main Warehouse (Bhiwandi)",
    items: [
      {
        itemId: "itm-1",
        name: "Paracetamol 650mg Blister Pack",
        hsn: "300490",
        qty: 100,
        unit: "BOX",
        rate: 305,
        discountPercent: 0,
        gstRate: 12,
        taxableAmount: 30500,
        cgst: 1830,
        sgst: 1830,
        igst: 0,
        total: 34160,
        purchaseCost: 210
      },
      {
        itemId: "itm-5",
        name: "Hand Sanitizer Gel 500ml Dispenser",
        hsn: "380894",
        qty: 40,
        unit: "BTL",
        rate: 195,
        discountPercent: 5,
        gstRate: 18,
        taxableAmount: 7410,
        cgst: 666.9,
        sgst: 666.9,
        igst: 0,
        total: 8743.8,
        purchaseCost: 110
      }
    ],
    subtotal: 37910,
    taxTotal: 4993.8,
    grandTotal: 42903.8,
    orderStatus: "confirmed",
    invoicedStatus: "not_invoiced",
    referenceNo: "PO-MED-9921",
    notes: "Direct wholesale distribution booking. Priority dispatch by Friday."
  },
  {
    id: "so-102",
    orderNo: "SO-26-0013",
    date: "2026-10-14",
    expectedDeliveryDate: "2026-10-18",
    partyId: "pty-2",
    partyName: "Gujarat Surgical & Diagnostics",
    partyGstin: "24AABCG1234D1Z8",
    partyStateCode: "24",
    godownId: "godown-2",
    godownName: "City Distribution Hub",
    items: [
      {
        itemId: "itm-4",
        name: "Thermal Barcode Label Printer 4-inch",
        hsn: "844332",
        qty: 2,
        unit: "PCS",
        rate: 9700,
        discountPercent: 0,
        gstRate: 18,
        taxableAmount: 19400,
        cgst: 0,
        sgst: 0,
        igst: 3492,
        total: 22892,
        purchaseCost: 7800
      }
    ],
    subtotal: 19400,
    taxTotal: 3492,
    grandTotal: 22892,
    orderStatus: "open",
    invoicedStatus: "not_invoiced",
    referenceNo: "GSD-OCT-402",
    notes: "Awaiting final confirmation from procurement team."
  },
  {
    id: "so-103",
    orderNo: "SO-26-0014",
    date: "2026-10-11",
    expectedDeliveryDate: "2026-10-13",
    partyId: "pty-1",
    partyName: "MedLife Healthcare Distributors",
    partyGstin: "27AAACM9988G1Z2",
    partyStateCode: "27",
    godownId: "godown-1",
    godownName: "Main Warehouse (Bhiwandi)",
    items: [
      {
        itemId: "itm-1",
        name: "Paracetamol 650mg Blister Pack",
        hsn: "300490",
        qty: 40,
        unit: "BOX",
        rate: 305,
        discountPercent: 0,
        gstRate: 12,
        taxableAmount: 12200,
        cgst: 732,
        sgst: 732,
        igst: 0,
        total: 13664,
        purchaseCost: 210
      }
    ],
    subtotal: 12200,
    taxTotal: 1464,
    grandTotal: 13664,
    orderStatus: "fulfilled",
    invoicedStatus: "invoiced",
    referenceNo: "MED-URG-102",
    notes: "Fulfilled and invoiced against INV-26-0042."
  }
]

export const INITIAL_DELIVERY_CHALLANS: DeliveryChallan[] = [
  {
    id: "dc-101",
    challanNo: "DC-26-0008",
    date: "2026-10-14",
    partyId: "pty-1",
    partyName: "MedLife Healthcare Distributors",
    partyGstin: "27AAACM9988G1Z2",
    partyAddress: "Godown 4B, Pharma Complex, Bhiwandi, Maharashtra",
    challanType: "goods_dispatch",
    vehicleNo: "MH-04-AB-8291",
    transporter: "V-Trans Logistics (LR: VT-88219)",
    godownId: "godown-1",
    godownName: "Main Warehouse (Bhiwandi)",
    items: [
      {
        itemId: "itm-1",
        name: "Paracetamol 650mg Blister Pack",
        hsn: "300490",
        qty: 60,
        unit: "BOX",
        rate: 305,
        discountPercent: 0,
        gstRate: 12,
        taxableAmount: 18300,
        cgst: 1098,
        sgst: 1098,
        igst: 0,
        total: 20496,
        batchNo: "PCM-26B01"
      }
    ],
    totalUnits: 60,
    goodsValue: 20496,
    status: "in_transit",
    linkedOrderId: "so-101",
    notes: "Partial shipment for SO-26-0012. Driver Contact: +91 98210 11223"
  },
  {
    id: "dc-102",
    challanNo: "DC-26-0009",
    date: "2026-10-13",
    partyId: "pty-2",
    partyName: "Gujarat Surgical & Diagnostics",
    partyGstin: "24AABCG1234D1Z8",
    partyAddress: "14 Ring Road, Satellite Area, Ahmedabad - 380015",
    challanType: "supply_on_approval",
    vehicleNo: "GJ-01-EF-4019",
    transporter: "Self / Dedicated Courier",
    godownId: "godown-2",
    godownName: "City Distribution Hub",
    items: [
      {
        itemId: "itm-4",
        name: "Thermal Barcode Label Printer 4-inch",
        hsn: "844332",
        qty: 2,
        unit: "PCS",
        rate: 9700,
        discountPercent: 0,
        gstRate: 18,
        taxableAmount: 19400,
        cgst: 0,
        sgst: 0,
        igst: 3492,
        total: 22892
      }
    ],
    totalUnits: 2,
    goodsValue: 22892,
    status: "delivered",
    notes: "Demonstration unit for 7 days clinical evaluation under GST Rule 55(1)(c). If unapproved, will be returned."
  },
  {
    id: "dc-103",
    challanNo: "DC-26-0010",
    date: "2026-10-10",
    partyId: "pty-3",
    partyName: "Apex Precision Lab (Job Worker)",
    partyGstin: "27AABCA9921E1Z0",
    partyAddress: "MIDC Phase 2, Rabale, Navi Mumbai",
    challanType: "job_work",
    vehicleNo: "MH-03-CD-1120",
    transporter: "Navata Road Transport (LR: NR-4901)",
    godownId: "godown-1",
    godownName: "Main Warehouse (Bhiwandi)",
    items: [
      {
        itemId: "itm-5",
        name: "Hand Sanitizer Gel 500ml Dispenser",
        hsn: "380894",
        qty: 150,
        unit: "BTL",
        rate: 195,
        discountPercent: 0,
        gstRate: 18,
        taxableAmount: 29250,
        cgst: 2632.5,
        sgst: 2632.5,
        igst: 0,
        total: 34515
      }
    ],
    totalUnits: 150,
    goodsValue: 34515,
    status: "delivered",
    notes: "Goods dispatched for sterile packaging and batch tamper sealing under Section 143 (Job Work)."
  }
]

export const INITIAL_QUOTATIONS: Quotation[] = [
  {
    id: "qt-101",
    quotationNo: "QT-26-0001",
    date: "2026-10-13",
    validTillDate: "2026-10-28",
    partyId: "pty-1",
    partyName: "MedLife Healthcare Distributors",
    partyGstin: "27AAACM9988G1Z2",
    partyStateCode: "27",
    godownId: "godown-1",
    godownName: "Main Warehouse (Bhiwandi)",
    items: [
      {
        itemId: "itm-1",
        name: "Paracetamol 650mg Blister Pack",
        hsn: "300490",
        qty: 150,
        unit: "BOX",
        rate: 300,
        discountPercent: 5,
        gstRate: 12,
        taxableAmount: 42750,
        cgst: 2565,
        sgst: 2565,
        igst: 0,
        total: 47880,
        purchaseCost: 210
      },
      {
        itemId: "itm-5",
        name: "Hand Sanitizer Gel 500ml Dispenser",
        hsn: "380894",
        qty: 50,
        unit: "BTL",
        rate: 190,
        discountPercent: 0,
        gstRate: 18,
        taxableAmount: 9500,
        cgst: 855,
        sgst: 855,
        igst: 0,
        total: 11210,
        purchaseCost: 110
      }
    ],
    subtotal: 52250,
    taxTotal: 6840,
    cgstTotal: 3420,
    sgstTotal: 3420,
    igstTotal: 0,
    roundOff: 0,
    grandTotal: 59090,
    status: "sent",
    notes: "Rates valid till 28th October 2026. Standard commercial delivery within 3 days of PO receipt.",
    terms: "1. 30 days credit from invoice date.\n2. Delivery FOB Bhiwandi warehouse.\n3. Goods once sold will not be taken back unless damaged in transit.",
    createdAt: "2026-10-13T10:30:00.000Z"
  },
  {
    id: "qt-102",
    quotationNo: "QT-26-0002",
    date: "2026-10-14",
    validTillDate: "2026-10-21",
    partyId: "pty-2",
    partyName: "Gujarat Surgical & Diagnostics",
    partyGstin: "24AACCG1122D1Z8",
    partyStateCode: "24",
    godownId: "godown-2",
    godownName: "City Distribution Hub",
    items: [
      {
        itemId: "itm-3",
        name: "Thermal Receipt Printer 80mm USB+LAN",
        hsn: "844332",
        qty: 5,
        unit: "PCS",
        rate: 4700,
        discountPercent: 2,
        gstRate: 18,
        taxableAmount: 23030,
        cgst: 0,
        sgst: 0,
        igst: 4145.4,
        total: 27175.4,
        purchaseCost: 3800
      }
    ],
    subtotal: 23030,
    taxTotal: 4145.4,
    cgstTotal: 0,
    sgstTotal: 0,
    igstTotal: 4145.4,
    roundOff: -0.4,
    grandTotal: 27175,
    status: "accepted",
    notes: "Special regional wholesale quote for festive season. Free USB cables included.",
    terms: "1. 100% advance or Letter of Credit.\n2. Warranty: 1 year standard manufacturer warranty.",
    createdAt: "2026-10-14T11:45:00.000Z"
  }
]

export const INITIAL_PROFORMA_INVOICES: ProformaInvoice[] = [
  {
    id: "pi-101",
    proformaNo: "PI-26-0001",
    date: "2026-10-14",
    dueDate: "2026-10-20",
    partyId: "pty-2",
    partyName: "Gujarat Surgical & Diagnostics",
    partyGstin: "24AACCG1122D1Z8",
    partyStateCode: "24",
    godownId: "godown-2",
    godownName: "City Distribution Hub",
    items: [
      {
        itemId: "itm-3",
        name: "Thermal Receipt Printer 80mm USB+LAN",
        hsn: "844332",
        qty: 5,
        unit: "PCS",
        rate: 4700,
        discountPercent: 2,
        gstRate: 18,
        taxableAmount: 23030,
        cgst: 0,
        sgst: 0,
        igst: 4145.4,
        total: 27175.4,
        purchaseCost: 3800
      }
    ],
    subtotal: 23030,
    taxTotal: 4145.4,
    cgstTotal: 0,
    sgstTotal: 0,
    igstTotal: 4145.4,
    roundOff: -0.4,
    grandTotal: 27175,
    advanceRequested: 15000,
    advanceReceived: 15000,
    status: "advance_received",
    bankDetails: "HDFC Bank Ltd, Account: 50200012345678, IFSC: HDFC0000123, Branch: Andheri East",
    notes: "50% advance received via NEFT. Final Tax Invoice will be issued upon courier dispatch.",
    terms: "1. This is a Proforma Invoice, not a Tax Invoice.\n2. Goods will be dispatched within 48 hours of advance clearance.",
    createdAt: "2026-10-14T14:10:00.000Z"
  },
  {
    id: "pi-102",
    proformaNo: "PI-26-0002",
    date: "2026-10-15",
    dueDate: "2026-10-22",
    partyId: "pty-1",
    partyName: "MedLife Healthcare Distributors",
    partyGstin: "27AAACM9988G1Z2",
    partyStateCode: "27",
    godownId: "godown-1",
    godownName: "Main Warehouse (Bhiwandi)",
    items: [
      {
        itemId: "itm-4",
        name: "Pure Mustard Oil Tin (15 Litre)",
        hsn: "151491",
        qty: 30,
        unit: "TIN",
        rate: 1950,
        discountPercent: 3,
        gstRate: 5,
        taxableAmount: 56745,
        cgst: 1418.63,
        sgst: 1418.63,
        igst: 0,
        total: 59582.26,
        purchaseCost: 1720
      }
    ],
    subtotal: 56745,
    taxTotal: 2837.26,
    cgstTotal: 1418.63,
    sgstTotal: 1418.63,
    igstTotal: 0,
    roundOff: -0.26,
    grandTotal: 59582,
    advanceRequested: 30000,
    advanceReceived: 0,
    status: "sent",
    bankDetails: "HDFC Bank Ltd, Account: 50200012345678, IFSC: HDFC0000123, Branch: Andheri East",
    notes: "Proforma generated for advance clearance from regional procurement desk.",
    terms: "1. Payment required within 7 days to lock price.\n2. Dispatched against advance confirmation.",
    createdAt: "2026-10-15T09:00:00.000Z"
  }
]

export const INITIAL_SALES_RETURNS: SalesReturn[] = [
  {
    id: "sr-101",
    returnNo: "SR-26-0001",
    date: "2026-10-15",
    originalInvoiceId: "sal-1",
    originalInvoiceNo: "INV-26-0042",
    customerId: "pty-1",
    customerName: "MedLife Healthcare Distributors",
    customerGstin: "27AAACM9988G1Z2",
    receivingGodownId: "godown-1",
    reason: "damaged_goods",
    items: [
      {
        itemId: "itm-1",
        name: "Paracetamol 650mg Blister Pack",
        code: "MED-PCM-650",
        hsn: "300490",
        qty: 5,
        rate: 305,
        gstRate: 12,
        amount: 1525,
        cgst: 91.5,
        sgst: 91.5,
        igst: 0,
        total: 1708,
        condition: "damaged"
      }
    ],
    subtotal: 1525,
    cgstTotal: 91.5,
    sgstTotal: 91.5,
    igstTotal: 0,
    grandTotal: 1708,
    status: "received",
    creditNoteId: "cn-101",
    creditNoteNo: "CN-26-0001",
    notes: "5 boxes received with transit blister crushed seals. Inspected and quarantined in Godown 1."
  },
  {
    id: "sr-102",
    returnNo: "SR-26-0002",
    date: "2026-10-16",
    originalInvoiceId: "sal-2",
    originalInvoiceNo: "INV-26-0043",
    customerId: "pty-2",
    customerName: "Gujarat Surgical & Diagnostics",
    customerGstin: "24AACCG1122D1Z8",
    receivingGodownId: "godown-2",
    reason: "wrong_item_delivered",
    items: [
      {
        itemId: "itm-3",
        name: "Thermal Receipt Printer 80mm USB+LAN",
        code: "POS-THP-80",
        hsn: "844332",
        qty: 1,
        rate: 4850,
        gstRate: 18,
        amount: 4850,
        cgst: 0,
        sgst: 0,
        igst: 873,
        total: 5723,
        condition: "resalable"
      }
    ],
    subtotal: 4850,
    cgstTotal: 0,
    sgstTotal: 0,
    igstTotal: 873,
    grandTotal: 5723,
    status: "pending",
    notes: "Customer received single-port instead of dual LAN printer. Package in transit back to hub."
  }
]

export const INITIAL_CREDIT_NOTES: CreditNote[] = [
  {
    id: "cn-101",
    creditNoteNo: "CN-26-0001",
    date: "2026-10-15",
    originalInvoiceId: "sal-1",
    originalInvoiceNo: "INV-26-0042",
    salesReturnId: "sr-101",
    salesReturnNo: "SR-26-0001",
    customerId: "pty-1",
    customerName: "MedLife Healthcare Distributors",
    customerGstin: "27AAACM9988G1Z2",
    placeOfSupply: "27 - Maharashtra (Intra-state)",
    reason: "sales_return",
    returnToInventory: false, // Already restocked via Sales Return SR-26-0001
    godownId: "godown-1",
    items: [
      {
        itemId: "itm-1",
        name: "Paracetamol 650mg Blister Pack",
        code: "MED-PCM-650",
        hsn: "300490",
        qty: 5,
        rate: 305,
        gstRate: 12,
        amount: 1525,
        cgst: 91.5,
        sgst: 91.5,
        igst: 0,
        total: 1708
      }
    ],
    subtotal: 1525,
    cgstTotal: 91.5,
    sgstTotal: 91.5,
    igstTotal: 0,
    grandTotal: 1708,
    status: "applied",
    appliedInvoiceId: "inv-101",
    appliedInvoiceNo: "INV-26-0042",
    appliedAmount: 1708,
    appliedDate: "2026-10-15",
    appliedMethod: "invoice_offset",
    notes: "Credit note issued against Sales Return SR-26-0001 for damaged blister packs.",
    terms: "1. Credit balance adjusted against next billing cycle.\n2. GST liability reversed under CGST Section 34(1)."
  },
  {
    id: "cn-102",
    creditNoteNo: "CN-26-0002",
    date: "2026-10-16",
    originalInvoiceId: "sal-1",
    originalInvoiceNo: "INV-26-0042",
    customerId: "pty-1",
    customerName: "MedLife Healthcare Distributors",
    customerGstin: "27AAACM9988G1Z2",
    placeOfSupply: "27 - Maharashtra (Intra-state)",
    reason: "post_sale_discount",
    returnToInventory: false,
    items: [
      {
        itemId: "itm-5",
        name: "Hand Sanitizer Gel 500ml Dispenser",
        code: "HND-SNT-500",
        hsn: "380894",
        qty: 30,
        rate: 20, // ₹20 post-sale rebate per bottle
        gstRate: 18,
        amount: 600,
        cgst: 54,
        sgst: 54,
        igst: 0,
        total: 708
      }
    ],
    subtotal: 600,
    cgstTotal: 54,
    sgstTotal: 54,
    igstTotal: 0,
    grandTotal: 708,
    status: "open",
    notes: "Annual volume turnover discount rebate approved for Q3 healthcare supplies.",
    terms: "1. Post-sale financial discount credit.\n2. Customer may deduct from pending invoice balance."
  }
]

export const INITIAL_PURCHASE_RETURNS: PurchaseReturn[] = [
  {
    id: "pr-101",
    returnNo: "PR-26-0001",
    date: "2026-10-14",
    originalBillId: "pur-202",
    originalBillNo: "BILL-26-0090",
    vendorId: "pty-3",
    vendorName: "Bharat Chemical & Solvent Corp",
    vendorGstin: "27AAACB3344K1ZR",
    dispatchGodownId: "godown-1",
    transporter: "V-Trans Logistics",
    lrNumber: "LR-78921",
    reason: "defective_batch",
    items: [
      {
        itemId: "itm-raw-1",
        name: "IPA Isopropyl Alcohol 99% (Bulk)",
        code: "RAW-IPA-99",
        hsn: "290512",
        qty: 25,
        rate: 120,
        gstRate: 18,
        amount: 3000,
        cgst: 270,
        sgst: 270,
        igst: 0,
        total: 3540
      }
    ],
    subtotal: 3000,
    cgstTotal: 270,
    sgstTotal: 270,
    igstTotal: 0,
    grandTotal: 3540,
    status: "dispatched",
    debitNoteId: "dn-101",
    debitNoteNo: "DN-26-0001",
    notes: "25 Ltr drums returned due to density assay falling below 98.5% purity specifications."
  }
]

export const INITIAL_DEBIT_NOTES: DebitNote[] = [
  {
    id: "dn-101",
    debitNoteNo: "DN-26-0001",
    date: "2026-10-14",
    originalBillId: "pur-202",
    originalBillNo: "BILL-26-0090",
    purchaseReturnId: "pr-101",
    purchaseReturnNo: "PR-26-0001",
    vendorId: "pty-3",
    vendorName: "Bharat Chemical & Solvent Corp",
    vendorGstin: "27AAACB3344K1ZR",
    placeOfSupply: "27 - Maharashtra (Intra-state)",
    reason: "purchase_return",
    deductFromInventory: false, // Already deducted via Purchase Return PR-26-0001
    godownId: "godown-1",
    items: [
      {
        itemId: "itm-raw-1",
        name: "IPA Isopropyl Alcohol 99% (Bulk)",
        code: "RAW-IPA-99",
        hsn: "290512",
        qty: 25,
        rate: 120,
        gstRate: 18,
        amount: 3000,
        cgst: 270,
        sgst: 270,
        igst: 0,
        total: 3540
      }
    ],
    subtotal: 3000,
    cgstTotal: 270,
    sgstTotal: 270,
    igstTotal: 0,
    grandTotal: 3540,
    status: "applied",
    appliedBillId: "pur-202",
    appliedBillNo: "BILL-26-0090",
    appliedAmount: 3540,
    appliedDate: "2026-10-14",
    appliedMethod: "bill_offset",
    notes: "Debit Note issued against vendor return PR-26-0001. ITC reversed in GSTR-3B.",
    terms: "1. Amount debited against next chemical consignment.\n2. ITC reversal reported under GST Rules."
  },
  {
    id: "dn-102",
    debitNoteNo: "DN-26-0002",
    date: "2026-10-16",
    originalBillId: "pur-202",
    originalBillNo: "BILL-26-0090",
    vendorId: "pty-3",
    vendorName: "Bharat Chemical & Solvent Corp",
    vendorGstin: "27AAACB3344K1ZR",
    placeOfSupply: "27 - Maharashtra (Intra-state)",
    reason: "supplier_overcharge",
    deductFromInventory: false,
    items: [
      {
        itemId: "itm-raw-1",
        name: "IPA Isopropyl Alcohol 99% (Bulk)",
        code: "RAW-IPA-99",
        hsn: "290512",
        qty: 100,
        rate: 5, // ₹5 per unit rate difference
        gstRate: 18,
        amount: 500,
        cgst: 45,
        sgst: 45,
        igst: 0,
        total: 590
      }
    ],
    subtotal: 500,
    cgstTotal: 45,
    sgstTotal: 45,
    igstTotal: 0,
    grandTotal: 590,
    status: "open",
    notes: "Price discrepancy correction: PO agreed rate was ₹115/Ltr whereas invoice charged ₹120/Ltr.",
    terms: "1. Overcharge debited from vendor ledger."
  }
]

export const INITIAL_BANK_ACCOUNTS: BankAccount[] = [
  {
    id: "bank-1",
    accountDisplayName: "HDFC Bank Ltd - Main Current A/c",
    openingBalance: 1845200,
    currentBalance: 1845200,
    asOfDate: "2026-04-01",
    accountNumber: "50200012345678",
    ifscCode: "HDFC0000123",
    upiId: "apexglobal@hdfcbank",
    bankName: "HDFC Bank Ltd",
    accountHolderName: "Apex Global Traders & Mfrs",
    printUpiQrOnInvoices: true,
    printBankDetailsOnInvoices: true,
    isDefault: true,
    accountType: "current",
    branchName: "Andheri East, Mumbai",
    createdAt: "2026-04-01"
  },
  {
    id: "bank-2",
    accountDisplayName: "ICICI Bank - Operating OD",
    openingBalance: 920400,
    currentBalance: 920400,
    asOfDate: "2026-04-01",
    accountNumber: "001105023948",
    ifscCode: "ICIC0000011",
    upiId: "apexglobal@icici",
    bankName: "ICICI Bank",
    accountHolderName: "Apex Global Traders & Mfrs",
    printUpiQrOnInvoices: false,
    printBankDetailsOnInvoices: false,
    isDefault: false,
    accountType: "overdraft",
    branchName: "Bandra Kurla Complex, Mumbai",
    createdAt: "2026-04-01"
  },
  {
    id: "bank-3",
    accountDisplayName: "SBI - Corporate Tax Account",
    openingBalance: 412000,
    currentBalance: 412000,
    asOfDate: "2026-04-01",
    accountNumber: "38291048592",
    ifscCode: "SBIN0000300",
    upiId: "apexglobal@sbi",
    bankName: "State Bank of India",
    accountHolderName: "Apex Global Traders & Mfrs",
    printUpiQrOnInvoices: false,
    printBankDetailsOnInvoices: false,
    isDefault: false,
    accountType: "current",
    branchName: "Nariman Point, Mumbai",
    createdAt: "2026-04-01"
  }
]


