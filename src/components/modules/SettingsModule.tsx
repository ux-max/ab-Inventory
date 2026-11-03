"use client"

import React, { useState } from "react"
import { useApp } from "@/context/AppContext"
import { SettingsSidebar, SettingsTabKey } from "@/components/settings/SettingsSidebar"
import { GeneralSettings } from "@/components/settings/GeneralSettings"
import { ItemsSettings } from "@/components/settings/ItemsSettings"
import { PrintSettingsView } from "@/components/settings/PrintSettingsView"
import { MultiCurrencySettings } from "@/components/settings/MultiCurrencySettings"
import { TermsConditionsSettings } from "@/components/settings/TermsConditionsSettings"
import { RolesPermissionsSettings } from "@/components/settings/RolesPermissionsSettings"
import { UsersSettings } from "@/components/settings/UsersSettings"
import { UserInfoSettings } from "@/components/settings/UserInfoSettings"
import { RemindersSettings } from "@/components/settings/RemindersSettings"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ShieldCheck, 
  Cloud, 
  Layers, 
  Database,
  Lock,
  Download,
  UploadCloud
} from "lucide-react"

interface SettingsModuleProps {
  initialTab?: SettingsTabKey
}

export function SettingsModule({ initialTab = "general" }: SettingsModuleProps) {
  const safeInitialTab = (initialTab === "items" || initialTab === "print" || initialTab === "terms") ? "general" : initialTab
  const [activeTab, setActiveTab] = useState<SettingsTabKey>(safeInitialTab)
  const { business, updateBusiness } = useApp()

  return (
    <div className="flex h-full w-full overflow-hidden bg-white dark:bg-slate-950">
      {/* 1. Sub-Sidebar matching Reports module */}
      <SettingsSidebar activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* 2. Main Content Area */}
      <div className="flex-1 h-full overflow-hidden flex flex-col min-w-0">
        {activeTab === "general" && <GeneralSettings />}

        {activeTab === "user_info" && <UserInfoSettings />}

        {activeTab === "items" && <ItemsSettings />}

        {activeTab === "print" && <PrintSettingsView />}

        {activeTab === "currency" && <MultiCurrencySettings />}

        {activeTab === "terms" && <TermsConditionsSettings />}

        {/* Roles & Permissions Tab */}
        {activeTab === "roles" && <RolesPermissionsSettings />}

        {/* Users & Team Tab */}
        {activeTab === "users" && <UsersSettings />}

        {/* Auto Reminders & Alerts Tab */}
        {activeTab === "reminders" && <RemindersSettings />}
      </div>
    </div>
  )
}
