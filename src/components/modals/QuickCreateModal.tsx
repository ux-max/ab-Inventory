"use client"

import React from "react"
import { useApp } from "@/context/AppContext"
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { 
  Receipt, 
  PackagePlus, 
  ArrowLeftRight, 
  SlidersHorizontal, 
  UserPlus, 
  Factory,
  ChevronRight,
  FileSpreadsheet
} from "lucide-react"

interface QuickCreateModalProps {
  onAction: (actionKey: string) => void
}

export function QuickCreateModal({ onAction }: QuickCreateModalProps) {
  const { isQuickCreateOpen, setIsQuickCreateOpen, business, currentRole } = useApp()

  if (!isQuickCreateOpen) return null

  const actions = [
    {
      key: "new_invoice",
      title: "New Sales Invoice",
      description: "Fast counter or credit billing with GST, UPI QR & WhatsApp share",
      icon: Receipt,
      iconColor: "text-blue-600 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-400",
      roles: ["owner", "sales", "accountant"]
    },
    {
      key: "new_quotation",
      title: "New Quotation / Estimate",
      description: "Create a formal price proposal with validity date for a prospective client",
      icon: FileSpreadsheet,
      iconColor: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-400",
      roles: ["owner", "sales"]
    },
    {
      key: "new_proforma",
      title: "New Proforma Invoice",
      description: "Draft preliminary commercial bill to request advance payment",
      icon: Receipt,
      iconColor: "text-sky-600 bg-sky-50 dark:bg-sky-950/60 dark:text-sky-400",
      roles: ["owner", "sales", "accountant"]
    },
    {
      key: "new_item",
      title: "Add New Item / Product",
      description: "Define SKU, units, GST rate, opening stock & batch tracking",
      icon: PackagePlus,
      iconColor: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400",
      roles: ["owner", "store_keeper", "purchase", "production"]
    },
    {
      key: "new_transfer",
      title: "Inter-Godown Stock Transfer",
      description: "Move inventory between warehouses with immediate ledger update",
      icon: ArrowLeftRight,
      iconColor: "text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-400",
      roles: ["owner", "store_keeper"]
    },
    {
      key: "new_adjustment",
      title: "Reasoned Stock Adjustment",
      description: "Correct quantities with auditable reason (damaged, expired, audit gap)",
      icon: SlidersHorizontal,
      iconColor: "text-rose-600 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-400",
      roles: ["owner", "store_keeper", "production"]
    },
    {
      key: "new_party",
      title: "Add Customer or Supplier",
      description: "Record phone, GSTIN, place of supply state, and credit limit",
      icon: UserPlus,
      iconColor: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-400",
      roles: ["owner", "sales", "purchase"]
    },
    {
      key: "new_manufacture",
      title: "Record BOM Production",
      description: "Assemble finished goods and atomically consume raw materials",
      icon: Factory,
      iconColor: "text-purple-600 bg-purple-50 dark:bg-purple-950/60 dark:text-purple-400",
      condition: business.enableManufacturing,
      roles: ["owner", "production"]
    }
  ]

  const permittedActions = actions.filter(a => {
    if (a.condition !== undefined && !a.condition) return false
    return a.roles.includes(currentRole)
  })

  return (
    <Dialog open={isQuickCreateOpen} onOpenChange={setIsQuickCreateOpen} className="max-w-xl">
      <DialogHeader>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-semibold">HOM-05</Badge>
          <DialogTitle className="text-base font-bold">Quick Create</DialogTitle>
        </div>
        <DialogDescription>
          Select an operational document or inventory entry to start.
        </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-1 gap-2.5 mt-3">
        {permittedActions.map(action => {
          const Icon = action.icon
          return (
            <button
              key={action.key}
              onClick={() => {
                setIsQuickCreateOpen(false)
                onAction(action.key)
              }}
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-blue-400 dark:hover:border-blue-600 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${action.iconColor}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {action.title}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {action.description}
                  </div>
                </div>
              </div>

              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
            </button>
          )
        })}
      </div>
    </Dialog>
  )
}
