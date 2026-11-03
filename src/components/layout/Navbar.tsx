"use client"

import React, { useState } from "react"
import { useApp } from "@/context/AppContext"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import {
  Menu,
  Plus,
  Search,
  Bell,
  Settings as SettingsIcon,
  HelpCircle,
  Warehouse,
  ChevronDown,
  LogOut,
  UserCircle,
  EyeOff,
  Boxes,
  Building2,
  ShieldCheck,
  Share2,
  AlertTriangle,
  Clock,
  CheckCircle2
} from "lucide-react"
import { UserRole } from "@/types/inventory"

interface NavbarProps {
  onToggleSidebar?: () => void
  onNavigateSettings?: () => void
}

export function Navbar({ onToggleSidebar, onNavigateSettings }: NavbarProps) {
  const {
    business,
    godowns,
    activeGodownId,
    setActiveGodownId,
    currentRole,
    setCurrentRole,
    roleConfig,
    roles,
    canViewCostAndProfit,
    setIsGlobalSearchOpen,
    setIsQuickCreateOpen,
    items,
    teamUsers,
    partyReminders,
    adminAlerts,
    addReminderLog,
    logout
  } = useApp()

  const activeUser = teamUsers?.find(u => u.roleId === currentRole) || teamUsers?.[0]

  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false)
  const [godownDropdownOpen, setGodownDropdownOpen] = useState(false)
  const [alertsOpen, setAlertsOpen] = useState(false)
  const [isAlertsDismissed, setIsAlertsDismissed] = useState(false)
  const [notifTab, setNotifTab] = useState<"party" | "admin">("party")
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)

  const totalNotifications = (partyReminders?.length || 0) + (adminAlerts?.length || 0)
  const notificationCount = isAlertsDismissed ? 0 : totalNotifications
  const activeGodown = godowns.find(g => g.id === activeGodownId) || godowns[0]

  return (
    <header className="sticky top-0 z-40 w-full h-11 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none print:hidden no-print">
      <div className="flex h-full items-center justify-between px-3 sm:px-4">

        {/* Left: Hamburger + Brand Logo + "+ New" Button */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-1 rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle Menu"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/ab-logo-full.png"
              alt="Automate Business"
              className="h-7 sm:h-8 w-auto object-contain select-none"
            />
          </div>
        </div>

        {/* Center: Clean Search Bar */}
        <div className="flex-1 max-w-sm lg:max-w-md mx-3">
          <button
            onClick={() => setIsGlobalSearchOpen(true)}
            className="w-full h-7 flex items-center justify-between px-2.5 text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-md hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="truncate">Search (Ctrl + /)</span>
            </div>
          </button>
        </div>

        {/* Right Utility Icons */}
        <div className="flex items-center gap-1 sm:gap-2">

          {/* Godown / Branch Dropdown */}
          <div className="relative hidden md:block">
            <button
              onClick={() => {
                setGodownDropdownOpen(!godownDropdownOpen)
                setAlertsOpen(false)
                setRoleDropdownOpen(false)
              }}
              className="flex items-center gap-1.5 h-7 px-2 rounded text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Warehouse className="h-3.5 w-3.5 text-slate-400" />
              <span className="truncate max-w-[130px]">{activeGodown.name.split(" ")[0]}</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {godownDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setGodownDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-1 w-56 rounded-lg shadow-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-1 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Active Godown / Branch
                  </div>
                  {godowns.map(g => (
                    <button
                      key={g.id}
                      onClick={() => {
                        setActiveGodownId(g.id)
                        setGodownDropdownOpen(false)
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 ${g.id === activeGodownId ? "font-semibold text-blue-600 bg-blue-50/50 dark:bg-blue-950/30" : "text-slate-700 dark:text-slate-300"
                        }`}
                    >
                      <span className="truncate">{g.name}</span>
                      {g.id === activeGodownId && <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Alerts Bell Notification Popover */}
          <div className="relative">
            <button
              onClick={() => {
                setAlertsOpen(!alertsOpen)
                setGodownDropdownOpen(false)
                setRoleDropdownOpen(false)
              }}
              className={`relative p-1.5 rounded transition-colors ${alertsOpen
                  ? "text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              {notificationCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-0.5 rounded-full bg-rose-600 text-[9px] font-bold text-white flex items-center justify-center leading-none shadow-xs border border-white dark:border-slate-900">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              )}
            </button>

            {alertsOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setAlertsOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-96 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-50 overflow-hidden animate-in fade-in zoom-in-95">
                  {/* Popover Header */}
                  <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Notifications & Alerts</span>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                        {notificationCount > 0 ? `${notificationCount} active` : "All caught up"}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setIsAlertsDismissed(true)
                        setAlertsOpen(false)
                      }}
                      className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>

                  {/* Tab Selector */}
                  <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-xs">
                    <button
                      onClick={() => setNotifTab("party")}
                      className={`flex-1 py-2 text-center font-medium border-b-2 transition-colors flex items-center justify-center gap-1.5 ${notifTab === "party"
                          ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
                          : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                        }`}
                    >
                      <span>Party Reminders</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                        {partyReminders?.length || 0}
                      </span>
                    </button>
                    <button
                      onClick={() => setNotifTab("admin")}
                      className={`flex-1 py-2 text-center font-medium border-b-2 transition-colors flex items-center justify-center gap-1.5 ${notifTab === "admin"
                          ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
                          : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                        }`}
                    >
                      <span>Admin Alerts</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                        {adminAlerts?.length || 0}
                      </span>
                    </button>
                  </div>

                  {/* Tab Content */}
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
                    {notifTab === "party" && (
                      <>
                        {(!partyReminders || partyReminders.length === 0) ? (
                          <div className="py-8 text-center text-xs text-slate-400">
                            No pending payment reminders. All parties up to date!
                          </div>
                        ) : (
                          partyReminders.map(rem => (
                            <div key={rem.id} className="p-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors flex gap-2.5 items-start text-xs">
                              <span className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${rem.daysDiff > 0
                                  ? "bg-rose-500"
                                  : rem.daysDiff === 0
                                    ? "bg-amber-500"
                                    : "bg-blue-500"
                                }`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="font-semibold text-slate-900 dark:text-white truncate">
                                    {rem.partyName}
                                  </p>
                                  <span className="font-bold text-slate-900 dark:text-slate-100 shrink-0 ml-1">
                                    ₹{rem.amountDue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                  <span>{rem.invoiceNo}</span>
                                  <span>•</span>
                                  <span className={rem.daysDiff > 0 ? "text-rose-600 dark:text-rose-400 font-medium" : ""}>
                                    {rem.daysDiff > 0
                                      ? `Overdue by ${rem.daysDiff}d`
                                      : rem.daysDiff === 0
                                        ? "Due Today"
                                        : `Due in ${Math.abs(rem.daysDiff)}d`}
                                  </span>
                                </div>
                                <div className="mt-2 flex items-center justify-end">
                                  <button
                                    onClick={() => {
                                      window.open(rem.whatsAppUrl, "_blank")
                                      addReminderLog({
                                        invoiceId: rem.invoiceId,
                                        invoiceNo: rem.invoiceNo,
                                        partyId: rem.partyId,
                                        partyName: rem.partyName,
                                        type: rem.type,
                                        channel: "whatsapp",
                                        status: "delivered",
                                        messagePreview: rem.generatedMessage,
                                        recipientPhoneOrEmail: rem.partyPhone || "Customer Contact",
                                        amountDue: rem.amountDue,
                                        triggeredBy: "manual"
                                      })
                                    }}
                                    className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[11px] font-medium flex items-center gap-1 transition-colors"
                                  >
                                    <Share2 className="h-3 w-3" />
                                    <span>Send WhatsApp</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </>
                    )}

                    {notifTab === "admin" && (
                      <>
                        {(!adminAlerts || adminAlerts.length === 0) ? (
                          <div className="py-8 text-center text-xs text-slate-400">
                            No operational alerts. Everything is smooth!
                          </div>
                        ) : (
                          adminAlerts.map(alert => (
                            <div key={alert.id} className="p-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors flex gap-2.5 items-start text-xs">
                              <span className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${alert.urgency === "danger"
                                  ? "bg-rose-500"
                                  : alert.urgency === "warning"
                                    ? "bg-amber-500"
                                    : "bg-blue-500"
                                }`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                                    {alert.title}
                                  </p>
                                  <span className="text-[10px] text-slate-400 uppercase font-mono">
                                    {alert.type}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                  {alert.description}
                                </p>
                                <span className="text-[10px] text-slate-400 mt-1 block">
                                  {new Date(alert.timestamp).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Settings Icon */}
          <button
            onClick={onNavigateSettings}
            className="p-1.5 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Settings"
          >
            <SettingsIcon className="h-4 w-4" />
          </button>

          <div className="h-4 w-px bg-slate-200 dark:border-slate-800 mx-1" />

          {/* User Profile & Persona Switcher */}
          <div className="relative">
            <button
              onClick={() => {
                setRoleDropdownOpen(!roleDropdownOpen)
                setAlertsOpen(false)
                setGodownDropdownOpen(false)
              }}
              className="flex items-center gap-1.5 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="User Account & Persona Switcher"
            >
              {activeUser?.avatarUrl ? (
                <img
                  src={activeUser.avatarUrl}
                  alt={activeUser.name}
                  className="h-6 w-6 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-xs"
                />
              ) : (
                <div className={`h-6 w-6 rounded-full ${roleConfig.avatarColor} text-white flex items-center justify-center text-xs font-semibold shadow-xs`}>
                  {(activeUser?.name || roleConfig.name).charAt(0)}
                </div>
              )}
            </button>

            {roleDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setRoleDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-60 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                      <span className="truncate">{activeUser?.name || roleConfig.name}</span>
                      <Badge variant="outline" className="text-[10px] font-semibold tracking-wider text-slate-600 dark:text-slate-300">
                        {currentRole.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {activeUser?.designation || roleConfig.title}
                    </div>
                    {activeUser?.phone && (
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        +91 {activeUser.phone}
                      </div>
                    )}
                    {!canViewCostAndProfit && (
                      <div className="mt-1 text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
                        <EyeOff className="h-3 w-3" /> Costs & profits hidden
                      </div>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    {onNavigateSettings && (
                      <button
                        onClick={() => {
                          onNavigateSettings()
                          setRoleDropdownOpen(false)
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <UserCircle className="h-3.5 w-3.5 text-slate-500" />
                        <span>User Info & Profile</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setRoleDropdownOpen(false)
                        setIsLogoutModalOpen(true)
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer group"
                    >
                      <LogOut className="h-3.5 w-3.5 text-slate-500 group-hover:text-red-500" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>

      </div>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        open={isLogoutModalOpen}
        onOpenChange={setIsLogoutModalOpen}
        title="Log Out"
        description="Are you sure you want to log out of Automate Business? Any unsaved edits will be discarded."
        confirmText="Log Out"
        cancelText="Cancel"
        variant="danger"
        icon={LogOut}
        onConfirm={() => {
          logout()
        }}
      />
    </header>
  )
}
