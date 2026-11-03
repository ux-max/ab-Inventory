"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
import { createPortal } from "react-dom"
import { useApp } from "@/context/AppContext"
import { cn } from "@/lib/utils"
import {
  Home,
  Package,
  Boxes,
  ShoppingCart,
  ShoppingBag,
  BarChart2,
  FileCheck,
  Settings,
  ChevronDown,
  ChevronRight,
  Factory,
  Landmark,
  Truck,
  QrCode
} from "lucide-react"

export interface NavSelection {
  module: string
  subModule?: string
}

interface FlyoutSubItem {
  label: string
  module: string
  subModule?: string
  isActive: boolean
}

interface FlyoutData {
  id: string
  title: string
  icon: React.ReactNode
  rect: DOMRect
  hasSubItems: boolean
  items: FlyoutSubItem[]
}

interface SidebarProps {
  currentNav: NavSelection
  onSelectNav: (selection: NavSelection) => void
  isCollapsed?: boolean
}

export function Sidebar({ currentNav, onSelectNav, isCollapsed = false }: SidebarProps) {
  const { isModuleAllowed, business, currentRole } = useApp()

  // Single accordion open section: only one group ("items" | "inventory" | "sales" | "purchases") can be open at a time
  const [openSection, setOpenSection] = useState<string | null>(() => {
    if (currentNav.module === "sales" || (currentNav.module === "parties" && currentNav.subModule === "customers")) return "sales"
    if (currentNav.module === "inventory") return "inventory"
    if (currentNav.module === "purchases" || (currentNav.module === "parties" && currentNav.subModule === "suppliers")) return "purchases"
    return "items"
  })

  const lastNavModuleRef = useRef(currentNav.module)

  // Synchronize when active module changes externally
  useEffect(() => {
    if (lastNavModuleRef.current !== currentNav.module) {
      lastNavModuleRef.current = currentNav.module
      if (currentNav.module === "sales" || (currentNav.module === "parties" && currentNav.subModule === "customers")) {
        setOpenSection("sales")
      } else if (currentNav.module === "inventory") {
        setOpenSection("inventory")
      } else if (currentNav.module === "purchases" || (currentNav.module === "parties" && currentNav.subModule === "suppliers")) {
        setOpenSection("purchases")
      } else if (currentNav.module === "items" || currentNav.module === "manufacturing") {
        setOpenSection("items")
      }
    }
  }, [currentNav.module, currentNav.subModule])

  // When opening any section, all other sections close automatically
  const toggleSection = (key: string) => {
    setOpenSection(prev => (prev === key ? null : key))
  }

  const openSections = {
    items: openSection === "items",
    inventory: openSection === "inventory",
    sales: openSection === "sales",
    purchases: openSection === "purchases"
  }

  // Floating Flyout Sub-menu State for Collapsed Mode
  const [activeFlyout, setActiveFlyout] = useState<FlyoutData | null>(null)
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
    }
  }, [])

  // Auto-close flyout on outside scroll, window resize, or uncollapse
  useEffect(() => {
    const handleScrollOrResize = () => {
      setActiveFlyout(null)
    }
    window.addEventListener("scroll", handleScrollOrResize, true)
    window.addEventListener("resize", handleScrollOrResize)
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true)
      window.removeEventListener("resize", handleScrollOrResize)
    }
  }, [])

  useEffect(() => {
    if (!isCollapsed) {
      setActiveFlyout(null)
    }
  }, [isCollapsed])

  // Sub-options definitions for each group
  const itemsSubOptions = useMemo<FlyoutSubItem[]>(() => [
    {
      label: "Items Catalog",
      module: "items",
      subModule: "all",
      isActive: currentNav.module === "items" && (currentNav.subModule === "all" || !currentNav.subModule)
    },
    ...(business.enableManufacturing ? [
      {
        label: "Manufacturing / BOM",
        module: "manufacturing",
        subModule: "composite",
        isActive: currentNav.module === "manufacturing" && (currentNav.subModule === "composite" || !currentNav.subModule)
      },
      {
        label: "External Job Work Challans",
        module: "manufacturing",
        subModule: "jobwork",
        isActive: currentNav.module === "manufacturing" && currentNav.subModule === "jobwork"
      }
    ] : [])
  ], [currentNav.module, currentNav.subModule, business.enableManufacturing])

  const inventorySubOptions = useMemo<FlyoutSubItem[]>(() => [
    {
      label: "Stock Summary",
      module: "inventory",
      subModule: "summary",
      isActive: currentNav.module === "inventory" && (currentNav.subModule === "summary" || !currentNav.subModule)
    },
    {
      label: "Transfer Orders",
      module: "inventory",
      subModule: "transfers",
      isActive: currentNav.module === "inventory" && currentNav.subModule === "transfers"
    },
    {
      label: "Inventory Adjustments",
      module: "inventory",
      subModule: "adjustments",
      isActive: currentNav.module === "inventory" && currentNav.subModule === "adjustments"
    },
    {
      label: "Stock Audits",
      module: "inventory",
      subModule: "audits",
      isActive: currentNav.module === "inventory" && currentNav.subModule === "audits"
    }
  ], [currentNav.module, currentNav.subModule])

  const salesSubOptions = useMemo<FlyoutSubItem[]>(() => [
    {
      label: "Customers",
      module: "parties",
      subModule: "customers",
      isActive: currentNav.module === "parties" && currentNav.subModule === "customers"
    },
    {
      label: "Quotations / Estimates",
      module: "sales",
      subModule: "quotation",
      isActive: currentNav.module === "sales" && currentNav.subModule === "quotation"
    },
    {
      label: "Proforma Invoices",
      module: "sales",
      subModule: "proforma",
      isActive: currentNav.module === "sales" && currentNav.subModule === "proforma"
    },
    {
      label: "Sales Orders",
      module: "sales",
      subModule: "orders",
      isActive: currentNav.module === "sales" && currentNav.subModule === "orders"
    },
    {
      label: "Delivery Challans",
      module: "sales",
      subModule: "challan",
      isActive: currentNav.module === "sales" && currentNav.subModule === "challan"
    },
    {
      label: "Invoices",
      module: "sales",
      subModule: "invoice",
      isActive: currentNav.module === "sales" && (currentNav.subModule === "invoice" || !currentNav.subModule)
    },
    {
      label: "Payment In",
      module: "sales",
      subModule: "payments_received",
      isActive: currentNav.module === "sales" && currentNav.subModule === "payments_received"
    },
    {
      label: "Sales Returns",
      module: "sales",
      subModule: "sales_returns",
      isActive: currentNav.module === "sales" && (currentNav.subModule === "sales_returns" || currentNav.subModule === "return")
    },
    {
      label: "Credit Notes",
      module: "sales",
      subModule: "credit_notes",
      isActive: currentNav.module === "sales" && currentNav.subModule === "credit_notes"
    }
  ], [currentNav.module, currentNav.subModule])

  const purchasesSubOptions = useMemo<FlyoutSubItem[]>(() => [
    {
      label: "Vendors",
      module: "parties",
      subModule: "suppliers",
      isActive: currentNav.module === "parties" && currentNav.subModule === "suppliers"
    },
    {
      label: "Bills",
      module: "purchases",
      subModule: "bills",
      isActive: currentNav.module === "purchases" && (currentNav.subModule === "bills" || !currentNav.subModule)
    },
    {
      label: "Payment Out",
      module: "purchases",
      subModule: "payments_made",
      isActive: currentNav.module === "purchases" && currentNav.subModule === "payments_made"
    },
    {
      label: "Purchase Returns",
      module: "purchases",
      subModule: "purchase_returns",
      isActive: currentNav.module === "purchases" && currentNav.subModule === "purchase_returns"
    },
    {
      label: "Debit Notes",
      module: "purchases",
      subModule: "debit_notes",
      isActive: currentNav.module === "purchases" && currentNav.subModule === "debit_notes"
    },
    {
      label: "Reorder Suggestions",
      module: "purchases",
      subModule: "reorder",
      isActive: currentNav.module === "purchases" && currentNav.subModule === "reorder"
    }
  ], [currentNav.module, currentNav.subModule])

  // Mouse hover handlers for collapsed mode
  const handleItemMouseEnter = (e: React.MouseEvent<HTMLElement>, id: string, title: string, icon: React.ReactNode, subItems?: FlyoutSubItem[]) => {
    if (!isCollapsed) return
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
    const rect = e.currentTarget.getBoundingClientRect()
    setActiveFlyout({
      id,
      title,
      icon,
      rect,
      hasSubItems: Boolean(subItems && subItems.length > 0),
      items: subItems || []
    })
  }

  const handleItemMouseLeave = () => {
    if (!isCollapsed) return
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
    closeTimeoutRef.current = setTimeout(() => {
      setActiveFlyout(null)
    }, 200)
  }

  const handleFlyoutMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
  }

  const handleFlyoutMouseLeave = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
    closeTimeoutRef.current = setTimeout(() => {
      setActiveFlyout(null)
    }, 200)
  }

  return (
    <aside className={`flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-[#fbfcfd] dark:bg-slate-900 flex flex-col justify-between select-none transition-all duration-200 print:hidden no-print ${isCollapsed ? "w-14 items-center" : "w-60"
      }`}>
      <div className={`py-2 overflow-y-auto w-full ${isCollapsed ? "px-1.5 flex flex-col items-center space-y-1" : ""}`}>

        {/* 1. Home / Dashboard */}
        {isModuleAllowed("dashboard") && (
          <div
            className={isCollapsed ? "w-full flex justify-center mb-1" : "px-2 mb-1"}
            onMouseEnter={(e) => handleItemMouseEnter(e, "dashboard", "Home", <Home className="h-4 w-4" />)}
            onMouseLeave={handleItemMouseLeave}
          >
            <button
              onClick={() => {
                setOpenSection(null)
                onSelectNav({ module: "dashboard" })
                setActiveFlyout(null)
              }}
              title={isCollapsed ? undefined : "Home"}
              className={`flex items-center transition-colors ${isCollapsed
                  ? `w-10 h-10 justify-center rounded-lg ${currentNav.module === "dashboard"
                    ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  }`
                  : `w-full gap-2.5 px-3 py-1.5 text-[13px] rounded-md ${currentNav.module === "dashboard"
                    ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold"
                    : "text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`
                }`}
            >
              <Home className={isCollapsed ? "h-5 w-5 shrink-0" : "h-4 w-4 shrink-0"} />
              {!isCollapsed && <span>Home</span>}
            </button>
          </div>
        )}

        {/* 2. Items Group */}
        {isModuleAllowed("items") && (
          <div
            className={isCollapsed ? "w-full flex justify-center mb-1" : "px-2 mb-1"}
            onMouseEnter={(e) => handleItemMouseEnter(e, "items", "Items", <Package className="h-4 w-4" />, itemsSubOptions)}
            onMouseLeave={handleItemMouseLeave}
          >
            <button
              onClick={() => {
                if (isCollapsed) {
                  onSelectNav({ module: "items", subModule: "all" })
                  setActiveFlyout(null)
                } else {
                  toggleSection("items")
                  if (!openSections.items) {
                    onSelectNav({ module: "items", subModule: "all" })
                  }
                }
              }}
              title={isCollapsed ? undefined : "Items"}
              className={`flex items-center transition-colors ${isCollapsed
                  ? `w-10 h-10 justify-center rounded-lg ${currentNav.module === "items" || currentNav.module === "manufacturing"
                    ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  }`
                  : `w-full justify-between px-3 py-1.5 text-[13px] rounded-md ${openSections.items && (currentNav.module === "items" || currentNav.module === "manufacturing")
                    ? "text-blue-600 dark:text-blue-400 font-semibold"
                    : "text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`
                }`}
            >
              <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-2.5"}`}>
                <Package className={isCollapsed ? "h-5 w-5 shrink-0" : "h-4 w-4 shrink-0"} />
                {!isCollapsed && <span>Items</span>}
              </div>
              {!isCollapsed && (
                openSections.items ? (
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                )
              )}
            </button>

            {openSections.items && !isCollapsed && (
              <div className="pl-7 pr-1 py-0.5 space-y-0.5">
                <button
                  onClick={() => onSelectNav({ module: "items", subModule: "all" })}
                  className={`w-full text-left px-2.5 py-1 text-[13px] rounded-md transition-colors ${currentNav.module === "items" && currentNav.subModule === "all"
                      ? "text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/60 dark:bg-blue-950/40"
                      : "text-slate-600 dark:text-slate-400 font-normal hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/60"
                    }`}
                >
                  Items Catalog
                </button>
                {business.enableManufacturing && (
                  <>
                    <button
                      onClick={() => onSelectNav({ module: "manufacturing", subModule: "composite" })}
                      className={`w-full text-left px-2.5 py-1 text-[13px] rounded-md transition-colors ${currentNav.module === "manufacturing" && (currentNav.subModule === "composite" || !currentNav.subModule)
                          ? "text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/60 dark:bg-blue-950/40"
                          : "text-slate-600 dark:text-slate-400 font-normal hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/60"
                        }`}
                    >
                      Manufacturing / BOM
                    </button>
                    <button
                      onClick={() => onSelectNav({ module: "manufacturing", subModule: "jobwork" })}
                      className={`w-full text-left px-2.5 py-1 text-[13px] rounded-md transition-colors ${currentNav.module === "manufacturing" && currentNav.subModule === "jobwork"
                          ? "text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/60 dark:bg-blue-950/40"
                          : "text-slate-600 dark:text-slate-400 font-normal hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/60"
                        }`}
                    >
                      External Job Work Challans
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* 3. Inventory Group */}
        {isModuleAllowed("inventory") && (
          <div
            className={isCollapsed ? "w-full flex justify-center mb-1" : "px-2 mb-1"}
            onMouseEnter={(e) => handleItemMouseEnter(e, "inventory", "Inventory", <Boxes className="h-4 w-4" />, inventorySubOptions)}
            onMouseLeave={handleItemMouseLeave}
          >
            <button
              onClick={() => {
                if (isCollapsed) {
                  onSelectNav({ module: "inventory", subModule: "summary" })
                  setActiveFlyout(null)
                } else {
                  toggleSection("inventory")
                  if (!openSections.inventory) {
                    onSelectNav({ module: "inventory", subModule: "summary" })
                  }
                }
              }}
              title={isCollapsed ? undefined : "Inventory"}
              className={`flex items-center transition-colors ${isCollapsed
                  ? `w-10 h-10 justify-center rounded-lg ${currentNav.module === "inventory"
                    ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  }`
                  : `w-full justify-between px-3 py-1.5 text-[13px] rounded-md ${openSections.inventory && currentNav.module === "inventory"
                    ? "text-blue-600 dark:text-blue-400 font-semibold"
                    : "text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`
                }`}
            >
              <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-2.5"}`}>
                <Boxes className={isCollapsed ? "h-5 w-5 shrink-0" : "h-4 w-4 shrink-0"} />
                {!isCollapsed && <span>Inventory</span>}
              </div>
              {!isCollapsed && (
                openSections.inventory ? (
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                )
              )}
            </button>

            {openSections.inventory && !isCollapsed && (
              <div className="pl-7 pr-1 py-0.5 space-y-0.5">
                <button
                  onClick={() => onSelectNav({ module: "inventory", subModule: "summary" })}
                  className={`w-full text-left px-2.5 py-1 text-[13px] rounded-md transition-colors ${currentNav.module === "inventory" && currentNav.subModule === "summary"
                      ? "text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/60 dark:bg-blue-950/40"
                      : "text-slate-600 dark:text-slate-400 font-normal hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/60"
                    }`}
                >
                  Stock Summary
                </button>
                <button
                  onClick={() => onSelectNav({ module: "inventory", subModule: "transfers" })}
                  className={`w-full text-left px-2.5 py-1 text-[13px] rounded-md transition-colors ${currentNav.module === "inventory" && currentNav.subModule === "transfers"
                      ? "text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/60 dark:bg-blue-950/40"
                      : "text-slate-600 dark:text-slate-400 font-normal hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/60"
                    }`}
                >
                  Transfer Orders
                </button>
                <button
                  onClick={() => onSelectNav({ module: "inventory", subModule: "adjustments" })}
                  className={`w-full text-left px-2.5 py-1 text-[13px] rounded-md transition-colors ${currentNav.module === "inventory" && currentNav.subModule === "adjustments"
                      ? "text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/60 dark:bg-blue-950/40"
                      : "text-slate-600 dark:text-slate-400 font-normal hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/60"
                    }`}
                >
                  Inventory Adjustments
                </button>
                <button
                  onClick={() => onSelectNav({ module: "inventory", subModule: "audits" })}
                  className={`w-full text-left px-2.5 py-1 text-[13px] rounded-md transition-colors ${currentNav.module === "inventory" && currentNav.subModule === "audits"
                      ? "text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/60 dark:bg-blue-950/40"
                      : "text-slate-600 dark:text-slate-400 font-normal hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/60"
                    }`}
                >
                  Stock Audits
                </button>
              </div>
            )}
          </div>
        )}

        {/* 4. Sales Group (Zoho Style Nested Accordion) */}
        {isModuleAllowed("sales") && (
          <div
            className={isCollapsed ? "w-full flex justify-center mb-1" : "px-2 mb-1"}
            onMouseEnter={(e) => handleItemMouseEnter(e, "sales", "Sales", <ShoppingCart className="h-4 w-4" />, salesSubOptions)}
            onMouseLeave={handleItemMouseLeave}
          >
            <button
              onClick={() => {
                if (isCollapsed) {
                  onSelectNav({ module: "sales", subModule: "invoice" })
                  setActiveFlyout(null)
                } else {
                  toggleSection("sales")
                  if (!openSections.sales) {
                    onSelectNav({ module: "sales", subModule: "invoice" })
                  }
                }
              }}
              title={isCollapsed ? undefined : "Sales"}
              className={`flex items-center transition-colors ${isCollapsed
                  ? `w-10 h-10 justify-center rounded-lg ${currentNav.module === "sales" || (currentNav.module === "parties" && currentNav.subModule === "customers")
                    ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  }`
                  : `w-full justify-between px-3 py-1.5 text-[13px] rounded-md ${openSections.sales && (currentNav.module === "sales" || (currentNav.module === "parties" && currentNav.subModule === "customers"))
                    ? "text-blue-600 dark:text-blue-400 font-semibold"
                    : "text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`
                }`}
            >
              <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-2.5"}`}>
                <ShoppingCart className={isCollapsed ? "h-5 w-5 shrink-0" : "h-4 w-4 shrink-0"} />
                {!isCollapsed && <span>Sales</span>}
              </div>
              {!isCollapsed && (
                openSections.sales ? (
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                )
              )}
            </button>

            {openSections.sales && !isCollapsed && (
              <div className="pl-7 pr-1 py-0.5 space-y-0.5">
                <button
                  onClick={() => onSelectNav({ module: "parties", subModule: "customers" })}
                  className={`w-full text-left px-2.5 py-1 text-[13px] rounded-md transition-colors ${currentNav.module === "parties" && currentNav.subModule === "customers"
                      ? "text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/60 dark:bg-blue-950/40"
                      : "text-slate-600 dark:text-slate-400 font-normal hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/60"
                    }`}
                >
                  Customers
                </button>
                <button
                  onClick={() => onSelectNav({ module: "sales", subModule: "quotation" })}
                  className={`w-full text-left px-2.5 py-1 text-[13px] rounded-md transition-colors ${currentNav.module === "sales" && currentNav.subModule === "quotation"
                      ? "text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/60 dark:bg-blue-950/40"
                      : "text-slate-600 dark:text-slate-400 font-normal hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/60"
                    }`}
                >
                  Quotations / Estimates
                </button>
                <button
                  onClick={() => onSelectNav({ module: "sales", subModule: "proforma" })}
                  className={`w-full text-left px-2.5 py-1 text-[13px] rounded-md transition-colors ${currentNav.module === "sales" && currentNav.subModule === "proforma"
                      ? "text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/60 dark:bg-blue-950/40"
                      : "text-slate-600 dark:text-slate-400 font-normal hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/60"
                    }`}
                >
                  Proforma Invoices
                </button>
                <button
                  onClick={() => onSelectNav({ module: "sales", subModule: "orders" })}
                  className={`w-full text-left px-2.5 py-1 text-[13px] rounded-md transition-colors ${currentNav.module === "sales" && currentNav.subModule === "orders"
                      ? "text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/60 dark:bg-blue-950/40"
                      : "text-slate-600 dark:text-slate-400 font-normal hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/60"
                    }`}
                >
                  Sales Orders
                </button>
                <button
                  onClick={() => onSelectNav({ module: "sales", subModule: "challan" })}
                  className={`w-full text-left px-2.5 py-1 text-[13px] rounded-md transition-colors ${currentNav.module === "sales" && currentNav.subModule === "challan"
                      ? "text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/60 dark:bg-blue-950/40"
                      : "text-slate-600 dark:text-slate-400 font-normal hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/60"
                    }`}
                >
                  Delivery Challans
                </button>
                <button
                  onClick={() => onSelectNav({ module: "sales", subModule: "invoice" })}
                  className={`w-full text-left px-2.5 py-1 text-[13px] rounded-md transition-colors ${currentNav.module === "sales" && currentNav.subModule === "invoice"
                      ? "text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/60 dark:bg-blue-950/40"
                      : "text-slate-600 dark:text-slate-400 font-normal hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/60"
                    }`}
                >
                  Invoices
                </button>
                <button
                  onClick={() => onSelectNav({ module: "sales", subModule: "payments_received" })}
                  className={`w-full text-left px-2.5 py-1 text-[13px] rounded-md transition-colors ${currentNav.module === "sales" && currentNav.subModule === "payments_received"
                      ? "text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/60 dark:bg-blue-950/40"
                      : "text-slate-600 dark:text-slate-400 font-normal hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/60"
                    }`}
                >
                  Payment In
                </button>
                <button
                  onClick={() => onSelectNav({ module: "sales", subModule: "sales_returns" })}
                  className={`w-full text-left px-2.5 py-1 text-[13px] rounded-md transition-colors ${currentNav.module === "sales" && (currentNav.subModule === "sales_returns" || currentNav.subModule === "return")
                      ? "text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/60 dark:bg-blue-950/40"
                      : "text-slate-600 dark:text-slate-400 font-normal hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/60"
                    }`}
                >
                  Sales Returns
                </button>
                <button
                  onClick={() => onSelectNav({ module: "sales", subModule: "credit_notes" })}
                  className={`w-full text-left px-2.5 py-1 text-[13px] rounded-md transition-colors ${currentNav.module === "sales" && currentNav.subModule === "credit_notes"
                      ? "text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/60 dark:bg-blue-950/40"
                      : "text-slate-600 dark:text-slate-400 font-normal hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/60"
                    }`}
                >
                  Credit Notes
                </button>
              </div>
            )}
          </div>
        )}

        {/* 5. Purchases Group */}
        {isModuleAllowed("purchases") && (
          <div
            className={isCollapsed ? "w-full flex justify-center mb-1" : "px-2 mb-1"}
            onMouseEnter={(e) => handleItemMouseEnter(e, "purchases", "Purchases", <ShoppingBag className="h-4 w-4" />, purchasesSubOptions)}
            onMouseLeave={handleItemMouseLeave}
          >
            <button
              onClick={() => {
                if (isCollapsed) {
                  onSelectNav({ module: "purchases", subModule: "bills" })
                  setActiveFlyout(null)
                } else {
                  toggleSection("purchases")
                  if (!openSections.purchases) {
                    onSelectNav({ module: "purchases", subModule: "bills" })
                  }
                }
              }}
              title={isCollapsed ? undefined : "Purchases"}
              className={`flex items-center transition-colors ${isCollapsed
                  ? `w-10 h-10 justify-center rounded-lg ${currentNav.module === "purchases" || (currentNav.module === "parties" && currentNav.subModule === "suppliers")
                    ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  }`
                  : `w-full justify-between px-3 py-1.5 text-[13px] rounded-md ${openSections.purchases && (currentNav.module === "purchases" || (currentNav.module === "parties" && currentNav.subModule === "suppliers"))
                    ? "text-blue-600 dark:text-blue-400 font-semibold"
                    : "text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`
                }`}
            >
              <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-2.5"}`}>
                <ShoppingBag className={isCollapsed ? "h-5 w-5 shrink-0" : "h-4 w-4 shrink-0"} />
                {!isCollapsed && <span>Purchases</span>}
              </div>
              {!isCollapsed && (
                openSections.purchases ? (
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                )
              )}
            </button>

            {openSections.purchases && !isCollapsed && (
              <div className="pl-7 pr-1 py-0.5 space-y-0.5">
                <button
                  onClick={() => onSelectNav({ module: "parties", subModule: "suppliers" })}
                  className={`w-full text-left px-2.5 py-1 text-[13px] rounded-md transition-colors ${currentNav.module === "parties" && currentNav.subModule === "suppliers"
                      ? "text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/60 dark:bg-blue-950/40"
                      : "text-slate-600 dark:text-slate-400 font-normal hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/60"
                    }`}
                >
                  Vendors
                </button>
                <button
                  onClick={() => onSelectNav({ module: "purchases", subModule: "bills" })}
                  className={`w-full text-left px-2.5 py-1 text-[13px] rounded-md transition-colors ${currentNav.module === "purchases" && currentNav.subModule === "bills"
                      ? "text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/60 dark:bg-blue-950/40"
                      : "text-slate-600 dark:text-slate-400 font-normal hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/60"
                    }`}
                >
                  Bills
                </button>
                <button
                  onClick={() => onSelectNav({ module: "purchases", subModule: "payments_made" })}
                  className={`w-full text-left px-2.5 py-1 text-[13px] rounded-md transition-colors ${currentNav.module === "purchases" && currentNav.subModule === "payments_made"
                      ? "text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/60 dark:bg-blue-950/40"
                      : "text-slate-600 dark:text-slate-400 font-normal hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/60"
                    }`}
                >
                  Payment Out
                </button>
                <button
                  onClick={() => onSelectNav({ module: "purchases", subModule: "purchase_returns" })}
                  className={`w-full text-left px-2.5 py-1 text-[13px] rounded-md transition-colors ${currentNav.module === "purchases" && currentNav.subModule === "purchase_returns"
                      ? "text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/60 dark:bg-blue-950/40"
                      : "text-slate-600 dark:text-slate-400 font-normal hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/60"
                    }`}
                >
                  Purchase Returns
                </button>
                <button
                  onClick={() => onSelectNav({ module: "purchases", subModule: "debit_notes" })}
                  className={`w-full text-left px-2.5 py-1 text-[13px] rounded-md transition-colors ${currentNav.module === "purchases" && currentNav.subModule === "debit_notes"
                      ? "text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/60 dark:bg-blue-950/40"
                      : "text-slate-600 dark:text-slate-400 font-normal hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/60"
                    }`}
                >
                  Debit Notes
                </button>
                <button
                  onClick={() => onSelectNav({ module: "purchases", subModule: "reorder" })}
                  className={`w-full text-left px-2.5 py-1 text-[13px] rounded-md transition-colors ${currentNav.module === "purchases" && currentNav.subModule === "reorder"
                      ? "text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/60 dark:bg-blue-950/40"
                      : "text-slate-600 dark:text-slate-400 font-normal hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/60"
                    }`}
                >
                  Reorder Suggestions
                </button>
              </div>
            )}
          </div>
        )}

        {/* Banking / Bank Accounts */}
        {isModuleAllowed("banking") && (
          <div
            className={isCollapsed ? "w-full flex justify-center mb-1" : "px-2 mb-1"}
            onMouseEnter={(e) => handleItemMouseEnter(e, "banking", "Banking", <Landmark className="h-4 w-4" />)}
            onMouseLeave={handleItemMouseLeave}
          >
            <button
              onClick={() => {
                setOpenSection(null)
                onSelectNav({ module: "banking" })
                setActiveFlyout(null)
              }}
              title={isCollapsed ? undefined : "Banking"}
              className={`flex items-center transition-colors ${isCollapsed
                  ? `w-10 h-10 justify-center rounded-lg ${currentNav.module === "banking" || currentNav.module === "bank_accounts"
                    ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  }`
                  : `w-full gap-2.5 px-3 py-1.5 text-[13px] rounded-md ${currentNav.module === "banking" || currentNav.module === "bank_accounts"
                    ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold"
                    : "text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`
                }`}
            >
              <Landmark className={isCollapsed ? "h-5 w-5 shrink-0" : "h-4 w-4 shrink-0"} />
              {!isCollapsed && <span>Banking</span>}
            </button>
          </div>
        )}

        {/* E-Way Bills */}
        {isModuleAllowed("eway") && (
          <div
            className={isCollapsed ? "w-full flex justify-center mb-1" : "px-2 mb-1"}
            onMouseEnter={(e) => handleItemMouseEnter(e, "eway", "E-Way Bills", <Truck className="h-4 w-4" />)}
            onMouseLeave={handleItemMouseLeave}
          >
            <button
              onClick={() => {
                setOpenSection(null)
                onSelectNav({ module: "eway" })
                setActiveFlyout(null)
              }}
              title={isCollapsed ? undefined : "E-Way Bills"}
              className={`flex items-center transition-colors ${isCollapsed
                  ? `w-10 h-10 justify-center rounded-lg ${currentNav.module === "eway"
                    ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  }`
                  : `w-full gap-2.5 px-3 py-1.5 text-[13px] rounded-md ${currentNav.module === "eway"
                    ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold"
                    : "text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`
                }`}
            >
              <Truck className={isCollapsed ? "h-5 w-5 shrink-0" : "h-4 w-4 shrink-0"} />
              {!isCollapsed && <span>E-Way Bills</span>}
            </button>
          </div>
        )}

        {/* E-Invoices */}
        {isModuleAllowed("einvoice") && (
          <div
            className={isCollapsed ? "w-full flex justify-center mb-1" : "px-2 mb-1"}
            onMouseEnter={(e) => handleItemMouseEnter(e, "einvoice", "E-Invoices", <QrCode className="h-4 w-4" />)}
            onMouseLeave={handleItemMouseLeave}
          >
            <button
              onClick={() => {
                setOpenSection(null)
                onSelectNav({ module: "einvoice" })
                setActiveFlyout(null)
              }}
              title={isCollapsed ? undefined : "E-Invoices"}
              className={`flex items-center transition-colors ${isCollapsed
                  ? `w-10 h-10 justify-center rounded-lg ${currentNav.module === "einvoice"
                    ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  }`
                  : `w-full gap-2.5 px-3 py-1.5 text-[13px] rounded-md ${currentNav.module === "einvoice"
                    ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold"
                    : "text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`
                }`}
            >
              <QrCode className={isCollapsed ? "h-5 w-5 shrink-0" : "h-4 w-4 shrink-0"} />
              {!isCollapsed && <span>E-Invoices</span>}
            </button>
          </div>
        )}

        {/* 6. Reports */}
        {isModuleAllowed("reports") && (
          <div
            className={isCollapsed ? "w-full flex justify-center mb-1" : "px-2 mb-1"}
            onMouseEnter={(e) => handleItemMouseEnter(e, "reports", "Reports", <BarChart2 className="h-4 w-4" />)}
            onMouseLeave={handleItemMouseLeave}
          >
            <button
              onClick={() => {
                setOpenSection(null)
                onSelectNav({ module: "reports" })
                setActiveFlyout(null)
              }}
              title={isCollapsed ? undefined : "Reports"}
              className={`flex items-center transition-colors ${isCollapsed
                  ? `w-10 h-10 justify-center rounded-lg ${currentNav.module === "reports"
                    ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  }`
                  : `w-full gap-2.5 px-3 py-1.5 text-[13px] rounded-md ${currentNav.module === "reports"
                    ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold"
                    : "text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`
                }`}
            >
              <BarChart2 className={isCollapsed ? "h-5 w-5 shrink-0" : "h-4 w-4 shrink-0"} />
              {!isCollapsed && <span>Reports</span>}
            </button>
          </div>
        )}

        {/* 7. GST and Taxes */}
        {isModuleAllowed("gst") && (
          <div
            className={isCollapsed ? "w-full flex justify-center mb-1" : "px-2 mb-1"}
            onMouseEnter={(e) => handleItemMouseEnter(e, "gst", "GST and Taxes", <FileCheck className="h-4 w-4" />)}
            onMouseLeave={handleItemMouseLeave}
          >
            <button
              onClick={() => {
                setOpenSection(null)
                onSelectNav({ module: "gst" })
                setActiveFlyout(null)
              }}
              title={isCollapsed ? undefined : "GST and Taxes"}
              className={`flex items-center transition-colors ${isCollapsed
                  ? `w-10 h-10 justify-center rounded-lg ${currentNav.module === "gst"
                    ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  }`
                  : `w-full gap-2.5 px-3 py-1.5 text-[13px] rounded-md ${currentNav.module === "gst"
                    ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold"
                    : "text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`
                }`}
            >
              <FileCheck className={isCollapsed ? "h-5 w-5 shrink-0" : "h-4 w-4 shrink-0"} />
              {!isCollapsed && <span>GST and Taxes</span>}
            </button>
          </div>
        )}

        {/* 8. Settings */}
        {isModuleAllowed("settings") && (
          <div
            className={isCollapsed ? "w-full flex justify-center mb-1" : "px-2 mb-1"}
            onMouseEnter={(e) => handleItemMouseEnter(e, "settings", "Settings", <Settings className="h-4 w-4" />)}
            onMouseLeave={handleItemMouseLeave}
          >
            <button
              onClick={() => {
                setOpenSection(null)
                onSelectNav({ module: "settings" })
                setActiveFlyout(null)
              }}
              title={isCollapsed ? undefined : "Settings"}
              className={`flex items-center transition-colors ${isCollapsed
                  ? `w-10 h-10 justify-center rounded-lg ${currentNav.module === "settings"
                    ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  }`
                  : `w-full gap-2.5 px-3 py-1.5 text-[13px] rounded-md ${currentNav.module === "settings"
                    ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold"
                    : "text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`
                }`}
            >
              <Settings className={isCollapsed ? "h-5 w-5 shrink-0" : "h-4 w-4 shrink-0"} />
              {!isCollapsed && <span>Settings</span>}
            </button>
          </div>
        )}

      </div>

      {/* Floating Collapsible Flyout Sub-menu (Rendered via Portal to escape all overflow clipping) */}
      {mounted && isCollapsed && activeFlyout && createPortal(
        <div
          style={{
            position: "fixed",
            top: `${Math.max(8, Math.min(activeFlyout.rect.top - 4, window.innerHeight - (activeFlyout.hasSubItems ? 360 : 44) - 12))}px`,
            left: `${activeFlyout.rect.right + 8}px`,
            zIndex: 99999,
          }}
          onMouseEnter={handleFlyoutMouseEnter}
          onMouseLeave={handleFlyoutMouseLeave}
          className="before:absolute before:-left-3 before:top-0 before:bottom-0 before:w-3 before:content-[''] animate-in fade-in-0 zoom-in-95 duration-100"
        >
          {activeFlyout.hasSubItems ? (
            <div className="w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden py-1.5 flex flex-col">
              {/* Flyout Header */}
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-slate-50/70 dark:bg-slate-800/40">
                <div className="text-blue-600 dark:text-blue-400 shrink-0">
                  {activeFlyout.icon}
                </div>
                <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                  {activeFlyout.title}
                </span>
              </div>

              {/* Options List */}
              <div className="py-1 px-1 max-h-[calc(100vh-120px)] overflow-y-auto space-y-0.5">
                {activeFlyout.items.map((item) => (
                  <button
                    key={`${item.module}-${item.subModule || "all"}`}
                    type="button"
                    onClick={() => {
                      onSelectNav({ module: item.module, subModule: item.subModule })
                      setActiveFlyout(null)
                    }}
                    className={cn(
                      "w-full text-left px-2.5 py-1.5 text-xs rounded-lg transition-colors flex items-center justify-between cursor-pointer",
                      item.isActive
                        ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white font-medium"
                    )}
                  >
                    <span className="truncate">{item.label}</span>
                    {item.isActive && (
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0 ml-1.5" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Single Item Tooltip Badge */
            <div className="px-2.5 py-1.5 text-xs font-semibold bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 rounded-md shadow-lg pointer-events-none whitespace-nowrap flex items-center gap-1.5 border border-slate-700/50">
              <span>{activeFlyout.title}</span>
            </div>
          )}
        </div>,
        document.body
      )}
    </aside>
  )
}
