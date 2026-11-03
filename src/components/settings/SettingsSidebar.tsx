"use client"

import React, { useState } from "react"
import { 
  Building2, 
  Coins, 
  ShieldCheck, 
  Users,
  Search,
  UserCircle,
  Bell
} from "lucide-react"
import { cn } from "@/lib/utils"

export type SettingsTabKey = 
  | "general" 
  | "user_info"
  | "currency" 
  | "roles" 
  | "users"
  | "items" 
  | "print" 
  | "terms"
  | "reminders"

interface SettingsSidebarProps {
  activeTab: SettingsTabKey
  onSelectTab: (tab: SettingsTabKey) => void
}

interface NavItem {
  id: SettingsTabKey
  label: string
  icon: React.ElementType
  badge?: string
}

interface NavSection {
  id: string
  title: string
  items: NavItem[]
}

const SETTINGS_SECTIONS: NavSection[] = [
  {
    id: "general_section",
    title: "Organization & Catalog",
    items: [
      { id: "general", label: "General", icon: Building2 },
      { id: "user_info", label: "User Info", icon: UserCircle },
    ],
  },
  {
    id: "security_section",
    title: "Finance & Security",
    items: [
      { id: "currency", label: "Multi-Currency", icon: Coins },
      { id: "roles", label: "Roles & Permissions", icon: ShieldCheck },
      { id: "users", label: "Users & Team", icon: Users },
    ],
  },
  {
    id: "automation_section",
    title: "Alerts & Automation",
    items: [
      { id: "reminders", label: "Auto Reminders", icon: Bell },
    ],
  },
]

export function SettingsSidebar({ activeTab, onSelectTab }: SettingsSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredSections = SETTINGS_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) =>
        item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        section.title.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  })).filter((section) => section.items.length > 0)

  return (
    <div className="w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-[#f8fafc]/80 dark:bg-slate-900/60 flex flex-col h-full select-none">
      {/* Search Filter for Settings - Matching ReportsSidebar */}
      <div className="p-3 border-b border-slate-200/80 dark:border-slate-800">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search settings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Categories & Settings Navigation List - Exactly matching ReportsSidebar */}
      <div className="flex-1 overflow-y-auto py-2 space-y-4">
        {filteredSections.map((section) => (
          <div key={section.id} className="space-y-1">
            <div className="px-3 py-1 text-[11px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-400">
              {section.title}
            </div>

            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectTab(item.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-all cursor-pointer",
                      isActive
                        ? "bg-slate-200/80 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold border-l-3 border-blue-600 shadow-2xs"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-200"
                    )}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0 transition-colors",
                          isActive
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-slate-400 dark:text-slate-400"
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                        {item.badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
