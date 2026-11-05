"use client"

import React, { useState, Suspense } from "react"
import { useApp } from "@/context/AppContext"
import { Navbar } from "@/components/layout/Navbar"
import { Sidebar, NavSelection } from "@/components/layout/Sidebar"
import { HomeDashboard } from "@/components/dashboard/HomeDashboard"
import { ItemsModule } from "@/components/modules/ItemsModule"
import { SalesModule } from "@/components/modules/SalesModule"
import { InventoryModule } from "@/components/modules/InventoryModule"
import { ManufacturingModule } from "@/components/modules/ManufacturingModule"
import { GstModule } from "@/components/modules/GstModule"
import { PurchasesModule } from "@/components/modules/PurchasesModule"
import { PartiesModule } from "@/components/modules/PartiesModule"
import { ReportsModule } from "@/components/modules/ReportsModule"
import { SettingsModule } from "@/components/modules/SettingsModule"
import { BankAccountsModule } from "@/components/modules/BankAccountsModule"
import { EWayBillsModule } from "@/components/modules/EWayBillsModule"
import { EInvoicesModule } from "@/components/modules/EInvoicesModule"
import { GlobalSearchModal } from "@/components/modals/GlobalSearchModal"
import { QuickCreateModal } from "@/components/modals/QuickCreateModal"
import { LoginPage } from "@/components/auth/LoginPage"

export default function HomePage() {
  const { currentRole, isModuleAllowed, isAuthenticated } = useApp()
  
  // Navigation state (Default to Home Dashboard)
  const [currentNav, setCurrentNav] = useState<NavSelection>({ module: "dashboard" })
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  // Direct modal triggers
  const [openCreateInvoice, setOpenCreateInvoice] = useState(false)
  const [openAddItem, setOpenAddItem] = useState(false)
  const [openTransfer, setOpenTransfer] = useState(false)
  const [openAdjustment, setOpenAdjustment] = useState(false)
  const [openManufacture, setOpenManufacture] = useState(false)
  const [openAddParty, setOpenAddParty] = useState(false)

  // Fallback to dashboard if module is not allowed for role
  const isAllowed = isModuleAllowed(currentNav.module)
  const effectiveModule = isAllowed ? currentNav.module : "dashboard"

  const handleTriggerAction = (actionKey: string) => {
    switch (actionKey) {
      case "new_invoice":
        setCurrentNav({ module: "sales", subModule: "invoice" })
        setOpenCreateInvoice(true)
        break
      case "new_quotation":
        setCurrentNav({ module: "sales", subModule: "quotation" })
        break
      case "new_proforma":
        setCurrentNav({ module: "sales", subModule: "proforma" })
        break
      case "new_item":
        setCurrentNav({ module: "items", subModule: "all" })
        setOpenAddItem(true)
        break
      case "new_transfer":
        setCurrentNav({ module: "inventory", subModule: "transfers" })
        setOpenTransfer(true)
        break
      case "new_adjustment":
        setCurrentNav({ module: "inventory", subModule: "adjustments" })
        setOpenAdjustment(true)
        break
      case "new_manufacture":
        setCurrentNav({ module: "manufacturing", subModule: "composite" })
        setOpenManufacture(true)
        break
      case "new_party":
        setCurrentNav({ module: "parties", subModule: "customers" })
        setOpenAddParty(true)
        break
      default:
        break
    }
  }

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans print:h-auto print:overflow-visible print:block">
      
      {/* 1. Slim Zoho Top Navbar */}
      <Navbar 
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        onNavigateSettings={() => setCurrentNav({ module: "settings" })}
      />

      {/* 2. Workspace Body: Left Hierarchical Sidebar + Full Width Content */}
      <div className="flex-1 flex overflow-hidden print:h-auto print:overflow-visible print:block">
        
        {/* Left Sidebar */}
        <Sidebar 
          currentNav={currentNav} 
          onSelectNav={setCurrentNav} 
          isCollapsed={isSidebarCollapsed} 
        />

        {/* Primary Page Canvas (Full Width Data Grid) */}
        <main className="flex-1 overflow-auto bg-white dark:bg-slate-950 flex flex-col print:h-auto print:overflow-visible print:block print:p-0 print:m-0">
          {effectiveModule === "items" && (
            <ItemsModule 
              initialOpenAdd={openAddItem} 
              onCloseAddTrigger={() => setOpenAddItem(false)} 
            />
          )}

          {effectiveModule === "sales" && (
            <SalesModule 
              initialOpenCreate={openCreateInvoice} 
              onCloseCreateTrigger={() => setOpenCreateInvoice(false)} 
              subModule={currentNav.subModule}
            />
          )}

          {effectiveModule === "dashboard" && (
            <div className="p-4 sm:p-6 w-full max-w-[1600px] mx-auto flex-1">
              <Suspense fallback={
                <div className="space-y-6 animate-pulse">
                  <div className="h-28 bg-slate-100 dark:bg-slate-900 rounded-xl" />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="h-32 bg-slate-100 dark:bg-slate-900 rounded-xl" />
                    <div className="h-32 bg-slate-100 dark:bg-slate-900 rounded-xl" />
                    <div className="h-32 bg-slate-100 dark:bg-slate-900 rounded-xl" />
                    <div className="h-32 bg-slate-100 dark:bg-slate-900 rounded-xl" />
                  </div>
                  <div className="h-80 bg-slate-100 dark:bg-slate-900 rounded-xl" />
                </div>
              }>
                <HomeDashboard 
                  onNavigate={(mod, subMod) => setCurrentNav({ module: mod, subModule: subMod })} 
                  onTriggerAction={handleTriggerAction} 
                />
              </Suspense>
            </div>
          )}

          {effectiveModule === "inventory" && (
            <InventoryModule 
              subModule={currentNav.subModule}
              initialAction={openTransfer ? "transfer" : openAdjustment ? "adjustment" : null} 
              onCloseActionTrigger={() => {
                setOpenTransfer(false)
                setOpenAdjustment(false)
              }} 
            />
          )}

          {effectiveModule === "manufacturing" && (
            <ManufacturingModule 
              subModule={currentNav.subModule}
              initialOpenManufacture={openManufacture} 
              onCloseManufactureTrigger={() => setOpenManufacture(false)} 
            />
          )}

          {effectiveModule === "purchases" && (
            <PurchasesModule subModule={currentNav.subModule} />
          )}

          {effectiveModule === "parties" && (
            <PartiesModule 
              initialOpenAdd={openAddParty} 
              onCloseAddTrigger={() => setOpenAddParty(false)} 
              subModule={currentNav.subModule}
            />
          )}

          {effectiveModule === "reports" && (
            <Suspense fallback={<div className="p-6 text-slate-400">Loading Reports...</div>}>
              <ReportsModule onNavigate={(mod) => setCurrentNav({ module: mod })} />
            </Suspense>
          )}

          {effectiveModule === "gst" && (
            <GstModule />
          )}

          {effectiveModule === "eway" && (
            <EWayBillsModule onNavigate={(mod, subMod) => setCurrentNav({ module: mod, subModule: subMod })} />
          )}

          {effectiveModule === "einvoice" && (
            <EInvoicesModule onNavigate={(mod, subMod) => setCurrentNav({ module: mod, subModule: subMod })} />
          )}

          {(effectiveModule === "banking" || effectiveModule === "bank_accounts") && (
            <BankAccountsModule />
          )}

          {effectiveModule === "settings" && (
            <SettingsModule initialTab={currentNav.subModule as any} />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <GlobalSearchModal onNavigate={(mod) => setCurrentNav({ module: mod })} />
      <QuickCreateModal onAction={handleTriggerAction} />

    </div>
  )
}
