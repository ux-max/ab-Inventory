"use client"

import React, { useState } from "react"
import { useApp } from "@/context/AppContext"
import { RoleConfig, PermissionLevel } from "@/types/inventory"
import { 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Check, 
  Search, 
  Lock, 
  Eye, 
  EyeOff, 
  Sliders, 
  Building2, 
  LayoutGrid, 
  Table as TableIcon,
  Layers,
  Sparkles,
  X
} from "lucide-react"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface ModuleDefinition {
  id: string
  name: string
  category: "Core" | "Master Data" | "Transactions" | "Operations" | "Finance & Tax" | "Admin"
  description: string
}

const APP_MODULES: ModuleDefinition[] = [
  { id: "dashboard", name: "Dashboard & Home", category: "Core", description: "Operational metrics, KPI cards & quick actions" },
  { id: "items", name: "Item Catalog", category: "Master Data", description: "SKUs, products, pricing & batch tracking" },
  { id: "parties", name: "Parties & Ledgers", category: "Master Data", description: "Customers, vendors, balances & credit history" },
  { id: "sales", name: "Sales & Invoicing", category: "Transactions", description: "Quotes, sales orders, delivery challans & invoices" },
  { id: "purchases", name: "Purchases & Bills", category: "Transactions", description: "Vendor purchase orders, bills & debit notes" },
  { id: "inventory", name: "Inventory & Godowns", category: "Operations", description: "Stock transfers, godown management & adjustments" },
  { id: "manufacturing", name: "Manufacturing / BOM", category: "Operations", description: "Bill of materials & assembly production" },
  { id: "banking", name: "Banking & Cash", category: "Finance & Tax", description: "Bank accounts, statements & payment tracking" },
  { id: "eway", name: "E-Way Bills", category: "Finance & Tax", description: "NIC E-Way bill generation & status" },
  { id: "einvoice", name: "E-Invoices", category: "Finance & Tax", description: "IRN generation, QR code & GST verification" },
  { id: "reports", name: "Reports & Analytics", category: "Finance & Tax", description: "Financial P&L, stock reports & statutory GSTR summaries" },
  { id: "gst", name: "GST and Taxes", category: "Finance & Tax", description: "Tax rates, HSN codes, composition & RCM setup" },
  { id: "settings", name: "Settings & Config", category: "Admin", description: "Business profile, prefix numbering & print settings" },
]

export function RolesPermissionsSettings() {
  const { 
    roles, 
    currentRole, 
    addCustomRole, 
    updateRole, 
    deleteCustomRole 
  } = useApp()

  const [selectedRoleId, setSelectedRoleId] = useState<string>("sales")
  const [viewMode, setViewMode] = useState<"editor" | "matrix">("editor")
  const [searchQuery, setSearchQuery] = useState("")

  // Modal State for New Role
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newRoleName, setNewRoleName] = useState("")
  const [newRoleTitle, setNewRoleTitle] = useState("")
  const [newRoleTemplate, setNewRoleTemplate] = useState("sales")

  const roleList = Object.values(roles)
  const filteredRoles = roleList.filter((r) => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeRole = roles[selectedRoleId] || roleList[0]

  // Handler: Update module permission
  const handleSetModulePermission = (moduleId: string, level: PermissionLevel) => {
    if (!activeRole) return
    const currentPermissions = { ...(activeRole.modulePermissions || {}) }
    currentPermissions[moduleId] = level

    const updatedAllowedModules = Object.entries(currentPermissions)
      .filter(([_, perm]) => perm !== "none")
      .map(([mod]) => mod)

    updateRole(activeRole.id, {
      modulePermissions: currentPermissions,
      allowedModules: updatedAllowedModules
    })
  }

  // Handler: Quick toggle all modules
  const handleBulkSetPermissions = (level: PermissionLevel) => {
    if (!activeRole) return
    const newPermissions: Record<string, PermissionLevel> = {}
    APP_MODULES.forEach((m) => {
      newPermissions[m.id] = level
    })

    updateRole(activeRole.id, {
      modulePermissions: newPermissions,
      allowedModules: level === "none" ? [] : APP_MODULES.map((m) => m.id)
    })
  }

  // Handler: Create custom role
  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRoleName.trim()) return

    const baseTemplate = roles[newRoleTemplate] || roles["sales"]
    const result = addCustomRole({
      name: newRoleName.trim(),
      title: newRoleTitle.trim() || newRoleName.trim(),
      description: `Custom team role based on ${baseTemplate.title}`,
      avatarColor: "bg-slate-700",
      canViewCostAndProfit: baseTemplate.canViewCostAndProfit,
      canEditStock: baseTemplate.canEditStock,
      canManageSettings: false,
      allowedModules: [...baseTemplate.allowedModules],
      modulePermissions: { ...(baseTemplate.modulePermissions || {}) }
    })

    if (result.success && result.id) {
      setSelectedRoleId(result.id)
      setIsCreateModalOpen(false)
      setNewRoleName("")
      setNewRoleTitle("")
    }
  }

  return (
    <div className="flex-1 h-full overflow-hidden flex flex-col bg-white dark:bg-slate-950 font-sans">
      
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <div>
          <h1 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="h-4.5 w-4.5 text-blue-600" />
            Roles & Permissions
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure system & custom roles, module access, and sensitive financial visibility.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/70 dark:border-slate-700">
            <button
              onClick={() => setViewMode("editor")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "editor"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Role Editor</span>
            </button>
            <button
              onClick={() => setViewMode("matrix")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "matrix"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>Matrix View</span>
            </button>
          </div>

          {/* New Role Button */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>New Custom Role</span>
          </button>
        </div>
      </div>

      {/* 2. Main Workspace */}
      {viewMode === "editor" ? (
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Panel: Role List */}
          <div className="w-72 sm:w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-900/40 shrink-0">
            {/* Search */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-800">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search roles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-hidden focus:border-blue-500 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            {/* Roles List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredRoles.map((role) => {
                const isSelected = activeRole?.id === role.id
                const isCurrentActive = currentRole === role.id
                return (
                  <div
                    key={role.id}
                    onClick={() => setSelectedRoleId(role.id)}
                    className={`group p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "bg-white dark:bg-slate-900 border-blue-500 shadow-2xs"
                        : "bg-transparent border-transparent hover:bg-white/80 dark:hover:bg-slate-900/60 hover:border-slate-200 dark:hover:border-slate-800"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className={`text-xs truncate ${isSelected ? "font-bold text-blue-600 dark:text-blue-400" : "font-semibold text-slate-800 dark:text-slate-200"}`}>
                          {role.name}
                        </span>
                        {role.isSystem ? (
                          <span className="text-[9px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 shrink-0">
                            System
                          </span>
                        ) : (
                          <span className="text-[9px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0">
                            Custom
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 truncate block mt-0.5">
                        {role.title}
                      </span>
                    </div>

                    {isCurrentActive && (
                      <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0 ml-2" title="Active Persona" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right Panel: Role Permission Editor */}
          <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-slate-950">
            {activeRole ? (
              <div className="max-w-4xl space-y-6">
                
                {/* 1. Role Card Header */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                        {activeRole.name}
                      </h2>
                      {activeRole.isSystem ? (
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          Default System Role
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          Custom Role
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {activeRole.title} • {activeRole.description || "Configured team role"}
                    </p>
                  </div>

                  {/* Actions (Custom roles delete only) */}
                  {!activeRole.isSystem && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => deleteCustomRole(activeRole.id)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                        title="Delete custom role"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. Sensitive Security Guardrails */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Security Guardrails & Financial Privacy
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Guardrail 1: Cost & Margin */}
                    <div 
                      onClick={() => updateRole(activeRole.id, { canViewCostAndProfit: !activeRole.canViewCostAndProfit })}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 transition-all cursor-pointer flex items-start gap-2.5"
                    >
                      <input
                        type="checkbox"
                        checked={activeRole.canViewCostAndProfit}
                        onChange={() => {}}
                        className="mt-0.5 rounded text-blue-600 cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                          View Purchase Cost & Margin
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          If disabled, purchase rates, profit metrics & markups are masked across app.
                        </span>
                      </div>
                    </div>

                    {/* Guardrail 2: Stock Edit */}
                    <div 
                      onClick={() => updateRole(activeRole.id, { canEditStock: !activeRole.canEditStock })}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 transition-all cursor-pointer flex items-start gap-2.5"
                    >
                      <input
                        type="checkbox"
                        checked={activeRole.canEditStock}
                        onChange={() => {}}
                        className="mt-0.5 rounded text-blue-600 cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                          Direct Stock Adjustments
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          Allows manual count reconciliations, write-offs & physical stock adjustments.
                        </span>
                      </div>
                    </div>

                    {/* Guardrail 3: Settings */}
                    <div 
                      onClick={() => updateRole(activeRole.id, { canManageSettings: !activeRole.canManageSettings })}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 transition-all cursor-pointer flex items-start gap-2.5"
                    >
                      <input
                        type="checkbox"
                        checked={activeRole.canManageSettings}
                        onChange={() => {}}
                        className="mt-0.5 rounded text-blue-600 cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                          Manage System Settings
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          Allows editing GST configuration, invoice prefixes & print layouts.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Module Permissions Table */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Module Access & Permissions
                    </h3>
                    <div className="flex items-center gap-2 text-xs">
                      <button
                        onClick={() => handleBulkSetPermissions("full")}
                        className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        Grant All
                      </button>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <button
                        onClick={() => handleBulkSetPermissions("view")}
                        className="text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:underline cursor-pointer"
                      >
                        All View-Only
                      </button>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <button
                        onClick={() => handleBulkSetPermissions("none")}
                        className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:underline cursor-pointer"
                      >
                        Revoke All
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/80 dark:bg-slate-900">
                          <TableHead className="text-xs font-bold py-2.5">Functional Module</TableHead>
                          <TableHead className="text-xs font-bold py-2.5">Category</TableHead>
                          <TableHead className="text-xs font-bold py-2.5 text-center">Sidebar Access</TableHead>
                          <TableHead className="text-xs font-bold py-2.5 text-right">Access Level</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {APP_MODULES.map((mod) => {
                          const currentLevel = activeRole.modulePermissions?.[mod.id] || 
                            (activeRole.allowedModules.includes(mod.id) ? "full" : "none")

                          return (
                            <TableRow key={mod.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40">
                              <TableCell className="py-2.5">
                                <div>
                                  <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 block">
                                    {mod.name}
                                  </span>
                                  <span className="text-[10px] text-slate-400 block">
                                    {mod.description}
                                  </span>
                                </div>
                              </TableCell>

                              <TableCell className="py-2.5">
                                <span className="text-[11px] text-slate-500">
                                  {mod.category}
                                </span>
                              </TableCell>

                              <TableCell className="py-2.5 text-center">
                                <button
                                  onClick={() => handleSetModulePermission(
                                    mod.id, 
                                    currentLevel === "none" ? "full" : "none"
                                  )}
                                  className={`px-2 py-0.5 rounded text-[10px] border transition-all cursor-pointer ${
                                    currentLevel !== "none"
                                      ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 shadow-2xs font-medium"
                                      : "bg-slate-100 dark:bg-slate-800/60 text-slate-400 border-transparent font-normal"
                                  }`}
                                >
                                  {currentLevel !== "none" ? "Visible" : "Hidden"}
                                </button>
                              </TableCell>

                              <TableCell className="py-2.5 text-right">
                                <div className="inline-flex rounded-lg border border-slate-200/90 dark:border-slate-800 p-0.5 bg-slate-100 dark:bg-slate-900">
                                  <button
                                    onClick={() => handleSetModulePermission(mod.id, "full")}
                                    className={`px-2.5 py-1 text-[11px] rounded transition-all cursor-pointer ${
                                      currentLevel === "full"
                                        ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs border border-slate-200/90 dark:border-slate-700"
                                        : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                    }`}
                                  >
                                    Full
                                  </button>
                                  <button
                                    onClick={() => handleSetModulePermission(mod.id, "view")}
                                    className={`px-2.5 py-1 text-[11px] rounded transition-all cursor-pointer ${
                                      currentLevel === "view"
                                        ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs border border-slate-200/90 dark:border-slate-700"
                                        : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                    }`}
                                  >
                                    View
                                  </button>
                                  <button
                                    onClick={() => handleSetModulePermission(mod.id, "none")}
                                    className={`px-2.5 py-1 text-[11px] rounded transition-all cursor-pointer ${
                                      currentLevel === "none"
                                        ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs border border-slate-200/90 dark:border-slate-700"
                                        : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                    }`}
                                  >
                                    None
                                  </button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>

              </div>
            ) : null}
          </div>

        </div>
      ) : (
        /* Matrix View */
        <div className="flex-1 overflow-auto p-6 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="max-w-6xl mx-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-900">
                  <TableHead className="font-bold text-xs py-3">Functional Module</TableHead>
                  {roleList.map((r) => (
                    <TableHead key={r.id} className="text-center font-bold text-xs py-3">
                      <div className="flex flex-col items-center gap-1">
                        <span className="truncate max-w-[110px]" title={r.name}>{r.name}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {r.isSystem ? "System" : "Custom"}
                        </span>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
                {APP_MODULES.map((mod) => (
                  <TableRow key={mod.id}>
                    <TableCell className="font-medium text-xs text-slate-900 dark:text-white py-2.5">
                      {mod.name}
                    </TableCell>

                    {roleList.map((r) => {
                      const level = r.modulePermissions?.[mod.id] || (r.allowedModules.includes(mod.id) ? "full" : "none")
                      return (
                        <TableCell key={r.id} className="text-center py-2.5">
                          {level === "full" ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              Full
                            </span>
                          ) : level === "view" ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              View
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600 text-xs font-bold">—</span>
                          )}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* 3. Create Custom Role Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 border border-blue-100 dark:border-blue-900/50">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Create New Custom Role
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Role Name <span className="text-blue-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Counter Cashier, Floor Manager"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Designation / Subtitle
                </label>
                <input
                  type="text"
                  placeholder="e.g. Front Desk Billing Associate"
                  value={newRoleTitle}
                  onChange={(e) => setNewRoleTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Clone Permissions From Base Template
                </label>
                <select
                  value={newRoleTemplate}
                  onChange={(e) => setNewRoleTemplate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 cursor-pointer"
                >
                  {roleList.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.title})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs cursor-pointer"
                >
                  Create Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

