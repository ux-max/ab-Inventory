"use client"

import React from "react"

interface IllustrationProps {
  className?: string
}

/**
 * 1. TALLY PRIME INTEGRATION ILLUSTRATION
 * Directly matches the hand-drawn style in Screenshot 2:
 * Smartphone on the right with green checkmark screen + circular sync arrows to Tally badge.
 */
export function TallyIllustration({ className = "w-full max-w-[340px] h-auto" }: IllustrationProps) {
  return (
    <svg viewBox="0 0 400 320" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Background soft glow */}
      <circle cx="200" cy="160" r="140" fill="#f8fafc" className="dark:fill-slate-900/40" />

      {/* Sync curved dashed cycle arrows */}
      <path
        d="M 120 120 C 120 70, 240 60, 270 95"
        stroke="#0f172a"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray="8 6"
        className="dark:stroke-slate-300"
      />
      <path d="M 264 85 L 275 97 L 260 106" fill="none" stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="dark:stroke-slate-300" />

      <path
        d="M 270 215 C 240 255, 130 250, 115 195"
        stroke="#0f172a"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray="8 6"
        className="dark:stroke-slate-300"
      />
      <path d="M 123 205 L 112 192 L 128 185" fill="none" stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="dark:stroke-slate-300" />

      {/* Left Circle: Tally Logo Badge */}
      <g transform="translate(70, 100)">
        <circle cx="45" cy="45" r="42" fill="#ffffff" stroke="#0f172a" strokeWidth="3.5" className="dark:fill-slate-800 dark:stroke-slate-300" />
        <circle cx="45" cy="45" r="36" fill="#fef2f2" className="dark:fill-red-950/40" />
        <text x="45" y="47" textAnchor="middle" dominantBaseline="middle" fill="#dc2626" fontSize="22" fontWeight="900" fontStyle="italic" fontFamily="sans-serif">
          Tally
        </text>
        <rect x="24" y="60" width="42" height="3" rx="1.5" fill="#dc2626" />
      </g>

      {/* Right Element: Smartphone in perspective */}
      <g transform="translate(210, 80) rotate(18)">
        {/* Phone shadow */}
        <rect x="5" y="5" width="85" height="155" rx="18" fill="#000000" opacity="0.12" />
        {/* Phone outer body */}
        <rect x="0" y="0" width="85" height="155" rx="18" fill="#ffffff" stroke="#0f172a" strokeWidth="4" className="dark:fill-slate-800 dark:stroke-slate-300" />
        {/* Phone screen */}
        <rect x="7" y="10" width="71" height="135" rx="12" fill="#22c55e" stroke="#0f172a" strokeWidth="2.5" />
        {/* Speaker notch */}
        <rect x="32" y="4" width="22" height="3.5" rx="1.75" fill="#0f172a" className="dark:fill-slate-300" />
        {/* App Title inside screen */}
        <text x="42" y="38" textAnchor="middle" fill="#0f172a" fontSize="13" fontWeight="900" fontFamily="sans-serif">
          AB
        </text>
        {/* White Checkmark Circle on screen */}
        <circle cx="42" cy="78" r="22" fill="#ffffff" stroke="#0f172a" strokeWidth="3" />
        <path d="M 33 78 L 39 84 L 51 72" fill="none" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {/* Bottom swipe pill */}
        <rect x="27" y="132" width="32" height="4" rx="2" fill="#ffffff" opacity="0.8" />
      </g>
    </svg>
  )
}

/**
 * 2. WHATSAPP / AUTOMATE CHATS ILLUSTRATION
 * Smartphone with official WhatsApp chat bubbles, verified badge, and dispatched PDF voucher.
 */
export function WhatsAppIllustration({ className = "w-full max-w-[340px] h-auto" }: IllustrationProps) {
  return (
    <svg viewBox="0 0 400 320" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="200" cy="160" r="140" fill="#f0fdf4" className="dark:fill-slate-900/40" />

      {/* Meta Official Cloud API badge */}
      <g transform="translate(60, 70)">
        <rect x="0" y="0" width="110" height="34" rx="17" fill="#ffffff" stroke="#0f172a" strokeWidth="2.5" className="dark:fill-slate-800 dark:stroke-slate-300" />
        <circle cx="18" cy="17" r="7" fill="#22c55e" />
        <path d="M 15 17 L 17 19 L 21 15" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
        <text x="62" y="21" textAnchor="middle" fill="#0f172a" fontSize="11" fontWeight="700" className="dark:fill-slate-100 font-sans">
          Meta Verified
        </text>
      </g>

      {/* Smartphone */}
      <g transform="translate(145, 45)">
        <rect x="4" y="6" width="130" height="230" rx="22" fill="#000000" opacity="0.08" />
        <rect x="0" y="0" width="130" height="230" rx="22" fill="#ffffff" stroke="#0f172a" strokeWidth="3.5" className="dark:fill-slate-800 dark:stroke-slate-300" />
        {/* Screen Header */}
        <rect x="6" y="8" width="118" height="38" rx="14" fill="#075e54" />
        <circle cx="26" cy="27" r="10" fill="#ffffff" />
        <text x="26" y="31" textAnchor="middle" fill="#075e54" fontSize="11" fontWeight="900">AB</text>
        <text x="70" y="25" fill="#ffffff" fontSize="11" fontWeight="700">Apex Global</text>
        <text x="70" y="36" fill="#86efac" fontSize="9">WhatsApp Business</text>

        {/* Message bubble 1: Received */}
        <rect x="12" y="58" width="95" height="38" rx="8" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" className="dark:fill-slate-700 dark:stroke-slate-600" />
        <text x="20" y="73" fill="#334155" fontSize="9" fontWeight="600" className="dark:fill-slate-200">Hi Rajesh,</text>
        <text x="20" y="86" fill="#64748b" fontSize="8" className="dark:fill-slate-300">Invoice #INV-1048 is ready</text>

        {/* Message bubble 2: Sent (PDF invoice card) */}
        <rect x="22" y="106" width="100" height="74" rx="8" fill="#dcf8c6" stroke="#86efac" strokeWidth="1" className="dark:fill-emerald-950/60 dark:stroke-emerald-700" />
        <rect x="30" y="114" width="22" height="26" rx="4" fill="#ef4444" />
        <text x="41" y="131" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">PDF</text>
        <text x="58" y="124" fill="#0f172a" fontSize="9" fontWeight="700" className="dark:fill-slate-100">INV-1048.pdf</text>
        <text x="58" y="135" fill="#475569" fontSize="8" className="dark:fill-slate-300">₹45,200 • Paid</text>
        <line x1="30" y1="148" x2="114" y2="148" stroke="#86efac" strokeWidth="1" />
        <text x="32" y="162" fill="#15803d" fontSize="9" fontWeight="700" className="dark:fill-emerald-400">View Receipt &gt;</text>
        {/* Double green ticks */}
        <path d="M 106 172 L 109 175 L 115 168" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 111 172 L 114 175 L 120 168" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
      </g>

      {/* Floating 24h Window Badge */}
      <g transform="translate(255, 190)">
        <rect x="0" y="0" width="105" height="38" rx="10" fill="#ffffff" stroke="#0f172a" strokeWidth="2.5" className="dark:fill-slate-800 dark:stroke-slate-300" />
        <circle cx="20" cy="19" r="10" fill="#2563eb" />
        <text x="20" y="23" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">24h</text>
        <text x="62" y="17" fill="#0f172a" fontSize="10" fontWeight="700" className="dark:fill-slate-100">Utility Rule</text>
        <text x="62" y="29" fill="#16a34a" fontSize="9" fontWeight="600">Active • 100%</text>
      </g>
    </svg>
  )
}

/**
 * 3. AUTOMATE CRM ILLUSTRATION
 * Contact record syncing 2-way with Sales Orders and Invoices.
 */
export function CrmIllustration({ className = "w-full max-w-[340px] h-auto" }: IllustrationProps) {
  return (
    <svg viewBox="0 0 400 320" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="200" cy="160" r="140" fill="#eff6ff" className="dark:fill-slate-900/40" />

      {/* Left Card: CRM Lead / Contact */}
      <g transform="translate(50, 80)">
        <rect x="3" y="3" width="125" height="150" rx="14" fill="#000000" opacity="0.08" />
        <rect x="0" y="0" width="125" height="150" rx="14" fill="#ffffff" stroke="#0f172a" strokeWidth="3" className="dark:fill-slate-800 dark:stroke-slate-300" />
        <rect x="0" y="0" width="125" height="36" rx="14" fill="#2563eb" />
        <text x="62" y="23" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="700">Automate CRM</text>
        
        <circle cx="62" cy="62" r="18" fill="#dbeafe" stroke="#2563eb" strokeWidth="2" />
        <path d="M 52 74 C 52 68, 72 68, 72 74" stroke="#2563eb" strokeWidth="2" fill="none" />
        <circle cx="62" cy="60" r="6" fill="#2563eb" />
        
        <text x="62" y="94" textAnchor="middle" fill="#0f172a" fontSize="11" fontWeight="700" className="dark:fill-white">Apex Global</text>
        <text x="62" y="108" textAnchor="middle" fill="#64748b" fontSize="9">Deal: ₹3,50,000</text>
        <rect x="25" y="118" width="75" height="18" rx="9" fill="#dcfce7" />
        <text x="62" y="131" textAnchor="middle" fill="#15803d" fontSize="9" fontWeight="700">Won Deal &gt; Order</text>
      </g>

      {/* Center 2-Way Sync Flow */}
      <g transform="translate(182, 130)">
        <circle cx="18" cy="18" r="22" fill="#ffffff" stroke="#0f172a" strokeWidth="3" className="dark:fill-slate-800 dark:stroke-slate-300" />
        <path d="M 10 14 L 26 14 L 22 9" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 26 22 L 10 22 L 14 27" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Right Card: AB Inventory Sales Order */}
      <g transform="translate(225, 80)">
        <rect x="3" y="3" width="125" height="150" rx="14" fill="#000000" opacity="0.08" />
        <rect x="0" y="0" width="125" height="150" rx="14" fill="#ffffff" stroke="#0f172a" strokeWidth="3" className="dark:fill-slate-800 dark:stroke-slate-300" />
        <rect x="0" y="0" width="125" height="36" rx="14" fill="#0f172a" className="dark:fill-slate-700" />
        <text x="62" y="23" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="700">AB Inventory</text>

        <rect x="20" y="52" width="85" height="8" rx="4" fill="#e2e8f0" className="dark:fill-slate-700" />
        <rect x="20" y="66" width="60" height="8" rx="4" fill="#e2e8f0" className="dark:fill-slate-700" />
        <rect x="20" y="80" width="75" height="8" rx="4" fill="#e2e8f0" className="dark:fill-slate-700" />

        <rect x="18" y="102" width="89" height="32" rx="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" className="dark:fill-slate-900 dark:stroke-slate-700" />
        <text x="25" y="116" fill="#64748b" fontSize="8">Sales Order</text>
        <text x="25" y="128" fill="#0f172a" fontSize="10" fontWeight="700" className="dark:fill-white">#SO-2026-089</text>
      </g>
    </svg>
  )
}

/**
 * 4. PAYMENT GATEWAY ILLUSTRATION
 * Card terminal + dynamic UPI QR code with instant reconciliation.
 */
export function PaymentGatewayIllustration({ className = "w-full max-w-[340px] h-auto" }: IllustrationProps) {
  return (
    <svg viewBox="0 0 400 320" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="200" cy="160" r="140" fill="#ecfdf5" className="dark:fill-slate-900/40" />

      {/* Credit Card in angled perspective */}
      <g transform="translate(60, 95) rotate(-10)">
        <rect x="0" y="0" width="150" height="95" rx="12" fill="#1e293b" stroke="#0f172a" strokeWidth="3" />
        <rect x="16" y="20" width="28" height="20" rx="4" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
        <circle cx="118" cy="72" r="12" fill="#ef4444" opacity="0.8" />
        <circle cx="132" cy="72" r="12" fill="#f59e0b" opacity="0.8" />
        <text x="16" y="78" fill="#ffffff" fontSize="11" fontWeight="700" fontFamily="monospace">•••• 4242</text>
      </g>

      {/* Phone with UPI QR Code */}
      <g transform="translate(190, 60)">
        <rect x="3" y="3" width="135" height="190" rx="18" fill="#000000" opacity="0.08" />
        <rect x="0" y="0" width="135" height="190" rx="18" fill="#ffffff" stroke="#0f172a" strokeWidth="3.5" className="dark:fill-slate-800 dark:stroke-slate-300" />
        <rect x="45" y="8" width="45" height="4" rx="2" fill="#cbd5e1" />
        
        {/* QR Code Container */}
        <rect x="22" y="25" width="90" height="90" rx="10" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5" className="dark:fill-slate-900 dark:stroke-slate-700" />
        
        {/* QR Pattern visual elements */}
        <rect x="32" y="35" width="22" height="22" rx="3" fill="#0f172a" className="dark:fill-white" />
        <rect x="36" y="39" width="14" height="14" rx="2" fill="#ffffff" className="dark:fill-slate-900" />
        <rect x="40" y="43" width="6" height="6" fill="#0f172a" className="dark:fill-white" />

        <rect x="78" y="35" width="22" height="22" rx="3" fill="#0f172a" className="dark:fill-white" />
        <rect x="82" y="39" width="14" height="14" rx="2" fill="#ffffff" className="dark:fill-slate-900" />
        <rect x="86" y="43" width="6" height="6" fill="#0f172a" className="dark:fill-white" />

        <rect x="32" y="81" width="22" height="22" rx="3" fill="#0f172a" className="dark:fill-white" />
        <rect x="36" y="85" width="14" height="14" rx="2" fill="#ffffff" className="dark:fill-slate-900" />
        <rect x="40" y="89" width="6" height="6" fill="#0f172a" className="dark:fill-white" />

        <text x="67" y="132" textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="700" className="dark:fill-white">Scan to Pay via UPI</text>
        <text x="67" y="146" textAnchor="middle" fill="#16a34a" fontSize="12" fontWeight="900">₹14,999.00</text>
        
        <rect x="20" y="156" width="95" height="22" rx="6" fill="#10b981" />
        <text x="67" y="171" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="700">Instant Settlement</text>
      </g>
    </svg>
  )
}

/**
 * 5. DEVELOPER REST API & WEBHOOKS ILLUSTRATION
 * Terminal screen with JSON endpoints, webhook payload, and secret token.
 */
export function RestApiIllustration({ className = "w-full max-w-[340px] h-auto" }: IllustrationProps) {
  return (
    <svg viewBox="0 0 400 320" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="200" cy="160" r="140" fill="#f5f3ff" className="dark:fill-slate-900/40" />

      {/* Terminal Window */}
      <g transform="translate(70, 60)">
        <rect x="4" y="4" width="260" height="190" rx="14" fill="#000000" opacity="0.1" />
        <rect x="0" y="0" width="260" height="190" rx="14" fill="#0f172a" stroke="#1e293b" strokeWidth="3" />
        
        {/* Terminal Header */}
        <circle cx="16" cy="16" r="4.5" fill="#ef4444" />
        <circle cx="29" cy="16" r="4.5" fill="#f59e0b" />
        <circle cx="42" cy="16" r="4.5" fill="#10b981" />
        <text x="130" y="19" textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="600" fontFamily="monospace">api.automatebusiness.com/v1</text>
        <line x1="0" y1="30" x2="260" y2="30" stroke="#1e293b" strokeWidth="1.5" />

        {/* Code Content */}
        <text x="16" y="52" fill="#38bdf8" fontSize="11" fontWeight="700" fontFamily="monospace">POST /v1/webhooks/dispatch</text>
        <text x="16" y="72" fill="#94a3b8" fontSize="10" fontFamily="monospace">&#123;</text>
        <text x="28" y="90" fill="#a78bfa" fontSize="10" fontFamily="monospace">&quot;event&quot;: <tspan fill="#34d399">&quot;invoice.created&quot;</tspan>,</text>
        <text x="28" y="108" fill="#a78bfa" fontSize="10" fontFamily="monospace">&quot;invoice_no&quot;: <tspan fill="#34d399">&quot;INV-2026-001&quot;</tspan>,</text>
        <text x="28" y="126" fill="#a78bfa" fontSize="10" fontFamily="monospace">&quot;grand_total&quot;: <tspan fill="#fbbf24">18450.00</tspan>,</text>
        <text x="28" y="144" fill="#a78bfa" fontSize="10" fontFamily="monospace">&quot;status&quot;: <tspan fill="#34d399">&quot;paid&quot;</tspan></text>
        <text x="16" y="162" fill="#94a3b8" fontSize="10" fontFamily="monospace">&#125;</text>

        <rect x="180" y="145" width="65" height="24" rx="6" fill="#10b981" />
        <text x="212" y="161" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="700" fontFamily="monospace">200 OK</text>
      </g>
    </svg>
  )
}

/**
 * 6. MCP AI SERVER ILLUSTRATION
 * AI Agent node interfacing directly with AB Inventory ERP tools.
 */
export function McpIllustration({ className = "w-full max-w-[340px] h-auto" }: IllustrationProps) {
  return (
    <svg viewBox="0 0 400 320" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="200" cy="160" r="140" fill="#faf5ff" className="dark:fill-slate-900/40" />

      {/* Center Brain / AI Node */}
      <g transform="translate(140, 50)">
        <rect x="0" y="0" width="120" height="110" rx="20" fill="#ffffff" stroke="#0f172a" strokeWidth="3.5" className="dark:fill-slate-800 dark:stroke-slate-300" />
        <rect x="12" y="12" width="96" height="42" rx="10" fill="#9333ea" />
        <circle cx="45" cy="33" r="6" fill="#ffffff" />
        <circle cx="75" cy="33" r="6" fill="#ffffff" />
        <path d="M 52 46 C 56 49, 64 49, 68 46" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
        <text x="60" y="78" textAnchor="middle" fill="#0f172a" fontSize="12" fontWeight="800" className="dark:fill-white">MCP Server</text>
        <text x="60" y="94" textAnchor="middle" fill="#9333ea" fontSize="10" fontWeight="700">Model Context</text>
      </g>

      {/* Left Node: Claude / Cursor */}
      <g transform="translate(45, 175)">
        <rect x="0" y="0" width="100" height="60" rx="12" fill="#ffffff" stroke="#0f172a" strokeWidth="2.5" className="dark:fill-slate-800 dark:stroke-slate-300" />
        <text x="50" y="26" textAnchor="middle" fill="#ea580c" fontSize="11" fontWeight="700">Claude Desktop</text>
        <text x="50" y="44" textAnchor="middle" fill="#64748b" fontSize="9">Cursor IDE</text>
        {/* Connection line */}
        <path d="M 100 20 L 140 10" stroke="#0f172a" strokeWidth="2.5" strokeDasharray="4 4" className="dark:stroke-slate-300" />
      </g>

      {/* Right Node: Exposed Tools */}
      <g transform="translate(255, 175)">
        <rect x="0" y="0" width="105" height="60" rx="12" fill="#ffffff" stroke="#0f172a" strokeWidth="2.5" className="dark:fill-slate-800 dark:stroke-slate-300" />
        <text x="52" y="26" textAnchor="middle" fill="#2563eb" fontSize="10" fontWeight="700">check_stock</text>
        <text x="52" y="44" textAnchor="middle" fill="#16a34a" fontSize="10" fontWeight="700">create_invoice</text>
        {/* Connection line */}
        <path d="M 0 20 L -35 10" stroke="#0f172a" strokeWidth="2.5" strokeDasharray="4 4" className="dark:stroke-slate-300" />
      </g>
    </svg>
  )
}

/**
 * 7. GENERIC / FALLBACK ILLUSTRATION (Digital Signature, Email, Banking, Portal, E-Invoice)
 */
export function GenericFeatureIllustration({ 
  title, 
  badge,
  iconType = "portal",
  className = "w-full max-w-[340px] h-auto" 
}: IllustrationProps & { title: string; badge: string; iconType?: string }) {
  return (
    <svg viewBox="0 0 400 320" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="200" cy="160" r="140" fill="#f8fafc" className="dark:fill-slate-900/40" />

      {/* Main Container Card */}
      <g transform="translate(80, 65)">
        <rect x="4" y="4" width="240" height="180" rx="16" fill="#000000" opacity="0.08" />
        <rect x="0" y="0" width="240" height="180" rx="16" fill="#ffffff" stroke="#0f172a" strokeWidth="3.5" className="dark:fill-slate-800 dark:stroke-slate-300" />

        {/* Card Header bar */}
        <rect x="0" y="0" width="240" height="42" rx="16" fill="#2563eb" />
        <text x="120" y="26" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="700">{title}</text>

        {/* Middle Visual Element */}
        <circle cx="120" cy="95" r="32" fill="#eff6ff" stroke="#2563eb" strokeWidth="2.5" className="dark:fill-slate-700" />
        
        {/* Center Checkmark or Seal */}
        <path d="M 108 95 L 116 103 L 132 87" fill="none" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

        {/* Pill Badge */}
        <rect x="70" y="142" width="100" height="22" rx="11" fill="#dcfce7" />
        <text x="120" y="157" textAnchor="middle" fill="#15803d" fontSize="10" fontWeight="700">{badge}</text>
      </g>
    </svg>
  )
}

