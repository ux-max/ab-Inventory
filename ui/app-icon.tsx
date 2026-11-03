"use client"

import React, { useState } from "react"

interface AppIconProps {
  appId?: string
  appName?: string
  className?: string
  size?: number
}

const APP_BRAND_MAP: Record<string, { slug: string; color: string; label: string }> = {
  gmail: { slug: "gmail", color: "EA4335", label: "Gmail" },
  mail: { slug: "gmail", color: "EA4335", label: "Gmail" },
  shopify: { slug: "shopify", color: "7AB55C", label: "Shopify" },
  razorpay: { slug: "razorpay", color: "0C2340", label: "Razorpay" },
  razor: { slug: "razorpay", color: "0C2340", label: "Razorpay" },
  calendar: { slug: "googlecalendar", color: "4285F4", label: "Google Calendar" },
  googlecalendar: { slug: "googlecalendar", color: "4285F4", label: "Google Calendar" },
  calendly: { slug: "calendly", color: "006BFF", label: "Calendly" },
  sheet: { slug: "googlesheets", color: "0F9D58", label: "Google Sheets" },
  googlesheets: { slug: "googlesheets", color: "0F9D58", label: "Google Sheets" },
  gform: { slug: "googleforms", color: "7248B9", label: "Google Forms" },
  googleform: { slug: "googleforms", color: "7248B9", label: "Google Forms" },
  pipedrive: { slug: "pipedrive", color: "040926", label: "Pipedrive" },
  telegram: { slug: "telegram", color: "26A5E4", label: "Telegram" },
  typeform: { slug: "typeform", color: "262627", label: "Typeform" },
  hubspot: { slug: "hubspot", color: "FF7A59", label: "HubSpot" },
  freshdesk: { slug: "freshdesk", color: "00B8D9", label: "Freshdesk" },
  chat: { slug: "whatsapp", color: "25D366", label: "WhatsApp" },
  whatsapp: { slug: "whatsapp", color: "25D366", label: "WhatsApp" },
  notion: { slug: "notion", color: "000000", label: "Notion" },
  airtable: { slug: "airtable", color: "18BFFF", label: "Airtable" },
  stripe: { slug: "stripe", color: "635BFF", label: "Stripe" },
  salesforce: { slug: "salesforce", color: "00A1E0", label: "Salesforce" },
  discord: { slug: "discord", color: "5865F2", label: "Discord" },
  zoom: { slug: "zoom", color: "2D8CFF", label: "Zoom" },
  github: { slug: "github", color: "181717", label: "GitHub" },
  openai: { slug: "openai", color: "10A37F", label: "OpenAI" },
  chatgpt: { slug: "openai", color: "10A37F", label: "OpenAI" },
  claude: { slug: "anthropic", color: "D97757", label: "Claude" },
  anthropic: { slug: "anthropic", color: "D97757", label: "Anthropic" },
  gemini: { slug: "googlegemini", color: "1A73E8", label: "Gemini" },
  googlegemini: { slug: "googlegemini", color: "1A73E8", label: "Google Gemini" },
  drive: { slug: "googledrive", color: "4285F4", label: "Google Drive" },
  googledrive: { slug: "googledrive", color: "4285F4", label: "Google Drive" },
  teams: { slug: "microsoftteams", color: "6264A7", label: "Microsoft Teams" },
  microsoftteams: { slug: "microsoftteams", color: "6264A7", label: "Microsoft Teams" },
  zendesk: { slug: "zendesk", color: "03363D", label: "Zendesk" },
  googledocs: { slug: "googledocs", color: "4285F4", label: "Google Docs" },
  docs: { slug: "googledocs", color: "4285F4", label: "Google Docs" },
  youtube: { slug: "youtube", color: "FF0000", label: "YouTube" },
  asana: { slug: "asana", color: "F06A6A", label: "Asana" },
  todoist: { slug: "todoist", color: "E44332", label: "Todoist" },
  planner: { slug: "microsoft", color: "0078D4", label: "Planner" },
  weather: { slug: "accuweather", color: "F8971D", label: "Weather" }
}

export interface BrandIconProps {
  size?: number
  className?: string
  bare?: boolean
}

// 1. OFFICIAL OPENAI BRAND ICON (Rosette Spiral glyph + #10A37F flat brand tile)
export function OpenAIIcon({ size = 20, className = "", bare = false }: BrandIconProps) {
  if (bare) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 256 260"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 text-[#10A37F] ${className}`}
      >
        <path d="M239.184 106.203a64.72 64.72 0 0 0-5.576-53.103C219.452 28.459 191 15.784 163.213 21.74A65.586 65.586 0 0 0 52.096 45.22a64.72 64.72 0 0 0-43.23 31.36c-14.31 24.602-11.061 55.634 8.033 76.74a64.67 64.67 0 0 0 5.525 53.102c14.174 24.65 42.644 37.324 70.446 31.36a64.72 64.72 0 0 0 48.754 21.744c28.481.025 53.714-18.361 62.414-45.481a64.77 64.77 0 0 0 43.229-31.36c14.137-24.558 10.875-55.423-8.083-76.483m-97.56 136.338a48.4 48.4 0 0 1-31.105-11.255l1.535-.87l51.67-29.825a8.6 8.6 0 0 0 4.247-7.367v-72.85l21.845 12.636c.218.111.37.32.409.563v60.367c-.056 26.818-21.783 48.545-48.601 48.601M37.158 197.93a48.35 48.35 0 0 1-5.781-32.589l1.534.921l51.722 29.826a8.34 8.34 0 0 0 8.441 0l63.181-36.425v25.221a.87.87 0 0 1-.358.665l-52.335 30.184c-23.257 13.398-52.97 5.431-66.404-17.803M23.549 85.38a48.5 48.5 0 0 1 25.58-21.333v61.39a8.29 8.29 0 0 0 4.195 7.316l62.874 36.272l-21.845 12.636a.82.82 0 0 1-.767 0L41.353 151.53c-23.211-13.454-31.171-43.144-17.804-66.405zm179.466 41.695l-63.08-36.63L161.73 77.86a.82.82 0 0 1 .768 0l52.233 30.184a48.6 48.6 0 0 1-7.316 87.635v-61.391a8.54 8.54 0 0 0-4.4-7.213m21.742-32.69l-1.535-.922l-51.619-30.081a8.39 8.39 0 0 0-8.492 0L99.98 99.808V74.587a.72.72 0 0 1 .307-.665l52.233-30.133a48.652 48.652 0 0 1 72.236 50.391zM88.061 139.097l-21.845-12.585a.87.87 0 0 1-.41-.614V65.685a48.652 48.652 0 0 1 79.757-37.346l-1.535.87l-51.67 29.825a8.6 8.6 0 0 0-4.246 7.367zm11.868-25.58L128.067 97.3l28.188 16.218v32.434l-28.086 16.218l-28.188-16.218z" />
      </svg>
    )
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      <rect width="24" height="24" rx="5" fill="#10A37F" />
      <svg x="3.5" y="3.5" width="17" height="17" viewBox="0 0 256 260" fill="#FFFFFF">
        <path d="M239.184 106.203a64.72 64.72 0 0 0-5.576-53.103C219.452 28.459 191 15.784 163.213 21.74A65.586 65.586 0 0 0 52.096 45.22a64.72 64.72 0 0 0-43.23 31.36c-14.31 24.602-11.061 55.634 8.033 76.74a64.67 64.67 0 0 0 5.525 53.102c14.174 24.65 42.644 37.324 70.446 31.36a64.72 64.72 0 0 0 48.754 21.744c28.481.025 53.714-18.361 62.414-45.481a64.77 64.77 0 0 0 43.229-31.36c14.137-24.558 10.875-55.423-8.083-76.483m-97.56 136.338a48.4 48.4 0 0 1-31.105-11.255l1.535-.87l51.67-29.825a8.6 8.6 0 0 0 4.247-7.367v-72.85l21.845 12.636c.218.111.37.32.409.563v60.367c-.056 26.818-21.783 48.545-48.601 48.601M37.158 197.93a48.35 48.35 0 0 1-5.781-32.589l1.534.921l51.722 29.826a8.34 8.34 0 0 0 8.441 0l63.181-36.425v25.221a.87.87 0 0 1-.358.665l-52.335 30.184c-23.257 13.398-52.97 5.431-66.404-17.803M23.549 85.38a48.5 48.5 0 0 1 25.58-21.333v61.39a8.29 8.29 0 0 0 4.195 7.316l62.874 36.272l-21.845 12.636a.82.82 0 0 1-.767 0L41.353 151.53c-23.211-13.454-31.171-43.144-17.804-66.405zm179.466 41.695l-63.08-36.63L161.73 77.86a.82.82 0 0 1 .768 0l52.233 30.184a48.6 48.6 0 0 1-7.316 87.635v-61.391a8.54 8.54 0 0 0-4.4-7.213m21.742-32.69l-1.535-.922l-51.619-30.081a8.39 8.39 0 0 0-8.492 0L99.98 99.808V74.587a.72.72 0 0 1 .307-.665l52.233-30.133a48.652 48.652 0 0 1 72.236 50.391zM88.061 139.097l-21.845-12.585a.87.87 0 0 1-.41-.614V65.685a48.652 48.652 0 0 1 79.757-37.346l-1.535.87l-51.67 29.825a8.6 8.6 0 0 0-4.246 7.367zm11.868-25.58L128.067 97.3l28.188 16.218v32.434l-28.086 16.218l-28.188-16.218z" />
      </svg>
    </svg>
  )
}

// 2. OFFICIAL ANTHROPIC CLAUDE BRAND ICON (Starburst Spark + #D97757 flat brand tile)
export function ClaudeIcon({ size = 20, className = "", bare = false }: BrandIconProps) {
  if (bare) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="#D97757"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 ${className}`}
      >
        <path d="m19.6 66.5 19.7-11 .3-1-.3-.5h-1l-3.3-.2-11.2-.3L14 53l-9.5-.5-2.4-.5L0 49l.2-1.5 2-1.3 2.9.2 6.3.5 9.5.6 6.9.4L38 49.1h1.6l.2-.7-.5-.4-.4-.4L29 41l-10.6-7-5.6-4.1-3-2-1.5-2-.6-4.2 2.7-3 3.7.3.9.2 3.7 2.9 8 6.1L37 36l1.5 1.2.6-.4.1-.3-.7-1.1L33 25l-6-10.4-2.7-4.3-.7-2.6c-.3-1-.4-2-.4-3l3-4.2L28 0l4.2.6L33.8 2l2.6 6 4.1 9.3L47 29.9l2 3.8 1 3.4.3 1h.7v-.5l.5-7.2 1-8.7 1-11.2.3-3.2 1.6-3.8 3-2L61 2.6l2 2.9-.3 1.8-1.1 7.7L59 27.1l-1.5 8.2h.9l1-1.1 4.1-5.4 6.9-8.6 3-3.5L77 13l2.3-1.8h4.3l3.1 4.7-1.4 4.9-4.4 5.6-3.7 4.7-5.3 7.1-3.2 5.7.3.4h.7l12-2.6 6.4-1.1 7.6-1.3 3.5 1.6.4 1.6-1.4 3.4-8.2 2-9.6 2-14.3 3.3-.2.1.2.3 6.4.6 2.8.2h6.8l12.6 1 3.3 2 1.9 2.7-.3 2-5.1 2.6-6.8-1.6-16-3.8-5.4-1.3h-.8v.4l4.6 4.5 8.3 7.5L89 80.1l.5 2.4-1.3 2-1.4-.2-9.2-7-3.6-3-8-6.8h-.5v.7l1.8 2.7 9.8 14.7.5 4.5-.7 1.4-2.6 1-2.7-.6-5.8-8-6-9-4.7-8.2-.5.4-2.9 30.2-1.3 1.5-3 1.2-2.5-2-1.4-3 1.4-6.2 1.6-8 1.3-6.4 1.2-7.9.7-2.6v-.2H49L43 72l-9 12.3-7.2 7.6-1.7.7-3-1.5.3-2.8L24 86l10-12.8 6-7.9 4-4.6-.1-.5h-.3L17.2 77.4l-4.7.6-2-2 .2-3 1-1 8-5.5Z" />
      </svg>
    )
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      <rect width="24" height="24" rx="5" fill="#D97757" />
      <svg x="3.5" y="3.5" width="17" height="17" viewBox="0 0 100 100" fill="#FFFFFF">
        <path d="m19.6 66.5 19.7-11 .3-1-.3-.5h-1l-3.3-.2-11.2-.3L14 53l-9.5-.5-2.4-.5L0 49l.2-1.5 2-1.3 2.9.2 6.3.5 9.5.6 6.9.4L38 49.1h1.6l.2-.7-.5-.4-.4-.4L29 41l-10.6-7-5.6-4.1-3-2-1.5-2-.6-4.2 2.7-3 3.7.3.9.2 3.7 2.9 8 6.1L37 36l1.5 1.2.6-.4.1-.3-.7-1.1L33 25l-6-10.4-2.7-4.3-.7-2.6c-.3-1-.4-2-.4-3l3-4.2L28 0l4.2.6L33.8 2l2.6 6 4.1 9.3L47 29.9l2 3.8 1 3.4.3 1h.7v-.5l.5-7.2 1-8.7 1-11.2.3-3.2 1.6-3.8 3-2L61 2.6l2 2.9-.3 1.8-1.1 7.7L59 27.1l-1.5 8.2h.9l1-1.1 4.1-5.4 6.9-8.6 3-3.5L77 13l2.3-1.8h4.3l3.1 4.7-1.4 4.9-4.4 5.6-3.7 4.7-5.3 7.1-3.2 5.7.3.4h.7l12-2.6 6.4-1.1 7.6-1.3 3.5 1.6.4 1.6-1.4 3.4-8.2 2-9.6 2-14.3 3.3-.2.1.2.3 6.4.6 2.8.2h6.8l12.6 1 3.3 2 1.9 2.7-.3 2-5.1 2.6-6.8-1.6-16-3.8-5.4-1.3h-.8v.4l4.6 4.5 8.3 7.5L89 80.1l.5 2.4-1.3 2-1.4-.2-9.2-7-3.6-3-8-6.8h-.5v.7l1.8 2.7 9.8 14.7.5 4.5-.7 1.4-2.6 1-2.7-.6-5.8-8-6-9-4.7-8.2-.5.4-2.9 30.2-1.3 1.5-3 1.2-2.5-2-1.4-3 1.4-6.2 1.6-8 1.3-6.4 1.2-7.9.7-2.6v-.2H49L43 72l-9 12.3-7.2 7.6-1.7.7-3-1.5.3-2.8L24 86l10-12.8 6-7.9 4-4.6-.1-.5h-.3L17.2 77.4l-4.7.6-2-2 .2-3 1-1 8-5.5Z" />
      </svg>
    </svg>
  )
}

// 3. OFFICIAL GOOGLE GEMINI BRAND ICON (4-Point Curved Spark + #1A73E8 flat brand tile)
export function GeminiIcon({ size = 20, className = "", bare = false }: BrandIconProps) {
  if (bare) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="210.5 0 51.3 51.3"
        fill="#1A73E8"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 ${className}`}
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M234.123 41.2204C235.489 44.3354 236.172 47.6638 236.172 51.2055C236.172 47.6638 236.833 44.3354 238.156 41.2204C239.521 38.1054 241.356 35.3958 243.66 33.0916C245.965 30.7873 248.674 28.9738 251.789 27.651C254.904 26.2855 258.233 25.6028 261.774 25.6028C258.233 25.6028 254.904 24.9414 251.789 23.6185C248.674 22.2531 245.965 20.4182 243.66 18.114C241.356 15.8097 239.521 13.1001 238.156 9.98507C236.833 6.87007 236.172 3.54171 236.172 0C236.172 3.54171 235.489 6.87007 234.123 9.98507C232.801 13.1001 230.987 15.8097 228.683 18.114C226.379 20.4182 223.669 22.2531 220.554 23.6185C217.439 24.9414 214.111 25.6028 210.569 25.6028C214.111 25.6028 217.439 26.2855 220.554 27.651C223.669 28.9738 226.379 30.7873 228.683 33.0916C230.987 35.3958 232.801 38.1054 234.123 41.2204Z"
        />
      </svg>
    )
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      <rect width="24" height="24" rx="5" fill="#1A73E8" />
      <svg x="3.5" y="3.5" width="17" height="17" viewBox="210.5 0 51.3 51.3" fill="#FFFFFF">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M234.123 41.2204C235.489 44.3354 236.172 47.6638 236.172 51.2055C236.172 47.6638 236.833 44.3354 238.156 41.2204C239.521 38.1054 241.356 35.3958 243.66 33.0916C245.965 30.7873 248.674 28.9738 251.789 27.651C254.904 26.2855 258.233 25.6028 261.774 25.6028C258.233 25.6028 254.904 24.9414 251.789 23.6185C248.674 22.2531 245.965 20.4182 243.66 18.114C241.356 15.8097 239.521 13.1001 238.156 9.98507C236.833 6.87007 236.172 3.54171 236.172 0C236.172 3.54171 235.489 6.87007 234.123 9.98507C232.801 13.1001 230.987 15.8097 228.683 18.114C226.379 20.4182 223.669 22.2531 220.554 23.6185C217.439 24.9414 214.111 25.6028 210.569 25.6028C214.111 25.6028 217.439 26.2855 220.554 27.651C223.669 28.9738 226.379 30.7873 228.683 33.0916C230.987 35.3958 232.801 38.1054 234.123 41.2204Z"
        />
      </svg>
    </svg>
  )
}

export function AppIcon({ appId, appName, className = "", size = 24 }: AppIconProps) {
  const [imgError, setImgError] = useState(false)
  const id = (appId || appName || "").toLowerCase().replace(/[^a-z0-9]/g, "")

  // 1. OFFICIAL SLACK 4-COLOR HASHTAG LOGO (Vector SVG)
  if (id.includes("slack")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`shrink-0 ${className}`}>
        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" fill="#E01E5A"/>
        <path d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z" fill="#36C5F0"/>
        <path d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z" fill="#2EB67D"/>
        <path d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.521A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.523v-2.52h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#ECB22E"/>
      </svg>
    )
  }

  // 2. OFFICIAL NOTION VECTOR SVG (2-layer: authentic white notebook body + sharp black monogram)
  if (id === "notion" || id.includes("notion")) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 ${className}`}
      >
        {/* Layer 1: Notebook Body Shape filled with pure White */}
        <path
          d="M6.017 4.313l55.333 -4.087c6.797 -0.583 8.543 -0.19 12.817 2.917l17.663 12.443c2.913 2.14 3.883 2.723 3.883 5.053v68.243c0 4.277 -1.553 6.807 -6.99 7.193L24.467 99.967c-4.08 0.193 -6.023 -0.39 -8.16 -3.113L3.3 79.94c-2.333 -3.113 -3.3 -5.443 -3.3 -8.167V11.113c0 -3.497 1.553 -6.413 6.017 -6.8z"
          fill="#FFFFFF"
        />
        {/* Layer 2: Official Black Outer Binding, 3D Folds, and "N" Monogram */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M61.35 0.227l-55.333 4.087C1.553 4.7 0 7.617 0 11.113v60.66c0 2.723 0.967 5.053 3.3 8.167l13.007 16.913c2.137 2.723 4.08 3.307 8.16 3.113l64.257 -3.89c5.433 -0.387 6.99 -2.917 6.99 -7.193V20.64c0 -2.21 -0.873 -2.847 -3.443 -4.733L74.167 3.143c-4.273 -3.107 -6.02 -3.5 -12.817 -2.917zM25.92 19.523c-5.247 0.353 -6.437 0.433 -9.417 -1.99L8.927 11.507c-0.77 -0.78 -0.383 -1.753 1.557 -1.947l53.193 -3.887c4.467 -0.39 6.793 1.167 8.54 2.527l9.123 6.61c0.39 0.197 1.36 1.36 0.193 1.36l-54.933 3.307 -0.68 0.047zM19.803 88.3V30.367c0 -2.53 0.777 -3.697 3.103 -3.893L86 22.78c2.14 -0.193 3.107 1.167 3.107 3.693v57.547c0 2.53 -0.39 4.67 -3.883 4.863l-60.377 3.5c-3.493 0.193 -5.043 -0.97 -5.043 -4.083zm59.6 -54.827c0.387 1.75 0 3.5 -1.75 3.7l-2.91 0.577v42.773c-2.527 1.36 -4.853 2.137 -6.797 2.137 -3.107 0 -3.883 -0.973 -6.21 -3.887l-19.03 -29.94v28.967l6.02 1.363s0 3.5 -4.857 3.5l-13.39 0.777c-0.39 -0.78 0 -2.723 1.357 -3.11l3.497 -0.97v-38.3L30.48 40.667c-0.39 -1.75 0.58 -4.277 3.3 -4.473l14.367 -0.967 19.8 30.327v-26.83l-5.047 -0.58c-0.39 -2.143 1.163 -3.7 3.103 -3.89l13.4 -0.78z"
          fill="#000000"
        />
      </svg>
    )
  }

  // 3a. ORIGINAL OPENAI / CHATGPT VECTOR SVG
  if (id.includes("openai") || id.includes("chatgpt")) {
    return <OpenAIIcon size={size} className={className} />
  }

  // 3b. ORIGINAL ANTHROPIC CLAUDE VECTOR SVG
  if (id.includes("claude") || id.includes("anthropic")) {
    return <ClaudeIcon size={size} className={className} />
  }

  // 3c. ORIGINAL GOOGLE GEMINI VECTOR SVG
  if (id.includes("gemini")) {
    return <GeminiIcon size={size} className={className} />
  }

  // 4. ORIGINAL MICROSOFT TEAMS VECTOR SVG
  if (id.includes("teams") || id.includes("microsoftteams")) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 256 239"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 ${className}`}
      >
        <defs>
          <linearGradient id="msTeamsGrad" x1="17.372%" x2="82.628%" y1="-6.51%" y2="106.51%">
            <stop offset="0%" stopColor="#5A62C3" />
            <stop offset="50%" stopColor="#4D55BD" />
            <stop offset="100%" stopColor="#3940AB" />
          </linearGradient>
        </defs>
        {/* Right avatar silhouette */}
        <circle cx="223.256" cy="50.605" r="26.791" fill="#5059C9" />
        <path
          fill="#5059C9"
          d="M178.563 89.302h66.125c6.248 0 11.312 5.065 11.312 11.312v60.231c0 22.96-18.613 41.574-41.573 41.574h-.197c-22.96.003-41.576-18.607-41.579-41.568V95.215a5.91 5.91 0 0 1 5.912-5.913"
        />
        {/* Main avatar silhouette */}
        <circle cx="139.907" cy="38.698" r="38.698" fill="#7B83EB" />
        <path
          fill="#7B83EB"
          d="M191.506 89.302H82.355c-6.173.153-11.056 5.276-10.913 11.449v68.697c-.862 37.044 28.445 67.785 65.488 68.692c37.043-.907 66.35-31.648 65.489-68.692v-68.697c.143-6.173-4.74-11.296-10.913-11.449"
        />
        {/* Teams Front Tile */}
        <path
          fill="url(#msTeamsGrad)"
          d="M10.913 53.581h109.15c6.028 0 10.914 4.886 10.914 10.913v109.151c0 6.027-4.886 10.913-10.913 10.913H10.913C4.886 184.558 0 179.672 0 173.645V64.495C0 58.466 4.886 53.58 10.913 53.58"
        />
        {/* Teams "T" monogram */}
        <path fill="#FFFFFF" d="M94.208 95.125h-21.82v59.416H58.487V95.125H36.769V83.599h57.439z" />
      </svg>
    )
  }

  // 5. ORIGINAL MICROSOFT PLANNER VECTOR SVG
  if (id.includes("planner")) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 ${className}`}
      >
        <defs>
          <linearGradient id="msPlannerGrad1" x1="6.38724" y1="3.74167" x2="2.15779" y2="12.777" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8752E0" />
            <stop offset="1" stopColor="#541278" />
          </linearGradient>
          <linearGradient id="msPlannerGrad2" x1="18.3701" y1="0" x2="9.85717" y2="20.4192" gradientUnits="userSpaceOnUse">
            <stop stopColor="#DB45E0" />
            <stop offset="0.677" stopColor="#A829AE" />
            <stop offset="1" stopColor="#8F28B3" />
          </linearGradient>
          <linearGradient id="msPlannerGrad3" x1="18.2164" y1="7.92626" x2="10.5237" y2="22.9363" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3DCBFF" />
            <stop offset="1" stopColor="#4A40D4" />
          </linearGradient>
        </defs>
        <path
          d="M8.25809 15.7412C7.22488 16.7744 5.54971 16.7744 4.5165 15.7412L0.774909 11.9996C-0.258303 10.9664 -0.258303 9.29129 0.774908 8.25809L4.5165 4.51655C5.54971 3.48335 7.22488 3.48335 8.25809 4.51655L11.9997 8.2581C13.0329 9.29129 13.0329 10.9664 11.9997 11.9996L8.25809 15.7412Z"
          fill="url(#msPlannerGrad1)"
        />
        <path
          d="M0.774857 11.9999C1.80809 13.0331 3.48331 13.0331 4.51655 11.9999L15.7417 0.774926C16.7749 -0.258304 18.4501 -0.258309 19.4834 0.774914L23.225 4.51655C24.2583 5.54977 24.2583 7.22496 23.225 8.25819L11.9999 19.4832C10.9667 20.5164 9.29146 20.5164 8.25822 19.4832L0.774857 11.9999Z"
          fill="url(#msPlannerGrad2)"
        />
        <path
          d="M4.51642 15.7413C5.54966 16.7746 7.22487 16.7746 8.25812 15.7413L15.7415 8.25803C16.7748 7.2248 18.45 7.2248 19.4832 8.25803L23.2249 11.9997C24.2582 13.0329 24.2582 14.7081 23.2249 15.7413L15.7415 23.2246C14.7083 24.2579 13.033 24.2579 11.9998 23.2246L4.51642 15.7413Z"
          fill="url(#msPlannerGrad3)"
        />
      </svg>
    )
  }

  // Webhook / HTTP / Scheduler Custom Icons
  if (id.includes("webhook") || id.includes("catch")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`shrink-0 ${className}`}>
        <rect width="24" height="24" rx="6" fill="#009688" />
        <path d="M7 8l5-4 5 4M12 4v9" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="7" cy="8" r="2" fill="#FFFFFF" />
        <circle cx="17" cy="8" r="2" fill="#FFFFFF" />
        <circle cx="12" cy="16" r="2.5" fill="#FFFFFF" />
      </svg>
    )
  }

  if (id.includes("http") || id.includes("request") || id.includes("api")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`shrink-0 ${className}`}>
        <rect width="24" height="24" rx="6" fill="#2563EB" />
        <circle cx="12" cy="12" r="7" stroke="#FFFFFF" strokeWidth="2" fill="none" />
        <path d="M5 12h14M12 5a10 10 0 0 1 0 14 10 10 0 0 1 0-14z" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />
      </svg>
    )
  }

  if (id.includes("schedule") || id.includes("cron")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`shrink-0 ${className}`}>
        <rect width="24" height="24" rx="6" fill="#F59E0B" />
        <circle cx="12" cy="12" r="7" stroke="#FFFFFF" strokeWidth="2" fill="none" />
        <polyline points="12 8 12 12 15 14" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
    )
  }

  if (id.includes("automateform") || (id.includes("automate") && id.includes("form"))) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`shrink-0 ${className}`}>
        <rect width="24" height="24" rx="6" fill="#2563EB" />
        <path d="M7 6h10v2H7V6zm0 4h10v2H7v-2zm0 4h7v2H7v-2z" fill="#FFFFFF" />
      </svg>
    )
  }

  // OFFICIAL WHATSAPP / AUTOMATE CHATS BRAND VECTOR ICON
  if (id.includes("whatsapp") || id.includes("automatechat") || (id.includes("automate") && id.includes("chat"))) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`shrink-0 ${className}`}>
        <path
          d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m-3.53 3.41c-.2 0-.42.01-.61.02-.24.01-.52.09-.76.35-.24.26-.94.92-.94 2.24s.96 2.6 1.09 2.78c.13.17 1.86 2.85 4.52 3.99.63.27 1.13.43 1.51.56.63.2 1.21.17 1.66.11.51-.08 1.56-.64 1.78-1.26.22-.62.22-1.15.15-1.26-.06-.11-.24-.18-.51-.31-.27-.14-1.58-.78-1.83-.87-.24-.09-.42-.14-.6.13-.18.27-.69.87-.85 1.05-.16.18-.31.2-.58.07-.27-.14-1.15-.42-2.19-1.35-.81-.72-1.35-1.61-1.51-1.88-.16-.27-.02-.42.12-.55.12-.12.27-.31.4-.47.13-.15.18-.26.27-.43.09-.18.04-.33-.02-.47-.07-.13-.6-1.45-.82-1.99-.22-.52-.44-.45-.61-.46h-.52Z"
          fill="#25D366"
        />
      </svg>
    )
  }

  // OFFICIAL SALESFORCE VECTOR SVG
  if (id.includes("salesforce")) {
    return (
      <svg width={size} height={size} viewBox="0 0 256 180" fill="none" className={`shrink-0 ${className}`}>
        <path
          fill="#00A1E0"
          d="M106.553 19.651c8.248-8.594 19.731-13.924 32.43-13.924c16.883 0 31.612 9.414 39.455 23.389a54.5 54.5 0 0 1 22.3-4.74c30.449 0 55.134 24.9 55.134 55.615c0 30.719-24.685 55.62-55.134 55.62c-2.31 0-4.577-.149-6.804-.43a50.8 50.8 0 0 1-40.407 20.082c-15.02 0-28.536-6.495-37.94-16.892a47.3 47.3 0 0 1-27.144 8.52c-26.31 0-47.636-21.326-47.636-47.636c0-18.49 10.536-34.52 25.867-42.423a47.8 47.8 0 0 1-1.378-11.455c0-26.31 21.326-47.636 47.636-47.636c13.791 0 26.216 5.865 34.987 15.289"
        />
      </svg>
    )
  }

  // OFFICIAL PIPEDRIVE VECTOR SVG
  if (id.includes("pipedrive")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`shrink-0 ${className}`}>
        <circle cx="12" cy="12" r="11" fill="#040926" />
        <path d="M8.5 5.5h4.2a3.8 3.8 0 0 1 3.8 3.8c0 2.1-1.7 3.8-3.8 3.8H11v5.4H8.5V5.5zm2.5 5.2h1.7a1.4 1.4 0 0 0 1.4-1.4 1.4 1.4 0 0 0-1.4-1.4H11v2.8z" fill="#28A745" />
      </svg>
    )
  }

  // OFFICIAL FRESHDESK VECTOR SVG
  if (id.includes("freshdesk")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`shrink-0 ${className}`}>
        <rect width="24" height="24" rx="6" fill="#00B8D9" />
        <path d="M12 4a8 8 0 0 0-8 8c0 2.21.895 4.21 2.343 5.657L5 20l3.343-1.343A7.95 7.95 0 0 0 12 20a8 8 0 0 0 8-8 8 8 0 0 0-8-8zm-3 7a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z" fill="#FFFFFF" />
      </svg>
    )
  }

  // --- FLOW CONTROL & AI AGENT CORE APPS ---
  if (id.includes("aiagent") || id.includes("ai-agent") || id.includes("ai_agent")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`shrink-0 ${className}`}>
        <rect width="24" height="24" rx="6" fill="#7C3AED" />
        {/* Sleek Agent Head with Antenna and Visor */}
        <path d="M12 3.5v2.5M9.5 4.5h5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="5.5" y="7" width="13" height="11" rx="3" stroke="#FFFFFF" strokeWidth="1.8" fill="none" />
        <circle cx="9.5" cy="11.5" r="1.25" fill="#FFFFFF" />
        <circle cx="14.5" cy="11.5" r="1.25" fill="#FFFFFF" />
        <path d="M9.5 15h5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M3.5 12h2M18.5 12h2" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  }

  if (id.includes("filter")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`shrink-0 ${className}`}>
        <rect width="24" height="24" rx="6" fill="#3B82F6" />
        <path d="M4 6h16l-6 7v6l-4 2v-8L4 6z" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    )
  }

  if (id.includes("router") || id.includes("branch")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`shrink-0 ${className}`}>
        <rect width="24" height="24" rx="6" fill="#8B5CF6" />
        <circle cx="6" cy="18" r="2" fill="#FFFFFF" />
        <circle cx="18" cy="6" r="2" fill="#FFFFFF" />
        <circle cx="18" cy="18" r="2" fill="#FFFFFF" />
        <path d="M8 18h4a4 4 0 004-4V8" stroke="#FFFFFF" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M8 18h8" stroke="#FFFFFF" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
    )
  }

  if (id.includes("delay")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`shrink-0 ${className}`}>
        <rect width="24" height="24" rx="6" fill="#F59E0B" />
        <path d="M7 5h10M7 19h10M8 5v4l4 3 4-3V5M8 19v-4l4-3 4 3v4" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    )
  }

  if (id.includes("iterator") || id.includes("loop")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`shrink-0 ${className}`}>
        <rect width="24" height="24" rx="6" fill="#EC4899" />
        <path d="M17 2l4 4-4 4" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M3 11v-1a4 4 0 014-4h14M7 22l-4-4 4-4" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M21 13v1a4 4 0 01-4 4H3" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    )
  }

  // --- UTILITIES CORE APPS ---
  if (id.includes("text") && id.includes("format")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`shrink-0 ${className}`}>
        <rect width="24" height="24" rx="6" fill="#10B981" />
        <path d="M6 6h12M12 6v12M9 18h6" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (id.includes("date") || id.includes("datetime")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`shrink-0 ${className}`}>
        <rect width="24" height="24" rx="6" fill="#6366F1" />
        <rect x="5" y="7" width="14" height="12" rx="2" stroke="#FFFFFF" strokeWidth="2" fill="none" />
        <path d="M16 4v4M8 4v4M5 11h14" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  }

  if (id.includes("number") && id.includes("format")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`shrink-0 ${className}`}>
        <rect width="24" height="24" rx="6" fill="#14B8A6" />
        <path d="M7 6h10M7 12h10M7 18h10M12 6v12" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  }

  if (id.includes("code") || id.includes("runner")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`shrink-0 ${className}`}>
        <rect width="24" height="24" rx="6" fill="#0284C7" />
        <path d="M8 10l-3 2 3 2M16 10l3 2-3 2M14 7l-4 10" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (id.includes("lookup") || id.includes("table")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`shrink-0 ${className}`}>
        <rect width="24" height="24" rx="6" fill="#D97706" />
        <rect x="5" y="5" width="14" height="14" rx="2" stroke="#FFFFFF" strokeWidth="2" fill="none" />
        <path d="M5 10h14M11 5v14" stroke="#FFFFFF" strokeWidth="1.5" />
      </svg>
    )
  }

  if (id.includes("human") || id.includes("approval")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`shrink-0 ${className}`}>
        <rect width="24" height="24" rx="6" fill="#6D28D9" />
        <circle cx="10" cy="9" r="3" stroke="#FFFFFF" strokeWidth="2" fill="none" />
        <path d="M4 18c0-3 3-4 6-4s6 1 6 4" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M16 11l2 2 4-4" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  // Find matching brand key
  const matchKey = Object.keys(APP_BRAND_MAP).find((key) => id.includes(key))
  const brand = matchKey ? APP_BRAND_MAP[matchKey] : null

  // Use official CDN SVG logo if brand is recognized and imgError is false
  if (brand && !imgError) {
    const isDarkInvert = brand.color === "000000" || brand.color === "181717" || brand.color === "262627" || brand.color === "040926"
    return (
      <img
        src={`https://cdn.simpleicons.org/${brand.slug}/${brand.color}`}
        alt={brand.label}
        style={{ width: `${size}px`, height: `${size}px` }}
        className={`shrink-0 object-contain ${isDarkInvert ? "dark:invert" : ""} ${className}`}
        onError={() => setImgError(true)}
        loading="eager"
      />
    )
  }

  // Fallback to crisp colored SVG badge
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`shrink-0 ${className}`}>
      <rect width="24" height="24" rx="6" fill={brand ? `#${brand.color}` : "#2563EB"} />
      <text x="12" y="16" fill="#FFFFFF" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
        {(appName || appId || "A").charAt(0).toUpperCase()}
      </text>
    </svg>
  )
}
