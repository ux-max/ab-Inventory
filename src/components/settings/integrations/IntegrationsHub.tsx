"use client"

import React, { useState } from "react"
import {
  ChevronLeft,
  PlugZap,
  MessageSquare,
  Users,
  Code2,
  Bot,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Plus,
  Copy,
  Check,
  RefreshCw,
  Play,
  Pause,
  Trash2,
  Eye,
  EyeOff,
  ArrowUpRight,
  FileText,
  Send,
  ShieldCheck,
  X,
  AlertTriangle,
  CreditCard,
  QrCode,
  Building2,
  Landmark,
  FileCheck,
  Mail,
  Globe,
  Share2,
  FileSpreadsheet,
  Sparkles,
  ExternalLink,
  Plug,
  Unlink,
  Settings,
  Key,
  Hash,
  ShieldAlert
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Drawer } from "@/components/ui/drawer"
import {
  INITIAL_CHATS_CONNECTION,
  INITIAL_CRM_CONNECTION,
  INITIAL_CRM_CONFLICTS,
  INITIAL_API_KEYS,
  INITIAL_WEBHOOK_ENDPOINTS,
  INITIAL_WEBHOOK_LOGS,
  INITIAL_MCP_TOOLS,
  INITIAL_INTEGRATION_LOGS,
  INITIAL_WHATSAPP_TEMPLATES
} from "@/data/mockIntegrations"
import {
  ChatsConnection,
  CrmConnection,
  ApiKeyItem,
  WebhookEndpoint,
  McpConnectedTool,
  IntegrationActivityLogEntry,
  WhatsAppEventRule,
  WhatsAppTemplate,
  CrmConflictItem,
  WebhookDeliveryLog
} from "@/types/integrations"

// Definition of each integration card in the gallery
interface IntegrationCardDef {
  id: string
  name: string
  category: "communication" | "developer"
  description: string
  badge?: "New" | "Live" | "Govt" | "Dev" | "AI"
  icon: React.ElementType
  iconColor: string
  iconBg: string
  status: "Connected" | "Configured" | "Ready to Connect"
  heroTitle: string
  benefits: [string, string, string]
  primaryCta: string
}

const INTEGRATION_CATALOG: IntegrationCardDef[] = [
  // 1. Communication
  {
    id: "chats",
    name: "Automate Chats (WhatsApp)",
    category: "communication",
    description: "Share invoices, automated reminders, and run transactional dispatches with your verified WhatsApp Business Number.",
    badge: "New",
    icon: MessageSquare,
    iconColor: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800",
    status: "Connected",
    heroTitle: "Automate Customer Updates with WhatsApp Business",
    benefits: [
      "Official Meta Cloud API with green checkmark verification and 24h customer window",
      "9 auto-dispatched transactional utility rules for invoices, reminders, and delivery",
      "Rich media templates with automated PDF attachment and 1-click pay buttons"
    ],
    primaryCta: "Configure WhatsApp Rules"
  },
  {
    id: "crm",
    name: "Automate CRM",
    category: "communication",
    description: "2-way contact sync, pipeline deal-to-sales order conversion, and duplicate conflict resolution.",
    badge: "Live",
    icon: Users,
    iconColor: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800",
    status: "Connected",
    heroTitle: "Synchronize Pipeline & Orders with Automate CRM",
    benefits: [
      "Real-time 2-way sync for customer contact details, GSTIN, and credit terms",
      "Auto-convert won CRM deals into ready-to-dispatch AB sales orders",
      "Smart conflict detection with side-by-side data comparison and 1-click merge"
    ],
    primaryCta: "Manage CRM Sync"
  },
  {
    id: "custom_email",
    name: "Custom Email Integration",
    category: "communication",
    description: "Configure custom email (SMTP / Google Workspace) for sending invoices, statements, and alerts from your domain.",
    icon: Mail,
    iconColor: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800",
    status: "Configured",
    heroTitle: "Send Professional Invoices from Your Own Domain",
    benefits: [
      "Send invoices from accounts@yourcompany.com with DKIM & SPF delivery assurance",
      "Automated PDF delivery and read receipts tracking for critical billing notices",
      "Works with Google Workspace, Microsoft 365, Zoho Mail, and custom SMTP"
    ],
    primaryCta: "Configure SMTP Server"
  },

  // 2. Developer & AI Tools
  {
    id: "api_webhooks",
    name: "Public REST API & Webhooks",
    category: "developer",
    description: "Generate scoped API keys and subscribe to real-time webhook events for your custom business software.",
    badge: "Dev",
    icon: Code2,
    iconColor: "text-cyan-600 dark:text-cyan-400",
    iconBg: "bg-cyan-50 dark:bg-cyan-950/60 border-cyan-200 dark:border-cyan-800",
    status: "Connected",
    heroTitle: "Build Custom Workflows with REST API & Webhooks",
    benefits: [
      "Fine-grained scoped API keys for items, stock, invoices, and ledger queries",
      "Real-time webhook notifications for invoice.created, payment.received, and stock.low",
      "Complete delivery audit log with payload inspection and 1-click test pings"
    ],
    primaryCta: "Generate New API Key"
  },
  {
    id: "mcp_server",
    name: "MCP AI Server",
    category: "developer",
    description: "Connect Claude Desktop, Cursor, or AI agents directly to your inventory tools via Model Context Protocol.",
    badge: "AI",
    icon: Bot,
    iconColor: "text-violet-600 dark:text-violet-400",
    iconBg: "bg-violet-50 dark:bg-violet-950/60 border-violet-200 dark:border-violet-800",
    status: "Connected",
    heroTitle: "Supercharge Operations with Model Context Protocol (MCP)",
    benefits: [
      "Secure remote HTTPS endpoint for Claude Desktop, Cursor IDE, and custom LLMs",
      "Read-only and read-write tools to check stock, query pricing, and draft invoices",
      "Instant workspace killswitch and audit logging of all AI agent interactions"
    ],
    primaryCta: "Copy MCP Server URL"
  }
]

export function IntegrationsHub() {
  const [selectedIntegrationId, setSelectedIntegrationId] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Live editable state for core integrations
  const [chats, setChats] = useState<ChatsConnection>(INITIAL_CHATS_CONNECTION)
  const [crm, setCrm] = useState<CrmConnection>(INITIAL_CRM_CONNECTION)
  const [conflicts, setConflicts] = useState<CrmConflictItem[]>(INITIAL_CRM_CONFLICTS)
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>(INITIAL_API_KEYS)
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>(INITIAL_WEBHOOK_ENDPOINTS)
  const [webhookLogs, setWebhookLogs] = useState<WebhookDeliveryLog[]>(INITIAL_WEBHOOK_LOGS)
  const [mcpTools, setMcpTools] = useState<McpConnectedTool[]>(INITIAL_MCP_TOOLS)
  const [activityLogs, setActivityLogs] = useState<IntegrationActivityLogEntry[]>(INITIAL_INTEGRATION_LOGS)
  const [mcpEnabled, setMcpEnabled] = useState(true)

  // Drawer / Modal states
  const [editingRule, setEditingRule] = useState<WhatsAppEventRule | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null)
  const [showNewKeyModal, setShowNewKeyModal] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [newKeyEnv, setNewKeyEnv] = useState<"live" | "test">("test")
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>(["items:read", "stock:read"])
  const [generatedRawKey, setGeneratedRawKey] = useState<string | null>(null)

  const [showAddWebhookDrawer, setShowAddWebhookDrawer] = useState(false)
  const [newWebhookUrl, setNewWebhookUrl] = useState("")
  const [newWebhookEvents, setNewWebhookEvents] = useState<string[]>(["invoice.created", "stock.low"])

  const [activeConflict, setActiveConflict] = useState<CrmConflictItem | null>(null)

  // Automate Chats Connection Modal State
  const [showChatsConnectModal, setShowChatsConnectModal] = useState(false)
  const [showChatsDisconnectModal, setShowChatsDisconnectModal] = useState(false)
  const [chatsChannelId, setChatsChannelId] = useState(INITIAL_CHATS_CONNECTION.channelId || "chn_waba_88492104")
  const [chatsApiKey, setChatsApiKey] = useState(INITIAL_CHATS_CONNECTION.apiKey || "ac_live_sk_8849f27b9104")
  const [showChatsApiKey, setShowChatsApiKey] = useState(false)
  const [chatsConnecting, setChatsConnecting] = useState(false)
  const [chatsFormError, setChatsFormError] = useState<string | null>(null)

  const handleConnectChats = () => {
    if (!chatsChannelId.trim() || !chatsApiKey.trim()) {
      setChatsFormError("Channel ID and API Key are required.")
      return
    }
    setChatsFormError(null)
    setChatsConnecting(true)
    setTimeout(() => {
      setChats(prev => ({
        ...prev,
        status: "connected",
        channelId: chatsChannelId.trim(),
        apiKey: chatsApiKey.trim(),
        lastActivityAt: "Just now"
      }))
      setChatsConnecting(false)
      setShowChatsConnectModal(false)
    }, 500)
  }

  const handleDisconnectChats = () => {
    setChats(prev => ({
      ...prev,
      status: "not_connected"
    }))
    setShowChatsDisconnectModal(false)
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(id)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  // Toggle WhatsApp Rule Status
  const handleToggleRule = (ruleId: string) => {
    setChats(prev => ({
      ...prev,
      rules: prev.rules.map(r => {
        if (r.id === ruleId) {
          const nextStatus = r.status === "active" ? "off" : "active"
          return { ...r, status: nextStatus }
        }
        return r
      })
    }))
  }

  // Save WhatsApp Rule Edit
  const handleSaveRule = () => {
    if (!editingRule) return
    setChats(prev => ({
      ...prev,
      rules: prev.rules.map(r => r.id === editingRule.id ? editingRule : r)
    }))
    setEditingRule(null)
  }

  // Generate API Key
  const handleCreateApiKey = () => {
    if (!newKeyName.trim()) return
    const randomHex = Math.random().toString(16).substring(2, 10)
    const rawSecret = `ab_${newKeyEnv}_${randomHex}${Math.random().toString(16).substring(2, 10)}`
    const newKey: ApiKeyItem = {
      id: `key-${Date.now()}`,
      name: newKeyName.trim(),
      keyMasked: `ab_${newKeyEnv}_••••••••${randomHex.substring(0, 4)}`,
      environment: newKeyEnv,
      scopes: newKeyScopes as any,
      createdAt: new Date().toISOString().split("T")[0],
      lastUsedAt: "Just now",
      status: "active"
    }
    setApiKeys(prev => [newKey, ...prev])
    setGeneratedRawKey(rawSecret)
  }

  // Add Webhook
  const handleCreateWebhook = () => {
    if (!newWebhookUrl.trim()) return
    const newEndpoint: WebhookEndpoint = {
      id: `wh-${Date.now()}`,
      url: newWebhookUrl.trim(),
      signingSecret: `whsec_${Math.random().toString(16).substring(2, 18)}`,
      subscribedEvents: newWebhookEvents,
      status: "active",
      createdAt: new Date().toISOString().split("T")[0],
      failureCount: 0
    }
    setWebhooks(prev => [newEndpoint, ...prev])
    setShowAddWebhookDrawer(false)
    setNewWebhookUrl("")
  }

  // Test Webhook Ping
  const handlePingWebhook = (endpointId: string) => {
    const ep = webhooks.find(w => w.id === endpointId)
    if (!ep) return
    const pingLog: WebhookDeliveryLog = {
      id: `log-${Date.now()}`,
      endpointId,
      endpointUrl: ep.url,
      eventId: `evt_ping_${Date.now()}`,
      eventType: "ping.test",
      statusCode: 200,
      timestamp: "Just now",
      attempts: 1,
      durationMs: 42,
      success: true,
      payload: { ping: true, timestamp: new Date().toISOString() },
      responseBodySnippet: '{"received": true}'
    }
    setWebhookLogs(prev => [pingLog, ...prev])
    alert(`Test ping dispatched to ${ep.url} — Status 200 OK`)
  }

  // Resolve CRM Conflict
  const handleResolveConflict = (conflictId: string, resolution: "keep_crm" | "keep_ab" | "merge") => {
    setCrm(prev => ({
      ...prev,
      conflictsCount: Math.max(0, prev.conflictsCount - 1)
    }))
    setConflicts(prev => prev.filter(c => c.id !== conflictId))
    setActiveConflict(null)
  }

  // Selected Integration Object
  const currentIntegration = INTEGRATION_CATALOG.find(i => i.id === selectedIntegrationId)

  const getIntegrationIllustration = (id: string) => {
    switch (id) {
      case "chats":
        return "/integrations/whatsapp-business-2d.jpg"
      case "crm":
        return "/integrations/crm-sync-2d.jpg"
      case "custom_email":
        return "/integrations/email-integration-2d.jpg"
      case "api_webhooks":
        return "/integrations/api-webhooks-2d.jpg"
      case "mcp_server":
        return "/integrations/mcp-ai-server-2d.jpg"
      default:
        return "/integrations/whatsapp-business-2d.jpg"
    }
  }

  // Filter cards by search
  const filteredCatalog = INTEGRATION_CATALOG.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const communicationCards = filteredCatalog.filter(c => c.category === "communication")
  const developerCards = filteredCatalog.filter(c => c.category === "developer")

  // ===========================================================================
  // VIEW 1: MASTER INTEGRATIONS GALLERY (Matches Screenshot 1)
  // ===========================================================================
  if (!currentIntegration) {
    return (
      <div className="flex-1 h-full overflow-y-auto bg-white dark:bg-slate-950 font-sans p-6 sm:p-8">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Integrations & Apps
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Connect your messaging, CRM, and developer tools with AB Inventory.
              </p>
            </div>

            {/* Quick search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search integrations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-hidden focus:border-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Section 1: Communication */}
          {communicationCards.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wide uppercase">
                Communication
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {communicationCards.map(item => {
                  const Icon = item.icon
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedIntegrationId(item.id)}
                      className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 hover:border-blue-500 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className={`p-2 rounded-lg border ${item.iconBg}`}>
                            <Icon className={`h-5 w-5 ${item.iconColor}`} />
                          </div>
                          {item.badge && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {item.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-3 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                        <span className={`font-semibold ${(item.id === "chats" ? chats.status === "connected" : item.status === "Connected")
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-slate-500 dark:text-slate-400"
                          }`}>
                          {item.id === "chats"
                            ? (chats.status === "connected" ? "Connected" : "Ready to Connect")
                            : item.status}
                        </span>
                        <span className="text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform font-semibold">
                          Configure &gt;
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Section 2: Developer & AI Tools */}
          {developerCards.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wide uppercase">
                Developer & AI Tools
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {developerCards.map(item => {
                  const Icon = item.icon
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedIntegrationId(item.id)}
                      className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 hover:border-blue-500 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className={`p-2 rounded-lg border ${item.iconBg}`}>
                            <Icon className={`h-5 w-5 ${item.iconColor}`} />
                          </div>
                          {item.badge && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {item.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-3 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-medium text-slate-600 dark:text-slate-300">{item.status}</span>
                        <span className="text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform font-semibold">
                          Manage &gt;
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    )
  }

  // ===========================================================================
  // VIEW 2: INTEGRATION DETAIL VIEW (Matches Screenshot 2)
  // ===========================================================================
  return (
    <div className="flex-1 h-full overflow-y-auto bg-white dark:bg-slate-950 font-sans p-6 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Top Breadcrumb Back Navigation */}
        <div>
          <button
            onClick={() => setSelectedIntegrationId(null)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>All Integrations</span>
          </button>
        </div>

        {/* HERO SPLIT SECTION: Left Illustration + Right Title, Bullets & Button (Screenshot 2) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-slate-50/60 dark:bg-slate-900/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-10">

          {/* Left Column: 2D Flat Vector Line-Art Illustration */}
          <div className="lg:col-span-6 flex justify-center items-center">
            <div className="w-full max-w-[420px] rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-white p-2 shadow-xs transition-all hover:shadow-sm">
              <img
                src={getIntegrationIllustration(currentIntegration.id)}
                alt={currentIntegration.name}
                className="w-full h-auto aspect-4/3 object-contain block"
              />
            </div>
          </div>

          {/* Right Column: Title, 3 Checklist Points & App Button */}
          <div className="lg:col-span-6 space-y-5">
            <div>
              <div className="inline-flex items-center gap-2 mb-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${currentIntegration.id === "chats"
                    ? chats.status === "connected"
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                    : "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                  }`}>
                  {currentIntegration.id === "chats" && (
                    <span className={`h-1.5 w-1.5 rounded-full ${chats.status === "connected" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                  )}
                  {currentIntegration.id === "chats"
                    ? (chats.status === "connected" ? "Connected" : "Ready to Connect")
                    : currentIntegration.status}
                </span>
                {currentIntegration.badge && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {currentIntegration.badge}
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {currentIntegration.heroTitle}
              </h1>
            </div>

            {/* 3 Value-prop checklist bullets with solid checkmarks */}
            <ul className="space-y-3">
              {currentIntegration.benefits.map((benefit, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <div className="h-4.5 w-4.5 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </div>
                  <span className="leading-snug">{benefit}</span>
                </li>
              ))}
            </ul>

            {/* Primary Action Button & Disconnect Button (Automate Business app theme) */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              {currentIntegration.id === "chats" ? (
                chats.status === "connected" ? (
                  <>
                    <button
                      onClick={() => setShowChatsConnectModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-all cursor-pointer"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Manage Connection</span>
                    </button>
                    <button
                      onClick={() => setShowChatsDisconnectModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-semibold rounded-lg shadow-2xs transition-all cursor-pointer"
                    >
                      <Unlink className="h-4 w-4" />
                      <span>Disconnect</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setShowChatsConnectModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-all cursor-pointer"
                  >
                    <Plug className="h-4 w-4 stroke-[2.5]" />
                    <span>Connect Automate Chats</span>
                  </button>
                )
              ) : currentIntegration.id === "api_webhooks" ? (
                <button
                  onClick={() => setShowNewKeyModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-all cursor-pointer"
                >
                  <Plus className="h-4 w-4 stroke-[2.5]" />
                  <span>Generate New API Key</span>
                </button>
              ) : currentIntegration.id === "mcp_server" ? (
                <button
                  onClick={() => copyToClipboard("https://api.automatebusiness.com/v1/mcp", "mcp-url")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-all cursor-pointer"
                >
                  {copiedKey === "mcp-url" ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
                  <span>{copiedKey === "mcp-url" ? "Endpoint Copied!" : "Copy MCP Server URL"}</span>
                </button>
              ) : (
                <button
                  onClick={() => alert(`${currentIntegration.name} configuration initialized.`)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-all cursor-pointer"
                >
                  <Plus className="h-4 w-4 stroke-[2.5]" />
                  <span>{currentIntegration.primaryCta}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* INTERACTIVE CONFIGURATION SECTION (Dedicated per Integration)           */}
        {/* ======================================================================= */}

        {/* 1. AUTOMATE CHATS (WHATSAPP BUSINESS) CONFIGURATION PANEL */}
        {currentIntegration.id === "chats" && (
          <div className="space-y-6">
            {/* Inactive Trigger Warning if Disconnected */}
            {chats.status !== "connected" && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-300">
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600" />
                  <span>
                    Automate Chats channel is currently <strong>disconnected</strong>. WhatsApp transactional rules below are paused.
                  </span>
                </div>
                <button
                  onClick={() => setShowChatsConnectModal(true)}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-md text-[11px] shrink-0 cursor-pointer"
                >
                  Connect Channel
                </button>
              </div>
            )}

            {/* 9 Transactional Utility Rules Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Transactional Utility Event Triggers</h3>
                  <p className="text-xs text-slate-500">Auto-dispatch verified WhatsApp templates when events occur in AB Inventory.</p>
                </div>
                <span className="text-xs text-slate-500">
                  Active Triggers: <span className="font-semibold text-blue-600">{chats.rules.filter(r => r.status === "active").length} of {chats.rules.length}</span>
                </span>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50/80 dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4 text-left font-bold text-slate-700 dark:text-slate-300">Event Trigger</th>
                      <th className="py-2.5 px-4 text-left font-bold text-slate-700 dark:text-slate-300">Meta Template</th>
                      <th className="py-2.5 px-4 text-center font-bold text-slate-700 dark:text-slate-300">PDF Voucher</th>
                      <th className="py-2.5 px-4 text-center font-bold text-slate-700 dark:text-slate-300">Status</th>
                      <th className="py-2.5 px-4 text-right font-bold text-slate-700 dark:text-slate-300">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {chats.rules.map(rule => (
                      <tr key={rule.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-4">
                          <span className="font-semibold text-slate-900 dark:text-white block">{rule.eventName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{rule.eventId}</span>
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="font-mono text-slate-700 dark:text-slate-300">{rule.templateName}</span>
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          {rule.attachPdf ? (
                            <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                              Yes
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">No</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <button
                            onClick={() => handleToggleRule(rule.id)}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-all cursor-pointer ${rule.status === "active"
                              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 shadow-2xs"
                              : "bg-slate-100 dark:bg-slate-800/60 text-slate-400 border-transparent"
                              }`}
                          >
                            {rule.status === "active" ? "Active" : "Paused"}
                          </button>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <button
                            onClick={() => setEditingRule(rule)}
                            className="px-2 py-1 rounded text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition-colors cursor-pointer"
                          >
                            Configure
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. AUTOMATE CRM CONFIGURATION PANEL */}
        {currentIntegration.id === "crm" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    2-Way Contact Sync
                  </h3>
                  <button
                    onClick={() => setCrm(prev => ({ ...prev, syncCustomers: !prev.syncCustomers }))}
                    className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer border ${crm.syncCustomers ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-400 border-transparent"
                      }`}
                  >
                    {crm.syncCustomers ? "Active" : "Disabled"}
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  Automatically syncs party names, phone numbers, emails, GSTINs, and billing addresses between Automate CRM and AB Inventory.
                </p>
                <div className="text-[11px] text-slate-400">
                  Last successful sync: <span className="font-semibold text-slate-700 dark:text-slate-300">{crm.lastSyncedAt}</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Won Deals &gt; Sales Order Auto-Conversion
                  </h3>
                  <button
                    onClick={() => setCrm(prev => ({ ...prev, dealToOrder: { ...prev.dealToOrder, enabled: !prev.dealToOrder.enabled } }))}
                    className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer border ${crm.dealToOrder.enabled ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-400 border-transparent"
                      }`}
                  >
                    {crm.dealToOrder.enabled ? "Active" : "Disabled"}
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  When a deal reaches the "Closed Won" stage in Automate CRM, an order is drafted in AB Inventory ready for stock reservation.
                </p>
              </div>
            </div>

            {/* CRM Conflicts Section */}
            {conflicts.length > 0 && (
              <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                      Sync Conflicts ({conflicts.length})
                    </h4>
                  </div>
                  <span className="text-[11px] text-amber-700">Requires manual resolution</span>
                </div>

                <div className="divide-y divide-amber-200/60 dark:divide-amber-900/40">
                  {conflicts.map(conflict => (
                    <div key={conflict.id} className="py-2.5 flex items-center justify-between gap-4">
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">{conflict.partyName}</span>
                        <span className="text-[11px] text-slate-500">
                          Field: <code className="font-mono text-amber-800">{conflict.conflictingFields.join(", ")}</code> • CRM: "{conflict.crmData.phone}" vs AB: "{conflict.abData.phone}"
                        </span>
                      </div>
                      <button
                        onClick={() => setActiveConflict(conflict)}
                        className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
                      >
                        Resolve Conflict
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. PUBLIC REST API & WEBHOOKS PANEL */}
        {currentIntegration.id === "api_webhooks" && (
          <div className="space-y-6">
            {/* API Keys Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active API Keys</h3>
                  <p className="text-xs text-slate-500">Manage scoped Bearer tokens to access the AB Inventory REST API.</p>
                </div>
                <button
                  onClick={() => setShowNewKeyModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Generate Key</span>
                </button>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50/80 dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4 text-left font-bold text-slate-700 dark:text-slate-300">Key Name</th>
                      <th className="py-2.5 px-4 text-left font-bold text-slate-700 dark:text-slate-300">Token Prefix</th>
                      <th className="py-2.5 px-4 text-left font-bold text-slate-700 dark:text-slate-300">Environment</th>
                      <th className="py-2.5 px-4 text-left font-bold text-slate-700 dark:text-slate-300">Last Used</th>
                      <th className="py-2.5 px-4 text-right font-bold text-slate-700 dark:text-slate-300">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {apiKeys.map(key => (
                      <tr key={key.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">{key.name}</td>
                        <td className="py-2.5 px-4 font-mono text-slate-600 dark:text-slate-300">{key.keyMasked}</td>
                        <td className="py-2.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${key.environment === "live" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}>
                            {key.environment.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-400">{key.lastUsedAt}</td>
                        <td className="py-2.5 px-4 text-right">
                          <button
                            onClick={() => setApiKeys(prev => prev.filter(k => k.id !== key.id))}
                            className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                            title="Revoke key"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Webhook Endpoints */}
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Webhook Endpoints</h3>
                  <p className="text-xs text-slate-500">Subscribe external URLs to real-time events like invoice creation and low stock alerts.</p>
                </div>
                <button
                  onClick={() => setShowAddWebhookDrawer(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Endpoint</span>
                </button>
              </div>

              <div className="space-y-3">
                {webhooks.map(wh => (
                  <div key={wh.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">{wh.url}</span>
                        <span className="px-2 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {wh.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {wh.subscribedEvents.map(evt => (
                          <span key={evt} className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded">
                            {evt}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePingWebhook(wh.id)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer transition-colors"
                      >
                        Test Ping
                      </button>
                      <button
                        onClick={() => setWebhooks(prev => prev.filter(w => w.id !== wh.id))}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Delete webhook"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 5. MCP AI SERVER CONFIGURATION PANEL */}
        {currentIntegration.id === "mcp_server" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Model Context Protocol Server Endpoint
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Provide this remote HTTPS endpoint to Claude Desktop or Cursor to expose your AB Inventory tools.
                  </p>
                </div>
                <button
                  onClick={() => setMcpEnabled(!mcpEnabled)}
                  className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer border ${mcpEnabled ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"
                    }`}
                >
                  {mcpEnabled ? "Server Active" : "Server Paused"}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value="https://api.automatebusiness.com/v1/mcp"
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
                <button
                  onClick={() => copyToClipboard("https://api.automatebusiness.com/v1/mcp", "mcp-url-detail")}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold rounded-lg shadow-2xs transition-colors shrink-0 cursor-pointer"
                >
                  {copiedKey === "mcp-url-detail" ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            {/* Connected AI Clients and Tools */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Connected AI Clients</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {mcpTools.map(tool => (
                  <div key={tool.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{tool.toolName}</span>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">{tool.accessLevel}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">User: {tool.userName} • Last active {tool.lastActiveAt}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 6. GENERIC FALLBACK CONFIGURATION FOR OTHERS */}
        {currentIntegration.id !== "tally" &&
          currentIntegration.id !== "chats" &&
          currentIntegration.id !== "crm" &&
          currentIntegration.id !== "api_webhooks" &&
          currentIntegration.id !== "mcp_server" && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {currentIntegration.name} Configuration & Credentials
              </h3>
              <p className="text-xs text-slate-500">
                Manage your connection status, API credentials, and sync preferences for {currentIntegration.name}.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Account / Merchant ID</label>
                  <input
                    type="text"
                    placeholder="e.g. ACC_2026_APEXGLOBAL"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Secret Key / Token</label>
                  <input
                    type="password"
                    defaultValue="••••••••••••••••••••••••"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => alert("Credentials saved successfully.")}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  Save Settings
                </button>
              </div>
            </div>
          )}

      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: GENERATE NEW API KEY MODAL                                       */}
      {/* ========================================================================= */}
      {showNewKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Generate Scoped API Key</h3>
              <button
                onClick={() => { setShowNewKeyModal(false); setGeneratedRawKey(null); }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {!generatedRawKey ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Key Description Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Custom Android App / Zapier"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Environment</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setNewKeyEnv("live")}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${newKeyEnv === "live" ? "bg-blue-600 text-white border-blue-600 shadow-2xs" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        }`}
                    >
                      Production (Live)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewKeyEnv("test")}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${newKeyEnv === "test" ? "bg-blue-600 text-white border-blue-600 shadow-2xs" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        }`}
                    >
                      Sandbox (Test)
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowNewKeyModal(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateApiKey}
                    disabled={!newKeyName.trim()}
                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold shadow-2xs cursor-pointer"
                  >
                    Create Key
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-300 text-xs">
                  Make sure to copy your API key now. You won't be able to see it again!
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generatedRawKey}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                  <button
                    onClick={() => copyToClipboard(generatedRawKey, "raw-key")}
                    className="px-3 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg shrink-0 cursor-pointer"
                  >
                    {copiedKey === "raw-key" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => { setShowNewKeyModal(false); setGeneratedRawKey(null); }}
                    className="px-4 py-1.5 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER: ADD WEBHOOK ENDPOINT (USING SHARED DRAWER COMPONENT)              */}
      {/* ========================================================================= */}
      <Drawer
        open={showAddWebhookDrawer}
        onOpenChange={setShowAddWebhookDrawer}
        title="Add Webhook Endpoint"
        description="Configure HTTPS endpoint to receive real-time webhook event notifications"
        className="w-[480px] max-w-[94vw]"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddWebhookDrawer(false)}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateWebhook}
              disabled={!newWebhookUrl.trim()}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              Add Endpoint
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Payload URL (HTTPS)
            </label>
            <input
              type="url"
              placeholder="https://yourapp.com/api/webhooks"
              value={newWebhookUrl}
              onChange={(e) => setNewWebhookUrl(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Select Events
            </label>
            <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
              {["invoice.created", "invoice.paid", "stock.low", "order.placed"].map(evt => (
                <label
                  key={evt}
                  className="flex items-center gap-2.5 cursor-pointer p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={newWebhookEvents.includes(evt)}
                    onChange={(e) => {
                      if (e.target.checked) setNewWebhookEvents(prev => [...prev, evt])
                      else setNewWebhookEvents(prev => prev.filter(x => x !== evt))
                    }}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {evt}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Drawer>

      {/* ========================================================================= */}
      {/* MODAL 3: CONFLICT RESOLVER MODAL                                         */}
      {/* ========================================================================= */}
      {activeConflict && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg w-full overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Resolve Data Conflict</h3>
              <button onClick={() => setActiveConflict(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Discrepancy detected for <strong className="text-slate-900 dark:text-white">{activeConflict.partyName}</strong> on field(s) <code className="font-mono text-blue-600">{activeConflict.conflictingFields.join(", ")}</code>. Choose which version to retain:
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30 space-y-1">
                <span className="text-[10px] font-bold uppercase text-blue-600">Automate CRM Value</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">{activeConflict.crmData.phone}</span>
                <span className="text-[11px] text-slate-500 block">{activeConflict.crmData.email}</span>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-500">AB Inventory Value</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">{activeConflict.abData.phone}</span>
                <span className="text-[11px] text-slate-500 block">{activeConflict.abData.email}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => handleResolveConflict(activeConflict.id, "keep_crm")}
                className="px-3 py-1.5 rounded-lg border border-blue-200 text-blue-700 dark:text-blue-300 text-xs font-semibold hover:bg-blue-50 cursor-pointer"
              >
                Keep CRM
              </button>
              <button
                onClick={() => handleResolveConflict(activeConflict.id, "keep_ab")}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Keep AB Inventory
              </button>
              <button
                onClick={() => handleResolveConflict(activeConflict.id, "merge")}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs cursor-pointer"
              >
                Merge Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONNECT AUTOMATE CHATS                                             */}
      {/* ========================================================================= */}
      {showChatsConnectModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full overflow-hidden p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Connect Automate Chats
              </h3>
              <button
                onClick={() => {
                  setShowChatsConnectModal(false)
                  setChatsFormError(null)
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Enter your Channel ID and API Key to connect Automate Chats with AB Inventory.
            </p>

            {chatsFormError && (
              <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{chatsFormError}</span>
              </div>
            )}

            {/* Form Fields: Only Channel ID & API Key */}
            <div className="space-y-3.5">
              {/* Channel ID */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Channel ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. chn_waba_88492104"
                  value={chatsChannelId}
                  onChange={(e) => setChatsChannelId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-hidden focus:border-blue-500"
                />
              </div>

              {/* API Key */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  API Key <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showChatsApiKey ? "text" : "password"}
                    placeholder="ac_live_sk_..."
                    value={chatsApiKey}
                    onChange={(e) => setChatsApiKey(e.target.value)}
                    className="w-full pl-3 pr-9 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-hidden focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowChatsApiKey(!showChatsApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showChatsApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowChatsConnectModal(false)
                  setChatsFormError(null)
                }}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={chatsConnecting}
                onClick={handleConnectChats}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-2xs transition-all cursor-pointer"
              >
                {chatsConnecting ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <span>{chats.status === "connected" ? "Update Credentials" : "Connect"}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DISCONNECT AUTOMATE CHATS CONFIRMATION                             */}
      {/* ========================================================================= */}
      {showChatsDisconnectModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Disconnect Automate Chats
              </h3>
              <button
                onClick={() => setShowChatsDisconnectModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Disconnecting will pause all WhatsApp automated triggers. Invoices and receipts will not be sent until you reconnect.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowChatsDisconnectModal(false)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDisconnectChats}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-all cursor-pointer"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER: EDIT WHATSAPP RULE (USING SHARED DRAWER COMPONENT)                */}
      {/* ========================================================================= */}
      <Drawer
        open={Boolean(editingRule)}
        onOpenChange={(open) => {
          if (!open) setEditingRule(null)
        }}
        title="Configure Event Trigger"
        description="Automate WhatsApp Meta template dispatch and invoice PDF attachments"
        className="w-[480px] max-w-[94vw]"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditingRule(null)}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveRule}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              Save Trigger
            </button>
          </div>
        }
      >
        {editingRule && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Trigger Event
              </label>
              <input
                type="text"
                readOnly
                value={editingRule.eventName}
                className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Meta Template Name
              </label>
              <input
                type="text"
                readOnly
                value={editingRule.templateName}
                className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 font-mono border border-slate-200 dark:border-slate-700 focus:outline-hidden"
              />
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                <input
                  type="checkbox"
                  checked={editingRule.attachPdf}
                  onChange={(e) => setEditingRule({ ...editingRule, attachPdf: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-0.5 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                    Automatically attach generated invoice PDF voucher
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    When dispatched via WhatsApp, the finalized PDF invoice will be automatically delivered to the customer.
                  </span>
                </div>
              </label>
            </div>
          </div>
        )}
      </Drawer>

    </div>
  )
}
