import { 
  ChatsConnection, 
  CrmConnection, 
  ApiKeyItem, 
  WebhookEndpoint, 
  WebhookDeliveryLog, 
  McpConnectedTool, 
  IntegrationActivityLogEntry,
  WhatsAppTemplate,
  CrmConflictItem
} from "@/types/integrations"

export const INITIAL_WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: "tpl_inv_created",
    name: "invoice_dispatch_v2",
    category: "utility",
    status: "approved",
    language: "en_IN",
    hasDocumentHeader: true,
    variables: ["Customer Name", "Invoice No", "Grand Total", "Due Date"],
    bodyText: "Dear {{1}}, your invoice {{2}} of ₹{{3}} has been generated and is attached. Due date: {{4}}. Thank you, Automate Business.",
    samplePreview: "Dear MedLife Healthcare Distributors, your invoice INV-26-0042 of ₹20,222.00 has been generated and is attached. Due date: 2026-11-15. Thank you, Automate Business."
  },
  {
    id: "tpl_pay_received",
    name: "payment_receipt_confirm",
    category: "utility",
    status: "approved",
    language: "en_IN",
    variables: ["Customer Name", "Payment No", "Amount Paid", "Remaining Balance"],
    bodyText: "Hi {{1}}, we received payment {{2}} of ₹{{3}}. Your updated balance is ₹{{4}}.",
    samplePreview: "Hi MedLife Healthcare Distributors, we received payment REC-26-0012 of ₹14,000.00. Your updated balance is ₹6,222.00."
  },
  {
    id: "tpl_pay_reminder",
    name: "payment_due_reminder_formal",
    category: "utility",
    status: "approved",
    language: "en_IN",
    variables: ["Customer Name", "Invoice No", "Balance Due", "Due Date", "UPI ID"],
    bodyText: "Gentle reminder for {{1}}: Invoice {{2}} of ₹{{3}} is due on {{4}}. Pay instantly via UPI: {{5}}.",
    samplePreview: "Gentle reminder for MedLife Healthcare Distributors: Invoice INV-26-0042 of ₹6,222.00 is due on 2026-11-15. Pay instantly via UPI: apexglobal@okhdfcbank."
  },
  {
    id: "tpl_po_supplier",
    name: "purchase_order_notify",
    category: "utility",
    status: "approved",
    language: "en_IN",
    hasDocumentHeader: true,
    variables: ["Supplier Name", "PO Number", "Delivery Target Date"],
    bodyText: "Dear {{1}}, Purchase Order {{2}} has been approved. Please verify delivery deadline of {{3}}.",
    samplePreview: "Dear Sun Pharma Distribution, Purchase Order PO-2026-008 has been approved. Please verify delivery deadline of 2026-11-18."
  },
  {
    id: "tpl_challan_dispatched",
    name: "delivery_challan_dispatch",
    category: "utility",
    status: "approved",
    language: "en_IN",
    variables: ["Party Name", "Challan No", "Vehicle No"],
    bodyText: "Consignment dispatched to {{1}} via Challan {{2}}. Transporter Vehicle No: {{3}}.",
    samplePreview: "Consignment dispatched to Gujarat Surgical & Diagnostics via Challan DC-26-0019. Transporter Vehicle No: MH-04-AZ-9921."
  },
  {
    id: "tpl_low_stock_mgr",
    name: "internal_low_stock_alert",
    category: "utility",
    status: "approved",
    language: "en_IN",
    variables: ["Item Name", "Current Qty", "Reorder Level"],
    bodyText: "ALERT: Item {{1}} has dropped to {{2}} units (Reorder Level: {{3}}). Immediate purchase required.",
    samplePreview: "ALERT: Item Paracetamol 650mg Blister Pack has dropped to 140 units (Reorder Level: 200). Immediate purchase required."
  },
  {
    id: "tpl_out_stock_mgr",
    name: "internal_out_of_stock",
    category: "utility",
    status: "approved",
    language: "en_IN",
    variables: ["Item Name", "Warehouse Name"],
    bodyText: "CRITICAL: Item {{1}} is OUT OF STOCK at {{2}}.",
    samplePreview: "CRITICAL: Item Thermal Receipt Printer 80mm USB+LAN is OUT OF STOCK at Main Warehouse Bhiwandi."
  }
]

export const INITIAL_CHATS_CONNECTION: ChatsConnection = {
  status: "connected",
  phoneNumber: "+91 98200 11001",
  displayName: "Automate Business Solutions",
  displayStatus: "approved",
  qualityRating: "high",
  messagingLimit: "10000",
  creditBalance: 1240,
  channelId: "chn_waba_88492104",
  apiKey: "ac_live_sk_8849f27b9104",
  lastActivityAt: "10 mins ago",
  rules: [
    {
      id: "rule_inv",
      eventId: "invoice.created",
      eventName: "Sales Invoice Created",
      description: "Send WhatsApp message with attached PDF when an invoice is saved",
      defaultRecipient: "customer",
      templateId: "tpl_inv_created",
      templateName: "invoice_dispatch_v2",
      status: "active",
      variableMapping: { "1": "partyName", "2": "docNo", "3": "grandTotal", "4": "dueDate" },
      attachPdf: true
    },
    {
      id: "rule_pay_rec",
      eventId: "payment.received",
      eventName: "Payment Receipt Confirmed",
      description: "Notify customer of successful payment and remaining outstanding balance",
      defaultRecipient: "customer",
      templateId: "tpl_pay_received",
      templateName: "payment_receipt_confirm",
      status: "active",
      variableMapping: { "1": "partyName", "2": "paymentNo", "3": "amount", "4": "remainingBalance" },
      attachPdf: false
    },
    {
      id: "rule_pay_rem",
      eventId: "payment.due_reminder",
      eventName: "Payment Due Reminder",
      description: "Send courteous payment reminder 3 days before or on due date",
      defaultRecipient: "customer",
      templateId: "tpl_pay_reminder",
      templateName: "payment_due_reminder_formal",
      status: "active",
      variableMapping: { "1": "partyName", "2": "docNo", "3": "balanceDue", "4": "dueDate", "5": "upiId" },
      attachPdf: false
    },
    {
      id: "rule_po",
      eventId: "purchase_order.created",
      eventName: "Purchase Order Approved",
      description: "Send formal purchase order to vendor contact",
      defaultRecipient: "supplier",
      templateId: "tpl_po_supplier",
      templateName: "purchase_order_notify",
      status: "active",
      variableMapping: { "1": "supplierName", "2": "poNumber", "3": "expectedDeliveryDate" },
      attachPdf: true
    },
    {
      id: "rule_challan",
      eventId: "challan.dispatched",
      eventName: "Delivery Challan Dispatched",
      description: "Notify party with vehicle number upon warehouse dispatch",
      defaultRecipient: "customer",
      templateId: "tpl_challan_dispatched",
      templateName: "delivery_challan_dispatch",
      status: "active",
      variableMapping: { "1": "partyName", "2": "challanNo", "3": "vehicleNo" },
      attachPdf: false
    },
    {
      id: "rule_low_stock",
      eventId: "stock.low",
      eventName: "Low Stock Alert Threshold",
      description: "Alert warehouse manager when stock falls below reorder point",
      defaultRecipient: "owner",
      templateId: "tpl_low_stock_mgr",
      templateName: "internal_low_stock_alert",
      status: "active",
      variableMapping: { "1": "itemName", "2": "currentStock", "3": "reorderLevel" },
      attachPdf: false
    },
    {
      id: "rule_out_stock",
      eventId: "stock.out",
      eventName: "Out of Stock Zero Level",
      description: "Emergency alert when SKU inventory drops to zero",
      defaultRecipient: "owner",
      templateId: "tpl_out_stock_mgr",
      templateName: "internal_out_of_stock",
      status: "active",
      variableMapping: { "1": "itemName", "2": "godownName" },
      attachPdf: false
    },
    {
      id: "rule_batch_exp",
      eventId: "batch.near_expiry",
      eventName: "Batch Near Expiry Window",
      description: "Notify quality control team when batch is within 30 days of expiry",
      defaultRecipient: "owner",
      templateId: "tpl_low_stock_mgr",
      templateName: "internal_low_stock_alert",
      status: "off",
      variableMapping: { "1": "batchNo", "2": "expiryDate" },
      attachPdf: false
    },
    {
      id: "rule_transfer",
      eventId: "transfer.completed",
      eventName: "Stock Transfer Completed",
      description: "Notify receiving godown manager upon inward transfer",
      defaultRecipient: "owner",
      templateId: "tpl_challan_dispatched",
      templateName: "delivery_challan_dispatch",
      status: "off",
      variableMapping: { "1": "sourceGodown", "2": "destGodown" },
      attachPdf: false
    }
  ]
}

export const INITIAL_CRM_CONNECTION: CrmConnection = {
  status: "connected",
  apiKey: "crm_live_sk_7721a94e82b",
  instanceUrl: "https://crm.automatebusiness.com",
  syncCustomers: true,
  syncSuppliers: true,
  syncDirection: "merge",
  lastSyncedAt: "Today, 11:24 AM",
  syncedContactsCount: 1420,
  conflictsCount: 1,
  dealToOrder: {
    enabled: true,
    triggerStage: "Closed Won",
    autoStockCheck: true,
    autoConfirmIfInStock: false,
    notifyUserRoleId: "owner"
  },
  fieldMappings: [
    { crmField: "Account Name / Company", abField: "partyName", direction: "2-way" },
    { crmField: "Primary Phone", abField: "phone", direction: "2-way" },
    { crmField: "Primary Email", abField: "email", direction: "2-way" },
    { crmField: "Tax Identification (GSTIN)", abField: "gstin", direction: "2-way" },
    { crmField: "Billing Address", abField: "billingAddress", direction: "2-way" },
    { crmField: "Credit Limit (INR)", abField: "creditLimit", direction: "2-way" }
  ]
}

export const INITIAL_CRM_CONFLICTS: CrmConflictItem[] = [
  {
    id: "conf-1",
    partyName: "MedLife Healthcare Distributors",
    partyType: "customer",
    crmData: {
      name: "MedLife Healthcare Distributors Pvt Ltd",
      phone: "+91 98211 55667",
      email: "procurement@medlifehc.in",
      address: "Plot 42, GIDC Estate, Ahmedabad, Gujarat 382445",
      updatedAt: "Today, 10:15 AM"
    },
    abData: {
      name: "MedLife Healthcare Distributors",
      phone: "+91 98211 55667",
      email: "accounts@medlifehc.in",
      address: "Unit 401, Nariman Point, Mumbai, Maharashtra 400021",
      updatedAt: "Yesterday, 04:30 PM"
    },
    conflictingFields: ["name", "email", "address"]
  }
]

export const INITIAL_API_KEYS: ApiKeyItem[] = [
  {
    id: "key-1",
    name: "E-Commerce Webhook Sync",
    keyMasked: "ab_live_••••••••3f9a",
    environment: "live",
    scopes: ["items:read", "stock:read", "sales:write", "parties:read"],
    ipAllowlist: "192.168.1.1/24, 203.0.113.45",
    createdAt: "2026-10-15",
    lastUsedAt: "12 mins ago",
    status: "active"
  },
  {
    id: "key-2",
    name: "Accounting Microservice Read",
    keyMasked: "ab_test_••••••••8b2c",
    environment: "test",
    scopes: ["sales:read", "purchases:read", "reports:read"],
    createdAt: "2026-10-28",
    lastUsedAt: "Yesterday",
    status: "active"
  }
]

export const INITIAL_WEBHOOK_ENDPOINTS: WebhookEndpoint[] = [
  {
    id: "wh-1",
    url: "https://api.retailerp.in/v1/ab-inventory-sync",
    description: "Production ERP order and stock level updates",
    signingSecret: "whsec_live_9a7d3f8c2b1e4a6d8c0f5e3a",
    subscribedEvents: ["invoice.created", "payment.received", "stock.low"],
    status: "active",
    createdAt: "2026-10-20",
    lastDeliveryAt: "15 mins ago",
    lastDeliveryStatus: 200,
    failureCount: 0
  },
  {
    id: "wh-2",
    url: "https://automation.customcrm.com/hooks/ab-events",
    description: "CRM party and deal sync stream",
    signingSecret: "whsec_test_7f2b4c6e8d1a3c5e9b0d2f4a",
    subscribedEvents: ["party.created", "party.updated", "purchase_order.created"],
    status: "active",
    createdAt: "2026-10-25",
    lastDeliveryAt: "1 hour ago",
    lastDeliveryStatus: 200,
    failureCount: 0
  }
]

export const INITIAL_WEBHOOK_LOGS: WebhookDeliveryLog[] = [
  {
    id: "whlog-1",
    endpointId: "wh-1",
    endpointUrl: "https://api.retailerp.in/v1/ab-inventory-sync",
    eventId: "evt_inv_98213",
    eventType: "invoice.created",
    timestamp: "Today, 11:42 AM",
    attempts: 1,
    statusCode: 200,
    durationMs: 142,
    success: true,
    payload: { invoiceNo: "INV-26-0043", party: "Gujarat Surgical & Diagnostics", grandTotal: 11446.00 },
    responseBodySnippet: '{"received": true, "syncId": "erp_sync_8819"}'
  },
  {
    id: "whlog-2",
    endpointId: "wh-1",
    endpointUrl: "https://api.retailerp.in/v1/ab-inventory-sync",
    eventId: "evt_pay_44120",
    eventType: "payment.received",
    timestamp: "Today, 11:15 AM",
    attempts: 1,
    statusCode: 200,
    durationMs: 118,
    success: true,
    payload: { paymentNo: "REC-26-0012", amount: 14000.00 },
    responseBodySnippet: '{"success": true}'
  }
]

export const INITIAL_MCP_TOOLS: McpConnectedTool[] = [
  {
    id: "mcp-1",
    toolName: "Cursor IDE (Developer Agent)",
    userId: "user-1",
    userName: "Rajesh Sharma (Owner)",
    accessLevel: "read_and_draft",
    connectedAt: "2026-10-30",
    lastActiveAt: "5 mins ago",
    status: "active"
  },
  {
    id: "mcp-2",
    toolName: "Claude Desktop",
    userId: "user-1",
    userName: "Rajesh Sharma (Owner)",
    accessLevel: "read_only",
    connectedAt: "2026-11-01",
    lastActiveAt: "2 hours ago",
    status: "active"
  }
]

export const INITIAL_INTEGRATION_LOGS: IntegrationActivityLogEntry[] = [
  {
    id: "act-1",
    source: "chats",
    sourceLabel: "Automate Chats",
    action: "invoice_dispatch_v2",
    entityId: "INV-26-0043",
    entityName: "Gujarat Surgical & Diagnostics",
    status: "success",
    timestamp: "12 mins ago",
    summary: "WhatsApp message delivered to +91 94260 33441",
    detailMessage: "Meta message ID: wamid.HBgMOTE5NDI2MDMzNDQxFQIAERgSMzE1MDY",
    canFix: false
  },
  {
    id: "act-2",
    source: "crm",
    sourceLabel: "Automate CRM",
    action: "Deal to Sales Order",
    entityId: "DEAL-8821",
    entityName: "MedLife Healthcare Distributors",
    status: "success",
    timestamp: "35 mins ago",
    summary: "Created Draft Sales Order SO-2026-0012 from Won CRM Deal",
    detailMessage: "Inventory stock verified: 140 units Paracetamol available.",
    canFix: false
  },
  {
    id: "act-3",
    source: "webhook",
    sourceLabel: "Webhooks",
    action: "invoice.created",
    entityId: "wh-1",
    entityName: "Retail ERP Sync",
    status: "success",
    timestamp: "48 mins ago",
    summary: "Delivered to https://api.retailerp.in/v1/ab-inventory-sync (200 OK)",
    detailMessage: "Response time: 142ms · HMAC verified",
    canFix: false
  },
  {
    id: "act-4",
    source: "mcp",
    sourceLabel: "MCP AI Server",
    action: "search_items & get_stock_levels",
    entityId: "mcp-1",
    entityName: "Cursor IDE",
    status: "success",
    timestamp: "1 hour ago",
    summary: "AI queried 8 items stock levels under read-only scope",
    detailMessage: "Actor: Rajesh Sharma · Tool query: check low stock SKUs",
    canFix: false
  },
  {
    id: "act-5",
    source: "chats",
    sourceLabel: "Automate Chats",
    action: "payment_due_reminder_formal",
    entityId: "INV-26-0041",
    entityName: "Shree Medical Stores",
    status: "failed",
    timestamp: "2 hours ago",
    summary: "Blocked: Party phone not opted in to WhatsApp messages",
    detailMessage: "Meta Rule: Customer must have opted in before business initiates template dispatch.",
    metaErrorCode: "OPT_IN_REQUIRED_403",
    canFix: true,
    fixActionType: "opt_in",
    fixActionLabel: "Record Opt-In"
  }
]

