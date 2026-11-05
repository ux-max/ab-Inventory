// ============================================================================
// Automate Business (AB Inventory) — Integrations Type Definitions
// ============================================================================

export type IntegrationStatus = 
  | "connected" 
  | "connecting" 
  | "not_connected" 
  | "needs_attention" 
  | "paused"

export type MetaQualityRating = "high" | "medium" | "low"
export type MetaMessagingLimitTier = "250" | "1000" | "10000" | "100000" | "unlimited"
export type RuleStatus = "active" | "draft" | "off"
export type WhatsAppRecipientType = "customer" | "supplier" | "owner" | "custom"

// ----------------------------------------------------------------------------
// 1. Automate Chats (Meta WhatsApp Business Platform)
// ----------------------------------------------------------------------------

export interface WhatsAppTemplate {
  id: string
  name: string
  category: "utility" | "marketing" | "authentication"
  status: "approved" | "pending" | "rejected" | "paused"
  language: string
  bodyText: string
  variables: string[] // e.g. ["1", "2", "3"]
  hasDocumentHeader?: boolean
  samplePreview?: string
}

export interface WhatsAppEventRule {
  id: string
  eventId: string
  eventName: string
  description: string
  defaultRecipient: WhatsAppRecipientType
  customPhone?: string
  templateId: string
  templateName: string
  status: RuleStatus
  variableMapping: Record<string, string> // e.g. { "1": "partyName", "2": "docNo", "3": "amount" }
  attachPdf: boolean
}

export interface ChatsConnection {
  status: IntegrationStatus
  phoneNumber: string
  displayName: string
  displayStatus: "approved" | "pending" | "rejected"
  qualityRating: MetaQualityRating
  messagingLimit: MetaMessagingLimitTier
  creditBalance: number // in INR
  channelId?: string
  apiKey?: string
  webhookSecret?: string
  lastActivityAt?: string
  attentionReason?: string
  rules: WhatsAppEventRule[]
}

// WhatsApp Opt-in & Delivery Tracking
export type WhatsAppOptInStatus = "opted_in" | "opted_out" | "pending"

export interface PartyWhatsAppOptIn {
  status: WhatsAppOptInStatus
  source?: "invoice_checkbox" | "direct_verbal" | "chat_inbound" | "crm_sync"
  updatedAt: string
  history?: Array<{
    status: WhatsAppOptInStatus
    source: string
    timestamp: string
  }>
}

export type WhatsAppDeliveryStatus = 
  | "blocked" 
  | "sending" 
  | "sent" 
  | "delivered" 
  | "read" 
  | "reply_received" 
  | "failed"

export interface WhatsAppMessageRecord {
  id: string
  docType: "invoice" | "purchase_order" | "payment_reminder" | "challan" | "alert"
  docId: string
  docNo: string
  partyName: string
  recipientPhone: string
  templateName: string
  status: WhatsAppDeliveryStatus
  sentAt: string
  deliveredAt?: string
  readAt?: string
  failureReason?: string
  metaErrorCode?: string
  canRetry?: boolean
  is24hWindowOpen?: boolean
  windowExpiresAt?: string
}

// ----------------------------------------------------------------------------
// 2. Automate CRM Integration
// ----------------------------------------------------------------------------

export interface CrmFieldMapping {
  crmField: string
  abField: string
  direction: "2-way" | "crm_to_ab" | "ab_to_crm"
}

export interface CrmConnection {
  status: IntegrationStatus
  apiKey?: string
  instanceUrl?: string
  syncCustomers: boolean
  syncSuppliers: boolean
  syncDirection: "merge" | "crm_to_ab" | "ab_to_crm"
  lastSyncedAt?: string
  syncedContactsCount: number
  conflictsCount: number
  attentionReason?: string
  fieldMappings?: CrmFieldMapping[]
  // Deal to Order Configuration
  dealToOrder: {
    enabled: boolean
    triggerStage?: string
    autoStockCheck: boolean
    autoConfirmIfInStock: boolean
    notifyUserRoleId: string
  }
}

export interface CrmConflictItem {
  id: string
  partyName: string
  partyType: "customer" | "supplier"
  crmData: {
    name: string
    phone: string
    email: string
    address: string
    updatedAt: string
  }
  abData: {
    name: string
    phone: string
    email: string
    address: string
    updatedAt: string
  }
  conflictingFields: string[]
  resolvedResolution?: "keep_crm" | "keep_ab" | "merge"
}

// ----------------------------------------------------------------------------
// 3. Developer Hub (API Keys & Webhooks)
// ----------------------------------------------------------------------------

export type ApiKeyEnvironment = "live" | "test"

export type ApiScope = 
  | "items:read" | "items:write"
  | "stock:read" | "stock:write"
  | "parties:read" | "parties:write"
  | "sales:read" | "sales:write"
  | "purchases:read" | "purchases:write"
  | "transfers:read" | "transfers:write"
  | "reports:read"
  | "whatsapp:read" | "whatsapp:optin"

export interface ApiKeyItem {
  id: string
  name: string
  keyMasked: string // e.g. "ab_live_••••••••3f9a"
  keySecret?: string // Only available once when created
  environment: ApiKeyEnvironment
  scopes: ApiScope[]
  ipAllowlist?: string
  createdAt: string
  lastUsedAt?: string
  expiresAt?: string
  status: "active" | "revoked" | "expired"
}

export interface WebhookEndpoint {
  id: string
  url: string
  description?: string
  signingSecret: string
  subscribedEvents: string[]
  status: "active" | "paused" | "disabled"
  createdAt: string
  lastDeliveryAt?: string
  lastDeliveryStatus?: number // e.g. 200
  failureCount: number
}

export interface WebhookDeliveryLog {
  id: string
  endpointId: string
  endpointUrl: string
  eventId: string
  eventType: string
  timestamp: string
  attempts: number
  statusCode?: number
  durationMs: number
  success: boolean
  payload: Record<string, unknown>
  responseBodySnippet?: string
}

// ----------------------------------------------------------------------------
// 4. Model Context Protocol (MCP) AI Server
// ----------------------------------------------------------------------------

export type McpAccessLevel = "read_only" | "read_and_draft" | "read_draft_confirm"

export interface McpConnectedTool {
  id: string
  toolName: string // e.g. "Cursor IDE", "Claude Desktop", "Automate Copilot"
  userId: string
  userName: string
  accessLevel: McpAccessLevel
  connectedAt: string
  lastActiveAt: string
  status: "active" | "revoked"
}

export interface McpToolDefinition {
  name: string
  description: string
  accessLevel: McpAccessLevel
  category: "Catalog & Stock" | "Sales & Billing" | "Purchases" | "Parties"
}

// ----------------------------------------------------------------------------
// 5. Unified Activity & Failure Recovery Log
// ----------------------------------------------------------------------------

export type IntegrationLogSource = "chats" | "crm" | "api" | "webhook" | "mcp"

export interface IntegrationActivityLogEntry {
  id: string
  source: IntegrationLogSource
  sourceLabel: string
  action: string
  entityId?: string
  entityName?: string
  status: "success" | "failed" | "pending" | "skipped"
  timestamp: string
  summary: string
  detailMessage?: string
  metaErrorCode?: string
  canFix: boolean
  fixActionType?: "top_up" | "opt_in" | "reconnect" | "edit_rule" | "resolve_conflict" | "replay_webhook"
  fixActionLabel?: string
}

